'use client';

import { useEffect, useRef, useState } from 'react';
import { Donation } from '@/types/donation';

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
  onClose: () => void;
}

export default function ReceiptModal({ donations, yearTotal, onClose }: ReceiptModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!donations.length) return null;

  const first = donations[0];
  const donorName = first.donor_name;

  // Collect unique months from all donation rows in this batch
  const months = donations
    .map(d => Number(d.donation_date.split('-')[1]) - 1) // 0-indexed
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b);

  // Total amount across all rows in this batch
  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);

  // Date label — use the donation_date entered by admin (most recent in batch)
  const enteredDate = donations
    .map(d => d.donation_date)
    .sort()
    .reverse()[0];
  const dateLabel = new Date(enteredDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Share as image via navigator.share (mobile) with html2canvas
  const handleShare = async () => {
    if (!receiptRef.current) return;
    setSharing(true);
    try {
      // Dynamically load html2canvas so it's not bundled unless needed
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: null,
        scale: 3, // high-res for phone screens
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) { setSharing(false); return; }

        const file = new File([blob], 'AdMosque-Receipt.png', { type: 'image/png' });

        const monthStr = months.length === 1
          ? MONTH_NAMES[months[0]]
          : months.map(m => MONTH_SHORT[m]).join(', ');

        const text = [
          `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ`,
          ``,
          `🕌 *AdMosque — Donation Receipt*`,
          ``,
          `Assalamu Alaikum *${donorName}*,`,
          ``,
          `Thank you for your generous donation. May Allah accept it from you.`,
          ``,
          `📅 Month(s): ${monthStr}`,
          `💰 Amount: $${totalAmount.toFixed(2)}`,
          `📆 Date: ${dateLabel}`,
          `📊 Year Total: $${yearTotal.toFixed(2)}`,
          ``,
          `جزاك الله خيراً`,
          `_JazakAllah Khayran_`,
        ].join('\n');

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          // Mobile: native share sheet opens — admin picks WhatsApp
          await navigator.share({ files: [file], text });
        } else {
          // Desktop fallback: download the image
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'AdMosque-Receipt.png';
          a.click();
        }

        setSharing(false);
      }, 'image/png');

    } catch (err) {
      console.error('Share failed:', err);
      setSharing(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-slide-down"
        style={{
          background: 'linear-gradient(168deg, #1c4d2e 0%, #0e2e1a 52%, #071a0e 100%)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)',
        }}
      >
        {/* Geometric overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            repeating-linear-gradient(60deg,  rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 24px),
            repeating-linear-gradient(-60deg, rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 24px)
          `,
          borderRadius: 'inherit',
        }} />

        {/* ── RECEIPT CARD (captured by html2canvas) ── */}
        <div ref={receiptRef} className="relative p-6 space-y-5"
          style={{ background: 'linear-gradient(168deg, #1c4d2e 0%, #0e2e1a 52%, #071a0e 100%)' }}>

          {/* Header — mosque name + verified */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)' }}>
                🕌
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#e8d5a3' }}>AdMosque</p>
                <p className="text-[10px]" style={{ color: '#4a6a4e' }}>mosque-donation.vercel.app</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Verified
            </div>
          </div>

          {/* Bismillah */}
          <div className="text-center space-y-1">
            <p style={{ fontFamily: 'serif', fontSize: '20px', color: 'rgba(212,175,55,0.75)', lineHeight: 1.5 }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-[9px] font-medium tracking-widest uppercase" style={{ color: '#2a3e2c' }}>
              Bismillahir Rahmanir Rahim
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }} />

          {/* Thank you */}
          <p className="text-center italic" style={{ color: 'rgba(212,175,55,0.55)', fontFamily: 'serif', fontSize: '14px' }}>
            &ldquo;Thank you for your generous donation&rdquo;
          </p>

          {/* Donor name */}
          <p style={{ fontFamily: 'serif', fontSize: '26px', fontWeight: 700, color: '#f0e6c8', lineHeight: 1.2 }}>
            {donorName}
          </p>

          {/* Amount */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#4a6a4e' }}>
              Amount Donated
            </p>
            <p style={{ fontFamily: 'serif', fontSize: '34px', fontWeight: 700, color: '#d4af37', lineHeight: 1 }}>
              <span style={{ fontSize: '18px', color: '#a07d28' }}>$</span>
              {totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Months */}
          <div className="rounded-xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#2a3e2c' }}>
              Month(s) Covered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {months.map(m => (
                <span key={m} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#c4a030' }}>
                  {MONTH_SHORT[m]}
                </span>
              ))}
            </div>
          </div>

          {/* Date (from admin entry) + Year Total */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.045)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2a3e2c' }}>Date</p>
              <p className="text-xs font-semibold" style={{ color: '#7aaa7e' }}>{dateLabel}</p>
            </div>
            <div className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.045)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2a3e2c' }}>Year Total</p>
              <p className="text-xs font-semibold" style={{ color: '#7aaa7e' }}>${yearTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Footer — JazakAllah */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
            className="flex items-end justify-end">
            <div className="text-right">
              <p style={{ fontFamily: 'serif', fontSize: '16px', color: 'rgba(212,175,55,0.5)', lineHeight: 1.3 }}>
                جزاك الله خيراً
              </p>
              <p className="text-[9px] mt-0.5 tracking-wider" style={{ color: '#2a3e2c' }}>
                JazakAllah Khayran
              </p>
            </div>
          </div>

        </div>
        {/* ── END RECEIPT CARD ── */}

        {/* Action buttons — outside receiptRef so they don't appear in the image */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
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
            {sharing ? 'Preparing...' : 'Share via WhatsApp'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#4a6a4e', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
