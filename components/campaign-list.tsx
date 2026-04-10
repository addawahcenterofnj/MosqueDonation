import Link from 'next/link';
import { Campaign } from '@/types/campaign';
import { formatCurrency } from '@/lib/utils';

interface CampaignListProps {
  campaigns: Campaign[];
}

export default function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 animate-fade-in"
        style={{ background: '#fff', borderRadius: '1rem', border: '1.5px dashed #d1fae5' }}>
        <svg className="w-12 h-12 mb-3 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        <p className="font-medium text-gray-500">No campaigns yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((campaign, i) => (
        <Link
          key={campaign.id}
          href={`/campaign/${campaign.id}`}
          className={`group block rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 animate-slide-up stagger-${Math.min(i + 1, 5)}`}
          style={{
            background: '#fff',
            border: '1.5px solid #d1fae5',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(5,150,105,0.15)';
            (e.currentTarget as HTMLElement).style.borderColor = '#6ee7b7';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
            (e.currentTarget as HTMLElement).style.borderColor = '#d1fae5';
          }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
              {campaign.name}
            </h3>
            <span
              className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={campaign.is_active
                ? { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
                : { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }
              }
            >
              {campaign.is_active ? '● Active' : '○ Ended'}
            </span>
          </div>

          {campaign.description && (
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
              {campaign.description}
            </p>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-3 mt-auto"
            style={{ borderTop: '1px solid #ecfdf5' }}
          >
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Raised</p>
              <p className="text-xl font-bold" style={{ color: '#059669' }}>
                {formatCurrency(campaign.total_amount ?? 0)}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:gap-2 transition-all">
              View details
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
