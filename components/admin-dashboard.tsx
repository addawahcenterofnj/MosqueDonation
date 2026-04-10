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

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('campaigns');

  // Campaign form state
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Donation form state
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: cData }, { data: dData }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase
        .from('donations')
        .select('*, campaigns(id, name)')
        .order('donation_date', { ascending: false }),
    ]);

    const rawCampaigns: Campaign[] = cData ?? [];
    const rawDonations: Donation[] = dData ?? [];

    const enriched = rawCampaigns.map((c) => {
      const total = rawDonations
        .filter((d) => d.campaign_id === c.id)
        .reduce((sum, d) => sum + Number(d.amount), 0);
      return { ...c, total_amount: total };
    });

    setCampaigns(enriched);
    setDonations(rawDonations);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Verify admin session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
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
    if (editingCampaign) {
      await supabase.from('campaigns').update(data).eq('id', editingCampaign.id);
    } else {
      await supabase.from('campaigns').insert(data);
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
  };

  // ── Donation CRUD ──────────────────────────────────────
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
    } else {
      await supabase.from('donations').insert(payload);
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
  };

  // ── PDF ────────────────────────────────────────────────
  const handleDownloadPDF = (campaign: Campaign) => {
    const campaignDonations = donations.filter((d) => d.campaign_id === campaign.id);
    generateCampaignPDF(campaign, campaignDonations);
  };

  const navItems: { key: Section; label: string }[] = [
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'donations', label: 'Donations' },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isAdmin onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage campaigns, donations, and reports.</p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeSection === key
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* ── Campaigns Section ── */}
            {activeSection === 'campaigns' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
                    </h2>
                    {!showCampaignForm && (
                      <button
                        onClick={() => { setEditingCampaign(null); setShowCampaignForm(true); }}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        + New Campaign
                      </button>
                    )}
                  </div>
                  {showCampaignForm && (
                    <CampaignForm
                      initial={editingCampaign}
                      onSubmit={handleCampaignSubmit}
                      onCancel={() => { setShowCampaignForm(false); setEditingCampaign(null); }}
                      loading={saving}
                    />
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    All Campaigns ({campaigns.length})
                  </h2>
                  <AdminCampaignTable
                    campaigns={campaigns}
                    onEdit={handleCampaignEdit}
                    onDelete={handleCampaignDelete}
                  />
                </div>
              </div>
            )}

            {/* ── Donations Section ── */}
            {activeSection === 'donations' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingDonation ? 'Edit Donation' : 'New Donation'}
                    </h2>
                    {!showDonationForm && (
                      <button
                        onClick={() => { setEditingDonation(null); setShowDonationForm(true); }}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        + Add Donation
                      </button>
                    )}
                  </div>
                  {showDonationForm && (
                    <DonationForm
                      initial={editingDonation}
                      campaigns={campaigns}
                      onSubmit={handleDonationSubmit}
                      onCancel={() => { setShowDonationForm(false); setEditingDonation(null); }}
                      loading={saving}
                    />
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    All Donations ({donations.length})
                  </h2>
                  <AdminDonationTable
                    donations={donations}
                    onEdit={handleDonationEdit}
                    onDelete={handleDonationDelete}
                  />
                </div>
              </div>
            )}

            {/* ── Reports Section ── */}
            {activeSection === 'reports' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Campaign Reports</h2>
                {campaigns.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No campaigns yet.</p>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 hover:border-emerald-300 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <p className="text-sm text-gray-500">
                            {donations.filter((d) => d.campaign_id === c.id).length} donations &middot;{' '}
                            <span className="text-emerald-700 font-medium">
                              {formatCurrency(c.total_amount ?? 0)}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadPDF(c)}
                          className="shrink-0 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <span>📄</span> Download PDF
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
