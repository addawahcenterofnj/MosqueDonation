export interface Donation {
  id: string;
  donor_name: string;
  donor_phone: string | null;
  campaign_id: string;
  amount: number;
  donation_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  campaigns?: {
    id: string;
    name: string;
  };
}

export interface DonationFormData {
  donor_name: string;
  donor_phone: string;
  campaign_id: string;
  amount: string;
  donation_date: string;
  notes: string;
}
