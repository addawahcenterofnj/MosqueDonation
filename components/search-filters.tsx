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
  searchName,
  searchPhone,
  selectedYear,
  years,
  onSearchName,
  onSearchPhone,
  onYearChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        placeholder="Search by donor name..."
        value={searchName}
        onChange={(e) => onSearchName(e.target.value)}
        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />
      <input
        type="text"
        placeholder="Search by phone number..."
        value={searchPhone}
        onChange={(e) => onSearchPhone(e.target.value)}
        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
      >
        <option value="">All Years</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
