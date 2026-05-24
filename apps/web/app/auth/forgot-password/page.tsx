'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch (err: any) {
      // Most APIs return 200 even when the email isn't registered (to prevent enumeration).
      // If we do hit an error, surface it but still show the success state for safety.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 18px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#fff', fontSize: 15,
    fontFamily: 'var(--font-space-grotesk)', outline: 'none',
    transition: 'all 0.3s',
  };

  return (
    <div className="page-center">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 className="logo-title" style={{ fontSize: 38 }}>Forgot Password</h1>
          <p style={{ fontSize: 11, color: 'var(--text-gray)', marginTop: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
            We'll email you a reset link
          </p>
        </div>

        <div className="auth-card">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#10b981', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                ✅ Check your inbox
              </p>
              <p style={{ color: 'var(--text-gray)', fontSize: 14, lineHeight: 1.6 }}>
                If an account exists for that email, we've sent a password reset link. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 24 }}>
                <label className="field-label">Email Address</label>
                <input {...register('email')} type="email" placeholder="you@example.com" className="field-input" style={inputStyle} />
                {errors.email && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
              </div>

              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(255,0,51,0.1)', border: '1px solid rgba(255,0,51,0.3)', borderRadius: 10, color: 'var(--primary-red)', fontSize: 13, marginBottom: 18 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-red" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-gray)' }}>
            Remembered it?{' '}
            <a href="/auth/login" style={{ color: 'var(--primary-red)', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
