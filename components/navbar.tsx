'use client';

import Link from 'next/link';

interface NavbarProps {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ isAdmin, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          boxShadow: '0 4px 24px rgba(4,78,63,0.3)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 transition-transform group-hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                🕌
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Short title on mobile, full on sm+ */}
                  <p className="font-bold text-white leading-none text-sm sm:text-base truncate">
                    <span className="sm:hidden">Mosque Tracker</span>
                    <span className="hidden sm:inline">Mosque Donation Tracker</span>
                  </p>
                  {/* LIVE badge */}
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
                    style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.5)' }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                    </span>
                    <span className="text-[9px] font-extrabold tracking-widest text-red-300 uppercase leading-none">
                      Live
                    </span>
                  </span>
                </div>
                <p className="text-emerald-300 text-[10px] leading-none mt-0.5 hidden sm:block">
                  Transparent Community Giving
                </p>
              </div>
            </Link>

            {/* Right side */}
            <div>
              {isAdmin ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:flex items-center gap-1.5 text-emerald-200 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ animation: 'pulse-dot 2s infinite' }} />
                    Admin
                  </span>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 text-sm font-medium text-white px-4 py-2 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Admin</span> Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
