import { Donation } from '@/types/donation';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DonationsTableProps {
  donations: Donation[];
  showCampaign?: boolean;
}

export default function DonationsTable({ donations, showCampaign = true }: DonationsTableProps) {
  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 animate-fade-in"
        style={{ background: '#fff', borderRadius: '1rem', border: '1.5px dashed #d1fae5' }}>
        <svg className="w-12 h-12 mb-3 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium text-gray-500">No donations found</p>
        <p className="text-sm mt-1">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: card view ── */}
      <div className="flex flex-col gap-3 sm:hidden animate-slide-up">
        {donations.map((d, i) => (
          <div
            key={d.id}
            className="bg-white rounded-xl p-4"
            style={{
              border: '1.5px solid #d1fae5',
              boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
              animationDelay: `${i * 0.04}s`,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{d.donor_name}</p>
                {d.donor_phone && (
                  <p className="text-xs text-gray-400 mt-0.5">{d.donor_phone}</p>
                )}
              </div>
              <span
                className="font-bold text-base shrink-0 ml-2"
                style={{ color: '#059669' }}
              >
                {formatCurrency(Number(d.amount))}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {showCampaign && d.campaigns?.name && (
                <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                  {d.campaigns.name}
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1">
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

      {/* ── Desktop: table view ── */}
      <div
        className="hidden sm:block overflow-x-auto rounded-2xl animate-slide-up"
        style={{ border: '1.5px solid #d1fae5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
              <th className="px-5 py-3.5 text-left font-semibold text-emerald-800 whitespace-nowrap">Donor Name</th>
              {showCampaign && (
                <th className="px-5 py-3.5 text-left font-semibold text-emerald-800 whitespace-nowrap">Campaign</th>
              )}
              <th className="px-5 py-3.5 text-right font-semibold text-emerald-800 whitespace-nowrap">Amount</th>
              <th className="px-5 py-3.5 text-left font-semibold text-emerald-800 whitespace-nowrap">Date</th>
              <th className="px-5 py-3.5 text-left font-semibold text-emerald-800 whitespace-nowrap">Phone</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-emerald-50">
            {donations.map((d, i) => (
              <tr
                key={d.id}
                className="transition-colors hover:bg-emerald-50/50"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">{d.donor_name}</td>
                {showCampaign && (
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {d.campaigns?.name ? (
                      <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                        {d.campaigns.name}
                      </span>
                    ) : '—'}
                  </td>
                )}
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <span className="font-bold" style={{ color: '#059669' }}>
                    {formatCurrency(Number(d.amount))}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(d.donation_date)}</td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{d.donor_phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
