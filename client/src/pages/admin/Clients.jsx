import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../../utils/api';

const formatNGN = (v) =>
  `NGN ${parseFloat(v || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

// ── Collapsible section wrapper ───────────────────────────────
const Section = ({ title, badge, badgeColor = '#dc3545', children, open, onToggle }) => {
  return (
    <div style={{ marginBottom: '16px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div
        onClick={onToggle}
        style={{
          background: '#1F3864', color: '#fff',
          padding: '14px 20px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{title}</span>
          {badge !== undefined && (
            <span style={{
              background: badgeColor, color: '#fff',
              borderRadius: '10px', padding: '2px 10px',
              fontSize: '12px', fontWeight: 700,
            }}>{badge}</span>
          )}
        </div>
        <span style={{ fontSize: '18px', opacity: 0.8 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ background: '#fff', padding: '20px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function Clients() {
  // ── Section open state ────────────────────────────────────────
  const [openSections, setOpenSections] = useState({ clients: true, complaints: false, payments: false, alerts: false });
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Data state ────────────────────────────────────────────────
  const [clients, setClients]         = useState([]);
  const [complaints, setComplaints]   = useState([]);
  const [pendingPay, setPendingPay]   = useState([]);
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [brands, setBrands]           = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading]         = useState(true);

  // ── Create client form ────────────────────────────────────────
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState({ full_name: '', email: '', phone: '', address: '', credit_terms: '', status: 'active' });
  const [formError, setFormError]     = useState('');
  const [creating, setCreating]       = useState(false);

  // ── Confirm prospect ──────────────────────────────────────────
  const [confirmingId, setConfirmingId] = useState(null);

  // ── Price alert form ──────────────────────────────────────────
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({ alert_type: 'brand', brand_name: '', products: [{ product_id: '', name: '', direction: 'increase' }], target: 'all', client_ids: [] });
  const [alertMsg, setAlertMsg]       = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);

  // ── Complaint thread ──────────────────────────────────────────
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [replyText, setReplyText]     = useState({});
  const [replyStatus, setReplyStatus] = useState({});
  const [replying, setReplying]       = useState({});
  const bottomRefs                    = useRef({});

  // ── Receipt modal ─────────────────────────────────────────────
  const [receiptModal, setReceiptModal] = useState(null);

  // ── Load everything ───────────────────────────────────────────
  const loadAll = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const [cRes, compRes, oRes, alertsRes, brandsRes, prodsRes] = await Promise.all([
        API.get('/users/clients'),
        API.get('/settings/complaints'),
        API.get('/orders'),
        API.get('/settings/price-alerts'),
        API.get('/products/brands'),
        API.get('/products'),
      ]);
      setClients(cRes.data.clients || []);
      setComplaints(compRes.data.complaints || []);
      setPendingPay((oRes.data.orders || []).filter((o) => o.payment_status === 'part_paid'));
      setPriceAlerts(alertsRes.data.alerts || []);
      setBrands(brandsRes.data.brands || []);
      setAllProducts(prodsRes.data.products || []);
    } catch (err) {
      console.error('Clients load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(true);
    const interval = setInterval(() => loadAll(false), 30000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // ── Create client ─────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError('');
    if (!form.full_name.trim()) return setFormError('Client name is required.');
    try {
      setCreating(true);
      await API.post('/users/clients', form);
      setShowCreate(false);
      setForm({ full_name: '', email: '', phone: '', address: '', credit_terms: '', status: 'active' });
      await loadAll(true);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create client.');
    } finally {
      setCreating(false);
    }
  };

  // ── Confirm prospect as full client ───────────────────────────
  const handleConfirmProspect = async (id, name) => {
    if (!window.confirm(`Confirm ${name} as a full Hamsaad client? A permanent Hamsaad ID will be assigned.`)) return;
    try {
      setConfirmingId(id);
      await API.patch(`/users/clients/${id}/confirm`);
      await loadAll(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm client.');
    } finally {
      setConfirmingId(null);
    }
  };

  // ── Toggle client ─────────────────────────────────────────────
  const handleToggle = async (id, isActive) => {
    if (!window.confirm(`${isActive ? 'Disable' : 'Enable'} this client?`)) return;
    try {
      await API.patch(`/users/clients/${id}/toggle`);
      await loadAll(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update client.');
    }
  };

  // ── Reset client password ─────────────────────────────────────
  const handleResetPassword = async (id, clientIdCode) => {
    if (!window.confirm(`Reset password for ${clientIdCode} to default (Client ID)?`)) return;
    try {
      await API.patch(`/users/clients/${id}/reset-password`);
      alert('Password reset to default (Client ID).');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  // ── Approve payment ───────────────────────────────────────────
  const handleApprovePayment = async (orderId) => {
    if (!window.confirm('Approve this payment and mark invoice as PAID?')) return;
    try {
      await API.post(`/settings/approve-payment/${orderId}`);
      await loadAll(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve payment.');
    }
  };

  // ── Complaint reply ───────────────────────────────────────────
  const handleReply = async (complaintId) => {
    const text = replyText[complaintId];
    if (!text?.trim()) return;
    try {
      setReplying((prev) => ({ ...prev, [complaintId]: true }));
      await API.post(`/settings/complaints/${complaintId}/reply`, {
        message: text,
        status:  replyStatus[complaintId] || 'in_progress',
      });
      // Optimistically add message to UI immediately
      const newMsg = {
        id: Date.now(),
        complaint_id: complaintId,
        sender_type: 'admin',
        sender_name: 'Support Team',
        message: text,
        created_at: new Date().toISOString(),
      };
      setComplaints((prev) => prev.map((c) =>
        c.id === complaintId
          ? { ...c, messages: [...(c.messages || []), newMsg], status: replyStatus[complaintId] || 'in_progress' }
          : c
      ));
      setReplyText((prev) => ({ ...prev, [complaintId]: '' }));
      setTimeout(() => {
        bottomRefs.current[complaintId]?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      // Then refresh in background to get server-accurate data
      loadAll(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setReplying((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  // ── Send price alert ──────────────────────────────────────────
  // ── Send price alert ──────────────────────────────────────────
  const handleSendAlert = async () => {
    setAlertMsg('');
    if (alertForm.alert_type === 'brand' && !alertForm.brand_name.trim()) {
      return setAlertMsg('Brand name is required.');
    }
    if (alertForm.alert_type === 'product') {
      if (!alertForm.products.length || alertForm.products.some((p) => !p.product_id)) {
        return setAlertMsg('Please select a product for each row.');
      }
    }
    try {
      setSendingAlert(true);
      await API.post('/settings/notify-price', {
        alert_type: alertForm.alert_type,
        brand_name: alertForm.brand_name,
        products:   alertForm.products,
        client_ids: alertForm.target === 'specific' ? alertForm.client_ids : [],
      });
      setAlertMsg('success:Price alert sent successfully.');
      setAlertForm({ alert_type: 'brand', brand_name: '', products: [{ product_id: '', name: '', direction: 'increase' }], target: 'all', client_ids: [] });
      setShowAlertForm(false);
      setOpenSections((prev) => ({ ...prev, alerts: true }));
      await loadAll(true);
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to send alert.');
    } finally {
      setSendingAlert(false);
    }
  };


  if (loading) return <div style={{ padding: '24px', color: '#6c757d' }}>Loading...</div>;

  const openComplaints = complaints.filter((c) => c.status !== 'resolved').length;

  return (
    <div style={{ padding: '24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1F3864', fontSize: '22px' }}>Clients</h2>
        <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: '13px' }}>
          Manage clients, complaints, payments and price alerts
        </p>
      </div>

      {/* ══ 1. CLIENT LIST ══════════════════════════════════════ */}
      <Section title="👥 Client List" badge={clients.length} badgeColor="#1F3864" open={openSections.clients} onToggle={() => toggleSection('clients')}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={() => setShowCreate(true)} style={{
            background: '#1F3864', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '9px 20px', fontWeight: 700,
            fontSize: '13px', cursor: 'pointer',
          }}>+ Add Client</button>
        </div>

        {clients.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No clients yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Client ID', 'Name', 'Phone', 'Email', 'Type', 'Account', 'Portal', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #dee2e6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const isProspect = c.status === 'prospect';
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0', background: isProspect ? '#fffbf0' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: isProspect ? '#856404' : '#1F3864', fontSize: '13px' }}>
                        {c.client_id || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Pending</span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>{c.full_name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6c757d' }}>{c.phone || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6c757d' }}>{c.email || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: isProspect ? '#fff3cd' : '#d4edda',
                          color: isProspect ? '#856404' : '#155724',
                          padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600
                        }}>
                          {isProspect ? '🔍 Prospect' : '✅ Client'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: c.is_active ? '#d4edda' : '#f8d7da', color: c.is_active ? '#155724' : '#721C24', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: c.has_password ? '#d4edda' : '#fff3cd', color: c.has_password ? '#155724' : '#856404', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                          {c.has_password ? 'Activated' : 'Never logged in'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {isProspect && (
                            <button
                              onClick={() => handleConfirmProspect(c.id, c.full_name)}
                              disabled={confirmingId === c.id}
                              style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: confirmingId === c.id ? 0.7 : 1 }}
                            >
                              {confirmingId === c.id ? 'Confirming...' : '✅ Confirm as Client'}
                            </button>
                          )}
                          <button onClick={() => handleToggle(c.id, c.is_active)} style={{
                            background: c.is_active ? '#f8d7da' : '#d4edda',
                            color: c.is_active ? '#721C24' : '#155724',
                            border: 'none', borderRadius: '6px', padding: '4px 10px',
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          }}>{c.is_active ? 'Disable' : 'Enable'}</button>
                          <button onClick={() => handleResetPassword(c.id, c.client_id || c.full_name)} style={{
                            background: '#f0f4f8', color: '#1F3864',
                            border: '1px solid #dee2e6', borderRadius: '6px', padding: '4px 10px',
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          }}>Reset PWD</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add client modal */}
        {showCreate && (
          <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>
              <div style={{ background: '#1F3864', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Add New Client</span>
                <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Client Type */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '8px', textTransform: 'uppercase' }}>Client Type *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { value: 'prospect', label: '🔍 Prospect', desc: 'Evaluating — no Hamsaad ID yet', bg: '#fffbf0', border: '#ffc107', color: '#856404' },
                      { value: 'active',   label: '✅ Full Client', desc: 'Confirmed — assign Hamsaad ID', bg: '#f0fff4', border: '#28a745', color: '#155724' },
                    ].map(opt => (
                      <div key={opt.value} onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                        style={{ flex: 1, border: `2px solid ${form.status === opt.value ? opt.border : '#dee2e6'}`, borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', background: form.status === opt.value ? opt.bg : '#fff', transition: 'all 0.15s' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: form.status === opt.value ? opt.color : '#333' }}>{opt.label}</div>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {[
                  { label: 'Full Name *',            key: 'full_name',     placeholder: 'Client or company name' },
                  { label: 'Email',                  key: 'email',         placeholder: 'client@email.com' },
                  { label: 'Phone',                  key: 'phone',         placeholder: '+234...' },
                  { label: 'Address',                key: 'address',       placeholder: 'Business address' },
                  { label: 'Credit Terms (days)',    key: 'credit_terms',  placeholder: 'e.g. 30' },
                ].map((field) => (
                  <div key={field.key} style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '5px', textTransform: 'uppercase' }}>{field.label}</label>
                    <input
                      placeholder={field.placeholder}
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                {form.status === 'prospect' && (
                  <div style={{ background: '#fff3cd', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#856404' }}>
                    ⚠️ This client will be added as a <strong>Prospect</strong>. They can place orders but will not have a Hamsaad ID until you confirm them later.
                  </div>
                )}
                {formError && <p style={{ color: '#dc3545', fontSize: '13px', margin: '0 0 12px' }}>{formError}</p>}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCreate(false)} style={{ background: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                  <button onClick={handleCreate} disabled={creating} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', opacity: creating ? 0.7 : 1 }}>
                    {creating ? 'Creating...' : form.status === 'prospect' ? 'Add as Prospect' : 'Create Client'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ══ 2. CLIENT COMPLAINTS ════════════════════════════════ */}
      <Section title="📝 Client Complaints" badge={openComplaints > 0 ? openComplaints : undefined} badgeColor="#dc3545" open={openSections.complaints} onToggle={() => toggleSection('complaints')}>
        {complaints.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No complaints received.</p>
        ) : complaints.map((c) => {
          const isExpanded  = expandedComplaint === c.id;
          const isResolved  = c.status === 'resolved';
          const borderColor = isResolved ? '#28a745' : c.status === 'in_progress' ? '#ffc107' : '#dc3545';
          const statusStyle = {
            open:        { background: '#f8d7da', color: '#721C24' },
            in_progress: { background: '#fff3cd', color: '#856404' },
            resolved:    { background: '#d4edda', color: '#155724' },
          }[c.status] || { background: '#f8d7da', color: '#721C24' };

          return (
            <div key={c.id} style={{ borderRadius: '8px', marginBottom: '10px', border: '1px solid #dee2e6', borderLeft: `4px solid ${borderColor}`, overflow: 'hidden' }}>
              {/* Header row */}
              <div onClick={() => setExpandedComplaint(isExpanded ? null : c.id)}
                style={{ padding: '13px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F3864' }}>{c.subject}</span>
                    <span style={{ ...statusStyle, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>
                    {c.client_name} · {c.client_id_code}
                    {c.order_number && ` · Order: ${c.order_number}`}
                    {` · ${(c.messages || []).length} message${(c.messages || []).length !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <span style={{ color: '#6c757d', fontSize: '16px', marginLeft: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Thread */}
              {isExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid #dee2e6' }}>
                  <div style={{ marginBottom: '14px', maxHeight: '320px', overflowY: 'auto' }}>
                    {(c.messages || []).map((m, i) => {
                      const isAdmin = m.sender_type === 'admin';
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#adb5bd', marginBottom: '3px' }}>
                            {isAdmin ? '🛡️ Admin' : `👤 ${m.sender_name}`}
                            {' · '}
                            {new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{
                            maxWidth: '80%', padding: '8px 12px', borderRadius: '8px',
                            background: isAdmin ? '#1F3864' : '#f0f4f8',
                            color: isAdmin ? '#fff' : '#1F3864',
                            fontSize: '13px', lineHeight: 1.5,
                            borderBottomRightRadius: isAdmin ? '2px' : '8px',
                            borderBottomLeftRadius:  isAdmin ? '8px' : '2px',
                          }}>
                            {m.message}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={(el) => { bottomRefs.current[c.id] = el; }} />
                  </div>

                  {isResolved ? (
                    <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '10px', fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>
                      🔒 This complaint is resolved and closed.
                    </div>
                  ) : (
                    <div>
                      <textarea rows={3} placeholder="Type your reply..."
                        value={replyText[c.id] || ''}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '8px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select value={replyStatus[c.id] || 'in_progress'}
                          onChange={(e) => setReplyStatus((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }}>
                          <option value="in_progress">Mark as In Progress</option>
                          <option value="resolved">Mark as Resolved</option>
                        </select>
                        <button onClick={() => handleReply(c.id)}
                          disabled={!replyText[c.id]?.trim() || replying[c.id]}
                          style={{ background: replyText[c.id]?.trim() ? '#1F3864' : '#adb5bd', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 18px', fontWeight: 700, cursor: replyText[c.id]?.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
                          {replying[c.id] ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Section>

      {/* ══ 3. PAYMENT APPROVALS ════════════════════════════════ */}
      <Section title="💳 Payment Approvals" badge={pendingPay.length > 0 ? pendingPay.length : undefined} badgeColor="#E67E22" open={openSections.payments} onToggle={() => toggleSection('payments')}>
        {pendingPay.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <p style={{ margin: 0 }}>No pending payment approvals.</p>
          </div>
        ) : pendingPay.map((order) => (
          <div key={order.id} style={{ border: '1px solid #dee2e6', borderLeft: '4px solid #E67E22', borderRadius: '8px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1F3864' }}>{order.order_number}</div>
              <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>{order.client_name}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>{formatNGN(order.total_amount)}</div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              {order.payment_receipt_url ? (
                <button onClick={() => setReceiptModal(`http://localhost:5000${order.payment_receipt_url}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2E75B6', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                  📄 View Receipt
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#adb5bd', fontStyle: 'italic' }}>No receipt uploaded yet</span>
              )}
              <button onClick={() => handleApprovePayment(order.id)}
                disabled={!order.payment_receipt_url}
                style={{ background: order.payment_receipt_url ? '#28a745' : '#adb5bd', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px', fontWeight: 700, cursor: order.payment_receipt_url ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
                ✅ Approve Payment
              </button>
            </div>
          </div>
        ))}
      </Section>

      {/* ══ 4. PRICE ALERTS ════════════════════════════════════ */}
      <Section title="🔔 Price Alerts" badge={priceAlerts.length > 0 ? priceAlerts.length : undefined} badgeColor="#2E75B6" open={openSections.alerts} onToggle={() => toggleSection('alerts')}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={() => { setShowAlertForm(!showAlertForm); setOpenSections((prev) => ({ ...prev, alerts: true })); }} style={{
            background: showAlertForm ? '#6c757d' : '#1F3864', color: '#fff',
            border: 'none', borderRadius: '8px', padding: '9px 20px',
            fontWeight: 700, fontSize: '13px', cursor: 'pointer',
          }}>
            {showAlertForm ? '✕ Cancel' : '+ Send Price Alert'}
          </button>
        </div>

        {/* ── Alert form ── */}
        {showAlertForm && (
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '20px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
            <h4 style={{ margin: '0 0 16px', color: '#1F3864', fontSize: '14px' }}>New Price Alert</h4>

            {/* ── Type cards ── */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '8px', textTransform: 'uppercase' }}>Alert Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { value: 'brand',   label: '🏷️ Brand Alert',   desc: 'General notice for an entire brand' },
                  { value: 'product', label: '📦 Product Alert',  desc: 'Specific products with increase / decrease' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setAlertForm((prev) => ({ ...prev, alert_type: opt.value, brand_name: '', products: [{ product_id: '', name: '', direction: 'increase' }] }))}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                      border: `2px solid ${alertForm.alert_type === opt.value ? '#1F3864' : '#dee2e6'}`,
                      background: alertForm.alert_type === opt.value ? '#eef2f8' : '#fff',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1F3864', marginBottom: '3px' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Brand alert ── */}
            {alertForm.alert_type === 'brand' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase' }}>Brand *</label>
                <select
                  value={alertForm.brand_name}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, brand_name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="">— Select brand —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                {alertForm.brand_name && (
                  <div style={{ marginTop: '10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#856404' }}>
                    <strong>Preview:</strong> The price of all <strong>{alertForm.brand_name}</strong> products will be changing in the coming days. Please contact us for more information.
                  </div>
                )}
              </div>
            )}

            {/* ── Product alert ── */}
            {alertForm.alert_type === 'product' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '8px', textTransform: 'uppercase' }}>Products</label>

                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 36px', gap: '8px', marginBottom: '6px', padding: '0 4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' }}>Product</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' }}>Direction</span>
                  <span />
                </div>

                {(alertForm.products || []).map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 36px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <select
                      value={p.product_id || ''}
                      onChange={(e) => {
                        const selected = allProducts.find((x) => String(x.id) === e.target.value);
                        setAlertForm((prev) => ({
                          ...prev,
                          products: prev.products.map((item, idx) =>
                            idx === i
                              ? { ...item, product_id: e.target.value, name: selected ? selected.name : '' }
                              : item
                          ),
                        }));
                      }}
                      style={{ padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '100%' }}
                    >
                      <option value="">— Select product —</option>
                      {allProducts.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} {prod.brand_name ? `(${prod.brand_name})` : ''}
                        </option>
                      ))}
                    </select>

                    <select
                      value={p.direction}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAlertForm((prev) => ({
                          ...prev,
                          products: prev.products.map((item, idx) =>
                            idx === i ? { ...item, direction: val } : item
                          ),
                        }));
                      }}
                      style={{ padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '100%' }}
                    >
                      <option value="increase">↑ Price Increase</option>
                      <option value="decrease">↓ Price Decrease</option>
                    </select>

                    {(alertForm.products || []).length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setAlertForm((prev) => ({ ...prev, products: prev.products.filter((_, idx) => idx !== i) }))}
                        style={{ background: '#f8d7da', color: '#721C24', border: 'none', borderRadius: '6px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', fontWeight: 700 }}
                      >×</button>
                    ) : <div />}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setAlertForm((prev) => ({ ...prev, products: [...(prev.products || []), { product_id: '', name: '', direction: 'increase' }] }))}
                  style={{ background: '#fff', color: '#1F3864', border: '1px dashed #1F3864', borderRadius: '6px', padding: '7px 16px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}
                >+ Add Another Product</button>
              </div>
            )}

            {/* ── Send to ── */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '8px', textTransform: 'uppercase' }}>Send To</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                {[{ value: 'all', label: 'All Clients' }, { value: 'specific', label: 'Specific Clients' }].map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="alertTarget"
                      value={opt.value}
                      checked={alertForm.target === opt.value}
                      onChange={() => setAlertForm((prev) => ({ ...prev, target: opt.value, client_ids: [] }))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {alertForm.target === 'specific' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase' }}>Select Clients</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px', background: '#fff' }}>
                  {clients.filter((c) => c.is_active).map((c) => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(alertForm.client_ids || []).includes(c.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAlertForm((prev) => ({
                            ...prev,
                            client_ids: checked
                              ? [...(prev.client_ids || []), c.id]
                              : (prev.client_ids || []).filter((id) => id !== c.id),
                          }));
                        }}
                      />
                      {c.full_name} <span style={{ color: '#6c757d', fontSize: '12px' }}>({c.client_id})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {alertMsg && (
              <div style={{ background: alertMsg.startsWith('success:') ? '#d4edda' : '#f8d7da', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', fontSize: '13px', color: alertMsg.startsWith('success:') ? '#155724' : '#842029' }}>
                {alertMsg.replace('success:', '')}
              </div>
            )}

            <button
              type="button"
              onClick={handleSendAlert}
              disabled={sendingAlert}
              style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', opacity: sendingAlert ? 0.7 : 1 }}
            >
              {sendingAlert ? 'Sending...' : '📢 Send Alert'}
            </button>
          </div>
        )}

        {/* ── Alert history ── */}
        {priceAlerts.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px 0', margin: 0 }}>No price alerts sent yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Type', 'Alert Details', 'Sent To', 'Sent By', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #dee2e6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceAlerts.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: a.alert_type === 'brand' ? '#e3f0ff' : '#fff3cd',
                        color:      a.alert_type === 'brand' ? '#1F3864'  : '#856404',
                        padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      }}>
                        {a.alert_type === 'brand' ? '🏷️ Brand' : '📦 Product'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', maxWidth: '340px' }}>
                      {a.alert_type === 'brand' ? (
                        <span>{a.brand_name} — General price change notice</span>
                      ) : (
                        <div>
                          {(typeof a.products === 'string' ? JSON.parse(a.products) : a.products || []).map((p, i) => (
                            <div key={i} style={{ fontSize: '12px', color: p.direction === 'increase' ? '#721C24' : '#155724' }}>
                              {p.direction === 'increase' ? '↑' : '↓'} {p.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6c757d' }}>{a.sent_to}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6c757d' }}>{a.sent_by_name || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6c757d', whiteSpace: 'nowrap' }}>
                      {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── RECEIPT MODAL ─────────────────────────────────────── */}
      {receiptModal && (
        <div onClick={() => setReceiptModal(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '24px', boxSizing: 'border-box' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', maxWidth: '700px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#1F3864', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Payment Receipt</span>
              <button onClick={() => setReceiptModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
              {receiptModal.toLowerCase().endsWith('.pdf') ? (
                <iframe src={receiptModal} style={{ width: '100%', height: '70vh', border: 'none' }} title="Receipt" />
              ) : (
                <img src={receiptModal} alt="Payment Receipt" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '6px' }} />
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <a href={receiptModal} target="_blank" rel="noreferrer" style={{ color: '#2E75B6', fontSize: '13px', fontWeight: 600, padding: '8px 16px', border: '1px solid #2E75B6', borderRadius: '6px', textDecoration: 'none' }}>
                Open in New Tab
              </a>
              <button onClick={() => setReceiptModal(null)} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
