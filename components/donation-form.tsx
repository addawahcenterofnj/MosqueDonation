'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types/campaign';
import { Donation, DonationFormData } from '@/types/donation';

interface DonationFormProps {
  initial?: Donation | null;
  campaigns: Campaign[];
  onSubmit: (data: DonationFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EMPTY: DonationFormData = {
  donor_name: '', donor_phone: '', donor_location: '',
  campaign_id: '', amount: '', donation_date: '', notes: '',
};

export default function DonationForm({ initial, campaigns, onSubmit, onCancel, loading }: DonationFormProps) {
  const [form, setForm] = useState<DonationFormData>(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial ? {
      donor_name: initial.donor_name,
      donor_phone: initial.donor_phone ?? '',
      donor_location: initial.donor_location ?? '',
      campaign_id: initial.campaign_id,
      amount: String(initial.amount),
      donation_date: initial.donation_date,
      notes: initial.notes ?? '',
    } : EMPTY);
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.donor_name.trim()) return setError('Donor name is required.');
    if (!form.campaign_id) return setError('Please select a campaign.');
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) return setError('Amount must be greater than 0.');
    if (!form.donation_date) return setError('Donation date is required.');
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

      {/* Row 1: Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Donor Name <span className="text-red-400">*</span>
          </label>
          <input type="text" value={form.donor_name}
            onChange={e => setForm({ ...form, donor_name: e.target.value })}
            className="input" placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
          <input type="text" value={form.donor_phone}
            onChange={e => setForm({ ...form, donor_phone: e.target.value })}
            className="input" placeholder="Optional" />
        </div>
      </div>

      {/* Row 2: Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Donor Location
        </label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input type="text" value={form.donor_location}
            onChange={e => setForm({ ...form, donor_location: e.target.value })}
            className="input pl-10" placeholder="e.g. New York, NJ, Edison…" />
        </div>
      </div>

      {/* Row 3: Campaign + Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Campaign <span className="text-red-400">*</span>
          </label>
          <select value={form.campaign_id}
            onChange={e => setForm({ ...form, campaign_id: e.target.value })}
            className="input appearance-none cursor-pointer bg-white">
            <option value="">Select a campaign…</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Amount ($) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">$</span>
            <input type="number" min="0.01" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="input pl-7" placeholder="0.00" />
          </div>
        </div>
      </div>

      {/* Row 4: Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Donation Date <span className="text-red-400">*</span>
        </label>
        <input type="date" value={form.donation_date}
          onChange={e => setForm({ ...form, donation_date: e.target.value })} className="input" />
      </div>

      {/* Row 5: Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={2} className="input resize-none" placeholder="Optional notes…" />
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
          ) : initial ? 'Update Donation' : 'Add Donation'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 py-2.5">Cancel</button>
      </div>
    </form>
  );
}
