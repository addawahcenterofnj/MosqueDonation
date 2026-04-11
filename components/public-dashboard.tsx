'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Donation } from '@/types/donation';
import Navbar from '@/components/navbar';
import YearlyReportTable from '@/components/yearly-report-table';
import { formatCurrency } from '@/lib/utils';
import DonorSearch from '@/components/donor-search';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-5 py-3.5">
      <div className="skeleton h-4 w-6 rounded" />
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 w-20 rounded" />
    </div>
  );
}

export default function PublicDashboardClient() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Browser history picker state — default to current month/year
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  // Yearly report year state
  const [reportYear, setReportYear] = useState(now.getFullYear());

  // Toggle states — all collapsed by default
  const [showMonthBrowser, setShowMonthBrowser] = useState(false);
  const [showDonorLookup, setShowDonorLookup] = useState(false);
  const [showYearlyReport, setShowYearlyReport] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('donations')
        .select('*')
        .order('donation_date', { ascending: false });
      setDonations(data ?? []);
      setLoading(false);
    }
    load();

    // Real-time: re-fetch whenever admin adds, edits, or deletes a donation
    const channel = supabase
      .channel('donations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Current month (always today's month) ──────────────
  const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const currentMonthDonations = useMemo(() => donations.filter(d => {
    const [y, m] = d.donation_date.split('-').map(Number);
    return y === now.getFullYear() && m - 1 === now.getMonth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [donations]);

  const currentMonthDonors = useMemo(() => {
    const map = new Map<string, { name: string; location: string | null; total: number }>();
    for (const d of currentMonthDonations) {
      const key = d.donor_phone ?? d.donor_name;
      if (map.has(key)) {
        map.get(key)!.total += Number(d.amount);
      } else {
        map.set(key, { name: d.donor_name, location: d.donor_location, total: Number(d.amount) });
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [currentMonthDonations]);

  const currentMonthTotal = currentMonthDonations.reduce((s, d) => s + Number(d.amount), 0);

  // ── Available years derived from data ──────────────────
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    yrs.add(now.getFullYear());
    for (const d of donations) yrs.add(Number(d.donation_date.split('-')[0]));
    return [...yrs].sort((a, b) => b - a);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donations]);

  // ── History browser — filter by selected year + month ─
  const historyDonations = useMemo(() => donations.filter(d => {
    const [y, m] = d.donation_date.split('-').map(Number);
    return y === selectedYear && m - 1 === selectedMonth;
  }), [donations, selectedYear, selectedMonth]);

  const historyDonors = useMemo(() => {
    const map = new Map<string, { name: string; phone: string | null; location: string | null; total: number }>();
    for (const d of historyDonations) {
      const key = d.donor_phone ?? d.donor_name;
      if (map.has(key)) {
        map.get(key)!.total += Number(d.amount);
      } else {
        map.set(key, { name: d.donor_name, phone: d.donor_phone, location: d.donor_location, total: Number(d.amount) });
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [historyDonations]);

  const historyTotal = historyDonations.reduce((s, d) => s + Number(d.amount), 0);
  const historyLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;

  // KPI — current calendar year
  const thisYearDonations = useMemo(() =>
    donations.filter(d => Number(d.donation_date.split('-')[0]) === now.getFullYear()),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [donations]);
  const thisYearTotal = thisYearDonations.reduce((s, d) => s + Number(d.amount), 0);

  // Unique donor count across all time (by phone, fallback to name)
  const uniqueDonorCount = useMemo(() => {
    const keys = new Set<string>();
    for (const d of donations) keys.add(d.donor_phone ?? d.donor_name);
    return keys.size;
  }, [donations]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>
      <Navbar />

      {/* Hero — KPI banner */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent)' }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="grid grid-cols-2 gap-3 animate-slide-down">
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
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300 leading-none">
                  Total Donors
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-white leading-tight mt-0.5">
                  {loading ? '—' : uniqueDonorCount}
                </p>
              </div>
            </div>

            {/* Card 2 — Total Raised this year */}
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
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300 leading-none">
                  {now.getFullYear()} Raised
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-white leading-tight mt-0.5">
                  {loading ? '—' : formatCurrency(thisYearTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Current Month Donors ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📅</span>
            <h2 className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>{currentMonthLabel} Donors</h2>
            {!loading && (
              <span className="ml-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
                {currentMonthDonors.length} donor{currentMonthDonors.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)' }}>
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : currentMonthDonors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in"
              style={{ background: 'var(--c-card)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
              <svg className="w-10 h-10 mb-3" style={{ color: 'var(--c-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donations this month yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>Be the first to contribute in {currentMonthLabel}!</p>
            </div>
          ) : (
            <MonthTable
              label={currentMonthLabel}
              total={currentMonthTotal}
              donors={currentMonthDonors.map(d => ({ ...d, phone: null }))}
              showPhone={false}
            />
          )}
        </section>

        {/* ── Monthly History Browser (collapsible) ── */}
        <section>
          <button
            onClick={() => setShowMonthBrowser(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-3 transition-colors"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 6px var(--c-shadow)' }}>
            <div className="flex items-center gap-2.5">
              <span className="text-base">🗂️</span>
              <span className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>Browse by Month</span>
            </div>
            <svg
              className="w-4 h-4 transition-transform duration-200"
              style={{ color: 'var(--c-text-3)', transform: showMonthBrowser ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMonthBrowser && (
            <div className="animate-slide-down space-y-4 mb-6">
              {/* Controls: year dropdown + month grid */}
              <div className="rounded-2xl p-4 sm:p-5 space-y-4"
                style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 12px var(--c-shadow)' }}>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold shrink-0" style={{ color: 'var(--c-text-2)' }}>Year</label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="input w-32 appearance-none cursor-pointer"
                  >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {MONTHS.map((name, idx) => {
                    const isSelected = idx === selectedMonth;
                    const hasDonations = !loading && donations.some(d => {
                      const [y, m] = d.donation_date.split('-').map(Number);
                      return y === selectedYear && m - 1 === idx;
                    });
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedMonth(idx)}
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

              {loading ? (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)' }}>
                  {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : historyDonors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 animate-fade-in"
                  style={{ background: 'var(--c-card)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
                  <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donations for {historyLabel}</p>
                </div>
              ) : (
                <MonthTable label={historyLabel} total={historyTotal} donors={historyDonors} showPhone />
              )}
            </div>
          )}
        </section>

        {/* ── Donor Lookup (collapsible) ── */}
        <section>
          <button
            onClick={() => setShowDonorLookup(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-3 transition-colors"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 6px var(--c-shadow)' }}>
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔍</span>
              <span className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>Donor Lookup</span>
            </div>
            <svg
              className="w-4 h-4 transition-transform duration-200"
              style={{ color: 'var(--c-text-3)', transform: showDonorLookup ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDonorLookup && (
            <div className="animate-slide-down mb-6">
              <DonorSearch donations={donations} hideHeader />
            </div>
          )}
        </section>

        {/* ── Yearly Report (collapsible) ── */}
        <section className="pb-8">
          <button
            onClick={() => setShowYearlyReport(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-3 transition-colors"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 6px var(--c-shadow)' }}>
            <div className="flex items-center gap-2.5">
              <span className="text-base">📊</span>
              <span className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>Yearly Report</span>
            </div>
            <svg
              className="w-4 h-4 transition-transform duration-200"
              style={{ color: 'var(--c-text-3)', transform: showYearlyReport ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showYearlyReport && (
            <div className="animate-slide-down">
              <YearlyReportTable
                donations={donations}
                year={reportYear}
                availableYears={availableYears}
                onYearChange={setReportYear}
                hideTitle
              />
            </div>
          )}
        </section>

      </main>

      <footer className="py-6 text-center text-xs font-medium transition-colors"
        style={{ background: 'var(--c-accent-bg)', borderTop: '1px solid var(--c-border)', color: 'var(--c-accent-dark)' }}>
        🕌 Mosque Donation Tracker &mdash; Built with transparency for our community
      </footer>
    </div>
  );
}

// ── Shared donor table ─────────────────────────────────
interface DonorRow {
  name: string;
  phone?: string | null;
  location: string | null;
  total: number;
}

function MonthTable({
  label,
  total,
  donors,
  showPhone,
}: {
  label: string;
  total: number;
  donors: DonorRow[];
  showPhone: boolean;
}) {
  return (
    <div className="animate-slide-up">
      {/* Total bar */}
      <div className="flex items-center justify-between px-5 py-3 rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg, #064e3b, #047857)', color: 'white' }}>
        <span className="text-sm font-semibold opacity-90">{label} Total</span>
        <span className="text-lg font-extrabold">{formatCurrency(total)}</span>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden p-3"
        style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
        {donors.map((d, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: i === 0 ? 'var(--c-accent-bg)' : 'var(--c-bg)', border: '1px solid var(--c-border)' }}>
            <span className="text-xs font-extrabold w-5 text-center shrink-0" style={{ color: 'var(--c-text-3)' }}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>{d.name}</p>
              <div className="flex flex-col gap-0.5 mt-0.5">
                {showPhone && d.phone && (
                  <p className="text-xs truncate" style={{ color: 'var(--c-text-3)' }}>{d.phone}</p>
                )}
                {d.location && (
                  <p className="text-xs truncate" style={{ color: 'var(--c-text-3)' }}>{d.location}</p>
                )}
              </div>
            </div>
            <span className="font-bold text-sm shrink-0" style={{ color: 'var(--c-accent)' }}>
              {formatCurrency(d.total)}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto"
        style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--c-th-bg)' }}>
              <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)', width: '3rem' }}>#</th>
              <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Donor Name</th>
              {showPhone && <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Phone</th>}
              <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Location</th>
              <th className="px-5 py-3 text-right font-semibold" style={{ color: 'var(--c-th-text)' }}>Amount</th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--c-card)' }}>
            {donors.map((d, i) => (
              <tr key={i}
                className="transition-colors"
                style={{ borderTop: '1px solid var(--c-td-div)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-5 py-3.5 font-bold text-xs" style={{ color: 'var(--c-text-3)' }}>{i + 1}</td>
                <td className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ color: 'var(--c-text)' }}>{d.name}</td>
                {showPhone && (
                  <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>
                    {d.phone ?? '—'}
                  </td>
                )}
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
  );
}
