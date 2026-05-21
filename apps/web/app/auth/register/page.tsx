'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { api, saveToken } from '../../../lib/api';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().optional(),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

export default function RegisterPage() {
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
      // RegisterDto only allows: email, password, firstName, lastName, username, deviceInfo
      const res = await api.post('/auth/register', {
        email:     data.email,
        password:  data.password,
        firstName: data.firstName,
        ...(data.lastName ? { lastName: data.lastName } : {}),
      });

      // Some setups return tokens on register; others redirect to login
      if (res?.data?.accessToken) {
        saveToken(res.data.accessToken);
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/auth/login';
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
    <div className="page-center" style={{ paddingTop: 40, paddingBottom: 40 }}>
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
            Create Your Account
          </p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label className="field-label">First Name</label>
                <input {...register('firstName')} placeholder="John" className="field-input" style={inputStyle} />
                {errors.firstName && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="field-label">Last Name</label>
                <input {...register('lastName')} placeholder="Doe" className="field-input" style={inputStyle} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="field-input" style={inputStyle} />
              {errors.email && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
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

            {/* Confirm Password */}
            <div style={{ marginBottom: 28 }}>
              <label className="field-label">Confirm Password</label>
              <input
                {...register('confirmPassword')}
                type={showPw ? 'text' : 'password'}
                placeholder="Repeat password"
                className="field-input"
                style={inputStyle}
              />
              {errors.confirmPassword && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.confirmPassword.message}</p>}
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,0,51,0.1)', border: '1px solid rgba(255,0,51,0.3)', borderRadius: 10, color: 'var(--primary-red)', fontSize: 13, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-red" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-gray)' }}>
            Already have an account?{' '}
            <a href="/auth/login" style={{ color: 'var(--primary-red)', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
