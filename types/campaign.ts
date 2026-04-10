export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_amount?: number;
  donation_count?: number;
}

export interface CampaignFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
