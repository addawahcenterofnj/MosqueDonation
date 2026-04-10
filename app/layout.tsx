import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mosque Donation Tracker',
  description: 'Track and manage mosque donations transparently.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
