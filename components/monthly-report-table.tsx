'use client';

import { MonthlyReport } from '@/types/monthly-report';
import { formatCurrency } from '@/lib/utils';

interface MonthlyReportTableProps {
  reports: MonthlyReport[];
  onEdit: (r: MonthlyReport) => void;
  onDelete: (id: string) => void;
}

export default function MonthlyReportTable({ reports, onEdit, onDelete }: MonthlyReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12"
        style={{ background: '#f0f9ff', borderRadius: '1rem', border: '1.5px dashed #bae6fd' }}>
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
            style={{ border: '1.5px solid #bae6fd', boxShadow: '0 1px 6px rgba(14,165,233,0.08)' }}>
            <div className="flex items-start justify-between mb-1">
              <p className="font-bold text-gray-900">{r.month}</p>
              <p className="font-bold text-base" style={{ color: '#0ea5e9' }}>{formatCurrency(Number(r.amount))}</p>
            </div>
            {r.notes && <p className="text-xs text-gray-400 mb-3">{r.notes}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => onEdit(r)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg"
                style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>Edit</button>
              <button onClick={() => onDelete(r.id)} className="flex-1 text-sm font-semibold py-1.5 rounded-lg"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl"
        style={{ border: '1.5px solid #bae6fd', boxShadow: '0 2px 12px rgba(14,165,233,0.08)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
              {['Month', 'Amount', 'Notes', 'Actions'].map(h => (
                <th key={h}
                  className={`px-4 py-3.5 font-semibold whitespace-nowrap ${h === 'Amount' || h === 'Actions' ? 'text-center' : 'text-left'}`}
                  style={{ color: '#0369a1' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-sky-50">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-sky-50/50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{r.month}</td>
                <td className="px-4 py-3.5 text-center font-bold whitespace-nowrap" style={{ color: '#0ea5e9' }}>
                  {formatCurrency(Number(r.amount))}
                </td>
                <td className="px-4 py-3.5 text-gray-500">{r.notes || '—'}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(r)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>Edit</button>
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
