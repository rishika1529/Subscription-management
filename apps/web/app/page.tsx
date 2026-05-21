'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Bell, Sparkles, Shield, BarChart3, Zap, MessageSquare, CreditCard } from 'lucide-react';

const FEATURES = [
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Visualise spending patterns with interactive charts and AI-driven insights' },
  { icon: Bell, title: 'Renewal Alerts', desc: 'Never miss a billing date — automated reminders 14, 7 and 1 day before' },
  { icon: Sparkles, title: 'AI Insights', desc: 'Get personalised cost-optimisation recommendations powered by OpenAI' },
  { icon: Shield, title: 'Secure & Private', desc: 'JWT + refresh token auth, OAuth, your data encrypted end-to-end' },
  { icon: MessageSquare, title: 'AI Chatbot', desc: 'Ask anything about your subscriptions — real-time streaming responses' },
  { icon: CreditCard, title: 'Stripe Payments', desc: 'Manage premium plans with full Stripe integration and webhook support' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', maxWidth: 700, marginBottom: 80 }}
      >
        <div className="badge-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <Zap size={14} color="var(--primary-red)" />
          <span>AI-Powered Subscription Management</span>
        </div>

        <h1 style={{ fontSize: 'clamp(40px,7vw,76px)', fontFamily: 'var(--font-orbitron)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
          <span className="logo-title" style={{ display: 'block', fontSize: 'inherit' }}>Subscription</span>
          <span style={{ display: 'block', fontSize: '0.55em', color: 'var(--text-gray)', fontFamily: 'var(--font-space-grotesk)', fontWeight: 400, letterSpacing: 4, textTransform: 'uppercase', marginTop: 12 }}>
            Track Every Subscription You Own
          </span>
        </h1>

        <p style={{ fontSize: 17, color: 'var(--text-gray)', marginBottom: 48, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 48px' }}>
          Full visibility over your recurring spend — intelligent alerts, spending analytics,
          real-time WebSocket notifications, and AI cost-saving tips.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.a
            href="/dashboard"
            className="btn-red"
            style={{ width: 'auto', padding: '16px 36px', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 15, textDecoration: 'none' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <TrendingUp size={18} />
            Go to Dashboard
          </motion.a>
          <motion.a
            href="/auth/login"
            className="btn-ghost"
            style={{ padding: '16px 36px', textDecoration: 'none', display: 'inline-block' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Sign In
          </motion.a>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.25 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 24, width: '100%', maxWidth: 1100 }}
      >
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            className="sub-card"
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35 + i * 0.08 }}
          >
            <div className="stat-icon" style={{ width: 52, height: 52, fontSize: 22, marginBottom: 18 }}>
              <Icon size={22} color="#fff" />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-gray)', lineHeight: 1.6 }}>{desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
