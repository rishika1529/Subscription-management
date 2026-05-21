'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, AtSign, Calendar, Shield,
  Edit3, Check, X, Key, CreditCard, TrendingUp, LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '../../lib/api';
import { ToastContainer, useToast } from '../../components/Toast';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w: string) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ firstName: '', lastName: '', username: '' });
  const [pwSection, setPwSection] = useState(false);
  const [pwSending, setPwSending] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, subsRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/subscriptions'),
      ]);
      const u = userRes?.data ?? userRes;
      const list = subsRes?.data?.subscriptions ?? subsRes?.data ?? subsRes ?? [];
      setUser(u);
      setSubs(Array.isArray(list) ? list : []);
      setForm({
        firstName: u?.firstName || '',
        lastName:  u?.lastName  || '',
        username:  u?.username  || '',
      });
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.replace('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/profile', {
        firstName: form.firstName || undefined,
        lastName:  form.lastName  || undefined,
        username:  form.username  || undefined,
      });
      const updated = res?.data ?? res;
      setUser((prev: any) => ({ ...prev, ...updated }));
      setEditing(false);
      toast.success('Profile updated!', 'Your changes have been saved.');
    } catch (err: any) {
      toast.error('Update failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setPwSending(true);
    try {
      await api.post('/auth/forgot-password', { email: user.email });
      toast.success('Email sent!', 'Check your inbox for a password reset link.');
      setPwSection(false);
    } catch (err: any) {
      toast.error('Failed to send email', err.message);
    } finally {
      setPwSending(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}); } catch {}
    clearToken();
    router.replace('/auth/login');
  };

  // Stats
  const activeSubs   = subs.filter(s => s.status === 'ACTIVE' || !s.status);
  const monthlyTotal = activeSubs.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const renewingSoon = subs.filter(s => {
    const d = Math.ceil((new Date(s.nextBillingDate || s.startDate).getTime() - Date.now()) / 86400000);
    return d >= 0 && d <= 7;
  }).length;

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName || 'U');

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'var(--font-space-grotesk)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--primary-red)', fontSize: 16, letterSpacing: 2 }}>
          Loading profile…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 900, margin: '0 auto' }}>
      <ToastContainer toasts={toast.toasts} dismiss={toast.dismiss} />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '10px 18px', color: 'var(--text-gray)',
          cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-space-grotesk)',
          marginBottom: 36,
        }}
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </motion.button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '36px 40px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'linear-gradient(135deg,#FF0033,#990020)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-orbitron)', fontSize: 32, fontWeight: 900,
          flexShrink: 0,
          boxShadow: '0 0 32px rgba(255,0,51,0.25)',
        }}>
          {user?.avatar
            ? <img src={user.avatar} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials}
        </div>

        {/* Name + info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{
            fontFamily: 'var(--font-orbitron)', fontSize: 26, fontWeight: 900,
            background: 'linear-gradient(135deg,#fff,#FF0033)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: 0, marginBottom: 6,
          }}>
            {displayName}
          </h1>
          <p style={{ color: 'var(--text-gray)', fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Mail size={12} /> {user?.email}
          </p>
          {user?.username && (
            <p style={{ color: 'var(--text-gray)', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AtSign size={12} /> {user.username}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: user?.emailVerified ? 'rgba(0,200,100,0.12)' : 'rgba(255,100,0,0.12)', color: user?.emailVerified ? '#00c864' : '#ff6400', border: `1px solid ${user?.emailVerified ? 'rgba(0,200,100,0.25)' : 'rgba(255,100,0,0.25)'}` }}>
              <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
              {user?.emailVerified ? 'Verified' : 'Unverified'}
            </span>
            <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,0,51,0.1)', color: 'var(--primary-red)', border: '1px solid rgba(255,0,51,0.2)' }}>
              {user?.role || 'USER'}
            </span>
            {user?.createdAt && (
              <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'var(--text-gray)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={10} />
                Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: 'rgba(255,0,51,0.08)',
            border: '1px solid rgba(255,0,51,0.2)', borderRadius: 10,
            color: 'var(--primary-red)', cursor: 'pointer', fontSize: 13,
            fontFamily: 'var(--font-space-grotesk)', alignSelf: 'flex-start',
          }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}
      >
        {[
          { icon: <CreditCard size={18} />, label: 'Active Subscriptions', value: activeSubs.length, color: '#fff' },
          { icon: <TrendingUp size={18} />, label: 'Monthly Spend', value: `$${monthlyTotal.toFixed(2)}`, color: 'var(--primary-red)' },
          { icon: <Calendar size={18} />, label: 'Yearly Projected', value: `$${(monthlyTotal * 12).toFixed(0)}`, color: '#fff' },
          { icon: <Shield size={18} />, label: 'Renewing Soon', value: renewingSoon, color: renewingSoon > 0 ? 'var(--primary-red)' : '#00c864' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px 24px',
            }}
          >
            <div style={{ color: 'var(--text-gray)', marginBottom: 10 }}>{stat.icon}</div>
            <p style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 8px' }}>{stat.label}</p>
            <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: 24, fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
        {/* Edit profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '28px 32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 16, fontWeight: 700, margin: 0 }}>Profile Info</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-space-grotesk)' }}
              >
                <Edit3 size={12} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'linear-gradient(135deg,#FF0033,#990020)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-space-grotesk)', opacity: saving ? 0.7 : 1 }}
                >
                  <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', username: user?.username || '' }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--text-gray)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-space-grotesk)' }}
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email (read-only) */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <Mail size={10} /> Email
              </label>
              <div style={{ ...fieldStyle, background: 'rgba(255,255,255,0.02)', color: 'var(--text-gray)', cursor: 'not-allowed', display: 'flex', alignItems: 'center' }}>
                {user?.email}
              </div>
            </div>

            {/* First name */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <User size={10} /> First Name
              </label>
              {editing ? (
                <input
                  style={fieldStyle}
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                />
              ) : (
                <div style={{ ...fieldStyle, background: 'rgba(255,255,255,0.02)', color: form.firstName ? '#fff' : 'var(--text-dim)' }}>
                  {form.firstName || 'Not set'}
                </div>
              )}
            </div>

            {/* Last name */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <User size={10} /> Last Name
              </label>
              {editing ? (
                <input
                  style={fieldStyle}
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                />
              ) : (
                <div style={{ ...fieldStyle, background: 'rgba(255,255,255,0.02)', color: form.lastName ? '#fff' : 'var(--text-dim)' }}>
                  {form.lastName || 'Not set'}
                </div>
              )}
            </div>

            {/* Username */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <AtSign size={10} /> Username
              </label>
              {editing ? (
                <input
                  style={fieldStyle}
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Username"
                />
              ) : (
                <div style={{ ...fieldStyle, background: 'rgba(255,255,255,0.02)', color: form.username ? '#fff' : 'var(--text-dim)' }}>
                  {form.username || 'Not set'}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '28px 32px',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 16, fontWeight: 700, margin: '0 0 24px' }}>Security</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Account info */}
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Member Since</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
              </p>
            </div>

            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Last Login</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>

            {/* Change password */}
            <div style={{ padding: '20px', background: 'rgba(255,0,51,0.04)', border: '1px solid rgba(255,0,51,0.12)', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Key size={14} color="var(--primary-red)" />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Change Password</p>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-gray)', lineHeight: 1.5 }}>
                We'll send a password reset link to your email address.
              </p>
              {!pwSection ? (
                <button
                  onClick={() => setPwSection(true)}
                  style={{
                    padding: '10px 18px', background: 'rgba(255,0,51,0.1)', border: '1px solid rgba(255,0,51,0.25)',
                    borderRadius: 8, color: 'var(--primary-red)', cursor: 'pointer', fontSize: 13,
                    fontFamily: 'var(--font-space-grotesk)', fontWeight: 600,
                  }}
                >
                  Send Reset Email
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSendPasswordReset}
                    disabled={pwSending}
                    style={{
                      padding: '10px 18px', background: 'linear-gradient(135deg,#FF0033,#990020)',
                      border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13,
                      fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, opacity: pwSending ? 0.7 : 1,
                    }}
                  >
                    {pwSending ? 'Sending…' : 'Confirm — Send Email'}
                  </button>
                  <button
                    onClick={() => setPwSection(false)}
                    style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: 'var(--text-gray)', cursor: 'pointer', fontSize: 13,
                      fontFamily: 'var(--font-space-grotesk)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
