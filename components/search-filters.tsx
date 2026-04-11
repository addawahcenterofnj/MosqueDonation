'use client';

interface SearchFiltersProps {
  searchName: string;
  searchPhone: string;
  selectedYear: string;
  years: number[];
  onSearchName: (val: string) => void;
  onSearchPhone: (val: string) => void;
  onYearChange: (val: string) => void;
}

export default function SearchFilters({
  searchName, searchPhone, selectedYear, years,
  onSearchName, onSearchPhone, onYearChange,
}: SearchFiltersProps) {
  const hasFilters = searchName || searchPhone || selectedYear;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 space-y-3 animate-slide-up stagger-2"
      style={{ border: '1.5px solid #d1fae5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Name search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <input
            type="text"
            placeholder="Search by donor name…"
            value={searchName}
            onChange={(e) => onSearchName(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Phone search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <input
            type="text"
            placeholder="Search by phone number…"
            value={searchPhone}
            onChange={(e) => onSearchPhone(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Year filter */}
        <div className="relative sm:w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="input pl-9 appearance-none cursor-pointer"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap animate-fade-in">
          <span className="text-xs text-gray-400">Active filters:</span>
          {searchName && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              Name: {searchName}
              <button onClick={() => onSearchName('')} className="hover:text-emerald-900 ml-0.5">×</button>
            </span>
          )}
          {searchPhone && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              Phone: {searchPhone}
              <button onClick={() => onSearchPhone('')} className="hover:text-emerald-900 ml-0.5">×</button>
            </span>
          )}
          {selectedYear && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              Year: {selectedYear}
              <button onClick={() => onYearChange('')} className="hover:text-emerald-900 ml-0.5">×</button>
            </span>
          )}
          <button
            onClick={() => { onSearchName(''); onSearchPhone(''); onYearChange(''); }}
            className="text-xs text-red-400 hover:text-red-600 font-medium ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
