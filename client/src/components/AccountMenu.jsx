import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { toast } from 'react-toastify';

const AccountMenu = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);
  const [view, setView]  = useState('menu'); // 'menu' | 'profile' | 'password'
  const dropdownRef      = useRef(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password:  '',
    new_password:      '',
    confirm_password:  '',
  });

  const [saving, setSaving] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setView('menu');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    setView('menu');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name || !profileForm.email) {
      return toast.error('Name and email are required.');
    }
    setSaving(true);
    try {
      await API.put('/users/profile', profileForm);
      toast.success('Profile updated successfully.');
      setView('menu');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('New passwords do not match.');
    }
    if (passwordForm.new_password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    setSaving(true);
    try {
      await API.put('/users/change-password', {
        current_password: passwordForm.current_password,
        new_password:     passwordForm.new_password,
      });
      toast.success('Password changed successfully.');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setView('menu');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  const roleColors = {
    admin:       '#1F3864',
    manager:     '#2E75B6',
    storekeeper: '#1E7E34',
    cashier:     '#E67E22',
  };
  const roleColor = roleColors[user?.role] || '#1F3864';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Account Button */}
      <button
        onClick={handleOpen}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          background:   roleColor,
          border:       'none',
          borderRadius: '8px',
          padding:      '6px 12px',
          cursor:       'pointer',
          color:        '#fff',
          transition:   'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        title="Account"
      >
        {/* Avatar */}
        <div style={{
          width:          '30px',
          height:         '30px',
          borderRadius:   '50%',
          background:     'rgba(255,255,255,0.25)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '13px',
          fontWeight:     '700',
          color:          '#fff',
          flexShrink:     0,
        }}>
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.full_name}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:     'absolute',
          top:          '46px',
          right:        '0',
          width:        '300px',
          background:   '#fff',
          borderRadius: '12px',
          boxShadow:    '0 8px 32px rgba(0,0,0,0.15)',
          border:       '1px solid #e5eaf3',
          zIndex:       9999,
          overflow:     'hidden',
        }}>

          {/* ── MENU VIEW ── */}
          {view === 'menu' && (
            <div>
              {/* User info header */}
              <div style={{
                background:  `linear-gradient(135deg, ${roleColor}, #2E75B6)`,
                padding:     '16px',
                display:     'flex',
                alignItems:  'center',
                gap:         '12px',
              }}>
                <div style={{
                  width:          '44px',
                  height:         '44px',
                  borderRadius:   '50%',
                  background:     'rgba(255,255,255,0.2)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '18px',
                  fontWeight:     '800',
                  color:          '#fff',
                  flexShrink:     0,
                }}>
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                    {user?.full_name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                    {user?.email}
                  </p>
                  <span style={{
                    background:    'rgba(255,255,255,0.2)',
                    color:         '#fff',
                    fontSize:      '10px',
                    fontWeight:    '700',
                    padding:       '1px 7px',
                    borderRadius:  '10px',
                    marginTop:     '4px',
                    display:       'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '8px 0' }}>
                <button
                  onClick={() => setView('profile')}
                  style={menuItemStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>👤</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1a1f36' }}>Edit Profile</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Update your name and contact info</p>
                  </div>
                </button>

                <button
                  onClick={() => setView('password')}
                  style={menuItemStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>🔒</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1a1f36' }}>Change Password</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Update your account password</p>
                  </div>
                </button>

                <div style={{ height: '1px', background: '#f0f3f9', margin: '6px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{ ...menuItemStyle, color: '#dc2626' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff8f8'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>🚪</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>Sign Out</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>End your session</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── PROFILE VIEW ── */}
          {view === 'profile' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid #f0f3f9', background: '#fafbff' }}>
                <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6b7280' }}>←</button>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1f36' }}>Edit Profile</h3>
              </div>
              <form onSubmit={handleUpdateProfile} style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    style={inputStyle}
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    style={inputStyle}
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 08012345678"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setView('menu')} style={cancelBtnStyle}>Cancel</button>
                  <button type="submit" disabled={saving} style={saveBtnStyle}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── CHANGE PASSWORD VIEW ── */}
          {view === 'password' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid #f0f3f9', background: '#fafbff' }}>
                <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6b7280' }}>←</button>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1f36' }}>Change Password</h3>
              </div>
              <form onSubmit={handleChangePassword} style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Current Password *</label>
                  <input
                    style={inputStyle}
                    type="password"
                    value={passwordForm.current_password}
                    onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>New Password *</label>
                  <input
                    style={inputStyle}
                    type="password"
                    value={passwordForm.new_password}
                    onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Confirm New Password *</label>
                  <input
                    style={inputStyle}
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setView('menu')} style={cancelBtnStyle}>Cancel</button>
                  <button type="submit" disabled={saving} style={saveBtnStyle}>
                    {saving ? 'Saving...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const menuItemStyle = {
  display:    'flex',
  alignItems: 'center',
  gap:        '12px',
  width:      '100%',
  padding:    '10px 16px',
  border:     'none',
  background: 'transparent',
  cursor:     'pointer',
  textAlign:  'left',
  transition: 'background 0.12s',
};

const labelStyle = {
  display:       'block',
  fontSize:      '11px',
  fontWeight:    '600',
  color:         '#374151',
  marginBottom:  '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const inputStyle = {
  width:        '100%',
  padding:      '8px 12px',
  border:       '1px solid #d1d9e6',
  borderRadius: '7px',
  fontSize:     '13px',
  color:        '#1a1f36',
  background:   '#fff',
  outline:      'none',
  boxSizing:    'border-box',
};

const saveBtnStyle = {
  flex:         1,
  background:   '#1F3864',
  color:        '#fff',
  border:       'none',
  borderRadius: '7px',
  padding:      '9px',
  fontSize:     '13px',
  fontWeight:   '700',
  cursor:       'pointer',
};

const cancelBtnStyle = {
  flex:         1,
  background:   '#fff',
  color:        '#6b7280',
  border:       '1px solid #d1d9e6',
  borderRadius: '7px',
  padding:      '9px',
  fontSize:     '13px',
  fontWeight:   '600',
  cursor:       'pointer',
};

export default AccountMenu;
