'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  // Build page number window (up to 5 buttons)
  const delta = 2;
  const range: (number | '…')[] = [];
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  if (left > 1) { range.push(1); if (left > 2) range.push('…'); }
  for (let i = left; i <= right; i++) range.push(i);
  if (right < totalPages) { if (right < totalPages - 1) range.push('…'); range.push(totalPages); }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2"
      style={{ borderTop: '1px solid var(--c-border)' }}>
      {/* Info */}
      <p className="text-xs font-medium order-2 sm:order-1" style={{ color: 'var(--c-text-3)' }}>
        Showing <span style={{ color: 'var(--c-text-2)' }}>{from}–{to}</span> of <span style={{ color: 'var(--c-text-2)' }}>{totalItems}</span>
      </p>

      {/* Buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'var(--c-card-alt)', border: '1.5px solid var(--c-border)', color: 'var(--c-text-2)' }}
          onMouseEnter={e => { if (page > 1) (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {range.map((r, i) =>
          r === '…' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: 'var(--c-text-3)' }}>…</span>
          ) : (
            <button
              key={r}
              onClick={() => onPage(r as number)}
              className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
              style={r === page
                ? { background: 'var(--c-accent)', color: '#fff', border: '1.5px solid var(--c-accent)', boxShadow: '0 2px 8px rgba(0,196,122,0.35)' }
                : { background: 'var(--c-card-alt)', border: '1.5px solid var(--c-border)', color: 'var(--c-text-2)' }
              }
              onMouseEnter={e => { if (r !== page) (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)'; }}
              onMouseLeave={e => { if (r !== page) (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; }}
            >
              {r}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'var(--c-card-alt)', border: '1.5px solid var(--c-border)', color: 'var(--c-text-2)' }}
          onMouseEnter={e => { if (page < totalPages) (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
