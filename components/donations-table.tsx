import { Donation } from '@/types/donation';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DonationsTableProps {
  donations: Donation[];
  showCampaign?: boolean;
}

export default function DonationsTable({ donations, showCampaign = true }: DonationsTableProps) {
  if (donations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No donations found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Donor Name</th>
            {showCampaign && (
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Campaign</th>
            )}
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">Amount</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Phone</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {donations.map((donation) => (
            <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                {donation.donor_name}
              </td>
              {showCampaign && (
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {donation.campaigns?.name ?? '—'}
                </td>
              )}
              <td className="px-4 py-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                {formatCurrency(Number(donation.amount))}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {formatDate(donation.donation_date)}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {donation.donor_phone || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
