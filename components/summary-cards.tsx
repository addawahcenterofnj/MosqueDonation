'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
  totalAmount: number;
  totalDonations: number;
  totalCampaigns: number;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

const cards = [
  {
    label: 'Total Collected',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    from: '#059669', to: '#047857',
    light: '#ecfdf5', border: '#a7f3d0',
    iconBg: '#d1fae5', iconColor: '#065f46',
    stagger: 'stagger-1',
  },
  {
    label: 'Total Donations',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    from: '#2563eb', to: '#1d4ed8',
    light: '#eff6ff', border: '#bfdbfe',
    iconBg: '#dbeafe', iconColor: '#1e40af',
    stagger: 'stagger-2',
  },
  {
    label: 'Total Campaigns',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
    from: '#7c3aed', to: '#6d28d9',
    light: '#f5f3ff', border: '#ddd6fe',
    iconBg: '#ede9fe', iconColor: '#4c1d95',
    stagger: 'stagger-3',
  },
];

export default function SummaryCards({ totalAmount, totalDonations, totalCampaigns }: SummaryCardsProps) {
  const countDonations = useCountUp(totalDonations);
  const countCampaigns = useCountUp(totalCampaigns);

  const values = [
    formatCurrency(totalAmount),
    countDonations.toLocaleString(),
    countCampaigns.toLocaleString(),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`animate-slide-up ${card.stagger} rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
          style={{
            background: card.light,
            border: `1.5px solid ${card.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: card.iconBg, color: card.iconColor }}
          >
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-0.5">
              {card.label}
            </p>
            <p
              className="text-xl sm:text-2xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${card.from}, ${card.to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {values[i]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
