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
  onShareReceipt: (donation: Donation) => void;
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function AdminDonationTable({ donations, onEdit, onDelete, onShareReceipt }: AdminDonationTableProps) {
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
              <button onClick={() => onShareReceipt(d)}
                className="flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Receipt
              </button>
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
                    <button onClick={() => onShareReceipt(d)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                      <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Receipt
                    </button>
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
