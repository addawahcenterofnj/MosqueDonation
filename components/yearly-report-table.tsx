'use client';

import { useMemo } from 'react';
import { Donation } from '@/types/donation';
import { formatCurrency } from '@/lib/utils';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface YearlyReportTableProps {
  donations: Donation[];
  year: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  /** When provided, shows a download button in the header */
  onDownload?: () => void;
}

export default function YearlyReportTable({
  donations,
  year,
  availableYears,
  onYearChange,
  onDownload,
}: YearlyReportTableProps) {
  const yearDonations = useMemo(
    () => donations.filter(d => Number(d.donation_date.split('-')[0]) === year),
    [donations, year]
  );

  const rows = useMemo(() =>
    MONTHS.map((name, idx) => {
      const md = yearDonations.filter(d => Number(d.donation_date.split('-')[1]) - 1 === idx);
      return {
        month: name,
        count: md.length,
        total: md.reduce((s, d) => s + Number(d.amount), 0),
      };
    }),
    [yearDonations]
  );

  const grandTotal = yearDonations.reduce((s, d) => s + Number(d.amount), 0);
  const activeMths = rows.filter(r => r.count > 0).length;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 16px var(--c-shadow)' }}>

      {/* Header */}
      <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: '1.5px solid var(--c-border)', background: 'var(--c-card-alt)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.3)' }}>
            📊
          </div>
          <div>
            <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>Yearly Report</h2>
            <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
              {activeMths} active month{activeMths !== 1 ? 's' : ''} · {yearDonations.length} donation{yearDonations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Year dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold" style={{ color: 'var(--c-text-2)' }}>Year</label>
            <select
              value={year}
              onChange={e => onYearChange(Number(e.target.value))}
              className="input w-28 appearance-none cursor-pointer py-1.5 text-sm"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Download button — admin only */}
          {onDownload && (
            <button
              onClick={onDownload}
              disabled={yearDonations.length === 0}
              className="btn-primary text-sm py-1.5 disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Grand total bar */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: 'linear-gradient(90deg,#4338ca,#6366f1)', color: 'white', borderBottom: '1.5px solid var(--c-border)' }}>
        <span className="text-sm font-semibold opacity-90">{year} Total</span>
        <span className="text-lg font-extrabold">{formatCurrency(grandTotal)}</span>
      </div>

      {yearDonations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14"
          style={{ background: 'var(--c-card-alt)' }}>
          <svg className="w-10 h-10 mb-3" style={{ color: 'var(--c-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donations recorded for {year}</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-2 sm:hidden p-4" style={{ background: 'var(--c-card)' }}>
            {rows.map(r => (
              <div key={r.month}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  background: r.count > 0 ? 'var(--c-bg)' : 'var(--c-card-alt)',
                  border: '1px solid var(--c-border)',
                  opacity: r.count === 0 ? 0.5 : 1,
                }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{r.month}</p>
                  {r.count > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                      {r.count} donation{r.count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <span className="font-bold text-sm" style={{ color: r.count > 0 ? '#6366f1' : 'var(--c-text-3)' }}>
                  {r.count > 0 ? formatCurrency(r.total) : '—'}
                </span>
              </div>
            ))}
            {/* Total row */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)' }}>
              <p className="font-bold text-sm" style={{ color: '#6366f1' }}>Annual Total</p>
              <span className="font-extrabold text-sm" style={{ color: '#6366f1' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto" style={{ background: 'var(--c-card)' }}>
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--c-th-bg)' }}>
                  <th className="px-5 py-3.5 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Month</th>
                  <th className="px-5 py-3.5 text-center font-semibold" style={{ color: 'var(--c-th-text)' }}># Donations</th>
                  <th className="px-5 py-3.5 text-right font-semibold" style={{ color: 'var(--c-th-text)' }}>Amount Collected</th>
                </tr>
              </thead>
              <tbody style={{ background: 'var(--c-card)' }}>
                {rows.map(r => (
                  <tr key={r.month}
                    className="transition-colors"
                    style={{ borderTop: '1px solid var(--c-td-div)', opacity: r.count === 0 ? 0.45 : 1 }}
                    onMouseEnter={e => r.count > 0 && (e.currentTarget.style.background = 'var(--c-td-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--c-text)' }}>{r.month}</td>
                    <td className="px-5 py-3.5 text-center" style={{ color: 'var(--c-text-2)' }}>
                      {r.count > 0 ? r.count : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold" style={{ color: r.count > 0 ? '#6366f1' : 'var(--c-text-3)' }}>
                      {r.count > 0 ? formatCurrency(r.total) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.06)' }}>
                  <td className="px-5 py-3.5 font-extrabold" style={{ color: '#6366f1' }}>Annual Total</td>
                  <td className="px-5 py-3.5 text-center font-bold" style={{ color: '#6366f1' }}>{yearDonations.length}</td>
                  <td className="px-5 py-3.5 text-right font-extrabold" style={{ color: '#6366f1' }}>{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
