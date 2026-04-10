'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Campaign, CampaignFormData } from '@/types/campaign';
import { Donation, DonationFormData } from '@/types/donation';
import { MonthlyReport, MonthlyReportFormData } from '@/types/monthly-report';
import Navbar from '@/components/navbar';
import CampaignForm from '@/components/campaign-form';
import DonationForm from '@/components/donation-form';
import MonthlyReportForm from '@/components/monthly-report-form';
import AdminCampaignTable from '@/components/admin-campaign-table';
import AdminDonationTable from '@/components/admin-donation-table';
import MonthlyReportTable from '@/components/monthly-report-table';
import ConfirmModal from '@/components/confirm-modal';
import { generateCampaignPDF } from '@/lib/pdf';
import { formatCurrency } from '@/lib/utils';

type Section = 'campaigns' | 'donations' | 'reports' | 'monthly';
type ToastType = 'success' | 'error';

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

const SECTION_STYLE: Record<Section, { accent: string; light: string; border: string }> = {
  campaigns: { accent: '#6366f1', light: '#eef2ff', border: '#c7d2fe' },
  donations:  { accent: '#059669', light: '#ecfdf5', border: '#a7f3d0' },
  reports:    { accent: '#d97706', light: '#fffbeb', border: '#fde68a' },
  monthly:    { accent: '#0ea5e9', light: '#f0f9ff', border: '#bae6fd' },
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('campaigns');

  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [editingMonthly, setEditingMonthly] = useState<MonthlyReport | null>(null);

  const [modal, setModal] = useState<ModalState>({ open: false, title: '', message: '', onConfirm: () => {} });
  const openModal = (opts: Omit<ModalState, 'open'>) => setModal({ open: true, ...opts });
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchData = useCallback(async () => {
    const [{ data: cData }, { data: dData }, { data: mData }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('donations').select('*, campaigns(id, name)').order('donation_date', { ascending: false }),
      supabase.from('monthly_reports').select('*').order('month', { ascending: false }),
    ]);
    const rawCampaigns: Campaign[] = cData ?? [];
    const rawDonations: Donation[] = dData ?? [];
    setCampaigns(rawCampaigns.map(c => ({
      ...c,
      total_amount: rawDonations.filter(d => d.campaign_id === c.id).reduce((s, d) => s + Number(d.amount), 0),
    })));
    setDonations(rawDonations);
    setMonthlyReports(mData ?? []);
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

  // ── Campaign CRUD ──────────────────────────────────────
  const handleCampaignSubmit = async (data: CampaignFormData) => {
    setSaving(true);
    const { error } = editingCampaign
      ? await supabase.from('campaigns').update(data).eq('id', editingCampaign.id)
      : await supabase.from('campaigns').insert(data);
    if (error) { showToast(error.message || 'Something went wrong.', 'error'); setSaving(false); return; }
    showToast(editingCampaign ? 'Campaign updated!' : 'Campaign created!');
    await fetchData();
    setShowCampaignForm(false); setEditingCampaign(null); setSaving(false);
  };

  const handleCampaignEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign); setShowCampaignForm(true);
    setActiveSection('campaigns');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCampaignDelete = (id: string) => openModal({
    title: 'Delete Campaign',
    message: 'This will permanently delete the campaign and all its linked donations.',
    confirmLabel: 'Delete Campaign',
    onConfirm: async () => {
      closeModal();
      await supabase.from('donations').delete().eq('campaign_id', id);
      await supabase.from('campaigns').delete().eq('id', id);
      await fetchData(); showToast('Campaign deleted');
    },
  });

  const handleDeleteAllCampaigns = () => {
    if (campaigns.length === 0) return;
    openModal({
      title: 'Delete All Campaigns',
      message: `Permanently delete all ${campaigns.length} campaigns and all ${donations.length} donations? This cannot be undone.`,
      confirmLabel: `Delete All (${campaigns.length})`,
      onConfirm: async () => {
        closeModal(); setSaving(true);
        await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await fetchData(); showToast('All campaigns and donations deleted'); setSaving(false);
      },
    });
  };

  // ── Donation CRUD ──────────────────────────────────────
  const handleDonationSubmit = async (data: DonationFormData) => {
    setSaving(true);
    const payload = {
      donor_name: data.donor_name,
      donor_phone: data.donor_phone || null,
      donor_location: data.donor_location || null,
      campaign_id: data.campaign_id,
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
    setEditingDonation(donation); setShowDonationForm(true);
    setActiveSection('donations');
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
      message: `Permanently delete all ${donations.length} donation records? Campaign data will remain.`,
      confirmLabel: `Delete All (${donations.length})`,
      onConfirm: async () => {
        closeModal(); setSaving(true);
        await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await fetchData(); showToast('All donations deleted'); setSaving(false);
      },
    });
  };

  // ── Campaign donations clear (reports tab) ─────────────
  const handleDeleteCampaignDonations = (campaign: Campaign) => {
    const count = donations.filter(d => d.campaign_id === campaign.id).length;
    if (count === 0) { showToast('No donations for this campaign.'); return; }
    openModal({
      title: 'Clear Donations',
      message: `Delete all ${count} donation${count !== 1 ? 's' : ''} from "${campaign.name}"? The campaign stays.`,
      confirmLabel: `Delete ${count} Donation${count !== 1 ? 's' : ''}`,
      onConfirm: async () => {
        closeModal();
        await supabase.from('donations').delete().eq('campaign_id', campaign.id);
        await fetchData(); showToast(`Donations cleared from "${campaign.name}"`);
      },
    });
  };

  // ── Monthly Report CRUD ────────────────────────────────
  const handleMonthlySubmit = async (data: MonthlyReportFormData) => {
    setSaving(true);
    const payload = {
      month: data.month.trim(),
      amount: parseFloat(data.amount),
      notes: data.notes || null,
    };
    const { error } = editingMonthly
      ? await supabase.from('monthly_reports').update(payload).eq('id', editingMonthly.id)
      : await supabase.from('monthly_reports').insert(payload);
    if (error) {
      const msg = error.code === '23505'
        ? 'An entry for that month already exists.'
        : error.message || 'Something went wrong.';
      showToast(msg, 'error');
      setSaving(false);
      return;
    }
    showToast(editingMonthly ? 'Entry updated!' : 'Monthly entry added!');
    await fetchData();
    setShowMonthlyForm(false); setEditingMonthly(null); setSaving(false);
  };

  const handleMonthlyEdit = (r: MonthlyReport) => {
    setEditingMonthly(r); setShowMonthlyForm(true);
    setActiveSection('monthly');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMonthlyDelete = (id: string) => openModal({
    title: 'Delete Monthly Entry',
    message: 'Remove this monthly report entry permanently?',
    confirmLabel: 'Delete Entry',
    onConfirm: async () => {
      closeModal();
      await supabase.from('monthly_reports').delete().eq('id', id);
      await fetchData(); showToast('Monthly entry deleted');
    },
  });

  // ── PDF ────────────────────────────────────────────────
  const handleDownloadPDF = (campaign: Campaign) => {
    generateCampaignPDF(campaign, donations.filter(d => d.campaign_id === campaign.id));
    showToast('PDF report downloaded');
  };

  const totalAmount = campaigns.reduce((s, c) => s + (c.total_amount ?? 0), 0);
  const style = SECTION_STYLE[activeSection];

  const navItems: { key: Section; label: string; icon: string }[] = [
    { key: 'campaigns', label: 'Campaigns', icon: '🎯' },
    { key: 'donations', label: 'Donations', icon: '💳' },
    { key: 'monthly',   label: 'Monthly',   icon: '📅' },
    { key: 'reports',   label: 'Reports',   icon: '📄' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f9' }}>
      <Navbar isAdmin onLogout={handleLogout} />

      {/* ── Admin Hero Bar ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', borderBottom: '1px solid #1e3a5f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="animate-slide-down">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                  Admin Panel
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Manage your mosque donation data</p>
            </div>

            {!loading && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
                {[
                  { label: 'Total Raised',   value: formatCurrency(totalAmount),      color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' },
                  { label: 'Campaigns',      value: String(campaigns.length),          color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
                  { label: 'Donations',      value: String(donations.length),          color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)' },
                  { label: 'Monthly',        value: String(monthlyReports.length),     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
                ].map(stat => (
                  <div key={stat.label} className="text-center px-2 sm:px-4 py-2.5 rounded-xl"
                    style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                    <p className="text-sm sm:text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">

        {/* ── Section Tabs ── */}
        <div className="flex gap-0 p-1 rounded-2xl mb-6 w-full"
          style={{ background: '#e2e8f0', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
          {navItems.map(({ key, label, icon }) => {
            const s = SECTION_STYLE[key];
            const isActive = activeSection === key;
            return (
              <button key={key} onClick={() => setActiveSection(key)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-1 justify-center"
                style={isActive
                  ? { background: '#fff', color: s.accent, boxShadow: `0 2px 12px rgba(0,0,0,0.1), 0 0 0 1.5px ${s.accent}30` }
                  : { color: '#64748b' }
                }>
                <span className="text-sm sm:text-base">{icon}</span>
                <span>{label}</span>
                {!loading && (
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-extrabold hidden sm:inline"
                    style={isActive
                      ? { background: s.light, color: s.accent, border: `1px solid ${s.border}` }
                      : { background: '#f1f5f9', color: '#94a3b8' }
                    }>
                    {key === 'campaigns' ? campaigns.length
                      : key === 'donations' ? donations.length
                      : key === 'monthly' ? monthlyReports.length
                      : campaigns.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
              <svg className="w-8 h-8 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-gray-400 font-semibold">Loading your dashboard…</p>
          </div>
        ) : (
          <>
            {/* ════ CAMPAIGNS ════ */}
            {activeSection === 'campaigns' && (
              <div className="space-y-5 animate-fade-in">
                <SectionCard
                  icon="🎯" title={editingCampaign ? 'Edit Campaign' : showCampaignForm ? 'New Campaign' : 'Campaigns'}
                  subtitle={!showCampaignForm ? `${campaigns.length} total` : undefined}
                  style={style}
                  showForm={showCampaignForm}
                  extraAction={!showCampaignForm && campaigns.length > 0 ? (
                    <button onClick={handleDeleteAllCampaigns}
                      className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}>
                      <TrashIcon /> <span className="hidden sm:inline">Delete All</span>
                    </button>
                  ) : undefined}
                  primaryAction={!showCampaignForm ? (
                    <button onClick={() => { setEditingCampaign(null); setShowCampaignForm(true); }} className="btn-primary">
                      <PlusIcon /> <span className="hidden sm:inline">New Campaign</span><span className="sm:hidden">New</span>
                    </button>
                  ) : (
                    <button onClick={() => { setShowCampaignForm(false); setEditingCampaign(null); }} className="btn-ghost py-2 px-3 text-sm">✕ Cancel</button>
                  )}
                >
                  {showCampaignForm
                    ? <CampaignForm initial={editingCampaign} onSubmit={handleCampaignSubmit}
                        onCancel={() => { setShowCampaignForm(false); setEditingCampaign(null); }} loading={saving} />
                    : <AdminCampaignTable campaigns={campaigns} onEdit={handleCampaignEdit} onDelete={handleCampaignDelete} />
                  }
                </SectionCard>
              </div>
            )}

            {/* ════ DONATIONS ════ */}
            {activeSection === 'donations' && (
              <div className="space-y-5 animate-fade-in">
                <SectionCard
                  icon="💳" title={editingDonation ? 'Edit Donation' : showDonationForm ? 'New Donation' : 'Donations'}
                  subtitle={!showDonationForm ? `${donations.length} total` : undefined}
                  style={style}
                  showForm={showDonationForm}
                  extraAction={!showDonationForm && donations.length > 0 ? (
                    <button onClick={handleDeleteAllDonations}
                      className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}>
                      <TrashIcon /> <span className="hidden sm:inline">Delete All</span>
                    </button>
                  ) : undefined}
                  primaryAction={!showDonationForm ? (
                    <button onClick={() => { setEditingDonation(null); setShowDonationForm(true); }} className="btn-primary">
                      <PlusIcon /> <span className="hidden sm:inline">Add Donation</span><span className="sm:hidden">Add</span>
                    </button>
                  ) : (
                    <button onClick={() => { setShowDonationForm(false); setEditingDonation(null); }} className="btn-ghost py-2 px-3 text-sm">✕ Cancel</button>
                  )}
                >
                  {showDonationForm
                    ? <DonationForm initial={editingDonation} campaigns={campaigns} onSubmit={handleDonationSubmit}
                        onCancel={() => { setShowDonationForm(false); setEditingDonation(null); }} loading={saving} />
                    : <AdminDonationTable donations={donations} onEdit={handleDonationEdit} onDelete={handleDonationDelete} />
                  }
                </SectionCard>
              </div>
            )}

            {/* ════ MONTHLY ════ */}
            {activeSection === 'monthly' && (
              <div className="space-y-5 animate-fade-in">
                <SectionCard
                  icon="📅" title={editingMonthly ? 'Edit Entry' : showMonthlyForm ? 'New Monthly Entry' : 'Monthly Live Report'}
                  subtitle={!showMonthlyForm ? `${monthlyReports.length} entr${monthlyReports.length !== 1 ? 'ies' : 'y'}` : undefined}
                  style={style}
                  showForm={showMonthlyForm}
                  primaryAction={!showMonthlyForm ? (
                    <button onClick={() => { setEditingMonthly(null); setShowMonthlyForm(true); }} className="btn-primary">
                      <PlusIcon /> <span className="hidden sm:inline">Add Month</span><span className="sm:hidden">Add</span>
                    </button>
                  ) : (
                    <button onClick={() => { setShowMonthlyForm(false); setEditingMonthly(null); }} className="btn-ghost py-2 px-3 text-sm">✕ Cancel</button>
                  )}
                >
                  {showMonthlyForm
                    ? <MonthlyReportForm initial={editingMonthly} onSubmit={handleMonthlySubmit}
                        onCancel={() => { setShowMonthlyForm(false); setEditingMonthly(null); }} loading={saving} />
                    : <MonthlyReportTable reports={monthlyReports} onEdit={handleMonthlyEdit} onDelete={handleMonthlyDelete} />
                  }
                </SectionCard>
              </div>
            )}

            {/* ════ REPORTS ════ */}
            {activeSection === 'reports' && (
              <div className="animate-fade-in">
                <SectionCard
                  icon="📄" title="Campaign Reports"
                  subtitle="Download PDF or clear donations per campaign"
                  style={style}
                  showForm={false}
                >
                  {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center py-16"
                      style={{ background: '#f9fafb', borderRadius: '1rem', border: '1.5px dashed #e5e7eb' }}>
                      <span className="text-5xl mb-3">📄</span>
                      <p className="font-semibold text-gray-500">No campaigns yet</p>
                      <button onClick={() => setActiveSection('campaigns')} className="mt-4 btn-primary text-sm py-2">
                        Go to Campaigns
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaigns.map((c) => {
                        const count = donations.filter(d => d.campaign_id === c.id).length;
                        return (
                          <div key={c.id} className="rounded-2xl overflow-hidden transition-all"
                            style={{ border: '1.5px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                  style={{ background: style.light, border: `1px solid ${style.border}` }}>🎯</div>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 truncate">{c.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-xs font-semibold" style={{ color: '#059669' }}>{formatCurrency(c.total_amount ?? 0)}</span>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-xs text-gray-500">{count} donation{count !== 1 ? 's' : ''}</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                      style={c.is_active
                                        ? { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
                                        : { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                                      {c.is_active ? '● Active' : '○ Ended'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => handleDeleteCampaignDonations(c)}
                                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg"
                                  style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}>
                                  <TrashIcon /> <span className="hidden sm:inline">Clear Donations</span><span className="sm:hidden">Clear</span>
                                </button>
                                <button onClick={() => handleDownloadPDF(c)} className="btn-primary text-xs sm:text-sm py-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal open={modal.open} title={modal.title} message={modal.message}
        confirmLabel={modal.confirmLabel} danger onConfirm={modal.onConfirm} onCancel={closeModal} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-2xl whitespace-nowrap"
            style={toastType === 'success'
              ? { background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 8px 30px rgba(5,150,105,0.5)' }
              : { background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 8px 30px rgba(239,68,68,0.5)' }
            }>
            {toastType === 'success'
              ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            }
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small reusable helpers ─────────────────────────────
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

interface SectionCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  style: { accent: string; light: string; border: string };
  showForm: boolean;
  extraAction?: React.ReactNode;
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ icon, title, subtitle, style, showForm, extraAction, primaryAction, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${showForm ? style.border : '#e2e8f0'}`, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div className="px-5 sm:px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: `1.5px solid ${showForm ? style.border : '#f1f5f9'}`, background: showForm ? style.light : '#fafbfc' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: style.light, border: `1.5px solid ${style.border}` }}>{icon}</div>
          <div>
            <h2 className="font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {extraAction}
          {primaryAction}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}
