'use client';

import { useEffect, useMemo, useState } from 'react';
import { Donation } from '@/types/donation';
import {
  buildDonationCardSVG,
  svgDataUrl,
  svgToJpegBlob,
} from '@/lib/donation-card';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface ReceiptModalProps {
  donations: Donation[];
  yearTotal: number;
  paymentMethod?: string;
  onClose: () => void;
}

export default function ReceiptModal({ donations, yearTotal, paymentMethod, onClose }: ReceiptModalProps) {
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!donations.length) return null;

  const first = donations[0];
  const donorName = first.donor_name;

  const months = donations
    .map(d => Number(d.donation_date.split('-')[1]) - 1)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b);

  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);

  const enteredDate = donations.map(d => d.created_at).sort().reverse()[0];
  const dateLabel = new Date(enteredDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const monthStr = months.length === 1
    ? MONTH_NAMES[months[0]]
    : months.map(m => MONTH_SHORT[m]).join(', ');

  const svgString = useMemo(() => buildDonationCardSVG({
    donorName,
    amount: totalAmount,
    months: monthStr,
    date: dateLabel,
    paymentMethod: paymentMethod ?? '—',
    totalDonated: yearTotal,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [donorName, totalAmount, monthStr, dateLabel, paymentMethod, yearTotal]);

  const previewUrl = useMemo(() => svgDataUrl(svgString), [svgString]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await svgToJpegBlob(svgString);
      if (!blob) {
        window.open('https://wa.me/', '_blank');
        return;
      }
      const safeName = donorName.replace(/[^a-zA-Z0-9]/g, '-');
      const file = new File([blob], `Ad-Dawah-${safeName}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Donation Receipt' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        window.open('https://wa.me/', '_blank');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err);
        window.open('https://wa.me/', '_blank');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.currentTarget === e.target) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-slide-down"
        style={{
          background: '#0e1c12',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)',
        }}
      >
        {/* SVG card preview */}
        <div className="p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Donation card preview"
            style={{ width: '100%', borderRadius: '16px', display: 'block' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4 pb-4 pt-1">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: '#25D366', boxShadow: '0 6px 20px rgba(37,211,102,0.3)' }}
          >
            {sharing ? (
              <svg className="w-4 h-4 animate-spin fill-white" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            )}
            {sharing ? 'Generating…' : 'Share via WhatsApp'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#6b9e6f', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
