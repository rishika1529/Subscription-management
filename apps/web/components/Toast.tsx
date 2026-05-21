'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id:      string;
  type:    ToastType;
  title:   string;
  message: string;
}

interface ToastProps {
  toasts:   ToastMessage[];
  dismiss:  (id: string) => void;
}

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
};

const COLORS = {
  success: { bg: 'rgba(0,255,100,0.1)', border: 'rgba(0,255,100,0.25)', icon: '#00FF64' },
  error:   { bg: 'rgba(255,0,51,0.1)',  border: 'rgba(255,0,51,0.3)',   icon: '#FF0033' },
  info:    { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', icon: '#aaa' },
};

function Toast({ toast, dismiss }: { toast: ToastMessage; dismiss: (id: string) => void }) {
  const Icon   = ICONS[toast.type];
  const colors = COLORS[toast.type];

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 4500);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 18px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: 300, maxWidth: 380,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Animated progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4.5, ease: 'linear' }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: colors.icon,
          transformOrigin: 'left',
        }}
      />

      <Icon size={18} color={colors.icon} style={{ flexShrink: 0, marginTop: 1 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#fff', lineHeight: 1.4 }}>{toast.title}</p>
        <p style={{ fontSize: 12, color: 'var(--text-gray)', margin: '2px 0 0', lineHeight: 1.5 }}>{toast.message}</p>
      </div>

      <button
        onClick={() => dismiss(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0, flexShrink: 0, marginTop: 1 }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, dismiss }: ToastProps) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <AnimatePresence mode="sync">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} dismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = (type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return {
    toasts,
    dismiss,
    success: (title: string, message = '') => push('success', title, message),
    error:   (title: string, message = '') => push('error',   title, message),
    info:    (title: string, message = '') => push('info',    title, message),
  };
}
