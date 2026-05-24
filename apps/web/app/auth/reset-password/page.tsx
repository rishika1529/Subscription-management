'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../../lib/api';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm:  z.string().min(8, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type Form = z.infer<typeof schema>;

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) setError('Missing or invalid reset link. Please request a new one.');
  }, [token]);

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Could not reset password. The link may have expired.');
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
          <h1 className="logo-title" style={{ fontSize: 38 }}>Reset Password</h1>
          <p style={{ fontSize: 11, color: 'var(--text-gray)', marginTop: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
            Choose a new password
          </p>
        </div>

        <div className="auth-card">
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#10b981', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                ✅ Password reset successful
              </p>
              <p style={{ color: 'var(--text-gray)', fontSize: 14 }}>
                Redirecting to login…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 18 }}>
                <label className="field-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    className="field-input"
                    style={{ ...inputStyle, paddingRight: 48 }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-gray)' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.password.message}</p>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="field-label">Confirm Password</label>
                <input
                  {...register('confirm')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className="field-input"
                  style={inputStyle}
                />
                {errors.confirm && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.confirm.message}</p>}
              </div>

              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(255,0,51,0.1)', border: '1px solid rgba(255,0,51,0.3)', borderRadius: 10, color: 'var(--primary-red)', fontSize: 13, marginBottom: 18 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !token} className="btn-red" style={{ opacity: loading || !token ? 0.7 : 1 }}>
                {loading ? 'Resetting…' : 'Reset Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="page-center"><p style={{ color: '#888' }}>Loading…</p></div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
