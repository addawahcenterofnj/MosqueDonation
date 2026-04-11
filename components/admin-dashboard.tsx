'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Donation, DonationFormData } from '@/types/donation';
import { Donor } from '@/types/donor';
import Navbar from '@/components/navbar';
import AddDonationForm, { SplitDonationBase } from '@/components/add-donation-form';
import DonationForm from '@/components/donation-form';
import AdminDonationTable from '@/components/admin-donation-table';
import YearlyReportTable from '@/components/yearly-report-table';
import ConfirmModal from '@/components/confirm-modal';
import { formatCurrency } from '@/lib/utils';
import { generateYearlyReportPDF, generateMonthlyDonorReportPDF } from '@/lib/pdf';
import { compressImage } from '@/lib/image-compress';
import DonorSearch from '@/components/donor-search';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ToastType = 'success' | 'error';

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', message: '', onConfirm: () => {} });

  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);

  // Month browser state — default to current month
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  // Yearly report year state
  const [reportYear, setReportYear] = useState(now.getFullYear());

  // Section toggle states — all off by default
  const [showMonthSection, setShowMonthSection] = useState(false);
  const [showDonorLookup, setShowDonorLookup] = useState(false);
  const [showYearlyReport, setShowYearlyReport] = useState(false);

  // Receipts: key = `${year}-${month}` (month 1-based), value = public URL
  const [receipts, setReceipts] = useState<Record<string, string>>({});

  const openModal = (opts: Omit<ModalState, 'open'>) => setModal({ open: true, ...opts });
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .order('donation_date', { ascending: false });
    setDonations(data ?? []);
    setLoading(false);
  }, [supabase]);

  const fetchReceipts = useCallback(async () => {
    const { data } = await supabase.from('monthly_receipts').select('year, month, storage_path');
    if (!data) return;
    const map: Record<string, string> = {};
    for (const r of data) {
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(r.storage_path);
      map[`${r.year}-${r.month}`] = publicUrl;
    }
    setReceipts(map);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') { router.push('/'); return; }
      fetchData();
      fetchReceipts();
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

    if (!editingDonation && data.donor_phone) {
      await supabase.from('donors').upsert(
        { phone: data.donor_phone, name: data.donor_name, location: data.donor_location || null, updated_at: new Date().toISOString() },
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

  const handleSplitSubmit = async (base: SplitDonationBase, year: number, months: number[]) => {
    setSaving(true);

    if (base.donor_phone) {
      await supabase.from('donors').upsert(
        { phone: base.donor_phone, name: base.donor_name, location: base.donor_location || null, updated_at: new Date().toISOString() },
        { onConflict: 'phone', ignoreDuplicates: false }
      );
    }

    const total = parseFloat(base.amount);
    const count = months.length;
    // Distribute evenly; last entry absorbs any rounding remainder
    const perMonth = Math.floor((total / count) * 100) / 100;
    const lastAmount = Math.round((total - perMonth * (count - 1)) * 100) / 100;

    const records = months.map((monthIdx, i) => ({
      donor_name: base.donor_name,
      donor_phone: base.donor_phone || null,
      donor_location: base.donor_location || null,
      campaign_id: null,
      amount: i === count - 1 ? lastAmount : perMonth,
      donation_date: `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`,
      notes: base.notes || null,
    }));

    const { error } = await supabase.from('donations').insert(records);
    if (error) { showToast(error.message || 'Something went wrong.', 'error'); setSaving(false); return; }

    showToast(`Split across ${count} month${count !== 1 ? 's' : ''} of ${year}!`);
    await fetchData();
    setShowDonationForm(false);
    setSaving(false);
  };

  const handleUploadReceipt = async (year: number, month: number, file: File) => {
    try {
      const compressed = await compressImage(file);
      const path = `${year}/${String(month).padStart(2, '0')}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) { showToast(uploadError.message, 'error'); return; }
      await supabase.from('monthly_receipts').upsert(
        { year, month, storage_path: path },
        { onConflict: 'year,month' }
      );
      await fetchReceipts();
      showToast('Receipt uploaded!');
    } catch {
      showToast('Upload failed — please try again.', 'error');
    }
  };

  const handleDonationEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setShowDonationForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDonationDelete = (id: string) => openModal({
    title: 'Delete Donation',
    message: 'This will permanently remove this donation record from the database.',
    confirmLabel: 'Delete',
    onConfirm: async () => {
      closeModal();
      await supabase.from('donations').delete().eq('id', id);
      await fetchData();
      showToast('Donation deleted');
    },
  });

  const handleDeleteMonthDonations = () => {
    if (filteredDonations.length === 0) return;
    openModal({
      title: `Delete All — ${MONTHS[selectedMonth]} ${selectedYear}`,
      message: `Permanently delete all ${filteredDonations.length} donation${filteredDonations.length !== 1 ? 's' : ''} for ${MONTHS[selectedMonth]} ${selectedYear}? This cannot be undone.`,
      confirmLabel: `Delete ${filteredDonations.length} Record${filteredDonations.length !== 1 ? 's' : ''}`,
      onConfirm: async () => {
        closeModal(); setSaving(true);
        const ids = filteredDonations.map(d => d.id);
        await supabase.from('donations').delete().in('id', ids);
        await fetchData();
        showToast(`Deleted all donations for ${MONTHS[selectedMonth]} ${selectedYear}`);
        setSaving(false);
      },
    });
  };

  // ── Derived data ───────────────────────────────────────
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    yrs.add(now.getFullYear());
    for (const d of donations) yrs.add(Number(d.donation_date.split('-')[0]));
    return [...yrs].sort((a, b) => b - a);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donations]);

  const filteredDonations = useMemo(() => donations.filter(d => {
    const [y, m] = d.donation_date.split('-').map(Number);
    return y === selectedYear && m - 1 === selectedMonth;
  }), [donations, selectedYear, selectedMonth]);

  const filteredTotal = filteredDonations.reduce((s, d) => s + Number(d.amount), 0);
  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);
  const uniqueDonorCount = useMemo(() => {
    const keys = new Set<string>();
    for (const d of donations) keys.add(d.donor_phone ?? d.donor_name);
    return keys.size;
  }, [donations]);

  // "YYYY-MM" string for the currently selected month — passed to AddDonationForm
  const selectedMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

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
          <div className="flex flex-col gap-4 animate-slide-down">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#a7f3d0', border: '1px solid rgba(167,243,208,0.4)' }}>
                Admin Panel
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-1">Dashboard</h1>
              <p className="text-emerald-200 text-sm mt-1">Manage mosque donation records</p>
            </div>

            {!loading && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {/* Card 1 — Total Donors */}
                <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#a7f3d0' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300 leading-none">Total Donors</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-white leading-tight mt-0.5">
                      {uniqueDonorCount}
                    </p>
                  </div>
                </div>
                {/* Card 2 — Total Raised */}
                <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#6ee7b7' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300 leading-none">Total Raised</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-white leading-tight mt-0.5">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
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
          <>
            {/* ── Add Donation button — always visible at top ── */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: 'var(--c-text-2)' }}>
                {showDonationForm && !editingDonation ? 'New Donation' : showDonationForm ? 'Edit Donation' : ''}
              </p>
              {!showDonationForm ? (
                <button
                  onClick={() => { setEditingDonation(null); setShowDonationForm(true); setShowMonthSection(true); }}
                  className="btn-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Donation
                </button>
              ) : (
                <button onClick={() => { setShowDonationForm(false); setEditingDonation(null); }}
                  className="btn-ghost py-2 px-4 text-sm">
                  ✕ Cancel
                </button>
              )}
            </div>

            {/* Add / Edit form — shown above month browser */}
            {showDonationForm && (
              <div className="rounded-2xl animate-slide-down"
                style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 16px var(--c-shadow)' }}>
                <div className="px-5 sm:px-6 py-4"
                  style={{ borderBottom: '1.5px solid var(--c-border)', background: 'var(--c-card-alt)' }}>
                  <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>
                    {editingDonation ? 'Edit Donation' : 'New Donation'}
                  </h2>
                </div>
                <div className="p-5 sm:p-6">
                  {editingDonation ? (
                    <DonationForm
                      initial={editingDonation}
                      campaigns={[]}
                      onSubmit={handleDonationSubmit}
                      onCancel={() => { setShowDonationForm(false); setEditingDonation(null); }}
                      loading={saving}
                    />
                  ) : (
                    <AddDonationForm
                      initialMonth={selectedMonthStr}
                      onLookupDonor={lookupDonor}
                      onSubmit={handleDonationSubmit}
                      onSubmitSplit={handleSplitSubmit}
                      onCancel={() => setShowDonationForm(false)}
                      loading={saving}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Donations by Month (toggleable) ── */}
            <div className="rounded-2xl overflow-hidden animate-fade-in"
              style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 16px var(--c-shadow)' }}>

              {/* Toggle header */}
              <button
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
                style={{ borderBottom: showMonthSection ? '1.5px solid var(--c-border)' : 'none', background: 'var(--c-card-alt)' }}
                onClick={() => setShowMonthSection(v => !v)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0' }}>🗂️</div>
                  <div className="text-left">
                    <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>Donations by Month</h2>
                    <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>{donations.length} total records</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Year dropdown — always accessible even when collapsed */}
                  <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                    <label className="text-sm font-semibold hidden sm:block" style={{ color: 'var(--c-text-2)' }}>Year</label>
                    <select
                      value={selectedYear}
                      onChange={e => { setSelectedYear(Number(e.target.value)); setShowDonationForm(false); setEditingDonation(null); }}
                      className="input w-24 appearance-none cursor-pointer py-1.5 text-sm"
                    >
                      {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <svg
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ color: 'var(--c-text-3)', transform: showMonthSection ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showMonthSection && (
                <>
                  {/* Month grid */}
                  <div className="px-5 sm:px-6 py-4" style={{ borderBottom: '1.5px solid var(--c-border)' }}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                      {MONTHS.map((name, idx) => {
                        const isSelected = idx === selectedMonth;
                        const hasDonations = donations.some(d => {
                          const [y, m] = d.donation_date.split('-').map(Number);
                          return y === selectedYear && m - 1 === idx;
                        });
                        return (
                          <button
                            key={name}
                            onClick={() => { setSelectedMonth(idx); setEditingDonation(null); }}
                            className="relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-semibold text-xs transition-all duration-150 focus:outline-none"
                            style={isSelected ? {
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              color: 'white',
                              boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
                              transform: 'translateY(-1px)',
                            } : {
                              background: 'var(--c-bg)',
                              color: 'var(--c-text-2)',
                              border: '1.5px solid var(--c-border)',
                            }}
                          >
                            {name.slice(0, 3)}
                            {hasDonations && (
                              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--c-accent)' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Month total bar + secondary actions */}
                  <div className="px-5 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2"
                    style={{ borderBottom: '1.5px solid var(--c-border)', background: 'var(--c-card-alt)' }}>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>
                        {MONTHS[selectedMonth]} {selectedYear}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
                        {filteredDonations.length} record{filteredDonations.length !== 1 ? 's' : ''}
                      </span>
                      {filteredTotal > 0 && (
                        <span className="font-bold text-sm" style={{ color: 'var(--c-accent)' }}>
                          {formatCurrency(filteredTotal)}
                        </span>
                      )}
                    </div>
                    {filteredDonations.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const receiptUrl = receipts[`${selectedYear}-${selectedMonth + 1}`];
                            await generateMonthlyDonorReportPDF(MONTHS[selectedMonth], selectedYear, filteredDonations, receiptUrl);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1.5px solid var(--c-border-2)' }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="hidden sm:inline">Monthly PDF</span>
                        </button>
                        <button onClick={handleDeleteMonthDonations}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">Delete Month</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Donation table */}
                  <div className="p-5 sm:p-6">
                    <AdminDonationTable
                      donations={filteredDonations}
                      onEdit={handleDonationEdit}
                      onDelete={handleDonationDelete}
                    />
                  </div>
                </>
              )}
            </div>

            {/* ── Donor Lookup (toggleable) ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 16px var(--c-shadow)' }}>
              <button
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--c-card-alt)' }}
                onClick={() => setShowDonorLookup(v => !v)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)', color: 'var(--c-accent)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>Donor Lookup</h2>
                    <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>Search contribution history by phone</p>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 transition-transform duration-200 shrink-0"
                  style={{ color: 'var(--c-text-3)', transform: showDonorLookup ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDonorLookup && (
                <div style={{ borderTop: '1.5px solid var(--c-border)' }}>
                  <DonorSearch donations={donations} hideHeader />
                </div>
              )}
            </div>

            {/* ── Yearly Report (toggleable) ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 16px var(--c-shadow)' }}>
              <button
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--c-card-alt)' }}
                onClick={() => setShowYearlyReport(v => !v)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)', color: 'var(--c-accent)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>Yearly Report</h2>
                    <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>Annual breakdown + PDF download</p>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 transition-transform duration-200 shrink-0"
                  style={{ color: 'var(--c-text-3)', transform: showYearlyReport ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showYearlyReport && (
                <div style={{ borderTop: '1.5px solid var(--c-border)' }}>
                  <YearlyReportTable
                    donations={donations}
                    year={reportYear}
                    availableYears={availableYears}
                    onYearChange={setReportYear}
                    hideTitle
                    receipts={receipts}
                    onUploadReceipt={handleUploadReceipt}
                    onDownload={() => generateYearlyReportPDF(
                      reportYear,
                      donations.filter(d => Number(d.donation_date.split('-')[0]) === reportYear)
                    )}
                  />
                </div>
              )}
            </div>
          </>
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
