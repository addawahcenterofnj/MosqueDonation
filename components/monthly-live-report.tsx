import { MonthlyReport } from '@/types/monthly-report';
import { formatCurrency } from '@/lib/utils';

interface MonthlyLiveReportProps {
  reports: MonthlyReport[];
}

export default function MonthlyLiveReport({ reports }: MonthlyLiveReportProps) {
  if (reports.length === 0) return null;

  return (
    <section className="animate-slide-up stagger-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📅</span>
        <h2 className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>Monthly Live Report</h2>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
          </span>
          <span className="text-[9px] font-extrabold tracking-widest text-red-500 uppercase leading-none">Live</span>
        </span>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {reports.map((r, i) => (
          <div key={r.id} className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 animate-slide-up"
            style={{ background: 'var(--c-card)', border: '1.5px solid var(--c-border)', boxShadow: '0 1px 8px var(--c-shadow)', animationDelay: `${i * 0.05}s` }}>
            <p className="font-semibold text-sm min-w-0 truncate" style={{ color: 'var(--c-text)' }}>{r.month}</p>
            <p className="font-extrabold text-base shrink-0" style={{ color: 'var(--c-accent)' }}>
              {formatCurrency(Number(r.amount))}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl"
        style={{ border: '1.5px solid var(--c-border)', boxShadow: '0 2px 12px var(--c-shadow)' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--c-th-bg)' }}>
              <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Month</th>
              <th className="px-5 py-3.5 text-right font-semibold whitespace-nowrap" style={{ color: 'var(--c-th-text)' }}>Amount</th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--c-card)' }}>
            {reports.map((r, i) => (
              <tr key={r.id} className="transition-colors animate-fade-in" style={{ borderTop: '1px solid var(--c-td-div)', animationDelay: `${i * 0.04}s` }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-td-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ color: 'var(--c-text)' }}>{r.month}</td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <span className="font-extrabold" style={{ color: 'var(--c-accent)' }}>{formatCurrency(Number(r.amount))}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
