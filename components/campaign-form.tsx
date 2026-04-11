'use client';

import { useState, useEffect } from 'react';
import { Campaign, CampaignFormData } from '@/types/campaign';

interface CampaignFormProps {
  initial?: Campaign | null;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EMPTY: CampaignFormData = { name: '', description: '', start_date: '', end_date: '', is_active: true };

export default function CampaignForm({ initial, onSubmit, onCancel, loading }: CampaignFormProps) {
  const [form, setForm] = useState<CampaignFormData>(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial
      ? { name: initial.name, description: initial.description ?? '', start_date: initial.start_date ?? '', end_date: initial.end_date ?? '', is_active: initial.is_active }
      : EMPTY
    );
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Campaign name is required.'); return; }
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-slide-down">
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>
          Campaign Name <span className="text-red-400">*</span>
        </label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          className="input" placeholder="e.g. Masjid Renovation 2025" />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3} className="input resize-none" placeholder="Short description (optional)…" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Start Date</label>
          <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>End Date</label>
          <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input" />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group w-fit">
        <div className="relative">
          <input id="is_active" type="checkbox" checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })} className="sr-only" />
          <div className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>Active campaign</span>
      </label>

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
          ) : initial ? 'Update Campaign' : 'Create Campaign'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 py-2.5">Cancel</button>
      </div>
    </form>
  );
}
