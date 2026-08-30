import React, { useState, useEffect } from 'react';
import API from '../../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    bank_account_name: '', bank_account_number: '',
    bank_name: '', company_name: '', company_address: '',
    company_phone: '', company_email: '',
  });
  const [activeTab, setActiveTab] = useState('bank');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await API.get('/settings');
      setSettings((prev) => ({ ...prev, ...res.data.settings }));
    } catch (err) {
      console.error('Settings load error:', err.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true); setMsg('');
      await API.put('/settings', { settings });
      setMsg('success:Settings saved successfully.');
    } catch {
      setMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'bank',    label: '🏦 Bank Details' },
    { key: 'company', label: '🏢 Company Info' },
  ];

  const fields = {
    bank: [
      { label: 'Bank Name',       key: 'bank_name',           placeholder: 'e.g. First Bank of Nigeria' },
      { label: 'Account Name',    key: 'bank_account_name',   placeholder: 'e.g. HAMSAAD Industries Ltd' },
      { label: 'Account Number',  key: 'bank_account_number', placeholder: 'e.g. 0123456789' },
    ],
    company: [
      { label: 'Company Name',    key: 'company_name',    placeholder: 'HAMSAAD Industries' },
      { label: 'Address',         key: 'company_address', placeholder: 'Company address' },
      { label: 'Phone',           key: 'company_phone',   placeholder: '+234...' },
      { label: 'Email',           key: 'company_email',   placeholder: 'info@hamsaad.com' },
    ],
  };

  const note = {
    bank:    'These details are shown to clients when they place an order and select bank transfer.',
    company: 'Company information used in PDF documents (invoices and waybills).',
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1F3864', fontSize: '22px' }}>Settings</h2>
        <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: '13px' }}>
          Bank details and company information. Client management is under the Clients menu.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #dee2e6', marginBottom: '24px' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            border: 'none', background: 'none', padding: '12px 20px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            color: activeTab === t.key ? '#1F3864' : '#6c757d',
            borderBottom: activeTab === t.key ? '3px solid #1F3864' : '3px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {msg && (
        <div style={{
          background: msg.startsWith('success:') ? '#d4edda' : '#f8d7da',
          borderRadius: '6px', padding: '10px 16px', marginBottom: '20px',
          fontSize: '13px', color: msg.startsWith('success:') ? '#155724' : '#842029',
        }}>{msg.replace('success:', '')}</div>
      )}

      <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '560px' }}>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6c757d' }}>{note[activeTab]}</p>

        {(fields[activeTab] || []).map((field) => (
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

        <button onClick={handleSave} disabled={saving} style={{
          background: '#1F3864', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
          opacity: saving ? 0.7 : 1,
        }}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  );
}
