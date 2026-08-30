import React, { useState, useEffect, useCallback } from 'react';
import API from '../../utils/api';

// ── Action metadata ───────────────────────────────────────────
const ACTION_META = {
  // Stock
  ADD_STOCK:         { label: 'Stock Added',          icon: '📦', color: '#155724', bg: '#d4edda' },
  REDUCE_STOCK:      { label: 'Stock Reduced',         icon: '📉', color: '#721C24', bg: '#f8d7da' },
  // Orders
  CREATE_ORDER:      { label: 'Order Created',         icon: '🛒', color: '#0c5460', bg: '#d1ecf1' },
  CONFIRM_ORDER:     { label: 'Order Confirmed',       icon: '✅', color: '#155724', bg: '#d4edda' },
  RELEASE_GOODS:     { label: 'Goods Released',        icon: '🚚', color: '#856404', bg: '#fff3cd' },
  COMPLETE_ORDER:    { label: 'Order Completed',       icon: '🏁', color: '#1F3864', bg: '#e8edf5' },
  // Clients
  CREATE_CLIENT:     { label: 'Client Registered',     icon: '👤', color: '#4a235a', bg: '#f3e8ff' },
  ENABLE_CLIENT:     { label: 'Client Enabled',        icon: '🔓', color: '#155724', bg: '#d4edda' },
  DISABLE_CLIENT:    { label: 'Client Disabled',       icon: '🔒', color: '#721C24', bg: '#f8d7da' },
  // Users
  CREATE_USER:       { label: 'User Created',          icon: '👷', color: '#1F3864', bg: '#e8edf5' },
  ENABLE_USER:       { label: 'User Enabled',          icon: '🔓', color: '#155724', bg: '#d4edda' },
  DISABLE_USER:      { label: 'User Disabled',         icon: '🔒', color: '#721C24', bg: '#f8d7da' },
  // Products
  CREATE_PRODUCT:    { label: 'Product Created',       icon: '🆕', color: '#0c5460', bg: '#d1ecf1' },
  UPDATE_PRODUCT:    { label: 'Product Updated',       icon: '✏️',  color: '#856404', bg: '#fff3cd' },
  DELETE_PRODUCT:    { label: 'Product Deleted',       icon: '🗑️',  color: '#721C24', bg: '#f8d7da' },
  CREATE_BRAND:      { label: 'Brand Created',         icon: '🏷️',  color: '#0c5460', bg: '#d1ecf1' },
  // Payments
  APPROVE_PAYMENT:   { label: 'Payment Approved',      icon: '💳', color: '#155724', bg: '#d4edda' },
  // Price alerts
  SEND_PRICE_ALERT:  { label: 'Price Alert Sent',      icon: '🔔', color: '#2E75B6', bg: '#e3f0ff' },
  // Complaints
  RESOLVE_COMPLAINT: { label: 'Complaint Resolved',    icon: '🤝', color: '#155724', bg: '#d4edda' },
};

const FILTER_GROUPS = [
  { value: 'all',        label: 'All Activity' },
  { value: 'stock',      label: '📦 Stock' },
  { value: 'orders',     label: '🛒 Orders' },
  { value: 'clients',    label: '👤 Clients' },
  { value: 'users',      label: '👷 Users' },
  { value: 'products',   label: '🆕 Products' },
  { value: 'payments',   label: '💳 Payments' },
  { value: 'alerts',     label: '🔔 Price Alerts' },
  { value: 'complaints', label: '🤝 Complaints' },
];

// ── Build human-readable description ─────────────────────────
const buildDescription = (log) => {
  try {
    const nv = log.new_values
      ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values)
      : {};
    const ov = log.old_values
      ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values)
      : {};

    switch (log.action) {
      case 'ADD_STOCK':
        return `Added ${nv.quantity || '?'} ${nv.unit || 'unit(s)'} of ${nv.productName || 'product'}. Stock: ${nv.quantityBefore ?? '?'} → ${nv.quantityAfter ?? '?'}`;
      case 'REDUCE_STOCK':
        return `Reduced ${nv.quantity || '?'} unit(s). Stock: ${nv.quantityBefore ?? '?'} → ${nv.quantityAfter ?? '?'}${nv.reason ? `. Reason: ${nv.reason}` : ''}`;
      case 'CREATE_ORDER':
        return `Order ${nv.orderNumber || ''} created`;
      case 'CONFIRM_ORDER':
        return `Order confirmed`;
      case 'RELEASE_GOODS':
        return `Goods released — stock deducted`;
      case 'COMPLETE_ORDER':
        return `Order marked as completed`;
      case 'UPLOAD_SCANNED_WAYBILL':
        return `Scanned waybill document uploaded`;
      case 'UPLOAD_SIGNED_WAYBILL':
        return `Signed waybill uploaded by client`;
      case 'APPROVE_WAYBILL':
        return `Waybill approved — order completed`;
      case 'CREATE_CLIENT':
        return `New client registered: ${nv.clientId || nv.full_name || ''}`;
      case 'ENABLE_CLIENT':
        return `Client "${nv.target_name || ''}" account enabled`;
      case 'DISABLE_CLIENT':
        return `Client "${nv.target_name || ''}" account disabled`;
      case 'CREATE_USER':
        return `New ${nv.role || 'staff'} created: ${nv.full_name || ''}`;
      case 'ENABLE_USER':
        return `Staff "${nv.target_name || ''}" account enabled`;
      case 'DISABLE_USER':
        return `Staff "${nv.target_name || ''}" account disabled`;
      case 'CREATE_PRODUCT':
        return `New product added${nv.name ? `: ${nv.name}` : ''}`;
      case 'UPDATE_PRODUCT': {
        const ovActive = ov.is_active !== undefined ? ov.is_active : null;
        const nvActive = nv.is_active !== undefined ? nv.is_active : null;
        if (ovActive === true  && nvActive === false) return `Product archived: ${nv.name || ''}`;
        if (ovActive === false && nvActive === true)  return `Product restored: ${nv.name || ''}`;
        const ovPrice = parseFloat(ov.selling_price || 0);
        const nvPrice = parseFloat(nv.selling_price || 0);
        if (ovPrice !== nvPrice && ovPrice > 0)
          return `Price updated: NGN ${ovPrice.toLocaleString('en-NG')} → NGN ${nvPrice.toLocaleString('en-NG')}${nv.name ? ` (${nv.name})` : ''}`;
        return `Product details updated${nv.name ? `: ${nv.name}` : ''}`;
      }
      case 'DELETE_PRODUCT':
        return `Product permanently deleted`;
      case 'CREATE_BRAND':
        return `New brand created: ${nv.name || ''}`;
      case 'APPROVE_PAYMENT':
        return `Payment approved${nv.order_number ? ` for order ${nv.order_number}` : ''}`;
      case 'UPLOAD_RECEIPT':
        return `Payment receipt uploaded by client`;
      case 'SEND_PRICE_ALERT': {
        if (nv.alert_type === 'brand') return `Brand price alert sent: ${nv.brand_name || ''} — to ${nv.sent_to || 'all clients'}`;
        return `Product price alert sent to ${nv.sent_to || 'all clients'}`;
      }
      case 'RESOLVE_COMPLAINT':
        return `Complaint resolved: "${nv.subject || ''}"`;
      default:
        return log.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
    }
  } catch {
    return log.action.replace(/_/g, ' ');
  }
};

const formatTime = (ts) => {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};

export default function ActivityLog() {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ action_type: filter, limit: 200 });
      if (fromDate) params.append('from_date', fromDate);
      if (toDate)   params.append('to_date', toDate);
      const res = await API.get(`/settings/activity-log?${params}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Activity log error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, fromDate, toDate]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Group logs by date
  const grouped = logs.reduce((acc, log) => {
    const { date } = formatTime(log.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1F3864', fontSize: '22px' }}>Activity Log</h2>
        <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: '13px' }}>
          Full audit trail of all actions across the system
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Action type */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', marginBottom: '5px' }}>Category</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '180px' }}
          >
            {FILTER_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', marginBottom: '5px' }}>From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', marginBottom: '5px' }}>To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
        </div>
        {(fromDate || toDate || filter !== 'all') && (
          <button
            onClick={() => { setFilter('all'); setFromDate(''); setToDate(''); }}
            style={{ background: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
          >✕ Clear</button>
        )}

        {/* Total count */}
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#6c757d', alignSelf: 'center' }}>
          {loading ? 'Loading...' : `${logs.length} record${logs.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Log entries grouped by date */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>Loading activity log...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d', background: '#fff', borderRadius: '10px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <p>No activity found for the selected filters.</p>
        </div>
      ) : Object.entries(grouped).map(([date, entries]) => (
        <div key={date} style={{ marginBottom: '24px' }}>
          {/* Date header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              {date}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#dee2e6' }} />
            <span style={{ fontSize: '11px', color: '#adb5bd', whiteSpace: 'nowrap' }}>{entries.length} action{entries.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Log cards */}
          {entries.map((log) => {
            const meta  = ACTION_META[log.action] || { label: log.action, icon: '🔵', color: '#1F3864', bg: '#e8edf5' };
            const { time } = formatTime(log.created_at);
            const desc  = buildDescription(log);

            return (
              <div key={log.id} style={{
                background: '#fff', borderRadius: '8px', padding: '14px 18px',
                marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '14px',
                borderLeft: `3px solid ${meta.color}`,
              }}>
                {/* Icon */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: meta.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{
                      background: meta.bg, color: meta.color,
                      padding: '2px 8px', borderRadius: '10px',
                      fontSize: '11px', fontWeight: 700,
                    }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#343a40', lineHeight: 1.4 }}>{desc}</div>
                </div>

                {/* Who + when */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1F3864' }}>{log.user_name}</div>
                  <div style={{ fontSize: '11px', color: '#adb5bd', marginTop: '2px' }}>{time}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
