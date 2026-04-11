'use client';

import { useState } from 'react';
import { Donor } from '@/types/donor';
import { DonationFormData } from '@/types/donation';
import { formatCurrency } from '@/lib/utils';

/** Donor details without a date — used for split-year submissions */
export interface SplitDonationBase {
  donor_name: string;
  donor_phone: string;
  donor_location: string;
  amount: string;
  notes: string;
}

interface AddDonationFormProps {
  initialMonth?: string;           // "YYYY-MM" — pre-fills the month picker
  onLookupDonor: (phone: string) => Promise<Donor | null>;
  onSubmit: (data: DonationFormData) => Promise<void>;
  /** Called when admin chooses "Split" — months is a sorted 0-indexed array of selected month indices */
  onSubmitSplit: (base: SplitDonationBase, year: number, months: number[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type Step = 'lookup' | 'fill';
type Mode = 'single' | 'split';

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

const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - 5 + i).filter(
  y => y <= CURRENT_YEAR + 1
);

export default function AddDonationForm({
  initialMonth,
  onLookupDonor,
  onSubmit,
  onSubmitSplit,
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
  const [mode, setMode] = useState<Mode>('single');
  const [month, setMonth] = useState(initialMonth ?? currentYearMonth());
  const [splitYear, setSplitYear] = useState(CURRENT_YEAR);
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const toggleMonth = (idx: number) =>
    setSelectedMonths(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

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

  // Per-month preview for split mode
  const totalAmt = parseFloat(amount);
  const splitCount = selectedMonths.size;
  const perMonth =
    !isNaN(totalAmt) && totalAmt > 0 && splitCount > 0
      ? Math.round((totalAmt / splitCount) * 100) / 100
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const donorName = foundDonor ? foundDonor.name : newName.trim();
    const donorLocation = foundDonor ? (foundDonor.location ?? '') : newLocation.trim();

    if (isNewDonor && !newName.trim()) return setFormError('Donor name is required.');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setFormError('Amount must be greater than 0.');

    if (mode === 'split') {
      if (selectedMonths.size === 0) return setFormError('Please select at least one month.');
      await onSubmitSplit(
        { donor_name: donorName, donor_phone: digits, donor_location: donorLocation, amount, notes },
        splitYear,
        [...selectedMonths].sort((a, b) => a - b)
      );
    } else {
      if (!month) return setFormError('Please select a contribution month.');
      await onSubmit({
        donor_name: donorName,
        donor_phone: digits,
        donor_location: donorLocation,
        campaign_id: '',
        amount,
        donation_date: `${month}-01`,
        notes,
      });
    }
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

              {/* ── Contribution mode toggle ── */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--c-text)' }}>
                  Contribution Type
                </label>
                <div className="flex rounded-xl overflow-hidden"
                  style={{ border: '1.5px solid var(--c-border-2)', background: 'var(--c-bg)' }}>
                  {(['single', 'split'] as Mode[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-all duration-150"
                      style={mode === m ? {
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: 'white',
                      } : {
                        color: 'var(--c-text-2)',
                      }}
                    >
                      {m === 'single' ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Single Month
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          Split
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount — always visible */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>
                  {mode === 'split' ? 'Total Amount ($)' : 'Amount ($)'}{' '}
                  <span className="text-red-400">*</span>
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

              {/* Single month picker */}
              {mode === 'single' && (
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
              )}

              {/* Split mode — year + month grid */}
              {mode === 'split' && (
                <div className="space-y-3">
                  {/* Year + Select All row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>Year</label>
                      <select
                        value={splitYear}
                        onChange={e => { setSplitYear(Number(e.target.value)); setSelectedMonths(new Set()); }}
                        className="input w-28 py-1.5 text-sm appearance-none cursor-pointer"
                      >
                        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => setSelectedMonths(new Set([0,1,2,3,4,5,6,7,8,9,10,11]))}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
                        All 12
                      </button>
                      <button type="button"
                        onClick={() => setSelectedMonths(new Set())}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: 'var(--c-bg)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* 12-month grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {MONTH_NAMES.map((name, idx) => {
                      const isChecked = selectedMonths.has(idx);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleMonth(idx)}
                          className="relative flex flex-col items-center justify-center py-2 rounded-xl text-xs font-semibold transition-all duration-150 focus:outline-none"
                          style={isChecked ? {
                            background: 'linear-gradient(135deg, #059669, #047857)',
                            color: 'white',
                            boxShadow: '0 3px 10px rgba(5,150,105,0.35)',
                          } : {
                            background: 'var(--c-bg)',
                            color: 'var(--c-text-2)',
                            border: '1.5px solid var(--c-border)',
                          }}
                        >
                          {name}
                          {isChecked && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Split preview */}
                  {perMonth !== null && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: 'var(--c-accent-bg)', border: '1.5px solid var(--c-border-2)' }}>
                      <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm" style={{ color: 'var(--c-accent)' }}>
                        <span className="font-bold">{formatCurrency(perMonth)}</span>
                        <span className="font-medium"> × {splitCount} month{splitCount !== 1 ? 's' : ''} in </span>
                        <span className="font-bold">{splitYear}</span>
                      </p>
                    </div>
                  )}
                  {selectedMonths.size === 0 && (
                    <p className="text-xs text-center" style={{ color: 'var(--c-text-3)' }}>
                      Tap months above to select
                    </p>
                  )}
                </div>
              )}

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
              ) : mode === 'split'
                ? (isNewDonor ? `Add Donor & Split (${splitCount}mo)` : `Split Across ${splitCount} Month${splitCount !== 1 ? 's' : ''}`)
                : (isNewDonor ? 'Add Donor & Donation' : 'Add Donation')}
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
