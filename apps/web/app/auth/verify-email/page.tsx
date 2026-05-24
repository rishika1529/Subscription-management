'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { API_BASE } from '../../../lib/api';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `HTTP ${res.status}`);
        }
        setStatus('ok');
        setMessage('Email verified! You can now sign in.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      }
    })();
  }, [token]);

  return (
    <div className="page-center">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 className="logo-title" style={{ fontSize: 38 }}>Email Verification</h1>
        </div>

        <div className="auth-card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          {status === 'loading' && (
            <p style={{ color: 'var(--text-gray)', fontSize: 15 }}>{message}</p>
          )}
          {status === 'ok' && (
            <>
              <p style={{ color: '#10b981', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>✅ {message}</p>
              <a href="/auth/login" className="btn-red" style={{ display: 'inline-block', marginTop: 12 }}>Go to Login</a>
            </>
          )}
          {status === 'error' && (
            <>
              <p style={{ color: 'var(--primary-red)', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>❌ {message}</p>
              <a href="/auth/login" style={{ color: 'var(--primary-red)', fontWeight: 600, textDecoration: 'none' }}>Back to Login</a>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="page-center"><p style={{ color: '#888' }}>Loading…</p></div>}>
      <VerifyInner />
    </Suspense>
  );
}
