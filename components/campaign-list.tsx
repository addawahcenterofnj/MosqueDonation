import Link from 'next/link';
import { Campaign } from '@/types/campaign';
import { formatCurrency } from '@/lib/utils';

interface CampaignListProps {
  campaigns: Campaign[];
}

export default function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in"
        style={{ background: 'var(--c-card)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
        <svg className="w-12 h-12 mb-3" style={{ color: 'var(--c-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No campaigns yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((campaign, i) => (
        <Link key={campaign.id} href={`/campaign/${campaign.id}`}
          className={`group block rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 animate-slide-up stagger-${Math.min(i + 1, 5)}`}
          style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 12px var(--c-shadow)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px var(--c-shadow-lg)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border-2)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px var(--c-shadow)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)';
          }}>
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-base leading-snug transition-colors"
              style={{ color: 'var(--c-text)' }}>
              {campaign.name}
            </h3>
            <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={campaign.is_active
                ? { background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }
                : { background: 'var(--c-card-alt)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
              {campaign.is_active ? '● Active' : '○ Ended'}
            </span>
          </div>

          {campaign.description && (
            <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
              {campaign.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 mt-auto" style={{ borderTop: '1px solid var(--c-border)' }}>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--c-text-3)' }}>Raised</p>
              <p className="text-xl font-bold" style={{ color: 'var(--c-accent)' }}>
                {formatCurrency(campaign.total_amount ?? 0)}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: 'var(--c-accent)' }}>
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
