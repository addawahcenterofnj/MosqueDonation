'use client';

import { useState, useEffect } from 'react';
import { MonthlyReport } from '@/types/monthly-report';
import { formatCurrency } from '@/lib/utils';
import Pagination from '@/components/pagination';

const PAGE_SIZE = 10;

interface MonthlyReportTableProps {
  reports: MonthlyReport[];
  onEdit: (r: MonthlyReport) => void;
  onDelete: (id: string) => void;
}

export default function MonthlyReportTable({ reports, onEdit, onDelete }: MonthlyReportTableProps) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [reports]);

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12"
        style={{ background: 'var(--c-card-alt)', borderRadius: '1rem', border: '1.5px dashed var(--c-border-2)' }}>
        <span className="text-4xl mb-2">📅</span>
        <p className="font-medium" style={{ color: 'var(--c-text-2)' }}>No monthly entries yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>Add your first monthly report above</p>
      </div>
    );
  }

  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const paged = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {paged.map(r => (
          <div key={r.id} className="rounded-xl p-4"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 6px var(--c-shadow)' }}>
            <div className="flex items-start justify-between mb-1">
              <p className="font-bold" style={{ color: 'var(--c-text)' }}>{r.month}</p>
              <p className="font-bold text-base" style={{ color: 'var(--c-accent)' }}>{formatCurrency(Number(r.amount))}</p>
            </div>
            {r.notes && <p className="text-xs mb-3" style={{ color: 'var(--c-text-3)' }}>{r.notes}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => onEdit(r)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg"
                style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>Edit</button>
              <button onClick={() => onDelete(r.id)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg"
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
              {['Month', 'Amount', 'Notes', 'Actions'].map(h => (
                <th key={h}
                  className={`px-4 py-3.5 font-semibold whitespace-nowrap ${h === 'Amount' || h === 'Actions' ? 'text-center' : 'text-left'}`}
                  style={{ color: 'var(--c-th-text)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--c-card)' }}>
            {paged.map(r => (
              <tr key={r.id} className="transition-colors" style={{ borderTop: '1px solid var(--c-td-div)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-4 py-3.5 font-semibold whitespace-nowrap" style={{ color: 'var(--c-text)' }}>{r.month}</td>
                <td className="px-4 py-3.5 text-center font-bold whitespace-nowrap" style={{ color: 'var(--c-accent)' }}>
                  {formatCurrency(Number(r.amount))}
                </td>
                <td className="px-4 py-3.5" style={{ color: 'var(--c-text-2)' }}>{r.notes || '—'}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(r)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>Edit</button>
                    <button onClick={() => onDelete(r.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} totalItems={reports.length} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}
