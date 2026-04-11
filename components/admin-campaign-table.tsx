'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types/campaign';
import { formatCurrency, formatDate } from '@/lib/utils';
import Pagination from '@/components/pagination';

const PAGE_SIZE = 10;

interface AdminCampaignTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export default function AdminCampaignTable({ campaigns, onEdit, onDelete }: AdminCampaignTableProps) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [campaigns]);

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12"
        style={{ background: 'var(--c-card-alt)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
        <span className="text-4xl mb-2">🎯</span>
        <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No campaigns yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>Create your first campaign above</p>
      </div>
    );
  }

  const totalPages = Math.ceil(campaigns.length / PAGE_SIZE);
  const paged = campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {paged.map((c) => (
          <div key={c.id} className="rounded-xl p-4"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 6px var(--c-shadow)' }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>{c.name}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={c.is_active
                  ? { background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }
                  : { background: 'var(--c-card-alt)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
                {c.is_active ? 'Active' : 'Ended'}
              </span>
            </div>
            <p className="text-lg font-bold mb-3" style={{ color: 'var(--c-accent)' }}>
              {formatCurrency(c.total_amount ?? 0)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => onEdit(c)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
                Edit
              </button>
              <button onClick={() => onDelete(c.id)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl"
        style={{ border: '1.5px solid var(--c-border)', boxShadow: '0 2px 12px var(--c-shadow)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--c-th-bg)' }}>
              {['Name', 'Total', 'Status', 'Start', 'End', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3.5 font-semibold whitespace-nowrap ${h === 'Total' || h === 'Actions' ? 'text-center' : 'text-left'}`}
                  style={{ color: 'var(--c-th-text)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--c-card)' }}>
            {paged.map((c) => (
              <tr key={c.id} className="transition-colors" style={{ borderTop: '1px solid var(--c-td-div)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-4 py-3.5 font-semibold" style={{ color: 'var(--c-text)' }}>{c.name}</td>
                <td className="px-4 py-3.5 text-center font-bold" style={{ color: 'var(--c-accent)' }}>
                  {formatCurrency(c.total_amount ?? 0)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={c.is_active
                      ? { background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }
                      : { background: 'var(--c-card-alt)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
                    {c.is_active ? 'Active' : 'Ended'}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>
                  {c.start_date ? formatDate(c.start_date) : '—'}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>
                  {c.end_date ? formatDate(c.end_date) : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(c)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
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

      <Pagination page={page} totalPages={totalPages} totalItems={campaigns.length} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}
