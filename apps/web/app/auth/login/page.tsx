'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Github } from 'lucide-react';
import { api, saveToken } from '../../../lib/api';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        email:    data.email,
        password: data.password,
      });

      // API wraps in { data: { accessToken, refreshToken, user } }
      const token = res?.data?.accessToken ?? res?.accessToken;
      if (!token) throw new Error('No access token received');
      saveToken(token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 className="logo-title" style={{ fontSize: 38 }}>Subscription</h1>
          <p style={{ fontSize: 11, color: 'var(--text-gray)', marginTop: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
            Track Your Spending
          </p>
        </div>

        <div className="auth-card">
          {/* OAuth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <a href="http://localhost:4000/api/v1/auth/google"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </a>
            <a href="http://localhost:4000/api/v1/auth/github"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s' }}>
              <Github size={16} /> GitHub
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="field-input" style={inputStyle} />
              {errors.email && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
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

            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <a href="/auth/forgot-password" style={{ fontSize: 13, color: 'var(--primary-red)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,0,51,0.1)', border: '1px solid rgba(255,0,51,0.3)', borderRadius: 10, color: 'var(--primary-red)', fontSize: 13, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-red" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-gray)' }}>
            Don't have an account?{' '}
            <a href="/auth/register" style={{ color: 'var(--primary-red)', textDecoration: 'none', fontWeight: 600 }}>Sign up free</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
