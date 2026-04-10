'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Campaign, CampaignFormData } from '@/types/campaign';
import { Donation, DonationFormData } from '@/types/donation';
import Navbar from '@/components/navbar';
import CampaignForm from '@/components/campaign-form';
import DonationForm from '@/components/donation-form';
import AdminCampaignTable from '@/components/admin-campaign-table';
import AdminDonationTable from '@/components/admin-donation-table';
import { generateCampaignPDF } from '@/lib/pdf';
import { formatCurrency } from '@/lib/utils';

type Section = 'campaigns' | 'donations' | 'reports';

const TAB_ICONS: Record<Section, string> = {
  campaigns: '🎯',
  donations: '💳',
  reports: '📄',
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('campaigns');
  const [toast, setToast] = useState('');

  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    const [{ data: cData }, { data: dData }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('donations').select('*, campaigns(id, name)').order('donation_date', { ascending: false }),
    ]);
    const rawCampaigns: Campaign[] = cData ?? [];
    const rawDonations: Donation[] = dData ?? [];
    const enriched = rawCampaigns.map(c => ({
      ...c,
      total_amount: rawDonations.filter(d => d.campaign_id === c.id).reduce((s, d) => s + Number(d.amount), 0),
    }));
    setCampaigns(enriched);
    setDonations(rawDonations);
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

  // Campaign CRUD
  const handleCampaignSubmit = async (data: CampaignFormData) => {
    setSaving(true);
    if (editingCampaign) {
      await supabase.from('campaigns').update(data).eq('id', editingCampaign.id);
      showToast('Campaign updated successfully');
    } else {
      await supabase.from('campaigns').insert(data);
      showToast('Campaign created successfully');
    }
    await fetchData();
    setShowCampaignForm(false);
    setEditingCampaign(null);
    setSaving(false);
  };

  const handleCampaignEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowCampaignForm(true);
    setActiveSection('campaigns');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCampaignDelete = async (id: string) => {
    if (!confirm('Delete this campaign? All donations linked to it will be affected.')) return;
    await supabase.from('campaigns').delete().eq('id', id);
    await fetchData();
    showToast('Campaign deleted');
  };

  // Donation CRUD
  const handleDonationSubmit = async (data: DonationFormData) => {
    setSaving(true);
    const payload = {
      donor_name: data.donor_name,
      donor_phone: data.donor_phone || null,
      campaign_id: data.campaign_id,
      amount: parseFloat(data.amount),
      donation_date: data.donation_date,
      notes: data.notes || null,
    };
    if (editingDonation) {
      await supabase.from('donations').update(payload).eq('id', editingDonation.id);
      showToast('Donation updated successfully');
    } else {
      await supabase.from('donations').insert(payload);
      showToast('Donation added successfully');
    }
    await fetchData();
    setShowDonationForm(false);
    setEditingDonation(null);
    setSaving(false);
  };

  const handleDonationEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setShowDonationForm(true);
    setActiveSection('donations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDonationDelete = async (id: string) => {
    if (!confirm('Delete this donation?')) return;
    await supabase.from('donations').delete().eq('id', id);
    await fetchData();
    showToast('Donation deleted');
  };

  const handleDownloadPDF = (campaign: Campaign) => {
    generateCampaignPDF(campaign, donations.filter(d => d.campaign_id === campaign.id));
    showToast('PDF downloaded');
  };

  const totalAmount = campaigns.reduce((s, c) => s + (c.total_amount ?? 0), 0);

  const navItems: { key: Section; label: string }[] = [
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'donations', label: 'Donations' },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <Navbar isAdmin onLogout={handleLogout} />

      {/* Admin hero bar */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderBottom: '1px solid #475569' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="animate-slide-down">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin Panel</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Dashboard</h1>
            </div>
            {!loading && (
              <div className="flex gap-3 animate-fade-in">
                {[
                  { label: 'Total Raised', value: formatCurrency(totalAmount), color: '#34d399' },
                  { label: 'Campaigns', value: String(campaigns.length), color: '#818cf8' },
                  { label: 'Donations', value: String(donations.length), color: '#38bdf8' },
                ].map(stat => (
                  <div key={stat.label} className="text-center px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <p className="text-lg font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-full sm:w-fit"
          style={{ background: '#e2e8f0' }}>
          {navItems.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveSection(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 sm:flex-none justify-center"
              style={activeSection === key
                ? { background: '#fff', color: '#059669', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                : { color: '#64748b' }
              }>
              <span>{TAB_ICONS[key]}</span>
              {label}
              {!loading && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={activeSection === key
                    ? { background: '#ecfdf5', color: '#059669' }
                    : { background: '#f1f5f9', color: '#94a3b8' }
                  }>
                  {key === 'campaigns' ? campaigns.length : key === 'donations' ? donations.length : campaigns.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg className="w-10 h-10 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-400 font-medium">Loading dashboard…</p>
          </div>
        ) : (
          <>
            {/* ── Campaigns ── */}
            {activeSection === 'campaigns' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-white rounded-2xl p-5 sm:p-6"
                  style={{ border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {editingCampaign ? '✏️ Edit Campaign' : showCampaignForm ? '➕ New Campaign' : 'Campaigns'}
                      </h2>
                      {!showCampaignForm && (
                        <p className="text-sm text-gray-500 mt-0.5">{campaigns.length} total</p>
                      )}
                    </div>
                    {!showCampaignForm && (
                      <button onClick={() => { setEditingCampaign(null); setShowCampaignForm(true); }}
                        className="btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        New Campaign
                      </button>
                    )}
                  </div>
                  {showCampaignForm && (
                    <CampaignForm initial={editingCampaign} onSubmit={handleCampaignSubmit}
                      onCancel={() => { setShowCampaignForm(false); setEditingCampaign(null); }} loading={saving} />
                  )}
                  {!showCampaignForm && (
                    <AdminCampaignTable campaigns={campaigns} onEdit={handleCampaignEdit} onDelete={handleCampaignDelete} />
                  )}
                </div>
              </div>
            )}

            {/* ── Donations ── */}
            {activeSection === 'donations' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-white rounded-2xl p-5 sm:p-6"
                  style={{ border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {editingDonation ? '✏️ Edit Donation' : showDonationForm ? '➕ Add Donation' : 'Donations'}
                      </h2>
                      {!showDonationForm && (
                        <p className="text-sm text-gray-500 mt-0.5">{donations.length} total</p>
                      )}
                    </div>
                    {!showDonationForm && (
                      <button onClick={() => { setEditingDonation(null); setShowDonationForm(true); }}
                        className="btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Donation
                      </button>
                    )}
                  </div>
                  {showDonationForm && (
                    <DonationForm initial={editingDonation} campaigns={campaigns} onSubmit={handleDonationSubmit}
                      onCancel={() => { setShowDonationForm(false); setEditingDonation(null); }} loading={saving} />
                  )}
                  {!showDonationForm && (
                    <AdminDonationTable donations={donations} onEdit={handleDonationEdit} onDelete={handleDonationDelete} />
                  )}
                </div>
              </div>
            )}

            {/* ── Reports ── */}
            {activeSection === 'reports' && (
              <div className="animate-fade-in">
                <div className="bg-white rounded-2xl p-5 sm:p-6"
                  style={{ border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Campaign Reports</h2>
                  <p className="text-sm text-gray-500 mb-5">Download a PDF report for any campaign.</p>
                  {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-gray-400"
                      style={{ background: '#f9fafb', borderRadius: '1rem', border: '1.5px dashed #e5e7eb' }}>
                      <span className="text-4xl mb-2">📄</span>
                      <p className="font-medium text-gray-500">No campaigns yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaigns.map((c) => {
                        const count = donations.filter(d => d.campaign_id === c.id).length;
                        return (
                          <div key={c.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl transition-all"
                            style={{ border: '1.5px solid #e2e8f0', background: '#fafafa' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = '#a7f3d0';
                              (e.currentTarget as HTMLElement).style.background = '#f0fdf4';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                              (e.currentTarget as HTMLElement).style.background = '#fafafa';
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>🎯</div>
                              <div>
                                <p className="font-bold text-gray-900">{c.name}</p>
                                <p className="text-sm text-gray-500">
                                  {count} donation{count !== 1 ? 's' : ''} &middot;{' '}
                                  <span className="font-semibold" style={{ color: '#059669' }}>
                                    {formatCurrency(c.total_amount ?? 0)}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <button onClick={() => handleDownloadPDF(c)} className="btn-primary shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download PDF
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 30px rgba(5,150,105,0.4)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
