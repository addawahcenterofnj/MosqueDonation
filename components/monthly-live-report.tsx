import { MonthlyReport } from '@/types/monthly-report';
import { formatCurrency } from '@/lib/utils';

interface MonthlyLiveReportProps {
  reports: MonthlyReport[];
}

function formatMonth(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function MonthlyLiveReport({ reports }: MonthlyLiveReportProps) {
  if (reports.length === 0) return null;

  const maxAmount = Math.max(...reports.map(r => Number(r.amount)));

  return (
    <section className="animate-slide-up stagger-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📅</span>
        <h2 className="text-lg font-bold text-gray-800">Monthly Live Report</h2>
        {/* LIVE badge */}
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
          </span>
          <span className="text-[9px] font-extrabold tracking-widest text-red-500 uppercase leading-none">Live</span>
        </span>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {reports.map((r, i) => (
          <div key={r.id} className="bg-white rounded-xl p-4 animate-slide-up"
            style={{
              border: '1.5px solid #fde68a',
              boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
              animationDelay: `${i * 0.05}s`,
            }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-900 text-sm">{formatMonth(r.month)}</p>
              <p className="font-extrabold text-base" style={{ color: '#d97706' }}>
                {formatCurrency(Number(r.amount))}
              </p>
            </div>
            {/* Mini bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#fef3c7' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${maxAmount > 0 ? (Number(r.amount) / maxAmount) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                }} />
            </div>
            {r.notes && <p className="text-xs text-gray-400 mt-2">{r.notes}</p>}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl"
        style={{ border: '1.5px solid #fde68a', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
              <th className="px-5 py-3.5 text-left font-semibold text-amber-800 whitespace-nowrap">Month</th>
              <th className="px-5 py-3.5 text-right font-semibold text-amber-800 whitespace-nowrap">Amount</th>
              <th className="px-5 py-3.5 text-left font-semibold text-amber-800">Progress</th>
              <th className="px-5 py-3.5 text-left font-semibold text-amber-800">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-50">
            {reports.map((r, i) => (
              <tr key={r.id} className="hover:bg-amber-50/40 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                  {formatMonth(r.month)}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <span className="font-extrabold" style={{ color: '#d97706' }}>
                    {formatCurrency(Number(r.amount))}
                  </span>
                </td>
                <td className="px-5 py-3.5 w-48">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#fef3c7' }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${maxAmount > 0 ? (Number(r.amount) / maxAmount) * 100 : 0}%`,
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                          transition: 'width 0.8s ease',
                        }} />
                    </div>
                    <span className="text-xs text-gray-400 font-medium shrink-0">
                      {maxAmount > 0 ? Math.round((Number(r.amount) / maxAmount) * 100) : 0}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{r.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
