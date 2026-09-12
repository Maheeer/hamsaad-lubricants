import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const SEEN_KEY = 'hamsaad_seen_notifications';

const TYPE_COLORS = {
  pending_order:    { bg: '#dbeafe', color: '#1d4ed8' },
  payment_approval: { bg: '#fef9c3', color: '#a16207' },
  complaint:        { bg: '#fee2e2', color: '#dc2626' },
  stock_added:      { bg: '#dcfce7', color: '#15803d' },
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const getSeenIds  = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); } };
const saveSeenIds = (ids) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...ids])); } catch {} };

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds]             = useState(getSeenIds);
  const [open, setOpen]                   = useState(false);
  const panelRef                          = useRef(null);
  const bellRef                           = useRef(null);
  const navigate                          = useNavigate();

  const unseenCount = notifications.filter(n => !seenIds.has(n.id)).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  /* Mark all seen when panel opens */
  useEffect(() => {
    if (open && notifications.length > 0) {
      const updated = new Set([...seenIds, ...notifications.map(n => n.id)]);
      setSeenIds(updated);
      saveSeenIds(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Close on outside tap/click */
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        bellRef.current   && !bellRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown',  handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown',  handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleItemClick = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  /* ── Panel — full-screen sheet on mobile, dropdown on desktop ── */
  const isMobileView = window.innerWidth < 600;

  return (
    <>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        style={{
          position:'relative', background:'none', border:'none',
          cursor:'pointer', padding:6, borderRadius:8,
          display:'flex', alignItems:'center', justifyContent:'center',
          WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
        }}
      >
        <span style={{ fontSize:22 }}>🔔</span>
        {unseenCount > 0 && (
          <span style={{
            position:'absolute', top:0, right:0,
            background:'#ef4444', color:'#fff',
            fontSize:10, fontWeight:700,
            minWidth:18, height:18, borderRadius:9,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'0 3px', border:'2px solid #1F3864',
          }}>
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Mobile full-screen overlay */}
          {isMobileView && (
            <div
              onClick={() => setOpen(false)}
              style={{
                position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000,
              }}
            />
          )}

          <div
            ref={panelRef}
            style={isMobileView ? {
              /* Mobile: bottom sheet */
              position:'fixed',
              left:0, right:0, bottom:0,
              maxHeight:'75vh',
              background:'#fff',
              borderRadius:'16px 16px 0 0',
              boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',
              zIndex:1001,
              display:'flex', flexDirection:'column',
              overflow:'hidden',
              paddingBottom:'env(safe-area-inset-bottom, 0px)',
            } : {
              /* Desktop: right-aligned dropdown, constrained to viewport */
              position:'absolute',
              top:42, right:0,
              width: Math.min(360, window.innerWidth - 24),
              maxHeight:'70vh',
              background:'#fff',
              borderRadius:12,
              boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
              border:'1px solid #e5eaf3',
              zIndex:9999,
              display:'flex', flexDirection:'column',
              overflow:'hidden',
            }}
          >
            {/* Handle bar (mobile only) */}
            {isMobileView && (
              <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
                <div style={{ width:36, height:4, borderRadius:2, background:'#d1d5db' }} />
              </div>
            )}

            {/* Header */}
            <div style={{
              padding:'14px 16px', borderBottom:'1px solid #f0f3f9',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              background:'#fafbff', flexShrink:0,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>🔔</span>
                <span style={{ fontWeight:700, fontSize:14, color:'#1a1f36' }}>Notifications</span>
                {unseenCount > 0 && (
                  <span style={{
                    background:'#ef4444', color:'#fff',
                    fontSize:11, fontWeight:700,
                    padding:'1px 7px', borderRadius:10,
                  }}>
                    {unseenCount} new
                  </span>
                )}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button
                  onClick={fetchNotifications}
                  style={{ background:'none', border:'none', fontSize:13, color:'#6b7280', cursor:'pointer', padding:'4px 6px' }}
                >
                  ↻ Refresh
                </button>
                {isMobileView && (
                  <button
                    onClick={() => setOpen(false)}
                    style={{
                      background:'#f3f4f6', border:'none', borderRadius:6,
                      padding:'4px 8px', fontSize:14, cursor:'pointer', color:'#374151',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY:'auto', flex:1, WebkitOverflowScrolling:'touch' }}>
              {notifications.length === 0 ? (
                <div style={{ padding:'48px 20px', textAlign:'center', color:'#9ca3af' }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                  <p style={{ margin:0, fontSize:13, fontWeight:500 }}>No pending notifications</p>
                </div>
              ) : (
                notifications.map(n => {
                  const style = TYPE_COLORS[n.type] || { bg:'#f3f4f6', color:'#6b7280' };
                  const isNew = !seenIds.has(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      style={{
                        padding: isMobileView ? '14px 16px' : '12px 16px',
                        borderBottom:'1px solid #f9fafb',
                        cursor:'pointer', display:'flex', gap:12,
                        alignItems:'flex-start',
                        background: isNew ? '#fafbff' : 'transparent',
                        borderLeft: isNew ? '3px solid #2E75B6' : '3px solid transparent',
                        WebkitTapHighlightColor:'transparent',
                      }}
                    >
                      <div style={{
                        width:38, height:38, borderRadius:8,
                        background:style.bg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:18, flexShrink:0,
                      }}>
                        {n.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#1a1f36' }}>{n.title}</p>
                          {isNew && <span style={{ width:7, height:7, borderRadius:'50%', background:'#2E75B6', flexShrink:0 }} />}
                        </div>
                        <p style={{ margin:'0 0 5px', fontSize:12, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize:11, color:style.color, fontWeight:600, background:style.bg, padding:'2px 6px', borderRadius:4 }}>
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'10px 16px', borderTop:'1px solid #f0f3f9', background:'#fafbff', textAlign:'center', flexShrink:0 }}>
              <span style={{ fontSize:11, color:'#9ca3af' }}>Auto-refreshes every 30 seconds</span>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NotificationBell;
