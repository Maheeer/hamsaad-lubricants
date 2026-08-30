import React, { useState } from 'react';
import axios from 'axios';

export default function ClientLogin({ onLogin }) {
  const [form, setForm]     = useState({ client_id: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!form.client_id || !form.password) {
      return setError('Please enter your Client ID and password.');
    }
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/client/login', form);
      localStorage.setItem('hamsaad_client_token', res.data.token);
      localStorage.setItem('hamsaad_client', JSON.stringify(res.data.client));
      onLogin(res.data.client);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1F3864 0%, #2E75B6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        padding: '40px', width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#1F3864', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ color: '#fff', fontSize: '28px', fontWeight: 900 }}>H</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1F3864' }}>
            HAMSAAD
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6c757d', fontSize: '14px' }}>
            Client Portal
          </p>
        </div>

        {/* Form */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Client ID
          </label>
          <input
            className="form-input"
            placeholder="e.g. HMS-CLT-0001"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value.toUpperCase() })}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{ fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1F3864', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Password
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{ fontSize: '14px' }}
          />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6c757d' }}>
            Default password is your Client ID (e.g. HMS-CLT-0001)
          </p>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da', borderRadius: '6px',
            padding: '10px 14px', marginBottom: '16px',
            fontSize: '13px', color: '#842029',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: '#1F3864', color: '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}
