import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import NotificationBell from './NotificationBell';
import AccountMenu from './AccountMenu';

/* ─── safe-area helpers for iPhone notch / home bar ─────────── */
const safeTop    = 'env(safe-area-inset-top,    0px)';
const safeBottom = 'env(safe-area-inset-bottom, 0px)';
const safeLeft   = 'env(safe-area-inset-left,   0px)';

const Layout = ({ children, menuItems, extraTopbar }) => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  /* 0 = unknown, 1 = mobile (<768), 2 = desktop */
  const [bp, setBp]         = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  const isMobile = bp === 1;

  const measureBp = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setBp(mobile ? 1 : 2);
    if (!mobile) {
      setSidebarOpen(true);
      setDrawerOpen(false);
    }
  }, []);

  useEffect(() => {
    measureBp();
    window.addEventListener('resize', measureBp);
    return () => window.removeEventListener('resize', measureBp);
  }, [measureBp]);

  /* Close drawer on route change */
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [location.pathname, isMobile]);

  const roleColors = {
    admin:       '#1F3864',
    manager:     '#2E75B6',
    storekeeper: '#1E7E34',
    cashier:     '#E67E22',
  };
  const rc = roleColors[user?.role] || '#1F3864';

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  const go = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  /* ── shared sidebar innards ─────────────────────────────────── */
  const SidebarInner = ({ forceExpanded = false }) => {
    const expanded = forceExpanded || sidebarOpen;
    return (
      <>
        {/* Brand header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `calc(${safeTop} + 14px) 16px 14px`,
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff', fontWeight: 800, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>HL</div>
            {expanded && (
              <div>
                <div style={{ color:'#fff', fontWeight:700, fontSize:13, letterSpacing:1 }}>HAMSAAD</div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontWeight:600, fontSize:9, letterSpacing:2 }}>LUBRICANTS</div>
              </div>
            )}
          </div>
          {/* Desktop collapse / mobile close */}
          {!isMobile ? (
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={btnStyle}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          ) : (
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ ...btnStyle, padding: '8px 10px', fontSize: 16 }}
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:'8px 0', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
          {menuItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  width:'100%', padding: isMobile ? '14px 18px' : '12px 16px',
                  color:'#fff', border:'none', borderRadius:0,
                  cursor:'pointer', fontSize:13, textAlign:'left',
                  background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderLeft: active ? '4px solid rgba(255,255,255,0.8)' : '4px solid transparent',
                  transition:'background 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize:18, minWidth:22, textAlign:'center', flexShrink:0 }}>
                  {item.icon}
                </span>
                {expanded && (
                  <span style={{ whiteSpace:'nowrap', fontWeight: active ? 700 : 400 }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        {expanded && (
          <div style={{
            padding: `14px 16px calc(${safeBottom} + 14px)`,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}>
            <div style={{ color:'#fff', fontWeight:600, fontSize:13, marginBottom:2 }}>{user?.full_name}</div>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, marginBottom:12 }}>
              {user?.role?.toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background:'rgba(255,255,255,0.15)', color:'#fff', border:'none',
                borderRadius:8, padding:'10px 14px', cursor:'pointer',
                fontSize:13, fontWeight:600, width:'100%',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              Sign Out
            </button>
          </div>
        )}
        {!expanded && !isMobile && (
          <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                background:'rgba(255,255,255,0.15)', color:'#fff', border:'none',
                borderRadius:8, padding:'10px', cursor:'pointer',
                fontSize:14, width:'100%', display:'flex',
                alignItems:'center', justifyContent:'center',
              }}
            >↩</button>
          </div>
        )}
      </>
    );
  };

  /* ── top bar height — accounts for safe-area on iPhone ──────── */
  const TOPBAR_H = 56;

  return (
    /* Full-screen container. Use dvh so iPhone bottom bar is handled */
    <div style={{
      display:'flex', height:'100dvh', overflow:'hidden', position:'relative',
      background:'#F5F5F5',
    }}>

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      {!isMobile && (
        <div style={{
          display:'flex', flexDirection:'column',
          width: sidebarOpen ? 240 : 60,
          background: rc, flexShrink:0,
          transition:'width 0.25s ease', overflow:'hidden', zIndex:100,
        }}>
          <SidebarInner />
        </div>
      )}

      {/* ── Mobile drawer overlay ────────────────────────────────── */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.5)',
            zIndex:400, WebkitTapHighlightColor:'transparent',
          }}
        />
      )}

      {/* ── Mobile drawer panel ──────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position:'fixed', top:0, left:0, bottom:0,
          width: Math.min(280, window.innerWidth * 0.82),
          background: rc, zIndex:500,
          display:'flex', flexDirection:'column',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-105%)',
          transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: drawerOpen ? '6px 0 24px rgba(0,0,0,0.35)' : 'none',
          overflowY:'auto', WebkitOverflowScrolling:'touch',
          paddingLeft: safeLeft,
        }}>
          <SidebarInner forceExpanded />
        </div>
      )}

      {/* ── Main area ────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Top bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          height: TOPBAR_H,
          paddingTop: isMobile ? safeTop : 0,
          paddingLeft: 12, paddingRight: 12,
          background:'#fff',
          borderBottom: `3px solid ${rc}`,
          boxShadow:'0 1px 6px rgba(0,0,0,0.08)',
          flexShrink:0, gap:8, zIndex:50,
          boxSizing:'border-box',
        }}>

          {/* Left: hamburger + role tag + page name */}
          <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
            {isMobile && (
              <button
                onTouchEnd={(e) => { e.preventDefault(); setDrawerOpen(true); }}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
                style={{
                  width:44, height:44, flexShrink:0,
                  background: rc, color:'#fff',
                  border:'none', borderRadius:10,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:20, cursor:'pointer',
                  WebkitTapHighlightColor:'transparent',
                  touchAction:'manipulation',
                }}
              >
                ☰
              </button>
            )}
            <span style={{
              background: rc, color:'#fff',
              fontSize:10, fontWeight:700,
              padding:'3px 8px', borderRadius:4,
              letterSpacing:'0.5px', whiteSpace:'nowrap', flexShrink:0,
            }}>
              {user?.role?.toUpperCase()}
            </span>
            <span style={{
              fontWeight:600, color:'#1F3864', fontSize: isMobile ? 13 : 15,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>
              {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>

          {/* Right: bell + account or user name */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            {user?.role === 'admin' && (
              <>
                <div style={{
                  background: rc, borderRadius:8, padding:4,
                  display:'flex', alignItems:'center',
                }}>
                  <NotificationBell />
                </div>
                <AccountMenu />
              </>
            )}
            {user?.role !== 'admin' && (
              <>
                {extraTopbar && extraTopbar}
                {!isMobile && (
                  <span style={{ color:'#666', fontSize:12, whiteSpace:'nowrap', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>
                    {user?.full_name}
                  </span>
                )}
                {!sidebarOpen && !isMobile && (
                  <button
                    onClick={handleLogout}
                    className="btn-danger"
                    style={{ padding:'6px 12px', fontSize:12 }}
                  >
                    Logout
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Scrollable page content */}
        <div style={{
          flex:1, overflowY:'auto', overflowX:'hidden',
          WebkitOverflowScrolling:'touch',
          padding: isMobile ? '12px 12px calc(12px + env(safe-area-inset-bottom, 0px))' : '20px 24px',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const btnStyle = {
  background:'rgba(255,255,255,0.18)', color:'#fff',
  border:'none', borderRadius:6,
  padding:'6px 9px', cursor:'pointer',
  fontSize:11, flexShrink:0,
  WebkitTapHighlightColor:'transparent',
};

export default Layout;
