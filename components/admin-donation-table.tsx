'use client';

import { Donation } from '@/types/donation';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AdminDonationTableProps {
  donations: Donation[];
  onEdit: (donation: Donation) => void;
  onDelete: (id: string) => void;
}

export default function AdminDonationTable({ donations, onEdit, onDelete }: AdminDonationTableProps) {
  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400"
        style={{ background: '#f0fdf4', borderRadius: '1rem', border: '1.5px dashed #a7f3d0' }}>
        <span className="text-4xl mb-2">💳</span>
        <p className="font-medium text-gray-500">No donations yet</p>
        <p className="text-sm mt-1">Add your first donation above</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {donations.map((d) => (
          <div key={d.id} className="bg-white rounded-xl p-4"
            style={{ border: '1.5px solid #d1fae5', boxShadow: '0 1px 6px rgba(5,150,105,0.08)' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-900 text-sm">{d.donor_name}</p>
                {d.donor_phone && <p className="text-xs text-gray-400 mt-0.5">{d.donor_phone}</p>}
                {d.donor_location && <p className="text-xs text-gray-400 mt-0.5">📍 {d.donor_location}</p>}
              </div>
              <p className="font-bold text-base shrink-0 ml-2" style={{ color: '#059669' }}>
                {formatCurrency(Number(d.amount))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {d.campaigns?.name && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                  {d.campaigns.name}
                </span>
              )}
              <span className="text-xs text-gray-400">{formatDate(d.donation_date)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(d)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Edit</button>
              <button onClick={() => onDelete(d.id)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl"
        style={{ border: '1.5px solid #d1fae5', boxShadow: '0 2px 12px rgba(5,150,105,0.07)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
              {['Donor', 'Campaign', 'Amount', 'Date', 'Phone', 'Location', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3.5 font-semibold text-emerald-800 whitespace-nowrap ${h === 'Amount' || h === 'Actions' ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-emerald-50">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{d.donor_name}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {d.campaigns?.name
                    ? <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                        {d.campaigns.name}
                      </span>
                    : '—'}
                </td>
                <td className="px-4 py-3.5 text-center font-bold whitespace-nowrap" style={{ color: '#059669' }}>
                  {formatCurrency(Number(d.amount))}
                </td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(d.donation_date)}</td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{d.donor_phone || '—'}</td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                  {d.donor_location
                    ? <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {d.donor_location}
                      </span>
                    : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(d)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(d.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
