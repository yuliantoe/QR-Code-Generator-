import React from 'react';
import { Plus, Radio, User, LogOut, Layers, QrCode, KeyRound, UserPlus } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-white border-b border-[#104F38]/15">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Zone: Clean single-line identity */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => onTabChange('qr')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
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
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-semibold text-[#104F38]/70">
          <button
            onClick={() => onTabChange('qr')}
            className={`whitespace-nowrap shrink-0 cursor-pointer py-5 relative flex items-center gap-1.5 transition-colors ${
              currentTab === 'qr'
                ? 'text-[#104F38] font-bold'
                : 'hover:text-[#104F38]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Daftar QR (<span className="tabular-nums">{activeCount}</span>)</span>
            {currentTab === 'qr' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#104F38]" />
            )}
          </button>

          <button
            onClick={() => onTabChange('nfc')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer py-5 relative transition-colors ${
              currentTab === 'nfc'
                ? 'text-[#104F38] font-bold'
                : 'hover:text-[#104F38]'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>NFC Tag (<span className="tabular-nums">{nfcCount}</span>)</span>
            {currentTab === 'nfc' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#104F38]" />
            )}
          </button>

          <button
            onClick={() => onTabChange('stand-design')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer py-5 relative transition-colors ${
              currentTab === 'stand-design'
                ? 'text-[#104F38] font-bold'
                : 'hover:text-[#104F38]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Desain Stand</span>
            {currentTab === 'stand-design' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#104F38]" />
            )}
          </button>
        </nav>

        {/* Primary Action & Session Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentTab === 'nfc' ? (
            <button
              onClick={onOpenActivateNFCModal}
              className="px-3 sm:px-4 py-2 text-xs font-bold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/25 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aktivasi Tag</span>
            </button>
          ) : (
            <button
              onClick={onOpenCreateModal}
              className="px-3 sm:px-4 py-2 text-xs font-bold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/25 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat QR Baru</span>
            </button>
          )}

          {currentUser && onLogout && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-[#104F38]/15">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#104F38]/80 font-semibold px-1.5">
                <User className="w-3.5 h-3.5 text-[#104F38]/60" />
                <span className="max-w-[100px] truncate">{currentUser.username}</span>
              </div>
              {currentUser.username.toLowerCase() === 'admin' && onOpenAddUser && (
                <button
                  onClick={onOpenAddUser}
                  className="px-2.5 py-1.5 text-[#104F38] hover:bg-[#F4FAF6] border border-[#104F38]/20 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  title="Tambah User Baru (Menu Dashboard Administrator)"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#104F38]" />
                  <span className="hidden sm:inline">Tambah User</span>
                </button>
              )}
              {onOpenChangeCredentials && (
                <button
                  onClick={onOpenChangeCredentials}
                  className="px-2.5 py-1.5 text-[#104F38] hover:bg-[#F4FAF6] border border-[#104F38]/20 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  title="Ganti Password Akun (Username Admin Terkunci)"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#104F38]" />
                  <span className="hidden sm:inline">Ganti Akun</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 text-[#104F38]/70 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title={`Keluar (${currentUser.username})`}
                aria-label={`Keluar (${currentUser.username})`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Navigation Strip (Touch target >= 44px) */}
      <div className="md:hidden grid grid-cols-3 border-t border-[#104F38]/10 bg-[#F8FAF9]">
        <button
          onClick={() => onTabChange('qr')}
          className={`min-h-[44px] py-2 px-1 text-center flex items-center justify-center gap-1 text-xs transition-colors cursor-pointer ${
            currentTab === 'qr'
              ? 'text-[#104F38] font-bold bg-[#F0F7F3] border-b-2 border-[#104F38]'
              : 'text-[#104F38]/70 hover:text-[#104F38]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span className="truncate tabular-nums">QR ({activeCount})</span>
        </button>

        <button
          onClick={() => onTabChange('nfc')}
          className={`min-h-[44px] py-2 px-1 text-center flex items-center justify-center gap-1 text-xs transition-colors cursor-pointer ${
            currentTab === 'nfc'
              ? 'text-[#104F38] font-bold bg-[#F0F7F3] border-b-2 border-[#104F38]'
              : 'text-[#104F38]/70 hover:text-[#104F38]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="truncate tabular-nums">NFC ({nfcCount})</span>
        </button>

        <button
          onClick={() => onTabChange('stand-design')}
          className={`min-h-[44px] py-2 px-1 text-center flex items-center justify-center gap-1 text-xs transition-colors cursor-pointer ${
            currentTab === 'stand-design'
              ? 'text-[#104F38] font-bold bg-[#F0F7F3] border-b-2 border-[#104F38]'
              : 'text-[#104F38]/70 hover:text-[#104F38]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="truncate">Desain Stand</span>
        </button>
      </div>
    </header>
  );
};
