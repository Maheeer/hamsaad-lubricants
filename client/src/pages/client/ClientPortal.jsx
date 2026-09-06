import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: `${process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app'}/api/client` });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hamsaad_client_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const formatNGN = (v) =>
  `NGN ${parseFloat(v || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const statusColors = {
  created:   { background: '#FFF3CD', color: '#856404' },
  confirmed: { background: '#CCE5FF', color: '#004085' },
  released:  { background: '#D4EDDA', color: '#155724' },
  completed: { background: '#D1ECF1', color: '#0C5460' },
};
const paymentColors = {
  unpaid:    { background: '#F8D7DA', color: '#721C24' },
  part_paid: { background: '#FFF3CD', color: '#856404' },
  paid:      { background: '#D4EDDA', color: '#155724' },
};

export default function ClientPortal({ client, onLogout }) {
  const [tab, setTab]                     = useState('home');
  const [products, setProducts]           = useState([]);
  const [orders, setOrders]               = useState([]);
  const [complaints, setComplaints]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [bankDetails, setBankDetails]     = useState({});

  // Order state
  const [cart, setCart]                   = useState({});
  const [orderNotes, setOrderNotes]       = useState('');
  const [orderStep, setOrderStep]         = useState('cart');
  const [createdOrder, setCreatedOrder]   = useState(null);
  const [receiptFile, setReceiptFile]     = useState(null);
  const [orderError, setOrderError]       = useState('');
  const [orderLoading, setOrderLoading]   = useState(false);

  // Product UI
  const [collapsedBrands, setCollapsedBrands] = useState({});
  const [productSearch, setProductSearch]     = useState('');

  // Order detail modal
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  // Complaint state
  const [complaintForm, setComplaintForm]   = useState({ order_id: '', subject: '', message: '' });
  const [complaintMsg, setComplaintMsg]     = useState('');
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [replyText, setReplyText]           = useState({});
  const [replying, setReplying]             = useState({});
  const bottomRefs                          = useRef({});

  // Password
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg]   = useState('');

  // Notification jump
  const [jumpComplaintId, setJumpComplaintId] = useState(null);
  // Order search
  const [orderSearch, setOrderSearch]         = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [pRes, oRes, nRes, bRes, cRes] = await Promise.all([
        API.get('/products'),
        API.get('/orders'),
        API.get('/notifications'),
        API.get('/bank-details'),
        API.get('/complaints'),
      ]);
      setProducts(pRes.data.products || []);
      setOrders(oRes.data.orders || []);
      setNotifications(nRes.data.notifications || []);
      setUnreadCount(nRes.data.unread_count || 0);
      setBankDetails(bRes.data.bank_details || {});
      setComplaints(cRes.data.complaints || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // When jumpComplaintId is set, switch to complaints tab and expand it
  useEffect(() => {
    if (jumpComplaintId !== null) {
      setTab('complaints');
      setExpandedComplaint(jumpComplaintId);
      setJumpComplaintId(null);
    }
  }, [jumpComplaintId]);

  // ── CART ─────────────────────────────────────────────────────
  const updateCart = (productId, qty) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const capped = Math.min(parseInt(qty) || 0, product.quantity_in_stock);
    if (capped <= 0) {
      const updated = { ...cart };
      delete updated[productId];
      setCart(updated);
    } else {
      setCart({ ...cart, [productId]: capped });
    }
  };

  const cartItems = products
    .filter((p) => cart[p.id] > 0)
    .map((p) => ({ ...p, qty: cart[p.id], lineTotal: parseFloat(p.selling_price) * cart[p.id] }));

  const cartTotal = cartItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const cartCount = Object.values(cart).filter((v) => v > 0).length;

  // ── PLACE ORDER ──────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setOrderError('');
    if (cartItems.length === 0) return setOrderError('Your cart is empty.');
    try {
      setOrderLoading(true);
      const res = await API.post('/orders', {
        notes: orderNotes,
        items: cartItems.map((i) => ({ product_id: i.id, quantity: i.qty })),
      });
      setCreatedOrder(res.data.order);
      setCart({});
      setOrderStep('cart');
      await loadAll();
      setTab('history');
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setOrderLoading(false);
    }
  };

  // ── UPLOAD RECEIPT ───────────────────────────────────────────
  const handleUploadReceipt = async (orderId) => {
    if (!receiptFile) return alert('Please select a file first.');
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    try {
      await API.post(`/orders/${orderId}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Receipt uploaded. Awaiting admin approval.');
      setReceiptFile(null);
      setCreatedOrder(null);
      setShowOrderDetail(false);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed.');
    }
  };

  // ── VIEW ORDER DETAIL ────────────────────────────────────────
  const handleViewOrder = async (order) => {
    try {
      const res = await API.get(`/orders/${order.id}`);
      setSelectedOrder(res.data.order);
      setShowOrderDetail(true);
    } catch {}
  };

  // ── COMPLAINT SUBMIT ─────────────────────────────────────────
  const handleComplaint = async () => {
    setComplaintMsg('');
    if (!complaintForm.subject || !complaintForm.message)
      return setComplaintMsg('Subject and message are required.');
    try {
      await API.post('/complaints', complaintForm);
      setComplaintMsg('success:Complaint submitted successfully.');
      setComplaintForm({ order_id: '', subject: '', message: '' });
      await loadAll();
    } catch (err) {
      setComplaintMsg(err.response?.data?.message || 'Failed to submit complaint.');
    }
  };

  // ── CLIENT REPLY ─────────────────────────────────────────────
  const handleReply = async (complaintId) => {
    const text = replyText[complaintId];
    if (!text?.trim()) return;
    try {
      setReplying((prev) => ({ ...prev, [complaintId]: true }));
      await API.post(`/complaints/${complaintId}/reply`, { message: text });
      setReplyText((prev) => ({ ...prev, [complaintId]: '' }));
      await loadAll();
      setTimeout(() => {
        bottomRefs.current[complaintId]?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setReplying((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  // ── NOTIFICATIONS READ ───────────────────────────────────────
  const handleReadNotifications = async () => {
    await API.put('/notifications/read');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // ── NOTIFICATION CLICK ───────────────────────────────────────
  const handleNotificationClick = async (n) => {
    // Mark this single notification as read
    if (!n.is_read) {
      try {
        await API.put('/notifications/read');
        setNotifications((prev) =>
          prev.map((notif) => notif.id === n.id ? { ...notif, is_read: true } : notif)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    // Navigate
    if (n.type === 'complaint_response' && n.complaint_id) {
      setJumpComplaintId(n.complaint_id);
    } else if (n.type === 'payment_approved' && n.order_id) {
      setTab('history');
      // Open the order detail modal after tab switch
      setTimeout(async () => {
        try {
          const res = await API.get(`/orders/${n.order_id}`);
          setSelectedOrder(res.data.order);
          setShowOrderDetail(true);
        } catch {}
      }, 100);
    }
  };

  // ── CHANGE PASSWORD ──────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwMsg('');
    if (!pwForm.current_password || !pwForm.new_password) return setPwMsg('All fields are required.');
    if (pwForm.new_password !== pwForm.confirm) return setPwMsg('New passwords do not match.');
    if (pwForm.new_password.length < 6) return setPwMsg('Password must be at least 6 characters.');
    try {
      await API.put('/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg('success:Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.message || 'Failed to change password.');
    }
  };

  // ── PRODUCT GROUPING ─────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
           p.brand_name.toLowerCase().includes(q) ||
           p.category_name.toLowerCase().includes(q) ||
           p.size_variant.toLowerCase().includes(q);
  });

  const productsByBrand = filteredProducts.reduce((acc, p) => {
    if (!acc[p.brand_name]) acc[p.brand_name] = [];
    acc[p.brand_name].push(p);
    return acc;
  }, {});

  const toggleBrand = (brand) =>
    setCollapsedBrands((prev) => ({ ...prev, [brand]: !prev[brand] }));

  // ── TABS ─────────────────────────────────────────────────────
  const tabs = [
    { key: 'home',          label: '🏠 Home' },
    { key: 'order',         label: `🛒 New Order${cartCount > 0 ? ` (${cartCount})` : ''}` },
    { key: 'history',       label: '📋 Orders' },
    { key: 'complaints',    label: '📝 Complaints' },
    { key: 'notifications', label: `🔔 Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'account',       label: '👤 Account' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Arial, sans-serif' }}>

      {/* TOP NAV */}
      <div style={{ background: '#1F3864', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>H</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>HAMSAAD</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Client Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', opacity: 0.85 }}>{client.full_name} · {client.client_id}</span>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Logout</button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dee2e6', padding: '0 24px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ border: 'none', background: 'none', padding: '14px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', color: tab === t.key ? '#1F3864' : '#6c757d', borderBottom: tab === t.key ? '3px solid #1F3864' : '3px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>

        {/* ══ HOME ══ */}
        {tab === 'home' && (
          <div>
            <h2 style={{ margin: '0 0 6px', color: '#1F3864' }}>Welcome, {client.full_name}</h2>
            <p style={{ margin: '0 0 24px', color: '#6c757d', fontSize: '14px' }}>Client ID: {client.client_id}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Orders',    value: orders.length,                                              icon: '📋', color: '#1F3864' },
                { label: 'Pending Payment', value: orders.filter((o) => o.payment_status === 'unpaid').length, icon: '💳', color: '#856404' },
                { label: 'Completed',       value: orders.filter((o) => o.status === 'completed').length,      icon: '✅', color: '#155724' },
                { label: 'Unread Alerts',   value: unreadCount,                                                icon: '🔔', color: '#721C24' },
              ].map((card) => (
                <div key={card.label} style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${card.color}` }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>{card.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', color: '#1F3864', fontSize: '15px' }}>Recent Orders</h3>
              {orders.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '14px' }}>No orders yet. Place your first order!</p>
              ) : orders.slice(0, 5).map((o) => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1F3864' }}>{o.order_number}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{new Date(o.created_at).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ ...statusColors[o.status], padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</span>
                    <span style={{ ...(paymentColors[o.payment_status] || paymentColors.unpaid), padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                      {(o.payment_status || 'unpaid').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ NEW ORDER ══ */}
        {tab === 'order' && (
          <div>
            {orderStep === 'cart' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, color: '#1F3864' }}>Place an Order</h2>
                  {cartCount > 0 && (
                    <button onClick={() => setOrderStep('review')} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                      Review Order ({cartCount} item{cartCount !== 1 ? 's' : ''})
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1px solid #dee2e6', borderRadius: '8px', fontSize: '14px' }}
                    placeholder="🔍  Search products by name, brand, size..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                {Object.keys(productsByBrand).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', background: '#fff', borderRadius: '10px' }}>No products match your search.</div>
                )}
                {Object.entries(productsByBrand).map(([brand, prods]) => {
                  const isCollapsed    = collapsedBrands[brand];
                  const brandCartCount = prods.filter((p) => cart[p.id] > 0).length;
                  return (
                    <div key={brand} style={{ background: '#fff', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div onClick={() => toggleBrand(brand)} style={{ background: '#1F3864', color: '#fff', padding: '12px 20px', fontWeight: 700, fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                        <span>{brand}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {brandCartCount > 0 && (
                            <span style={{ background: '#ffc107', color: '#1F3864', borderRadius: '10px', padding: '2px 8px', fontSize: '12px', fontWeight: 800 }}>
                              {brandCartCount} selected
                            </span>
                          )}
                          <span style={{ fontSize: '18px', opacity: 0.8 }}>{isCollapsed ? '▶' : '▼'}</span>
                        </div>
                      </div>
                      {!isCollapsed && prods.map((p) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1F3864' }}>{p.name}</div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>{p.size_variant} · {p.unit} · {p.category_name}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => updateCart(p.id, (cart[p.id] || 0) - 1)} disabled={!cart[p.id]}
                              style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa', cursor: cart[p.id] ? 'pointer' : 'not-allowed', fontSize: '18px', fontWeight: 700, color: '#1F3864', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <input type="number" min="0" value={cart[p.id] || 0}
                              onChange={(e) => updateCart(p.id, parseInt(e.target.value) || 0)}
                              style={{ width: '56px', textAlign: 'center', padding: '6px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
                            />
                            <button onClick={() => updateCart(p.id, (cart[p.id] || 0) + 1)}
                              style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #1F3864', background: '#1F3864', cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}

            {orderStep === 'review' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <button onClick={() => setOrderStep('cart')} style={{ background: 'none', border: 'none', color: '#2E75B6', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>← Back</button>
                  <h2 style={{ margin: 0, color: '#1F3864' }}>Review Order</h2>
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' }}>
                    <span>Product</span><span style={{ textAlign: 'right' }}>Quantity</span>
                  </div>
                  {cartItems.map((item) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1F3864' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>{item.brand_name} · {item.size_variant} · {item.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', color: '#1F3864' }}>
                        {item.qty} {item.unit}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '16px 20px', background: '#1F3864', color: '#fff', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>Order Total</span>
                    <span style={{ fontWeight: 800, fontSize: '18px', textAlign: 'right' }}>{formatNGN(cartTotal)}</span>
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '8px', textTransform: 'uppercase' }}>Notes (Optional)</label>
                  <textarea rows={3} placeholder="Any special instructions..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                {orderError && (
                  <div style={{ background: '#f8d7da', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#842029' }}>{orderError}</div>
                )}
                <button onClick={handlePlaceOrder} disabled={orderLoading} style={{ width: '100%', padding: '14px', background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: orderLoading ? 0.7 : 1 }}>
                  {orderLoading ? 'Placing Order...' : 'Confirm & Place Order'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ ORDER HISTORY ══ */}
        {tab === 'history' && (
          <div>
            <h2 style={{ margin: '0 0 20px', color: '#1F3864' }}>Order History</h2>

            {/* Bank details banner for newly placed order */}
            {createdOrder && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ background: '#d4edda', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <div>
                    <strong style={{ color: '#155724' }}>Order {createdOrder.order_number} placed successfully!</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#155724' }}>Please complete your payment using the details below.</p>
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #1F3864' }}>
                  <h3 style={{ margin: '0 0 14px', color: '#1F3864', fontSize: '15px' }}>Payment — Bank Transfer</h3>
                  {[
                    { label: 'Bank Name',      value: bankDetails.bank_name },
                    { label: 'Account Name',   value: bankDetails.bank_account_name },
                    { label: 'Account Number', value: bankDetails.bank_account_number },
                    { label: 'Amount to Pay',  value: formatNGN(createdOrder.total_amount) },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#6c757d', fontSize: '13px' }}>{row.label}</span>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1F3864' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#6c757d' }}>Upload your payment receipt after making the transfer:</p>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files[0])} style={{ display: 'block', marginBottom: '10px', fontSize: '13px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleUploadReceipt(createdOrder.id)} disabled={!receiptFile}
                        style={{ background: receiptFile ? '#1F3864' : '#adb5bd', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 700, cursor: receiptFile ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
                        Upload Receipt
                      </button>
                      <button onClick={() => setCreatedOrder(null)}
                        style={{ background: 'none', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#6c757d' }}>
                        Do Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1px solid #dee2e6', borderRadius: '8px', fontSize: '14px' }}
                placeholder="🔍  Search by order number or status..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            {orders.filter((o) => {
              const q = orderSearch.toLowerCase();
              return !q || o.order_number.toLowerCase().includes(q) ||
                     o.status.toLowerCase().includes(q) ||
                     (o.payment_status || '').toLowerCase().includes(q);
            }).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d', background: '#fff', borderRadius: '10px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                <p>{orderSearch ? 'No orders match your search.' : 'No orders yet.'}</p>
              </div>
            ) : orders.filter((o) => {
              const q = orderSearch.toLowerCase();
              return !q || o.order_number.toLowerCase().includes(q) ||
                     o.status.toLowerCase().includes(q) ||
                     (o.payment_status || '').toLowerCase().includes(q);
            }).map((o) => (
              <div key={o.id} style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1F3864' }}>{o.order_number}</div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{formatNGN(o.total_amount)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ ...statusColors[o.status], padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</span>
                  <span style={{ ...(paymentColors[o.payment_status] || paymentColors.unpaid), padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                    {(o.payment_status || 'unpaid').replace('_', ' ')}
                  </span>
                  <button onClick={() => handleViewOrder(o)} style={{ background: 'none', border: '1px solid #dee2e6', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', color: '#2E75B6', fontWeight: 600 }}>View</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ COMPLAINTS ══ */}
        {tab === 'complaints' && (
          <div>
            <h2 style={{ margin: '0 0 20px', color: '#1F3864' }}>Complaints</h2>

            {/* Lodge form */}
            <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1F3864' }}>Lodge a Complaint</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase' }}>Order (Optional)</label>
                <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }}
                  value={complaintForm.order_id} onChange={(e) => setComplaintForm({ ...complaintForm, order_id: e.target.value })}>
                  <option value="">General complaint</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.order_number}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase' }}>Subject *</label>
                <input style={{ width: '100%', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  placeholder="Brief subject..." value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase' }}>Message *</label>
                <textarea rows={4} style={{ width: '100%', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
                  placeholder="Describe your complaint..." value={complaintForm.message}
                  onChange={(e) => setComplaintForm({ ...complaintForm, message: e.target.value })} />
              </div>
              {complaintMsg && (
                <div style={{ background: complaintMsg.startsWith('success:') ? '#d4edda' : '#f8d7da', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: complaintMsg.startsWith('success:') ? '#155724' : '#842029' }}>
                  {complaintMsg.replace('success:', '')}
                </div>
              )}
              <button onClick={handleComplaint} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                Submit Complaint
              </button>
            </div>

            {/* Past complaints with threads */}
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#1F3864' }}>Past Complaints</h3>
            {complaints.length === 0 ? (
              <p style={{ color: '#6c757d', fontSize: '14px' }}>No complaints lodged yet.</p>
            ) : complaints.map((c) => {
              const isExpanded = expandedComplaint === c.id;
              const isResolved = c.status === 'resolved';
              const borderColor = isResolved ? '#28a745' : c.status === 'in_progress' ? '#ffc107' : '#dc3545';
              const statusStyle = {
                open:        { background: '#f8d7da', color: '#721C24' },
                in_progress: { background: '#fff3cd', color: '#856404' },
                resolved:    { background: '#d4edda', color: '#155724' },
              }[c.status] || { background: '#f8d7da', color: '#721C24' };

              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: '10px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${borderColor}`, overflow: 'hidden' }}>
                  {/* Header — clickable */}
                  <div onClick={() => setExpandedComplaint(isExpanded ? null : c.id)}
                    style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1F3864' }}>{c.subject}</span>
                        <span style={{ ...statusStyle, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {c.order_number && `Order: ${c.order_number} · `}
                        {(c.messages || []).length} message{(c.messages || []).length !== 1 ? 's' : ''}
                        {` · ${new Date(c.created_at).toLocaleDateString('en-GB')}`}
                      </div>
                    </div>
                    <span style={{ color: '#6c757d', fontSize: '18px' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Thread */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #dee2e6', padding: '16px 20px' }}>
                      <div style={{ marginBottom: '16px', maxHeight: '360px', overflowY: 'auto' }}>
                        {(c.messages || []).map((m, i) => {
                          const isAdmin = m.sender_type === 'admin';
                          return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: '#adb5bd', marginBottom: '4px' }}>
                                {isAdmin ? '🛡️ Admin' : '👤 You'}
                                {' · '}
                                {new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '10px', background: isAdmin ? '#1F3864' : '#f0f4f8', color: isAdmin ? '#fff' : '#1F3864', fontSize: '13px', lineHeight: 1.6, borderBottomRightRadius: isAdmin ? '2px' : '10px', borderBottomLeftRadius: isAdmin ? '10px' : '2px' }}>
                                {m.message}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={(el) => { bottomRefs.current[c.id] = el; }} />
                      </div>

                      {/* Reply box */}
                      {isResolved ? (
                        <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>
                          🔒 This complaint is resolved and closed.
                        </div>
                      ) : (
                        <div>
                          <textarea rows={2} placeholder="Type a reply..."
                            value={replyText[c.id] || ''}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            style={{ width: '100%', padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '8px' }}
                          />
                          <button
                            onClick={() => handleReply(c.id)}
                            disabled={!replyText[c.id]?.trim() || replying[c.id]}
                            style={{ background: replyText[c.id]?.trim() ? '#1F3864' : '#adb5bd', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 700, cursor: replyText[c.id]?.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
                            {replying[c.id] ? 'Sending...' : 'Send Reply'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ NOTIFICATIONS ══ */}
        {tab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1F3864' }}>Notifications</h2>
              {unreadCount > 0 && (
                <button onClick={handleReadNotifications} style={{ background: 'none', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#2E75B6' }}>
                  Mark all as read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d', background: '#fff', borderRadius: '10px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
                <p>No notifications yet.</p>
              </div>
            ) : notifications.map((n) => {
              const isClickable = n.type === 'complaint_response' || n.type === 'payment_approved';
              return (
                <div key={n.id}
                  onClick={() => isClickable && handleNotificationClick(n)}
                  style={{
                    background: n.is_read ? '#fff' : '#e8f0fe',
                    borderRadius: '10px', padding: '16px 20px', marginBottom: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderLeft: n.is_read ? '4px solid #dee2e6' : '4px solid #2E75B6',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1F3864' }}>{n.title}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {!n.is_read && (
                        <span style={{ background: '#2E75B6', color: '#fff', borderRadius: '10px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>NEW</span>
                      )}
                      {isClickable && (
                        <span style={{ fontSize: '11px', color: '#2E75B6', fontWeight: 600 }}>
                          {n.type === 'complaint_response' ? '→ View Complaint' : '→ View Order Details'}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: '6px 0 4px', fontSize: '13px', color: '#495057' }}>{n.message}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#adb5bd' }}>{new Date(n.created_at).toLocaleDateString('en-GB')}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ACCOUNT ══ */}
        {tab === 'account' && (
          <div>
            <h2 style={{ margin: '0 0 20px', color: '#1F3864' }}>My Account</h2>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1F3864' }}>Profile</h3>
              {[{ label: 'Client ID', value: client.client_id }, { label: 'Full Name', value: client.full_name }, { label: 'Email', value: client.email || '—' }, { label: 'Phone', value: client.phone || '—' }].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#6c757d', fontSize: '13px' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1F3864' }}>Change Password</h3>
              {[{ label: 'Current Password', key: 'current_password', placeholder: 'Enter current password' }, { label: 'New Password', key: 'new_password', placeholder: 'Min 6 characters' }, { label: 'Confirm New Password', key: 'confirm', placeholder: 'Repeat new password' }].map((field) => (
                <div key={field.key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</label>
                  <input type="password" style={{ width: '100%', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                    placeholder={field.placeholder} value={pwForm[field.key]}
                    onChange={(e) => setPwForm({ ...pwForm, [field.key]: e.target.value })} />
                </div>
              ))}
              {pwMsg && (
                <div style={{ background: pwMsg.startsWith('success:') ? '#d4edda' : '#f8d7da', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: pwMsg.startsWith('success:') ? '#155724' : '#842029' }}>
                  {pwMsg.replace('success:', '')}
                </div>
              )}
              <button onClick={handleChangePassword} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Update Password</button>
            </div>
          </div>
        )}
      </div>

      {/* ══ ORDER DETAIL MODAL ══ */}
      {showOrderDetail && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
          onClick={() => setShowOrderDetail(false)}>
          <div style={{ background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: '#1F3864', color: '#fff', padding: '16px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedOrder.order_number}</h3>
              <button onClick={() => setShowOrderDetail(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ ...statusColors[selectedOrder.status], padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{selectedOrder.status}</span>
                <span style={{ ...(paymentColors[selectedOrder.payment_status] || paymentColors.unpaid), padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                  {(selectedOrder.payment_status || 'unpaid').replace('_', ' ')}
                </span>
              </div>
              {(selectedOrder.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.product_name}</div>
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>{item.size_variant} · {item.unit}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1F3864' }}>{item.quantity} {item.unit}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{formatNGN(item.total_price)}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontWeight: 800, fontSize: '16px', color: '#1F3864' }}>
                <span>Total</span><span>{formatNGN(selectedOrder.total_amount)}</span>
              </div>
              {selectedOrder.payment_status === 'unpaid' && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#fff3cd', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#856404', fontSize: '14px' }}>Payment Pending</p>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files[0])} style={{ display: 'block', marginBottom: '10px', fontSize: '13px' }} />
                  <button onClick={() => handleUploadReceipt(selectedOrder.id)} disabled={!receiptFile}
                    style={{ background: receiptFile ? '#1F3864' : '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 700, cursor: receiptFile ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
                    Upload Payment Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
