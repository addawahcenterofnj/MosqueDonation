import Link from 'next/link';
import { Campaign } from '@/types/campaign';
import { formatCurrency } from '@/lib/utils';

interface CampaignListProps {
  campaigns: Campaign[];
}

export default function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No campaigns yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <Link
          key={campaign.id}
          href={`/campaign/${campaign.id}`}
          className="block rounded-xl border border-gray-200 p-5 hover:border-emerald-400 hover:shadow-md transition-all bg-white group"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
              {campaign.name}
            </h3>
            <span
              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                campaign.is_active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {campaign.is_active ? 'Active' : 'Ended'}
            </span>
          </div>

          {campaign.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{campaign.description}</p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(campaign.total_amount ?? 0)}
            </span>
            <span className="text-xs text-emerald-600 font-medium group-hover:underline">
              View details →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
