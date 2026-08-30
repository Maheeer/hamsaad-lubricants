import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getAllProducts, getAllBrands, getAllCategories, updateProduct } from '../../utils/api';

// ── Design tokens ────────────────────────────────────────────
const T = {
  navy:      '#1F3864',
  blue:      '#2E75B6',
  lightBlue: '#EBF3FB',
  green:     '#1E7E34',
  lightGreen:'#EAF6ED',
  red:       '#C0392B',
  orange:    '#E67E22',
  white:     '#ffffff',
  offWhite:  '#F7F9FC',
  border:    '#E2EAF4',
  textDark:  '#1A2340',
  textMid:   '#5A6A85',
  textLight: '#8FA3BF',
};

// Brand colour pool — each brand gets a unique accent
const brandAccents = [
  { bg: '#1F3864', light: '#EBF3FB', dot: '#2E75B6' },
  { bg: '#7B2D8B', light: '#F5EEF8', dot: '#9B59B6' },
  { bg: '#1A6B4A', light: '#EAF6F1', dot: '#27AE60' },
  { bg: '#B7410E', light: '#FDF0EB', dot: '#E67E22' },
  { bg: '#2C3E50', light: '#EBF0F5', dot: '#5D8AA8' },
  { bg: '#8B1A1A', light: '#FAEAEA', dot: '#C0392B' },
];

const Catalogue = () => {
  const [products, setProducts]     = useState([]);
  const [brands, setBrands]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterBrand, setFilterBrand]       = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchName, setSearchName]         = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState({});
  const printRef = useRef();

  const fetchData = async () => {
    try {
      const [p, b, c] = await Promise.all([
        getAllProducts(),
        getAllBrands(),
        getAllCategories(),
      ]);
      setProducts(p.data.products);
      setBrands(b.data.brands);
      setCategories(c.data.categories);
      // Expand all brands by default
      const expanded = {};
      b.data.brands.forEach(br => { expanded[br.name] = true; });
      setExpandedBrands(expanded);
    } catch (err) {
      toast.error('Failed to load catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = products.filter((p) => {
    const matchBrand    = filterBrand    ? p.brand_id    === parseInt(filterBrand)    : true;
    const matchCategory = filterCategory ? p.category_id === parseInt(filterCategory) : true;
    const matchName     = searchName
      ? p.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    return matchBrand && matchCategory && matchName;
  });

  // Group: brand → category → products[]
  const grouped = {};
  filteredProducts.forEach((p) => {
    if (!grouped[p.brand_name]) grouped[p.brand_name] = {};
    if (!grouped[p.brand_name][p.category_name])
      grouped[p.brand_name][p.category_name] = [];
    grouped[p.brand_name][p.category_name].push(p);
  });
  const brandNames = Object.keys(grouped).sort();

  const toggleBrand = (name) =>
    setExpandedBrands(prev => ({ ...prev, [name]: !prev[name] }));

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price.');
      return;
    }
    setUpdating(true);
    try {
      await updateProduct(selectedProduct.id, { selling_price: parseFloat(newPrice) });
      toast.success(`Price updated — NGN ${parseFloat(newPrice).toLocaleString()}`);
      setShowPriceModal(false);
      setSelectedProduct(null);
      setNewPrice('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update price.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head>
        <title>HAMSAAD Product Catalogue</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:Arial,sans-serif;font-size:10pt;color:#1A2340;padding:24px;background:#fff}
          .ph{text-align:center;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1F3864}
          .ph h1{font-size:22pt;color:#1F3864;letter-spacing:3px;font-weight:900}
          .ph p{font-size:9pt;color:#5A6A85;margin-top:6px}
          .brand-block{margin-bottom:28px;border-radius:8px;overflow:hidden;border:1px solid #E2EAF4}
          .brand-hdr{padding:12px 18px;font-size:13pt;font-weight:800;color:#fff;display:flex;justify-content:space-between;align-items:center}
          .cat-hdr{padding:7px 18px;font-size:10pt;font-weight:700;color:#1F3864;background:#EBF3FB;border-bottom:1px solid #E2EAF4}
          table{width:100%;border-collapse:collapse}
          th{background:#2E75B6;color:#fff;padding:8px 12px;text-align:left;font-size:9pt;font-weight:700}
          td{padding:8px 12px;border-bottom:1px solid #E2EAF4;font-size:9pt}
          tr:nth-child(even) td{background:#F7F9FC}
          .price{font-weight:800;color:#1E7E34}
          .pf{margin-top:28px;text-align:center;color:#8FA3BF;font-size:8pt;border-top:1px solid #E2EAF4;padding-top:12px}
          @media print{button{display:none!important}}
        </style>
      </head><body>
        <div class="ph">
          <h1>HAMSAAD</h1>
          <p>Product Catalogue &mdash; Prices as at ${new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric'
          })}</p>
        </div>
        ${content}
        <div class="pf">HAMSAAD Inventory &amp; Sales Management &mdash; CONFIDENTIAL &mdash; Admin Use Only</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #EBF3FB', borderTop: '4px solid #2E75B6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: T.textMid, fontSize: '14px' }}>Loading catalogue...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const diff = newPrice && selectedProduct
    ? parseFloat(newPrice) - parseFloat(selectedProduct.selling_price)
    : 0;

  return (
    <div style={{ width: '100%' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: T.navy, letterSpacing: '0.5px' }}>
              Product Catalogue
            </h1>
            <p style={{ color: T.textMid, fontSize: '13px', marginTop: '4px' }}>
              {filteredProducts.length} products across {brandNames.length} brand{brandNames.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={fetchData}
              style={{
                background: T.white, color: T.blue,
                border: '1.5px solid ' + T.blue,
                borderRadius: '8px', padding: '9px 16px',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: T.navy, color: T.white,
                border: 'none', borderRadius: '8px',
                padding: '9px 18px', fontWeight: '700',
                fontSize: '13px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(31,56,100,0.3)',
              }}
            >
              ⬇ Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{
        background: T.white, borderRadius: '12px',
        padding: '16px 20px', marginBottom: '24px',
        boxShadow: '0 2px 12px rgba(31,56,100,0.07)',
        border: '1px solid ' + T.border,
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: T.textLight, fontSize: '14px',
          }}>🔍</span>
          <input
            placeholder="Search product name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              border: '1.5px solid ' + T.border, borderRadius: '8px',
              fontSize: '13px', color: T.textDark, outline: 'none',
              background: T.offWhite,
            }}
          />
        </div>

        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={{
            flex: 1, minWidth: '160px', padding: '9px 12px',
            border: '1.5px solid ' + T.border, borderRadius: '8px',
            fontSize: '13px', color: T.textDark, background: T.offWhite,
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            flex: 1, minWidth: '160px', padding: '9px 12px',
            border: '1.5px solid ' + T.border, borderRadius: '8px',
            fontSize: '13px', color: T.textDark, background: T.offWhite,
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {(filterBrand || filterCategory || searchName) && (
          <button
            onClick={() => { setFilterBrand(''); setFilterCategory(''); setSearchName(''); }}
            style={{
              background: '#FDF0EB', color: T.red,
              border: '1.5px solid #F5C6BC',
              borderRadius: '8px', padding: '9px 14px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Catalogue content ── */}
      <div ref={printRef}>
        {brandNames.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: T.white, borderRadius: '12px',
            border: '1px dashed ' + T.border, color: T.textMid,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p style={{ fontSize: '15px', fontWeight: '600' }}>No products match your filters</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Try adjusting your search or clearing the filters</p>
          </div>
        ) : (
          brandNames.map((brandName, brandIndex) => {
            const accent = brandAccents[brandIndex % brandAccents.length];
            const categoryNames = Object.keys(grouped[brandName]).sort();
            const totalInBrand = Object.values(grouped[brandName]).flat().length;
            const isExpanded = expandedBrands[brandName] !== false;

            return (
              <div
                key={brandName}
                className="brand-block"
                style={{
                  marginBottom: '20px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(31,56,100,0.09)',
                  border: '1px solid ' + T.border,
                }}
              >
                {/* Brand Header */}
                <div
                  className="brand-hdr"
                  style={{
                    background: accent.bg,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleBrand(brandName)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      🏷
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '800', fontSize: '15px', letterSpacing: '0.3px' }}>
                        {brandName}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>
                        {categoryNames.length} categor{categoryNames.length !== 1 ? 'ies' : 'y'} &middot; {totalInBrand} product{totalInBrand !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '4px 12px', borderRadius: '20px',
                      color: '#fff', fontSize: '12px', fontWeight: '700',
                    }}>
                      {totalInBrand} Products
                    </div>
                    <span style={{ color: '#fff', fontSize: '18px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▾
                    </span>
                  </div>
                </div>

                {/* Brand body */}
                {isExpanded && (
                  <div>
                    {categoryNames.map((categoryName, catIndex) => {
                      const catProducts = grouped[brandName][categoryName];
                      return (
                        <div key={categoryName}>

                          {/* Category Header */}
                          <div className="cat-hdr" style={{
                            background: accent.light,
                            padding: '9px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            borderTop: catIndex > 0 ? '1px solid ' + T.border : 'none',
                            borderBottom: '1px solid ' + T.border,
                          }}>
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: accent.dot, flexShrink: 0,
                            }} />
                            <span style={{
                              fontWeight: '700', fontSize: '13px',
                              color: accent.bg, letterSpacing: '0.2px',
                            }}>
                              {categoryName}
                            </span>
                            <span style={{
                              marginLeft: 'auto', fontSize: '11px',
                              color: T.textLight, fontWeight: '600',
                            }}>
                              {catProducts.length} item{catProducts.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Products */}
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                {['Product Name', 'Size Variant', 'Unit', 'Selling Price (NGN)', 'Action'].map((h) => (
                                  <th key={h} style={{
                                    background: '#F7F9FC',
                                    color: T.textMid,
                                    padding: '9px 20px',
                                    textAlign: 'left',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase',
                                    borderBottom: '1px solid ' + T.border,
                                  }}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {catProducts.map((product, idx) => (
                                <tr
                                  key={product.id}
                                  style={{
                                    background: idx % 2 === 0 ? T.white : T.offWhite,
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = accent.light}
                                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? T.white : T.offWhite}
                                >
                                  <td style={{
                                    padding: '11px 20px',
                                    fontWeight: '600', fontSize: '13px',
                                    color: T.textDark,
                                    borderBottom: '1px solid ' + T.border,
                                  }}>
                                    {product.name}
                                  </td>
                                  <td style={{
                                    padding: '11px 20px', fontSize: '13px',
                                    color: T.textMid,
                                    borderBottom: '1px solid ' + T.border,
                                  }}>
                                    <span style={{
                                      background: accent.light, color: accent.bg,
                                      padding: '2px 10px', borderRadius: '20px',
                                      fontSize: '12px', fontWeight: '600',
                                    }}>
                                      {product.size_variant}
                                    </span>
                                  </td>
                                  <td style={{
                                    padding: '11px 20px', fontSize: '13px',
                                    color: T.textMid,
                                    borderBottom: '1px solid ' + T.border,
                                  }}>
                                    {product.unit}
                                  </td>
                                  <td style={{
                                    padding: '11px 20px',
                                    borderBottom: '1px solid ' + T.border,
                                  }}>
                                    <span style={{
                                      fontWeight: '800', fontSize: '14px',
                                      color: T.green,
                                    }}>
                                      {parseFloat(product.selling_price).toLocaleString()}
                                    </span>
                                  </td>
                                  <td style={{
                                    padding: '11px 20px',
                                    borderBottom: '1px solid ' + T.border,
                                  }}>
                                    <button
                                      onClick={() => {
                                        setSelectedProduct(product);
                                        setNewPrice(product.selling_price);
                                        setShowPriceModal(true);
                                      }}
                                      style={{
                                        background: T.white,
                                        color: accent.bg,
                                        border: '1.5px solid ' + accent.bg,
                                        borderRadius: '7px',
                                        padding: '5px 12px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = accent.bg;
                                        e.currentTarget.style.color = '#fff';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = T.white;
                                        e.currentTarget.style.color = accent.bg;
                                      }}
                                    >
                                      Update Price
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Update Price Modal ── */}
      {showPriceModal && selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          background: 'rgba(15,25,50,0.55)',
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: T.white, borderRadius: '16px',
            padding: '32px', width: '90%', maxWidth: '460px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          }}>

            {/* Modal header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: T.navy }}>
                Update Selling Price
              </h2>
              <p style={{ color: T.textMid, fontSize: '13px', marginTop: '4px' }}>
                Changes take effect immediately across the system.
              </p>
            </div>

            {/* Product info card */}
            <div style={{
              background: T.offWhite, borderRadius: '10px',
              padding: '16px', marginBottom: '22px',
              border: '1px solid ' + T.border,
            }}>
              <p style={{ fontWeight: '800', fontSize: '15px', color: T.navy }}>
                {selectedProduct.name}
              </p>
              <p style={{ color: T.textMid, fontSize: '12px', marginTop: '4px' }}>
                {selectedProduct.brand_name} &middot; {selectedProduct.category_name} &middot; {selectedProduct.size_variant}
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px',
              }}>
                <span style={{ color: T.textMid, fontSize: '12px' }}>Current price:</span>
                <span style={{
                  fontWeight: '800', fontSize: '16px', color: T.red,
                }}>
                  NGN {parseFloat(selectedProduct.selling_price).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdatePrice}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block', fontWeight: '700',
                  fontSize: '13px', color: T.textDark, marginBottom: '8px',
                }}>
                  New Selling Price (NGN) *
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Enter new price"
                  required
                  min="1"
                  step="0.01"
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '2px solid ' + T.border,
                    borderRadius: '9px', fontSize: '15px',
                    fontWeight: '700', color: T.navy,
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.blue}
                  onBlur={(e) => e.target.style.borderColor = T.border}
                />
              </div>

              {/* Price change preview */}
              {newPrice && parseFloat(newPrice) > 0 && (
                <div style={{
                  borderRadius: '9px', padding: '12px 16px',
                  marginBottom: '20px',
                  background: diff > 0 ? '#EAF6ED' : diff < 0 ? '#FDF0EB' : T.offWhite,
                  border: '1px solid ' + (diff > 0 ? '#A8DDB7' : diff < 0 ? '#F5C6BC' : T.border),
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: '12px', color: T.textMid, marginBottom: '4px' }}>
                      New price
                    </p>
                    <p style={{
                      fontWeight: '800', fontSize: '18px',
                      color: diff > 0 ? T.green : diff < 0 ? T.red : T.navy,
                    }}>
                      NGN {parseFloat(newPrice).toLocaleString()}
                    </p>
                  </div>
                  {diff !== 0 && (
                    <div style={{
                      background: diff > 0 ? T.green : T.red,
                      color: '#fff', borderRadius: '7px',
                      padding: '6px 12px', fontSize: '13px', fontWeight: '700',
                    }}>
                      {diff > 0 ? '▲' : '▼'} NGN {Math.abs(diff).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowPriceModal(false); setSelectedProduct(null); setNewPrice(''); }}
                  style={{
                    background: T.white, color: T.textMid,
                    border: '1.5px solid ' + T.border,
                    borderRadius: '9px', padding: '10px 20px',
                    fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    background: updating ? '#8FA3BF' : T.navy,
                    color: T.white, border: 'none',
                    borderRadius: '9px', padding: '10px 24px',
                    fontWeight: '700', fontSize: '13px',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    boxShadow: updating ? 'none' : '0 2px 8px rgba(31,56,100,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {updating ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogue;
