'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Campaign } from '@/types/campaign';
import { Donation, DonationFormData } from '@/types/donation';
import { Donor } from '@/types/donor';
import Navbar from '@/components/navbar';
import AddDonationForm from '@/components/add-donation-form';
import DonationForm from '@/components/donation-form';
import AdminDonationTable from '@/components/admin-donation-table';
import ConfirmModal from '@/components/confirm-modal';
import { formatCurrency } from '@/lib/utils';

type ToastType = 'success' | 'error';

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

const DONATION_STYLE = { accent: '#059669', light: '#ecfdf5', border: '#a7f3d0' };

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', message: '', onConfirm: () => {} });

  const openModal = (opts: Omit<ModalState, 'open'>) => setModal({ open: true, ...opts });
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchData = useCallback(async () => {
    const [{ data: cData }, { data: dData }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('donations').select('*, campaigns(id, name)').order('donation_date', { ascending: false }),
    ]);
    setCampaigns(cData ?? []);
    setDonations(dData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') { router.push('/'); return; }
      fetchData();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // ── Donor lookup ───────────────────────────────────────
  const lookupDonor = useCallback(async (phone: string): Promise<Donor | null> => {
    const { data } = await supabase.from('donors').select('*').eq('phone', phone).single();
    return data ?? null;
  }, [supabase]);

  // ── Donation CRUD ──────────────────────────────────────
  const handleDonationSubmit = async (data: DonationFormData) => {
    setSaving(true);

    // Upsert donor record when adding a new donation with a phone number
    if (!editingDonation && data.donor_phone) {
      await supabase.from('donors').upsert(
        {
          phone: data.donor_phone,
          name: data.donor_name,
          location: data.donor_location || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone', ignoreDuplicates: false }
      );
    }

    const payload = {
      donor_name: data.donor_name,
      donor_phone: data.donor_phone || null,
      donor_location: data.donor_location || null,
      campaign_id: data.campaign_id || null,
      amount: parseFloat(data.amount),
      donation_date: data.donation_date,
      notes: data.notes || null,
    };

    const { error } = editingDonation
      ? await supabase.from('donations').update(payload).eq('id', editingDonation.id)
      : await supabase.from('donations').insert(payload);

    if (error) { showToast(error.message || 'Something went wrong.', 'error'); setSaving(false); return; }
    showToast(editingDonation ? 'Donation updated!' : 'Donation added!');
    await fetchData();
    setShowDonationForm(false); setEditingDonation(null); setSaving(false);
  };

  const handleDonationEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setShowDonationForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDonationDelete = (id: string) => openModal({
    title: 'Delete Donation',
    message: 'This will permanently remove this donation record.',
    confirmLabel: 'Delete Donation',
    onConfirm: async () => {
      closeModal();
      await supabase.from('donations').delete().eq('id', id);
      await fetchData(); showToast('Donation deleted');
    },
  });

  const handleDeleteAllDonations = () => {
    if (donations.length === 0) return;
    openModal({
      title: 'Delete All Donations',
      message: `Permanently delete all ${donations.length} donation records? This cannot be undone.`,
      confirmLabel: `Delete All (${donations.length})`,
      onConfirm: async () => {
        closeModal(); setSaving(true);
        await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await fetchData(); showToast('All donations deleted'); setSaving(false);
      },
    });
  };

  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>
      <Navbar isAdmin onLogout={handleLogout} />

      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent)' }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-down">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#a7f3d0', border: '1px solid rgba(167,243,208,0.4)' }}>
                    Admin Panel
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
                <p className="text-emerald-200 text-sm mt-1">Manage mosque donation records</p>
              </div>
            </div>

            {!loading && (
              <div className="flex gap-2 sm:gap-3 animate-fade-in">
                {[
                  { label: 'Total Raised',  value: formatCurrency(totalAmount), color: '#6ee7b7', bg: 'rgba(255,255,255,0.1)',  border: 'rgba(255,255,255,0.2)' },
                  { label: 'Donations',     value: String(donations.length),    color: '#a7f3d0', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.18)' },
                ].map(stat => (
                  <div key={stat.label} className="text-center px-4 sm:px-6 py-2.5 rounded-xl"
                    style={{ background: stat.bg, border: `1px solid ${stat.border}`, backdropFilter: 'blur(8px)' }}>
                    <p className="text-base sm:text-xl font-extrabold leading-tight" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] sm:text-xs font-medium mt-0.5 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)' }}>
              <svg className="w-8 h-8 animate-spin" style={{ color: 'var(--c-accent)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: 'var(--c-text-2)' }}>Loading…</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden animate-fade-in"
            style={{
              background: 'var(--c-card)',
              border: `1.5px solid ${showDonationForm ? DONATION_STYLE.border : 'var(--c-border)'}`,
              boxShadow: '0 2px 16px var(--c-shadow)',
            }}>

            {/* Card header */}
            <div className="px-5 sm:px-6 py-4 flex items-center justify-between"
              style={{
                borderBottom: `1.5px solid ${showDonationForm ? DONATION_STYLE.border : 'var(--c-border)'}`,
                background: showDonationForm ? DONATION_STYLE.light : 'var(--c-card-alt)',
              }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: DONATION_STYLE.light, border: `1.5px solid ${DONATION_STYLE.border}` }}>
                  💳
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>
                    {editingDonation ? 'Edit Donation' : showDonationForm ? 'New Donation' : 'Donations'}
                  </h2>
                  {!showDonationForm && (
                    <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>{donations.length} total</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!showDonationForm && donations.length > 0 && (
                  <button onClick={handleDeleteAllDonations}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Delete All</span>
                  </button>
                )}
                {!showDonationForm ? (
                  <button onClick={() => { setEditingDonation(null); setShowDonationForm(true); }} className="btn-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Add Donation</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                ) : (
                  <button onClick={() => { setShowDonationForm(false); setEditingDonation(null); }}
                    className="btn-ghost py-2 px-3 text-sm">
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="p-5 sm:p-6">
              {showDonationForm ? (
                editingDonation ? (
                  <DonationForm
                    initial={editingDonation}
                    campaigns={campaigns}
                    onSubmit={handleDonationSubmit}
                    onCancel={() => { setShowDonationForm(false); setEditingDonation(null); }}
                    loading={saving}
                  />
                ) : (
                  <AddDonationForm
                    onLookupDonor={lookupDonor}
                    onSubmit={handleDonationSubmit}
                    onCancel={() => setShowDonationForm(false)}
                    loading={saving}
                  />
                )
              ) : (
                <AdminDonationTable
                  donations={donations}
                  onEdit={handleDonationEdit}
                  onDelete={handleDonationDelete}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.confirmLabel}
        danger
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-2xl whitespace-nowrap"
            style={toastType === 'success'
              ? { background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 8px 30px rgba(5,150,105,0.5)' }
              : { background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 8px 30px rgba(239,68,68,0.5)' }
            }>
            {toastType === 'success'
              ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            }
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
