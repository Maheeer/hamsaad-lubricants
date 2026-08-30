import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../utils/api';
import { getAllBrands, getAllCategories, createBrand, createCategory } from '../../utils/api';

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

// ── Reusable confirm modal ────────────────────────────────────
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

// ── Add modal ─────────────────────────────────────────────────
const AddModal = ({ title, onClose, onSubmit, form, setForm }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(15,25,50,0.55)', display: 'flex',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2000, backdropFilter: 'blur(3px)',
  }}>
    <div style={{
      background: T.white, borderRadius: '14px', padding: '28px',
      width: '90%', maxWidth: '420px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    }}>
      <h3 style={{ color: T.navy, fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>
        {title}
      </h3>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>
            Name *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter name"
            required
            autoFocus
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid ' + T.border, borderRadius: '8px',
              fontSize: '14px', color: T.textDark, outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: T.textDark, marginBottom: '6px' }}>
            Description
          </label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid ' + T.border, borderRadius: '8px',
              fontSize: '14px', color: T.textDark, outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
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
            type="submit"
            style={{
              background: T.navy, color: T.white,
              border: 'none', borderRadius: '8px', padding: '9px 20px',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
            }}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ── Stat pill ─────────────────────────────────────────────────
const Pill = ({ label, color, bg }) => (
  <span style={{
    background: bg, color: color,
    padding: '2px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '700',
  }}>
    {label}
  </span>
);

// ── Main component ────────────────────────────────────────────
const BrandsCategories = () => {
  const [brands, setBrands]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('brands');
  const [confirm, setConfirm]       = useState(null);

  const [showAddBrand, setShowAddBrand]       = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [brandForm, setBrandForm]             = useState({ name: '', description: '' });
  const [categoryForm, setCategoryForm]       = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [b, c] = await Promise.all([getAllBrands(), getAllCategories()]);
      setBrands(b.data.brands);
      setCategories(c.data.categories);
    } catch (err) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Brand actions ─────────────────────────────────────────
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    try {
      await createBrand(brandForm);
      toast.success('Brand created successfully.');
      setShowAddBrand(false);
      setBrandForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create brand.');
    }
  };

  const handleArchiveBrand = (brand) => {
    setConfirm({
      title: brand.is_active ? 'Archive Brand' : 'Restore Brand',
      message: brand.is_active
        ? `Archive "${brand.name}"? It will be hidden from product creation but all existing data is preserved.`
        : `Restore "${brand.name}"? It will become available for product creation again.`,
      confirmLabel: brand.is_active ? 'Archive' : 'Restore',
      confirmColor: brand.is_active ? T.orange : T.green,
      onConfirm: async () => {
        try {
          await API.put(`/products/brands/${brand.id}`, { is_active: !brand.is_active });
          toast.success(brand.is_active
            ? `"${brand.name}" archived.`
            : `"${brand.name}" restored.`
          );
          setConfirm(null);
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Action failed.');
          setConfirm(null);
        }
      },
    });
  };

  const handleDeleteBrand = (brand) => {
    setConfirm({
      title: 'Delete Brand',
      message: `Permanently delete "${brand.name}"? This cannot be undone. Only possible because this brand has no products.`,
      confirmLabel: 'Delete Permanently',
      confirmColor: T.red,
      onConfirm: async () => {
        try {
          await API.delete(`/products/brands/${brand.id}`);
          toast.success(`"${brand.name}" deleted.`);
          setConfirm(null);
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete brand.');
          setConfirm(null);
        }
      },
    });
  };

  // ── Category actions ──────────────────────────────────────
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(categoryForm);
      toast.success('Category created successfully.');
      setShowAddCategory(false);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category.');
    }
  };

  const handleArchiveCategory = (category) => {
    setConfirm({
      title: category.is_active ? 'Archive Category' : 'Restore Category',
      message: category.is_active
        ? `Archive "${category.name}"? It will be hidden from product creation but all existing data is preserved.`
        : `Restore "${category.name}"? It will become available for product creation again.`,
      confirmLabel: category.is_active ? 'Archive' : 'Restore',
      confirmColor: category.is_active ? T.orange : T.green,
      onConfirm: async () => {
        try {
          await API.put(`/products/categories/${category.id}`, { is_active: !category.is_active });
          toast.success(category.is_active
            ? `"${category.name}" archived.`
            : `"${category.name}" restored.`
          );
          setConfirm(null);
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Action failed.');
          setConfirm(null);
        }
      },
    });
  };

  const handleDeleteCategory = (category) => {
    setConfirm({
      title: 'Delete Category',
      message: `Permanently delete "${category.name}"? This cannot be undone. Only possible because this category has no products.`,
      confirmLabel: 'Delete Permanently',
      confirmColor: T.red,
      onConfirm: async () => {
        try {
          await API.delete(`/products/categories/${category.id}`);
          toast.success(`"${category.name}" deleted.`);
          setConfirm(null);
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete category.');
          setConfirm(null);
        }
      },
    });
  };

  if (loading) return <div className="loading">Loading...</div>;

  const tabStyle = (tab) => ({
    padding: '10px 24px',
    fontWeight: '700', fontSize: '13px',
    cursor: 'pointer', border: 'none',
    borderBottom: activeTab === tab ? '3px solid ' + T.navy : '3px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? T.navy : T.textMid,
    transition: 'all 0.2s',
  });

  const renderRow = (item, type) => {
    const count = parseInt(item.product_count || 0);
    const hasProducts = count > 0;
    return (
      <tr key={item.id}>
        <td style={{ padding: '13px 20px', fontWeight: '700', color: T.textDark, fontSize: '14px' }}>
          {item.name}
          {!item.is_active && (
            <span style={{
              marginLeft: '10px', background: '#FDF0EB', color: T.orange,
              padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
            }}>
              Archived
            </span>
          )}
        </td>
        <td style={{ padding: '13px 20px', color: T.textMid, fontSize: '13px' }}>
          {item.description || <span style={{ color: T.textLight }}>—</span>}
        </td>
        <td style={{ padding: '13px 20px' }}>
          {hasProducts ? (
            <Pill label={count + ' product' + (count !== 1 ? 's' : '')} color={T.blue} bg={T.lightBlue} />
          ) : (
            <Pill label="No products" color={T.textLight} bg={T.offWhite} />
          )}
        </td>
        <td style={{ padding: '13px 20px' }}>
          <span style={{
            background: item.is_active ? T.lightGreen : '#FDF0EB',
            color: item.is_active ? T.green : T.orange,
            padding: '3px 10px', borderRadius: '20px',
            fontSize: '11px', fontWeight: '700',
          }}>
            {item.is_active ? 'Active' : 'Archived'}
          </span>
        </td>
        <td style={{ padding: '13px 20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Archive / Restore button — always available */}
            <button
              onClick={() => type === 'brand'
                ? handleArchiveBrand(item)
                : handleArchiveCategory(item)
              }
              style={{
                background: item.is_active ? '#FFF8F0' : T.lightGreen,
                color: item.is_active ? T.orange : T.green,
                border: '1.5px solid ' + (item.is_active ? '#F5C6BC' : '#A8DDB7'),
                borderRadius: '7px', padding: '6px 12px',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              {item.is_active ? 'Archive' : 'Restore'}
            </button>

            {/* Delete button — only if no products */}
            {!hasProducts && (
              <button
                onClick={() => type === 'brand'
                  ? handleDeleteBrand(item)
                  : handleDeleteCategory(item)
                }
                style={{
                  background: T.lightRed, color: T.red,
                  border: '1.5px solid #F5C6BC',
                  borderRadius: '7px', padding: '6px 12px',
                  fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}

            {/* Tooltip when delete is not available */}
            {hasProducts && (
              <span style={{
                color: T.textLight, fontSize: '11px',
                display: 'flex', alignItems: 'center',
                padding: '0 4px',
              }}
                title="Cannot delete — has products attached">
                🔒 Has products
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div className="flex-between mb-2">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: T.navy }}>
            Brands & Categories
          </h1>
          <p style={{ color: T.textMid, fontSize: '13px', marginTop: '4px' }}>
            Manage product brands and categories
          </p>
        </div>
        <button
          onClick={() => activeTab === 'brands' ? setShowAddBrand(true) : setShowAddCategory(true)}
          style={{
            background: T.navy, color: T.white,
            border: 'none', borderRadius: '9px',
            padding: '10px 20px', fontWeight: '700',
            fontSize: '13px', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(31,56,100,0.25)',
          }}
        >
          + Add {activeTab === 'brands' ? 'Brand' : 'Category'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        background: T.white, borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(31,56,100,0.07)',
        border: '1px solid ' + T.border,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', borderBottom: '1px solid ' + T.border,
          padding: '0 8px',
        }}>
          <button style={tabStyle('brands')} onClick={() => setActiveTab('brands')}>
            🏷️ Brands ({brands.length})
          </button>
          <button style={tabStyle('categories')} onClick={() => setActiveTab('categories')}>
            📂 Categories ({categories.length})
          </button>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Description', 'Products', 'Status', 'Actions'].map((h) => (
                <th key={h} style={{
                  background: T.offWhite, color: T.textMid,
                  padding: '10px 20px', textAlign: 'left',
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
            {activeTab === 'brands' ? (
              brands.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: T.textLight }}>
                    No brands found. Add your first brand.
                  </td>
                </tr>
              ) : (
                brands.map((b) => renderRow(b, 'brand'))
              )
            ) : (
              categories.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: T.textLight }}>
                    No categories found. Add your first category.
                  </td>
                </tr>
              ) : (
                categories.map((c) => renderRow(c, 'category'))
              )
            )}
          </tbody>
        </table>

        {/* Legend */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid ' + T.border,
          background: T.offWhite, display: 'flex', gap: '20px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: T.textMid }}>
            🔒 <strong>Delete</strong> is only available when a brand or category has no products attached.
          </span>
          <span style={{ fontSize: '12px', color: T.textMid }}>
            📦 <strong>Archive</strong> hides it from product creation while preserving all data.
          </span>
        </div>
      </div>

      {/* Modals */}
      {showAddBrand && (
        <AddModal
          title="Add New Brand"
          onClose={() => { setShowAddBrand(false); setBrandForm({ name: '', description: '' }); }}
          onSubmit={handleCreateBrand}
          form={brandForm}
          setForm={setBrandForm}
        />
      )}

      {showAddCategory && (
        <AddModal
          title="Add New Category"
          onClose={() => { setShowAddCategory(false); setCategoryForm({ name: '', description: '' }); }}
          onSubmit={handleCreateCategory}
          form={categoryForm}
          setForm={setCategoryForm}
        />
      )}

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

export default BrandsCategories;
