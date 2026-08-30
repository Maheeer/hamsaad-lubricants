import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getAllProducts, getAllBrands, getAllCategories,
  createProduct, addStock, createBrand, createCategory,
  updateProduct,
} from '../../utils/api';
import API from '../../utils/api';

const T = {
  navy:      '#1F3864',
  blue:      '#2E75B6',
  lightBlue: '#EBF3FB',
  green:     '#1E7E34',
  lightGreen:'#EAF6ED',
  red:       '#C0392B',
  lightRed:  '#FDF0EB',
  orange:    '#E67E22',
  white:     '#ffffff',
  offWhite:  '#F7F9FC',
  border:    '#E2EAF4',
  textDark:  '#1A2340',
  textMid:   '#5A6A85',
  textLight: '#8FA3BF',
};

// ── Confirm Modal ─────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel, confirmColor, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(15,25,50,0.55)', display: 'flex',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2000, backdropFilter: 'blur(3px)',
  }}>
    <div style={{
      background: T.white, borderRadius: '14px', padding: '28px',
      width: '90%', maxWidth: '400px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    }}>
      <h3 style={{ color: T.navy, fontSize: '16px', fontWeight: '800', marginBottom: '10px' }}>
        {title}
      </h3>
      <p style={{ color: T.textMid, fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            background: T.white, color: T.textMid,
            border: '1.5px solid ' + T.border,
            borderRadius: '8px', padding: '9px 18px',
            fontWeight: '600', fontSize: '13px', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            background: confirmColor || T.red, color: T.white,
            border: 'none', borderRadius: '8px', padding: '9px 18px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer',
          }}
        >
          {confirmLabel || 'Confirm'}
        </button>
      </div>
    </div>
  </div>
);

const Products = () => {
  const [products, setProducts]     = useState([]);
  const [brands, setBrands]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAddProduct, setShowAddProduct]     = useState(false);
  const [showAddStock, setShowAddStock]         = useState(false);
  const [showReduceStock, setShowReduceStock]   = useState(false);
  const [showAddBrand, setShowAddBrand]         = useState(false);
  const [showAddCategory, setShowAddCategory]   = useState(false);
  const [showArchived, setShowArchived]         = useState(false);
  const [selectedProduct, setSelectedProduct]   = useState(null);
  const [confirm, setConfirm]                   = useState(null);
  const [filterBrand, setFilterBrand]           = useState('');
  const [filterCategory, setFilterCategory]     = useState('');

  const [productForm, setProductForm] = useState({
    name: '', brand_id: '', category_id: '', size_variant: '',
    unit: '', cost_price: '', selling_price: '',
    quantity_in_stock: '', minimum_threshold: '5', description: ''
  });
  const [stockForm, setStockForm]     = useState({ quantity: '', note: '' });
  const [reduceForm, setReduceForm]   = useState({ quantity: '', reason: '' });
  const [brandForm, setBrandForm]     = useState({ name: '', description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [b, c] = await Promise.all([getAllBrands(), getAllCategories()]);
      setBrands(b.data.brands);
      setCategories(c.data.categories);

      const params = {};
      if (filterBrand) params.brand_id = filterBrand;
      if (filterCategory) params.category_id = filterCategory;
      if (showArchived) params.include_archived = true;

      const p = await getAllProducts(params);
      const filtered = showArchived
        ? p.data.products.filter((prod) => !prod.is_active)
        : p.data.products.filter((prod) => prod.is_active);
      setProducts(filtered);
    } catch (err) {
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBrand, filterCategory, showArchived]);

  // ── Handlers ──────────────────────────────────────────────
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await createProduct(productForm);
      toast.success('Product created successfully.');
      setShowAddProduct(false);
      setProductForm({
        name: '', brand_id: '', category_id: '', size_variant: '',
        unit: '', cost_price: '', selling_price: '',
        quantity_in_stock: '', minimum_threshold: '5', description: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product.');
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await addStock(selectedProduct.id, stockForm);
      toast.success('Stock added successfully.');
      setShowAddStock(false);
      setStockForm({ quantity: '', note: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock.');
    }
  };

  const handleReduceStock = async (e) => {
    e.preventDefault();
    if (!reduceForm.reason.trim()) {
      toast.error('Please provide a reason for the stock reduction.');
      return;
    }
    const qty = parseInt(reduceForm.quantity);
    if (qty <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }
    if (qty > selectedProduct.quantity_in_stock) {
      toast.error(`Cannot reduce by ${qty}. Current stock is only ${selectedProduct.quantity_in_stock}.`);
      return;
    }
    try {
      await API.patch(`/products/${selectedProduct.id}/reduce-stock`, {
        quantity: qty,
        reason: reduceForm.reason,
      });
      toast.success(`Stock reduced by ${qty} units.`);
      setShowReduceStock(false);
      setReduceForm({ quantity: '', reason: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reduce stock.');
    }
  };

  const handleArchive = async (product) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      toast.success(product.is_active
        ? `"${product.name}" archived.`
        : `"${product.name}" restored.`
      );
      fetchData();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  const handleDelete = (product) => {
    setConfirm({
      title: 'Delete Product',
      message: `Permanently delete "${product.name} (${product.size_variant})"? This cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      confirmColor: T.red,
      onConfirm: async () => {
        try {
          await API.delete(`/products/${product.id}`);
          toast.success(`"${product.name}" deleted.`);
          setConfirm(null);
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete product.');
          setConfirm(null);
        }
      },
    });
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    try {
      await createBrand(brandForm);
      toast.success('Brand created.');
      setShowAddBrand(false);
      setBrandForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create brand.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(categoryForm);
      toast.success('Category created.');
      setShowAddCategory(false);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category.');
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  const lowStockCount = products.filter((p) => p.is_low_stock).length;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-2">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: T.navy, marginBottom: '4px' }}>
            {showArchived ? 'Archived Products' : 'Products & Stock'}
          </h1>
          <p style={{ color: T.textMid, fontSize: '13px' }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
            {!showArchived && lowStockCount > 0 && (
              <span style={{ color: T.red, marginLeft: '10px', fontWeight: '700' }}>
                · {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button
            style={{
              background: T.white, color: T.textMid,
              border: '1.5px solid ' + T.border,
              borderRadius: '8px', padding: '8px 14px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}
            onClick={() => setShowAddBrand(true)}
          >
            + Brand
          </button>
          <button
            style={{
              background: T.white, color: T.textMid,
              border: '1.5px solid ' + T.border,
              borderRadius: '8px', padding: '8px 14px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}
            onClick={() => setShowAddCategory(true)}
          >
            + Category
          </button>
          {!showArchived && (
            <button
              style={{
                background: T.navy, color: T.white,
                border: 'none', borderRadius: '8px',
                padding: '8px 16px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(31,56,100,0.25)',
              }}
              onClick={() => setShowAddProduct(true)}
            >
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: T.white, borderRadius: '10px',
        padding: '14px 16px', marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(31,56,100,0.06)',
        border: '1px solid ' + T.border,
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={{ minWidth: '160px', padding: '8px 10px', border: '1.5px solid ' + T.border, borderRadius: '7px', fontSize: '13px' }}
        >
          <option value="">All Brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ minWidth: '160px', padding: '8px 10px', border: '1.5px solid ' + T.border, borderRadius: '7px', fontSize: '13px' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          style={{
            background: T.white, color: T.textMid,
            border: '1.5px solid ' + T.border,
            borderRadius: '7px', padding: '8px 12px',
            fontSize: '12px', cursor: 'pointer',
          }}
          onClick={() => { setFilterBrand(''); setFilterCategory(''); }}
        >
          Clear
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button
            style={{
              fontSize: '12px', padding: '8px 14px',
              background: showArchived ? '#6c757d' : T.white,
              color: showArchived ? T.white : '#6c757d',
              border: '1.5px solid #6c757d',
              borderRadius: '7px', cursor: 'pointer',
              fontWeight: '600',
            }}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? '← Active Products' : '🗄 Archived Products'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: T.white, borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(31,56,100,0.08)',
        border: '1px solid ' + T.border,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Product Name', 'Brand', 'Category', 'Size', 'Unit',
                ...(showArchived ? [] : ['Cost Price', 'Selling Price']),
                'Stock', 'Status', 'Actions'].map((h) => (
                <th key={h} style={{
                  background: T.offWhite, color: T.textMid,
                  padding: '10px 14px', textAlign: 'left',
                  fontSize: '11px', fontWeight: '700',
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  borderBottom: '1px solid ' + T.border,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={showArchived ? 7 : 9}
                  style={{ textAlign: 'center', padding: '40px', color: T.textLight }}
                >
                  {showArchived ? 'No archived products.' : 'No products found.'}
                </td>
              </tr>
            ) : (
              products.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{ background: idx % 2 === 0 ? T.white : T.offWhite }}
                >
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: T.textDark, fontSize: '13px', borderBottom: '1px solid ' + T.border }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '13px', color: T.textMid, borderBottom: '1px solid ' + T.border }}>
                    {p.brand_name}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '13px', color: T.textMid, borderBottom: '1px solid ' + T.border }}>
                    {p.category_name}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid ' + T.border }}>
                    <span style={{
                      background: T.lightBlue, color: T.blue,
                      padding: '2px 8px', borderRadius: '12px',
                      fontSize: '11px', fontWeight: '700',
                    }}>
                      {p.size_variant}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '13px', color: T.textMid, borderBottom: '1px solid ' + T.border }}>
                    {p.unit}
                  </td>
                  {!showArchived && (
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: T.textMid, borderBottom: '1px solid ' + T.border }}>
                      NGN {parseFloat(p.cost_price).toLocaleString()}
                    </td>
                  )}
                  {!showArchived && (
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '700', color: T.green, borderBottom: '1px solid ' + T.border }}>
                      NGN {parseFloat(p.selling_price).toLocaleString()}
                    </td>
                  )}
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid ' + T.border }}>
                    <span style={{
                      fontWeight: '800', fontSize: '14px',
                      color: p.is_low_stock ? T.red : T.green,
                    }}>
                      {p.quantity_in_stock}
                      {p.is_low_stock && !showArchived && (
                        <span style={{ fontSize: '11px', marginLeft: '4px' }}>⚠</span>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid ' + T.border }}>
                    <span style={{
                      background: p.is_active ? T.lightGreen : T.lightRed,
                      color: p.is_active ? T.green : T.orange,
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '700',
                    }}>
                      {p.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid ' + T.border }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {p.is_active && (
                        <>
                          {/* Add Stock */}
                          <button
                            onClick={() => { setSelectedProduct(p); setShowAddStock(true); }}
                            style={{
                              background: T.lightGreen, color: T.green,
                              border: '1.5px solid #A8DDB7',
                              borderRadius: '6px', padding: '5px 10px',
                              fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                            }}
                          >
                            + Stock
                          </button>
                          {/* Reduce Stock */}
                          <button
                            onClick={() => { setSelectedProduct(p); setReduceForm({ quantity: '', reason: '' }); setShowReduceStock(true); }}
                            style={{
                              background: '#FFF8F0', color: T.orange,
                              border: '1.5px solid #F5C6BC',
                              borderRadius: '6px', padding: '5px 10px',
                              fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                            }}
                          >
                            − Stock
                          </button>
                        </>
                      )}
                      {/* Archive / Restore */}
                      <button
                        onClick={() => handleArchive(p)}
                        style={{
                          background: p.is_active ? '#FFF8F0' : T.lightGreen,
                          color: p.is_active ? T.orange : T.green,
                          border: '1.5px solid ' + (p.is_active ? '#F5C6BC' : '#A8DDB7'),
                          borderRadius: '6px', padding: '5px 10px',
                          fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                        }}
                      >
                        {p.is_active ? 'Archive' : 'Restore'}
                      </button>
                      {/* Delete — only if never used in orders */}
                      {p.can_delete && (
                        <button
                          onClick={() => handleDelete(p)}
                          style={{
                            background: T.lightRed, color: T.red,
                            border: '1.5px solid #F5C6BC',
                            borderRadius: '6px', padding: '5px 10px',
                            fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Legend */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid ' + T.border,
          background: T.offWhite, display: 'flex', gap: '20px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '11px', color: T.textMid }}>
            <strong>+ Stock</strong> — Add incoming stock
          </span>
          <span style={{ fontSize: '11px', color: T.textMid }}>
            <strong>− Stock</strong> — Correct a wrong entry or remove damaged goods
          </span>
          <span style={{ fontSize: '11px', color: T.textMid }}>
            <strong>Delete</strong> only appears for products never used in any order
          </span>
        </div>
      </div>

      {/* ── Add Stock Modal ── */}
      {showAddStock && selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,25,50,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: T.white, borderRadius: '14px', padding: '28px', width: '90%', maxWidth: '440px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: T.navy, marginBottom: '6px' }}>Add Stock</h2>
            <div style={{ background: T.offWhite, borderRadius: '8px', padding: '12px', marginBottom: '20px', border: '1px solid ' + T.border }}>
              <p style={{ fontWeight: '700', color: T.textDark }}>{selectedProduct.name} — {selectedProduct.size_variant}</p>
              <p style={{ color: T.textMid, fontSize: '13px', marginTop: '4px' }}>
                Current stock: <strong style={{ color: T.navy }}>{selectedProduct.quantity_in_stock} units</strong>
              </p>
            </div>
            <form onSubmit={handleAddStock}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Quantity to Add *</label>
                <input type="number" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="Enter quantity" required min="1" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Note</label>
                <input value={stockForm.note} onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} placeholder="e.g. Delivery from Total Energies" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
              </div>
              {stockForm.quantity && parseInt(stockForm.quantity) > 0 && (
                <div style={{ background: T.lightGreen, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: T.green }}>
                  New stock will be: <strong>{selectedProduct.quantity_in_stock + parseInt(stockForm.quantity)} units</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddStock(false)} style={{ background: T.white, color: T.textMid, border: '1.5px solid ' + T.border, borderRadius: '8px', padding: '9px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: T.green, color: T.white, border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reduce Stock Modal ── */}
      {showReduceStock && selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,25,50,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: T.white, borderRadius: '14px', padding: '28px', width: '90%', maxWidth: '440px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: T.navy, marginBottom: '6px' }}>Reduce Stock</h2>
            <p style={{ color: T.textMid, fontSize: '13px', marginBottom: '16px' }}>
              Use this to correct a wrong entry or remove damaged/lost goods.
            </p>
            <div style={{ background: T.offWhite, borderRadius: '8px', padding: '12px', marginBottom: '20px', border: '1px solid ' + T.border }}>
              <p style={{ fontWeight: '700', color: T.textDark }}>{selectedProduct.name} — {selectedProduct.size_variant}</p>
              <p style={{ color: T.textMid, fontSize: '13px', marginTop: '4px' }}>
                Current stock: <strong style={{ color: T.navy }}>{selectedProduct.quantity_in_stock} units</strong>
              </p>
            </div>
            <form onSubmit={handleReduceStock}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Quantity to Remove *</label>
                <input
                  type="number"
                  value={reduceForm.quantity}
                  onChange={(e) => setReduceForm({ ...reduceForm, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  required min="1"
                  max={selectedProduct.quantity_in_stock}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Reason *</label>
                <select
                  value={reduceForm.reason}
                  onChange={(e) => setReduceForm({ ...reduceForm, reason: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="">Select a reason</option>
                  <option value="Wrong entry correction">Wrong entry correction</option>
                  <option value="Damaged goods">Damaged goods</option>
                  <option value="Expired goods">Expired goods</option>
                  <option value="Stocktake correction">Stocktake correction</option>
                  <option value="Lost or stolen">Lost or stolen</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {reduceForm.quantity && parseInt(reduceForm.quantity) > 0 && parseInt(reduceForm.quantity) <= selectedProduct.quantity_in_stock && (
                <div style={{ background: '#FFF8F0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', border: '1px solid #F5C6BC' }}>
                  <p style={{ fontSize: '13px', color: T.orange }}>
                    New stock will be: <strong>{selectedProduct.quantity_in_stock - parseInt(reduceForm.quantity)} units</strong>
                  </p>
                </div>
              )}
              {reduceForm.quantity && parseInt(reduceForm.quantity) > selectedProduct.quantity_in_stock && (
                <div style={{ background: T.lightRed, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', border: '1px solid #F5C6BC' }}>
                  <p style={{ fontSize: '13px', color: T.red, fontWeight: '700' }}>
                    Cannot exceed current stock of {selectedProduct.quantity_in_stock} units.
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowReduceStock(false)} style={{ background: T.white, color: T.textMid, border: '1.5px solid ' + T.border, borderRadius: '8px', padding: '9px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: T.orange, color: T.white, border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Reduce Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Product Modal ── */}
      {showAddProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,25,50,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)', overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: T.white, borderRadius: '14px', padding: '28px', width: '90%', maxWidth: '580px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: T.navy, marginBottom: '20px' }}>Add New Product</h2>
            <form onSubmit={handleCreateProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Product Name *</label>
                  <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Total Quartz 5W-40" required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Brand *</label>
                  <select value={productForm.brand_id} onChange={(e) => setProductForm({ ...productForm, brand_id: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '13px' }}>
                    <option value="">Select Brand</option>
                    {brands.filter(b => b.is_active).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Category *</label>
                  <select value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '13px' }}>
                    <option value="">Select Category</option>
                    {categories.filter(c => c.is_active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Size Variant *</label>
                  <input value={productForm.size_variant} onChange={(e) => setProductForm({ ...productForm, size_variant: e.target.value })} placeholder="e.g. 4L, 20L, 210L" required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Unit *</label>
                  <select value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '13px' }}>
                    <option value="">Select Unit</option>
                    <option value="Drum">Drum</option>
                    <option value="Carton">Carton</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Cost Price (NGN) *</label>
                  <input type="number" value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} placeholder="0.00" required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Selling Price (NGN) *</label>
                  <input type="number" value={productForm.selling_price} onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })} placeholder="0.00" required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Opening Stock Qty</label>
                  <input type="number" value={productForm.quantity_in_stock} onChange={(e) => setProductForm({ ...productForm, quantity_in_stock: e.target.value })} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Min Threshold</label>
                  <input type="number" value={productForm.minimum_threshold} onChange={(e) => setProductForm({ ...productForm, minimum_threshold: e.target.value })} placeholder="5" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Description</label>
                  <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows="2" placeholder="Optional" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddProduct(false)} style={{ background: T.white, color: T.textMid, border: '1.5px solid ' + T.border, borderRadius: '8px', padding: '9px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: T.navy, color: T.white, border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Brand Modal ── */}
      {showAddBrand && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,25,50,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: T.white, borderRadius: '14px', padding: '28px', width: '90%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: T.navy, marginBottom: '20px' }}>Add New Brand</h2>
            <form onSubmit={handleCreateBrand}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Brand Name *</label>
                <input value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} placeholder="e.g. Total Energies" required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Description</label>
                <input value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} placeholder="Optional" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddBrand(false)} style={{ background: T.white, color: T.textMid, border: '1.5px solid ' + T.border, borderRadius: '8px', padding: '9px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: T.navy, color: T.white, border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Create Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Category Modal ── */}
      {showAddCategory && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,25,50,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: T.white, borderRadius: '14px', padding: '28px', width: '90%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: T.navy, marginBottom: '20px' }}>Add New Category</h2>
            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Category Name *</label>
                <input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Engine Oil" required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>Description</label>
                <input value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Optional" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + T.border, borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddCategory(false)} style={{ background: T.white, color: T.textMid, border: '1.5px solid ' + T.border, borderRadius: '8px', padding: '9px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: T.navy, color: T.white, border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmColor={confirm.confirmColor}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default Products;
