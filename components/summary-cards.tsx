import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
  totalAmount: number;
  totalDonations: number;
  totalCampaigns: number;
}

export default function SummaryCards({
  totalAmount,
  totalDonations,
  totalCampaigns,
}: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Collected',
      value: formatCurrency(totalAmount),
      icon: '💰',
      color: 'bg-emerald-50 border-emerald-200',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Total Donations',
      value: totalDonations.toLocaleString(),
      icon: '📋',
      color: 'bg-blue-50 border-blue-200',
      valueColor: 'text-blue-700',
    },
    {
      label: 'Total Campaigns',
      value: totalCampaigns.toLocaleString(),
      icon: '🎯',
      color: 'bg-purple-50 border-purple-200',
      valueColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-5 ${card.color} flex items-center gap-4`}
        >
          <span className="text-3xl">{card.icon}</span>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
