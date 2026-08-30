import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import NotificationBell from './NotificationBell';
import AccountMenu from './AccountMenu';

const Layout = ({ children, menuItems, extraTopbar}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <div style={styles.wrapper}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div style={{
        ...styles.sidebar,
        width:      sidebarOpen ? '240px' : '60px',
        background: roleColor,
      }}>

        {/* Header */}
        <div style={styles.sidebarHeader}>
          {sidebarOpen && (
            <div>
              <div style={styles.sidebarLogo}>HL</div>
              <div style={styles.sidebarTitle}>HAMSAAD</div>
              <div style={styles.sidebarSubtitle}>LUBRICANTS</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.toggleBtn}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Menu Items */}
        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                background: location.pathname === item.path
                  ? 'rgba(255,255,255,0.2)' : 'transparent',
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info */}
        {sidebarOpen && (
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.full_name}</div>
            <div style={styles.userRole}>{user?.role?.toUpperCase()}</div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div style={styles.main}>

        {/* Top bar */}
        <div style={{ ...styles.topbar, borderBottom: `3px solid ${roleColor}` }}>
          <div style={styles.topbarLeft}>
            <span style={{ ...styles.roleTag, background: roleColor }}>
              {user?.role?.toUpperCase()}
            </span>
            <span style={styles.pageName}>
              {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>

          <div style={styles.topbarRight}>
            {/* Notification bell — admin only */}
            {user?.role === 'admin' && (
              <>
                <div style={{
                  background:   roleColor,
                  borderRadius: '8px',
                  padding:      '4px',
                  display:      'flex',
                  alignItems:   'center',
                }}>
                  <NotificationBell />
                </div>
                <AccountMenu />
              </>
            )}

            {/* For non-admin roles show name and logout */}
            {user?.role !== 'admin' && (
            <>
              {extraTopbar && extraTopbar}
              <span style={styles.topbarUser}>{user?.full_name}</span>
                          {!sidebarOpen && (
                  <button
                    onClick={() => { logout(); navigate('/login'); toast.success('Logged out.'); }}
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
    display:  'flex',
    height:   '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    display:        'flex',
    flexDirection:  'column',
    transition:     'width 0.3s ease',
    overflow:       'hidden',
    flexShrink:     0,
  },
  sidebarHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '16px',
    borderBottom:   '1px solid rgba(255,255,255,0.2)',
  },
  sidebarLogo: {
    width:          '36px',
    height:         '36px',
    borderRadius:   '50%',
    background:     'rgba(255,255,255,0.2)',
    color:          '#fff',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     '700',
    fontSize:       '14px',
    marginBottom:   '4px',
  },
  sidebarTitle: {
    color:        '#fff',
    fontWeight:   '700',
    fontSize:     '14px',
    letterSpacing: '1px',
  },
  sidebarSubtitle: {
    color:        'rgba(255,255,255,0.7)',
    fontWeight:   '600',
    fontSize:     '10px',
    letterSpacing: '2px',
    marginTop:    '1px',
  },
  toggleBtn: {
    background:   'rgba(255,255,255,0.2)',
    color:        '#fff',
    border:       'none',
    borderRadius: '6px',
    padding:      '6px 8px',
    cursor:       'pointer',
    fontSize:     '11px',
  },
  nav: {
    flex:      1,
    padding:   '12px 0',
    overflowY: 'auto',
  },
  navItem: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    width:      '100%',
    padding:    '12px 16px',
    color:      '#fff',
    border:     'none',
    borderRadius: '0',
    cursor:     'pointer',
    fontSize:   '13px',
    textAlign:  'left',
    transition: 'background 0.2s',
  },
  navIcon: {
    fontSize:  '16px',
    minWidth:  '20px',
    textAlign: 'center',
  },
  navLabel: {
    whiteSpace: 'nowrap',
  },
  userInfo: {
    padding:     '16px',
    borderTop:   '1px solid rgba(255,255,255,0.2)',
  },
  userName: {
    color:        '#fff',
    fontWeight:   '600',
    fontSize:     '13px',
    marginBottom: '2px',
  },
  userRole: {
    color:        'rgba(255,255,255,0.7)',
    fontSize:     '11px',
    marginBottom: '10px',
  },
  logoutBtn: {
    background:   'rgba(255,255,255,0.2)',
    color:        '#fff',
    border:       'none',
    borderRadius: '6px',
    padding:      '8px 12px',
    cursor:       'pointer',
    fontSize:     '12px',
    width:        '100%',
  },
  main: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
  },
  topbar: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '12px 24px',
    background:     '#fff',
    boxShadow:      '0 2px 4px rgba(0,0,0,0.08)',
  },
  topbarLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  roleTag: {
    color:         '#fff',
    fontSize:      '11px',
    fontWeight:    '700',
    padding:       '3px 8px',
    borderRadius:  '4px',
    letterSpacing: '1px',
  },
  pageName: {
    fontWeight: '600',
    color:      '#1F3864',
    fontSize:   '15px',
  },
  topbarRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  topbarUser: {
    color:    '#666',
    fontSize: '13px',
  },
  content: {
    flex:      1,
    overflowY: 'auto',
    padding:   '24px',
  },
};

export default Layout;
