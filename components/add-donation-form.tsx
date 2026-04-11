'use client';

import { useState } from 'react';
import { Donor } from '@/types/donor';
import { DonationFormData } from '@/types/donation';

interface AddDonationFormProps {
  initialMonth?: string;           // "YYYY-MM" — pre-fills the month picker
  onLookupDonor: (phone: string) => Promise<Donor | null>;
  onSubmit: (data: DonationFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type Step = 'lookup' | 'fill';

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function currentYearMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function AddDonationForm({
  initialMonth,
  onLookupDonor,
  onSubmit,
  onCancel,
  loading,
}: AddDonationFormProps) {
  const [step, setStep] = useState<Step>('lookup');
  const [rawPhone, setRawPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [looking, setLooking] = useState(false);

  // Resolved donor info
  const [foundDonor, setFoundDonor] = useState<Donor | null>(null);
  const [isNewDonor, setIsNewDonor] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Donation fields
  const [month, setMonth] = useState(initialMonth ?? currentYearMonth());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const digits = rawPhone.replace(/\D/g, '');

  const handleLookup = async () => {
    setPhoneError('');
    if (digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      return;
    }
    setLooking(true);
    const found = await onLookupDonor(digits);
    setLooking(false);
    setFoundDonor(found);
    setIsNewDonor(!found);
    setStep('fill');
  };

  const handleReset = () => {
    setStep('lookup');
    setFoundDonor(null);
    setIsNewDonor(false);
    setNewName('');
    setNewLocation('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const donorName = foundDonor ? foundDonor.name : newName.trim();
    const donorLocation = foundDonor ? (foundDonor.location ?? '') : newLocation.trim();

    if (isNewDonor && !newName.trim()) return setFormError('Donor name is required.');
    if (!month) return setFormError('Please select a contribution month.');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setFormError('Amount must be greater than 0.');

    await onSubmit({
      donor_name: donorName,
      donor_phone: digits,
      donor_location: donorLocation,
      campaign_id: '',               // no campaign — handled as null in dashboard
      amount,
      donation_date: `${month}-01`,  // first day of the selected month
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-slide-down">

      {/* ── Phone Lookup ── */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>
          Donor Phone Number <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="tel"
            value={formatPhone(rawPhone)}
            onChange={e => {
              const d = e.target.value.replace(/\D/g, '').slice(0, 10);
              setRawPhone(d);
              setPhoneError('');
            }}
            disabled={step === 'fill'}
            placeholder="(555) 555-5555"
            className="input flex-1"
          />
          {step === 'lookup' ? (
            <button
              type="button"
              onClick={handleLookup}
              disabled={looking || digits.length !== 10}
              className="btn-primary px-4 whitespace-nowrap"
            >
              {looking ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Looking…
                </span>
              ) : 'Look Up'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="btn-ghost px-4 text-sm whitespace-nowrap"
            >
              Change
            </button>
          )}
        </div>
        {digits.length > 0 && digits.length < 10 && step === 'lookup' && (
          <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
            {10 - digits.length} more digit{10 - digits.length !== 1 ? 's' : ''} needed
          </p>
        )}
        {phoneError && (
          <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{phoneError}</p>
        )}
      </div>

      {/* ── Donor Result / New Donor ── */}
      {step === 'fill' && (
        <>
          {foundDonor ? (
            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(5,150,105,0.08)', border: '1.5px solid rgba(5,150,105,0.3)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(5,150,105,0.15)', color: '#059669' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#059669' }}>
                  Donor Found
                </p>
                <p className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{foundDonor.name}</p>
                {foundDonor.location && (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--c-text-3)' }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {foundDonor.location}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(234,179,8,0.08)', border: '1.5px solid rgba(234,179,8,0.3)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#b45309' }}>
                New Donor — Enter Details
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="input"
                    placeholder="Donor's full name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>
                    Location
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'var(--c-text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      className="input pl-10"
                      placeholder="City, State…"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Donation Details ── */}
          <div className="pt-1">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--c-text-3)' }}>
              Donation Details
            </p>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contribution Month */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>
                    Contribution Month <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>
                    Amount ($) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-sm pointer-events-none"
                      style={{ color: 'var(--c-text-3)' }}>$</span>
                    <input
                      type="number" min="0.01" step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="input pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="input resize-none"
                  placeholder="Optional notes…"
                />
              </div>
            </div>
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
              ) : isNewDonor ? 'Add Donor & Donation' : 'Add Donation'}
            </button>
            <button type="button" onClick={onCancel} className="btn-ghost flex-1 py-2.5">Cancel</button>
          </div>
        </>
      )}

      {step === 'lookup' && (
        <div className="flex justify-start">
          <button type="button" onClick={onCancel} className="btn-ghost py-2 px-4 text-sm">Cancel</button>
        </div>
      )}
    </form>
  );
}
