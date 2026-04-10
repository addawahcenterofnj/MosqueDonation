'use client';

import { Campaign } from '@/types/campaign';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AdminCampaignTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export default function AdminCampaignTable({
  campaigns,
  onEdit,
  onDelete,
}: AdminCampaignTableProps) {
  if (campaigns.length === 0) {
    return <p className="text-center py-8 text-gray-400">No campaigns yet. Create one above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">Total</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Start</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">End</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {campaigns.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                {formatCurrency(c.total_amount ?? 0)}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    c.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {c.is_active ? 'Active' : 'Ended'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {c.start_date ? formatDate(c.start_date) : '—'}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {c.end_date ? formatDate(c.end_date) : '—'}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(c)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
