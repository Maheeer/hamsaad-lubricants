import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { toast } from 'react-toastify';

const AccountMenu = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);
  const [view, setView]  = useState('menu');
  const dropdownRef      = useRef(null);
  const btnRef           = useRef(null);

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });
  const [saving, setSaving] = useState(false);

  /* Close on outside tap */
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        btnRef.current      && !btnRef.current.contains(e.target)
      ) { setOpen(false); setView('menu'); }
    };
    document.addEventListener('mousedown',  handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown',  handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name || !profileForm.email) return toast.error('Name and email are required.');
    setSaving(true);
    try {
      await API.put('/users/profile', profileForm);
      toast.success('Profile updated.');
      setView('menu');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) return toast.error('Passwords do not match.');
    if (passwordForm.new_password.length < 6) return toast.error('Password must be at least 6 characters.');
    setSaving(true);
    try {
      await API.put('/users/change-password', {
        current_password: passwordForm.current_password,
        new_password:     passwordForm.new_password,
      });
      toast.success('Password changed.');
      setPasswordForm({ current_password:'', new_password:'', confirm_password:'' });
      setView('menu');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const roleColors = { admin:'#1F3864', manager:'#2E75B6', storekeeper:'#1E7E34', cashier:'#E67E22' };
  const rc = roleColors[user?.role] || '#1F3864';

  const isMobileView = window.innerWidth < 600;

  const inp = {
    width:'100%', padding:'10px 12px',
    border:'1px solid #d1d5db', borderRadius:8,
    fontSize:14, outline:'none', boxSizing:'border-box',
    background:'#fff',
  };

  const Panel = () => (
    <div
      ref={dropdownRef}
      style={isMobileView ? {
        position:'fixed', left:0, right:0, bottom:0,
        maxHeight:'80vh',
        background:'#fff', borderRadius:'16px 16px 0 0',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',
        zIndex:1001, display:'flex', flexDirection:'column', overflow:'hidden',
        paddingBottom:'env(safe-area-inset-bottom, 0px)',
      } : {
        position:'absolute', top:46, right:0,
        width: Math.min(300, window.innerWidth - 24),
        background:'#fff', borderRadius:12,
        boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
        border:'1px solid #e5eaf3', zIndex:9999,
        overflow:'hidden', display:'flex', flexDirection:'column',
      }}
    >
      {/* Handle */}
      {isMobileView && (
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#d1d5db' }} />
        </div>
      )}

      <div style={{ overflowY:'auto', flex:1, WebkitOverflowScrolling:'touch' }}>

        {/* ── MENU VIEW ── */}
        {view === 'menu' && (
          <>
            <div style={{
              background:`linear-gradient(135deg, ${rc}, #2E75B6)`,
              padding:'16px', display:'flex', alignItems:'center', gap:12,
            }}>
              <div style={{
                width:46, height:46, borderRadius:'50%',
                background:'rgba(255,255,255,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, fontWeight:800, color:'#fff', flexShrink:0,
              }}>
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user?.full_name}
                </p>
                <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(255,255,255,0.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user?.email}
                </p>
                <span style={{
                  background:'rgba(255,255,255,0.2)', color:'#fff',
                  fontSize:10, fontWeight:700, padding:'1px 8px', borderRadius:10,
                  marginTop:4, display:'inline-block',
                }}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>

            {[
              { icon:'👤', label:'Edit Profile',      action:() => setView('profile') },
              { icon:'🔑', label:'Change Password',   action:() => setView('password') },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  width:'100%', padding: isMobileView ? '16px' : '12px 16px',
                  background:'none', border:'none', borderBottom:'1px solid #f3f4f6',
                  cursor:'pointer', fontSize:13, color:'#374151', textAlign:'left',
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                <span style={{ fontSize:18 }}>{item.icon}</span>
                {item.label}
                <span style={{ marginLeft:'auto', color:'#9ca3af', fontSize:12 }}>›</span>
              </button>
            ))}

            <button
              onClick={() => { logout(); navigate('/login'); toast.success('Logged out.'); }}
              style={{
                display:'flex', alignItems:'center', gap:12,
                width:'100%', padding: isMobileView ? '16px' : '12px 16px',
                background:'none', border:'none',
                cursor:'pointer', fontSize:13, color:'#dc2626', textAlign:'left',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              <span style={{ fontSize:18 }}>🚪</span>
              Sign Out
            </button>
          </>
        )}

        {/* ── PROFILE VIEW ── */}
        {view === 'profile' && (
          <div style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <button onClick={() => setView('menu')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, padding:4, color:'#374151' }}>‹</button>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#1a1f36' }}>Edit Profile</h3>
            </div>
            <form onSubmit={handleUpdateProfile}>
              {[
                { label:'Full Name',     key:'full_name', type:'text' },
                { label:'Email Address', key:'email',     type:'email' },
                { label:'Phone Number',  key:'phone',     type:'tel' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={profileForm[f.key]}
                    onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inp}
                  />
                </div>
              ))}
              <button
                type="submit" disabled={saving}
                style={{
                  width:'100%', padding:12, background:rc, color:'#fff',
                  border:'none', borderRadius:8, fontSize:14, fontWeight:700,
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* ── PASSWORD VIEW ── */}
        {view === 'password' && (
          <div style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <button onClick={() => setView('menu')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, padding:4, color:'#374151' }}>‹</button>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#1a1f36' }}>Change Password</h3>
            </div>
            <form onSubmit={handleChangePassword}>
              {[
                { label:'Current Password', key:'current_password' },
                { label:'New Password',     key:'new_password' },
                { label:'Confirm Password', key:'confirm_password' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5 }}>{f.label}</label>
                  <input
                    type="password"
                    value={passwordForm[f.key]}
                    onChange={e => setPasswordForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inp}
                  />
                </div>
              ))}
              <button
                type="submit" disabled={saving}
                style={{
                  width:'100%', padding:12, background:rc, color:'#fff',
                  border:'none', borderRadius:8, fontSize:14, fontWeight:700,
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position:'relative' }}>
      {/* Account button */}
      <button
        ref={btnRef}
        onClick={() => { setOpen(o => !o); setView('menu'); }}
        aria-label="Account menu"
        style={{
          display:'flex', alignItems:'center', gap:8,
          background: rc, border:'none', borderRadius:8,
          padding:'6px 10px', cursor:'pointer', color:'#fff',
          WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
        }}
      >
        <div style={{
          width:30, height:30, borderRadius:'50%',
          background:'rgba(255,255,255,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
        }}>
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span style={{ fontSize:13, fontWeight:600, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {user?.full_name}
        </span>
        <span style={{ fontSize:10, opacity:0.7 }}>▼</span>
      </button>

      {/* Mobile overlay */}
      {open && isMobileView && (
        <div
          onClick={() => { setOpen(false); setView('menu'); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000 }}
        />
      )}

      {open && <Panel />}
    </div>
  );
};

export default AccountMenu;
