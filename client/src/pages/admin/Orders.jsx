import React, { useState, useEffect, useCallback } from 'react';
import API from '../../utils/api';
import DocumentViewerModal from '../../components/DocumentViewerModal';

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

const formatNGN = (amount) =>
  `NGN ${parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const emptyItem = () => ({ product_id: '', quantity: '', discount_per_unit: '' });

export default function Orders() {
  const [orders, setOrders]     = useState([]);
  const [clients, setClients]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [filterStatus, setFilterStatus]        = useState('');
  const [filterFrom, setFilterFrom]            = useState('');
  const [filterTo, setFilterTo]                = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [searchQuery, setSearchQuery]          = useState('');

  const [showCreate, setShowCreate]       = useState(false);
  const [showDetail, setShowDetail]       = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form, setForm] = useState({
    client_id: '',
    notes: '',
    payment_method: 'bank_transfer',
    items: [emptyItem()],
  });
  const [adminReceiptUpload, setAdminReceiptUpload] = useState({ orderId: null, file: null, uploading: false });
  const [formError, setFormError] = useState('');
  const [creating, setCreating]   = useState(false);
  const [docViewer, setDocViewer] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus)        params.append('status', filterStatus);
      if (filterFrom)          params.append('from_date', filterFrom);
      if (filterTo)            params.append('to_date', filterTo);
      if (filterPaymentStatus) params.append('payment_status', filterPaymentStatus);
      const res = await API.get(`/orders?${params.toString()}`);
      setOrders(res.data.orders || []);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterFrom, filterTo, filterPaymentStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const load = async () => {
      const [cRes, pRes] = await Promise.all([
        API.get('/users/clients'),
        API.get('/products'),
      ]);
      setClients(cRes.data.clients || []);
      setProducts(pRes.data.products || []);
    };
    load();
  }, []);

  const getStockWarning = (item) => {
    if (!item.product_id || !item.quantity) return null;
    const product = products.find((p) => p.id === parseInt(item.product_id));
    if (!product) return null;
    const qty   = parseInt(item.quantity) || 0;
    const stock = parseInt(product.quantity_in_stock) || 0;
    if (stock === 0)    return `Out of stock`;
    if (qty > stock)    return `Exceeds available stock (${stock} ${product.unit} available)`;
    return null;
  };

  const hasStockErrors = () => form.items.some((item) => getStockWarning(item) !== null);

  const calcTotals = () => {
    let subtotal = 0, totalDiscount = 0;
    form.items.forEach((item) => {
      const product = products.find((p) => p.id === parseInt(item.product_id));
      if (!product) return;
      const qty         = parseFloat(item.quantity) || 0;
      const unitPrice   = parseFloat(product.selling_price) || 0;
      const discPerUnit = parseFloat(item.discount_per_unit) || 0;
      subtotal      += unitPrice * qty;
      totalDiscount += discPerUnit * qty;
    });
    return { subtotal, totalDiscount, total: subtotal - totalDiscount };
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index][field] = value;
    if (field === 'product_id') {
      updated[index].quantity          = '';
      updated[index].discount_per_unit = '';
    }
    setForm({ ...form, items: updated });
  };

  const addItem    = () => setForm({ ...form, items: [...form.items, emptyItem()] });
  const removeItem = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleCreate = async () => {
    setFormError('');
    if (!form.client_id) return setFormError('Please select a client.');
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.product_id) return setFormError(`Item ${i + 1}: please select a product.`);
      if (!item.quantity || parseInt(item.quantity) <= 0)
        return setFormError(`Item ${i + 1}: please enter a valid quantity.`);
      const w = getStockWarning(item);
      if (w) return setFormError(`Item ${i + 1}: ${w}`);
    }
    const ids = form.items.map((i) => i.product_id);
    if (new Set(ids).size !== ids.length)
      return setFormError('Duplicate products found. Combine them into one line.');

    try {
      setCreating(true);
      await API.post('/orders', {
        client_id:        parseInt(form.client_id),
        notes:            form.notes,
        payment_method:   form.payment_method,
        created_by_admin: true,
        items: form.items.map((i) => ({
          product_id:        parseInt(i.product_id),
          quantity:          parseInt(i.quantity),
          discount_per_unit: parseFloat(i.discount_per_unit) || 0,
        })),
      });
      setShowCreate(false);
      setForm({ client_id: '', notes: '', payment_method: 'bank_transfer', items: [emptyItem()] });
      fetchOrders();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setCreating(false);
    }
  };

  const handleAdminReceiptUpload = async () => {
    const { orderId, file } = adminReceiptUpload;
    if (!file) return alert('Please select a file.');
    const formData = new FormData();
    formData.append('file', file);
    try {
      setAdminReceiptUpload((prev) => ({ ...prev, uploading: true }));
      // Upload receipt
      await API.post(`/orders/${orderId}/admin-upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Auto-approve payment immediately
      await API.post(`/settings/approve-payment/${orderId}`);
      setAdminReceiptUpload({ orderId: null, file: null, uploading: false });
      fetchOrders();
      const res = await API.get(`/orders/${orderId}`);
      setSelectedOrder({ ...res.data.order, items: res.data.items || [] });
      alert('Receipt uploaded and payment approved successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload receipt.');
      setAdminReceiptUpload((prev) => ({ ...prev, uploading: false }));
    }
  };

  const handleView = async (order) => {
    try {
      const res = await API.get(`/orders/${order.id}`);
      setSelectedOrder({ ...res.data.order, items: res.data.items || [] });
      setShowDetail(true);
    } catch {
      alert('Failed to load order details.');
    }
  };

  const downloadWaybill = (orderId) => {
    const token = localStorage.getItem('hamsaad_token');
    const BASE = process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app';
    window.open(`${BASE}/api/pdf/waybill/${orderId}?token=${token}`, '_blank');
  };
  const downloadInvoice = (orderId) => {
    const token = localStorage.getItem('hamsaad_token');
    const BASE = process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app';
    window.open(`${BASE}/api/pdf/invoice/${orderId}?token=${token}`, '_blank');
  };

  const totals = calcTotals();

  return (
    <div style={{ padding: '24px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1F3864', fontSize: '22px' }}>Orders</h2>
          <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: '13px' }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Order</button>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 2, minWidth: '220px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search order number or client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 32px 8px 32px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', lineHeight: 1 }}>×</button>
          )}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="confirmed">Confirmed</option>
          <option value="released">Released</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
          <option value="">All Payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="part_paid">Part Paid</option>
          <option value="paid">Paid</option>
        </select>
        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
        <button className="btn-secondary" onClick={fetchOrders}>Filter</button>
        <button className="btn-secondary" onClick={() => { setFilterStatus(''); setFilterFrom(''); setFilterTo(''); setFilterPaymentStatus(''); setSearchQuery(''); }}>Clear</button>
      </div>

      {/* ORDERS TABLE */}
      {(() => {
        const filteredOrders = orders.filter(o => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.trim().toLowerCase();
          return (
            o.order_number?.toLowerCase().includes(q) ||
            o.client_name?.toLowerCase().includes(q)
          );
        });
        return loading ? (
        <p style={{ color: '#6c757d' }}>Loading orders...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <p>{searchQuery ? `No orders matching "${searchQuery}"` : 'No orders found.'}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Client</th>
                <th>Total</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, color: '#1F3864', fontSize: '13px' }}>{order.order_number}</td>
                  <td style={{ fontSize: '13px' }}>{order.client_name}</td>
                  <td style={{ fontSize: '13px', fontWeight: 600 }}>{formatNGN(order.total_amount)}</td>
                  <td style={{ fontSize: '13px', color: '#dc3545' }}>
                    {parseFloat(order.total_discount) > 0 ? `- ${formatNGN(order.total_discount)}` : '—'}
                  </td>
                  <td>
                    <span style={{ ...statusColors[order.status], padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ ...(paymentColors[order.payment_status] || paymentColors.unpaid), padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {(order.payment_status || 'unpaid').replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#6c757d' }}>
                    {new Date(order.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleView(order)}>View</button>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => downloadWaybill(order.id)}>📄 WB</button>
                      <button className="btn-primary"   style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => downloadInvoice(order.id)}>🧾 INV</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      })()}

      {/* ═══════════════════════════════════════
          CREATE ORDER MODAL
      ═══════════════════════════════════════ */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content"
            style={{ maxWidth: '800px', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              background: '#1F3864', color: '#fff',
              padding: '18px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderRadius: '10px 10px 0 0',
            }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>New Order</h3>
              <button onClick={() => { setShowCreate(false); setForm({ client_id: '', notes: '', items: [emptyItem()] }); setFormError(''); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>

              {/* Client selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Client *
                </label>
                <select className="form-input" value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.client_id})</option>
                  ))}
                </select>
              </div>

              {/* Items section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#1F3864', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Order Items *
                  </label>
                  <button onClick={addItem}
                    style={{ background: '#e8f0fe', border: '1px solid #2E75B6', color: '#2E75B6', padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    + Add Item
                  </button>
                </div>

                {form.items.map((item, index) => {
                  const product     = products.find((p) => p.id === parseInt(item.product_id));
                  const qty         = parseFloat(item.quantity) || 0;
                  const unitPrice   = parseFloat(product?.selling_price) || 0;
                  const discPerUnit = parseFloat(item.discount_per_unit) || 0;
                  const lineTotal   = (unitPrice - discPerUnit) * qty;
                  const lineSaving  = discPerUnit * qty;
                  const warning     = getStockWarning(item);
                  const stockAvail  = product ? parseInt(product.quantity_in_stock) : null;

                  return (
                    <div key={index} style={{
                      border: `1px solid ${warning ? '#f5c6cb' : '#dee2e6'}`,
                      borderRadius: '8px',
                      marginBottom: '12px',
                      overflow: 'hidden',
                    }}>
                      {/* Item header bar */}
                      <div style={{
                        background: warning ? '#fff5f5' : '#f8f9fa',
                        padding: '10px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: `1px solid ${warning ? '#f5c6cb' : '#dee2e6'}`,
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#6c757d' }}>
                          ITEM {index + 1}
                        </span>
                        <button onClick={() => removeItem(index)}
                          disabled={form.items.length === 1}
                          style={{
                            background: 'none', border: 'none',
                            color: form.items.length === 1 ? '#ccc' : '#dc3545',
                            cursor: form.items.length === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '20px', lineHeight: 1, padding: '0 4px',
                          }}>×</button>
                      </div>

                      <div style={{ padding: '14px' }}>
                        {/* Product selector */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6c757d', marginBottom: '5px', textTransform: 'uppercase' }}>Product</label>
                          <select className="form-input" style={{ fontSize: '13px' }}
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}>
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.brand_name} — {p.name} {p.size_variant} ({p.unit}) | NGN {parseFloat(p.selling_price).toLocaleString()} | Stock: {p.quantity_in_stock}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Qty, Discount, Line Total */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6c757d', marginBottom: '5px', textTransform: 'uppercase' }}>
                              Quantity
                              {stockAvail !== null && (
                                <span style={{ marginLeft: '6px', color: warning ? '#dc3545' : '#28a745', fontWeight: 400, textTransform: 'none' }}>
                                  (max {stockAvail})
                                </span>
                              )}
                            </label>
                            <input type="number" min="1" className="form-input"
                              style={{ fontSize: '13px', borderColor: warning ? '#f5c6cb' : undefined }}
                              placeholder="0"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6c757d', marginBottom: '5px', textTransform: 'uppercase' }}>
                              Discount / Unit (NGN)
                            </label>
                            <input type="number" min="0" className="form-input"
                              style={{ fontSize: '13px' }}
                              placeholder="0.00"
                              value={item.discount_per_unit}
                              onChange={(e) => handleItemChange(index, 'discount_per_unit', e.target.value)} />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6c757d', marginBottom: '5px', textTransform: 'uppercase' }}>
                              Line Total
                            </label>
                            <div style={{
                              padding: '8px 12px', background: '#fff',
                              border: '1px solid #dee2e6', borderRadius: '6px',
                              fontSize: '14px', fontWeight: 700, color: '#1F3864',
                              minHeight: '38px', display: 'flex', alignItems: 'center',
                            }}>
                              {product && qty > 0
                                ? formatNGN(lineTotal)
                                : <span style={{ color: '#adb5bd', fontWeight: 400, fontSize: '13px' }}>—</span>}
                            </div>
                          </div>
                        </div>

                        {/* Stock warning */}
                        {warning && (
                          <div style={{
                            marginTop: '10px', padding: '8px 12px',
                            background: '#f8d7da', borderRadius: '6px',
                            fontSize: '12px', color: '#842029', display: 'flex', alignItems: 'center', gap: '6px',
                          }}>
                            ⚠️ {warning}
                          </div>
                        )}

                        {/* Saving indicator */}
                        {product && qty > 0 && lineSaving > 0 && !warning && (
                          <div style={{
                            marginTop: '10px', padding: '8px 12px',
                            background: '#d4edda', borderRadius: '6px',
                            fontSize: '12px', color: '#155724',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <span>Discount: NGN {discPerUnit.toLocaleString()} × {qty} units</span>
                            <span style={{ fontWeight: 700 }}>Saving: {formatNGN(lineSaving)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Notes (Optional)
                </label>
                <textarea className="form-input" rows={2}
                  placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Payment Method
                </label>
                <select style={{ width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  <option value="bank_transfer">🏦 Bank Transfer — Receipt required</option>
                  <option value="cash">💵 Cash — Mark as paid immediately</option>
                  <option value="pos">💳 POS — Mark as paid immediately</option>
                </select>
                {(form.payment_method === 'cash' || form.payment_method === 'pos') && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#155724', background: '#d4edda', padding: '6px 10px', borderRadius: '4px' }}>
                    ✅ Payment will be marked as <strong>PAID</strong> immediately — no receipt needed.
                  </p>
                )}
              </div>

              {/* Order Summary */}
              <div style={{
                background: '#1F3864', color: '#fff',
                borderRadius: '8px', padding: '18px 20px', marginBottom: '16px',
              }}>
                <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.8 }}>
                  Order Summary
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.7 }}>Subtotal</span>
                    <span>{formatNGN(totals.subtotal)}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffc107' }}>
                      <span>Total Discount</span>
                      <span>− {formatNGN(totals.totalDiscount)}</span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                    paddingTop: '12px', marginTop: '4px',
                    fontSize: '18px', fontWeight: 700,
                  }}>
                    <span>Total Payable</span>
                    <span>{formatNGN(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Stock error banner */}
              {hasStockErrors() && (
                <div style={{
                  background: '#f8d7da', border: '1px solid #f5c6cb',
                  borderRadius: '6px', padding: '10px 14px',
                  marginBottom: '12px', fontSize: '13px', color: '#842029',
                }}>
                  ⚠️ One or more items exceed available stock. Please correct before submitting.
                </div>
              )}

              {formError && (
                <div style={{
                  background: '#f8d7da', borderRadius: '6px',
                  padding: '10px 14px', marginBottom: '12px',
                  fontSize: '13px', color: '#842029',
                }}>
                  {formError}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary"
                  onClick={() => { setShowCreate(false); setForm({ client_id: '', notes: '', items: [emptyItem()] }); setFormError(''); }}>
                  Cancel
                </button>
                <button className="btn-primary"
                  onClick={handleCreate}
                  disabled={creating || hasStockErrors()}
                  style={{ opacity: (creating || hasStockErrors()) ? 0.6 : 1, minWidth: '130px' }}>
                  {creating ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ORDER DETAIL MODAL
      ═══════════════════════════════════════ */}
      {showDetail && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content"
            style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              background: '#1F3864', color: '#fff',
              padding: '18px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderRadius: '10px 10px 0 0',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{selectedOrder.order_number}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.7 }}>
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setShowDetail(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Status badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ ...statusColors[selectedOrder.status], padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {selectedOrder.status}
                </span>
                <span style={{ ...(paymentColors[selectedOrder.payment_status] || paymentColors.unpaid), padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {(selectedOrder.payment_status || 'unpaid').replace('_', ' ')}
                </span>
                {selectedOrder.payment_method && selectedOrder.payment_method !== 'bank_transfer' && (
                  <span style={{ background: '#e8edf5', color: '#1F3864', padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    {selectedOrder.payment_method === 'cash' ? '💵 Cash' : '💳 POS'}
                  </span>
                )}
                {selectedOrder.created_by_admin && (
                  <span style={{ background: '#fff3cd', color: '#856404', padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    🛡️ Admin Order
                  </span>
                )}
              </div>

              {/* Client info */}
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '14px', marginBottom: '20px', borderLeft: '4px solid #1F3864' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1F3864', fontSize: '14px' }}>
                  {selectedOrder.client_name}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
                  {selectedOrder.client_id_code}
                  {selectedOrder.phone && ` · ${selectedOrder.phone}`}
                  {selectedOrder.email && ` · ${selectedOrder.email}`}
                </p>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#1F3864', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</p>
                <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6c757d', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Product</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', color: '#6c757d', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', color: '#6c757d', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Unit Price</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', color: '#6c757d', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Disc/Unit</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', color: '#6c757d', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #dee2e6' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: '#1F3864' }}>{item.product_name}</div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>
                              {item.brand_name} · {item.size_variant} · {item.unit}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {item.unit_price ? formatNGN(item.unit_price) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc3545' }}>
                            {parseFloat(item.discount_per_unit) > 0 ? formatNGN(item.discount_per_unit) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1F3864' }}>
                            {item.total_price ? formatNGN(item.total_price) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                {parseFloat(selectedOrder.subtotal) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#6c757d' }}>
                    <span>Subtotal</span>
                    <span>{formatNGN(selectedOrder.subtotal)}</span>
                  </div>
                )}
                {parseFloat(selectedOrder.total_discount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#dc3545' }}>
                    <span>Total Discount</span>
                    <span>− {formatNGN(selectedOrder.total_discount)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '16px', fontWeight: 700, color: '#1F3864',
                  borderTop: '1px solid #dee2e6', paddingTop: '10px', marginTop: '4px',
                }}>
                  <span>Total</span>
                  <span>{formatNGN(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px', padding: '10px 14px', background: '#f8f9fa', borderRadius: '6px' }}>
                  <strong>Notes:</strong> {selectedOrder.notes}
                </p>
              )}

              {/* Admin receipt upload — only for bank transfer + unpaid/part_paid */}
              {selectedOrder.payment_method !== 'cash' && selectedOrder.payment_method !== 'pos' &&
               selectedOrder.payment_status !== 'paid' && (
                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#1F3864', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🧾 Upload Payment Receipt (on behalf of client)
                  </p>
                  {selectedOrder.payment_receipt_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#155724', background: '#d4edda', padding: '4px 10px', borderRadius: '4px' }}>
                        ✅ Receipt already uploaded
                      </span>
                      <button onClick={() => setDocViewer({ url: selectedOrder.payment_receipt_url, title: 'Payment Receipt' })}
                        style={{ fontSize: '12px', color: '#2E75B6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        👁 View
                      </button>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="file" accept="image/*,.pdf"
                      onChange={(e) => setAdminReceiptUpload({ orderId: selectedOrder.id, file: e.target.files[0], uploading: false })}
                      style={{ fontSize: '13px', flex: 1 }}
                    />
                    <button
                      onClick={handleAdminReceiptUpload}
                      disabled={adminReceiptUpload.orderId !== selectedOrder.id || !adminReceiptUpload.file || adminReceiptUpload.uploading}
                      style={{
                        background: (adminReceiptUpload.orderId === selectedOrder.id && adminReceiptUpload.file) ? '#1F3864' : '#adb5bd',
                        color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px',
                        fontWeight: 700, fontSize: '13px',
                        cursor: (adminReceiptUpload.orderId === selectedOrder.id && adminReceiptUpload.file) ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {adminReceiptUpload.uploading ? 'Uploading...' : '⬆ Upload & Approve'}
                    </button>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6c757d' }}>
                    Accepted: JPG, PNG, PDF · Max 5MB
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => {
                  const token = localStorage.getItem('hamsaad_token');
                  const BASE = process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app';
                  setDocViewer({ url: `${BASE}/api/pdf/invoice/${selectedOrder.id}?token=${token}`, title: 'Invoice' });
                }}>🧾 View Invoice</button>
              </div>

              {/* Document Viewer Modal */}
              <DocumentViewerModal doc={docViewer} onClose={() => setDocViewer(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
