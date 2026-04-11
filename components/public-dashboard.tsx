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
import { formatCurrency, getYearsFromDonations } from '@/lib/utils';

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

  // Current month donors
  const now = new Date();
  const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthDonations = useMemo(() => {
    return donations.filter(d => {
      const dt = new Date(d.donation_date);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donations]);

  // Aggregate by donor name for current month
  const currentMonthDonors = useMemo(() => {
    const map = new Map<string, { name: string; phone: string | null; location: string | null; total: number }>();
    for (const d of currentMonthDonations) {
      const key = d.donor_phone ?? d.donor_name;
      if (map.has(key)) {
        map.get(key)!.total += Number(d.amount);
      } else {
        map.set(key, { name: d.donor_name, phone: d.donor_phone, location: d.donor_location, total: Number(d.amount) });
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [currentMonthDonations]);

  const currentMonthTotal = currentMonthDonations.reduce((s, d) => s + Number(d.amount), 0);

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

        {/* Current Month Donors */}
        <section>
          <SectionHeader
            icon="📅"
            title={`${currentMonthLabel} Donors`}
            badge={loading ? undefined : `${currentMonthDonors.length} donor${currentMonthDonors.length !== 1 ? 's' : ''}`}
          />
          {loading ? (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)' }}>
              {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : currentMonthDonors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in"
              style={{ background: 'var(--c-card)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
              <svg className="w-10 h-10 mb-3" style={{ color: 'var(--c-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donations this month yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>Be the first to contribute in {currentMonthLabel}!</p>
            </div>
          ) : (
            <div className="animate-slide-up">
              {/* Summary bar */}
              <div className="flex items-center justify-between px-5 py-3 rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg,#064e3b,#047857)', color: 'white' }}>
                <span className="text-sm font-semibold opacity-90">{currentMonthLabel} Total</span>
                <span className="text-lg font-extrabold">{formatCurrency(currentMonthTotal)}</span>
              </div>

              {/* Mobile: cards */}
              <div className="flex flex-col gap-2 sm:hidden p-3"
                style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
                {currentMonthDonors.map((d, i) => (
                  <div key={d.phone ?? d.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: i === 0 ? 'var(--c-accent-bg)' : 'var(--c-bg)', border: '1px solid var(--c-border)' }}>
                    <span className="text-xs font-extrabold w-6 text-center shrink-0" style={{ color: 'var(--c-text-3)' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>{d.name}</p>
                      {d.location && <p className="text-xs truncate" style={{ color: 'var(--c-text-3)' }}>{d.location}</p>}
                    </div>
                    <span className="font-bold text-sm shrink-0" style={{ color: 'var(--c-accent)' }}>
                      {formatCurrency(d.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto"
                style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--c-th-bg)' }}>
                      <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)', width: '3rem' }}>#</th>
                      <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Donor Name</th>
                      <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Location</th>
                      <th className="px-5 py-3 text-right font-semibold" style={{ color: 'var(--c-th-text)' }}>Contribution</th>
                    </tr>
                  </thead>
                  <tbody style={{ background: 'var(--c-card)' }}>
                    {currentMonthDonors.map((d, i) => (
                      <tr key={d.phone ?? d.name}
                        className="transition-colors"
                        style={{ borderTop: '1px solid var(--c-td-div)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td className="px-5 py-3.5 font-bold text-xs" style={{ color: 'var(--c-text-3)' }}>{i + 1}</td>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--c-text)' }}>{d.name}</td>
                        <td className="px-5 py-3.5" style={{ color: 'var(--c-text-2)' }}>
                          {d.location ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 shrink-0" style={{ color: 'var(--c-text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {d.location}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-bold" style={{ color: 'var(--c-accent)' }}>{formatCurrency(d.total)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

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
