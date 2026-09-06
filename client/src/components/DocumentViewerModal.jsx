import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://hamsaad-lubricants-production.up.railway.app';

const isImageFile = (url) => {
  if (!url) return false;
  // Cloudinary image URLs contain /image/upload/
  if (url.includes('/image/upload/')) return true;
  // Local image files
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);
};

const isPDFFile = (url) => {
  if (!url) return false;
  return url.includes('/raw/upload/') || /\.pdf$/i.test(url.split('?')[0]);
};

const getViewableUrl = (url) => {
  if (!url) return url;
  // For raw Cloudinary uploads that are PDFs, append .pdf if missing
  if (url.includes('/raw/upload/') && !url.endsWith('.pdf')) {
    return url + '.pdf';
  }
  return url;
};

const DocumentViewerModal = ({ doc, onClose }) => {
  const [viewUrl, setViewUrl] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doc) return;
    let objectUrl = null;

    const fetchDoc = async () => {
      setLoading(true);
      setViewUrl(null);
      setBlobUrl(null);
      try {
        const isCloudinary = doc.url.startsWith('http');

        if (isCloudinary) {
          // Use Cloudinary URL directly — public, no auth needed
          const url = getViewableUrl(doc.url);
          setViewUrl(url);
          setLoading(false);
          return;
        }

        // Local/Railway URLs need auth token
        const fullUrl = `${BASE_URL}${doc.url}`;
        const token = localStorage.getItem('hamsaad_token');
        const res = await fetch(fullUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load document');
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setViewUrl(objectUrl);
        setBlobUrl(objectUrl);
      } catch {
        toast.error('Failed to load document.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc]);

  if (!doc) return null;

  const isImage = isImageFile(doc.url);
  const { title } = doc;

  const handleDownload = async () => {
    if (!viewUrl) return;
    try {
      const res = await fetch(viewUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const ext = isImage ? '.jpg' : '.pdf';
      a.download = title.replace(/\s+/g, '_') + ext;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '860px',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: '#1F3864', color: '#fff', padding: '14px 20px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{isImage ? '🖼️' : '📄'}</span>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}>× Close</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#6b7280' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #e5eaf3', borderTopColor: '#2E75B6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <span style={{ fontSize: '13px' }}>Loading document...</span>
            </div>
          ) : viewUrl ? (
            isImage ? (
              <img src={viewUrl} alt={title} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '4px' }} />
            ) : (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewUrl)}&embedded=true`}
                title={title}
                style={{ width: '100%', height: '65vh', border: 'none' }}
              />
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
              <p style={{ margin: 0, fontSize: '13px' }}>Could not load the document.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5eaf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbff', borderRadius: '0 0 16px 16px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {isImage ? 'Right-click the image to save it.' : 'Use the Download button to save the file.'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDownload}
              disabled={!viewUrl}
              style={{ background: viewUrl ? '#1F3864' : '#9ca3af', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: viewUrl ? 'pointer' : 'not-allowed' }}
            >
              ⬇️ Download
            </button>
            <button onClick={onClose} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
