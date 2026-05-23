'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Bell, Plus, Calendar, DollarSign,
  LayoutDashboard, Settings, LogOut, BarChart3, CreditCard,
  Sparkles, Search, X, RefreshCw, User, Menu,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddSubscriptionModal } from '../../components/subscriptions/AddSubscriptionModal';
import { ToastContainer, useToast } from '../../components/Toast';
import { api, clearToken } from '../../lib/api';

// ── helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, trend, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="stat-card"
    >
      <div className="stat-icon">{icon}</div>
      <p style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: 28, fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-gray)', marginTop: 6 }}>{sub}</p>}
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          {trend >= 0 ? <TrendingUp size={12} color="var(--primary-red)" /> : <TrendingDown size={12} color="#00FF64" />}
          <span style={{ fontSize: 11, color: trend >= 0 ? 'var(--primary-red)' : '#00FF64' }}>{Math.abs(trend)}% this month</span>
        </div>
      )}
    </motion.div>
  );
}

function SubCard({ sub, onDelete, delay = 0 }: { sub: any; onDelete: (id: string) => void; delay?: number }) {
  const isActive = sub.status === 'ACTIVE';
  const days = daysUntil(sub.nextBillingDate || sub.startDate);
  const initial = getInitials(sub.name);

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay, duration: 0.45 }}
      className="sub-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div className="sub-logo">
          {sub.logo
            ? <img src={sub.logo} alt={sub.name} style={{ width: 28, height: 28, objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.parentElement as any).textContent = initial; }} />
            : initial}
        </div>
        <span className={isActive ? 'sub-status-active' : 'sub-status-inactive'}>
          {sub.status?.toLowerCase() || 'active'}
        </span>
      </div>

      <p style={{ fontSize: 19, fontWeight: 700, marginBottom: 3 }}>{sub.name}</p>
      <p style={{ fontSize: 11, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {sub.category?.name || 'Uncategorised'}
      </p>

      <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-gray)' }}>Monthly Cost</span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: 17, color: 'var(--primary-red)', fontWeight: 700 }}>
            ${Number(sub.amount).toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-gray)' }}>Billing</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            {sub.billingCycle ? sub.billingCycle.charAt(0) + sub.billingCycle.slice(1).toLowerCase() : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-gray)' }}>Next Renewal</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: days >= 0 && days <= 7 ? 'var(--primary-red)' : '#fff' }}>
            {days < 0 ? 'Overdue' : days === 0 ? 'Today' : `${days}d`}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button
          style={{ flex: 1, padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}
          onClick={() => alert(`Edit "${sub.name}" — coming soon`)}
        >
          Edit
        </button>
        <button
          style={{ flex: 1, padding: 10, background: 'rgba(255,0,51,0.08)', border: '1px solid rgba(255,0,51,0.25)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--primary-red)' }}
          onClick={() => onDelete(sub.id)}
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ── Analytics stub panel ──────────────────────────────────────────────────────
function AnalyticsPanel({ subs }: { subs: any[] }) {
  const total = subs.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const byCategory: Record<string, number> = {};
  subs.forEach((s: any) => {
    const cat = s.category?.name || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(s.amount || 0);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="section-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Analytics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, marginBottom: 32 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Monthly Spend</p>
          <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: 30, color: 'var(--primary-red)' }}>${total.toFixed(2)}</p>
        </div>
        <div className="glass-panel" style={{ padding: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Annual Projected</p>
          <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: 30, color: '#fff' }}>${(total * 12).toFixed(0)}</p>
        </div>
        <div className="glass-panel" style={{ padding: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Active Count</p>
          <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: 30, color: '#00FF64' }}>
            {subs.filter((s: any) => s.status === 'ACTIVE').length}
          </p>
        </div>
      </div>
      <div className="glass-panel" style={{ padding: 28 }}>
        <p style={{ fontWeight: 600, marginBottom: 20 }}>Spend by Category</p>
        {Object.entries(byCategory).map(([cat, amt]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ width: 120, fontSize: 13, color: 'var(--text-gray)' }}>{cat}</span>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (amt / total) * 100)}%`, background: 'linear-gradient(90deg,#FF0033,#990020)', borderRadius: 4, transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ width: 60, textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-orbitron)', color: 'var(--primary-red)' }}>${amt.toFixed(0)}</span>
          </div>
        ))}
        {Object.keys(byCategory).length === 0 && <p style={{ color: 'var(--text-gray)', fontSize: 14 }}>No subscriptions yet.</p>}
      </div>
    </motion.div>
  );
}

// ── AI Chat stub ──────────────────────────────────────────────────────────────
function AIChat() {
  const [msgs, setMsgs] = useState<{ role: string; text: string }[]>([
    { role: 'ai', text: 'Hi! I\'m your AI subscription assistant. Ask me anything — "What can I cancel?", "Show my most expensive subs", or "Find me a cheaper streaming option".' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setMsgs(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', { message: msg });
      const reply = res?.data?.message || res?.message || 'AI response received.';
      setMsgs(m => [...m, { role: 'ai', text: reply }]);
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'I\'m having trouble connecting to the AI service. Make sure your OpenAI API key is configured.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
      <h3 className="section-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>AI Assistant</h3>
      <div className="glass-panel" style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '12px 18px', borderRadius: 16, fontSize: 14, lineHeight: 1.6,
                background: m.role === 'user' ? 'linear-gradient(135deg,#FF0033,#990020)' : 'rgba(255,255,255,0.06)',
                border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'ai' ? 4 : 16,
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 6, padding: '12px 18px', background: 'rgba(255,255,255,0.06)', borderRadius: 16, width: 'fit-content' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-red)', animation: `twinkle 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask your AI assistant…"
            style={{ flex: 1, padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'var(--font-space-grotesk)' }}
          />
          <button onClick={send} className="btn-add" style={{ padding: '14px 20px' }}>Send</button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'subscriptions', icon: CreditCard,       label: 'Subscriptions' },
  { id: 'analytics',     icon: BarChart3,        label: 'Analytics' },
  { id: 'ai',            icon: Sparkles,         label: 'AI Assistant' },
  { id: 'notifications', icon: Bell,             label: 'Notifications' },
];

export default function DashboardPage() {
  const toast = useToast();
  const router = useRouter();
  const [activeNav, setActiveNav]     = useState('dashboard');
  const [modalOpen, setModalOpen]     = useState(false);
  const [subs, setSubs]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [user, setUser]               = useState<any>(null);
  const [search, setSearch]           = useState('');
  const [notifHistory, setNotifHistory] = useState<{id:string;text:string;time:Date}[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch subscriptions from API
  const loadSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions');
      const list = res?.data?.subscriptions ?? res?.data ?? res ?? [];
      setSubs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        window.location.href = '/auth/login';
      }
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user profile — correct endpoint is /users/profile
  const loadUser = useCallback(async () => {
    try {
      const res = await api.get('/users/profile');
      setUser(res?.data ?? res);
    } catch {}
  }, []);

  useEffect(() => {
    loadSubs();
    loadUser();
  }, [loadSubs, loadUser]);

  const handleAddSub = async (data: any) => {
    try {
      const created = await api.post('/subscriptions', {
        name:         data.name,
        amount:       Number(data.amount),
        currency:     data.currency || 'USD',
        billingCycle: data.billingCycle || 'MONTHLY',
        startDate:    data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.notes      ? { notes: data.notes }           : {}),
        ...(data.logo       ? { logo: data.logo }             : {}),
        autoRenew: data.autoRenew ?? true,
        // Only send when explicitly disabled — old backends reject unknown fields,
        // and the service defaults to sending emails when the field is absent.
        ...(data.emailReminders === false ? { emailReminders: false } : {}),
      });
      setModalOpen(false);
      await loadSubs();
      const name = data.name || 'Subscription';
      toast.success(`${name} added!`, `$${Number(data.amount).toFixed(2)}/${(data.billingCycle||'MONTHLY').toLowerCase()} subscription is now being tracked.`);
      // Add to local notification history
      setNotifHistory(h => [{ id: Date.now().toString(), text: `Added "${name}" — $${Number(data.amount).toFixed(2)}/${(data.billingCycle||'monthly').toLowerCase()}`, time: new Date() }, ...h]);
    } catch (err: any) {
      toast.error('Failed to add subscription', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription?')) return;
    const sub = subs.find(s => s.id === id);
    try {
      await api.delete(`/subscriptions/${id}`);
      setSubs(prev => prev.filter(s => s.id !== id));
      toast.info(`${sub?.name || 'Subscription'} removed`, 'It has been deleted from your account.');
    } catch (err: any) {
      toast.error('Failed to delete', err.message);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}); } catch {}
    clearToken();
    window.location.href = '/auth/login';
  };

  // Computed stats
  const activeSubs  = subs.filter(s => s.status === 'ACTIVE' || !s.status);
  const monthlyTotal = activeSubs.reduce((s, x) => s + Number(x.amount || 0), 0);
  const renewingSoon = subs.filter(s => { const d = daysUntil(s.nextBillingDate || s.startDate); return d >= 0 && d <= 7; }).length;
  const filtered    = subs.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName);

  return (
    <div className="page-dashboard" style={{ display: 'flex' }}>
      <ToastContainer toasts={toast.toasts} dismiss={toast.dismiss} />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 199, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`} style={{
        width: 250, minHeight: '100vh',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        padding: '32px 18px', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#fff,#FF0033)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1 }}>
            Subscription
          </h1>
          <p style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 3, letterSpacing: 2, textTransform: 'uppercase' }}>Manager</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ width: '100%', padding: '10px 10px 10px 32px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'var(--font-space-grotesk)' }}
          />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setActiveNav(id); setSidebarOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11,
              padding: '11px 14px', borderRadius: 11, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, marginBottom: 3, transition: 'all 0.25s',
              fontFamily: 'var(--font-space-grotesk)',
              background: activeNav === id ? 'rgba(255,0,51,0.12)' : 'transparent',
              color: activeNav === id ? 'var(--primary-red)' : 'var(--text-gray)',
              outline: activeNav === id ? '1px solid rgba(255,0,51,0.2)' : 'none',
            }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          <button onClick={() => router.push('/profile')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: 'var(--text-gray)', fontFamily: 'var(--font-space-grotesk)', marginBottom: 3 }}>
            <Settings size={15} /> Profile & Settings
          </button>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: 'var(--primary-red)', fontFamily: 'var(--font-space-grotesk)' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard-main" style={{ flex: 1, overflowY: 'auto', padding: '36px 36px 60px', minHeight: '100vh' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="dashboard-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 44, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger — visible on mobile via CSS */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(o => !o)}
              style={{ display: 'none', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}
            >
              <Menu size={17} />
            </button>
            <div>
              <h2 className="section-title" style={{ fontSize: 32, fontWeight: 700 }}>{NAV.find(n => n.id === activeNav)?.label ?? 'Dashboard'}</h2>
              <p style={{ color: 'var(--text-gray)', marginTop: 6, fontSize: 13 }}>
                {activeNav === 'dashboard' ? `Welcome back, ${displayName}!` : `Manage your ${NAV.find(n=>n.id===activeNav)?.label?.toLowerCase()}`}
              </p>
            </div>
          </div>
          <div className="dashboard-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={loadSubs} title="Refresh" style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)' }}>
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => router.push('/profile')}
              title="View profile"
              style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--font-space-grotesk)' }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#FF0033,#990020)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{initials}</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{displayName}</span>
              <User size={12} style={{ color: 'var(--text-gray)' }} />
            </button>
            <button className="btn-add" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Add Subscription
            </button>
          </div>
        </motion.div>

        {/* ── Content by tab ── */}
        <AnimatePresence mode="wait">
          {(activeNav === 'dashboard' || activeNav === 'subscriptions') && (
            <motion.div key={activeNav} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Stats (dashboard only) */}
              {activeNav === 'dashboard' && (
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 22, marginBottom: 44 }}>
                  <StatCard icon={<DollarSign size={22} color="#fff" />} label="Monthly Spend" value={`$${monthlyTotal.toFixed(2)}`} trend={5} delay={0.05} />
                  <StatCard icon={<TrendingUp size={22} color="#fff" />} label="Yearly Total" value={`$${(monthlyTotal * 12).toFixed(0)}`} sub="Projected" delay={0.1} />
                  <StatCard icon={<CreditCard size={22} color="#fff" />} label="Active Subs" value={activeSubs.length} delay={0.15} />
                  <StatCard icon={<Calendar size={22} color="#fff" />} label="Renewing Soon" value={renewingSoon} sub="Next 7 days" delay={0.2} />
                </div>
              )}

              {/* Subscription cards */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 20, fontWeight: 600 }}>
                  {activeNav === 'dashboard' ? 'My Subscriptions' : 'All Subscriptions'}
                </h3>
                <span className="badge-premium">{filtered.length} total</span>
              </div>

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 22 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ height: 260, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animation: 'twinkle 2s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div className="stat-icon" style={{ width: 70, height: 70, fontSize: 32, margin: '0 auto 20px' }}>📋</div>
                  <h3 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 20, marginBottom: 10 }}>No subscriptions yet</h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 24 }}>Add your first subscription to start tracking</p>
                  <button className="btn-add" onClick={() => setModalOpen(true)} style={{ margin: '0 auto' }}>
                    <Plus size={15} /> Add First Subscription
                  </button>
                </div>
              ) : (
                <div className="subs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 22 }}>
                  <AnimatePresence>
                    {filtered.map((sub, i) => (
                      <SubCard key={sub.id} sub={sub} onDelete={handleDelete} delay={i * 0.06} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {activeNav === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AnalyticsPanel subs={subs} />
            </motion.div>
          )}

          {activeNav === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AIChat />
            </motion.div>
          )}

          {activeNav === 'notifications' && (
            <motion.div key="notif" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="section-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Notifications</h3>

              {/* Renewal alerts from real subs */}
              {subs.filter(s => { const d = daysUntil(s.nextBillingDate || s.startDate); return d >= 0 && d <= 7; }).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Renewing Within 7 Days</p>
                  {subs
                    .filter(s => { const d = daysUntil(s.nextBillingDate || s.startDate); return d >= 0 && d <= 7; })
                    .map(s => {
                      const d = daysUntil(s.nextBillingDate || s.startDate);
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,0,51,0.07)', border: '1px solid rgba(255,0,51,0.2)', borderRadius: 14, marginBottom: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary-red)', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{s.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-gray)', margin: 0 }}>Renews in {d === 0 ? 'today' : `${d} day${d !== 1 ? 's' : ''}`} — ${Number(s.amount).toFixed(2)}</p>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-orbitron)', color: 'var(--primary-red)', fontWeight: 700 }}>{d === 0 ? 'TODAY' : `${d}d`}</span>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Activity history */}
              <p style={{ fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Recent Activity</p>
              {notifHistory.length === 0 ? (
                <div className="glass-panel" style={{ padding: 32, textAlign: 'center' }}>
                  <div className="stat-icon" style={{ width: 52, height: 52, fontSize: 22, margin: '0 auto 14px' }}><Bell size={22} color="#fff" /></div>
                  <p style={{ color: 'var(--text-gray)', fontSize: 14 }}>No recent activity. Add your first subscription to see notifications here.</p>
                </div>
              ) : (
                notifHistory.map(n => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', background: 'rgba(0,255,100,0.05)', border: '1px solid rgba(0,255,100,0.15)', borderRadius: 14, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF64', flexShrink: 0 }} />
                    <p style={{ flex: 1, fontSize: 13, margin: 0, color: '#fff' }}>{n.text}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddSubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddSub}
        categories={[
          { id: '', name: 'Entertainment', color: '#E50914' },
          { id: '', name: 'Music',         color: '#1DB954' },
          { id: '', name: 'Productivity',  color: '#0078D4' },
          { id: '', name: 'Cloud Storage', color: '#4285F4' },
          { id: '', name: 'Gaming',        color: '#9146FF' },
          { id: '', name: 'Education',     color: '#FF6B35' },
        ]}
      />
    </div>
  );
}
