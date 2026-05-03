'use client';

import { useState } from 'react';

interface DonorRow {
  name: string;
  total: number;
}

interface WhatsAppShareButtonProps {
  label: string;       // e.g. "May 2026"
  total: number;       // total amount in cents or dollars (same as formatCurrency input)
  donors: DonorRow[];
}

export default function WhatsAppShareButton({ label, total, donors }: WhatsAppShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function buildMessage() {
    const lines = donors
      .map((d, i) => `${i + 1}. ${d.name}`)
      .join('\n');

    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(total);

    return (
      `🕌 *${label} Donors – Al-Dawah Center*\n\n` +
      `JazakAllah khair to our generous donors this month:\n\n` +
      `${lines}\n\n` +
      `💰 *Total Raised: ${formattedTotal}*\n\n` +
      `🔗 Full report: https://mosque-donation.vercel.app`
    );
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildMessage()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (donors.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* WhatsApp share button */}
      <button
        onClick={handleWhatsApp}
        title={`Share ${label} donors to WhatsApp`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          color: 'white',
          boxShadow: '0 2px 10px rgba(37,211,102,0.35)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {/* WhatsApp icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.099 1.509 5.823L.057 23.547a.75.75 0 00.921.919l5.724-1.452A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 01-4.962-1.361l-.356-.211-3.695.937.955-3.595-.232-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
        Share
      </button>

      {/* Copy text button */}
      <button
        onClick={handleCopy}
        title="Copy donor list as text"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
        style={{
          background: copied ? 'rgba(5,150,105,0.12)' : 'var(--c-card)',
          color: copied ? 'var(--c-accent)' : 'var(--c-text-2)',
          border: copied ? '1.5px solid var(--c-border-2)' : '1.5px solid var(--c-border)',
          cursor: 'pointer',
        }}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}
