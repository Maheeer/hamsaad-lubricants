import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import {
  getAllProducts,
  getAllOrders,
  getOrderById,
  confirmGoodsReleased,
  uploadSignedWaybill,
} from '../../utils/api';
import DocumentViewerModal from '../../components/DocumentViewerModal';

const menuItems = [
  { path: '/storekeeper',         label: 'Dashboard',     icon: '📊' },
  { path: '/storekeeper/orders',  label: 'Release Goods', icon: '🚚' },
  { path: '/storekeeper/profile', label: 'My Profile',    icon: '👤' },
];

const formatNGN  = (v) => 'NGN ' + parseFloat(v || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 });
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getStatusStyle = (status) => {
  if (status === 'confirmed') return { bg: '#fef9c3', color: '#a16207', label: 'Awaiting Release' };
  if (status === 'released')  return { bg: '#e0f2fe', color: '#0369a1', label: 'Awaiting Waybill' };
  if (status === 'completed') return { bg: '#dcfce7', color: '#15803d', label: 'Completed' };
  return { bg: '#f3f4f6', color: '#6b7280', label: status };
};

// ─── NOTIFICATION BELL ────────────────────────────────────────
const StorekeeperNotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('storekeeper_seen_notifications') || '[]'); } catch { return []; }
  });
  const dropRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/storekeeper-notifications');
      setNotifications(res.data.notifications || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !seen.includes(n.id)).length;

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) {
      const allIds = notifications.map(n => n.id);
      setSeen(allIds);
      localStorage.setItem('storekeeper_seen_notifications', JSON.stringify(allIds));
    }
  };

  const typeIcon = (type) => {
    if (type === 'confirmed_order')   return '📋';
    if (type === 'waybill_approved')  return '✅';
    if (type === 'waybill_rejected')  return '❌';
    if (type === 'goods_released')    return '🚚';
    if (type === 'low_stock')         return '⚠️';
    return '🔔';
  };

  const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t), now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1)    return 'Just now';
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{
        position: 'relative', background: 'rgba(255,255,255,0.15)',
        border: 'none', borderRadius: '8px', padding: '6px 10px',
        cursor: 'pointer', fontSize: '20px',
      }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#dc2626', color: '#fff', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '10px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '42px', right: 0, width: '360px',
          background: '#fff', borderRadius: '14px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid #e5eaf3',
          zIndex: 9999, maxHeight: '440px', overflowY: 'auto',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f3f9', background: '#fafbff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1F3864' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '1px 7px', borderRadius: '10px' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <button onClick={fetchNotifications} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>↻ Refresh</button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <p style={{ margin: 0, fontSize: '13px' }}>No new notifications</p>
            </div>
          ) : notifications.map(n => {
            const isNew = !seen.includes(n.id);
            return (
              <div key={n.id} style={{
                padding: '12px 16px', borderBottom: '1px solid #f9fafb',
                background: isNew ? '#fafbff' : '#fff',
                borderLeft: isNew ? '3px solid #2E75B6' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '12px', color: '#1a1f36' }}>{n.title}</p>
                      {n.urgent && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '8px' }}>URGENT</span>}
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>{n.message}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{formatTime(n.time || n.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid #f0f3f9', background: '#fafbff' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Auto-refreshes every 30 seconds</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, bg }) => (
  <div style={{
    background: '#fff', borderRadius: '14px', padding: '20px 22px',
    flex: 1, minWidth: '160px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    borderLeft: `4px solid ${color}`,
  }}>
    <div style={{ background: bg, borderRadius: '10px', padding: '8px 10px', fontSize: '20px', display: 'inline-block', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1f36' }}>{value}</div>
    <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginTop: '2px' }}>{label}</div>
    {sub && <div style={{ fontSize: '11px', color, fontWeight: '600', marginTop: '2px' }}>{sub}</div>}
  </div>
);

// ─── STOREKEEPER HOME ─────────────────────────────────────────
const StorekeeperHome = () => {
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [stockSearch, setStockSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, o] = await Promise.all([getAllProducts(), getAllOrders()]);
        setProducts(p.data.products || []);
        setOrders(o.data.orders || []);
      } catch { toast.error('Failed to load dashboard data.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: '#6b7280' }}>
      <div style={{ width: '28px', height: '28px', border: '3px solid #e5eaf3', borderTopColor: '#2E75B6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading...
    </div>
  );

  const today           = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const pendingRelease  = orders.filter(o => o.status === 'confirmed');
  const awaitingWaybill = orders.filter(o => o.status === 'released');
  const lowStock        = products.filter(p => p.quantity_in_stock <= p.minimum_threshold);
  const totalStockValue = products.reduce((s, p) => s + (parseFloat(p.selling_price || 0) * p.quantity_in_stock), 0);

  const filteredProducts = products.filter(p => {
    if (!stockSearch.trim()) return true;
    const q = stockSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.brand_name?.toLowerCase().includes(q);
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1a1f36' }}>Storekeeper Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{today}</p>
        </div>
        {(pendingRelease.length > 0 || awaitingWaybill.length > 0) && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>
              {pendingRelease.length + awaitingWaybill.length} order{(pendingRelease.length + awaitingWaybill.length) > 1 ? 's' : ''} need attention
            </span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard icon="🚚" label="Pending Release"     value={pendingRelease.length}  color="#a16207" bg="#fef9c3" sub={pendingRelease.length > 0 ? 'Action required' : 'All clear'} />
        <StatCard icon="📝" label="Awaiting Waybill"   value={awaitingWaybill.length} color="#0369a1" bg="#e0f2fe" sub={awaitingWaybill.length > 0 ? 'Upload signed copy' : ''} />
        <StatCard icon="📦" label="Total Products"     value={products.length}        color="#1F3864" bg="#e0f2fe" />
        <StatCard icon="⚠️" label="Low Stock Items"    value={lowStock.length}        color={lowStock.length > 0 ? '#dc2626' : '#15803d'} bg={lowStock.length > 0 ? '#fee2e2' : '#dcfce7'} sub={lowStock.length > 0 ? 'Needs restocking' : 'Stock levels OK'} />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Pending releases */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1a1f36' }}>⚡ Orders Requiring Action</h3>
          {pendingRelease.length === 0 && awaitingWaybill.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
              <p style={{ margin: 0, fontSize: '13px' }}>No pending actions</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...pendingRelease, ...awaitingWaybill].slice(0, 5).map(o => {
                const s = getStatusStyle(o.status);
                return (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fafbff', borderRadius: '10px', border: '1px solid #e5eaf3' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#1F3864' }}>{o.order_number}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{o.client_name} · {formatDate(o.created_at)}</p>
                    </div>
                    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1a1f36' }}>⚠️ Low Stock Items</h3>
          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
              <p style={{ margin: 0, fontSize: '13px' }}>All stock levels adequate</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lowStock.slice(0, 5).map(p => {
                const pct = Math.min(100, Math.round((p.quantity_in_stock / (p.minimum_threshold * 2)) * 100));
                return (
                  <div key={p.id} style={{ padding: '10px 14px', background: '#fff8f8', borderRadius: '10px', border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: '#1a1f36' }}>{p.name} ({p.size_variant})</span>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: '#dc2626' }}>{p.quantity_in_stock} {p.unit}</span>
                    </div>
                    <div style={{ background: '#fee2e2', borderRadius: '4px', height: '4px' }}>
                      <div style={{ background: '#dc2626', borderRadius: '4px', height: '4px', width: `${pct}%` }} />
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>Min threshold: {p.minimum_threshold}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      

      {/* Stock table */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1f36' }}>
            📦 Current Stock — {new Date().toLocaleDateString('en-GB')}
          </h3>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search product or brand..."
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #e5eaf3', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Product', 'Brand', 'Category', 'Size', 'Units Available', 'Status'].map(h => (
                  <th key={h} style={{ background: '#f8faff', color: '#4b5563', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e5eaf3' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>No products found.</td></tr>
              ) : filteredProducts.map(p => {
                const isLow = p.quantity_in_stock <= p.minimum_threshold;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f3f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#1a1f36' }}>{p.name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{p.brand_name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{p.category_name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{p.size_variant}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: isLow ? '#dc2626' : '#15803d', fontSize: '15px' }}>
                      {p.quantity_in_stock} {p.unit}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {isLow ? (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Low Stock</span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── RELEASE GOODS ────────────────────────────────────────────
const ReleaseGoods = () => {
  const [allOrders, setAllOrders]               = useState([]);
  const [orders, setOrders]                     = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedOrder, setSelectedOrder]       = useState(null);
  const [orderDetail, setOrderDetail]           = useState(null);
  const [signedFile, setSignedFile]             = useState(null);
  const [signedDeliveryFile, setSignedDeliveryFile] = useState(null);
  const [uploading, setUploading]               = useState(false);
  const [loadingDetail, setLoadingDetail]       = useState(false);
  const [filterStatus, setFilterStatus]         = useState('');
  const [searchQuery, setSearchQuery]           = useState('');
  const [docViewer, setDocViewer]               = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getAllOrders();
      const filtered = (res.data.orders || []).filter(o =>
        o.status === 'confirmed' || o.status === 'released' || o.status === 'completed'
      );
      setAllOrders(filtered);
    } catch { toast.error('Failed to load orders.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Apply filters + search
  useEffect(() => {
    let filtered = [...allOrders];
    if (filterStatus) filtered = filtered.filter(o => o.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        o.client_name?.toLowerCase().includes(q)
      );
    }
    setOrders(filtered);
  }, [allOrders, filterStatus, searchQuery]);

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setLoadingDetail(true);
    try {
      const res = await getOrderById(order.id);
      setOrderDetail(res.data || null);
    } catch { toast.error('Failed to load order details.'); }
    finally { setLoadingDetail(false); }
  };

  const handleRelease = async () => {
    try {
      await confirmGoodsReleased(selectedOrder.id);
      toast.success('Goods released. Stock has been updated.');
      handleViewOrder(selectedOrder);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to release goods.'); }
  };

  const handleUploadSigned = async () => {
    if (!signedFile && !signedDeliveryFile) {
      toast.error('Please select at least one file to upload.'); return;
    }
    setUploading(true);
    try {
      if (signedFile) {
        await uploadSignedWaybill(selectedOrder.id, signedFile);
      }
      if (signedDeliveryFile) {
        const formData = new FormData();
        formData.append('file', signedDeliveryFile);
        await API.post(`/orders/${selectedOrder.id}/upload-signed-delivery-note`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('Documents uploaded. Manager notified for approval.');
      setSignedFile(null);
      setSignedDeliveryFile(null);
      handleViewOrder(selectedOrder);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed.'); }
    finally { setUploading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: '#6b7280' }}>
      <div style={{ width: '28px', height: '28px', border: '3px solid #e5eaf3', borderTopColor: '#2E75B6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading orders...
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1a1f36' }}>Release Goods</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          {allOrders.length} order{allOrders.length !== 1 ? 's' : ''} in your queue
        </p>
      </div>

      {/* Search + Filter bar */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', border: '1px solid #e5eaf3', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#9ca3af' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by order number or client name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #d1d9e6', borderRadius: '8px', fontSize: '13px', color: '#1a1f36', outline: 'none', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px' }}>×</button>
          )}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #d1d9e6', borderRadius: '8px', fontSize: '13px', color: '#1a1f36', minWidth: '180px' }}>
          <option value="">All Orders</option>
          <option value="confirmed">Awaiting Release</option>
          <option value="released">Awaiting Waybill</option>
          <option value="completed">Completed</option>
        </select>
        {(searchQuery || filterStatus) && (
          <button onClick={() => { setSearchQuery(''); setFilterStatus(''); }} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d9e6', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer' }}>
            Clear
          </button>
        )}
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
          {orders.length} result{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Orders table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5eaf3', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['Order No.', 'Client', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} style={{ background: '#f8faff', color: '#4b5563', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '11px 14px', textAlign: 'left', borderBottom: '2px solid #e5eaf3', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚚</div>
                  <p style={{ margin: 0, fontWeight: '600' }}>No orders found</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    {searchQuery ? `No results for "${searchQuery}"` : 'No orders in your queue'}
                  </p>
                </td>
              </tr>
            ) : orders.map(o => {
              const s = getStatusStyle(o.status);
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #f0f3f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: '#2E75B6', fontFamily: 'monospace' }}>{o.order_number}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '600', color: '#1a1f36' }}>{o.client_name}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: '#15803d' }}>{formatNGN(o.total_amount)}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(o.created_at)}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => handleViewOrder(o)} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '7px', padding: '6px 14px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal doc={docViewer} onClose={() => setDocViewer(null)} />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '660px', borderRadius: '16px' }}>
            {/* Modal header */}
            <div style={{ background: '#1F3864', color: '#fff', padding: '18px 24px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '-24px -24px 20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Release Goods</h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.7 }}>{selectedOrder.order_number}</p>
              </div>
              <button onClick={() => { setSelectedOrder(null); setOrderDetail(null); setDocViewer(null); }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer' }}>×</button>
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading order details...</div>
            ) : orderDetail ? (
              <div>
                {/* Order summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  {[
                    { label: 'Client',    value: orderDetail.order?.client_name || '—' },
                    { label: 'Collector', value: orderDetail.waybill?.collector_name || 'Not specified' },
                    { label: 'Status',    value: <span style={{ background: getStatusStyle(orderDetail.order?.status).bg, color: getStatusStyle(orderDetail.order?.status).color, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{getStatusStyle(orderDetail.order?.status).label}</span> },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f8faff', borderRadius: '8px', padding: '10px 12px' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1a1f36' }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Documents from Manager */}
                {(orderDetail.waybill?.scanned_copy_url || orderDetail.waybill?.delivery_note_url) && orderDetail.order?.status !== 'completed' && (
                  <div style={{ background: '#e0f2fe', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 10px', fontWeight: '700', fontSize: '13px', color: '#0369a1' }}>📂 Documents from Manager</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {orderDetail.waybill?.scanned_copy_url && (
                        <button onClick={() => setDocViewer({ url: orderDetail.waybill.scanned_copy_url, title: 'Manager Signed Waybill' })}
                          style={{ background: '#fff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          📄 View Signed Waybill
                        </button>
                      )}
                      {orderDetail.waybill?.delivery_note_url && (
                        <button onClick={() => setDocViewer({ url: orderDetail.waybill.delivery_note_url, title: 'Manager Delivery Note' })}
                          style={{ background: '#fff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          📋 View Delivery Note
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Items to release */}
                <h4 style={{ margin: '0 0 10px', color: '#1F3864', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Items to Release</h4>
                <div style={{ border: '1px solid #e5eaf3', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8faff' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Product</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Brand</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Size</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Order Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(orderDetail.items || []).map(item => (
                        <tr key={item.id} style={{ borderTop: '1px solid #f0f3f9' }}>
                          <td style={{ padding: '9px 12px', fontWeight: '600', color: '#1a1f36' }}>{item.product_name}</td>
                          <td style={{ padding: '9px 12px', color: '#6b7280' }}>{item.brand_name}</td>
                          <td style={{ padding: '9px 12px', color: '#6b7280' }}>{item.size_variant}</td>
                          <td style={{ padding: '9px 12px', fontWeight: '700', color: '#1F3864' }}>{item.quantity} {item.unit}</td>
                          <td style={{ padding: '9px 12px', fontWeight: '700', color: item.quantity_in_stock <= item.minimum_threshold ? '#dc2626' : '#15803d' }}>
                            {item.quantity_in_stock} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action: Release Goods */}
                {orderDetail.order?.status === 'confirmed' && (
                  <div style={{ border: '2px solid #E67E22', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#fffbf0' }}>
                    <h4 style={{ color: '#E67E22', marginBottom: '8px', fontSize: '13px' }}>Confirm Goods Release</h4>
                    <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>
                      Confirm that the goods above have been physically released to the collector. Stock will be automatically deducted.
                    </p>
                    <button onClick={handleRelease} style={{ background: '#E67E22', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      🚚 Confirm Goods Released
                    </button>
                  </div>
                )}

                {/* Waybill rejection notice */}
                {orderDetail.waybill?.rejection_reason && orderDetail.order?.status === 'released' && !orderDetail.waybill?.signed_copy_url && (
                  <div style={{ background: '#fff3cd', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', border: '1px solid #ffc107' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '13px', color: '#856404' }}>⚠️ Waybill Rejected by Manager</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#856404' }}>{orderDetail.waybill.rejection_reason}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#856404' }}>Please upload the correct signed documents below.</p>
                  </div>
                )}

                {/* Upload Collector-Signed Documents */}
                {orderDetail.order?.status === 'released' && (
                  <div style={{ border: '2px solid #1F3864', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#f0f4ff' }}>
                    <h4 style={{ color: '#1F3864', marginBottom: '8px', fontSize: '13px' }}>Upload Collector-Signed Documents</h4>
                    <p style={{ color: '#666', fontSize: '12px', marginBottom: '14px', lineHeight: '1.5' }}>
                      After the collector has signed both documents, upload the signed copies below. The Manager will approve them.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Signed Waybill */}
                      <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', border: '1px solid #e5eaf3' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#1F3864', display: 'block', marginBottom: '6px' }}>
                          📄 Collector-Signed Waybill
                          {orderDetail.waybill?.signed_copy_url && <span style={{ marginLeft: '8px', color: '#15803d' }}>✅ Uploaded</span>}
                        </label>
                        {orderDetail.waybill?.signed_copy_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => setDocViewer({ url: orderDetail.waybill.signed_copy_url, title: 'Collector-Signed Waybill' })}
                              style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
                              👁 View
                            </button>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Replace:</span>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setSignedFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                          </div>
                        ) : (
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setSignedFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                        )}
                      </div>

                      {/* Signed Delivery Note */}
                      <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', border: '1px solid #e5eaf3' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#1F3864', display: 'block', marginBottom: '6px' }}>
                          📋 Collector-Signed Delivery Note
                          {orderDetail.waybill?.signed_delivery_note_url && <span style={{ marginLeft: '8px', color: '#15803d' }}>✅ Uploaded</span>}
                        </label>
                        {orderDetail.waybill?.signed_delivery_note_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => setDocViewer({ url: orderDetail.waybill.signed_delivery_note_url, title: 'Collector-Signed Delivery Note' })}
                              style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
                              👁 View
                            </button>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Replace:</span>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setSignedDeliveryFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                          </div>
                        ) : (
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setSignedDeliveryFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                        )}
                      </div>
                    </div>

                    {(signedFile || signedDeliveryFile) && (
                      <button onClick={handleUploadSigned} disabled={uploading} style={{ marginTop: '14px', background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        {uploading ? 'Uploading...' : '⬆️ Upload Selected Documents'}
                      </button>
                    )}

                    {orderDetail.waybill?.signed_copy_url && orderDetail.waybill?.signed_delivery_note_url && (
                      <div style={{ marginTop: '12px', background: '#dcfce7', borderRadius: '7px', padding: '10px 14px', color: '#15803d', fontSize: '13px' }}>
                        ✅ Both documents uploaded. Waiting for Manager approval.
                      </div>
                    )}
                  </div>
                )}

                {orderDetail.order?.status === 'completed' && (
                <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '16px', color: '#15803d', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎯</div>
                  <p style={{ margin: '0 0 12px', fontWeight: '700' }}>Order Completed and Approved</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {orderDetail.waybill?.scanned_copy_url && (
                      <button onClick={() => setDocViewer({ url: orderDetail.waybill.scanned_copy_url, title: 'Manager Signed Waybill' })}
                        style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                        👁 Manager Signed Waybill
                      </button>
                    )}
                    {orderDetail.waybill?.delivery_note_url && (
                      <button onClick={() => setDocViewer({ url: orderDetail.waybill.delivery_note_url, title: 'Manager Delivery Note' })}
                        style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                        👁 Manager Delivery Note
                      </button>
                    )}
                    {orderDetail.waybill?.signed_copy_url && (
                      <button onClick={() => setDocViewer({ url: orderDetail.waybill.signed_copy_url, title: 'Collector-Signed Waybill' })}
                        style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                        👁 Collector-Signed Waybill
                      </button>
                    )}
                    {orderDetail.waybill?.signed_delivery_note_url && (
                      <button onClick={() => setDocViewer({ url: orderDetail.waybill.signed_delivery_note_url, title: 'Collector-Signed Delivery Note' })}
                        style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                        👁 Collector-Signed Delivery Note
                      </button>
                    )}
                  </div>
  </div>
)}
              </div>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Could not load order details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STOREKEEPER PROFILE ──────────────────────────────────────
const StorekeeperProfile = () => {
  const { user } = useAuth();
  const [view, setView] = useState('profile');
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await API.put('/users/profile', profileForm); toast.success('Profile updated successfully.'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) return toast.error('Passwords do not match.');
    if (passwordForm.new_password.length < 6) return toast.error('Password must be at least 6 characters.');
    setSaving(true);
    try {
      await API.put('/users/change-password', { current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      toast.success('Password changed successfully.');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="page-title">My Profile</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={view === 'profile' ? 'btn-primary' : 'btn-outline'} onClick={() => setView('profile')}>👤 Edit Profile</button>
        <button className={view === 'password' ? 'btn-primary' : 'btn-outline'} onClick={() => setView('password')}>🔒 Change Password</button>
      </div>
      {view === 'profile' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group"><label>Full Name *</label><input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
            <div className="form-group"><label>Email Address *</label><input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div className="form-group"><label>Phone Number</label><input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      )}
      {view === 'password' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <form onSubmit={handleChangePassword}>
            <div className="form-group"><label>Current Password *</label><input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} required /></div>
            <div className="form-group"><label>New Password *</label><input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} required /></div>
            <div className="form-group"><label>Confirm New Password *</label><input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} required /></div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Change Password'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

// ─── MAIN STOREKEEPER DASHBOARD ───────────────────────────────
const StorekeeperDashboard = () => (
  <Layout menuItems={menuItems} extraTopbar={<StorekeeperNotificationBell />}>
    <Routes>
      <Route path="/"        element={<StorekeeperHome />} />
      <Route path="/orders"  element={<ReleaseGoods />} />
      <Route path="/profile" element={<StorekeeperProfile />} />
    </Routes>
  </Layout>
);

export default StorekeeperDashboard;
