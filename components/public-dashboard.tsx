'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Donation } from '@/types/donation';
import { Campaign } from '@/types/campaign';
import { MonthlyReport } from '@/types/monthly-report';
import Navbar from '@/components/navbar';
import SummaryCards from '@/components/summary-cards';
import SearchFilters from '@/components/search-filters';
import DonationsTable from '@/components/donations-table';
import CampaignList from '@/components/campaign-list';
import MonthlyLiveReport from '@/components/monthly-live-report';
import { getYearsFromDonations } from '@/lib/utils';

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)' }}>
      <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-6 w-32 rounded" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-5 py-3.5">
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 w-20 rounded" />
      <div className="skeleton h-4 w-28 rounded" />
    </div>
  );
}

export default function PublicDashboardClient() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    async function load() {
      const [{ data: donationsData }, { data: campaignsData }, { data: monthlyData }] = await Promise.all([
        supabase.from('donations').select('*, campaigns(id, name)').order('donation_date', { ascending: false }),
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('monthly_reports').select('*').order('month', { ascending: false }),
      ]);
      const rawDonations: Donation[] = donationsData ?? [];
      const rawCampaigns: Campaign[] = campaignsData ?? [];
      const enriched = rawCampaigns.map((c) => ({
        ...c,
        total_amount: rawDonations.filter((d) => d.campaign_id === c.id).reduce((s, d) => s + Number(d.amount), 0),
      }));
      setDonations(rawDonations);
      setCampaigns(enriched);
      setMonthlyReports(monthlyData ?? []);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const years = useMemo(() => getYearsFromDonations(donations), [donations]);

  const filtered = useMemo(() => donations.filter((d) => {
    const n = searchName ? d.donor_name.toLowerCase().includes(searchName.toLowerCase()) : true;
    const p = searchPhone ? (d.donor_phone ?? '').includes(searchPhone) : true;
    const y = selectedYear ? new Date(d.donation_date).getFullYear() === parseInt(selectedYear) : true;
    return n && p && y;
  }), [donations, searchName, searchPhone, selectedYear]);

  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>
      <Navbar />

      {/* Hero banner */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent)' }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="animate-slide-down">
            <p className="text-emerald-300 text-sm font-semibold uppercase tracking-widest mb-2">Community Transparency</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">Donation Dashboard</h1>
            <p className="text-emerald-200 text-base sm:text-lg max-w-xl leading-relaxed">
              Every donation is recorded and publicly visible. See how our community comes together to support our mosque.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Summary cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <SummaryCards totalAmount={totalAmount} totalDonations={donations.length} totalCampaigns={campaigns.length} />
        )}

        {/* Search & Filter */}
        <section>
          <SectionHeader icon="🔍" title="Search & Filter" />
          <SearchFilters
            searchName={searchName} searchPhone={searchPhone} selectedYear={selectedYear} years={years}
            onSearchName={setSearchName} onSearchPhone={setSearchPhone} onYearChange={setSelectedYear}
          />
        </section>

        {/* Donations */}
        <section>
          <SectionHeader
            icon="💳" title="Donations"
            badge={loading ? undefined : `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
          />
          {loading ? (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)' }}>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <DonationsTable donations={filtered} showCampaign />
          )}
        </section>

        {/* Campaigns */}
        <section>
          <SectionHeader icon="🎯" title="Campaigns" />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)' }}>
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <CampaignList campaigns={campaigns} />
          )}
        </section>

        {/* Monthly Live Report */}
        {!loading && monthlyReports.length > 0 && (
          <section className="pb-8">
            <MonthlyLiveReport reports={monthlyReports} />
          </section>
        )}
      </main>

      <footer className="py-6 text-center text-xs font-medium transition-colors"
        style={{ background: 'var(--c-accent-bg)', borderTop: '1px solid var(--c-border)', color: 'var(--c-accent-dark)' }}>
        🕌 Mosque Donation Tracker &mdash; Built with transparency for our community
      </footer>
    </div>
  );
}

function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg">{icon}</span>
      <h2 className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>{title}</h2>
      {badge && (
        <span className="ml-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
          {badge}
        </span>
      )}
    </div>
  );
}
