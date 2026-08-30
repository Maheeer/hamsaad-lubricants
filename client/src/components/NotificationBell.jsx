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
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const getSeenIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
  catch { return new Set(); }
};

const saveSeenIds = (ids) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...ids])); }
  catch {}
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds]             = useState(getSeenIds);
  const [open, setOpen]                   = useState(false);
  const dropdownRef                       = useRef(null);
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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all as seen when dropdown opens
  useEffect(() => {
    if (open && notifications.length > 0) {
      const updated = new Set([...seenIds, ...notifications.map(n => n.id)]);
      setSeenIds(updated);
      saveSeenIds(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>

      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '6px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Notifications"
      >
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unseenCount > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '0px',
            background: '#ef4444', color: '#fff',
            fontSize: '10px', fontWeight: '700',
            minWidth: '18px', height: '18px', borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid #1F3864',
          }}>
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '42px', right: '0',
          width: '360px', background: '#fff', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #e5eaf3', zIndex: 9999, overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #f0f3f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fafbff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔔</span>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a1f36' }}>
                Notifications
              </span>
              {unseenCount > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff',
                  fontSize: '11px', fontWeight: '700',
                  padding: '1px 7px', borderRadius: '10px',
                }}>
                  {unseenCount} new
                </span>
              )}
            </div>
            <button
              onClick={fetchNotifications}
              style={{
                background: 'none', border: 'none',
                fontSize: '13px', color: '#6b7280', cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                  No pending notifications
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = TYPE_COLORS[n.type] || { bg: '#f3f4f6', color: '#6b7280' };
                const isNew = !seenIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '12px 16px', borderBottom: '1px solid #f9fafb',
                      cursor: 'pointer', display: 'flex', gap: '12px',
                      alignItems: 'flex-start',
                      background: isNew ? '#fafbff' : 'transparent',
                      borderLeft: isNew ? '3px solid #2E75B6' : '3px solid transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = isNew ? '#fafbff' : 'transparent'}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: style.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                    }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1a1f36' }}>
                          {n.title}
                        </p>
                        {isNew && (
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#2E75B6', flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <p style={{
                        margin: '0 0 4px', fontSize: '12px', color: '#6b7280',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {n.message}
                      </p>
                      <span style={{
                        fontSize: '11px', color: style.color, fontWeight: '600',
                        background: style.bg, padding: '1px 6px', borderRadius: '4px',
                      }}>
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid #f0f3f9',
            background: '#fafbff', textAlign: 'center',
          }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              Auto-refreshes every 30 seconds
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
