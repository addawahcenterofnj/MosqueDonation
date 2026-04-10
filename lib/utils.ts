export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getYearsFromDonations(donations: { donation_date: string }[]): number[] {
  const years = donations.map((d) => new Date(d.donation_date).getFullYear());
  return Array.from(new Set(years)).sort((a, b) => b - a);
}
