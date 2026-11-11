import React from 'react';
import { Plus, Radio, User, LogOut, Sparkles, QrCode, KeyRound, Crown, UserPlus, Shield } from 'lucide-react';
import type { AuthUser } from '../types.ts';

interface NavbarProps {
  currentTab: 'qr' | 'nfc' | 'stand-design';
  onTabChange: (tab: 'qr' | 'nfc' | 'stand-design') => void;
  onOpenCreateModal: () => void;
  onOpenActivateNFCModal: () => void;
  activeCount: number;
  nfcCount: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenChangeCredentials?: () => void;
  onOpenAddUser?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateModal,
  onOpenActivateNFCModal,
  activeCount,
  nfcCount,
  currentUser,
  onLogout,
  onOpenChangeCredentials,
  onOpenAddUser
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#104F38]/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onTabChange('qr')}
            className="flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer group"
          >
            {/* Minimalist wireframe bracket icon with canary yellow accent */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-[#104F38]/30 bg-[#F4FAF6] text-[#104F38] flex items-center justify-center transition-transform group-hover:scale-105 relative shrink-0">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#FFE600] absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 border border-[#104F38]/20" />
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#104F38]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h3v3H7z" />
                <path d="M14 7h3v3h-3z" />
                <path d="M7 14h3v3H7z" />
                <path d="M14 14h.01" />
                <path d="M17 17h.01" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-[#104F38] block leading-none truncate">
                Dinamis<span className="text-[#104F38]">QR</span>
                <span className="text-[11px] sm:text-xs font-serif-italic ml-1 text-[#104F38]/70 hidden xs:inline">Excellence</span>
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-wider uppercase text-[#104F38]/60 font-semibold block mt-0.5 truncate">
                Cetak & NFC Review
              </span>
            </div>
          </button>
        </div>

        {/* Desktop / Tablet Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-7 text-xs lg:text-sm font-semibold text-[#104F38]/70">
          <button
            onClick={() => onTabChange('qr')}
            className={`transition-all whitespace-nowrap shrink-0 cursor-pointer py-5 relative flex items-center gap-1.5 ${
              currentTab === 'qr'
                ? 'text-[#104F38] font-bold'
                : 'hover:text-[#104F38]'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#104F38]" />
            <span>Daftar QRIS & QR ({activeCount})</span>
            {currentTab === 'qr' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#104F38]" />
            )}
          </button>

          <button
            onClick={() => onTabChange('nfc')}
            className={`transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer py-5 relative ${
              currentTab === 'nfc'
                ? 'text-[#104F38] font-bold'
                : 'hover:text-[#104F38]'
            }`}
          >
            <Radio className="w-4 h-4 text-[#104F38]" />
            <span>Aktivasi NFC Tag ({nfcCount})</span>
            {currentTab === 'nfc' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#104F38]" />
            )}
          </button>

          <button
            onClick={() => onTabChange('stand-design')}
            className={`transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer py-5 relative ${
              currentTab === 'stand-design'
                ? 'text-[#104F38] font-bold'
                : 'hover:text-[#104F38]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#FFE600]" />
            <span>Desain Stand Review</span>
            <span className="text-[9px] font-bold bg-[#FFE600] text-[#104F38] px-1.5 py-0.2 rounded-none">
              Stand A6 (9 Desain)
            </span>
            {currentTab === 'stand-design' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#104F38]" />
            )}
          </button>
        </nav>

        {/* Primary Action Button & User Session */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentTab === 'nfc' ? (
            <button
              onClick={onOpenActivateNFCModal}
              className="px-2.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#104F38] hover:bg-[#0C3B2A] rounded-none transition-all shadow-xs flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Aktivasi</span>
              <span>Tag Baru</span>
            </button>
          ) : (
            <button
              onClick={onOpenCreateModal}
              className="px-2.5 sm:px-4 py-2 text-xs font-bold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] rounded-none border border-[#104F38]/20 transition-all shadow-xs flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat QR</span>
              <span className="hidden xs:inline">Baru</span>
            </button>
          )}

          {currentUser && onLogout && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#104F38]/15">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#104F38] font-medium bg-[#F4FAF6] border border-[#104F38]/15 py-1 px-2.5 rounded-none">
                <User className="w-3 h-3 text-[#104F38]/70" />
                <span className="max-w-[100px] truncate">{currentUser.username}</span>
              </div>
              {currentUser.username.toLowerCase() === 'admin' && onOpenAddUser && (
                <button
                  onClick={onOpenAddUser}
                  className="px-2.5 py-1 text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/30 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Tambah User Baru (Menu Dashboard Administrator)"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#104F38]" />
                  <span>+ Tambah User</span>
                </button>
              )}
              {onOpenChangeCredentials && (
                <button
                  onClick={onOpenChangeCredentials}
                  className="px-2 py-1 text-[#104F38] hover:bg-[#FFE600] border border-[#104F38]/20 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                  title="Ganti Password Akun (Username Terkunci)"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#104F38]" />
                  <span className="hidden sm:inline">Ganti Akun</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 text-[#104F38]/70 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                title={`Keluar (${currentUser.username})`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile & Tablet Bottom / Sub-nav Navigation Strip (Touch target >= 44px) */}
      <div className="md:hidden grid grid-cols-3 border-t border-[#104F38]/10 bg-[#F8FAF9]">
        <button
          onClick={() => onTabChange('qr')}
          className={`min-h-[44px] py-2 px-1 text-center flex flex-col items-center justify-center gap-0.5 text-xs transition-colors cursor-pointer ${
            currentTab === 'qr'
              ? 'text-[#104F38] font-bold bg-[#F0F7F3] border-b-2 border-[#104F38]'
              : 'text-[#104F38]/70 hover:text-[#104F38]'
          }`}
        >
          <div className="flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" />
            <span className="truncate">QRIS ({activeCount})</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange('nfc')}
          className={`min-h-[44px] py-2 px-1 text-center flex flex-col items-center justify-center gap-0.5 text-xs transition-colors cursor-pointer ${
            currentTab === 'nfc'
              ? 'text-[#104F38] font-bold bg-[#F0F7F3] border-b-2 border-[#104F38]'
              : 'text-[#104F38]/70 hover:text-[#104F38]'
          }`}
        >
          <div className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" />
            <span className="truncate">NFC ({nfcCount})</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange('stand-design')}
          className={`min-h-[44px] py-2 px-1 text-center flex flex-col items-center justify-center gap-0.5 text-xs transition-colors cursor-pointer ${
            currentTab === 'stand-design'
              ? 'text-[#104F38] font-bold bg-[#F0F7F3] border-b-2 border-[#104F38]'
              : 'text-[#104F38]/70 hover:text-[#104F38]'
          }`}
        >
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#104F38]" />
            <span className="truncate">Stand Review</span>
          </div>
        </button>
      </div>
    </header>
  );
};
