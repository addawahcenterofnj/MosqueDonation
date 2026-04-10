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
  donor_name: '',
  donor_phone: '',
  campaign_id: '',
  amount: '',
  donation_date: '',
  notes: '',
};

export default function DonationForm({
  initial,
  campaigns,
  onSubmit,
  onCancel,
  loading,
}: DonationFormProps) {
  const [form, setForm] = useState<DonationFormData>(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        donor_name: initial.donor_name,
        donor_phone: initial.donor_phone ?? '',
        campaign_id: initial.campaign_id,
        amount: String(initial.amount),
        donation_date: initial.donation_date,
        notes: initial.notes ?? '',
      });
    } else {
      setForm(EMPTY);
    }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Donor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.donor_name}
            onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="text"
            value={form.donor_phone}
            onChange={(e) => setForm({ ...form, donor_phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign <span className="text-red-500">*</span>
          </label>
          <select
            value={form.campaign_id}
            onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Select a campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Donation Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.donation_date}
          onChange={(e) => setForm({ ...form, donation_date: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : initial ? 'Update Donation' : 'Add Donation'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
