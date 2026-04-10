export interface MonthlyReport {
  id: string;
  month: string;      // stored as 'YYYY-MM-DD' (first day of month)
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReportFormData {
  month: string;      // 'YYYY-MM' from <input type="month">
  amount: string;
  notes: string;
}
