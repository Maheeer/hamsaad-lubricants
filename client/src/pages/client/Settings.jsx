import React, { useState, useEffect } from 'react';
import API from '../../utils/api';

export default function Settings() {
  const [settings, setSettings]     = useState({
    bank_account_name:   '',
    bank_account_number: '',
    bank_name:           '',
    company_name:        '',
    company_address:     '',
    company_phone:       '',
    company_email:       '',
  });
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab]   = useState('bank');
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [respondForm, setRespondForm] = useState({ id: null, text: '', status: 'resolved' });
  const [pendingReceipts, setPendingReceipts] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [sRes, cRes, oRes] = await Promise.all([
        API.get('/settings'),
        API.get('/settings/complaints'),
        API.get('/orders'),
      ]);
      setSettings((prev) => ({ ...prev, ...sRes.data.settings }));
      setComplaints(cRes.data.complaints || []);

      // Orders with uploaded receipt awaiting approval
      const pending = (oRes.data.orders || []).filter(
        (o) => o.payment_status === 'part_paid'
      );
      setPendingReceipts(pending);
    } catch (err) {
      console.error('Settings load error:', err.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg('');
      await API.put('/settings', { settings });
      setMsg('success:Settings saved successfully.');
    } catch {
      setMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePayment = async (orderId) => {
    if (!window.confirm('Approve this payment and mark invoice as PAID?')) return;
    try {
      await API.post(`/settings/approve-payment/${orderId}`);
      setMsg('success:Payment approved. Invoice marked as paid.');
      await loadAll();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to approve payment.');
    }
  };

  const handleRespond = async (complaintId) => {
    if (!respondForm.text) return alert('Please enter a response.');
    try {
      await API.put(`/settings/complaints/${complaintId}/respond`, {
        admin_response: respondForm.text,
        status:         respondForm.status,
      });
      setRespondForm({ id: null, text: '', status: 'resolved' });
      setMsg('success:Response sent to client.');
      await loadAll();
    } catch {
      setMsg('Failed to send response.');
    }
  };

  const tabs = [
    { key: 'bank',      label: '🏦 Bank Details' },
    { key: 'company',   label: '🏢 Company Info' },
    { key: 'payments',  label: `💳 Payment Approvals${pendingReceipts.length > 0 ? ` (${pendingReceipts.length})` : ''}` },
    { key: 'complaints', label: `📝 Complaints${complaints.filter((c) => c.status === 'open').length > 0 ? ` (${complaints.filter((c) => c.status === 'open').length})` : ''}` },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1F3864', fontSize: '22px' }}>Settings</h2>
        <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: '13px' }}>
          Manage bank details, company information and client requests
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #dee2e6', marginBottom: '24px' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              border: 'none', background: 'none', padding: '12px 18px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              color: activeTab === t.key ? '#1F3864' : '#6c757d',
              borderBottom: activeTab === t.key ? '3px solid #1F3864' : '3px solid transparent',
              whiteSpace: 'nowrap',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{
          background: msg.startsWith('success:') ? '#d4edda' : '#f8d7da',
          borderRadius: '6px', padding: '10px 16px', marginBottom: '20px',
          fontSize: '13px', color: msg.startsWith('success:') ? '#155724' : '#842029',
        }}>
          {msg.replace('success:', '')}
        </div>
      )}

      {/* ── BANK DETAILS ── */}
      {activeTab === 'bank' && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '560px' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1F3864', fontSize: '16px' }}>Bank Account Details</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6c757d' }}>
            These details are shown to clients when they place an order and select bank transfer.
          </p>

          {[
            { label: 'Bank Name',       key: 'bank_name',           placeholder: 'e.g. First Bank of Nigeria' },
            { label: 'Account Name',    key: 'bank_account_name',   placeholder: 'e.g. HAMSAAD Industries Ltd' },
            { label: 'Account Number',  key: 'bank_account_number', placeholder: 'e.g. 0123456789' },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {field.label}
              </label>
              <input
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder={field.placeholder}
                value={settings[field.key] || ''}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
              />
            </div>
          ))}

          <button onClick={handleSave} disabled={saving}
            style={{
              background: '#1F3864', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 28px',
              fontWeight: 700, cursor: 'pointer', fontSize: '14px',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? 'Saving...' : 'Save Bank Details'}
          </button>
        </div>
      )}

      {/* ── COMPANY INFO ── */}
      {activeTab === 'company' && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '560px' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1F3864', fontSize: '16px' }}>Company Information</h3>

          {[
            { label: 'Company Name',    key: 'company_name',    placeholder: 'HAMSAAD Industries' },
            { label: 'Address',         key: 'company_address', placeholder: 'Company address' },
            { label: 'Phone',           key: 'company_phone',   placeholder: '+234...' },
            { label: 'Email',           key: 'company_email',   placeholder: 'info@hamsaad.com' },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {field.label}
              </label>
              <input
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder={field.placeholder}
                value={settings[field.key] || ''}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
              />
            </div>
          ))}

          <button onClick={handleSave} disabled={saving}
            style={{
              background: '#1F3864', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 28px',
              fontWeight: 700, cursor: 'pointer', fontSize: '14px',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? 'Saving...' : 'Save Company Info'}
          </button>
        </div>
      )}

      {/* ── PAYMENT APPROVALS ── */}
      {activeTab === 'payments' && (
        <div>
          <h3 style={{ margin: '0 0 16px', color: '#1F3864', fontSize: '16px' }}>Pending Payment Approvals</h3>
          {pendingReceipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d', background: '#fff', borderRadius: '10px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <p>No pending payment approvals.</p>
            </div>
          ) : (
            pendingReceipts.map((order) => (
              <div key={order.id} style={{
                background: '#fff', borderRadius: '10px', padding: '20px',
                marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1F3864' }}>{order.order_number}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>{order.client_name}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px' }}>
                      NGN {parseFloat(order.total_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {order.payment_receipt_url && (
                      <a
                        href={`${process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app'}${order.payment_receipt_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2E75B6', fontSize: '13px', fontWeight: 600 }}
                      >
                        View Receipt
                      </a>
                    )}
                    <button onClick={() => handleApprovePayment(order.id)}
                      style={{
                        background: '#28a745', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '8px 18px',
                        fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                      }}>
                      Approve Payment
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── COMPLAINTS ── */}
      {activeTab === 'complaints' && (
        <div>
          <h3 style={{ margin: '0 0 16px', color: '#1F3864', fontSize: '16px' }}>Client Complaints</h3>
          {complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d', background: '#fff', borderRadius: '10px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
              <p>No complaints received.</p>
            </div>
          ) : (
            complaints.map((c) => (
              <div key={c.id} style={{
                background: '#fff', borderRadius: '10px', padding: '20px',
                marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${c.status === 'open' ? '#dc3545' : '#28a745'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1F3864' }}>{c.subject}</span>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>
                      {c.client_name} · {c.client_id_code}
                    </span>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                    background: c.status === 'open' ? '#f8d7da' : '#d4edda',
                    color: c.status === 'open' ? '#721C24' : '#155724',
                  }}>
                    {c.status}
                  </span>
                </div>
                {c.order_number && (
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#6c757d' }}>Order: {c.order_number}</p>
                )}
                <p style={{ margin: '0 0 10px', fontSize: '13px' }}>{c.message}</p>

                {c.admin_response && (
                  <div style={{ background: '#e8f0fe', borderRadius: '6px', padding: '10px', fontSize: '13px', marginBottom: '10px' }}>
                    <strong>Your response:</strong> {c.admin_response}
                  </div>
                )}

                {c.status === 'open' && respondForm.id !== c.id && (
                  <button onClick={() => setRespondForm({ id: c.id, text: '', status: 'resolved' })}
                    style={{ background: 'none', border: '1px solid #1F3864', color: '#1F3864', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    Respond
                  </button>
                )}

                {respondForm.id === c.id && (
                  <div style={{ marginTop: '10px' }}>
                    <textarea
                      rows={3}
                      style={{ width: '100%', padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px', resize: 'vertical' }}
                      placeholder="Type your response..."
                      value={respondForm.text}
                      onChange={(e) => setRespondForm({ ...respondForm, text: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={respondForm.status}
                        onChange={(e) => setRespondForm({ ...respondForm, status: e.target.value })}
                        style={{ padding: '6px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }}>
                        <option value="resolved">Mark as Resolved</option>
                        <option value="in_progress">Mark as In Progress</option>
                      </select>
                      <button onClick={() => handleRespond(c.id)}
                        style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                        Send Response
                      </button>
                      <button onClick={() => setRespondForm({ id: null, text: '', status: 'resolved' })}
                        style={{ background: 'none', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#6c757d' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
