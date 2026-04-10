'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Donation } from '@/types/donation';
import { Campaign } from '@/types/campaign';
import Navbar from '@/components/navbar';
import SummaryCards from '@/components/summary-cards';
import SearchFilters from '@/components/search-filters';
import DonationsTable from '@/components/donations-table';
import CampaignList from '@/components/campaign-list';
import { getYearsFromDonations } from '@/lib/utils';

export default function PublicDashboardClient() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    async function load() {
      const [{ data: donationsData }, { data: campaignsData }] = await Promise.all([
        supabase
          .from('donations')
          .select('*, campaigns(id, name)')
          .order('donation_date', { ascending: false }),
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      ]);

      const rawDonations: Donation[] = donationsData ?? [];
      const rawCampaigns: Campaign[] = campaignsData ?? [];

      const enriched = rawCampaigns.map((c) => {
        const total = rawDonations
          .filter((d) => d.campaign_id === c.id)
          .reduce((sum, d) => sum + Number(d.amount), 0);
        return { ...c, total_amount: total };
      });

      setDonations(rawDonations);
      setCampaigns(enriched);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const years = useMemo(() => getYearsFromDonations(donations), [donations]);

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      const matchName = searchName
        ? d.donor_name.toLowerCase().includes(searchName.toLowerCase())
        : true;
      const matchPhone = searchPhone
        ? (d.donor_phone ?? '').includes(searchPhone)
        : true;
      const matchYear = selectedYear
        ? new Date(d.donation_date).getFullYear() === parseInt(selectedYear)
        : true;
      return matchName && matchPhone && matchYear;
    });
  }, [donations, searchName, searchPhone, selectedYear]);

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg">Loading...</div>
        ) : (
          <>
            <SummaryCards
              totalAmount={totalAmount}
              totalDonations={donations.length}
              totalCampaigns={campaigns.length}
            />

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Search &amp; Filter</h2>
              <SearchFilters
                searchName={searchName}
                searchPhone={searchPhone}
                selectedYear={selectedYear}
                years={years}
                onSearchName={setSearchName}
                onSearchPhone={setSearchPhone}
                onYearChange={setSelectedYear}
              />
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Donations
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({filtered.length} {filtered.length === 1 ? 'record' : 'records'})
                </span>
              </h2>
              <DonationsTable donations={filtered} showCampaign />
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Campaigns</h2>
              <CampaignList campaigns={campaigns} />
            </section>
          </>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-200">
        Mosque Donation Tracker &mdash; Built with transparency in mind.
      </footer>
    </div>
  );
}
