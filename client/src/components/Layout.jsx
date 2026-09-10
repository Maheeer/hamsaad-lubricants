import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import NotificationBell from './NotificationBell';
import AccountMenu from './AccountMenu';

const Layout = ({ children, menuItems, extraTopbar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const overlayRef = useRef(null);

  // Detect mobile breakpoint
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
        setMobileOpen(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  const roleColors = {
    admin:       '#1F3864',
    manager:     '#2E75B6',
    storekeeper: '#1E7E34',
    cashier:     '#E67E22',
  };
  const roleColor = roleColors[user?.role] || '#1F3864';

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  /* ─── Sidebar content (shared between desktop & mobile) ─── */
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div style={styles.sidebarHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.sidebarLogo}>HL</div>
          {(sidebarOpen || isMobile) && (
            <div>
              <div style={styles.sidebarTitle}>HAMSAAD</div>
              <div style={styles.sidebarSubtitle}>LUBRICANTS</div>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn} aria-label="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} style={styles.toggleBtn} aria-label="Close menu">
            ✕
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            style={{
              ...styles.navItem,
              background: location.pathname === item.path
                ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {(sidebarOpen || isMobile) && <span style={styles.navLabel}>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User info */}
      {(sidebarOpen || isMobile) && (
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user?.full_name}</div>
          <div style={styles.userRole}>{user?.role?.toUpperCase()}</div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      )}
      {!sidebarOpen && !isMobile && (
        <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <button
            onClick={handleLogout}
            style={{ ...styles.logoutBtn, width: '40px', padding: '8px 0', textAlign: 'center' }}
            title="Sign Out"
          >
            ↩
          </button>
        </div>
      )}
    </>
  );

  return (
    <div style={styles.wrapper}>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      {isMobile && mobileOpen && (
        <div
          ref={overlayRef}
          onClick={() => setMobileOpen(false)}
          style={styles.overlay}
          aria-label="Close menu overlay"
        />
      )}

      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      {!isMobile && (
        <div style={{
          ...styles.sidebar,
          width: sidebarOpen ? '240px' : '60px',
          background: roleColor,
        }}>
          <SidebarContent />
        </div>
      )}

      {/* ── Mobile Drawer Sidebar ────────────────────────────── */}
      {isMobile && (
        <div style={{
          ...styles.mobileSidebar,
          background: roleColor,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}>
          <SidebarContent />
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <div style={styles.main}>

        {/* Top bar */}
        <div style={{ ...styles.topbar, borderBottom: `3px solid ${roleColor}` }}>
          <div style={styles.topbarLeft}>
            {/* Mobile hamburger */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{ ...styles.hamburger, background: roleColor }}
                aria-label="Open menu"
              >
                ☰
              </button>
            )}
            <span style={{ ...styles.roleTag, background: roleColor }}>
              {user?.role?.toUpperCase()}
            </span>
            <span style={styles.pageName}>
              {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>

          <div style={styles.topbarRight}>
            {user?.role === 'admin' && (
              <>
                <div style={{
                  background: roleColor,
                  borderRadius: '8px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <NotificationBell />
                </div>
                <AccountMenu />
              </>
            )}

            {user?.role !== 'admin' && (
              <>
                {extraTopbar && extraTopbar}
                <span style={styles.topbarUser}>{user?.full_name}</span>
                {!sidebarOpen && !isMobile && (
                  <button
                    onClick={handleLogout}
                    className="btn-danger"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Logout
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 200,
  },
  /* Desktop sidebar */
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    flexShrink: 0,
    zIndex: 100,
  },
  /* Mobile drawer */
  mobileSidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100%',
    width: '260px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 300,
    transition: 'transform 0.3s ease',
    overflowY: 'auto',
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  sidebarLogo: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
    flexShrink: 0,
  },
  sidebarTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
    letterSpacing: '1px',
    lineHeight: 1.2,
  },
  sidebarSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: '10px',
    letterSpacing: '2px',
    marginTop: '1px',
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 8px',
    cursor: 'pointer',
    fontSize: '11px',
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    padding: '12px 0',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    color: '#fff',
    border: 'none',
    borderRadius: '0',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  navIcon: {
    fontSize: '16px',
    minWidth: '20px',
    textAlign: 'center',
  },
  navLabel: {
    whiteSpace: 'nowrap',
  },
  userInfo: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  userName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '13px',
    marginBottom: '2px',
  },
  userRole: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '11px',
    marginBottom: '10px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    width: '100%',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    flexShrink: 0,
    gap: '8px',
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  hamburger: {
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '16px',
    flexShrink: 0,
  },
  roleTag: {
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 7px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  pageName: {
    fontWeight: '600',
    color: '#1F3864',
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  topbarUser: {
    color: '#666',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '120px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '16px',
    WebkitOverflowScrolling: 'touch',
  },
};

export default Layout;
