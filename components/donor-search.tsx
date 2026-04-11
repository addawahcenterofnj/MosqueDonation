'use client';

import { useState, useMemo } from 'react';
import { Donation } from '@/types/donation';
import { formatCurrency } from '@/lib/utils';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatPhone(digits: string) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

interface DonorSearchProps {
  donations: Donation[];
}

export default function DonorSearch({ donations }: DonorSearchProps) {
  const [rawPhone, setRawPhone] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const digits = rawPhone.replace(/\D/g, '');

  const handleSearch = () => {
    if (digits.length === 10) setSearchedPhone(digits);
  };

  const handleClear = () => {
    setRawPhone('');
    setSearchedPhone('');
  };

  // All donations for this donor
  const donorDonations = useMemo(
    () => (searchedPhone ? donations.filter(d => d.donor_phone === searchedPhone) : []),
    [donations, searchedPhone]
  );

  const donorInfo = donorDonations[0] ?? null;
  const allTimeTotal = donorDonations.reduce((s, d) => s + Number(d.amount), 0);

  // Available years from donor's donations
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    for (const d of donorDonations) yrs.add(Number(d.donation_date.split('-')[0]));
    if (yrs.size === 0) yrs.add(new Date().getFullYear());
    return [...yrs].sort((a, b) => b - a);
  }, [donorDonations]);

  // Auto-select most recent year when donor changes
  const effectiveYear = availableYears.includes(selectedYear) ? selectedYear : availableYears[0];

  // Monthly breakdown for selected year
  const monthlyRows = useMemo(() => {
    const yearDonations = donorDonations.filter(
      d => Number(d.donation_date.split('-')[0]) === effectiveYear
    );
    return MONTHS.map((name, idx) => {
      const md = yearDonations.filter(
        d => Number(d.donation_date.split('-')[1]) - 1 === idx
      );
      return {
        month: name,
        count: md.length,
        total: md.reduce((s, d) => s + Number(d.amount), 0),
      };
    });
  }, [donorDonations, effectiveYear]);

  const yearTotal = monthlyRows.reduce((s, r) => s + r.total, 0);
  const hasAnyMonth = monthlyRows.some(r => r.count > 0);

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 16px var(--c-shadow)' }}>

      {/* Header */}
      <div className="px-5 sm:px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: '1.5px solid var(--c-border)', background: 'var(--c-card-alt)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)', color: 'var(--c-accent)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>Donor Lookup</h2>
          <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>Search by phone to view contribution history</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-5 sm:px-6 py-4" style={{ borderBottom: '1.5px solid var(--c-border)' }}>
        <div className="flex gap-2">
          <input
            type="tel"
            value={formatPhone(digits)}
            onChange={e => {
              const d = e.target.value.replace(/\D/g, '').slice(0, 10);
              setRawPhone(d);
            }}
            onKeyDown={e => e.key === 'Enter' && digits.length === 10 && handleSearch()}
            placeholder="(555) 555-5555"
            className="input flex-1"
          />
          {searchedPhone ? (
            <button onClick={handleClear} className="btn-ghost px-4 text-sm whitespace-nowrap">
              Clear
            </button>
          ) : (
            <button
              onClick={handleSearch}
              disabled={digits.length !== 10}
              className="btn-primary px-4 whitespace-nowrap disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          )}
        </div>
        {digits.length > 0 && digits.length < 10 && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--c-text-3)' }}>
            {10 - digits.length} more digit{10 - digits.length !== 1 ? 's' : ''} needed
          </p>
        )}
      </div>

      {/* Results */}
      {searchedPhone && (
        donorDonations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <svg className="w-10 h-10 mb-3" style={{ color: 'var(--c-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donor found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>
              No donations recorded for {formatPhone(searchedPhone)}
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">

            {/* Donor info card */}
            <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-extrabold text-lg"
                  style={{ background: 'var(--c-accent)', color: 'white' }}>
                  {donorInfo?.donor_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: 'var(--c-text)' }}>{donorInfo?.donor_name}</p>
                  {donorInfo?.donor_location && (
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {donorInfo.donor_location}
                    </p>
                  )}
                  <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--c-text-3)' }}>
                    {formatPhone(searchedPhone)}
                  </p>
                </div>
              </div>
              <div className="sm:text-right pl-14 sm:pl-0">
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--c-accent)' }}>
                  All-Time Total
                </p>
                <p className="text-2xl font-extrabold" style={{ color: 'var(--c-accent)' }}>
                  {formatCurrency(allTimeTotal)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                  {donorDonations.length} donation{donorDonations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Year picker + monthly breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>
                  Monthly Breakdown
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--c-text-2)' }}>Year</label>
                  <select
                    value={effectiveYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="input w-24 py-1 text-sm appearance-none cursor-pointer"
                  >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Year total bar */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-3"
                style={{ background: 'linear-gradient(90deg, #064e3b, #047857)', color: 'white' }}>
                <span className="text-sm font-semibold opacity-90">{effectiveYear} Total</span>
                <span className="font-extrabold">{formatCurrency(yearTotal)}</span>
              </div>

              {!hasAnyMonth ? (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--c-text-3)' }}>
                  No donations in {effectiveYear}
                </p>
              ) : (
                <>
                  {/* Mobile: card list — only active months */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    {monthlyRows.filter(r => r.count > 0).map(r => (
                      <div key={r.month} className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: 'var(--c-accent-bg)', border: '1px solid var(--c-border-2)' }}>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{r.month}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                            {r.count} donation{r.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--c-accent)' }}>
                          {formatCurrency(r.total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: full 12-month table */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl"
                    style={{ border: '1px solid var(--c-border)' }}>
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr style={{ background: 'var(--c-th-bg)' }}>
                          <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Month</th>
                          <th className="px-5 py-3 text-center font-semibold" style={{ color: 'var(--c-th-text)' }}># Donations</th>
                          <th className="px-5 py-3 text-right font-semibold" style={{ color: 'var(--c-th-text)' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyRows.map(r => (
                          <tr key={r.month}
                            className="transition-colors"
                            style={{ borderTop: '1px solid var(--c-td-div)', opacity: r.count === 0 ? 0.35 : 1 }}
                            onMouseEnter={e => r.count > 0 && (e.currentTarget.style.background = 'var(--c-td-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}>
                            <td className="px-5 py-3 font-semibold" style={{ color: 'var(--c-text)' }}>{r.month}</td>
                            <td className="px-5 py-3 text-center" style={{ color: 'var(--c-text-2)' }}>
                              {r.count > 0 ? (
                                <span className="inline-flex items-center justify-center text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                  style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
                                  {r.count}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-5 py-3 text-right font-bold"
                              style={{ color: r.count > 0 ? 'var(--c-accent)' : 'var(--c-text-3)' }}>
                              {r.count > 0 ? formatCurrency(r.total) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
