import React, { useState } from 'react';
import { LogIn, LayoutDashboard, Menu, X } from 'lucide-react';

interface NavbarProps {
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  onEnterDashboard: () => void;
  onBackHome: () => void;
}

const LANDING_NAV_ITEMS = [
  { id: 'harga', label: 'Harga' },
  { id: 'pertanyaan', label: 'Pertanyaan' },
  { id: 'testimoni', label: 'Apa Kata Customer' }
];

export const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn,
  onOpenLogin,
  onEnterDashboard,
  onBackHome
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigateSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#104F38]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Identity */}
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onBackHome();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 text-left cursor-pointer shrink-0 whitespace-nowrap"
        >
          <div className="w-9 h-9 bg-[#104F38] border border-[#104F38] flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-[#FFE600]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3 3h7v7H3V3zm2 2v3h3V5H5z" />
              <rect x="6" y="6" width="1" height="1" />
              <path d="M14 3h7v7h-7V3zm2 2v3h3V5h-3z" />
              <rect x="17" y="6" width="1" height="1" />
              <path d="M3 14h7v7H3v-7zm2 2v3h3v-3H5z" />
              <rect x="6" y="17" width="1" height="1" />
              <rect x="11" y="3" width="2" height="2" />
              <rect x="11" y="7" width="2" height="2" />
              <rect x="3" y="11" width="2" height="2" />
              <rect x="7" y="11" width="2" height="2" />
              <rect x="11" y="11" width="2" height="2" />
              <rect x="14" y="11" width="3" height="2" />
              <rect x="19" y="11" width="2" height="2" />
              <rect x="11" y="15" width="2" height="2" />
              <rect x="14" y="14" width="2" height="2" />
              <rect x="18" y="14" width="3" height="2" />
              <rect x="15" y="17" width="2" height="2" />
              <rect x="11" y="19" width="2" height="2" />
              <rect x="14" y="19" width="2" height="2" />
              <rect x="18" y="18" width="3" height="3" />
            </svg>
          </div>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#104F38] whitespace-nowrap">
            Projecttapp
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Landing Page Menu Links */}
        <nav aria-label="Menu Beranda" className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#104F38]/80">
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigateSection(item.id);
              }}
              className="hover:text-[#104F38] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={onEnterDashboard}
              className="px-4 py-2 text-xs font-bold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/25 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Masuk Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-5 py-2 text-xs font-bold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/25 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup menu beranda' : 'Buka menu beranda'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center border border-[#104F38]/20 text-[#104F38] hover:bg-[#F4FAF6] cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Anchor Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Menu Beranda Mobile"
          className="md:hidden bg-white border-t border-[#104F38]/15 px-4 py-3 flex flex-col gap-1"
        >
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigateSection(item.id);
              }}
              className="px-3 py-2.5 text-sm font-semibold text-[#104F38] hover:bg-[#F4FAF6] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};
