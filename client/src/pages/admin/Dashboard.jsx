import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import API from '../../utils/api';

import Products       from './Products';
import Orders         from './Orders';
import Users          from './Users';
import Clients        from './Clients';
import Catalogue      from './Catalogue';
import BrandsCategories from './BrandsCategories';
import Settings       from './Settings';
import ActivityLog    from './ActivityLog';
import Reports        from './Reports';
import StockReceipts from './StockReceipts';

// ─── MENU ────────────────────────────────────────────────────
const menuItems = [
  { path: '/admin',                   label: 'Dashboard',           icon: '📊' },
  { path: '/admin/products',          label: 'Products & Stock',    icon: '📦' },
  { path: '/admin/catalogue',         label: 'Product Catalogue',   icon: '📒' },
  { path: '/admin/orders',            label: 'Orders',              icon: '📋' },
  { path: '/admin/users',             label: 'Users',               icon: '👥' },
  { path: '/admin/clients',           label: 'Clients',             icon: '🤝' },
  { path: '/admin/brands-categories', label: 'Brands & Categories', icon: '🏷️' },
  { path: '/admin/activity-log',      label: 'Activity Log',        icon: '📜' },
  { path: '/admin/stock-receipts', label: 'Stock Receipts',         icon: '📥' },
  { path: '/admin/reports',           label: 'Reports',             icon: '📈' },
  { path: '/admin/settings',          label: 'Settings',            icon: '⚙️' },
  
];

// ─── HELPERS ─────────────────────────────────────────────────
const formatNGN = (value) => {
  const num = parseFloat(value || 0);
  return '₦' + num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNGNShort = (value) => {
  const num = parseFloat(value || 0);
  if (num >= 1_000_000_000) return '₦' + (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000)     return '₦' + (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)         return '₦' + (num / 1_000).toFixed(1) + 'K';
  return '₦' + num.toFixed(0);
};

const statusStyle = (status) => {
  const map = {
    created:   { bg: '#e0f2fe', color: '#0369a1', label: 'Created'   },
    confirmed: { bg: '#fef9c3', color: '#a16207', label: 'Confirmed' },
    released:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Released'  },
    completed: { bg: '#dcfce7', color: '#15803d', label: 'Completed' },
    cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
  };
  return map[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
};

const payStyle = (status) => {
  const map = {
    paid:      { bg: '#dcfce7', color: '#15803d', label: 'Paid'      },
    part_paid: { bg: '#fef9c3', color: '#a16207', label: 'Part Paid' },
    unpaid:    { bg: '#fee2e2', color: '#dc2626', label: 'Unpaid'    },
  };
  return map[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
};

// ─── STAT CARD ───────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon, color, danger, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background:   '#fff',
      borderRadius: '12px',
      padding:      '20px 22px',
      boxShadow:    '0 2px 10px rgba(0,0,0,0.07)',
      borderLeft:   `4px solid ${danger ? '#ef4444' : color}`,
      flex:         1,
      minWidth:     '180px',
      cursor:       onClick ? 'pointer' : 'default',
      transition:   'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'; }}}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
          {title}
        </p>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: danger ? '#dc2626' : '#1a1f36', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          {value}
        </h2>
        {sub && (
          <p style={{ color: danger ? '#ef4444' : '#9ca3af', fontSize: '12px', margin: 0, fontWeight: 500 }}>
            {sub}
          </p>
        )}
      </div>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: danger ? '#fee2e2' : `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', flexShrink: 0,
      }}>
        {icon}
      </div>
    </div>
  </div>
);

// ─── MINI BAR CHART ──────────────────────────────────────────
const SalesTrendChart = ({ trend }) => {
  if (!trend || trend.length === 0) return null;
  const maxVal = Math.max(...trend.map(d => d.sales_value), 1);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', marginBottom: '8px' }}>
        {trend.map((d, i) => {
          const heightPct = maxVal > 0 ? (d.sales_value / maxVal) * 100 : 0;
          const isToday   = i === trend.length - 1;
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, textAlign: 'center', marginBottom: '2px' }}>
                {d.sales_value > 0 ? formatNGNShort(d.sales_value) : ''}
              </div>
              <div
                style={{
                  width:        '100%',
                  height:       `${Math.max(heightPct, d.sales_value > 0 ? 4 : 1)}%`,
                  background:   isToday ? '#1F3864' : '#2E75B6',
                  borderRadius: '4px 4px 0 0',
                  opacity:      d.sales_value > 0 ? 1 : 0.2,
                  transition:   'height 0.4s ease',
                  minHeight:    '3px',
                  position:     'relative',
                }}
                title={`${d.label}: ${formatNGN(d.sales_value)} — ${d.order_count} orders`}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {trend.map((d, i) => (
          <div key={d.date} style={{
            flex: 1, textAlign: 'center',
            fontSize: '9px', color: i === trend.length - 1 ? '#1F3864' : '#9ca3af',
            fontWeight: i === trend.length - 1 ? 700 : 500,
          }}>
            {d.label.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SECTION CARD WRAPPER ─────────────────────────────────────
const Card = ({ title, subtitle, icon, action, actionLabel, children, minHeight }) => (
  <div style={{
    background: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    minHeight: minHeight || 'auto',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: '1px solid #f0f3f9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1a1f36' }}>{title}</h3>
          {subtitle && <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button onClick={action} style={{
          background: '#f0f4ff', border: 'none', color: '#1F3864',
          padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
          fontWeight: 600, cursor: 'pointer',
        }}>
          {actionLabel || 'View All'}
        </button>
      )}
    </div>
    <div style={{ padding: '16px 20px', flex: 1 }}>
      {children}
    </div>
  </div>
);

// ─── ADMIN HOME ───────────────────────────────────────────────
const AdminHome = () => {
  const navigate = useNavigate();

  const [stats,          setStats]          = useState(null);
  const [trend,          setTrend]          = useState([]);
  const [lowStock,       setLowStock]       = useState([]);
  const [recentOrders,   setRecentOrders]   = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [topProducts,    setTopProducts]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [lastUpdated,    setLastUpdated]    = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, trendRes, lowRes, ordersRes, payRes, topRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/dashboard/sales-trend'),
        API.get('/dashboard/low-stock'),
        API.get('/dashboard/recent-orders'),
        API.get('/dashboard/payment-summary'),
        API.get('/dashboard/top-products'),
      ]);
      setStats(statsRes.data);
      setTrend(trendRes.data.trend || []);
      setLowStock(lowRes.data.products || []);
      setRecentOrders(ordersRes.data.orders || []);
      setPaymentSummary(payRes.data.summary);
      setTopProducts(topRes.data.products || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', border: '4px solid #e5eaf3', borderTopColor: '#1F3864', borderRadius: '50%', animation: 'db-spin 0.7s linear infinite' }} />
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading dashboard...</p>
        <style>{`@keyframes db-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div style={{ padding: '24px 28px', background: '#f5f6fa', minHeight: '100vh' }}>

      {/* ── PAGE HEADER ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1a1f36', letterSpacing: '-0.3px' }}>
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '13px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button
          onClick={() => { setLoading(false); fetchAll(); }}
          style={{
            background: '#fff', border: '1px solid #e5eaf3', color: '#374151',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── ROW 1: STAT CARDS ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <StatCard
          title="Today's Sales"
          value={formatNGNShort(s.today_sales)}
          sub={`${s.today_orders || 0} orders today`}
          icon="💰" color="#1F3864"
          onClick={() => navigate('/admin/orders')}
        />
        <StatCard
          title="Pending Orders"
          value={s.pending_orders || 0}
          sub="Awaiting confirmation or release"
          icon="⏳" color="#f59e0b"
          danger={s.pending_orders > 10}
          onClick={() => navigate('/admin/orders')}
        />
        <StatCard
          title="Stock Value"
          value={formatNGNShort(s.total_stock_value)}
          sub="Current inventory value"
          icon="📦" color="#2E75B6"
          onClick={() => navigate('/admin/products')}
        />
        <StatCard
          title="Outstanding"
          value={formatNGNShort(s.outstanding_amount)}
          sub={`${s.outstanding_invoices || 0} unpaid invoices`}
          icon="🧾" color="#ef4444"
          danger={(s.outstanding_amount || 0) > 0}
          onClick={() => navigate('/admin/orders')}
        />
        <StatCard
          title="Active Clients"
          value={s.active_clients || 0}
          sub={`${s.total_products || 0} products in catalogue`}
          icon="🤝" color="#10b981"
          onClick={() => navigate('/admin/clients')}
        />
      </div>

      {/* ── ROW 2: SALES TREND + LOW STOCK ───────────────── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>

        {/* Sales Trend */}
        <div style={{ flex: '2', minWidth: '300px' }}>
          <Card title="7-Day Sales Trend" subtitle="Released & completed orders" icon="📊">
            <SalesTrendChart trend={trend} />
            {trend.length > 0 && (
              <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f3f9' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Week Total</p>
                  <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: '#1F3864' }}>
                    {formatNGN(trend.reduce((s, d) => s + d.sales_value, 0))}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Week Orders</p>
                  <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: '#1F3864' }}>
                    {trend.reduce((s, d) => s + d.order_count, 0)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Today</p>
                  <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: '#1F3864' }}>
                    {formatNGN(trend[trend.length - 1]?.sales_value || 0)}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ flex: '1', minWidth: '260px' }}>
          <Card
            title="Low Stock Alerts"
            subtitle={`${lowStock.length} product${lowStock.length !== 1 ? 's' : ''} below threshold`}
            icon="⚠️"
            action={() => navigate('/admin/products')}
            actionLabel="Manage Stock"
            minHeight="280px"
          >
            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#10b981' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>All stock levels healthy</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                {lowStock.map(p => {
                  const pct = Math.round((p.quantity_in_stock / p.threshold) * 100);
                  return (
                    <div key={p.id} style={{ padding: '10px 12px', background: '#fff8f8', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1a1f36' }}>
                            {p.name} {p.size_variant && <span style={{ fontWeight: 400, color: '#6b7280' }}>({p.size_variant})</span>}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>{p.brand_name} · {p.category_name}</p>
                        </div>
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {p.quantity_in_stock} {p.unit}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(pct, 100)}%`,
                          height: '100%',
                          background: pct < 25 ? '#dc2626' : pct < 50 ? '#f59e0b' : '#10b981',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#9ca3af' }}>
                        {pct}% of threshold ({p.threshold} {p.unit})
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── ROW 3: RECENT ORDERS + PAYMENT SUMMARY ─────── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>

        {/* Recent Orders */}
        <div style={{ flex: '2', minWidth: '300px' }}>
          <Card title="Recent Orders" subtitle="Last 8 orders in the system" icon="📋" action={() => navigate('/admin/orders')}>
            {recentOrders.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>No orders yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {['Order No.', 'Client', 'Amount', 'Status', 'Payment'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#9ca3af', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f0f3f9', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o, i) => {
                      const ss = statusStyle(o.status);
                      const ps = payStyle(o.payment_status);
                      return (
                        <tr
                          key={o.id}
                          onClick={() => navigate('/admin/orders')}
                          style={{ cursor: 'pointer', borderBottom: i < recentOrders.length - 1 ? '1px solid #f9fafb' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '10px 10px', fontWeight: 700, color: '#2E75B6', fontFamily: 'monospace', fontSize: '12px' }}>
                            {o.order_number}
                          </td>
                          <td style={{ padding: '10px 10px', color: '#374151', fontWeight: 500 }}>{o.client_name}</td>
                          <td style={{ padding: '10px 10px', fontWeight: 700, color: '#1a1f36' }}>
                            {o.total_amount ? formatNGN(o.total_amount) : '—'}
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ background: ss.bg, color: ss.color, padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                              {ss.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ background: ps.bg, color: ps.color, padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                              {ps.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Payment Summary */}
        <div style={{ flex: '1', minWidth: '240px' }}>
          <Card title="Payment Summary" subtitle="All invoices breakdown" icon="🧾">
            {paymentSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'paid',      label: 'Paid',      icon: '✅', bg: '#dcfce7', color: '#15803d' },
                  { key: 'part_paid', label: 'Part Paid', icon: '⏳', bg: '#fef9c3', color: '#a16207' },
                  { key: 'unpaid',    label: 'Unpaid',    icon: '❌', bg: '#fee2e2', color: '#dc2626' },
                ].map(({ key, label, icon, bg, color }) => {
                  const d = paymentSummary[key] || {};
                  return (
                    <div key={key} style={{ background: bg, borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>{icon}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color }}>{label}</span>
                        </div>
                        <span style={{ fontSize: '12px', color, fontWeight: 600 }}>
                          {d.count || 0} invoice{(d.count || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color }}>
                        {formatNGN(key === 'paid' ? d.amount_paid : d.amount_outstanding)}
                      </p>
                      {key !== 'paid' && d.count > 0 && (
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color, opacity: 0.8 }}>
                          Outstanding amount
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No data</p>
            )}
          </Card>
        </div>
      </div>

      {/* ── ROW 4: TOP SELLING PRODUCTS ───────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <Card
          title="Top Selling Products"
          subtitle={`This month — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
          icon="🏆"
          action={() => navigate('/admin/reports')}
          actionLabel="Full Report"
        >
          {topProducts.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>
              No sales recorded this month yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['#', 'Product', 'Brand', 'Category', 'Size', 'Unit', 'Qty Sold', 'Total Value'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Qty Sold' || h === 'Total Value' ? 'right' : 'left', color: '#9ca3af', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f0f3f9', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} style={{ borderBottom: i < topProducts.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                          background: i === 0 ? '#fef9c3' : i === 1 ? '#f3f4f6' : i === 2 ? '#fff7ed' : '#f9fafb',
                          color: i === 0 ? '#a16207' : i === 1 ? '#6b7280' : i === 2 ? '#c2410c' : '#9ca3af',
                        }}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1a1f36' }}>{p.product_name}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#eef2ff', color: '#1F3864', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                          {p.brand_name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{p.category_name}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{p.size_variant || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{p.unit}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1F3864' }}>
                        {parseInt(p.total_qty).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                        {formatNGN(p.total_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
};

// ─── ADMIN DASHBOARD WRAPPER ──────────────────────────────────
const AdminDashboard = () => (
  <Layout menuItems={menuItems}>
    <Routes>
      <Route path="/"                   element={<AdminHome />} />
      <Route path="/products"           element={<Products />} />
      <Route path="/catalogue"          element={<Catalogue />} />
      <Route path="/orders"             element={<Orders />} />
      <Route path="/users"              element={<Users />} />
      <Route path="/clients"            element={<Clients />} />
      <Route path="/brands-categories"  element={<BrandsCategories />} />
      <Route path="/activity-log"       element={<ActivityLog />} />
      <Route path="/reports"            element={<Reports />} />
      <Route path="/settings"           element={<Settings />} />
      <Route path="/stock-receipts"     element={<StockReceipts />} />
    </Routes>
  </Layout>
);

export default AdminDashboard;
