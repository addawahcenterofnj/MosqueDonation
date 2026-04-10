'use client';

import { Donation } from '@/types/donation';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AdminDonationTableProps {
  donations: Donation[];
  onEdit: (donation: Donation) => void;
  onDelete: (id: string) => void;
}

export default function AdminDonationTable({
  donations,
  onEdit,
  onDelete,
}: AdminDonationTableProps) {
  if (donations.length === 0) {
    return <p className="text-center py-8 text-gray-400">No donations yet. Add one above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Donor</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Campaign</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">Amount</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Phone</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {donations.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{d.donor_name}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {d.campaigns?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                {formatCurrency(Number(d.amount))}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {formatDate(d.donation_date)}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {d.donor_phone || '—'}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(d)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(d.id)}
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
