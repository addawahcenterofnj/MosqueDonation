import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import DonationsTable from '@/components/donations-table';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: campaign }, { data: donations }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).single(),
    supabase.from('donations').select('*').eq('campaign_id', id).order('donation_date', { ascending: false }),
  ]);

  if (!campaign) notFound();

  const totalAmount = (donations ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const donationList = donations ?? [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>
      <Navbar />

      {/* Campaign hero */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white text-sm font-medium transition-colors mb-5 group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="animate-slide-down">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-emerald-200 text-base max-w-2xl leading-relaxed">{campaign.description}</p>
              )}
            </div>
            <span className="shrink-0 text-sm font-bold px-4 py-1.5 rounded-full animate-fade-in"
              style={campaign.is_active
                ? { background: 'rgba(52,211,153,0.2)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.4)' }
                : { background: 'rgba(255,255,255,0.1)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.2)' }
              }>
              {campaign.is_active ? '● Active' : '○ Ended'}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 -mt-8 relative z-10">
          {[
            {
              label: 'Total Collected', value: formatCurrency(totalAmount),
              border: '#a7f3d0', color: '#059669', icon: '💰',
            },
            {
              label: 'Total Donations', value: String(donationList.length),
              border: '#bfdbfe', color: '#2563eb', icon: '📋',
            },
            {
              label: 'Date Range',
              value: campaign.start_date || campaign.end_date
                ? `${campaign.start_date ? formatDate(campaign.start_date) : 'N/A'} – ${campaign.end_date ? formatDate(campaign.end_date) : 'Ongoing'}`
                : 'Not specified',
              border: '#ddd6fe', color: '#7c3aed', icon: '📅',
              small: true,
            },
          ].map((s) => (
            <div key={s.label}
              className="rounded-2xl p-5 animate-slide-up"
              style={{ background: 'var(--c-card)', border: `1.5px solid ${s.border}`, boxShadow: '0 4px 20px var(--c-shadow)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--c-text-2)' }}>{s.label}</p>
              </div>
              <p className={`font-bold ${s.small ? 'text-sm' : 'text-2xl'}`} style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Donations */}
        <section className="pb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💳</span>
            <h2 className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>Donations</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-border-2)' }}>
              {donationList.length} record{donationList.length !== 1 ? 's' : ''}
            </span>
          </div>
          <DonationsTable donations={donationList} showCampaign={false} />
        </section>
      </main>

      <footer className="py-6 text-center text-xs font-medium"
        style={{ background: 'var(--c-accent-bg)', borderTop: '1px solid var(--c-border)', color: 'var(--c-accent)' }}>
        🕌 Mosque Donation Tracker — Built with transparency for our community
      </footer>
    </div>
  );
}
