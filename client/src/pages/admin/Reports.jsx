import React, { useState, useEffect, useCallback } from 'react';
import API from '../../utils/api';
import './Reports.css';
import DocumentViewerModal from '../../components/DocumentViewerModal';

// ─── HELPERS ─────────────────────────────────────────────────
const formatNGN = (value) => {
  const num = parseFloat(value || 0);
  return '₦' + num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const today = () => new Date().toISOString().split('T')[0];

// ─── STOCK TABLE COMPONENT ────────────────────────────────────
const StockTable = ({ data, stockKey, label }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="rp-empty">
        <span className="rp-empty-icon">📦</span>
        <p>No stock data for this date.</p>
      </div>
    );
  }

  return (
    <div className="rp-stock-section">
      {Object.entries(data).map(([brand, products]) => (
        <div key={brand} className="rp-brand-block">
          <div className="rp-brand-header">
            <span className="rp-brand-dot" />
            <h3>{brand}</h3>
            <span className="rp-brand-count">{products.length} products</span>
          </div>
          <table className="rp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Category</th>
                <th>Unit</th>
                <th className="rp-num">{label}</th>

              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p[stockKey] === 0 ? 'rp-zero-row' : ''}>
                  <td>{p.product_name}</td>
                  <td>{p.size_variant || '—'}</td>
                  <td>{p.category_name}</td>
                  <td>{p.unit}</td>
                  <td className="rp-num">
                    <span className={p[stockKey] === 0 ? 'rp-badge-zero' : 'rp-badge-qty'}>
                      {p[stockKey]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4"><strong>Brand Total</strong></td>
                <td className="rp-num">
                  <strong>{products.reduce((s, p) => s + (p[stockKey] || 0), 0)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────
const Reports = () => {
  const [section, setSection] = useState('daily'); // 'daily' | 'full' | 'documents'
  const [activeTab, setActiveTab] = useState('opening');
  const [selectedDate, setSelectedDate] = useState(today());

  // Daily report data
  const [openingStock, setOpeningStock] = useState(null);
  const [salesByBrand, setSalesByBrand] = useState(null);
  const [salesByProduct, setSalesByProduct] = useState(null);
  const [closingStock, setClosingStock] = useState(null);
  const [stockSummary, setStockSummary] = useState(null);

  // Full report data
  const [fullReport, setFullReport] = useState(null);
  const [filters, setFilters] = useState({ brands: [], categories: [], products: [] });
  const [fullFilters, setFullFilters] = useState({
    start_date: today(),
    end_date: today(),
    brand_id: '',
    category_id: '',
    product_id: ''
  });
  const [fullPage, setFullPage] = useState(1);

  // Order documents data
  const [docOrders, setDocOrders]       = useState([]);
  const [docSearch, setDocSearch]       = useState('');
  const [docDateFrom, setDocDateFrom]   = useState('');
  const [docDateTo, setDocDateTo]       = useState('');
  const [docLoading, setDocLoading]     = useState(false);
  const [docViewer, setDocViewer]       = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load filter options on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await API.get('/reports/filters');
        setFilters(res.data);
      } catch (err) {
        console.error('Could not load filters:', err.message);
      }
    };
    loadFilters();
  }, []);

  // Load daily report tab data
  const loadDailyTab = useCallback(async (tab, date) => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'opening') {
        const res = await API.get(`/reports/daily/opening-stock?date=${date}`);
        setOpeningStock(res.data);
      } else if (tab === 'brand') {
        const res = await API.get(`/reports/daily/sales-by-brand?date=${date}`);
        setSalesByBrand(res.data);
      } else if (tab === 'product') {
        const res = await API.get(`/reports/daily/sales-by-product?date=${date}`);
        setSalesByProduct(res.data);
      } else if (tab === 'closing') {
        const res = await API.get(`/reports/daily/closing-stock?date=${date}`);
        setClosingStock(res.data);
      } else if (tab === 'summary') {
        const res = await API.get(`/reports/daily/stock-summary?date=${date}`);
        setStockSummary(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when tab or date changes
  useEffect(() => {
    if (section === 'daily') {
      loadDailyTab(activeTab, selectedDate);
    }
  }, [section, activeTab, selectedDate, loadDailyTab]);

  // Load full report
  const loadFullReport = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        ...fullFilters,
        page,
        limit: 50
      });
      // Remove empty values
      [...params.entries()].forEach(([k, v]) => { if (!v) params.delete(k); });
      const res = await API.get(`/reports/full?${params.toString()}`);
      setFullReport(res.data);
      setFullPage(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [fullFilters]);

  useEffect(() => {
    if (section === 'full') {
      loadFullReport(1);
    }
  }, [section, loadFullReport]);

  // Load order documents
  const loadDocOrders = useCallback(async () => {
    setDocLoading(true);
    try {
      const res = await API.get('/orders');
      const completed = (res.data.orders || []).filter(o => o.status === 'completed');
      // Fetch waybill data for each completed order
      const withWaybills = await Promise.all(
        completed.map(async (o) => {
          try {
            const detail = await API.get(`/orders/${o.id}`);
            return { ...o, waybill: detail.data.waybill || {} };
          } catch { return { ...o, waybill: {} }; }
        })
      );
      setDocOrders(withWaybills);
    } catch { }
    finally { setDocLoading(false); }
  }, []);

  useEffect(() => {
    if (section === 'documents') loadDocOrders();
  }, [section, loadDocOrders]);

  const handlePrint = () => {
  const content = document.querySelector('.rp-tab-content') || 
                  document.querySelector('.rp-full-report') ||
                  document.querySelector('.rp-daily') ||
                  document.querySelector('.rp-full');
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>HAMSAAD LUBRICANTS — Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1f36; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #1F3864; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { padding: 8px 12px; border-bottom: 1px solid #e5eaf3; }
          tr:nth-child(even) td { background: #f8faff; }
          tfoot td { background: #f0f4ff; font-weight: 700; border-top: 2px solid #d1d9e6; }
          h2 { color: #1F3864; margin-bottom: 12px; font-size: 16px; }
          h3 { color: #1F3864; margin: 16px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header { background: #1F3864; color: #fff; padding: 16px 20px; margin-bottom: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
          .header p { font-size: 11px; opacity: 0.8; margin-top: 4px; }
          .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>HAMSAAD LUBRICANTS</h1>
            <p>Report printed on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        ${content ? content.innerHTML : '<p>No report content found.</p>'}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};

  // ── RENDER: Daily Report ──────────────────────────────────
  const renderDailyTab = () => {
    if (loading) return <div className="rp-loading"><div className="rp-spinner" /><span>Loading report...</span></div>;
    if (error) return <div className="rp-error">{error}</div>;

    if (activeTab === 'opening') {
      return openingStock ? (
        <StockTable data={openingStock.grouped_by_brand} stockKey="opening_stock" label="Opening Qty" />
      ) : null;
    }

    if (activeTab === 'brand') {
      if (!salesByBrand) return null;
      const { sales_by_brand, overall_total_qty, overall_total_value } = salesByBrand;
      if (!sales_by_brand || sales_by_brand.length === 0) {
        return (
          <div className="rp-empty">
            <span className="rp-empty-icon">📊</span>
            <p>No sales recorded on this date.</p>
          </div>
        );
      }
      return (
        <div className="rp-brand-sales">
          <table className="rp-table">
            <thead>
              <tr>
                <th>Brand / Company</th>
                <th className="rp-num">Qty Sold</th>
                <th className="rp-num">Total Sales (NGN)</th>
              </tr>
            </thead>
            <tbody>
              {sales_by_brand.map((b) => (
                <tr key={b.brand_name}>
                  <td>
                    <span className="rp-brand-pill">{b.brand_name}</span>
                  </td>
                  <td className="rp-num">{b.total_qty_sold.toLocaleString()}</td>
                  <td className="rp-num rp-value">{formatNGN(b.total_sales_value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="rp-total-row">
                <td><strong>Overall Total</strong></td>
                <td className="rp-num"><strong>{overall_total_qty.toLocaleString()}</strong></td>
                <td className="rp-num rp-value"><strong>{formatNGN(overall_total_value)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (activeTab === 'product') {
      if (!salesByProduct) return null;
      const { sales_by_product, grand_total_qty, grand_total_value } = salesByProduct;
      if (!sales_by_product || sales_by_product.length === 0) {
        return (
          <div className="rp-empty">
            <span className="rp-empty-icon">📊</span>
            <p>No sales recorded on this date.</p>
          </div>
        );
      }
      return (
        <div className="rp-product-sales">
          <table className="rp-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Category</th>
                <th>Product</th>
                <th>Size</th>
                <th>Unit</th>
                <th className="rp-num">Unit Price</th>
                <th className="rp-num">Qty Sold</th>
                <th className="rp-num">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {sales_by_product.map((r, i) => (
                <tr key={i}>
                  <td><span className="rp-brand-pill">{r.brand_name}</span></td>
                  <td>{r.category_name}</td>
                  <td>{r.product_name}</td>
                  <td>{r.size_variant || '—'}</td>
                  <td>{r.unit}</td>
                  <td className="rp-num">{formatNGN(r.unit_price)}</td>
                  <td className="rp-num">{r.total_qty_sold.toLocaleString()}</td>
                  <td className="rp-num rp-value">{formatNGN(r.total_sales_value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="rp-total-row">
                <td colSpan="5"><strong>Grand Total</strong></td>
                <td className="rp-num"><strong>{grand_total_qty.toLocaleString()}</strong></td>
                <td className="rp-num rp-value"><strong>{formatNGN(grand_total_value)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (activeTab === 'closing') {
      return closingStock ? (
        <StockTable data={closingStock.grouped_by_brand} stockKey="closing_stock" label="Closing Qty" />
      ) : null;
    }

    if (activeTab === 'summary') {
      if (!stockSummary) return null;
      const { grouped_by_brand, totals } = stockSummary;
      if (!grouped_by_brand || Object.keys(grouped_by_brand).length === 0) {
        return (
          <div className="rp-empty">
            <span className="rp-empty-icon">📈</span>
            <p>No stock data for this date.</p>
          </div>
        );
      }
      return (
        <div className="rp-summary-section">
          {/* Variance legend */}
          <div className="rp-variance-legend">
            <span className="rp-legend-item">
              <span className="rp-legend-dot rp-legend-ok" />
              No variance
            </span>
            <span className="rp-legend-item">
              <span className="rp-legend-dot rp-legend-warn" />
              Variance detected — closing does not match expected
            </span>
          </div>

          {Object.entries(grouped_by_brand).map(([brand, products]) => (
            <div key={brand} className="rp-brand-block">
              <div className="rp-brand-header">
                <span className="rp-brand-dot" />
                <h3>{brand}</h3>
                <span className="rp-brand-count">{products.length} products</span>
              </div>
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Unit</th>
                    <th className="rp-num">Opening</th>
                    <th className="rp-num">Stock In</th>
                    <th className="rp-num">Sales Out</th>
                    <th className="rp-num">Closing</th>
                    <th className="rp-num">Net Change</th>
                    <th className="rp-num">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={p.has_variance ? 'rp-variance-row' : ''}>
                      <td>{p.product_name}</td>
                      <td>{p.size_variant || '—'}</td>
                      <td>{p.unit}</td>
                      <td className="rp-num">{p.opening_stock.toLocaleString()}</td>
                      <td className="rp-num">
                        {p.stock_in > 0
                          ? <span className="rp-badge-in">+{p.stock_in}</span>
                          : <span className="rp-muted">—</span>}
                      </td>
                      <td className="rp-num">
                        {p.sales_out > 0
                          ? <span className="rp-badge-out">-{p.sales_out}</span>
                          : <span className="rp-muted">—</span>}
                      </td>
                      <td className="rp-num"><strong>{p.closing_stock.toLocaleString()}</strong></td>
                      <td className="rp-num">
                        <span className={p.net_change < 0 ? 'rp-net-neg' : p.net_change > 0 ? 'rp-net-pos' : 'rp-muted'}>
                          {p.net_change === 0 ? '—' : (p.net_change > 0 ? '+' : '') + p.net_change}
                        </span>
                      </td>
                      <td className="rp-num">
                        {p.has_variance
                          ? <span className="rp-variance-flag">⚠ {p.variance > 0 ? '+' : ''}{p.variance}</span>
                          : <span className="rp-variance-ok">✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Brand Total</strong></td>
                    <td className="rp-num"><strong>{products.reduce((s, p) => s + p.opening_stock, 0).toLocaleString()}</strong></td>
                    <td className="rp-num"><strong>{products.reduce((s, p) => s + p.stock_in, 0).toLocaleString()}</strong></td>
                    <td className="rp-num"><strong>{products.reduce((s, p) => s + p.sales_out, 0).toLocaleString()}</strong></td>
                    <td className="rp-num"><strong>{products.reduce((s, p) => s + p.closing_stock, 0).toLocaleString()}</strong></td>
                    <td className="rp-num"><strong>{products.reduce((s, p) => s + p.net_change, 0).toLocaleString()}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}

          {/* Grand totals */}
          <div className="rp-grand-total-bar">
            <div className="rp-gt-item">
              <span className="rp-gt-label">Total Opening</span>
              <span className="rp-gt-value">{totals.opening_stock.toLocaleString()}</span>
            </div>
            <div className="rp-gt-sep">→</div>
            <div className="rp-gt-item">
              <span className="rp-gt-label">Stock In</span>
              <span className="rp-gt-value rp-green">+{totals.stock_in.toLocaleString()}</span>
            </div>
            <div className="rp-gt-sep">→</div>
            <div className="rp-gt-item">
              <span className="rp-gt-label">Sales Out</span>
              <span className="rp-gt-value rp-red">-{totals.sales_out.toLocaleString()}</span>
            </div>
            <div className="rp-gt-sep">=</div>
            <div className="rp-gt-item">
              <span className="rp-gt-label">Total Closing</span>
              <span className="rp-gt-value rp-navy">{totals.closing_stock.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── RENDER: Full Report ───────────────────────────────────
  const renderFullReport = () => {
    if (loading) return <div className="rp-loading"><div className="rp-spinner" /><span>Loading report...</span></div>;
    if (error) return <div className="rp-error">{error}</div>;
    if (!fullReport) return null;

    const { records, pagination, summary } = fullReport;

    return (
      <div className="rp-full-report">
        {/* Summary bar */}
        <div className="rp-summary-bar">
          <div className="rp-summary-item">
            <span className="rp-summary-label">Total Records</span>
            <span className="rp-summary-value">{pagination.total_records.toLocaleString()}</span>
          </div>
          <div className="rp-summary-item">
            <span className="rp-summary-label">Total Qty Sold</span>
            <span className="rp-summary-value">{summary.total_qty.toLocaleString()}</span>
          </div>
          <div className="rp-summary-item">
            <span className="rp-summary-label">Total Sales Value</span>
            <span className="rp-summary-value rp-green">{formatNGN(summary.total_value)}</span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="rp-empty">
            <span className="rp-empty-icon">🔍</span>
            <p>No sales records match the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="rp-table-wrap">
              <table className="rp-table rp-table-full">
                <thead>
                  <tr>
                    <th>Order No.</th>
                    <th>Sale Date</th>
                    <th>Client</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Unit</th>
                    <th className="rp-num">Unit Price</th>
                    <th className="rp-num">Qty</th>
                    <th className="rp-num">Line Total</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}>
                      <td className="rp-mono">{r.order_number}</td>
                      <td>{formatDate(r.sale_date)}</td>
                      <td>{r.client_name}</td>
                      <td><span className="rp-brand-pill">{r.brand_name}</span></td>
                      <td>{r.category_name}</td>
                      <td>{r.product_name}</td>
                      <td>{r.size_variant || '—'}</td>
                      <td>{r.unit}</td>
                      <td className="rp-num">{formatNGN(r.unit_price)}</td>
                      <td className="rp-num">{r.qty_sold.toLocaleString()}</td>
                      <td className="rp-num rp-value">{formatNGN(r.line_total)}</td>
                      <td>
                        <span className={`rp-status rp-status-${r.payment_status}`}>
                          {r.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="rp-pagination">
                <button
                  className="rp-page-btn"
                  disabled={fullPage === 1}
                  onClick={() => loadFullReport(fullPage - 1)}
                >
                  ← Prev
                </button>
                <span className="rp-page-info">
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                <button
                  className="rp-page-btn"
                  disabled={fullPage === pagination.total_pages}
                  onClick={() => loadFullReport(fullPage + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ── MAIN RENDER ────────────────────────────────────────────
  return (
    <div className="rp-root">
      {/* Page Header */}
      <div className="rp-header">
        <div className="rp-header-left">
          <h1 className="rp-title">Reports</h1>
          <p className="rp-subtitle">Sales and stock intelligence for Hamsaad Lubricants </p>
        </div>
        <button className="rp-print-btn" onClick={handlePrint}>
          🖨 Print Report
        </button>
      </div>

      {/* Section Toggle */}
      <div className="rp-section-toggle">
        <button
          className={`rp-toggle-btn ${section === 'daily' ? 'active' : ''}`}
          onClick={() => setSection('daily')}
        >
          <span className="rp-toggle-icon">📅</span>
          Daily Report
        </button>
        <button
          className={`rp-toggle-btn ${section === 'full' ? 'active' : ''}`}
          onClick={() => setSection('full')}
        >
          <span className="rp-toggle-icon">📋</span>
          Full Report Breakdown
        </button>
        <button
          className={`rp-toggle-btn ${section === 'documents' ? 'active' : ''}`}
          onClick={() => setSection('documents')}
        >
          <span className="rp-toggle-icon">📁</span>
          Order Documents
        </button>
      </div>

      {/* ─── DAILY REPORT ─────────────────────────────────── */}
      {section === 'daily' && (
        <div className="rp-daily">
          {/* Date Selector */}
          <div className="rp-date-bar">
            <label className="rp-date-label">Report Date</label>
            <input
              type="date"
              className="rp-date-input"
              value={selectedDate}
              max={today()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <span className="rp-date-display">
              {formatDate(selectedDate)}
            </span>
          </div>

          {/* Tabs */}
          <div className="rp-tabs">
            <button
              className={`rp-tab ${activeTab === 'opening' ? 'active' : ''}`}
              onClick={() => setActiveTab('opening')}
            >
              <span className="rp-tab-num">01</span>
              Opening Stock
            </button>
            <button
              className={`rp-tab ${activeTab === 'brand' ? 'active' : ''}`}
              onClick={() => setActiveTab('brand')}
            >
              <span className="rp-tab-num">02</span>
              Sales by Brand
            </button>
            <button
              className={`rp-tab ${activeTab === 'product' ? 'active' : ''}`}
              onClick={() => setActiveTab('product')}
            >
              <span className="rp-tab-num">03</span>
              Sales by Product
            </button>
            <button
              className={`rp-tab ${activeTab === 'closing' ? 'active' : ''}`}
              onClick={() => setActiveTab('closing')}
            >
              <span className="rp-tab-num">04</span>
              Closing Stock
            </button>
            <button
              className={`rp-tab ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              <span className="rp-tab-num">05</span>
              Stock Movement Summary
            </button>
          </div>

          {/* Tab Content */}
          <div className="rp-tab-content">
            <div className="rp-tab-header">
              <h2 className="rp-tab-title">
                {activeTab === 'opening' && '📦 Opening Stock'}
                {activeTab === 'brand' && '📊 Sales by Brand / Company'}
                {activeTab === 'product' && '🏷 Sales by Product'}
                {activeTab === 'closing' && '🔒 Closing Stock'}
                {activeTab === 'summary' && '📈 Stock Movement Summary'}
              </h2>
              <span className="rp-tab-date">{formatDate(selectedDate)}</span>
            </div>
            {renderDailyTab()}
          </div>
        </div>
      )}

      {/* ─── FULL REPORT ───────────────────────────────────── */}
      {section === 'full' && (
        <div className="rp-full">
          {/* Filters */}
          <div className="rp-filters">
            <h3 className="rp-filters-title">Filters</h3>
            <div className="rp-filters-grid">
              <div className="rp-filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={fullFilters.start_date}
                  max={today()}
                  onChange={(e) => setFullFilters(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="rp-filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={fullFilters.end_date}
                  max={today()}
                  onChange={(e) => setFullFilters(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
              <div className="rp-filter-group">
                <label>Brand</label>
                <select
                  value={fullFilters.brand_id}
                  onChange={(e) => setFullFilters(f => ({ ...f, brand_id: e.target.value, product_id: '' }))}
                >
                  <option value="">All Brands</option>
                  {filters.brands.map(b => (
                    <option key={b.id} value={b.id}>{b.brand_name}</option>
                  ))}
                </select>
              </div>
              <div className="rp-filter-group">
                <label>Category</label>
                <select
                  value={fullFilters.category_id}
                  onChange={(e) => setFullFilters(f => ({ ...f, category_id: e.target.value, product_id: '' }))}
                >
                  <option value="">All Categories</option>
                  {filters.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.category_name}</option>
                  ))}
                </select>
              </div>
              <div className="rp-filter-group">
                <label>Product</label>
                <select
                  value={fullFilters.product_id}
                  onChange={(e) => setFullFilters(f => ({ ...f, product_id: e.target.value }))}
                >
                  <option value="">All Products</option>
                  {filters.products
                    .filter(p => !fullFilters.brand_id || p.brand_name === filters.brands.find(b => b.id === parseInt(fullFilters.brand_id))?.brand_name)
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.brand_name} — {p.product_name}</option>
                    ))}
                </select>
              </div>
              <div className="rp-filter-actions">
                <button
                  className="rp-apply-btn"
                  onClick={() => loadFullReport(1)}
                >
                  Apply Filters
                </button>
                <button
                  className="rp-reset-btn"
                  onClick={() => {
                    setFullFilters({ start_date: today(), end_date: today(), brand_id: '', category_id: '', product_id: '' });
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {renderFullReport()}
        </div>
      )}
      {/* ─── ORDER DOCUMENTS ──────────────────────────────── */}
      {section === 'documents' && (
        <div style={{ marginTop: '20px' }}>
          {/* Search and filter bar */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', border: '1px solid #e5eaf3', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '5px' }}>Search</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Order number or client name..."
                  value={docSearch}
                  onChange={e => setDocSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #d1d9e6', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '5px' }}>From Date</label>
              <input type="date" value={docDateFrom} onChange={e => setDocDateFrom(e.target.value)} max={today()}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d9e6', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '5px' }}>To Date</label>
              <input type="date" value={docDateTo} onChange={e => setDocDateTo(e.target.value)} max={today()}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d9e6', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            {(docSearch || docDateFrom || docDateTo) && (
              <button onClick={() => { setDocSearch(''); setDocDateFrom(''); setDocDateTo(''); }}
                style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d9e6', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-end' }}>
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5eaf3', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            {docLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px', color: '#6b7280' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid #e5eaf3', borderTopColor: '#2E75B6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Loading documents...
              </div>
            ) : (() => {
              const filtered = docOrders.filter(o => {
                const q = docSearch.trim().toLowerCase();
                const matchSearch = !q || o.order_number?.toLowerCase().includes(q) || o.client_name?.toLowerCase().includes(q);
                const orderDate = o.updated_at ? o.updated_at.split('T')[0] : '';
                const matchFrom = !docDateFrom || orderDate >= docDateFrom;
                const matchTo   = !docDateTo   || orderDate <= docDateTo;
                return matchSearch && matchFrom && matchTo;
              });

              if (filtered.length === 0) return (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <p style={{ margin: 0, fontWeight: '600' }}>No completed orders found</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Documents will appear here once orders are completed</p>
                </div>
              );

              return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8faff' }}>
                        {['Order No.', 'Client', 'Completed Date', 'Docs', 'Manager Waybill', 'Manager Delivery Note', 'Collector Waybill', 'Collector Delivery Note', 'Invoice'].map(h => (
                          <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid #e5eaf3', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(o => {
                        const w = o.waybill || {};
                        const docCount = [w.scanned_copy_url, w.delivery_note_url, w.signed_copy_url, w.signed_delivery_note_url].filter(Boolean).length + 1;
                        return (
                          <tr key={o.id} style={{ borderBottom: '1px solid #f0f3f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '11px 14px', fontWeight: '700', color: '#2E75B6', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{o.order_number}</td>
                            <td style={{ padding: '11px 14px', fontWeight: '600', color: '#1a1f36' }}>{o.client_name}</td>
                            <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(o.updated_at)}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <span style={{ background: docCount === 5 ? '#dcfce7' : '#fff3cd', color: docCount === 5 ? '#15803d' : '#856404', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                {docCount}/5
                              </span>
                            </td>
                            {[
                              { url: w.scanned_copy_url,          title: 'Manager Signed Waybill' },
                              { url: w.delivery_note_url,          title: 'Manager Delivery Note' },
                              { url: w.signed_copy_url,            title: 'Collector-Signed Waybill' },
                              { url: w.signed_delivery_note_url,   title: 'Collector-Signed Delivery Note' },
                              { url: `/api/pdf/invoice/${o.id}?token=${localStorage.getItem('hamsaad_token')}`, title: 'Invoice', alwaysAvailable: true },
                            ].map(({ url, title, alwaysAvailable }) => (
                              <td key={title} style={{ padding: '11px 14px' }}>
                                {(url || alwaysAvailable) ? (
                                  <button onClick={() => setDocViewer({ url, title })}
                                    style={{ background: '#f0f4ff', color: '#2E75B6', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    👁 View
                                  </button>
                                ) : (
                                  <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px', textAlign: 'right' }}>
            Showing completed orders only. Documents are finalised after manager approval.
          </p>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal doc={docViewer} onClose={() => setDocViewer(null)} />
    </div>
  );
};

export default Reports;