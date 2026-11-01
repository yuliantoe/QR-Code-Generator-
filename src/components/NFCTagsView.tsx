import React, { useState, useMemo } from 'react';
import {
  Radio,
  Plus,
  ExternalLink,
  Edit3,
  Trash2,
  Smartphone,
  Copy,
  Check,
  Lock,
  RefreshCw,
  AlertCircle,
  Search,
  LayoutList,
  Minimize2,
  Sparkles
} from 'lucide-react';
import type { NFCTag } from '../types.ts';

interface NFCTagsViewProps {
  tags: NFCTag[];
  onOpenActivateModal: () => void;
  onOpenEditModal: (tag: NFCTag) => void;
  onDeleteTag: (id: string, pin: string) => Promise<boolean>;
  onTestTap: (id: string) => Promise<string | null>;
  onOpenStandStudio?: (tag: NFCTag) => void;
  viewMode?: 'normal' | 'compact';
  onViewModeChange?: (mode: 'normal' | 'compact') => void;
}

export const NFCTagsView: React.FC<NFCTagsViewProps> = ({
  tags,
  onOpenActivateModal,
  onOpenEditModal,
  onDeleteTag,
  onTestTap,
  onOpenStandStudio,
  viewMode: propViewMode,
  onViewModeChange
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'normal' | 'compact'>('normal');
  const activeViewMode = propViewMode ?? internalViewMode;

  const handleSetViewMode = (mode: 'normal' | 'compact') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [tapSuccessMessage, setTapSuccessMessage] = useState<string | null>(null);
  const [writePayloadModalTag, setWritePayloadModalTag] = useState<NFCTag | null>(null);
  const [nfcWriteStatus, setNfcWriteStatus] = useState<'idle' | 'writing' | 'success' | 'unsupported'>('idle');
  const [nfcWriteLog, setNfcWriteLog] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      if (statusFilter === 'active' && tag.status !== 'active') return false;
      if (statusFilter === 'locked' && tag.status !== 'locked') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchPlace = tag.placeName.toLowerCase().includes(query);
        const matchId = tag.id.toLowerCase().includes(query);
        const matchUid = tag.tagUid.toLowerCase().includes(query);
        const matchUrl = tag.googleReviewUrl.toLowerCase().includes(query);
        const matchNotes = (tag.notes || '').toLowerCase().includes(query);
        return matchPlace || matchId || matchUid || matchUrl || matchNotes;
      }

      return true;
    });
  }, [tags, statusFilter, searchQuery]);

  const activeCount = useMemo(() => tags.filter(t => t.status === 'active').length, [tags]);
  const lockedCount = useMemo(() => tags.filter(t => t.status === 'locked').length, [tags]);

  const handleCopyLink = (id: string) => {
    const url = `${origin}/nfc/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateTap = async (tag: NFCTag) => {
    setTestingId(tag.id);
    setTapSuccessMessage(null);
    try {
      const targetUrl = await onTestTap(tag.id);
      if (targetUrl) {
        setTapSuccessMessage(`Sukses! Smartphone pemindai mendeteksi NFC "${tag.placeName}" dan dialihkan ke: ${targetUrl}`);
        setTimeout(() => setTapSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteWithPin = async (tag: NFCTag) => {
    const enteredPin = prompt(`Masukkan PIN NFC Tag untuk menghapus "${tag.placeName}":`);
    if (!enteredPin) return;

    const ok = await onDeleteTag(tag.id, enteredPin.trim());
    if (!ok) {
      alert('PIN NFC salah! Penghapusan dibatalkan.');
    }
  };

  const handleWebNFCWrite = async (tag: NFCTag) => {
    const redirectUrl = `${origin}/nfc/${tag.id}`;

    if (!('NDEFReader' in window)) {
      setNfcWriteStatus('unsupported');
      setNfcWriteLog('Perangkat ini belum mendukung Web NFC API. Anda dapat menyalin URL di bawah dan menulisnya menggunakan aplikasi gratis "NFC Tools" di Android atau iPhone.');
      return;
    }

    try {
      setNfcWriteStatus('writing');
      setNfcWriteLog('Dekatkan kartu / gantungan kunci / stiker NFC fisik Anda ke belakang smartphone...');

      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [
          { recordType: 'url', data: redirectUrl }
        ]
      });

      setNfcWriteStatus('success');
      setNfcWriteLog(`Sukses! Chip NFC telah berhasil diprogram untuk "${tag.placeName}".`);
    } catch (err: any) {
      console.warn('Web NFC write failed:', err);
      setNfcWriteStatus('unsupported');
      setNfcWriteLog(`Gagal menulis: ${err.message || 'Izin ditolak atau tag digerakkan terlalu cepat'}.`);
    }
  };

  const isCompact = activeViewMode === 'compact';

  return (
    <div className="space-y-8">
      
      {/* Hero Banner: Clean White Box with Forest Green Framing and Blush Blob */}
      <div className="bg-white rounded-none border border-[#104F38]/20 p-6 sm:p-8 relative overflow-hidden">
        
        {/* Whimsical Blush Pink Circle Blob Accent */}
        <div className="w-24 h-24 rounded-full bg-[#FCD5CE] absolute -top-4 -right-4 -z-0 opacity-80 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#104F38] bg-[#FFE600] px-2.5 py-0.5 border border-[#104F38]/20">
              <Radio className="w-3.5 h-3.5 text-[#104F38]" />
              <span>Teknologi Tap to Review (NFC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#104F38] leading-tight">
              Aktivasi & Manajemen NFC Tag Google Review
            </h1>
            <p className="text-xs sm:text-sm text-[#104F38]/80 leading-relaxed font-medium">
              Daftarkan dan program chip NFC fisik (kartu tap akrilik meja atau stiker). Pelanggan cukup menempelkan smartphone mereka untuk langsung membuka formulir ulasan bintang 5 Google Bisnis Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenActivateModal}
              className="w-full sm:w-auto justify-center px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs font-bold rounded-none border border-[#104F38]/20 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#104F38]" />
              <span>Aktivasi NFC Tag Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tap Feedback Alert */}
      {tapSuccessMessage && (
        <div className="p-4 bg-[#F4FAF6] border border-[#104F38]/30 text-[#104F38] text-xs rounded-none flex items-start gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 text-[#104F38] shrink-0 mt-0.5" />
          <div className="font-semibold">{tapSuccessMessage}</div>
        </div>
      )}

      {/* Filter, Search & View Settings Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#104F38]/50" />
            <input
              type="text"
              placeholder="Cari nama tempat, link Google Review, UID, /nfc/id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-white border border-[#104F38]/20 rounded-none text-xs placeholder:text-[#104F38]/40 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38] transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#104F38]/50 hover:text-[#104F38] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Tabs & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-[#F4FAF6] p-1 rounded-none border border-[#104F38]/15">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer text-xs ${
                  statusFilter === 'all'
                    ? 'bg-[#FFE600] text-[#104F38] shadow-2xs font-bold'
                    : 'text-[#104F38]/70 hover:text-[#104F38]'
                }`}
              >
                Semua ({tags.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer text-xs ${
                  statusFilter === 'active'
                    ? 'bg-[#104F38] text-white shadow-2xs font-bold'
                    : 'text-[#104F38]/70 hover:text-[#104F38]'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('locked')}
                className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer text-xs ${
                  statusFilter === 'locked'
                    ? 'bg-[#FCD5CE] text-[#104F38] shadow-2xs font-bold'
                    : 'text-[#104F38]/70 hover:text-[#104F38]'
                }`}
              >
                Dikunci ({lockedCount})
              </button>
            </div>

            {/* View Mode Toggle: Normal vs Detail Lebih Kecil */}
            <div className="flex items-center gap-1 bg-[#F4FAF6] p-1 rounded-none border border-[#104F38]/15 text-[#104F38]">
              <button
                onClick={() => handleSetViewMode('normal')}
                className={`px-2.5 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${
                  !isCompact
                    ? 'bg-white text-[#104F38] shadow-2xs font-bold border border-[#104F38]/20'
                    : 'hover:text-[#104F38]'
                }`}
                title="Tampilan Normal (Standar)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Normal</span>
              </button>
              <button
                onClick={() => handleSetViewMode('compact')}
                className={`px-2.5 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${
                  isCompact
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
            <span className="font-bold text-[#104F38] text-sm">Daftar Aktivasi NFC Tag</span>
            <span className="bg-[#FFE600] text-[#104F38] px-2 py-0.5 font-mono text-[11px] font-extrabold border border-[#104F38]/20">
              {filteredTags.length}
            </span>
            {isCompact && (
              <span className="bg-[#F4FAF6] text-[#104F38] font-semibold px-2 py-0.5 rounded-none text-[10px] flex items-center gap-1 border border-[#104F38]/15">
                <Minimize2 className="w-2.5 h-2.5" /> View Lebih Kecil Aktif
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#104F38]/60">
            Mode: <strong className="text-[#104F38]">{isCompact ? 'Detail Lebih Kecil' : 'Normal'}</strong>
          </div>
        </div>
      </div>

      {/* List of Activated NFC Tags */}
      <div className={isCompact ? 'space-y-1.5' : 'space-y-3'}>
        {filteredTags.length > 0 ? (
          filteredTags.map(tag => {
            const redirectUrl = `${origin}/nfc/${tag.id}`;
            const isLocked = tag.status === 'locked';

            // COMPACT ROW (Detail Lebih Kecil)
            if (isCompact) {
              return (
                <div
                  key={tag.id}
                  className={`bg-white rounded-none border transition-all duration-150 p-2 sm:py-2.5 sm:px-3.5 ${
                    isLocked
                      ? 'border-[#FCD5CE] bg-[#FFFBFB]'
                      : 'border-[#104F38]/15 hover:border-[#104F38]/35 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    
                    {/* Left: Mini NFC Icon + Place Name + /nfc/id & Status */}
                    <div className="flex items-center gap-2.5 min-w-0 sm:w-[38%] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setWritePayloadModalTag(tag);
                          setNfcWriteStatus('idle');
                          setNfcWriteLog(null);
                        }}
                        className="cursor-pointer w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 flex items-center justify-center shrink-0 shadow-2xs hover:bg-[#EAF5F0] transition-colors"
                        title="Klik untuk program chip NFC fisik"
                      >
                        <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      {/* Title & Slug */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 leading-none">
                          <span className="text-[10px] font-mono text-[#104F38]/70 font-medium truncate">
                            /nfc/{tag.id}
                          </span>
                          <button
                            onClick={() => handleCopyLink(tag.id)}
                            className="text-[#104F38]/50 hover:text-[#104F38] p-0.5 rounded transition-colors cursor-pointer"
                            title="Salin tautan NFC"
                          >
                            {copiedId === tag.id ? (
                              <Check className="w-2.5 h-2.5 text-[#104F38] font-bold" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                          <span className="text-[#104F38]/30 text-[10px]">·</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-none ${
                              isLocked ? 'bg-[#FCD5CE] text-[#104F38]' : 'bg-[#FFE600] text-[#104F38]'
                            }`}
                          >
                            {isLocked ? 'Dikunci' : 'Aktif'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[#104F38] truncate mt-1 leading-snug" title={tag.placeName}>
                          {tag.placeName}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[10px] text-[#104F38]/60 mt-0.5">
                          <span className="font-mono">UID: {tag.tagUid}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-[#104F38]/80 font-medium">
                            <Lock className="w-2.5 h-2.5" /> PIN
                          </span>
                          {tag.notes && (
                            <>
                              <span>·</span>
                              <span className="truncate italic text-[#104F38]/60">{tag.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Compact Destination Google Review URL */}
                    <div className="min-w-0 flex-1 bg-[#F8FAF9] rounded-none py-1 px-2.5 border border-[#104F38]/10 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-bold text-[#104F38]/60 uppercase shrink-0">
                          Review:
                        </span>
                        <a
                          href={tag.googleReviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-[#104F38] hover:text-[#0C3B2A] truncate hover:underline font-semibold"
                          title={tag.googleReviewUrl}
                        >
                          {tag.googleReviewUrl}
                        </a>
                      </div>
                      <ExternalLink className="w-3 h-3 text-[#104F38]/40 shrink-0" />
                    </div>

                    {/* Tap Metric */}
                    <div className="hidden md:flex items-center gap-1 shrink-0 px-2 text-[11px] font-mono text-[#104F38]/70">
                      <span className="text-[#104F38]/50 text-[10px]">Tap:</span>
                      <strong className="text-[#104F38] tabular-nums font-bold">{tag.totalTaps.toLocaleString()}</strong>
                    </div>

                    {/* Right: Compact Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#104F38]/10">
                      {/* Test Tap */}
                      <button
                        onClick={() => handleSimulateTap(tag)}
                        disabled={testingId === tag.id}
                        className="px-2 py-1 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 rounded-none text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Simulasikan tap pengunjung"
                      >
                        {testingId === tag.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Smartphone className="w-3 h-3" />
                        )}
                        <span>Uji Tap</span>
                      </button>

                      {/* Write Chip */}
                      <button
                        onClick={() => {
                          setWritePayloadModalTag(tag);
                          setNfcWriteStatus('idle');
                          setNfcWriteLog(null);
                        }}
                        className="px-2 py-1 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 rounded-none text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Program chip NFC fisik"
                      >
                        <Radio className="w-3 h-3 text-[#104F38]/70" />
                        <span>Program</span>
                      </button>

                      {/* Desain Stand Akrilik */}
                      {onOpenStandStudio && (
                        <button
                          onClick={() => onOpenStandStudio(tag)}
                          className="px-2 py-1 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 rounded-none text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                          title="Buka Template Desain Stand Akrilik Google Review"
                        >
                          <Sparkles className="w-3 h-3 text-[#104F38]" />
                          <span>Stand</span>
                        </button>
                      )}

                      {/* Edit with PIN */}
                      <button
                        onClick={() => onOpenEditModal(tag)}
                        className="px-2 py-1 bg-[#104F38] hover:bg-[#0C3B2A] text-white rounded-none text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Ubah Link Review (Perlu PIN)"
                      >
                        <Edit3 className="w-3 h-3 text-[#FFE600]" />
                        <span>Ubah (PIN)</span>
                      </button>

                      {/* Delete with PIN */}
                      <button
                        onClick={() => handleDeleteWithPin(tag)}
                        className="p-1 text-[#104F38]/40 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title="Hapus NFC Tag (Perlu PIN)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            }

            // NORMAL ROW (Standar)
            return (
              <div
                key={tag.id}
                className={`bg-white rounded-none border transition-all p-4 sm:p-5 ${
                  isLocked
                    ? 'border-[#FCD5CE] bg-[#FFFBFB]'
                    : 'border-[#104F38]/15 hover:border-[#104F38]/35 hover:shadow-2xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: NFC Icon & Place Name + UID */}
                  <div className="flex items-center gap-3.5 min-w-0 lg:w-[35%] shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setWritePayloadModalTag(tag);
                        setNfcWriteStatus('idle');
                        setNfcWriteLog(null);
                      }}
                      className="cursor-pointer w-12 h-12 rounded-none bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 flex items-center justify-center shrink-0 shadow-2xs hover:bg-[#EAF5F0] transition-colors"
                      title="Klik untuk program chip NFC fisik"
                    >
                      <Radio className="w-6 h-6" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#104F38]/70 font-semibold truncate">
                          /nfc/{tag.id}
                        </span>
                        <button
                          onClick={() => handleCopyLink(tag.id)}
                          className="text-[#104F38]/50 hover:text-[#104F38] p-0.5 rounded transition-colors cursor-pointer"
                          title="Salin tautan NFC"
                        >
                          {copiedId === tag.id ? (
                            <Check className="w-3 h-3 text-[#104F38] font-bold" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span className="text-[#104F38]/30">·</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none ${isLocked ? 'bg-[#FCD5CE] text-[#104F38]' : 'bg-[#FFE600] text-[#104F38]'}`}>
                          {isLocked ? 'Dikunci' : 'Aktif'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#104F38] mt-1 truncate" title={tag.placeName}>
                        {tag.placeName}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] text-[#104F38]/60 mt-0.5">
                        <span className="font-mono">UID: {tag.tagUid}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[#104F38]/80 font-medium">
                          <Lock className="w-3 h-3 text-[#104F38]/50" />
                          PIN Terproteksi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Google Review Link Preview */}
                  <div className="min-w-0 flex-1 bg-[#F8FAF9] rounded-none p-2.5 px-3 border border-[#104F38]/10 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-[10px] text-[#104F38]/60 font-bold uppercase tracking-wider">
                      <span>Tautan Google Review Terkoneksi</span>
                      <a
                        href={tag.googleReviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#104F38] hover:text-[#0C3B2A] flex items-center gap-1 normal-case font-bold hover:underline"
                      >
                        Buka Review <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="font-mono text-xs text-[#104F38] truncate mt-0.5 font-semibold">
                      {tag.googleReviewUrl}
                    </div>
                    {tag.notes && (
                      <div className="text-[11px] text-[#104F38]/60 italic mt-0.5 truncate">
                        Lokasi: {tag.notes}
                      </div>
                    )}
                  </div>

                  {/* Tap Metric */}
                  <div className="hidden sm:block text-center shrink-0 min-w-[85px] px-2">
                    <span className="text-[10px] text-[#104F38]/60 uppercase font-bold block">Total Tap</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-[#104F38] block mt-0.5">
                      {tag.totalTaps.toLocaleString()} kali
                    </span>
                    <span className="text-[10px] text-[#104F38]/60 block truncate">
                      {tag.lastTappedAt ? `Terakhir ${new Date(tag.lastTappedAt).toLocaleDateString('id-ID')}` : 'Belum di-tap'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-[#104F38]/10 flex-wrap sm:flex-nowrap">
                    
                    {/* Test Tap */}
                    <button
                      onClick={() => handleSimulateTap(tag)}
                      disabled={testingId === tag.id}
                      className="px-3 py-2 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 rounded-none text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Simulasikan smartphone pengunjung menempelkan NFC"
                    >
                      {testingId === tag.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengetuk...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Uji Tap NFC</span>
                        </>
                      )}
                    </button>

                    {/* Write Physical NFC */}
                    <button
                      onClick={() => {
                        setWritePayloadModalTag(tag);
                        setNfcWriteStatus('idle');
                        setNfcWriteLog(null);
                      }}
                      className="px-3 py-2 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 rounded-none text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Tulis URL ke chip NFC fisik"
                    >
                      <Radio className="w-3.5 h-3.5 text-[#104F38]/70" />
                      <span>Program Chip</span>
                    </button>

                    {/* Desain Stand Akrilik Google Review */}
                    {onOpenStandStudio && (
                      <button
                        onClick={() => onOpenStandStudio(tag)}
                        className="px-3 py-2 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 rounded-none text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Buka Template Desain Stand Akrilik Google Review"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#104F38]" />
                        <span>Stand Review</span>
                      </button>
                    )}

                    {/* Edit with PIN */}
                    <button
                      onClick={() => onOpenEditModal(tag)}
                      className="px-3 py-2 bg-[#104F38] hover:bg-[#0C3B2A] text-white rounded-none text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FFE600]" />
                      <span>Ubah Link (PIN)</span>
                    </button>

                    {/* Delete with PIN */}
                    <button
                      onClick={() => handleDeleteWithPin(tag)}
                      className="p-2 text-[#104F38]/40 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      title="Hapus NFC Tag (Perlu PIN)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-none border border-[#104F38]/20 p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none flex items-center justify-center mx-auto text-[#104F38]">
              <Radio className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-base font-bold text-[#104F38]">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tidak ada NFC Tag yang cocok dengan pencarian'
                  : 'Belum ada NFC Tag yang diaktivasi'}
              </h3>
              <p className="text-xs text-[#104F38]/70 mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Coba ubah kata kunci pencarian atau bersihkan filter status untuk melihat seluruh data.'
                  : 'Aktivasi NFC tag pertama Anda dengan memasukkan Nama Tempat, Link Google Review, dan PIN pengaman.'}
              </p>
            </div>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 text-xs font-bold rounded-none hover:bg-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Reset Pencarian & Filter</span>
              </button>
            ) : (
              <button
                onClick={onOpenActivateModal}
                className="px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs font-bold rounded-none border border-[#104F38]/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Aktivasi NFC Tag Baru</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Write / Program Physical NFC Tag */}
      {writePayloadModalTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#104F38]/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-none shadow-2xl border border-[#104F38]/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#104F38]/10 flex items-center justify-between bg-[#F8FAF9]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#104F38]" />
                <h3 className="text-base font-bold text-[#104F38]">
                  Program Chip NFC: {writePayloadModalTag.placeName}
                </h3>
              </div>
              <button
                onClick={() => setWritePayloadModalTag(null)}
                className="text-[#104F38]/50 hover:text-[#104F38] p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none space-y-1">
                <strong className="text-[#104F38] font-bold block">
                  Tautan Dinamis yang Ditulis ke Chip NFC:
                </strong>
                <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-none border border-[#104F38]/20 font-mono text-[#104F38]">
                  <span className="truncate">{`${origin}/nfc/${writePayloadModalTag.id}`}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${origin}/nfc/${writePayloadModalTag.id}`);
                      alert('URL NFC berhasil disalin!');
                    }}
                    className="text-[#104F38] font-bold hover:underline shrink-0 text-[11px]"
                  >
                    Salin
                  </button>
                </div>
              </div>

              {/* Web NFC Write Action */}
              <div className="space-y-2">
                <span className="font-bold text-[#104F38] block">
                  Metode 1: Tulis Langsung via Web Browser (Chrome Android)
                </span>
                <button
                  type="button"
                  onClick={() => handleWebNFCWrite(writePayloadModalTag)}
                  disabled={nfcWriteStatus === 'writing'}
                  className="w-full py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] disabled:bg-stone-300 text-white font-bold rounded-none flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Radio className="w-4 h-4 text-[#FFE600]" />
                  <span>
                    {nfcWriteStatus === 'writing'
                      ? 'Tempelkan Tag ke Belakang HP Sekarang...'
                      : 'Mulai Tulis ke Tag NFC Fisik'}
                  </span>
                </button>
              </div>

              {nfcWriteLog && (
                <div className={`p-3 rounded-none border text-xs flex items-start gap-2 ${
                  nfcWriteStatus === 'success'
                    ? 'bg-[#F4FAF6] border-[#104F38]/30 text-[#104F38]'
                    : 'bg-[#FCD5CE]/30 border-[#FCD5CE] text-[#104F38]'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#104F38]" />
                  <span>{nfcWriteLog}</span>
                </div>
              )}

              {/* NFC Tools App Guide */}
              <div className="pt-2 border-t border-[#104F38]/10 space-y-1.5 text-[#104F38]/80">
                <span className="font-bold text-[#104F38] block">
                  Metode 2: Menggunakan Aplikasi "NFC Tools" (Gratis di Android / iOS)
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                  <li>Unduh aplikasi <strong>NFC Tools</strong> dari Play Store atau App Store.</li>
                  <li>Buka tab <strong>Tulis (Write)</strong> &gt; <strong>Tambah Rekaman (Add a record)</strong>.</li>
                  <li>Pilih <strong>URL / URI</strong>, lalu tempel tautan: <code className="bg-[#F4FAF6] px-1 py-0.5 rounded-none font-mono text-[#104F38] border border-[#104F38]/15">{`${origin}/nfc/${writePayloadModalTag.id}`}</code></li>
                  <li>Pilih <strong>Tulis (Write)</strong> dan tempelkan chip/kartu NFC ke smartphone Anda. Selesai!</li>
                </ol>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#F8FAF9] border-t border-[#104F38]/10 flex justify-end">
              <button
                type="button"
                onClick={() => setWritePayloadModalTag(null)}
                className="px-4 py-1.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 font-bold rounded-none text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
