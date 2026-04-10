'use client';

import { useState, useEffect } from 'react';
import { MonthlyReport, MonthlyReportFormData } from '@/types/monthly-report';

interface MonthlyReportFormProps {
  initial?: MonthlyReport | null;
  onSubmit: (data: MonthlyReportFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EMPTY: MonthlyReportFormData = { month: '', amount: '', notes: '' };

export default function MonthlyReportForm({ initial, onSubmit, onCancel, loading }: MonthlyReportFormProps) {
  const [form, setForm] = useState<MonthlyReportFormData>(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial
      ? { month: initial.month, amount: String(initial.amount), notes: initial.notes ?? '' }
      : EMPTY
    );
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.month.trim()) return setError('Please enter a month name.');
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt < 0) return setError('Amount must be 0 or greater.');
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-slide-down">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Month Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.month}
            onChange={e => setForm({ ...form, month: e.target.value })}
            className="input"
            placeholder="e.g. April 2025"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Total Amount ($) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">$</span>
            <input type="number" min="0" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="input pl-7" placeholder="0.00" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
        <input type="text" value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          className="input" placeholder="Optional notes for this month…" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </span>
          ) : initial ? 'Update Entry' : 'Add Monthly Entry'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 py-2.5">Cancel</button>
      </div>
    </form>
  );
}
