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
    supabase
      .from('donations')
      .select('*')
      .eq('campaign_id', id)
      .order('donation_date', { ascending: false }),
  ]);

  if (!campaign) notFound();

  const totalAmount = (donations ?? []).reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-900 font-medium"
        >
          ← Back to Dashboard
        </Link>

        {/* Campaign header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-gray-500 mt-1 max-w-2xl">{campaign.description}</p>
              )}
            </div>
            <span
              className={`shrink-0 text-sm font-medium px-3 py-1 rounded-full ${
                campaign.is_active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {campaign.is_active ? 'Active' : 'Ended'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Donations</p>
              <p className="text-2xl font-bold text-blue-700">{(donations ?? []).length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Date Range</p>
              <p className="text-sm font-medium text-gray-700">
                {campaign.start_date || campaign.end_date ? (
                  <>
                    {campaign.start_date ? formatDate(campaign.start_date) : 'N/A'}
                    {' – '}
                    {campaign.end_date ? formatDate(campaign.end_date) : 'Ongoing'}
                  </>
                ) : (
                  'Not specified'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Donations table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Donations</h2>
          <DonationsTable donations={donations ?? []} showCampaign={false} />
        </section>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-200">
        Mosque Donation Tracker &mdash; Built with transparency in mind.
      </footer>
    </div>
  );
}
