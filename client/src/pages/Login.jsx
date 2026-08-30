import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { toast } from 'react-toastify';

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      const role = res.data.user.role;
      if (role === 'admin')       navigate('/admin');
      else if (role === 'manager')     navigate('/manager');
      else if (role === 'storekeeper') navigate('/storekeeper');
      else if (role === 'cashier')     navigate('/cashier');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Logo Area */}
        <div style={styles.logoArea}>
          <div style={styles.logoCircle}>HL</div>
          <div style={styles.title}>HAMSAAD LUBRICANTS</div>
          <div style={styles.subtitle}>Staff Portal — Sign in to continue</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor:  loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          HAMSAAD LUBRICANTS &mdash; All rights reserved
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight:       '100vh',
    background:      'linear-gradient(135deg, #1F3864 0%, #2E75B6 100%)',
    display:         'flex',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         '20px',
  },
  card: {
    background:   '#ffffff',
    borderRadius: '16px',
    padding:      '40px',
    width:        '100%',
    maxWidth:     '420px',
    boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
  },
  logoArea: {
    textAlign:    'center',
    marginBottom: '32px',
  },
  logoCircle: {
    width:          '64px',
    height:         '64px',
    borderRadius:   '50%',
    background:     'linear-gradient(135deg, #1F3864, #2E75B6)',
    color:          '#fff',
    fontSize:       '22px',
    fontWeight:     '700',
    display:        'flex',
    justifyContent: 'center',
    alignItems:     'center',
    margin:         '0 auto 12px',
  },
  title: {
    fontSize:      '22px',
    fontWeight:    '800',
    color:         '#1F3864',
    letterSpacing: '1px',
  },
  subtitle: {
    color:     '#666',
    fontSize:  '13px',
    marginTop: '4px',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display:      'block',
    fontSize:     '12px',
    fontWeight:   '600',
    color:        '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width:        '100%',
    padding:      '10px 14px',
    border:       '1px solid #d1d9e6',
    borderRadius: '8px',
    fontSize:     '14px',
    color:        '#1a1f36',
    outline:      'none',
    boxSizing:    'border-box',
    transition:   'border-color 0.15s',
  },
  submitBtn: {
    width:        '100%',
    padding:      '12px',
    background:   'linear-gradient(135deg, #1F3864, #2E75B6)',
    color:        '#fff',
    border:       'none',
    borderRadius: '8px',
    fontSize:     '15px',
    fontWeight:   '700',
    marginTop:    '8px',
    transition:   'opacity 0.15s',
  },
  footer: {
    textAlign:  'center',
    color:      '#999',
    fontSize:   '12px',
    marginTop:  '24px',
  },
};

export default Login;
