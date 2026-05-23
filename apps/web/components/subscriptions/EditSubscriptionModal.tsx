'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, TrendingUp, Bell, BellOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const editSchema = z.object({
  name:         z.string().min(1, 'Service name is required'),
  amount:       z.number({ invalid_type_error: 'Enter a number' }).min(0.01, 'Amount must be positive'),
  currency:     z.enum(['USD', 'EUR', 'GBP', 'INR']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY', 'QUARTERLY', 'WEEKLY']),
  categoryId:   z.string().optional(),
  startDate:    z.date(),
  autoRenew:    z.boolean().default(true),
  notes:        z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditSubscriptionModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (id: string, data: EditFormData & { emailReminders: boolean }) => Promise<void>;
  categories:   { id: string; name: string; color: string }[];
  subscription: any; // current subscription data
}

const darkInput: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 14,
  fontFamily: 'var(--font-space-grotesk)',
  outline: 'none',
};

const darkSelect: React.CSSProperties = {
  width: '100%',
  padding: '13px 36px 13px 14px',
  background: '#111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 14,
  fontFamily: 'var(--font-space-grotesk)',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23aaaaaa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
};

export function EditSubscriptionModal({
  isOpen, onClose, onSubmit, categories, subscription,
}: EditSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [emailReminders, setEmailReminders] = useState(true);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const watchedAmount       = watch('amount');
  const watchedBillingCycle = watch('billingCycle');

  // Pre-fill fields whenever the modal opens with new subscription data
  useEffect(() => {
    if (isOpen && subscription) {
      reset({
        name:         subscription.name        || '',
        amount:       Number(subscription.amount) || 0,
        currency:     subscription.currency    || 'USD',
        billingCycle: subscription.billingCycle || 'MONTHLY',
        categoryId:   subscription.categoryId  || '',
        startDate:    subscription.startDate
          ? new Date(subscription.startDate)
          : new Date(),
        autoRenew: subscription.autoRenew ?? true,
        notes:     subscription.notes     || '',
      });
      setEmailReminders(true); // default: send email on save
    }
  }, [isOpen, subscription, reset]);

  const calculateMonthlyEquivalent = () => {
    if (!watchedAmount) return 0;
    switch (watchedBillingCycle) {
      case 'YEARLY':    return watchedAmount / 12;
      case 'QUARTERLY': return watchedAmount / 3;
      case 'WEEKLY':    return (watchedAmount * 52) / 12;
      default:          return watchedAmount;
    }
  };

  const onFormSubmit = async (data: EditFormData) => {
    setLoading(true);
    try {
      await onSubmit(subscription.id, { ...data, emailReminders });
    } catch (err) {
      console.error('Failed to update subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 50 }}
          />

          {/* Modal */}
          <motion.div
            className="modal-wrap"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', duration: 0.45 }}
            style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}
          >
            <div
              className="modal-inner"
              style={{ width: '100%', maxWidth: 680, background: 'linear-gradient(135deg,#181818,#0f0f0f)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', overflow: 'hidden', pointerEvents: 'auto' }}
            >
              {/* Header */}
              <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg,#fff,#FF0033)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                    Edit Subscription
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-gray)', marginTop: 5 }}>
                    Update details for <strong style={{ color: '#fff' }}>{subscription.name}</strong>
                  </p>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <div className="modal-content" style={{ padding: '20px 24px', maxHeight: '62vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Service Name *</label>
                    <input {...register('name')} placeholder="e.g., Netflix" style={darkInput} />
                    {errors.name && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.name.message}</p>}
                  </div>

                  {/* Amount + Currency */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Amount *</label>
                      <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="15.99" style={darkInput} />
                      {errors.amount && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.amount.message}</p>}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Currency *</label>
                      <select {...register('currency')} style={darkSelect}>
                        <option value="USD" style={{ background: '#111' }}>USD ($)</option>
                        <option value="EUR" style={{ background: '#111' }}>EUR (€)</option>
                        <option value="GBP" style={{ background: '#111' }}>GBP (£)</option>
                        <option value="INR" style={{ background: '#111' }}>INR (₹)</option>
                      </select>
                    </div>
                  </div>

                  {/* Billing Cycle */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Billing Cycle *</label>
                    <div className="billing-cycle-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                      {(['MONTHLY','QUARTERLY','YEARLY','WEEKLY'] as const).map(cycle => (
                        <label key={cycle} style={{ cursor: 'pointer' }}>
                          <input {...register('billingCycle')} type="radio" value={cycle} style={{ display: 'none' }} />
                          <div
                            onClick={() => setValue('billingCycle', cycle)}
                            style={{
                              padding: '11px 6px', textAlign: 'center', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                              background: watchedBillingCycle === cycle ? 'rgba(255,0,51,0.15)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${watchedBillingCycle === cycle ? 'rgba(255,0,51,0.5)' : 'rgba(255,255,255,0.08)'}`,
                              color: watchedBillingCycle === cycle ? 'var(--primary-red)' : 'var(--text-gray)',
                            }}
                          >
                            {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Monthly equivalent hint */}
                  {watchedAmount > 0 && watchedBillingCycle !== 'MONTHLY' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,0,51,0.06)', border: '1px solid rgba(255,0,51,0.2)', borderRadius: 12 }}>
                      <TrendingUp size={16} color="var(--primary-red)" />
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-gray)', margin: 0 }}>Monthly equivalent</p>
                        <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: 18, color: 'var(--primary-red)', fontWeight: 700, margin: 0 }}>${calculateMonthlyEquivalent().toFixed(2)}/mo</p>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Category</label>
                    <select {...register('categoryId')} style={darkSelect}>
                      <option value="" style={{ background: '#111' }}>None</option>
                      {categories.map(cat => (
                        <option key={cat.id || cat.name} value={cat.id} style={{ background: '#111' }}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Start Date *</label>
                    <input {...register('startDate', { valueAsDate: true })} type="date" style={{ ...darkInput, colorScheme: 'dark' } as any} />
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Notes</label>
                    <textarea
                      {...register('notes')}
                      placeholder="Optional notes…"
                      rows={2}
                      style={{ ...darkInput, resize: 'vertical' }}
                    />
                  </div>

                  {/* Options row */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {/* Auto-renew */}
                    <label style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer' }}>
                      <input {...register('autoRenew')} type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--primary-red)', cursor: 'pointer', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>Auto-Renew</p>
                        <p style={{ fontSize: 11, color: 'var(--text-gray)', margin: 0 }}>Track renewals</p>
                      </div>
                    </label>

                    {/* Email on save toggle */}
                    <button
                      type="button"
                      onClick={() => setEmailReminders(e => !e)}
                      style={{
                        flex: 1, minWidth: 160,
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 16px',
                        background: emailReminders ? 'rgba(255,0,51,0.07)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${emailReminders ? 'rgba(255,0,51,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.25s',
                      }}
                    >
                      <div style={{ width: 36, height: 20, borderRadius: 10, flexShrink: 0, background: emailReminders ? 'linear-gradient(135deg,#FF0033,#990020)' : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.25s' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: emailReminders ? 19 : 3, transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, color: emailReminders ? '#fff' : 'var(--text-gray)' }}>
                          {emailReminders ? <Bell size={12} color="var(--primary-red)" /> : <BellOff size={12} />}
                          Email on Save
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-gray)', margin: 0 }}>
                          {emailReminders ? 'Send update email' : 'No email sent'}
                        </p>
                      </div>
                    </button>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={onClose}
                  style={{ padding: '11px 22px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit(onFormSubmit)}
                  disabled={loading}
                  className="btn-red"
                  style={{ width: 'auto', padding: '11px 28px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {loading ? 'Saving…' : 'Save Changes'} <Check size={15} />
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
