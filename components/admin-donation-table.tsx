'use client';

import { useState, useEffect } from 'react';
import { Donation } from '@/types/donation';
import { formatCurrency } from '@/lib/utils';
import Pagination from '@/components/pagination';

const PAGE_SIZE = 10;

interface AdminDonationTableProps {
  donations: Donation[];
  onEdit: (donation: Donation) => void;
  onDelete: (id: string) => void;
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function AdminDonationTable({ donations, onEdit, onDelete }: AdminDonationTableProps) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [donations]);

  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12"
        style={{ background: 'var(--c-card-alt)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
        <span className="text-4xl mb-2">💳</span>
        <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No donations for this month</p>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>Add the first donation above</p>
      </div>
    );
  }

  const totalPages = Math.ceil(donations.length / PAGE_SIZE);
  const paged = donations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {paged.map((d) => (
          <div key={d.id} className="rounded-xl p-4"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 6px var(--c-shadow)' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>{d.donor_name}</p>
                {d.donor_phone && <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>{d.donor_phone}</p>}
                {d.donor_location && <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>📍 {d.donor_location}</p>}
              </div>
              <p className="font-bold text-base shrink-0 ml-2" style={{ color: 'var(--c-accent)' }}>
                {formatCurrency(Number(d.amount))}
              </p>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--c-text-3)' }}>{monthLabel(d.donation_date)}</p>
            <div className="flex gap-2">
              <button onClick={() => onEdit(d)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>Edit</button>
              <button onClick={() => onDelete(d.id)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Delete</button>
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
              {['Donor', 'Phone', 'Location', 'Amount', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3.5 font-semibold whitespace-nowrap ${h === 'Amount' || h === 'Actions' ? 'text-center' : 'text-left'}`}
                  style={{ color: 'var(--c-th-text)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--c-card)' }}>
            {paged.map((d) => (
              <tr key={d.id} className="transition-colors" style={{ borderTop: '1px solid var(--c-td-div)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-4 py-3.5 font-semibold whitespace-nowrap" style={{ color: 'var(--c-text)' }}>{d.donor_name}</td>
                <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>{d.donor_phone || '—'}</td>
                <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>
                  {d.donor_location
                    ? <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" style={{ color: 'var(--c-text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {d.donor_location}
                      </span>
                    : '—'}
                </td>
                <td className="px-4 py-3.5 text-center font-bold whitespace-nowrap" style={{ color: 'var(--c-accent)' }}>
                  {formatCurrency(Number(d.amount))}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(d)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
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

      <Pagination page={page} totalPages={totalPages} totalItems={donations.length} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}
