'use client';

import { useMemo, useRef, useState } from 'react';
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
  /** When provided, renders a Download PDF button (admin only) */
  onDownload?: () => void;
  /** Hide the "Yearly Report" title (use when parent provides its own header/toggle) */
  hideTitle?: boolean;
  /** key: `${year}-${month}` (month 1-based), value: public URL */
  receipts?: Record<string, string>;
  /** Admin only — called with (year, month 1-based, File) */
  onUploadReceipt?: (year: number, month: number, file: File) => Promise<void>;
}

export default function YearlyReportTable({
  donations,
  year,
  availableYears,
  onYearChange,
  onDownload,
  hideTitle,
  receipts,
  onUploadReceipt,
}: YearlyReportTableProps) {
  const isAdmin = !!onUploadReceipt;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMonth, setPendingMonth] = useState<number | null>(null); // 0-indexed
  const [uploadingMonth, setUploadingMonth] = useState<number | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const yearDonations = useMemo(
    () => donations.filter(d => Number(d.donation_date.split('-')[0]) === year),
    [donations, year]
  );

  const rows = useMemo(() =>
    MONTHS.map((name, idx) => {
      const md = yearDonations.filter(d => Number(d.donation_date.split('-')[1]) - 1 === idx);
      const receiptKey = `${year}-${idx + 1}`;
      return {
        month: name,
        idx,
        count: md.length,
        total: md.reduce((s, d) => s + Number(d.amount), 0),
        receiptUrl: receipts?.[receiptKey] ?? null,
      };
    }),
    [yearDonations, receipts, year]
  );

  const grandTotal = yearDonations.reduce((s, d) => s + Number(d.amount), 0);
  const activeMths = rows.filter(r => r.count > 0).length;

  const handleUploadClick = (idx: number) => {
    setPendingMonth(idx);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || pendingMonth === null || !onUploadReceipt) return;
    setUploadingMonth(pendingMonth);
    try {
      await onUploadReceipt(year, pendingMonth + 1, file);
    } finally {
      setUploadingMonth(null);
      setPendingMonth(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Receipt action cell ─────────────────────────────── */
  function ReceiptCell({ idx, receiptUrl }: { idx: number; receiptUrl: string | null }) {
    const busy = uploadingMonth === idx;
    return (
      <div className="flex items-center gap-1.5 justify-end">
        {receiptUrl && (
          <button
            onClick={() => setViewingUrl(receiptUrl)}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
            style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}
            title="View receipt">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">View</span>
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => handleUploadClick(idx)}
            disabled={busy}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
            style={receiptUrl
              ? { background: 'var(--c-bg)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
              : { background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }
            }
            title={receiptUrl ? 'Replace receipt' : 'Upload receipt'}>
            {busy ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            <span className="hidden sm:inline">{busy ? 'Uploading…' : receiptUrl ? 'Replace' : 'Upload'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Hidden file input for receipt upload */}
      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Receipt lightbox */}
      {viewingUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => { setViewingUrl(null); setImgError(false); }}>
          <div className="relative w-full max-w-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => { setViewingUrl(null); setImgError(false); }}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white text-sm font-semibold opacity-80 hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>

            {imgError ? (
              /* Error state */
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl gap-3"
                style={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-white font-semibold">Could not load receipt</p>
                <p className="text-gray-400 text-sm text-center max-w-xs">
                  Make sure the <strong>receipts</strong> bucket is set to <strong>Public</strong> in Supabase Storage.
                </p>
                <a
                  href={viewingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm font-semibold px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                  Try opening directly ↗
                </a>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={viewingUrl}
                alt="Receipt"
                className="w-full rounded-2xl shadow-2xl"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 16px var(--c-shadow)' }}>

        {/* ── Header ── */}
        <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3"
          style={{ borderBottom: '1.5px solid var(--c-border)', background: 'var(--c-card-alt)' }}>
          <div className="flex items-center gap-3">
            {!hideTitle && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)', color: 'var(--c-accent)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            )}
            <div>
              {!hideTitle && <h2 className="font-bold" style={{ color: 'var(--c-text)' }}>Yearly Report</h2>}
              <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                {activeMths} active month{activeMths !== 1 ? 's' : ''} · {yearDonations.length} donation{yearDonations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold" style={{ color: 'var(--c-text-2)' }}>Year</label>
            <select
              value={year}
              onChange={e => onYearChange(Number(e.target.value))}
              className="input w-28 appearance-none cursor-pointer py-1.5 text-sm"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            {onDownload && (
              <button
                onClick={onDownload}
                disabled={yearDonations.length === 0}
                className="btn-primary py-1.5 disabled:opacity-40"
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

        {/* ── Year total bar ── */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ background: 'linear-gradient(90deg, #064e3b, #047857)', color: 'white', borderBottom: '1.5px solid var(--c-border)' }}>
          <span className="text-sm font-semibold opacity-90">{year} Annual Total</span>
          <span className="text-lg font-extrabold">{formatCurrency(grandTotal)}</span>
        </div>

        {/* ── Empty state ── */}
        {yearDonations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14" style={{ background: 'var(--c-card)' }}>
            <svg className="w-10 h-10 mb-3" style={{ color: 'var(--c-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donations recorded for {year}</p>
          </div>
        ) : (
          <>
            {/* ── Mobile: card list ── */}
            <div className="flex flex-col gap-2 sm:hidden p-4" style={{ background: 'var(--c-card)' }}>
              {rows.map(r => (
                <div key={r.month}
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: r.count > 0 ? 'var(--c-accent-bg)' : 'var(--c-card-alt)',
                    border: `1px solid ${r.count > 0 ? 'var(--c-border-2)' : 'var(--c-border)'}`,
                    opacity: r.count === 0 && !r.receiptUrl ? 0.5 : 1,
                  }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{r.month}</p>
                      {r.count > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                          {r.count} donation{r.count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-sm" style={{ color: r.count > 0 ? 'var(--c-accent)' : 'var(--c-text-3)' }}>
                      {r.count > 0 ? formatCurrency(r.total) : '—'}
                    </span>
                  </div>
                  {/* Receipt controls on mobile */}
                  {(r.receiptUrl || isAdmin) && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
                      <ReceiptCell idx={r.idx} receiptUrl={r.receiptUrl} />
                    </div>
                  )}
                </div>
              ))}
              {/* Total row */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)' }}>
                <p className="font-bold text-sm" style={{ color: 'var(--c-accent)' }}>Annual Total</p>
                <span className="font-extrabold text-sm" style={{ color: 'var(--c-accent)' }}>
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* ── Desktop: table ── */}
            <div className="hidden sm:block overflow-x-auto" style={{ background: 'var(--c-card)' }}>
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--c-th-bg)' }}>
                    <th className="px-5 py-3.5 text-left font-semibold" style={{ color: 'var(--c-th-text)' }}>Month</th>
                    <th className="px-5 py-3.5 text-center font-semibold" style={{ color: 'var(--c-th-text)' }}># Donations</th>
                    <th className="px-5 py-3.5 text-right font-semibold" style={{ color: 'var(--c-th-text)' }}>Amount Collected</th>
                    <th className="px-5 py-3.5 text-right font-semibold" style={{ color: 'var(--c-th-text)' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'var(--c-card)' }}>
                  {rows.map(r => (
                    <tr key={r.month}
                      className="transition-colors"
                      style={{ borderTop: '1px solid var(--c-td-div)', opacity: r.count === 0 && !r.receiptUrl ? 0.4 : 1 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--c-text)' }}>{r.month}</td>
                      <td className="px-5 py-3.5 text-center" style={{ color: 'var(--c-text-2)' }}>
                        {r.count > 0 ? (
                          <span className="inline-flex items-center justify-center text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
                            {r.count}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold"
                        style={{ color: r.count > 0 ? 'var(--c-accent)' : 'var(--c-text-3)' }}>
                        {r.count > 0 ? formatCurrency(r.total) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <ReceiptCell idx={r.idx} receiptUrl={r.receiptUrl} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--c-border-2)', background: 'var(--c-accent-bg)' }}>
                    <td className="px-5 py-3.5 font-extrabold" style={{ color: 'var(--c-accent)' }}>Annual Total</td>
                    <td className="px-5 py-3.5 text-center font-bold" style={{ color: 'var(--c-accent)' }}>
                      {yearDonations.length}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold" style={{ color: 'var(--c-accent)' }}>
                      {formatCurrency(grandTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
