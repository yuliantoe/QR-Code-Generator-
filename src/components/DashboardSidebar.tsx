import React, { useEffect } from 'react';
import {
  Home,
  QrCode,
  Radio,
  Layers,
  Plus,
  KeyRound,
  UserPlus,
  LogOut,
  User,
  X,
  CopyPlus,
  CloudUpload
} from 'lucide-react';
import type { AuthUser } from '../types.ts';

export type AppTab = 'landing' | 'qr' | 'nfc' | 'stand-design' | 'backup-restore';

interface DashboardSidebarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  qrCount: number;
  nfcCount: number;
  onOpenCreateSingle: () => void;
  onOpenCreateBatch: (count: number) => void;
  onOpenActivateNFCModal: () => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onOpenChangeCredentials: () => void;
  onOpenAddUser: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentTab,
  onTabChange,
  qrCount,
  nfcCount,
  onOpenCreateSingle,
  onOpenCreateBatch,
  onOpenActivateNFCModal,
  currentUser,
  onLogout,
  onOpenChangeCredentials,
  onOpenAddUser,
  isMobileOpen,
  onCloseMobile
}) => {
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const handleSelectTab = (tab: AppTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const handleAction = (fn: () => void) => {
    onCloseMobile();
    fn();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#104F38]/15 text-[#104F38] select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-[#104F38]/15 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => handleSelectTab('landing')}
          className="flex items-center gap-2.5 text-left cursor-pointer group min-w-0"
          title="Kembali ke Landing Page Utama"
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
          <span className="text-base font-extrabold tracking-tight text-[#104F38] whitespace-nowrap truncate">
            Projecttapp
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup panel menu"
          className="lg:hidden p-2 text-[#104F38]/70 hover:text-[#104F38] hover:bg-[#F4FAF6] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Menu Groups */}
      <nav aria-label="Menu Dashboard Utama" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Back to Landing Page */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleSelectTab('landing')}
            className="w-full min-h-[40px] px-3 py-2 text-xs font-semibold text-[#104F38]/80 hover:text-[#104F38] hover:bg-[#F4FAF6] border border-[#104F38]/15 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#104F38]/70 shrink-0" />
            <span className="truncate whitespace-nowrap">Landing Page Utama</span>
          </button>
        </div>

        {/* Workspace Views */}
        <div className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold text-[#104F38]/55 tracking-wide">
            Menu Dashboard
          </div>

          <button
            type="button"
            onClick={() => handleSelectTab('qr')}
            className={`w-full min-h-[42px] px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
              currentTab === 'qr'
                ? 'bg-[#104F38] text-white border-[#104F38] font-bold'
                : 'bg-white text-[#104F38]/85 border-transparent hover:bg-[#F4FAF6] hover:text-[#104F38] font-semibold'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <QrCode className={`w-4 h-4 shrink-0 ${currentTab === 'qr' ? 'text-[#FFE600]' : 'text-[#104F38]/70'}`} />
              <span className="truncate whitespace-nowrap">Daftar QR Dinamis</span>
            </span>
            <span
              className={`font-mono tabular-nums text-[11px] shrink-0 ${
                currentTab === 'qr' ? 'text-[#FFE600] font-bold' : 'text-[#104F38]/60'
              }`}
            >
              {qrCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('nfc')}
            className={`w-full min-h-[42px] px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
              currentTab === 'nfc'
                ? 'bg-[#104F38] text-white border-[#104F38] font-bold'
                : 'bg-white text-[#104F38]/85 border-transparent hover:bg-[#F4FAF6] hover:text-[#104F38] font-semibold'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Radio className={`w-4 h-4 shrink-0 ${currentTab === 'nfc' ? 'text-[#FFE600]' : 'text-[#104F38]/70'}`} />
              <span className="truncate whitespace-nowrap">Aktivasi &amp; Tag NFC</span>
            </span>
            <span
              className={`font-mono tabular-nums text-[11px] shrink-0 ${
                currentTab === 'nfc' ? 'text-[#FFE600] font-bold' : 'text-[#104F38]/60'
              }`}
            >
              {nfcCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('stand-design')}
            className={`w-full min-h-[42px] px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
              currentTab === 'stand-design'
                ? 'bg-[#104F38] text-white border-[#104F38] font-bold'
                : 'bg-white text-[#104F38]/85 border-transparent hover:bg-[#F4FAF6] hover:text-[#104F38] font-semibold'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Layers className={`w-4 h-4 shrink-0 ${currentTab === 'stand-design' ? 'text-[#FFE600]' : 'text-[#104F38]/70'}`} />
              <span className="truncate whitespace-nowrap">Desain Stand A6</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('backup-restore')}
            className={`w-full min-h-[42px] px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
              currentTab === 'backup-restore'
                ? 'bg-[#104F38] text-white border-[#104F38] font-bold'
                : 'bg-white text-[#104F38]/85 border-transparent hover:bg-[#F4FAF6] hover:text-[#104F38] font-semibold'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <CloudUpload className={`w-4 h-4 shrink-0 ${currentTab === 'backup-restore' ? 'text-[#FFE600]' : 'text-[#104F38]/70'}`} />
              <span className="truncate whitespace-nowrap">Backup &amp; Restore Drive</span>
            </span>
          </button>
        </div>

        {/* Quick Create Actions */}
        <div className="space-y-1.5 pt-3 border-t border-[#104F38]/10">
          <div className="px-3 text-[11px] font-bold text-[#104F38]/55 tracking-wide">
            Buat &amp; Aktivasi Cepat
          </div>

          <button
            type="button"
            onClick={() => handleAction(onOpenCreateSingle)}
            className="w-full min-h-[40px] px-3 py-2 text-xs font-bold bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate whitespace-nowrap">Buat QR Baru</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(() => onOpenCreateBatch(5))}
            className="w-full min-h-[40px] px-3 py-2 text-xs font-semibold text-[#104F38]/85 hover:text-[#104F38] hover:bg-[#F4FAF6] border border-transparent flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <CopyPlus className="w-4 h-4 text-[#104F38]/70 shrink-0" />
            <span className="truncate whitespace-nowrap">Buat QR Massal</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onOpenActivateNFCModal)}
            className="w-full min-h-[40px] px-3 py-2 text-xs font-semibold text-[#104F38]/85 hover:text-[#104F38] hover:bg-[#F4FAF6] border border-transparent flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Radio className="w-4 h-4 text-[#104F38]/70 shrink-0" />
            <span className="truncate whitespace-nowrap">Aktivasi Tag NFC</span>
          </button>
        </div>

        {/* Account & Admin Management */}
        <div className="space-y-1.5 pt-3 border-t border-[#104F38]/10">
          <div className="px-3 text-[11px] font-bold text-[#104F38]/55 tracking-wide">
            Akun &amp; Pengaturan
          </div>

          {currentUser.username.toLowerCase() === 'admin' && (
            <button
              type="button"
              onClick={() => handleAction(onOpenAddUser)}
              className="w-full min-h-[40px] px-3 py-2 text-xs font-semibold text-[#104F38]/85 hover:text-[#104F38] hover:bg-[#F4FAF6] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#104F38]/70 shrink-0" />
              <span className="truncate whitespace-nowrap">Tambah User Baru</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleAction(onOpenChangeCredentials)}
            className="w-full min-h-[40px] px-3 py-2 text-xs font-semibold text-[#104F38]/85 hover:text-[#104F38] hover:bg-[#F4FAF6] flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#104F38]/70 shrink-0" />
            <span className="truncate whitespace-nowrap">
              {currentUser.username.toLowerCase() === 'admin' ? 'Ganti Password' : 'Ganti Akun'}
            </span>
          </button>
        </div>
      </nav>

      {/* Bottom User & Logout Bar */}
      <div className="p-3 border-t border-[#104F38]/15 bg-[#F8FAF9] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-[#104F38] text-[#FFE600] flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#104F38] truncate">
              {currentUser.name || currentUser.username}
            </div>
            <div className="text-[11px] font-mono text-[#104F38]/65 truncate">
              @{currentUser.username}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAction(onLogout)}
          className="p-2 text-[#104F38]/70 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          title={`Keluar (${currentUser.username})`}
          aria-label={`Keluar (${currentUser.username})`}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Left Panel */}
      <aside
        aria-label="Panel Navigasi Dashboard"
        className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen z-30"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0a2318]/65 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            aria-label="Panel Navigasi Dashboard Mobile"
            className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
