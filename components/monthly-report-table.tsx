'use client';

import { MonthlyReport } from '@/types/monthly-report';
import { formatCurrency } from '@/lib/utils';

interface MonthlyReportTableProps {
  reports: MonthlyReport[];
  onEdit: (r: MonthlyReport) => void;
  onDelete: (id: string) => void;
}

function formatMonth(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function MonthlyReportTable({ reports, onEdit, onDelete }: MonthlyReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12"
        style={{ background: '#f9fafb', borderRadius: '1rem', border: '1.5px dashed #e5e7eb' }}>
        <span className="text-4xl mb-2">📅</span>
        <p className="font-medium text-gray-500">No monthly entries yet</p>
        <p className="text-sm mt-1 text-gray-400">Add your first monthly report above</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {reports.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-4"
            style={{ border: '1.5px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between mb-1">
              <p className="font-bold text-gray-900">{formatMonth(r.month)}</p>
              <p className="font-bold text-base" style={{ color: '#d97706' }}>{formatCurrency(Number(r.amount))}</p>
            </div>
            {r.notes && <p className="text-xs text-gray-400 mb-3">{r.notes}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => onEdit(r)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg"
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Edit</button>
              <button onClick={() => onDelete(r.id)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl"
        style={{ border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
              {['Month', 'Amount', 'Notes', 'Actions'].map(h => (
                <th key={h}
                  className={`px-4 py-3.5 font-semibold whitespace-nowrap text-amber-800 ${h === 'Amount' || h === 'Actions' ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-50">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{formatMonth(r.month)}</td>
                <td className="px-4 py-3.5 text-center font-bold whitespace-nowrap" style={{ color: '#d97706' }}>
                  {formatCurrency(Number(r.amount))}
                </td>
                <td className="px-4 py-3.5 text-gray-500">{r.notes || '—'}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(r)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Edit</button>
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
    </>
  );
}
