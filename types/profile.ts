export interface Profile {
  id: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
}
