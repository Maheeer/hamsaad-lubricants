import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import {
  getAllOrders, getOrderById, confirmOrder,
  uploadScannedWaybill, approveWaybill,
  getAllProducts, addStock,
} from '../../utils/api';
import StockReceipts from '../admin/StockReceipts';
import DocumentViewerModal from '../../components/DocumentViewerModal';

const menuItems = [
  { path: '/manager',                label: 'Dashboard',      icon: '📊' },
  { path: '/manager/orders',         label: 'Orders',         icon: '📋' },
  { path: '/manager/stock-receipts', label: 'Stock Receipts', icon: '📥' },
  { path: '/manager/stock',          label: 'Add Stock',      icon: '📦' },
  { path: '/manager/profile',        label: 'My Profile',     icon: '👤' },
];


const BASE_URL = process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app';

const openWaybillPDF  = (orderId) => { const t = localStorage.getItem('hamsaad_token'); window.open(`${BASE_URL}/api/pdf/waybill/${orderId}?token=${t}`, '_blank'); };
const openDeliveryPDF = (orderId) => { const t = localStorage.getItem('hamsaad_token'); window.open(`${BASE_URL}/api/pdf/delivery-note/${orderId}?token=${t}`, '_blank'); };

const isImageFile = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '');

const getStatusStyle = (status) => {
  if (status === 'created')   return { bg: '#dbeafe', color: '#1d4ed8', label: 'Awaiting Confirmation' };
  if (status === 'confirmed') return { bg: '#fef9c3', color: '#a16207', label: 'Confirmed' };
  if (status === 'released')  return { bg: '#e0f2fe', color: '#0369a1', label: 'Released' };
  if (status === 'completed') return { bg: '#dcfce7', color: '#15803d', label: 'Completed' };
  if (status === 'cancelled') return { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' };
  return { bg: '#f3f4f6', color: '#6b7280', label: status };
};

const StatusBadge = ({ status }) => {
  const s = getStatusStyle(status);
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

const formatNGN  = (v) => 'NGN ' + parseFloat(v || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 });
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── PRINT DOCUMENTS DROPDOWN ─────────────────────────────────
const PrintDocsDropdown = ({ order, onView }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: '#2E75B6', color: '#fff', border: 'none', borderRadius: '7px', padding: '6px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        🖨️ Docs ▾
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '32px', right: 0, background: '#fff', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1px solid #e5eaf3', zIndex: 999, minWidth: '200px', overflow: 'hidden' }}>
          <div style={{ padding: '8px 0' }}>
            <button onClick={() => { openWaybillPDF(order.id); setOpen(false); }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 16px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a1f36' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >📄 Download Waybill</button>
            <button onClick={() => { openDeliveryPDF(order.id); setOpen(false); }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 16px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a1f36' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >📋 Download Delivery Note</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── NOTIFICATION BELL ────────────────────────────────────────
const ManagerNotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('manager_seen_notifications') || '[]'); } catch { return []; }
  });
  const dropRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/manager-notifications');
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
      localStorage.setItem('manager_seen_notifications', JSON.stringify(allIds));
    }
  };

  const typeIcon = (type) => {
    if (type === 'new_paid_order')  return '💰';
    if (type === 'signed_waybill')  return '📝';
    if (type === 'pending_release') return '🚚';
    if (type === 'low_stock')       return '⚠️';
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
      <button onClick={handleOpen} style={{ position: 'relative', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '20px' }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#dc2626', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '42px', right: 0, width: '360px', background: '#fff', borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid #e5eaf3', zIndex: 9999, maxHeight: '440px', overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f3f9', background: '#fafbff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1F3864' }}>Notifications</span>
              {unreadCount > 0 && <span style={{ background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '1px 7px', borderRadius: '10px' }}>{unreadCount} new</span>}
            </div>
            <button onClick={fetchNotifications} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>↻ Refresh</button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <p style={{ margin: 0, fontSize: '13px' }}>No pending notifications</p>
            </div>
          ) : notifications.map(n => {
            const isNew = !seen.includes(n.id);
            return (
              <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', background: isNew ? '#fafbff' : '#fff', borderLeft: isNew ? '3px solid #2E75B6' : '3px solid transparent' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '12px', color: '#1a1f36' }}>{n.title}</p>
                      {n.urgent && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '8px' }}>URGENT</span>}
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>{n.message}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{formatTime(n.time)}</p>
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
  <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 22px', flex: 1, minWidth: '170px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ background: bg, borderRadius: '10px', padding: '8px 10px', fontSize: '20px', display: 'inline-block' }}>{icon}</div>
    <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1f36', marginTop: '4px' }}>{value}</div>
    <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{label}</div>
    {sub && <div style={{ fontSize: '11px', color: color, fontWeight: '600' }}>{sub}</div>}
  </div>
);

// ─── MANAGER HOME ─────────────────────────────────────────────
const ManagerHome = () => {
  const navigate  = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordRes, prodRes] = await Promise.all([getAllOrders(), getAllProducts()]);
        setOrders(ordRes.data.orders || []);
        setProducts(prodRes.data.products || []);
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

  const visibleOrders   = orders.filter(o => o.payment_status === 'paid' || o.status === 'completed');
  const pending         = visibleOrders.filter(o => o.status === 'created');
  const confirmed       = visibleOrders.filter(o => o.status === 'confirmed');
  const released        = visibleOrders.filter(o => o.status === 'released');
  const completed       = visibleOrders.filter(o => o.status === 'completed');
  const actionNeeded    = [...pending, ...released];
  const lowStockItems   = products.filter(p => p.quantity_in_stock <= p.minimum_threshold);
  const totalStockValue = products.reduce((s, p) => s + (parseFloat(p.selling_price) * p.quantity_in_stock), 0);
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1a1f36' }}>Manager Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{today}</p>
        </div>
        {actionNeeded.length > 0 && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>{actionNeeded.length} order{actionNeeded.length > 1 ? 's' : ''} need your attention</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard icon="💰" label="Awaiting Confirmation" value={pending.length}       color="#1d4ed8" bg="#dbeafe" sub={pending.length > 0 ? 'Action required' : 'All clear'} />
        <StatCard icon="✅" label="Confirmed"             value={confirmed.length}     color="#a16207" bg="#fef9c3" />
        <StatCard icon="🚚" label="Released"              value={released.length}      color="#0369a1" bg="#e0f2fe" sub={released.length > 0 ? 'Awaiting waybill approval' : ''} />
        <StatCard icon="🎯" label="Completed"             value={completed.length}     color="#15803d" bg="#dcfce7" />
        <StatCard icon="📦" label="Low Stock Items"       value={lowStockItems.length} color={lowStockItems.length > 0 ? '#dc2626' : '#15803d'} bg={lowStockItems.length > 0 ? '#fee2e2' : '#dcfce7'} sub={lowStockItems.length > 0 ? 'Needs restocking' : 'Stock levels OK'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1f36' }}>⚡ Orders Requiring Action</h3>
            <button onClick={() => navigate('/manager/orders')} style={{ background: '#f0f4ff', color: '#1F3864', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
          {actionNeeded.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
              <p style={{ margin: 0, fontSize: '13px' }}>No pending actions</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {actionNeeded.slice(0, 5).map(o => {
                const s = getStatusStyle(o.status);
                return (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fafbff', borderRadius: '10px', border: '1px solid #e5eaf3' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#1F3864' }}>{o.order_number}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{o.client_name} · {formatDate(o.created_at)}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>{s.label}</span>
                      <button onClick={() => navigate('/manager/orders')} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Handle</button>
                    </div>
                  </div>
                );
              })}
              {actionNeeded.length > 5 && <p style={{ textAlign: 'center', margin: 0, fontSize: '12px', color: '#9ca3af' }}>+{actionNeeded.length - 5} more</p>}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1f36' }}>⚠️ Low Stock Items</h3>
            <button onClick={() => navigate('/manager/stock-receipts')} style={{ background: '#f0f4ff', color: '#1F3864', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Receive Stock</button>
          </div>
          {lowStockItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
              <p style={{ margin: 0, fontSize: '13px' }}>All stock levels are adequate</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lowStockItems.slice(0, 6).map(p => {
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

      <div style={{ background: 'linear-gradient(135deg, #1F3864, #2E75B6)', borderRadius: '14px', padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Stock Value</p>
          <p style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: '800' }}>{formatNGN(totalStockValue)}</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>{products.length} products across all categories</p>
        </div>
        <div style={{ fontSize: '48px', opacity: 0.3 }}>📊</div>
      </div>
    </div>
  );
};

// ─── MANAGER ORDERS ───────────────────────────────────────────
const ManagerOrders = () => {
  const [allOrders, setAllOrders]           = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedOrder, setSelectedOrder]   = useState(null);
  const [orderDetail, setOrderDetail]       = useState(null);
  const [collectorName, setCollectorName]   = useState('');
  const [scannedFile, setScannedFile]       = useState(null);
  const [deliveryNoteFile, setDeliveryNoteFile] = useState(null);
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [filterStatus, setFilterStatus]     = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [rejectReason, setRejectReason]     = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejecting, setRejecting]           = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [docViewer, setDocViewer]           = useState(null); // { url, title }

  const fetchOrders = useCallback(async () => {
  try {
    const res = await API.get('/orders');
    const all = (res.data.orders || []).filter(o =>
      o.payment_status === 'paid' || o.status === 'completed'
    );
    setAllOrders(all);
  } catch { toast.error('Failed to load orders.'); }
  finally { setLoading(false); }
}, []);

useEffect(() => {
  fetchOrders();
  const interval = setInterval(fetchOrders, 30000);
  return () => clearInterval(interval);
}, [fetchOrders]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
    setShowRejectForm(false);
    setRejectReason('');
    setScannedFile(null);
    setDeliveryNoteFile(null);
    try {
      const res = await getOrderById(order.id);
      setOrderDetail(res.data || null);
    } catch { toast.error('Failed to load order details.'); }
    finally { setLoadingDetail(false); }
  };

  const handleConfirm = async () => {
    try {
      await confirmOrder(selectedOrder.id, { collector_name: collectorName });
      toast.success('Order confirmed. Documents are ready to download and print.');
      setSelectedOrder(null); setOrderDetail(null); setCollectorName('');
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to confirm order.'); }
  };

  const handleUploadScanned = async () => {
    if (!scannedFile && !deliveryNoteFile) {
      toast.error('Please select at least one file to upload.'); return;
    }
    setUploading(true);
    try {
      if (scannedFile) {
        await uploadScannedWaybill(selectedOrder.id, scannedFile);
      }
      if (deliveryNoteFile) {
        const formData = new FormData();
        formData.append('file', deliveryNoteFile);
        await API.post(`/orders/${selectedOrder.id}/upload-delivery-note`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('Documents uploaded successfully.');
      setScannedFile(null); setDeliveryNoteFile(null);
      handleViewOrder(selectedOrder);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed.'); }
    finally { setUploading(false); }
  };

  const handleApproveWaybill = async () => {
    try {
      await approveWaybill(selectedOrder.id);
      toast.success('Waybill approved. Order completed.');
      setSelectedOrder(null); setOrderDetail(null);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Approval failed.'); }
  };

  const handleRejectWaybill = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason.'); return; }
    setRejecting(true);
    try {
      await API.put(`/orders/${selectedOrder.id}/reject-waybill`, { reason: rejectReason });
      toast.success('Waybill rejected. Storekeeper notified.');
      setShowRejectForm(false); setRejectReason('');
      handleViewOrder(selectedOrder);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Rejection failed.'); }
    finally { setRejecting(false); }
  };

  const closeModal = () => { setSelectedOrder(null); setOrderDetail(null); setDocViewer(null); };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: '#6b7280' }}>
      <div style={{ width: '28px', height: '28px', border: '3px solid #e5eaf3', borderTopColor: '#2E75B6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading orders...
    </div>
  );

  const waybill = orderDetail?.waybill;
  const orderStatus = orderDetail?.order?.status;
  const hasScanned      = !!waybill?.scanned_copy_url;
  const hasDeliveryNote = !!waybill?.delivery_note_url;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1a1f36' }}>Orders Management</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{allOrders.length} order{allOrders.length !== 1 ? 's' : ''} visible to you</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', border: '1px solid #e5eaf3', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#9ca3af' }}>🔍</span>
          <input type="text" placeholder="Search by order number or client name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #d1d9e6', borderRadius: '8px', fontSize: '13px', color: '#1a1f36', outline: 'none', boxSizing: 'border-box' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px' }}>×</button>}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #d1d9e6', borderRadius: '8px', fontSize: '13px', color: '#1a1f36', minWidth: '180px' }}>
          <option value="">All Statuses</option>
          <option value="created">Awaiting Confirmation</option>
          <option value="confirmed">Confirmed</option>
          <option value="released">Released</option>
          <option value="completed">Completed</option>
        </select>
        {(searchQuery || filterStatus) && (
          <button onClick={() => { setSearchQuery(''); setFilterStatus(''); }} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d9e6', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
        )}
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>{orders.length} result{orders.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5eaf3', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['Order No.', 'Client', 'Amount', 'Status', 'Payment', 'Date', 'Action'].map(h => (
                <th key={h} style={{ background: '#f8faff', color: '#4b5563', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '11px 14px', textAlign: 'left', borderBottom: '2px solid #e5eaf3', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <p style={{ margin: 0, fontWeight: '600' }}>No orders found</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>{searchQuery ? `No results for "${searchQuery}"` : 'No paid orders available yet'}</p>
                </td>
              </tr>
            ) : orders.map(o => {
              const s = getStatusStyle(o.status);
              //const showDocs = o.status !== 'created';
                const showDocs = o.status === 'confirmed' || o.status === 'released';
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #f0f3f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: '#2E75B6', fontFamily: 'monospace' }}>{o.order_number}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '600', color: '#1a1f36' }}>{o.client_name}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: '#15803d' }}>{formatNGN(o.total_amount)}</td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={o.status} /></td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>PAID</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(o.created_at)}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button onClick={() => handleViewOrder(o)} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Manage</button>
                      {showDocs && <PrintDocsDropdown order={o} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal doc={docViewer} onClose={() => setDocViewer(null)} />

      {/* Order Management Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px', borderRadius: '16px' }}>
            {/* Modal header — no download buttons, just title and close */}
            <div style={{ background: '#1F3864', color: '#fff', padding: '18px 24px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '-24px -24px 20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Manage Order</h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.7 }}>{selectedOrder.order_number}</p>
              </div>
              <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer' }}>×</button>
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading order details...</div>
            ) : orderDetail ? (
              <div>
                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  {[
                    { label: 'Client',  value: orderDetail.order?.client_name || '—' },
                    { label: 'Payment', value: (orderDetail.order?.payment_status || 'unpaid').replace('_', ' ').toUpperCase() },
                    { label: 'Status',  value: <StatusBadge status={orderDetail.order?.status || ''} /> },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f8faff', borderRadius: '8px', padding: '10px 12px' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1a1f36' }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <h4 style={{ margin: '0 0 10px', color: '#1F3864', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Order Items</h4>
                <div style={{ border: '1px solid #e5eaf3', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8faff' }}>
                        {['Product', 'Brand', 'Size', 'Qty'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(orderDetail.items || []).map(item => (
                        <tr key={item.id} style={{ borderTop: '1px solid #f0f3f9' }}>
                          <td style={{ padding: '9px 12px', fontWeight: '600', color: '#1a1f36' }}>{item.product_name}</td>
                          <td style={{ padding: '9px 12px', color: '#6b7280' }}>{item.brand_name}</td>
                          <td style={{ padding: '9px 12px', color: '#6b7280' }}>{item.size_variant}</td>
                          <td style={{ padding: '9px 12px', fontWeight: '700', color: '#1F3864' }}>{item.quantity} {item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* STEP 1: Confirm */}
                {orderStatus === 'created' && (
                  <div style={{ border: '2px solid #2E75B6', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#f0f4ff' }}>
                    <h4 style={{ color: '#1F3864', marginBottom: '10px', fontSize: '13px' }}>Step 1 — Confirm Order</h4>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Collector Name (optional)</label>
                      <input value={collectorName} onChange={e => setCollectorName(e.target.value)} placeholder="Name of person collecting the goods" style={{ marginTop: '4px' }} />
                    </div>
                    <button onClick={handleConfirm} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      ✅ Confirm Order and Generate Documents
                    </button>
                  </div>
                )}

                {/* STEP 2: Download, Print, Upload signed copies */}
                {orderStatus === 'confirmed' && (
                  <div style={{ border: '2px solid #E67E22', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#fffbf0' }}>
                    <h4 style={{ color: '#E67E22', marginBottom: '8px', fontSize: '13px' }}>Step 2 — Print, Sign and Upload Documents</h4>

                    {/* Download links */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <button onClick={() => openWaybillPDF(selectedOrder.id)} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '7px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        📄 Download Waybill
                      </button>
                      <button onClick={() => openDeliveryPDF(selectedOrder.id)} style={{ background: '#2E75B6', color: '#fff', border: 'none', borderRadius: '7px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        📋 Download Delivery Note
                      </button>
                    </div>

                    <p style={{ color: '#666', fontSize: '12px', marginBottom: '14px', lineHeight: '1.5' }}>
                      Print 3 copies of each document, sign and stamp them, then upload the signed copies below.
                    </p>

                    {/* Upload section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Waybill upload */}
                      <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', border: '1px solid #e5eaf3' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#1F3864', display: 'block', marginBottom: '6px' }}>
                          📄 Signed Waybill
                          {hasScanned && <span style={{ marginLeft: '8px', color: '#15803d', fontWeight: '600' }}>✅ Uploaded</span>}
                        </label>
                        {hasScanned ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={() => setDocViewer({ url: waybill.scanned_copy_url, title: 'Signed Waybill' })} style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
                              👁 View Uploaded Waybill
                            </button>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Replace:</span>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setScannedFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                          </div>
                        ) : (
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setScannedFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                        )}
                      </div>

                      {/* Delivery note upload */}
                      <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', border: '1px solid #e5eaf3' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#1F3864', display: 'block', marginBottom: '6px' }}>
                          📋 Signed Delivery Note
                          {hasDeliveryNote && <span style={{ marginLeft: '8px', color: '#15803d', fontWeight: '600' }}>✅ Uploaded</span>}
                        </label>
                        {hasDeliveryNote ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={() => setDocViewer({ url: waybill.delivery_note_url, title: 'Signed Delivery Note' })} style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
                              👁 View Uploaded Delivery Note
                            </button>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Replace:</span>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDeliveryNoteFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                          </div>
                        ) : (
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDeliveryNoteFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                        )}
                      </div>
                    </div>

                    {(scannedFile || deliveryNoteFile) && (
                      <button onClick={handleUploadScanned} disabled={uploading} style={{ marginTop: '14px', background: '#E67E22', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        {uploading ? 'Uploading...' : '⬆️ Upload Selected Documents'}
                      </button>
                    )}

                    {hasScanned && (
                      <div style={{ marginTop: '12px', background: '#d4edda', borderRadius: '7px', padding: '10px 14px', color: '#155724', fontSize: '13px' }}>
                        ✅ Waybill uploaded. Waiting for storekeeper to release goods.
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Approve/Reject signed waybill from collector */}
                {orderStatus === 'released' && (
                  <div style={{ border: '2px solid #15803d', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#f0fdf4' }}>
                    <h4 style={{ color: '#15803d', marginBottom: '10px', fontSize: '13px' }}>Step 3 — Review Collector Signed Waybill</h4>

                    {/* View manager uploads */}
                    {(waybill?.scanned_copy_url || waybill?.delivery_note_url) && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        {waybill?.scanned_copy_url && (
                          <button onClick={() => setDocViewer({ url: waybill.scanned_copy_url, title: 'Signed Waybill' })} style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                            👁 View Signed Waybill
                          </button>
                        )}
                        {waybill?.delivery_note_url && (
                          <button onClick={() => setDocViewer({ url: waybill.delivery_note_url, title: 'Signed Delivery Note' })} style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                            👁 View Delivery Note
                          </button>
                        )}
                      </div>
                    )}

                    {waybill?.signed_copy_url ? (
                      <div>
                        <button onClick={() => setDocViewer({ url: waybill.signed_copy_url, title: 'Collector-Signed Waybill' })} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', marginBottom: '12px', display: 'inline-block' }}>
                          👁 View Collector-Signed Waybill
                        </button>

                        {waybill?.signed_delivery_note_url && (
                          <button onClick={() => setDocViewer({ url: waybill.signed_delivery_note_url, title: 'Collector-Signed Delivery Note' })} style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                            👁 View Collector-Signed Delivery Note
                          </button>
                        )}

                        {waybill?.rejection_reason && (
                          <div style={{ background: '#fff3cd', borderRadius: '7px', padding: '10px', marginBottom: '12px', color: '#856404', fontSize: '12px' }}>
                            <strong>Previous rejection:</strong> {waybill.rejection_reason}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={handleApproveWaybill} style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                            ✅ Approve Waybill
                          </button>
                          <button onClick={() => setShowRejectForm(r => !r)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                            ❌ Reject Waybill
                          </button>
                        </div>
                        {showRejectForm && (
                          <div style={{ marginTop: '14px', padding: '14px', background: '#fff8f8', borderRadius: '9px', border: '1px solid #fecaca' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>Reason for Rejection *</label>
                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why the waybill is being rejected..."
                              style={{ width: '100%', minHeight: '80px', padding: '8px', border: '1px solid #fecaca', borderRadius: '7px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <button onClick={() => setShowRejectForm(false)} style={{ background: '#fff', border: '1px solid #d1d9e6', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                              <button onClick={handleRejectWaybill} disabled={rejecting} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Waiting for storekeeper to upload the collector-signed waybill.</p>
                    )}
                  </div>
                )}

                {orderStatus === 'completed' && (
                  <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '16px', color: '#15803d', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎯</div>
                    <p style={{ margin: '0 0 12px', fontWeight: '700' }}>Order Completed Successfully</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {waybill?.scanned_copy_url && (
                        <button onClick={() => setDocViewer({ url: waybill.scanned_copy_url, title: 'Signed Waybill' })} style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                          👁 View Waybill
                        </button>
                      )}
                      {waybill?.delivery_note_url && (
                        <button onClick={() => setDocViewer({ url: waybill.delivery_note_url, title: 'Signed Delivery Note' })} style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                          👁 View Delivery Note
                        </button>
                      )}
                      {waybill?.signed_copy_url && (
                        <button onClick={() => setDocViewer({ url: waybill.signed_copy_url, title: 'Collector-Signed Waybill' })} style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                          👁 View Collector-Signed Waybill
                        </button>
                      )}
                      {waybill?.signed_delivery_note_url && (
                      <button onClick={() => setDocViewer({ url: waybill.signed_delivery_note_url, title: 'Collector-Signed Delivery Note' })} style={{ background: '#fff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                        👁 View Collector-Signed Delivery Note
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

// ─── MANAGER STOCK ────────────────────────────────────────────
const ManagerStock = () => {
  const [products, setProducts]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockForm, setStockForm]             = useState({ quantity: '', note: '' });

  useEffect(() => {
    const fetch = async () => {
      try { const res = await getAllProducts(); setProducts(res.data.products || []); }
      catch { toast.error('Failed to load products.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await addStock(selectedProduct.id, stockForm);
      toast.success('Stock added successfully.');
      setSelectedProduct(null); setStockForm({ quantity: '', note: '' });
      const res = await getAllProducts(); setProducts(res.data.products || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add stock.'); }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div>
      <h1 className="page-title">Add Stock</h1>
      <div style={{ background: '#fff3cd', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#856404', fontSize: '13px' }}>
        Stock additions here are flagged as Manager-added and visible to Admin for review.
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr><th>Product</th><th>Brand</th><th>Category</th><th>Size</th><th>Current Stock</th><th>Action</th></tr></thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No products found.</td></tr>
            ) : products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: '600' }}>{p.name}</td>
                <td>{p.brand_name}</td>
                <td>{p.category_name}</td>
                <td>{p.size_variant}</td>
                <td><span style={{ fontWeight: '700', color: p.quantity_in_stock <= p.minimum_threshold ? '#C0392B' : '#1E7E34' }}>{p.quantity_in_stock}</span></td>
                <td><button className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => setSelectedProduct(p)}>+ Add Stock</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Add Stock — {selectedProduct.name}</h2>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '13px' }}>Current stock: <strong>{selectedProduct.quantity_in_stock} {selectedProduct.unit}</strong></p>
            <form onSubmit={handleAddStock}>
              <div className="form-group"><label>Quantity to Add *</label><input type="number" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} required min="1" /></div>
              <div className="form-group"><label>Note</label><input value={stockForm.note} onChange={e => setStockForm({ ...stockForm, note: e.target.value })} placeholder="e.g. New delivery from supplier" /></div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-outline" onClick={() => setSelectedProduct(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MANAGER PROFILE ──────────────────────────────────────────
const ManagerProfile = () => {
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

// ─── MAIN MANAGER DASHBOARD ───────────────────────────────────
const ManagerDashboard = () => (
  <Layout menuItems={menuItems} extraTopbar={<ManagerNotificationBell />}>
    <Routes>
      <Route path="/"               element={<ManagerHome />} />
      <Route path="/orders"         element={<ManagerOrders />} />
      <Route path="/stock-receipts" element={<StockReceipts />} />
      <Route path="/stock"          element={<ManagerStock />} />
      <Route path="/profile"        element={<ManagerProfile />} />
    </Routes>
  </Layout>
);

export default ManagerDashboard;
