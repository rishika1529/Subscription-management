'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Check, ChevronRight, TrendingUp, Bell, BellOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const subscriptionSchema = z.object({
  name:         z.string().min(1, 'Service name is required'),
  amount:       z.number({ invalid_type_error: 'Enter a number' }).min(0.01, 'Amount must be positive'),
  currency:     z.enum(['USD', 'EUR', 'GBP', 'INR']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY', 'QUARTERLY', 'WEEKLY']),
  categoryId:   z.string().optional(),
  startDate:    z.date(),
  autoRenew:    z.boolean().default(true),
  logo:         z.string().optional(),
  notes:        z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface AddSubscriptionModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onSubmit:   (data: SubscriptionFormData & { emailReminders: boolean }) => Promise<void>;
  categories: { id: string; name: string; color: string }[];
}

const POPULAR_SERVICES = [
  { name: 'Netflix',               logo: 'https://logo.clearbit.com/netflix.com',      avgPrice: 15.49 },
  { name: 'Spotify',               logo: 'https://logo.clearbit.com/spotify.com',      avgPrice: 10.99 },
  { name: 'Disney+',               logo: 'https://logo.clearbit.com/disneyplus.com',   avgPrice: 10.99 },
  { name: 'Amazon Prime',          logo: 'https://logo.clearbit.com/amazon.com',       avgPrice: 14.99 },
  { name: 'Apple Music',           logo: 'https://logo.clearbit.com/apple.com',        avgPrice: 10.99 },
  { name: 'YouTube Premium',       logo: 'https://logo.clearbit.com/youtube.com',      avgPrice: 11.99 },
  { name: 'Adobe Creative Cloud',  logo: 'https://logo.clearbit.com/adobe.com',        avgPrice: 54.99 },
  { name: 'Notion',                logo: 'https://logo.clearbit.com/notion.so',        avgPrice: 10.00 },
  { name: 'GitHub',                logo: 'https://logo.clearbit.com/github.com',       avgPrice: 4.00 },
  { name: 'Dropbox',               logo: 'https://logo.clearbit.com/dropbox.com',      avgPrice: 11.99 },
];

const STEPS = ['Select Service', 'Billing Details', 'Review & Confirm'];

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

export function AddSubscriptionModal({ isOpen, onClose, onSubmit, categories }: AddSubscriptionModalProps) {
  const [step,            setStep]            = useState(0);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedService, setSelectedService] = useState<typeof POPULAR_SERVICES[0] | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [emailReminders,  setEmailReminders]  = useState(true);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      currency:     'USD',
      billingCycle: 'MONTHLY',
      startDate:    new Date(),
      autoRenew:    true,
    },
  });

  // Reset every time modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSearchQuery('');
      setSelectedService(null);
      setLoading(false);
      setEmailReminders(true);
      reset({
        name:         '',
        amount:       undefined as any,
        currency:     'USD',
        billingCycle: 'MONTHLY',
        startDate:    new Date(),
        autoRenew:    true,
        categoryId:   '',
        logo:         '',
        notes:        '',
      });
    }
  }, [isOpen, reset]);

  const watchedAmount       = watch('amount');
  const watchedBillingCycle = watch('billingCycle');
  const watchedName         = watch('name');
  const watchedCurrency     = watch('currency');

  const filteredServices = POPULAR_SERVICES.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleServiceSelect = (service: typeof POPULAR_SERVICES[0]) => {
    setSelectedService(service);
    setValue('name',   service.name);
    setValue('amount', service.avgPrice);
    setValue('logo',   service.logo);
    setStep(1);
  };

  const calculateMonthlyEquivalent = () => {
    if (!watchedAmount) return 0;
    switch (watchedBillingCycle) {
      case 'YEARLY':    return watchedAmount / 12;
      case 'QUARTERLY': return watchedAmount / 3;
      case 'WEEKLY':    return (watchedAmount * 52) / 12;
      default:          return watchedAmount;
    }
  };

  const onFormSubmit = async (data: SubscriptionFormData) => {
    setLoading(true);
    try {
      if (selectedService) data.logo = selectedService.logo;
      await onSubmit({ ...data, emailReminders });
    } catch (err) {
      console.error('Failed to create subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              style={{ width: '100%', maxWidth: 760, background: 'linear-gradient(135deg,#181818,#0f0f0f)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', overflow: 'hidden', pointerEvents: 'auto' }}
            >
              {/* Header */}
              <div style={{ padding: '24px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg,#fff,#FF0033)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                      Add New Subscription
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--text-gray)', marginTop: 5 }}>Track your spending with AI-powered insights</p>
                  </div>
                  <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Progress steps */}
                <div style={{ display: 'flex', gap: 8, paddingBottom: 0 }}>
                  {STEPS.map((label, i) => (
                    <div key={label} style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          background: i <= step ? 'linear-gradient(135deg,#FF0033,#990020)' : 'rgba(255,255,255,0.08)',
                          color: '#fff',
                        }}>
                          {i < step ? <Check size={12} /> : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: i <= step ? '#fff' : 'var(--text-dim)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                          <div style={{ height: 3, borderRadius: 2, background: i < step ? 'linear-gradient(90deg,#FF0033,#990020)' : i === step ? 'rgba(255,0,51,0.4)' : 'rgba(255,255,255,0.08)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="modal-content" style={{ padding: '20px 24px', maxHeight: '58vh', overflowY: 'auto' }}>
                <AnimatePresence mode="wait">

                  {/* ── Step 0: Select Service ── */}
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div style={{ position: 'relative', marginBottom: 16 }}>
                        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Search for a service…"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={{ ...darkInput, paddingLeft: 40 }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 12, marginBottom: 16 }}>
                        {filteredServices.map(service => (
                          <motion.button
                            key={service.name}
                            onClick={() => handleServiceSelect(service)}
                            whileHover={{ scale: 1.04, y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            style={{ padding: '16px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,0,51,0.35)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,0,51,0.06)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                          >
                            <div style={{ width: 46, height: 46, margin: '0 auto 8px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              <img src={service.logo} alt={service.name} style={{ width: 32, height: 32, objectFit: 'contain' }}
                                onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${service.name}&background=333&color=fff`; }} />
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: '0 0 3px' }}>{service.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-gray)', margin: 0 }}>${service.avgPrice}/mo</p>
                          </motion.button>
                        ))}
                      </div>

                      <motion.button
                        onClick={() => setStep(1)}
                        whileHover={{ scale: 1.01 }}
                        style={{ width: '100%', padding: '16px', background: 'transparent', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 16, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.25s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,0,51,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,0,51,0.05)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,0,51,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Sparkles size={16} color="var(--primary-red)" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>Custom Service</p>
                          <p style={{ fontSize: 12, color: 'var(--text-gray)', margin: 0 }}>Add a service not in the list</p>
                        </div>
                      </motion.button>
                    </motion.div>
                  )}

                  {/* ── Step 1: Billing Details ── */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Service Name *</label>
                          <input {...register('name')} placeholder="e.g., Netflix" style={darkInput} />
                          {errors.name && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.name.message}</p>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Amount *</label>
                            <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="15.99" style={darkInput} />
                            {errors.amount && <p style={{ color: 'var(--primary-red)', fontSize: 11, marginTop: 4 }}>{errors.amount.message}</p>}
                          </div>
                          <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Currency *</label>
                            <select {...register('currency')} style={darkSelect}>
                              <option value="USD" style={{ background: '#111', color: '#fff' }}>USD ($)</option>
                              <option value="EUR" style={{ background: '#111', color: '#fff' }}>EUR (€)</option>
                              <option value="GBP" style={{ background: '#111', color: '#fff' }}>GBP (£)</option>
                              <option value="INR" style={{ background: '#111', color: '#fff' }}>INR (₹)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Billing Cycle *</label>
                          <div className="billing-cycle-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                            {(['MONTHLY','QUARTERLY','YEARLY','WEEKLY'] as const).map(cycle => (
                              <label key={cycle} style={{ cursor: 'pointer' }}>
                                <input {...register('billingCycle')} type="radio" value={cycle} style={{ display: 'none' }} />
                                <div style={{
                                  padding: '11px 6px', textAlign: 'center', borderRadius: 12, fontSize: 12, fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer',
                                  background: watchedBillingCycle === cycle ? 'rgba(255,0,51,0.15)' : 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${watchedBillingCycle === cycle ? 'rgba(255,0,51,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                  color: watchedBillingCycle === cycle ? 'var(--primary-red)' : 'var(--text-gray)',
                                }}
                                  onClick={() => setValue('billingCycle', cycle)}
                                >
                                  {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {watchedAmount > 0 && watchedBillingCycle !== 'MONTHLY' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,0,51,0.06)', border: '1px solid rgba(255,0,51,0.2)', borderRadius: 12 }}>
                            <TrendingUp size={16} color="var(--primary-red)" />
                            <div>
                              <p style={{ fontSize: 11, color: 'var(--text-gray)', margin: 0 }}>Monthly equivalent</p>
                              <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: 18, color: 'var(--primary-red)', fontWeight: 700, margin: 0 }}>${calculateMonthlyEquivalent().toFixed(2)}/mo</p>
                            </div>
                          </div>
                        )}

                        <div style={{ position: 'relative' }}>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Category</label>
                          <select {...register('categoryId')} style={darkSelect}>
                            <option value="" style={{ background: '#111', color: '#fff' }}>None</option>
                            {categories.map(cat => (
                              <option key={cat.id || cat.name} value={cat.id} style={{ background: '#111', color: '#fff' }}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-gray)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Start Date *</label>
                          <input {...register('startDate', { valueAsDate: true })} type="date" style={{ ...darkInput, colorScheme: 'dark' } as any} />
                        </div>

                        {/* ── Options row ── */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {/* Auto-renew toggle */}
                          <label style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer' }}>
                            <input {...register('autoRenew')} type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--primary-red)', cursor: 'pointer', flexShrink: 0 }} />
                            <div>
                              <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>Auto-Renew</p>
                              <p style={{ fontSize: 11, color: 'var(--text-gray)', margin: 0 }}>Track renewals</p>
                            </div>
                          </label>

                          {/* Email reminders toggle */}
                          <button
                            type="button"
                            onClick={() => setEmailReminders(e => !e)}
                            style={{
                              flex: 1, minWidth: 160,
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '13px 16px',
                              background: emailReminders ? 'rgba(255,0,51,0.07)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${emailReminders ? 'rgba(255,0,51,0.3)' : 'rgba(255,255,255,0.08)'}`,
                              borderRadius: 12, cursor: 'pointer',
                              transition: 'all 0.25s',
                            }}
                          >
                            {/* Toggle pill */}
                            <div style={{
                              width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                              background: emailReminders ? 'linear-gradient(135deg,#FF0033,#990020)' : 'rgba(255,255,255,0.15)',
                              position: 'relative', transition: 'background 0.25s',
                            }}>
                              <div style={{
                                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                                position: 'absolute', top: 3,
                                left: emailReminders ? 19 : 3,
                                transition: 'left 0.25s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                              }} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontWeight: 600, margin: 0, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, color: emailReminders ? '#fff' : 'var(--text-gray)' }}>
                                {emailReminders ? <Bell size={12} color="var(--primary-red)" /> : <BellOff size={12} />}
                                Email Reminders
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text-gray)', margin: 0 }}>
                                {emailReminders ? 'Renewal alerts on' : 'No emails sent'}
                              </p>
                            </div>
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Review ── */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                        <h3 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Review Your Subscription</h3>
                        {[
                          { label: 'Service',       value: watchedName },
                          { label: 'Amount',        value: `$${watchedAmount} ${watchedCurrency}` },
                          { label: 'Billing Cycle', value: watchedBillingCycle ? watchedBillingCycle.charAt(0) + watchedBillingCycle.slice(1).toLowerCase() : '' },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-gray)' }}>{label}</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-gray)' }}>Monthly Cost</span>
                          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: 20, color: 'var(--primary-red)', fontWeight: 700 }}>
                            ${calculateMonthlyEquivalent().toFixed(2)}/mo
                          </span>
                        </div>
                        {/* Email reminders summary */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {emailReminders ? <Bell size={13} color="var(--primary-red)" /> : <BellOff size={13} />}
                            Email Reminders
                          </span>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                            background: emailReminders ? 'rgba(255,0,51,0.1)' : 'rgba(255,255,255,0.06)',
                            color: emailReminders ? 'var(--primary-red)' : 'var(--text-gray)',
                            border: `1px solid ${emailReminders ? 'rgba(255,0,51,0.25)' : 'rgba(255,255,255,0.1)'}`,
                          }}>
                            {emailReminders ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {step > 0 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    style={{ padding: '11px 22px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Back
                  </button>
                ) : <div />}

                {step < 2 ? (
                  <button onClick={() => setStep(s => s + 1)} className="btn-add" style={{ padding: '11px 24px' }}>
                    Continue <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit(onFormSubmit)}
                    disabled={loading}
                    className="btn-red"
                    style={{ width: 'auto', padding: '11px 24px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {loading ? 'Saving…' : 'Add Subscription'} <Check size={15} />
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
