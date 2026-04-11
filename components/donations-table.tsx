'use client';

import { Donation } from '@/types/donation';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DonationsTableProps {
  donations: Donation[];
  showCampaign?: boolean;
}

export default function DonationsTable({ donations, showCampaign = true }: DonationsTableProps) {
  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in"
        style={{ background: 'var(--c-card)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
        <svg className="w-12 h-12 mb-3" style={{ color: 'var(--c-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donations found</p>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card view */}
      <div className="flex flex-col gap-3 sm:hidden animate-slide-up">
        {donations.map((d, i) => (
          <div key={d.id} className="rounded-xl p-4"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 8px var(--c-shadow)', animationDelay: `${i * 0.04}s` }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{d.donor_name}</p>
                {d.donor_phone && <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>{d.donor_phone}</p>}
                {d.donor_location && (
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {d.donor_location}
                  </p>
                )}
              </div>
              <span className="font-bold text-base shrink-0 ml-2" style={{ color: 'var(--c-accent)' }}>
                {formatCurrency(Number(d.amount))}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {showCampaign && d.campaigns?.name && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
                  {d.campaigns.name}
                </span>
              )}
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--c-text-3)' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(d.donation_date)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl animate-slide-up"
        style={{ border: '1.5px solid var(--c-border)', boxShadow: '0 2px 12px var(--c-shadow)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--c-th-bg)' }}>
              <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Donor Name</th>
              {showCampaign && <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Campaign</th>}
              <th className="px-5 py-3.5 text-right font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Amount</th>
              <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Date</th>
              <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Phone</th>
              <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Location</th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--c-card)' }}>
            {donations.map((d, i) => (
              <tr key={d.id} className="transition-colors" style={{ borderTop: '1px solid var(--c-td-div)', animationDelay: `${i * 0.04}s` }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-5 py-3.5 font-medium whitespace-nowrap" style={{ color: 'var(--c-text)' }}>{d.donor_name}</td>
                {showCampaign && (
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {d.campaigns?.name
                      ? <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
                          {d.campaigns.name}
                        </span>
                      : <span style={{ color: 'var(--c-text-3)' }}>—</span>}
                  </td>
                )}
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <span className="font-bold" style={{ color: 'var(--c-accent)' }}>{formatCurrency(Number(d.amount))}</span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>{formatDate(d.donation_date)}</td>
                <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>{d.donor_phone || '—'}</td>
                <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>
                  {d.donor_location
                    ? <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" style={{ color: 'var(--c-text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {d.donor_location}
                      </span>
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
