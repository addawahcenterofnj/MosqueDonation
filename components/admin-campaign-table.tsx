'use client';

import { Campaign } from '@/types/campaign';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AdminCampaignTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export default function AdminCampaignTable({ campaigns, onEdit, onDelete }: AdminCampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400"
        style={{ background: '#f9fafb', borderRadius: '1rem', border: '1.5px dashed #e5e7eb' }}>
        <span className="text-4xl mb-2">🎯</span>
        <p className="font-medium text-gray-500">No campaigns yet</p>
        <p className="text-sm mt-1">Create your first campaign above</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white rounded-xl p-4"
            style={{ border: '1.5px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-bold text-gray-900 text-sm">{c.name}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={c.is_active
                  ? { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
                  : { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                {c.is_active ? 'Active' : 'Ended'}
              </span>
            </div>
            <p className="text-lg font-bold mb-3" style={{ color: '#059669' }}>
              {formatCurrency(c.total_amount ?? 0)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => onEdit(c)}
                className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                Edit
              </button>
              <button onClick={() => onDelete(c.id)}
                className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl"
        style={{ border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)' }}>
              {['Name', 'Total', 'Status', 'Start', 'End', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3.5 font-semibold text-gray-600 whitespace-nowrap ${h === 'Total' || h === 'Actions' ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900">{c.name}</td>
                <td className="px-4 py-3.5 text-center font-bold" style={{ color: '#059669' }}>
                  {formatCurrency(c.total_amount ?? 0)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={c.is_active
                      ? { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
                      : { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                    {c.is_active ? 'Active' : 'Ended'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                  {c.start_date ? formatDate(c.start_date) : '—'}
                </td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                  {c.end_date ? formatDate(c.end_date) : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(c)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(c.id)}
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
