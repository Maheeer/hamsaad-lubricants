import React, { useState, useEffect, useCallback } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const formatDateTime = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const today = () => new Date().toISOString().split('T')[0];

// ─── EMPTY PRODUCT LINE ───────────────────────────────────────
const emptyLine = () => ({
  product_id:         '',
  supplier_name:      '',
  total_received:     '',
  defective_quantity: '0',
  defect_description: '',
  notes:              '',
  images:             [],
  previews:           [],
});

// ─── PRODUCT LINE COMPONENT ───────────────────────────────────
const ProductLine = ({ line, index, products, onChange, onRemove, canRemove }) => {
  const accepted  = Math.max(0, parseInt(line.total_received || 0) - parseInt(line.defective_quantity || 0));
  const hasDefect = parseInt(line.defective_quantity || 0) > 0;

  const handleImageChange = (e) => {
    const files    = Array.from(e.target.files).slice(0, 5);
    const previews = files.map(f => URL.createObjectURL(f));
    onChange(index, { images: files, previews });
  };

  const removeImage = (imgIndex) => {
    const newImages   = line.images.filter((_, i) => i !== imgIndex);
    const newPreviews = line.previews.filter((_, i) => i !== imgIndex);
    onChange(index, { images: newImages, previews: newPreviews });
  };

  return (
    <div style={{
      border: '1px solid #e5eaf3', borderRadius: '12px',
      marginBottom: '16px', overflow: 'hidden',
    }}>
      {/* Line header */}
      <div style={{
        background: '#f8faff', padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #e5eaf3',
      }}>
        <span style={{ fontWeight: '700', fontSize: '13px', color: '#1F3864' }}>
          Product Line {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            style={{
              background: '#fee2e2', color: '#dc2626', border: 'none',
              borderRadius: '6px', padding: '4px 10px', fontSize: '12px',
              fontWeight: '600', cursor: 'pointer',
            }}
          >
            Remove
          </button>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Product + Supplier */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Product *</label>
            <select
              style={inputStyle}
              value={line.product_id}
              onChange={e => onChange(index, { product_id: e.target.value })}
              required
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.brand_name} — {p.name} ({p.size_variant}) | Stock: {p.quantity_in_stock}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Supplier / Source</label>
            <input
              style={inputStyle}
              placeholder="e.g. Total Energies Nigeria"
              value={line.supplier_name}
              onChange={e => onChange(index, { supplier_name: e.target.value })}
            />
          </div>
        </div>

        {/* Quantities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Total Received *</label>
            <input
              style={inputStyle} type="number" min="1" placeholder="0"
              value={line.total_received}
              onChange={e => onChange(index, { total_received: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Defective Qty</label>
            <input
              style={{ ...inputStyle, borderColor: hasDefect ? '#ef4444' : undefined }}
              type="number" min="0" placeholder="0"
              value={line.defective_quantity}
              onChange={e => onChange(index, { defective_quantity: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Accepted (Auto)</label>
            <div style={{
              ...inputStyle, background: '#f0f9ff',
              borderColor: '#2E75B6', color: '#1F3864',
              fontWeight: '800', fontSize: '16px',
              display: 'flex', alignItems: 'center',
            }}>
              {accepted}
            </div>
          </div>
        </div>

        {/* Defect section */}
        {hasDefect && (
          <div style={{
            border: '1px solid #fecaca', borderRadius: '10px',
            padding: '14px', background: '#fff8f8', marginBottom: '12px',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>
              ⚠️ Defect Details
            </p>
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyle}>Defect Description *</label>
              <textarea
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                placeholder="Describe the defects found..."
                value={line.defect_description}
                onChange={e => onChange(index, { defect_description: e.target.value })}
                required={hasDefect}
              />
            </div>

            {/* Image upload */}
            <div>
              <label style={labelStyle}>Defect Photos (up to 5)</label>
              <input
                type="file"
                id={`defect-img-${index}`}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <label htmlFor={`defect-img-${index}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#fff', border: '2px dashed #fca5a5',
                borderRadius: '6px', padding: '8px 14px', cursor: 'pointer',
                color: '#dc2626', fontSize: '12px', fontWeight: '600',
                marginBottom: '10px',
              }}>
                📷 Attach defect photos
              </label>

              {line.previews.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {line.previews.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} alt={`defect-${i}`} style={{
                        width: '80px', height: '80px', objectFit: 'cover',
                        borderRadius: '6px', border: '2px solid #fecaca',
                      }} />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          background: '#dc2626', color: '#fff', border: 'none',
                          borderRadius: '50%', width: '18px', height: '18px',
                          cursor: 'pointer', fontSize: '12px', lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label style={labelStyle}>Line Notes</label>
          <input
            style={inputStyle}
            placeholder="Optional notes for this product line..."
            value={line.notes}
            onChange={e => onChange(index, { notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

// ─── RECEIVE MODAL ────────────────────────────────────────────
const ReceiveModal = ({ products, onClose, onSuccess }) => {
  const [header, setHeader] = useState({
    delivery_reference: '',
    delivery_date:      today(),
    general_notes:      '',
  });
  const [lines, setLines]     = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const updateLine = (index, changes) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, ...changes } : l));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);

  const removeLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const totalReceived  = lines.reduce((s, l) => s + parseInt(l.total_received  || 0), 0);
  const totalDefective = lines.reduce((s, l) => s + parseInt(l.defective_quantity || 0), 0);
  const totalAccepted  = totalReceived - totalDefective;

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const line of lines) {
      if (!line.product_id) return toast.error('Please select a product for each line.');
      if (!line.total_received || parseInt(line.total_received) <= 0)
        return toast.error('Total received must be greater than 0 for each line.');
      if (parseInt(line.defective_quantity) > parseInt(line.total_received))
        return toast.error('Defective qty cannot exceed total received.');
      if (parseInt(line.defective_quantity) > 0 && !line.defect_description)
        return toast.error('Please describe the defect for each defective product line.');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('delivery_reference', header.delivery_reference);
      formData.append('delivery_date',      header.delivery_date);
      formData.append('general_notes',      header.general_notes);

      // Send items as JSON (without images)
      const itemsData = lines.map(l => ({
        product_id:         l.product_id,
        supplier_name:      l.supplier_name,
        total_received:     l.total_received,
        defective_quantity: l.defective_quantity,
        defect_description: l.defect_description,
        notes:              l.notes,
      }));
      formData.append('items', JSON.stringify(itemsData));

      // Append images with index-based field names
      lines.forEach((l, i) => {
        l.images.forEach(img => {
          formData.append(`defect_images_${i}`, img);
        });
      });

      const res = await API.post('/stock-receipts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data.message);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(15,25,50,0.65)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '95%', maxWidth: '720px',
        maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          background: '#1F3864', color: '#fff', padding: '20px 24px',
          borderRadius: '16px 16px 0 0', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Receive Stock</h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', opacity: 0.7 }}>
              Record incoming delivery — add as many products as needed
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
            fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>

          {/* Delivery header */}
          <div style={{
            background: '#f8faff', border: '1px solid #e5eaf3',
            borderRadius: '10px', padding: '16px', marginBottom: '20px',
          }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', fontSize: '13px', color: '#1F3864' }}>
              📋 Delivery Information
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Delivery Reference / LPO No.</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. LPO-2026-0089"
                  value={header.delivery_reference}
                  onChange={e => setHeader(h => ({ ...h, delivery_reference: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Delivery Date</label>
                <input
                  style={inputStyle} type="date" max={today()}
                  value={header.delivery_date}
                  onChange={e => setHeader(h => ({ ...h, delivery_date: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>General Notes</label>
              <input
                style={inputStyle}
                placeholder="Any general notes about this delivery..."
                value={header.general_notes}
                onChange={e => setHeader(h => ({ ...h, general_notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Summary bar */}
          {totalReceived > 0 && (
            <div style={{
              display: 'flex', gap: '10px', marginBottom: '16px',
              background: totalDefective > 0 ? '#fff8f8' : '#f0fdf4',
              border: `1px solid ${totalDefective > 0 ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '10px', padding: '12px 16px',
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Received</p>
                <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#1F3864' }}>{totalReceived}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Defective</p>
                <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{totalDefective}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Added to Stock</p>
                <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#15803d' }}>{totalAccepted}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Product Lines</p>
                <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#1F3864' }}>{lines.length}</p>
              </div>
            </div>
          )}

          {/* Product lines */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#1F3864' }}>
                📦 Product Lines
              </p>
              <button
                type="button"
                onClick={addLine}
                style={{
                  background: '#eef2ff', color: '#1F3864', border: '1px solid #c7d2fe',
                  borderRadius: '7px', padding: '6px 14px', fontSize: '12px',
                  fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                + Add Another Product
              </button>
            </div>

            {lines.map((line, i) => (
              <ProductLine
                key={i}
                index={i}
                line={line}
                products={products}
                onChange={updateLine}
                onRemove={removeLine}
                canRemove={lines.length > 1}
              />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #f0f3f9' }}>
            <button type="button" onClick={onClose} style={{
              background: '#fff', color: '#6b7280', border: '1px solid #d1d9e6',
              borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{
              background: submitting ? '#9ca3af' : '#1F3864',
              color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px 28px', fontSize: '13px', fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Recording...' : `Record Receipt (${lines.length} product${lines.length > 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── RECEIPT DETAIL MODAL ─────────────────────────────────────
const ReceiptDetailModal = ({ receipt, items, onClose }) => {
  if (!receipt) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(15,25,50,0.6)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '680px',
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          background: '#1F3864', color: '#fff', padding: '18px 24px',
          borderRadius: '16px 16px 0 0', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
              Receipt #{receipt.id}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', opacity: 0.7 }}>
              {formatDateTime(receipt.created_at)} · {receipt.received_by_name}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
          }}>×</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Delivery info */}
          <div style={{ background: '#f8faff', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Ref</p>
              <p style={{ margin: 0, fontWeight: 700, color: '#1F3864' }}>{receipt.delivery_reference || '—'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Date</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(receipt.delivery_date)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Received By</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{receipt.received_by_name}</p>
            </div>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Total Received', value: items.reduce((s, i) => s + i.total_received, 0), color: '#1F3864', bg: '#f0f9ff' },
              { label: 'Defective',      value: items.reduce((s, i) => s + i.defective_quantity, 0), color: '#dc2626', bg: '#fff8f8' },
              { label: 'Added to Stock', value: items.reduce((s, i) => s + i.accepted_quantity, 0), color: '#15803d', bg: '#f0fdf4' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ flex: 1, background: bg, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Product lines */}
          <h4 style={{ margin: '0 0 12px', color: '#1F3864', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
            Product Lines ({items.length})
          </h4>

          {items.map((item, i) => (
            <div key={item.id} style={{
              border: '1px solid #e5eaf3', borderRadius: '10px',
              marginBottom: '12px', overflow: 'hidden',
            }}>
              <div style={{ background: '#f8faff', padding: '10px 14px', borderBottom: '1px solid #e5eaf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '700', color: '#1a1f36', fontSize: '13px' }}>
                    {item.product_name} ({item.size_variant})
                  </span>
                  <span style={{ marginLeft: '8px', background: '#eef2ff', color: '#1F3864', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                    {item.brand_name}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.supplier_name || 'No supplier specified'}</span>
              </div>

              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: item.defective_quantity > 0 ? '12px' : '0' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>
                    Received: <strong>{item.total_received}</strong>
                  </span>
                  <span style={{ fontSize: '13px', color: '#dc2626' }}>
                    Defective: <strong>{item.defective_quantity}</strong>
                  </span>
                  <span style={{ fontSize: '13px', color: '#15803d' }}>
                    Added: <strong>+{item.accepted_quantity}</strong>
                  </span>
                </div>

                {item.defective_quantity > 0 && (
                  <div style={{ background: '#fff8f8', borderRadius: '8px', padding: '10px', border: '1px solid #fecaca' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#dc2626', fontWeight: 700 }}>⚠️ Defect Details</p>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#374151' }}>{item.defect_description}</p>

                    {item.defect_images && item.defect_images.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {item.defect_images.map((url, j) => {
                          const BASE = process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app';
                          const imgUrl = url.startsWith('http') ? url : `${BASE}${url}`;
                          return (
                          <a key={j} href={imgUrl} target="_blank" rel="noreferrer">
                            <img
                              src={imgUrl}
                              alt={`defect-${j + 1}`}
                              style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #fecaca', cursor: 'pointer' }}
                            />
                          </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {item.notes && (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                    Note: {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}

          {receipt.general_notes && (
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginTop: '4px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>General Notes</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{receipt.general_notes}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button onClick={onClose} style={{
              background: '#1F3864', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 24px', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────
const StockReceipts = () => {
  const [receipts, setReceipts]           = useState([]);
  const [defectSummary, setDefectSummary] = useState([]);
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt]  = useState(null);
  const [selectedItems, setSelectedItems]       = useState([]);
  const [activeTab, setActiveTab]         = useState('receipts');
  const [filters, setFilters]             = useState({ from_date: '', to_date: '' });
  const [pagination, setPagination]       = useState({ current_page: 1, total_pages: 1, total_records: 0 });

  const fetchReceipts = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date)   params.append('to_date',   filters.to_date);
      const res = await API.get(`/stock-receipts?${params.toString()}`);
      setReceipts(res.data.receipts || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load receipts.'); }
  }, [filters]);

  const fetchDefectSummary = useCallback(async () => {
    try {
      const res = await API.get('/stock-receipts/defect-summary');
      setDefectSummary(res.data.summary || []);
    } catch {}
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data.products || []);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchReceipts(), fetchDefectSummary(), fetchProducts()]);
    setLoading(false);
  }, [fetchReceipts, fetchDefectSummary, fetchProducts]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleViewReceipt = async (id) => {
    try {
      const res = await API.get(`/stock-receipts/${id}`);
      setSelectedReceipt(res.data.receipt);
      setSelectedItems(res.data.items || []);
    } catch { toast.error('Failed to load receipt.'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: '#6b7280' }}>
      <div style={{ width: '28px', height: '28px', border: '3px solid #e5eaf3', borderTopColor: '#1F3864', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading stock receipts...
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1a1f36' }}>Stock Receipts</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
            Record incoming deliveries with multi-product and defect tracking
          </p>
        </div>
        <button
          onClick={() => setShowReceiveModal(true)}
          style={{
            background: '#1F3864', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '11px 22px', fontSize: '14px',
            fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 2px 10px rgba(31,56,100,0.3)',
          }}
        >
          + Receive Stock
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5eaf3', marginBottom: '20px' }}>
        {[
          { key: 'receipts', label: `📦 All Receipts (${pagination.total_records || 0})` },
          { key: 'defects',  label: `⚠️ Defect Report (${defectSummary.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => {
            setActiveTab(tab.key);
            if (tab.key === 'defects') fetchDefectSummary();
          }} style={{
            padding: '10px 22px', border: 'none', background: 'transparent',
            fontSize: '13px', fontWeight: activeTab === tab.key ? '700' : '500',
            color: activeTab === tab.key ? '#1F3864' : '#6b7280',
            borderBottom: activeTab === tab.key ? '2px solid #1F3864' : '2px solid transparent',
            marginBottom: '-2px', cursor: 'pointer',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── RECEIPTS TAB ── */}
      {activeTab === 'receipts' && (
        <div>
          {/* Filters */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', border: '1px solid #e5eaf3', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[{ label: 'From Date', key: 'from_date' }, { label: 'To Date', key: 'to_date' }].map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{f.label}</label>
                <input type="date" style={inputStyle} value={filters[f.key]}
                  onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <button onClick={() => fetchReceipts(1)} style={{ background: '#1F3864', color: '#fff', border: 'none', borderRadius: '7px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Apply</button>
            <button onClick={() => setFilters({ from_date: '', to_date: '' })} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d9e6', borderRadius: '7px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer' }}>Reset</button>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5eaf3', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Receipt #', 'Delivery Ref', 'Delivery Date', 'Products', 'Total Recv.', 'Defective', 'Added to Stock', 'Received By', 'Recorded On', 'Action'].map(h => (
                    <th key={h} style={{ background: '#f8faff', color: '#4b5563', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e5eaf3', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    No receipts found. Click "Receive Stock" to record a delivery.
                  </td></tr>
                ) : receipts.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0f3f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#2E75B6', fontWeight: 700 }}>#{r.id}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{r.delivery_reference || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{formatDate(r.delivery_date)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: '#eef2ff', color: '#1F3864', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                        {r.item_count} item{r.item_count !== '1' ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{r.total_received}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {parseInt(r.total_defective) > 0
                        ? <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>{r.total_defective}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>+{r.total_accepted}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{r.received_by}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDateTime(r.created_at)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => handleViewReceipt(r.id)} style={{ background: '#f0f4ff', color: '#1F3864', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
              <button disabled={pagination.current_page === 1} onClick={() => fetchReceipts(pagination.current_page - 1)} style={{ background: '#fff', border: '1px solid #d1d9e6', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', opacity: pagination.current_page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Page {pagination.current_page} of {pagination.total_pages}</span>
              <button disabled={pagination.current_page === pagination.total_pages} onClick={() => fetchReceipts(pagination.current_page + 1)} style={{ background: '#fff', border: '1px solid #d1d9e6', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', opacity: pagination.current_page === pagination.total_pages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* ── DEFECT REPORT TAB ── */}
      {activeTab === 'defects' && (
        <div>
          {defectSummary.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', color: '#9ca3af', border: '1px solid #e5eaf3' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>No defective items recorded</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5eaf3', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Delivery Date', 'Delivery Ref', 'Supplier', 'Product', 'Brand', 'Unit', 'Total Received', 'Total Defective', 'Total Accepted', 'Defect Rate'].map(h => (
                      <th key={h} style={{ background: '#fff8f8', color: '#dc2626', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #fecaca', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {defectSummary.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f3f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff8f8'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {r.delivery_date ? new Date(r.delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>{r.delivery_reference || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>{r.supplier_name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a1f36' }}>
                        {r.product_name}
                        <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>{r.size_variant}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: '#eef2ff', color: '#1F3864', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{r.brand_name}</span></td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{r.unit}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.total_received}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>{r.total_defective}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>{r.total_accepted}</span></td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: parseFloat(r.defect_rate_pct) > 10 ? '#fee2e2' : '#fef9c3', color: parseFloat(r.defect_rate_pct) > 10 ? '#dc2626' : '#a16207', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          {r.defect_rate_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showReceiveModal && (
        <ReceiveModal
          products={products}
          onClose={() => setShowReceiveModal(false)}
          onSuccess={fetchAll}
        />
      )}

      {selectedReceipt && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          items={selectedItems}
          onClose={() => { setSelectedReceipt(null); setSelectedItems([]); }}
        />
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#374151', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.4px',
};

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d9e6',
  borderRadius: '7px', fontSize: '13px', color: '#1a1f36',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

export default StockReceipts;
