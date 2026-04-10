'use client';

import Link from 'next/link';

interface NavbarProps {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ isAdmin, onLogout }: NavbarProps) {
  return (
    <nav className="bg-emerald-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:text-emerald-200 transition-colors">
            <span className="text-2xl">🕌</span>
            <span>Mosque Donation Tracker</span>
          </Link>

          <div>
            {isAdmin ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-emerald-200 hidden sm:inline">Admin</span>
                <button
                  onClick={onLogout}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
