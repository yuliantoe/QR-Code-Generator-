import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { QRCard } from './components/QRCard.tsx';
import { EditLinkModal } from './components/EditLinkModal.tsx';
import { CreateQRModal } from './components/CreateQRModal.tsx';
import { AnalyticsModal } from './components/AnalyticsModal.tsx';
import { LoginView } from './components/LoginView.tsx';
import { NFCTagsView } from './components/NFCTagsView.tsx';
import { ActivateNFCModal } from './components/ActivateNFCModal.tsx';
import { EditNFCLinkModal } from './components/EditNFCLinkModal.tsx';
import { StandDesignView } from './components/StandDesignView.tsx';
import { ChangeCredentialsModal } from './components/ChangeCredentialsModal.tsx';
import { DeleteQRConfirmModal } from './components/DeleteQRConfirmModal.tsx';
import { SubscriptionModal } from './components/SubscriptionModal.tsx';
import { Search, Plus, Radio, LayoutList, Minimize2, SlidersHorizontal, ArrowRight, Sparkles, Crown } from 'lucide-react';
import type { DynamicQRCode, AuthUser, NFCTag } from './types.ts';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('dinamis_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('dinamis_auth_token') || null;
  });

  const [isChangeCredentialsOpen, setIsChangeCredentialsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  // Navigation tab state ('qr' | 'nfc' | 'stand-design')
  const [currentTab, setCurrentTab] = useState<'qr' | 'nfc' | 'stand-design'>('qr');
  const [standDesignInitialId, setStandDesignInitialId] = useState<string | undefined>(undefined);

  // QR Codes State with local storage cache persistence
  const [qrcodes, setQrcodes] = useState<DynamicQRCode[]>(() => {
    try {
      const saved = localStorage.getItem('dinamis_qrcodes_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [loadingQRs, setLoadingQRs] = useState(true);

  // View density mode for Daftar QRIS / QR ('normal' | 'compact')
  const [viewMode, setViewMode] = useState<'normal' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('dinamis_qr_view_mode');
      return saved === 'compact' ? 'compact' : 'normal';
    } catch {
      return 'normal';
    }
  });

  const handleSetViewMode = (mode: 'normal' | 'compact') => {
    setViewMode(mode);
    try {
      localStorage.setItem('dinamis_qr_view_mode', mode);
    } catch {}
  };

  // NFC Tags State with local storage cache persistence
  const [nfcTags, setNfcTags] = useState<NFCTag[]>(() => {
    try {
      const saved = localStorage.getItem('dinamis_nfc_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [loadingNFC, setLoadingNFC] = useState(true);

  // Search & Filters for QR
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Modals state
  const [editingQR, setEditingQR] = useState<DynamicQRCode | null>(null);
  const [analyticsQR, setAnalyticsQR] = useState<DynamicQRCode | null>(null);
  const [qrToDelete, setQrToDelete] = useState<DynamicQRCode | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createBatchMode, setCreateBatchMode] = useState(false);
  const [createBatchCount, setCreateBatchCount] = useState(5);

  const handleOpenCreateSingle = () => {
    setCreateBatchMode(false);
    setCreateBatchCount(5);
    setIsCreateOpen(true);
  };

  const handleOpenCreateBatch = (count: number = 5) => {
    setCreateBatchMode(true);
    setCreateBatchCount(count);
    setIsCreateOpen(true);
  };

  // NFC Modals state
  const [isActivateNFCOpen, setIsActivateNFCOpen] = useState(false);
  const [editingNFCTag, setEditingNFCTag] = useState<NFCTag | null>(null);

  // Instant client-side redirect fallback if phone visits /r/:slug or /nfc/:id and SPA index.html is served
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;

    if (pathname.startsWith('/r/')) {
      const pathSlug = pathname.replace(/^\/r\//, '').split('/')[0].split('?')[0].toLowerCase().trim();
      if (pathSlug) {
        // 1. Try local cache
        try {
          const cached = localStorage.getItem('dinamis_qrcodes_cache');
          if (cached) {
            const list = JSON.parse(cached);
            const found = list.find((q: any) => q.slug?.toLowerCase() === pathSlug);
            if (found?.targetUrl) {
              window.location.replace(found.targetUrl);
              return;
            }
          }
        } catch {}

        // 2. Try API endpoint
        fetch(`/api/qrcodes/slug/${pathSlug}`)
          .then(res => res.json())
          .then(json => {
            if (json.success && json.data?.targetUrl) {
              window.location.replace(json.data.targetUrl);
            } else {
              // 3. Fallback to direct cloud sync object
              return fetch('https://api.restful-api.dev/objects/ff808181a09d98f701a1b392719d5825')
                .then(r => r.json())
                .then(obj => {
                  if (obj?.data?.[pathSlug]) {
                    window.location.replace(obj.data[pathSlug]);
                  }
                });
            }
          })
          .catch(() => {
            fetch('https://api.restful-api.dev/objects/ff808181a09d98f701a1b392719d5825')
              .then(r => r.json())
              .then(obj => {
                if (obj?.data?.[pathSlug]) {
                  window.location.replace(obj.data[pathSlug]);
                }
              })
              .catch(() => {});
          });
      }
    } else if (pathname.startsWith('/nfc/') || pathname.startsWith('/n/')) {
      const nfcId = pathname.replace(/^\/(nfc|n)\//, '').split('/')[0].split('?')[0].trim();
      if (nfcId) {
        fetch(`/api/nfc/${nfcId}/test-tap`, { method: 'POST' })
          .then(res => res.json())
          .then(json => {
            if (json.success && json.targetUrl) {
              window.location.replace(json.targetUrl);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (currentUser && authToken) {
      fetchQRCodes();
      fetchNFCTags();
    }
  }, [currentUser, authToken]);

  const syncQRToServer = async (qr: DynamicQRCode) => {
    try {
      await fetch(`/api/qrcodes/${qr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: qr.targetUrl,
          title: qr.title,
          status: qr.status,
          style: qr.style,
          qrData: qr
        })
      });
    } catch {}
  };

  const fetchQRCodes = async () => {
    try {
      const res = await fetch('/api/qrcodes');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setQrcodes(prev => {
            const localMap = new Map(prev.map(q => [q.id, q]));
            const mergedMap = new Map<string, DynamicQRCode>();

            // 1. Add all existing local cached items first
            for (const local of prev) {
              mergedMap.set(local.id, local);
            }

            // 2. Process server items: only replace if server item is genuinely newer
            for (const serverItem of json.data) {
              const local = localMap.get(serverItem.id);
              if (!local) {
                mergedMap.set(serverItem.id, serverItem);
              } else {
                const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
                const serverTime = new Date(serverItem.updatedAt || serverItem.createdAt || 0).getTime();
                if (serverTime > localTime) {
                  mergedMap.set(serverItem.id, serverItem);
                } else if (localTime > serverTime) {
                  // Local edit is newer! Retain local and sync to serverless instance
                  mergedMap.set(serverItem.id, local);
                  syncQRToServer(local);
                }
              }
            }

            const merged = Array.from(mergedMap.values());
            try {
              localStorage.setItem('dinamis_qrcodes_cache', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Gagal memuat QR dari server, menggunakan cache lokal:', err);
    } finally {
      setLoadingQRs(false);
    }
  };

  const fetchNFCTags = async () => {
    try {
      const res = await fetch('/api/nfc');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNfcTags(prev => {
            const serverMap = new Map(json.data.map((t: NFCTag) => [t.id, t]));
            const merged = [...json.data];
            for (const localItem of prev) {
              if (!serverMap.has(localItem.id)) {
                merged.push(localItem);
              }
            }
            try {
              localStorage.setItem('dinamis_nfc_cache', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Gagal memuat NFC dari server, menggunakan cache lokal:', err);
    } finally {
      setLoadingNFC(false);
    }
  };

  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn(e);
    }
    localStorage.removeItem('dinamis_auth_token');
    localStorage.removeItem('dinamis_auth_user');
    setCurrentUser(null);
    setAuthToken(null);
  };

  // QR Handlers with immediate LocalStorage sync
  const handleUpdateQR = (updated: DynamicQRCode) => {
    setQrcodes(prev => {
      const next = prev.map(item => item.id === updated.id ? updated : item);
      try { localStorage.setItem('dinamis_qrcodes_cache', JSON.stringify(next)); } catch {}
      return next;
    });
    if (analyticsQR?.id === updated.id) {
      setAnalyticsQR(updated);
    }
  };

  const handleCreatedQR = (newQR: DynamicQRCode) => {
    setQrcodes(prev => {
      const next = [newQR, ...prev];
      try { localStorage.setItem('dinamis_qrcodes_cache', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleCreatedBatch = (batchQRs: DynamicQRCode[]) => {
    setQrcodes(prev => {
      const next = [...batchQRs, ...prev];
      try { localStorage.setItem('dinamis_qrcodes_cache', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleToggleStatus = async (qr: DynamicQRCode) => {
    const nextStatus = qr.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/qrcodes/${qr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (json.success && json.data) {
        handleUpdateQR(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQR = (qr: DynamicQRCode) => {
    setQrToDelete(qr);
  };

  const handleConfirmDelete = async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/qrcodes/${id}`, { method: 'DELETE' }).catch(() => {});
      setQrcodes(prev => {
        const next = prev.filter(q => q.id !== id);
        try { localStorage.setItem('dinamis_qrcodes_cache', JSON.stringify(next)); } catch {}
        return next;
      });
      if (analyticsQR?.id === id) setAnalyticsQR(null);
      if (editingQR?.id === id) setEditingQR(null);
      setQrToDelete(null);
      return true;
    } catch (e) {
      console.error('Gagal menghapus QR:', e);
      return false;
    }
  };

  // NFC Handlers
  const handleActivatedNFC = (newTag: NFCTag) => {
    setNfcTags(prev => {
      const next = [newTag, ...prev];
      try { localStorage.setItem('dinamis_nfc_cache', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleUpdatedNFCTag = (updated: NFCTag) => {
    setNfcTags(prev => {
      const next = prev.map(t => t.id === updated.id ? updated : t);
      try { localStorage.setItem('dinamis_nfc_cache', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleDeleteNFCTag = async (id: string, pin: string): Promise<boolean> => {
    try {
      await fetch(`/api/nfc/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      }).catch(() => {});
      setNfcTags(prev => {
        const next = prev.filter(t => t.id !== id);
        try { localStorage.setItem('dinamis_nfc_cache', JSON.stringify(next)); } catch {}
        return next;
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleTestNFCTap = async (id: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/nfc/${id}/test-tap`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.targetUrl) {
        setNfcTags(prev => prev.map(t => t.id === id ? { ...t, totalTaps: json.totalTaps, lastTappedAt: new Date().toISOString() } : t));
        return json.targetUrl;
      }
    } catch (err) {
      console.warn(err);
    }
    return null;
  };

  // If user opened a physical QR redirect (/r/:slug) or NFC (/nfc/:id), show redirect screen immediately without prompting login
  const isRedirectPath = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/r/') ||
    window.location.pathname.startsWith('/nfc/') ||
    window.location.pathname.startsWith('/n/')
  );

  if (isRedirectPath) {
    return (
      <div className="min-h-screen bg-[#F4FAF6] flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="bg-white p-8 border border-[#104F38]/20 max-w-sm w-full shadow-lg space-y-4">
          <div className="w-12 h-12 border-4 border-[#104F38] border-t-[#FFE600] rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-[#104F38]">Mengarahkan ke Tautan Tujuan...</h2>
          <p className="text-xs text-[#104F38]/70">Mohon tunggu sebentar, Anda sedang dialihkan secara otomatis.</p>
        </div>
      </div>
    );
  }

  // If not logged in, render dedicated secure Login Screen
  if (!currentUser || !authToken) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Filtered QR Codes
  const filteredQRCodes = qrcodes.filter(qr => {
    const matchesSearch =
      qr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (qr.code && qr.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      qr.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.targetUrl.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : qr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isWatermarkActive = Boolean(currentUser?.isWatermarkActive ?? (currentUser?.plan === 'trial'));

  return (
    <div className="min-h-screen bg-white text-[#104F38] flex flex-col font-sans">
      
      {/* 3-Zone Top Navigation with Tabs */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenActivateNFCModal={() => setIsActivateNFCOpen(true)}
        activeCount={qrcodes.length}
        nfcCount={nfcTags.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangeCredentials={() => setIsChangeCredentialsOpen(true)}
        onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
      />

      {/* Trial Watermark Notification Bar */}
      {currentUser.plan === 'trial' && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white px-4 py-2 text-xs font-bold shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="bg-black/30 text-[#FFE600] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                TRIAL 3 HARI
              </span>
              <span>
                Akun Anda dalam masa uji coba 3 hari. Desain QR & Stand Meja saat ini ber-watermark.
              </span>
            </div>
            <button
              onClick={() => setIsSubscriptionOpen(true)}
              className="px-3 py-1 bg-white text-[#104F38] hover:bg-[#FFE600] font-black text-xs shrink-0 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-[#104F38]" />
              <span>Hapus Watermark (Pilih Paket)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
        
        {/* VIEW 1: QR CODE DASHBOARD */}
        {currentTab === 'qr' && (
          <div className="space-y-16">
            
            {/* HERO SECTION: Exactly matching image_210c7505 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2 pb-6">
              
              {/* Left Column: Heading + Blush Pink Circle + Wireframe Bracket CTA */}
              <div className="lg:col-span-7 space-y-6 relative">
                
                {/* Soft Blush Pink Circular Blob (matching the pink circle in the image) */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#FCD5CE] absolute -top-4 sm:-top-8 left-40 sm:left-56 -z-10 opacity-90 pointer-events-none" />

                {/* 2-Line Bold Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#104F38] leading-[1.08]">
                  Keunggulan<br />
                  QR Dinamis & NFC
                </h1>

                {/* Subtitle description in Indonesian */}
                <p className="text-sm sm:text-base text-[#104F38]/80 max-w-xl leading-relaxed font-medium">
                  Kami menciptakan QR Code dinamis dan stand akrilik NFC Google Review berkualitas tinggi yang membantu mencapai target bisnis Anda serta meningkatkan kepercayaan pelanggan tanpa repot cetak ulang.
                </p>

                {/* Architectural Wireframe Bracket framing the Action Buttons */}
                <div className="pt-2 relative">
                  
                  {/* Decorative Wireframe Bracket Line */}
                  <div className="hidden sm:block absolute -left-3 top-2 bottom-3 w-8 border-l-2 border-b-2 border-[#104F38]/30 pointer-events-none" />

                  <div className="space-y-2.5 w-full pl-0 sm:pl-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                      
                      {/* Canary Yellow Button */}
                      <button
                        onClick={handleOpenCreateSingle}
                        className="w-full sm:w-auto justify-center px-4 sm:px-6 py-3 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs sm:text-sm font-bold tracking-tight rounded-none border border-[#104F38]/30 transition-all flex items-center gap-2 cursor-pointer shadow-xs active:translate-y-0.5"
                      >
                        <Plus className="w-4 h-4 text-[#104F38] shrink-0" />
                        <span>Buat QR Baru (Tunggal & Batch)</span>
                      </button>

                      {/* Forest Green Button */}
                      <button
                        onClick={() => setIsActivateNFCOpen(true)}
                        className="w-full sm:w-auto justify-center px-4 sm:px-6 py-3 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs sm:text-sm font-semibold tracking-tight rounded-none transition-all flex items-center gap-2 cursor-pointer shadow-xs active:translate-y-0.5"
                      >
                        <Radio className="w-4 h-4 text-[#FFE600] shrink-0" />
                        <span>Aktivasi NFC Review</span>
                      </button>

                      {/* Blue Stand Akrilik Design Button */}
                      <button
                        onClick={() => setCurrentTab('stand-design')}
                        className="w-full sm:w-auto justify-center px-4 sm:px-6 py-3 bg-[#0038CB] hover:bg-[#032ea0] text-white text-xs sm:text-sm font-bold tracking-tight rounded-none transition-all flex items-center gap-2 cursor-pointer shadow-xs active:translate-y-0.5"
                      >
                        <Sparkles className="w-4 h-4 text-[#FFE600] shrink-0" />
                        <span>Desain Stand Meja A6 (9 Desain)</span>
                      </button>

                    </div>

                    {/* Quick Batch Generate Shortcut Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#104F38]">
                      <span className="text-[11px] font-bold text-[#104F38]/70">Pintas Buat Sekaligus:</span>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateBatch(5)}
                        className="px-2.5 py-1 bg-white hover:bg-[#FFE600] text-[#104F38] border border-[#104F38]/20 font-bold text-[11px] rounded-none transition-all cursor-pointer shadow-2xs hover:border-[#104F38]"
                      >
                        ⚡ 5 QR Sekaligus
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateBatch(10)}
                        className="px-2.5 py-1 bg-white hover:bg-[#FFE600] text-[#104F38] border border-[#104F38]/20 font-bold text-[11px] rounded-none transition-all cursor-pointer shadow-2xs hover:border-[#104F38]"
                      >
                        ⚡ 10 QR Sekaligus
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateBatch(15)}
                        className="px-2.5 py-1 bg-white hover:bg-[#FFE600] text-[#104F38] border border-[#104F38]/20 font-bold text-[11px] rounded-none transition-all cursor-pointer shadow-2xs hover:border-[#104F38]"
                      >
                        ⚡ 15 QR Sekaligus
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Whimsical Stacked Window Illustration Themed for QR & NFC Google Review */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end mt-4 lg:mt-0">
                <div className="w-full max-w-sm sm:max-w-md bg-white rounded-none p-2 sm:p-4 relative">
                  
                  {/* Whimsical SVG Character in Stacked Windows featuring QR, NFC & Google Review Stand */}
                  <svg className="w-full h-auto max-h-[260px] sm:max-h-[340px] md:max-h-[380px]" viewBox="0 0 380 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                    
                    {/* Background Soft Blobs */}
                    <ellipse cx="270" cy="300" rx="42" ry="14" fill="#FCD5CE" opacity="0.8" />
                    <ellipse cx="120" cy="315" rx="35" ry="10" fill="#EAF5F0" />

                    {/* Window 1: Top Right Window - Google Review Acrylic Stand with 5 Stars */}
                    <rect x="210" y="55" width="125" height="88" rx="6" stroke="#2D8A68" strokeWidth="2.5" fill="#FFFFFF" />
                    <line x1="210" y1="76" x2="335" y2="76" stroke="#2D8A68" strokeWidth="1.5" />
                    <circle cx="220" cy="66" r="3" fill="#EA4335" />
                    <circle cx="230" cy="66" r="3" fill="#FBBC05" />
                    <circle cx="240" cy="66" r="3" fill="#34A853" />
                    <text x="252" y="70" fill="#104F38" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Google Review</text>
                    
                    {/* Stand Header: Google G Icon + 5 Stars */}
                    <circle cx="232" cy="95" r="9" fill="#FFFFFF" stroke="#4285F4" strokeWidth="2" />
                    <text x="228" y="99" fill="#4285F4" fontSize="11" fontWeight="900" fontFamily="sans-serif">G</text>
                    {/* 5 Yellow Stars */}
                    <path d="M248 93 L250 88 L252 93 L257 93 L253 96 L255 101 L250 98 L246 101 L248 96 L244 93 Z" fill="#FFE600" />
                    <path d="M260 93 L262 88 L264 93 L269 93 L265 96 L267 101 L262 98 L258 101 L260 96 L256 93 Z" fill="#FFE600" />
                    <path d="M272 93 L274 88 L276 93 L281 93 L277 96 L279 101 L274 98 L270 101 L272 96 L268 93 Z" fill="#FFE600" />
                    <path d="M284 93 L286 88 L288 93 L293 93 L289 96 L291 101 L286 98 L282 101 L284 96 L280 93 Z" fill="#FFE600" />
                    <path d="M296 93 L298 88 L300 93 L305 93 L301 96 L303 101 L298 98 L294 101 L296 96 L292 93 Z" fill="#FFE600" />
                    
                    {/* Mini Stand badge */}
                    <rect x="225" y="112" width="95" height="18" rx="3" fill="#EAF5F0" stroke="#2D8A68" strokeWidth="1" />
                    <text x="235" y="125" fill="#104F38" fontSize="8" fontWeight="bold">STAND AKRILIK MEJA</text>

                    {/* Window 2: Middle Window with Smartphone & NFC Waves */}
                    <rect x="175" y="135" width="125" height="85" rx="6" stroke="#2D8A68" strokeWidth="2.5" fill="#FFFFFF" />
                    <line x1="175" y1="155" x2="300" y2="155" stroke="#2D8A68" strokeWidth="1.5" />
                    <circle cx="186" cy="146" r="3" fill="#2D8A68" />
                    <circle cx="196" cy="146" r="3" fill="#2D8A68" />
                    <text x="210" y="149" fill="#104F38" fontSize="8" fontWeight="bold">NFC TAP SMARTPHONE</text>

                    {/* Smartphone outline with NFC wave */}
                    <rect x="190" y="163" width="30" height="48" rx="4" stroke="#104F38" strokeWidth="2" fill="#F4FAF6" />
                    <line x1="200" y1="166" x2="210" y2="166" stroke="#104F38" strokeWidth="1.5" strokeLinecap="round" />
                    {/* NFC wave symbols */}
                    <path d="M225 174 C229 179 229 187 225 192" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M231 170 C237 177 237 194 231 201" stroke="#FFE600" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M237 166 C245 175 245 199 237 208" stroke="#104F38" strokeWidth="2.5" strokeLinecap="round" />
                    <text x="248" y="186" fill="#104F38" fontSize="10" fontWeight="900" fontFamily="sans-serif">TAP!</text>
                    <text x="248" y="198" fill="#104F38" fontSize="7" fontWeight="bold" fontFamily="sans-serif">INSTAN</text>

                    {/* Window 3: Lower Window with Dynamic QR Matrix */}
                    <rect x="200" y="215" width="115" height="75" rx="6" stroke="#2D8A68" strokeWidth="2.5" fill="#FFFFFF" />
                    <line x1="200" y1="233" x2="315" y2="233" stroke="#2D8A68" strokeWidth="1.5" />
                    <text x="210" y="227" fill="#104F38" fontSize="7" fontWeight="bold">QR DINAMIS · KODE AUTO</text>
                    
                    {/* QR Code Matrix Corners */}
                    <rect x="212" y="240" width="18" height="18" rx="2" stroke="#104F38" strokeWidth="2" fill="#EAF2ED" />
                    <rect x="217" y="245" width="8" height="8" fill="#104F38" />
                    <rect x="242" y="240" width="18" height="18" rx="2" stroke="#104F38" strokeWidth="2" fill="#EAF2ED" />
                    <rect x="247" y="245" width="8" height="8" fill="#104F38" />
                    <rect x="212" y="264" width="18" height="18" rx="2" stroke="#104F38" strokeWidth="2" fill="#EAF2ED" />
                    <rect x="217" y="269" width="8" height="8" fill="#104F38" />
                    
                    {/* Live Data Dots */}
                    <circle cx="248" cy="270" r="3" fill="#104F38" />
                    <circle cx="258" cy="277" r="2.5" fill="#FFE600" />
                    <rect x="238" y="262" width="4" height="4" fill="#104F38" />
                    <rect x="254" y="264" width="4" height="4" fill="#B4B0FF" />
                    <rect x="268" y="242" width="40" height="16" rx="2" fill="#FFE600" stroke="#104F38" strokeWidth="1" />
                    <text x="272" y="253" fill="#104F38" fontSize="7" fontWeight="bold">QR-001</text>

                    {/* Whimsical Character with Lavender Legs stepping through the frames */}
                    {/* Torso & Head */}
                    <circle cx="205" cy="110" r="14" fill="#FFFFFF" stroke="#2D8A68" strokeWidth="2" />
                    <path d="M200 108 A2 2 0 0 1 204 108" stroke="#2D8A68" strokeWidth="2" strokeLinecap="round" />
                    <path d="M206 112 Q210 115 213 111" stroke="#2D8A68" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M195 102 Q205 90 215 102" stroke="#2D8A68" strokeWidth="2" fill="#104F38" />
                    <path d="M195 125 C195 125 205 120 218 126 L214 165 C214 165 200 165 196 160 Z" fill="#FFFFFF" stroke="#2D8A68" strokeWidth="2" />

                    {/* Bent Lavender Legs (Distinctive whimsical visual from the reference theme) */}
                    {/* Left Leg: stretching out towards the left */}
                    <path
                      d="M198 155 C180 162 160 175 135 200 C120 215 110 230 130 260 C145 282 165 275 180 260"
                      fill="none"
                      stroke="#B4B0FF"
                      strokeWidth="24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Foot Left with white boot */}
                    <path d="M115 220 L100 235 C95 240 98 248 106 248 L128 248 Z" fill="#FFFFFF" stroke="#2D8A68" strokeWidth="2" />

                    {/* Right Leg: stepping down to bottom right */}
                    <path
                      d="M212 155 C225 180 230 205 240 235 C246 255 248 275 250 295"
                      fill="none"
                      stroke="#B4B0FF"
                      strokeWidth="24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Foot Right in white boot */}
                    <path d="M245 292 L265 292 C272 292 274 300 268 306 L244 306 Z" fill="#FFFFFF" stroke="#2D8A68" strokeWidth="2" />

                    {/* Playful curly doodle line in canary yellow */}
                    <path d="M235 290 Q230 270 242 270 Q255 270 250 290" stroke="#FFE600" strokeWidth="2.5" fill="none" />

                  </svg>
                </div>
              </div>

            </div>

            {/* SECTION 2: "Mendampingi Setiap Langkah Bisnis Anda" (Mirroring image_733d79ea) */}
            <div className="pt-8 border-t border-[#104F38]/10 space-y-12">
              
              {/* Eyebrow with Architectural Wireframe Bracket + Main Section Title */}
              <div className="relative max-w-2xl mx-auto text-center space-y-2">
                
                {/* Architectural Bracket Line on Top-Left */}
                <div className="hidden sm:block absolute -left-12 -top-2 w-16 h-8 border-t-2 border-l-2 border-[#104F38]/30 pointer-events-none" />

                <p className="font-serif-italic text-sm sm:text-base text-[#104F38] tracking-normal">
                  Solusi Praktis Tanpa Perlu Cetak Ulang
                </p>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#104F38] tracking-tight leading-tight">
                  Mendampingi Setiap Langkah<br className="hidden sm:inline" /> Bisnis Anda
                </h2>

              </div>

              {/* 3 Step Columns with Hand-Drawn Style Doodle Illustrations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-center">
                
                {/* Column 1: QR Code Scanner & Goal Discovery */}
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-56 h-36 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Soft Pink & Yellow bubbles */}
                      <circle cx="45" cy="35" r="5" fill="#FCD5CE" />
                      <circle cx="58" cy="22" r="3" fill="#FFE600" />
                      <circle cx="170" cy="28" r="4" fill="#B4B0FF" />
                      
                      {/* QR Scanner Reticle & Code Matrix */}
                      <rect x="75" y="32" width="70" height="70" rx="8" stroke="#2D8A68" strokeWidth="2" fill="#FFFFFF" />
                      <path d="M70 45 L70 30 L85 30" stroke="#104F38" strokeWidth="3" strokeLinecap="round" />
                      <path d="M150 30 L165 30 L165 45" stroke="#104F38" strokeWidth="3" strokeLinecap="round" />
                      <path d="M70 89 L70 104 L85 104" stroke="#104F38" strokeWidth="3" strokeLinecap="round" />
                      <path d="M150 104 L165 104 L165 89" stroke="#104F38" strokeWidth="3" strokeLinecap="round" />
                      
                      {/* QR Inner Elements */}
                      <rect x="85" y="42" width="16" height="16" rx="2" stroke="#104F38" strokeWidth="2" fill="#FFE600" />
                      <rect x="90" y="47" width="6" height="6" fill="#104F38" />
                      
                      <rect x="119" y="42" width="16" height="16" rx="2" stroke="#104F38" strokeWidth="2" fill="#FFE600" />
                      <rect x="124" y="47" width="6" height="6" fill="#104F38" />
                      
                      <rect x="85" y="74" width="16" height="16" rx="2" stroke="#104F38" strokeWidth="2" fill="#FFE600" />
                      <rect x="90" y="79" width="6" height="6" fill="#104F38" />
                      
                      {/* Laser / Scanner Line in Lavender */}
                      <line x1="72" y1="67" x2="148" y2="67" stroke="#B4B0FF" strokeWidth="2.5" strokeDasharray="4 2" />
                      
                      {/* Mint Green Dotted Baseline */}
                      <line x1="30" y1="112" x2="190" y2="112" stroke="#2D8A68" strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#104F38] tracking-tight">
                    Analisis Target & Kebutuhan Usaha
                  </h3>
                  <p className="text-xs sm:text-sm text-[#104F38]/75 leading-relaxed max-w-xs">
                    Pahami alur kunjungan pelanggan Anda dan tentukan destinasi link terbaik—mulai dari ulasan Google Review, menu restoran, hingga tautan promosi.
                  </p>
                </div>

                {/* Column 2: Window with Smartphone NFC Wave (Bringing dynamic routing to life) */}
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-56 h-36 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Browser Window Frame */}
                      <rect x="40" y="25" width="140" height="82" rx="6" stroke="#2D8A68" strokeWidth="2" fill="#FFFFFF" />
                      <line x1="40" y1="42" x2="180" y2="42" stroke="#2D8A68" strokeWidth="1.5" />
                      <circle cx="50" cy="34" r="2.5" fill="#EA4335" />
                      <circle cx="58" cy="34" r="2.5" fill="#FBBC05" />
                      <circle cx="66" cy="34" r="2.5" fill="#34A853" />

                      {/* Smartphone inside with NFC Waves */}
                      <rect x="62" y="49" width="32" height="48" rx="4" stroke="#104F38" strokeWidth="1.5" fill="#EAF5F0" />
                      <circle cx="78" cy="91" r="2" fill="#104F38" />
                      
                      {/* NFC Waves emitting from Phone */}
                      <path d="M102 62 C106 67 106 75 102 80" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
                      <path d="M108 58 C114 65 114 79 108 86" stroke="#FFE600" strokeWidth="2" strokeLinecap="round" />
                      <path d="M114 54 C122 63 122 83 114 92" stroke="#2D8A68" strokeWidth="2" strokeLinecap="round" />

                      {/* Dynamic Redirect Tag / Badge */}
                      <rect x="124" y="60" width="46" height="18" rx="3" fill="#B4B0FF" stroke="#104F38" strokeWidth="1" />
                      <text x="128" y="72" fill="#104F38" fontSize="7" fontWeight="bold">INSTAN</text>
                      
                      {/* Curly Yellow Doodle */}
                      <path d="M145 92 Q155 85 160 95" stroke="#FFE600" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#104F38] tracking-tight">
                    Rancang QR Dinamis & Chip NFC
                  </h3>
                  <p className="text-xs sm:text-sm text-[#104F38]/75 leading-relaxed max-w-xs">
                    Tautkan link fleksibel yang dapat dialihkan sewaktu-waktu kapan saja secara instan melalui dashboard tanpa perlu repot mencetak ulang barcode.
                  </p>
                </div>

                {/* Column 3: Tabletop Acrylic Stand & 5 Stars (Cetak Stand & Ulasan Bintang 5) */}
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-56 h-36 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Table Stand Base */}
                      <line x1="45" y1="105" x2="175" y2="105" stroke="#2D8A68" strokeWidth="2" />
                      
                      {/* Acrylic Stand Body */}
                      <rect x="75" y="32" width="70" height="72" rx="4" stroke="#2D8A68" strokeWidth="2" fill="#FFFFFF" />
                      {/* Header Blue Banner */}
                      <rect x="76" y="33" width="68" height="26" fill="#0038CB" />
                      
                      {/* Stand G Icon & 5 Stars */}
                      <circle cx="89" cy="46" r="6" fill="#FFFFFF" />
                      <text x="86.5" y="49" fill="#0038CB" fontSize="7" fontWeight="bold">G</text>
                      <text x="98" y="45" fill="#FFFFFF" fontSize="6" fontWeight="bold">Review</text>
                      
                      {/* 5 Tiny Yellow Stars */}
                      <path d="M99 52 L100 49 L101 52 L104 52 L101.5 54 L102.5 57 L100 55 L97.5 57 L98.5 54 L96 52 Z" fill="#FFE600" />
                      <path d="M106 52 L107 49 L108 52 L111 52 L108.5 54 L109.5 57 L107 55 L104.5 57 L105.5 54 L103 52 Z" fill="#FFE600" />
                      <path d="M113 52 L114 49 L115 52 L118 52 L115.5 54 L116.5 57 L114 55 L111.5 57 L112.5 54 L110 52 Z" fill="#FFE600" />
                      <path d="M120 52 L121 49 L122 52 L125 52 L122.5 54 L123.5 57 L121 55 L118.5 57 L119.5 54 L117 52 Z" fill="#FFE600" />
                      <path d="M127 52 L128 49 L129 52 L132 52 L129.5 54 L130.5 57 L128 55 L125.5 57 L126.5 54 L124 52 Z" fill="#FFE600" />
                      
                      {/* NFC Phone & Mini QR on Stand */}
                      <rect x="83" y="65" width="18" height="26" rx="2" stroke="#104F38" strokeWidth="1" fill="#F4FAF6" />
                      <text x="85" y="79" fill="#104F38" fontSize="5" fontWeight="bold">NFC</text>
                      
                      <rect x="108" y="65" width="26" height="26" rx="1" stroke="#104F38" strokeWidth="1" fill="#FFE600" />
                      <rect x="111" y="68" width="6" height="6" fill="#104F38" />
                      <rect x="125" y="68" width="6" height="6" fill="#104F38" />
                      <rect x="111" y="82" width="6" height="6" fill="#104F38" />

                      {/* Yellow Drafting Pencil beside stand */}
                      <path d="M152 75 L175 100 L168 103 L145 78 Z" fill="#FFE600" stroke="#2D8A68" strokeWidth="1.5" />
                      <polygon points="175,100 182,106 168,103" fill="#104F38" />
                    </svg>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#104F38] tracking-tight">
                    Cetak Stand & Raih Ulasan Bintang 5
                  </h3>
                  <p className="text-xs sm:text-sm text-[#104F38]/75 leading-relaxed max-w-xs">
                    Dapatkan file cetak siap pakai (Stand Segitiga, Kotak, L-Shape) dan aktifkan NFC tap di meja kasir untuk meroketkan reputasi bisnis Anda.
                  </p>
                </div>

              </div>

            </div>

            {/* FILTER, SEARCH & VIEW TOOLBAR */}
            <div className="pt-8 border-t border-[#104F38]/10 space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#104F38]/50 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari nama QR, kode [QR-001], slug /r/..., atau URL tujuan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#104F38]/20 rounded-none focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38] placeholder:text-[#104F38]/40 transition-colors shadow-2xs font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-[#104F38]/50 hover:text-[#104F38]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 justify-between md:justify-end">
                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-[#F4FAF6] rounded-none text-xs font-semibold text-[#104F38]/80 border border-[#104F38]/15">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer ${
                        statusFilter === 'all' ? 'bg-[#FFE600] text-[#104F38] shadow-2xs font-bold' : 'hover:text-[#104F38]'
                      }`}
                    >
                      Semua ({qrcodes.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer ${
                        statusFilter === 'active' ? 'bg-[#104F38] text-white shadow-2xs font-bold' : 'hover:text-[#104F38]'
                      }`}
                    >
                      Aktif ({qrcodes.filter(q => q.status === 'active').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('paused')}
                      className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer ${
                        statusFilter === 'paused' ? 'bg-[#FCD5CE] text-[#104F38] shadow-2xs font-bold' : 'hover:text-[#104F38]'
                      }`}
                    >
                      Dijeda ({qrcodes.filter(q => q.status === 'paused').length})
                    </button>
                  </div>

                  {/* Setelan View Detail (Normal vs Lebih Kecil) */}
                  <div className="flex items-center gap-1 p-1 bg-[#F4FAF6] rounded-none text-xs font-semibold text-[#104F38]/80 border border-[#104F38]/15">
                    <span className="text-[10px] font-bold text-[#104F38]/60 uppercase px-2 hidden sm:inline flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-[#104F38]/60" />
                      <span>View:</span>
                    </span>
                    <button
                      onClick={() => handleSetViewMode('normal')}
                      className={`px-2.5 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${
                        viewMode === 'normal'
                          ? 'bg-white text-[#104F38] shadow-2xs font-bold border border-[#104F38]/20'
                          : 'hover:text-[#104F38]'
                      }`}
                      title="Tampilan Detail Normal (Lengkap & Luas)"
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      <span>Normal</span>
                    </button>
                    <button
                      onClick={() => handleSetViewMode('compact')}
                      className={`px-2.5 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${
                        viewMode === 'compact'
                          ? 'bg-[#FFE600] text-[#104F38] shadow-2xs font-bold border border-[#104F38]/30'
                          : 'hover:text-[#104F38]'
                      }`}
                      title="Tampilan Detail Lebih Kecil (Kompak & Hemat Ruang)"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Detail Lebih Kecil</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Sub-header showing list info */}
              <div className="flex items-center justify-between text-xs px-1 text-[#104F38]/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#104F38] text-sm">Daftar QRIS & QR Dinamis</span>
                  <span className="bg-[#FFE600] text-[#104F38] px-2 py-0.5 font-mono text-[11px] font-extrabold border border-[#104F38]/20">
                    {filteredQRCodes.length}
                  </span>
                  {viewMode === 'compact' && (
                    <span className="bg-[#EAF2ED] text-[#104F38] font-semibold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-[#104F38]/15">
                      <Minimize2 className="w-2.5 h-2.5" /> View Lebih Kecil Aktif
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#104F38]/60">
                  Mode: <strong className="text-[#104F38]">{viewMode === 'compact' ? 'Detail Lebih Kecil' : 'Normal'}</strong>
                </div>
              </div>
            </div>

            {/* QR Code List */}
            {loadingQRs ? (
              <div className={viewMode === 'compact' ? 'space-y-1.5' : 'space-y-3'}>
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className={`bg-white rounded-none border border-[#104F38]/15 animate-pulse ${
                      viewMode === 'compact' ? 'h-12' : 'h-20'
                    }`}
                  />
                ))}
              </div>
            ) : filteredQRCodes.length > 0 ? (
              <div className={viewMode === 'compact' ? 'space-y-1.5' : 'space-y-3'}>
                {filteredQRCodes.map(qr => (
                  <QRCard
                    key={qr.id}
                    qr={qr}
                    viewMode={viewMode}
                    onOpenEditLink={(item) => setEditingQR(item)}
                    onOpenAnalytics={(item) => setAnalyticsQR(item)}
                    onOpenStandStudio={(item) => {
                      setStandDesignInitialId('qr-' + item.id);
                      setCurrentTab('stand-design');
                    }}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteQR}
                    isWatermarkActive={isWatermarkActive}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-none border border-[#104F38]/20 p-12 text-center space-y-4">
                <div className="w-14 h-14 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none flex items-center justify-center mx-auto text-[#104F38]">
                  <Search className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-[#104F38]">
                    Tidak ada QR Code yang cocok
                  </h3>
                  <p className="text-xs text-[#104F38]/70 mt-1">
                    {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Mulai buat QR Code dinamis pertama Anda sekarang.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs font-bold rounded-none border border-[#104F38]/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat QR Baru</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: NFC TAGS MANAGEMENT */}
        {currentTab === 'nfc' && (
          <NFCTagsView
            tags={nfcTags}
            onOpenActivateModal={() => setIsActivateNFCOpen(true)}
            onOpenEditModal={(tag) => setEditingNFCTag(tag)}
            onDeleteTag={handleDeleteNFCTag}
            onTestTap={handleTestNFCTap}
            onOpenStandStudio={(tag) => {
              setStandDesignInitialId('nfc-' + tag.id);
              setCurrentTab('stand-design');
            }}
            viewMode={viewMode}
            onViewModeChange={handleSetViewMode}
          />
        )}

        {/* VIEW 3: GOOGLE REVIEW STAND ACRYLIC DESIGN STUDIO */}
        {currentTab === 'stand-design' && (
          <StandDesignView
            qrcodes={qrcodes}
            nfcTags={nfcTags}
            initialSelectedId={standDesignInitialId}
            onOpenCreateQR={() => setIsCreateOpen(true)}
            onOpenActivateNFC={() => setIsActivateNFCOpen(true)}
            isWatermarkActive={isWatermarkActive}
            onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#104F38]/10 bg-white py-6 mt-16 text-xs text-[#104F38]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#104F38]">DinamisQR</span>
            <span aria-hidden="true">·</span>
            <span className="font-serif-italic">Keunggulan QR Dinamis & Stand NFC Google Review</span>
          </div>
          <div className="text-[11px] text-[#104F38]/70 flex items-center gap-2">
            <span>Masuk sebagai: <strong className="text-[#104F38]">{currentUser.username}</strong></span>
            <span>·</span>
            <button
              onClick={() => setIsChangeCredentialsOpen(true)}
              className="text-[#104F38] underline hover:text-black font-bold cursor-pointer"
            >
              Ganti Username & Password
            </button>
          </div>
        </div>
      </footer>

      {/* Hero Modal: Edit Destination URL */}
      {editingQR && (
        <EditLinkModal
          qr={editingQR}
          isOpen={!!editingQR}
          onClose={() => setEditingQR(null)}
          onUpdate={handleUpdateQR}
        />
      )}

      {/* Create Dynamic QR Modal (Supports Single & Batch 5, 10, 15) */}
      {isCreateOpen && (
        <CreateQRModal
          isOpen={isCreateOpen}
          existingCount={qrcodes.length}
          defaultBatchMode={createBatchMode}
          defaultBatchCount={createBatchCount}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleCreatedQR}
          onCreatedBatch={handleCreatedBatch}
        />
      )}

      {/* Analytics & Print Download Modal */}
      {analyticsQR && (
        <AnalyticsModal
          qr={analyticsQR}
          isOpen={!!analyticsQR}
          defaultCompact={viewMode === 'compact'}
          isWatermarkActive={isWatermarkActive}
          onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
          onClose={() => setAnalyticsQR(null)}
          onOpenEditLink={() => {
            const current = analyticsQR;
            setAnalyticsQR(null);
            setEditingQR(current);
          }}
          onOpenStandStudio={(qr) => {
            setAnalyticsQR(null);
            setStandDesignInitialId('qr-' + qr.id);
            setCurrentTab('stand-design');
          }}
        />
      )}

      {/* Activate NFC Tag Modal */}
      {isActivateNFCOpen && (
        <ActivateNFCModal
          isOpen={isActivateNFCOpen}
          onClose={() => setIsActivateNFCOpen(false)}
          onActivated={handleActivatedNFC}
        />
      )}

      {/* Edit NFC Tag with PIN Verification */}
      {editingNFCTag && (
        <EditNFCLinkModal
          tag={editingNFCTag}
          isOpen={!!editingNFCTag}
          onClose={() => setEditingNFCTag(null)}
          onUpdated={handleUpdatedNFCTag}
        />
      )}

      {/* Change Username & Password Modal */}
      {isChangeCredentialsOpen && currentUser && authToken && (
        <ChangeCredentialsModal
          isOpen={isChangeCredentialsOpen}
          onClose={() => setIsChangeCredentialsOpen(false)}
          currentUser={currentUser}
          authToken={authToken}
          onCredentialsUpdated={(updated) => setCurrentUser(updated)}
        />
      )}

      {/* Delete QR Code Confirmation Modal Popup */}
      {qrToDelete && (
        <DeleteQRConfirmModal
          isOpen={!!qrToDelete}
          qr={qrToDelete}
          onClose={() => setQrToDelete(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}

      {/* Subscription Plans Modal (Trial 3 Hari, Bulanan, Tahunan) */}
      {isSubscriptionOpen && currentUser && (
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          currentUser={currentUser}
          authToken={authToken}
          onPlanUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('dinamis_auth_user', JSON.stringify(updatedUser));
          }}
        />
      )}

    </div>
  );
}
