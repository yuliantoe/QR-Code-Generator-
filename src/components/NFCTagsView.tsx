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
  Layers,
  X,
  QrCode,
  ShieldCheck,
  History,
  ScanLine
} from 'lucide-react';
import type { DynamicQRCode, NFCTag } from '../types.ts';

export interface TestTapResult {
  success: boolean;
  targetUrl?: string | null;
  requirePin?: boolean;
  locked?: boolean;
  error?: string;
  updatedTag?: NFCTag;
}

interface NFCTagsViewProps {
  tags: NFCTag[];
  qrcodes: DynamicQRCode[];
  onOpenActivateModal: (prefill?: { tagUid?: string; qrId?: string; scannedPayload?: string }) => void;
  onOpenEditModal: (tag: NFCTag) => void;
  onDeleteTag: (id: string, pin: string) => Promise<boolean>;
  onTestTap: (id: string, pin?: string) => Promise<TestTapResult>;
  onTagRecorded: (updatedTag: NFCTag) => void;
  onOpenStandStudio?: (tag: NFCTag) => void;
  viewMode?: 'normal' | 'compact';
  onViewModeChange?: (mode: 'normal' | 'compact') => void;
}

export const NFCTagsView: React.FC<NFCTagsViewProps> = ({
  tags,
  qrcodes,
  onOpenActivateModal,
  onOpenEditModal,
  onDeleteTag,
  onTestTap,
  onTagRecorded,
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
  const [copiedPayloadLink, setCopiedPayloadLink] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [tapSuccessMessage, setTapSuccessMessage] = useState<string | null>(null);
  const [tapErrorMessage, setTapErrorMessage] = useState<string | null>(null);

  // Program Chip modal + PIN gate state
  const [writePayloadModalTag, setWritePayloadModalTag] = useState<NFCTag | null>(null);
  const [programPinInput, setProgramPinInput] = useState('');
  const [programPinVerified, setProgramPinVerified] = useState(false);
  const [programPinError, setProgramPinError] = useState<string | null>(null);
  const [isVerifyingProgramPin, setIsVerifyingProgramPin] = useState(false);
  const [nfcWriteStatus, setNfcWriteStatus] = useState<'idle' | 'writing' | 'success' | 'unsupported'>('idle');
  const [nfcWriteLog, setNfcWriteLog] = useState<string | null>(null);

  // Delete PIN modal state
  const [deleteTargetTag, setDeleteTargetTag] = useState<NFCTag | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);

  // Tap PIN Prompt Modal state (for tags with requirePinOnTap)
  const [pinPromptTag, setPinPromptTag] = useState<NFCTag | null>(null);
  const [tapPinInput, setTapPinInput] = useState('');
  const [tapPinError, setTapPinError] = useState<string | null>(null);
  const [isVerifyingTapPin, setIsVerifyingTapPin] = useState(false);

  // Auto-Scan & Record Modal state
  const [isAutoScanOpen, setIsAutoScanOpen] = useState(false);
  const [autoScanState, setAutoScanState] = useState<'idle' | 'listening' | 'matched-nfc' | 'matched-qr' | 'blank' | 'pin-required' | 'error'>('idle');
  const [autoScanMessage, setAutoScanMessage] = useState<string | null>(null);
  const [autoScanPayloadInput, setAutoScanPayloadInput] = useState('');
  const [autoScanUidInput, setAutoScanUidInput] = useState('');
  const [autoScanResult, setAutoScanResult] = useState<any>(null);
  const [autoScanPinInput, setAutoScanPinInput] = useState('');

  // Tap History Modal state
  const [historyTag, setHistoryTag] = useState<NFCTag | null>(null);

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
        const matchQr = (tag.linkedQrCode || '').toLowerCase().includes(query) || (tag.linkedQrSlug || '').toLowerCase().includes(query);
        return matchPlace || matchId || matchUid || matchUrl || matchNotes || matchQr;
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

  const openProgramChipModal = (tag: NFCTag) => {
    setWritePayloadModalTag(tag);
    setProgramPinInput('');
    setProgramPinVerified(false);
    setProgramPinError(null);
    setNfcWriteStatus('idle');
    setNfcWriteLog(null);
    setCopiedPayloadLink(false);
  };

  const handleVerifyProgramPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writePayloadModalTag) return;
    if (!programPinInput.trim()) {
      setProgramPinError('Masukkan PIN keamanan NFC untuk membuka akses program chip.');
      return;
    }

    setIsVerifyingProgramPin(true);
    setProgramPinError(null);
    try {
      const res = await fetch(`/api/nfc/${writePayloadModalTag.id}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: programPinInput.trim(), action: 'program' })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setProgramPinVerified(true);
      } else {
        setProgramPinError(json.error || 'PIN keamanan NFC salah!');
      }
    } catch {
      setProgramPinError('Gagal memverifikasi PIN ke server.');
    } finally {
      setIsVerifyingProgramPin(false);
    }
  };

  const handleSimulateTap = async (tag: NFCTag) => {
    setTestingId(tag.id);
    setTapSuccessMessage(null);
    setTapErrorMessage(null);
    try {
      const res = await onTestTap(tag.id);
      if (res.requirePin) {
        setPinPromptTag(tag);
        setTapPinInput('');
        setTapPinError(null);
      } else if (res.success && res.targetUrl) {
        setTapSuccessMessage(`Tag NFC "${tag.placeName}" terbaca & direcord! Dialihkan ke: ${res.targetUrl}`);
        setTimeout(() => setTapSuccessMessage(null), 5000);
      } else if (res.error) {
        setTapErrorMessage(res.error);
        setTimeout(() => setTapErrorMessage(null), 5000);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setTestingId(null);
    }
  };

  const handleVerifyTapPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptTag) return;
    if (!tapPinInput.trim()) {
      setTapPinError('PIN NFC wajib diisi untuk membuka tautan.');
      return;
    }

    setIsVerifyingTapPin(true);
    setTapPinError(null);
    try {
      const res = await onTestTap(pinPromptTag.id, tapPinInput.trim());
      if (res.success && res.targetUrl) {
        setTapSuccessMessage(`PIN terverifikasi! Tap NFC "${pinPromptTag.placeName}" direcord dan diarahkan ke: ${res.targetUrl}`);
        setPinPromptTag(null);
        setTapPinInput('');
        setTimeout(() => setTapSuccessMessage(null), 5000);
      } else {
        setTapPinError(res.error || 'PIN keamanan NFC salah!');
      }
    } catch {
      setTapPinError('Gagal memverifikasi PIN NFC.');
    } finally {
      setIsVerifyingTapPin(false);
    }
  };

  const openDeletePinModal = (tag: NFCTag) => {
    setDeleteTargetTag(tag);
    setDeletePin('');
    setDeleteError(null);
  };

  const handleConfirmDeleteWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetTag) return;
    if (!deletePin.trim()) {
      setDeleteError('PIN NFC Tag wajib diisi untuk menghapus.');
      return;
    }

    setIsDeletingTag(true);
    setDeleteError(null);
    try {
      const ok = await onDeleteTag(deleteTargetTag.id, deletePin.trim());
      if (ok) {
        setDeleteTargetTag(null);
        setDeletePin('');
      } else {
        setDeleteError('PIN NFC salah! Penghapusan dibatalkan.');
      }
    } catch {
      setDeleteError('Terjadi gangguan saat menghapus NFC Tag.');
    } finally {
      setIsDeletingTag(false);
    }
  };

  const handleWebNFCWrite = async (tag: NFCTag) => {
    const redirectUrl = `${origin}/nfc/${tag.id}`;

    if (!('NDEFReader' in window)) {
      setNfcWriteStatus('unsupported');
      setNfcWriteLog('Perangkat ini belum mendukung Web NFC API. Salin URL di atas dan tulis menggunakan aplikasi gratis "NFC Tools" di Android atau iPhone.');
      return;
    }

    try {
      setNfcWriteStatus('writing');
      setNfcWriteLog('Dekatkan kartu / gantungan kunci / stiker NFC fisik Anda ke belakang smartphone...');

      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: redirectUrl }]
      });

      setNfcWriteStatus('success');
      setNfcWriteLog(`Sukses! Chip NFC telah berhasil diprogram untuk "${tag.placeName}".`);
    } catch (err: any) {
      console.warn('Web NFC write failed:', err);
      setNfcWriteStatus('unsupported');
      setNfcWriteLog(`Gagal menulis: ${err.message || 'Izin ditolak atau tag digerakkan terlalu cepat'}.`);
    }
  };

  // Auto-Scan & Record logic
  const submitScanRecord = async (payload: { tagUid?: string; scannedUrl?: string; scannedText?: string; pin?: string; source?: string }) => {
    try {
      const res = await fetch('/api/nfc/scan-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      setAutoScanResult(json);

      if (json.requirePin) {
        setAutoScanState('pin-required');
        setAutoScanMessage(json.error || `Tag "${json.tag?.placeName}" dilindungi PIN. Masukkan PIN untuk merecord tap.`);
        return;
      }

      if (!res.ok || !json.success) {
        setAutoScanState('error');
        setAutoScanMessage(json.error || 'Gagal membaca data tag NFC.');
        return;
      }

      if (json.matchedType === 'nfc' && json.tag) {
        onTagRecorded(json.tag);
        setAutoScanState('matched-nfc');
        setAutoScanMessage(json.message);
      } else if (json.matchedType === 'qr' && json.qr) {
        setAutoScanState('matched-qr');
        setAutoScanMessage(json.message);
      } else {
        setAutoScanState('blank');
        setAutoScanMessage(json.message);
      }
    } catch {
      setAutoScanState('error');
      setAutoScanMessage('Terjadi kesalahan jaringan saat merecord data NFC.');
    }
  };

  const handleStartWebNFCAutoScan = async () => {
    setAutoScanPinInput('');
    if (!('NDEFReader' in window)) {
      setAutoScanState('error');
      setAutoScanMessage('Browser ini tidak mendukung Web NFC API (Chrome Android). Gunakan panel Uji / Simulasi Tempel Tag di bawah untuk membaca & merecord tag.');
      return;
    }

    try {
      setAutoScanState('listening');
      setAutoScanMessage('Scanner NFC aktif! Tempelkan tag NFC ke belakang HP untuk membaca & merecord data secara otomatis...');
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();

      ndef.addEventListener('readingerror', () => {
        setAutoScanState('error');
        setAutoScanMessage('Tag NFC tidak terbaca sempurna. Tempelkan kembali lebih dekat.');
      });

      ndef.addEventListener('reading', async ({ serialNumber, message }: any) => {
        let detectedUrl = '';
        let detectedText = '';
        const decoder = new TextDecoder();
        if (message && Array.isArray(message.records)) {
          for (const rec of message.records) {
            try {
              if (rec.recordType === 'url') detectedUrl = decoder.decode(rec.data);
              else if (rec.recordType === 'text') detectedText = decoder.decode(rec.data);
            } catch {}
          }
        }
        const cleanUid = serialNumber ? String(serialNumber).toUpperCase() : '';
        setAutoScanUidInput(cleanUid);
        setAutoScanPayloadInput(detectedUrl || detectedText);
        await submitScanRecord({
          tagUid: cleanUid,
          scannedUrl: detectedUrl,
          scannedText: detectedText,
          source: 'auto-scan'
        });
      }, { once: true });
    } catch (err: any) {
      setAutoScanState('error');
      setAutoScanMessage(`Gagal menjalankan scan NFC: ${err?.message || 'Izin ditolak'}`);
    }
  };

  const handleManualScanRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitScanRecord({
      tagUid: autoScanUidInput.trim() || undefined,
      scannedUrl: autoScanPayloadInput.trim() || undefined,
      source: 'auto-scan'
    });
  };

  const handleUnlockAutoScanWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoScanResult?.tag?.id || !autoScanPinInput.trim()) return;
    try {
      const res = await fetch(`/api/nfc/${autoScanResult.tag.id}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: autoScanPinInput.trim(),
          action: 'tap',
          source: 'auto-scan',
          readPayload: autoScanPayloadInput.trim() || `/nfc/${autoScanResult.tag.id}`
        })
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        onTagRecorded(json.data);
        setAutoScanResult({ ...autoScanResult, tag: json.data, targetUrl: json.targetUrl });
        setAutoScanState('matched-nfc');
        setAutoScanMessage(`PIN terverifikasi! Tap NFC "${json.data.placeName}" berhasil direcord.`);
      } else {
        setAutoScanMessage(json.error || 'PIN keamanan NFC salah!');
      }
    } catch {
      setAutoScanMessage('Gagal memverifikasi PIN NFC.');
    }
  };

  const isCompact = activeViewMode === 'compact';

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-white rounded-none border border-[#104F38]/20 p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#104F38]/75 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#104F38]" />
              <span>Teknologi Tap NFC &amp; Keamanan PIN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#104F38] leading-tight [text-wrap:balance]">
              Aktivasi &amp; Manajemen NFC Tag Terhubung QR Code
            </h1>
            <p className="text-xs sm:text-sm text-[#104F38]/80 leading-relaxed font-medium">
              Aktivasi tag NFC langsung dari daftar QR Code yang sudah dibuat. Setiap kali tag ditempelkan, sistem otomatis membaca UID/payload, merecord riwayat tap, dan menjaga keamanan dengan PIN.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                setIsAutoScanOpen(true);
                setAutoScanState('idle');
                setAutoScanMessage(null);
                setAutoScanResult(null);
                setAutoScanPinInput('');
              }}
              className="w-full sm:w-auto justify-center px-4 py-2.5 bg-white hover:bg-[#F4FAF6] text-[#104F38] text-xs font-bold rounded-none border border-[#104F38]/30 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4 text-[#104F38]" />
              <span>Scan &amp; Record NFC</span>
            </button>

            <button
              onClick={() => onOpenActivateModal()}
              className="w-full sm:w-auto justify-center px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs font-bold rounded-none border border-[#104F38]/20 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#104F38]" />
              <span>Aktivasi NFC Tag Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tap Feedback Alerts */}
      {tapSuccessMessage && (
        <div className="p-4 bg-[#F4FAF6] border border-[#104F38]/30 text-[#104F38] text-xs rounded-none flex items-start gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 text-[#104F38] shrink-0 mt-0.5" />
          <div className="font-semibold">{tapSuccessMessage}</div>
        </div>
      )}

      {tapErrorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-none flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="font-semibold">{tapErrorMessage}</div>
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
              placeholder="Cari nama tempat, QR terkait, link tujuan, UID, /nfc/id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-white border border-[#104F38]/20 rounded-none text-xs placeholder:text-[#104F38]/40 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38] transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian NFC"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#104F38]/50 hover:text-[#104F38] text-xs font-bold cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-[#F4FAF6] p-1 rounded-none border border-[#104F38]/15">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer text-xs whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-[#FFE600] text-[#104F38] shadow-2xs font-bold'
                    : 'text-[#104F38]/70 hover:text-[#104F38]'
                }`}
              >
                Semua ({tags.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer text-xs whitespace-nowrap ${
                  statusFilter === 'active'
                    ? 'bg-[#104F38] text-white shadow-2xs font-bold'
                    : 'text-[#104F38]/70 hover:text-[#104F38]'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('locked')}
                className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer text-xs whitespace-nowrap ${
                  statusFilter === 'locked'
                    ? 'bg-[#FCD5CE] text-[#104F38] shadow-2xs font-bold'
                    : 'text-[#104F38]/70 hover:text-[#104F38]'
                }`}
              >
                Dikunci ({lockedCount})
              </button>
            </div>

            <div className="flex items-center gap-1 bg-[#F4FAF6] p-1 rounded-none border border-[#104F38]/15 text-[#104F38]">
              <button
                onClick={() => handleSetViewMode('normal')}
                className={`px-2.5 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 text-xs whitespace-nowrap ${
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
                className={`px-2.5 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 text-xs whitespace-nowrap ${
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

        <div className="flex items-center justify-between text-xs px-1 text-[#104F38]/70">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#104F38] text-sm">Daftar Aktivasi NFC Tag</span>
            <span className="text-[#104F38]/70 font-mono text-xs font-bold tabular-nums">
              ({filteredTags.length})
            </span>
          </div>
          <div className="text-[11px] text-[#104F38]/65">
            Mode: <strong className="text-[#104F38]">{isCompact ? 'Detail Lebih Kecil' : 'Normal'}</strong>
          </div>
        </div>
      </div>

      {/* List of Activated NFC Tags */}
      <div className={isCompact ? 'space-y-1.5' : 'space-y-3'}>
        {filteredTags.length > 0 ? (
          filteredTags.map(tag => {
            const isLocked = tag.status === 'locked';
            const tapRecordsCount = Array.isArray(tag.tapHistory) ? tag.tapHistory.length : 0;

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
                    <div className="flex items-center gap-2.5 min-w-0 sm:w-[40%] shrink-0">
                      <button
                        type="button"
                        onClick={() => openProgramChipModal(tag)}
                        className="cursor-pointer w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 flex items-center justify-center shrink-0 shadow-2xs hover:bg-[#EAF5F0] transition-colors"
                        title="Program chip NFC fisik (Perlu PIN)"
                      >
                        <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 leading-none flex-wrap">
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
                          <span aria-hidden="true" className="text-[#104F38]/30 text-[10px]">·</span>
                          <span className={`text-[10px] font-bold ${isLocked ? 'text-rose-700' : 'text-[#104F38]'}`}>
                            {isLocked ? 'Dikunci' : 'Aktif'}
                          </span>
                          {tag.linkedQrCode && (
                            <>
                              <span aria-hidden="true" className="text-[#104F38]/30 text-[10px]">·</span>
                              <span className="text-[10px] font-mono font-bold text-[#104F38]/80">
                                {tag.linkedQrCode}
                              </span>
                            </>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#104F38] truncate mt-1 leading-snug" title={tag.placeName}>
                          {tag.placeName}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[10px] text-[#104F38]/60 mt-0.5 flex-wrap">
                          <span className="font-mono">UID: {tag.tagUid}</span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-0.5 text-[#104F38]/80 font-medium">
                            <Lock className="w-2.5 h-2.5" />
                            {tag.requirePinOnTap ? 'PIN Tap + Edit' : 'PIN Edit'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 bg-[#F8FAF9] rounded-none py-1 px-2.5 border border-[#104F38]/10 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-bold text-[#104F38]/60 uppercase shrink-0">
                          Tujuan:
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

                    <div className="hidden md:flex items-center gap-1 shrink-0 px-2 text-[11px] font-mono text-[#104F38]/70">
                      <span className="text-[#104F38]/50 text-[10px]">Tap:</span>
                      <strong className="text-[#104F38] tabular-nums font-bold">{tag.totalTaps.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#104F38]/10 flex-wrap">
                      <button
                        onClick={() => handleSimulateTap(tag)}
                        disabled={testingId === tag.id}
                        className="px-2 py-1 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Simulasikan tap & record"
                      >
                        {testingId === tag.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Smartphone className="w-3 h-3" />
                        )}
                        <span>Uji Tap</span>
                      </button>

                      <button
                        onClick={() => setHistoryTag(tag)}
                        className="px-2 py-1 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap tabular-nums"
                        title="Lihat riwayat record tap"
                      >
                        <History className="w-3 h-3 text-[#104F38]/70" />
                        <span>{tapRecordsCount}</span>
                      </button>

                      <button
                        onClick={() => openProgramChipModal(tag)}
                        className="px-2 py-1 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Program chip NFC fisik (Perlu PIN)"
                      >
                        <Radio className="w-3 h-3 text-[#104F38]/70" />
                        <span>Program</span>
                      </button>

                      {onOpenStandStudio && (
                        <button
                          onClick={() => onOpenStandStudio(tag)}
                          className="px-2 py-1 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Buka Template Desain Stand Akrilik"
                        >
                          <Layers className="w-3 h-3 text-[#104F38]" />
                          <span>Stand</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenEditModal(tag)}
                        className="px-2 py-1 bg-[#104F38] hover:bg-[#0C3B2A] text-white rounded-none text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Ubah Link (Perlu PIN)"
                      >
                        <Edit3 className="w-3 h-3 text-[#FFE600]" />
                        <span>Ubah (PIN)</span>
                      </button>

                      <button
                        onClick={() => openDeletePinModal(tag)}
                        aria-label={`Hapus NFC Tag ${tag.placeName}`}
                        className="p-1 text-[#104F38]/45 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title="Hapus NFC Tag (Perlu PIN)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

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
                  <div className="flex items-center gap-3.5 min-w-0 lg:w-[36%] shrink-0">
                    <button
                      type="button"
                      onClick={() => openProgramChipModal(tag)}
                      className="cursor-pointer w-12 h-12 rounded-none bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 flex items-center justify-center shrink-0 shadow-2xs hover:bg-[#EAF5F0] transition-colors"
                      title="Klik untuk program chip NFC fisik (Perlu PIN)"
                    >
                      <Radio className="w-6 h-6" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        <span aria-hidden="true" className="text-[#104F38]/30">·</span>
                        <span className={`text-[11px] font-bold ${isLocked ? 'text-rose-700' : 'text-[#104F38]'}`}>
                          {isLocked ? 'Dikunci' : 'Aktif'}
                        </span>
                        {tag.linkedQrCode && (
                          <>
                            <span aria-hidden="true" className="text-[#104F38]/30">·</span>
                            <span className="text-[11px] font-mono font-bold text-[#104F38] flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              {tag.linkedQrCode}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#104F38] mt-1 truncate" title={tag.placeName}>
                        {tag.placeName}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] text-[#104F38]/60 mt-0.5 flex-wrap">
                        <span className="font-mono">UID: {tag.tagUid}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 text-[#104F38]/80 font-medium">
                          <Lock className="w-3 h-3 text-[#104F38]/50" />
                          {tag.requirePinOnTap ? 'PIN Wajib Saat Tap & Ubah' : 'PIN Terproteksi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 bg-[#F8FAF9] rounded-none p-2.5 px-3 border border-[#104F38]/10 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-[10px] text-[#104F38]/60 font-bold uppercase tracking-wider">
                      <span>
                        {tag.linkedQrSlug ? `Tersambung ke /r/${tag.linkedQrSlug}` : 'Tautan Tujuan Terkoneksi'}
                      </span>
                      <a
                        href={tag.googleReviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#104F38] hover:text-[#0C3B2A] flex items-center gap-1 normal-case font-bold hover:underline"
                      >
                        Buka Tautan <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="font-mono text-xs text-[#104F38] truncate mt-0.5 font-semibold">
                      {tag.googleReviewUrl}
                    </div>
                    {tag.notes && (
                      <div className="text-[11px] text-[#104F38]/60 italic mt-0.5 truncate">
                        Catatan: {tag.notes}
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:block text-center shrink-0 min-w-[85px] px-2">
                    <span className="text-[10px] text-[#104F38]/60 uppercase font-bold block">Total Tap</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-[#104F38] block mt-0.5">
                      {tag.totalTaps.toLocaleString()} kali
                    </span>
                    <span className="text-[10px] text-[#104F38]/60 block truncate">
                      {tag.lastTappedAt ? `Terakhir ${new Date(tag.lastTappedAt).toLocaleDateString('id-ID')}` : 'Belum di-tap'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-[#104F38]/10 flex-wrap">
                    <button
                      onClick={() => handleSimulateTap(tag)}
                      disabled={testingId === tag.id}
                      className="px-3 py-2 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Simulasikan smartphone menempelkan NFC & merecord data"
                    >
                      {testingId === tag.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Membaca...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Uji Tap</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setHistoryTag(tag)}
                      className="px-3 py-2 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap tabular-nums"
                      title="Lihat riwayat data tap yang direcord"
                    >
                      <History className="w-3.5 h-3.5 text-[#104F38]/70" />
                      <span>Riwayat ({tapRecordsCount})</span>
                    </button>

                    <button
                      onClick={() => openProgramChipModal(tag)}
                      className="px-3 py-2 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Tulis URL ke chip NFC fisik (Perlu PIN)"
                    >
                      <Radio className="w-3.5 h-3.5 text-[#104F38]/70" />
                      <span>Program Chip</span>
                    </button>

                    {onOpenStandStudio && (
                      <button
                        onClick={() => onOpenStandStudio(tag)}
                        className="px-3 py-2 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Buka Template Desain Stand Akrilik Google Review"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#104F38]" />
                        <span>Stand</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenEditModal(tag)}
                      className="px-3 py-2 bg-[#104F38] hover:bg-[#0C3B2A] text-white rounded-none text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FFE600]" />
                      <span>Ubah (PIN)</span>
                    </button>

                    <button
                      onClick={() => openDeletePinModal(tag)}
                      aria-label={`Hapus NFC Tag ${tag.placeName}`}
                      className="p-2 text-[#104F38]/45 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer border border-transparent hover:border-rose-200"
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
                  : 'Aktivasi NFC tag pertama Anda dengan mengambil data dari daftar QR Code dan mengamankannya dengan PIN.'}
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
                <span>Reset Pencarian &amp; Filter</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenActivateModal()}
                className="px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs font-bold rounded-none border border-[#104F38]/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Aktivasi NFC Tag Baru</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Auto-Scan & Record NFC Tag */}
      {isAutoScanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2318]/75 overflow-y-auto">
          <div
            className="relative w-full max-w-lg bg-white rounded-none shadow-xl border border-[#104F38]/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-[#104F38]/15 flex items-center justify-between bg-[#F4FAF6]">
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-[#104F38]" />
                <h3 className="text-base font-bold text-[#104F38]">
                  Scan &amp; Record Tag NFC Otomatis
                </h3>
              </div>
              <button
                onClick={() => setIsAutoScanOpen(false)}
                aria-label="Tutup modal scan NFC"
                className="text-[#104F38]/60 hover:text-[#104F38] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#104F38]/80 leading-relaxed">
                Tempelkan tag NFC ke smartphone atau masukkan UID/payload tag untuk membaca data yang tersimpan dan merecord log tap secara otomatis.
              </p>

              <button
                type="button"
                onClick={handleStartWebNFCAutoScan}
                className="w-full py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white font-bold rounded-none flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Radio className="w-4 h-4 text-[#FFE600]" />
                <span>
                  {autoScanState === 'listening' ? 'Menunggu Tag NFC Ditempel...' : 'Aktifkan Pembaca NFC (Chrome Android)'}
                </span>
              </button>

              <form onSubmit={handleManualScanRecordSubmit} className="p-3.5 bg-[#F4FAF6] border border-[#104F38]/20 space-y-3">
                <span className="font-bold text-[#104F38] block">
                  Simulasi / Baca Payload &amp; UID Tag Manual
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="scanUidInput" className="block text-[11px] font-bold text-[#104F38] mb-1">
                      UID Chip NFC
                    </label>
                    <input
                      id="scanUidInput"
                      type="text"
                      value={autoScanUidInput}
                      onChange={(e) => setAutoScanUidInput(e.target.value)}
                      placeholder="Contoh: 04:3A:82:1F:B4:71:80"
                      className="w-full px-2.5 py-2 bg-white border border-[#104F38]/25 font-mono text-xs text-[#104F38]"
                    />
                  </div>
                  <div>
                    <label htmlFor="scanPayloadInput" className="block text-[11px] font-bold text-[#104F38] mb-1">
                      URL / Payload NDEF Tag
                    </label>
                    <input
                      id="scanPayloadInput"
                      type="text"
                      value={autoScanPayloadInput}
                      onChange={(e) => setAutoScanPayloadInput(e.target.value)}
                      placeholder="Contoh: /nfc/... atau /r/menu-resto"
                      className="w-full px-2.5 py-2 bg-white border border-[#104F38]/25 font-mono text-xs text-[#104F38]"
                    />
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#104F38]/70 font-medium">Pilih cepat tag terdaftar:</span>
                    {tags.slice(0, 3).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setAutoScanUidInput(t.tagUid);
                          setAutoScanPayloadInput(`${origin}/nfc/${t.id}`);
                        }}
                        className="px-2 py-1 bg-white border border-[#104F38]/20 text-[10px] font-mono font-bold text-[#104F38] hover:bg-[#FFE600]/20 cursor-pointer"
                      >
                        {t.placeName}
                      </button>
                    ))}
                    {qrcodes.slice(0, 2).map(q => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setAutoScanUidInput('');
                          setAutoScanPayloadInput(`${origin}/r/${q.slug}`);
                        }}
                        className="px-2 py-1 bg-white border border-[#104F38]/20 text-[10px] font-mono font-bold text-[#104F38] hover:bg-[#FFE600]/20 cursor-pointer"
                      >
                        QR: /r/{q.slug}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 font-bold cursor-pointer"
                >
                  Baca &amp; Record Data Tag Sekarang
                </button>
              </form>

              {autoScanMessage && (
                <div
                  className={`p-3 border text-xs space-y-2 ${
                    autoScanState === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : autoScanState === 'pin-required'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-[#F4FAF6] border-[#104F38]/30 text-[#104F38]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {autoScanState === 'matched-nfc' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{autoScanMessage}</span>
                  </div>

                  {autoScanState === 'pin-required' && (
                    <form onSubmit={handleUnlockAutoScanWithPin} className="flex items-center gap-2 pt-1">
                      <input
                        type="password"
                        required
                        value={autoScanPinInput}
                        onChange={(e) => setAutoScanPinInput(e.target.value)}
                        placeholder="Masukkan PIN keamanan NFC..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-amber-400 font-mono text-xs text-[#104F38]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#104F38] text-[#FFE600] font-bold text-xs cursor-pointer whitespace-nowrap"
                      >
                        Verifikasi PIN
                      </button>
                    </form>
                  )}

                  {(autoScanState === 'matched-qr' || autoScanState === 'blank') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAutoScanOpen(false);
                        onOpenActivateModal({
                          tagUid: autoScanResult?.tagUid || autoScanUidInput || undefined,
                          qrId: autoScanResult?.qr?.id,
                          scannedPayload: autoScanResult?.scannedPayload || autoScanPayloadInput || undefined
                        });
                      }}
                      className="px-3 py-1.5 bg-[#104F38] text-[#FFE600] font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Aktivasi Tag NFC dari Data Ini</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Write / Program Physical NFC Tag (Protected by PIN) */}
      {writePayloadModalTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2318]/75">
          <div
            className="relative w-full max-w-lg bg-white rounded-none shadow-xl border border-[#104F38]/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-[#104F38]/15 flex items-center justify-between bg-[#F4FAF6]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#104F38]" />
                <h3 className="text-base font-bold text-[#104F38]">
                  Program Chip NFC: {writePayloadModalTag.placeName}
                </h3>
              </div>
              <button
                onClick={() => setWritePayloadModalTag(null)}
                aria-label="Tutup modal program NFC"
                className="text-[#104F38]/60 hover:text-[#104F38] p-1 rounded-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!programPinVerified ? (
              <form onSubmit={handleVerifyProgramPin} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/20 flex items-start gap-2.5 text-[#104F38]">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Untuk keamanan chip fisik, masukkan <strong>PIN keamanan NFC</strong> sebelum melihat tautan program atau menulis ke chip NFC.
                  </span>
                </div>

                {programPinError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{programPinError}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="programChipPinInput" className="block font-bold text-[#104F38] mb-1">
                    PIN Keamanan NFC <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="programChipPinInput"
                    type="password"
                    autoFocus
                    required
                    value={programPinInput}
                    onChange={(e) => setProgramPinInput(e.target.value)}
                    placeholder="Masukkan PIN tag NFC..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 font-mono text-[#104F38]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#104F38]/15">
                  <button
                    type="button"
                    onClick={() => setWritePayloadModalTag(null)}
                    className="px-4 py-2 font-semibold text-[#104F38]/75 bg-white border border-[#104F38]/20 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingProgramPin}
                    className="px-5 py-2 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 font-bold cursor-pointer"
                  >
                    {isVerifyingProgramPin ? 'Memverifikasi...' : 'Buka Akses Program Chip'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="p-6 space-y-4 text-xs">
                  <div className="p-3.5 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none space-y-1.5">
                    <strong className="text-[#104F38] font-bold block">
                      Tautan Dinamis yang Ditulis ke Chip NFC:
                    </strong>
                    <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-none border border-[#104F38]/20 font-mono text-[#104F38]">
                      <span className="truncate">{`${origin}/nfc/${writePayloadModalTag.id}`}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${origin}/nfc/${writePayloadModalTag.id}`);
                          setCopiedPayloadLink(true);
                          setTimeout(() => setCopiedPayloadLink(false), 2000);
                        }}
                        className="text-[#104F38] font-bold hover:underline shrink-0 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPayloadLink ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <span>Salin</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-[#104F38] block">
                      Metode 1: Tulis Langsung via Web Browser (Chrome Android)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleWebNFCWrite(writePayloadModalTag)}
                      disabled={nfcWriteStatus === 'writing'}
                      className="w-full py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] disabled:bg-stone-300 text-white font-bold rounded-none flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#104F38]" />
                      <span>{nfcWriteLog}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#104F38]/10 space-y-1.5 text-[#104F38]/80">
                    <span className="font-bold text-[#104F38] block">
                      Metode 2: Menggunakan Aplikasi &ldquo;NFC Tools&rdquo; (Gratis di Android / iOS)
                    </span>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                      <li>Unduh aplikasi <strong>NFC Tools</strong> dari Play Store atau App Store.</li>
                      <li>Buka tab <strong>Tulis (Write)</strong> &gt; <strong>Tambah Rekaman (Add a record)</strong>.</li>
                      <li>Pilih <strong>URL / URI</strong>, lalu tempel tautan: <code className="bg-[#F4FAF6] px-1 py-0.5 rounded-none font-mono text-[#104F38] border border-[#104F38]/15">{`${origin}/nfc/${writePayloadModalTag.id}`}</code></li>
                      <li>Pilih <strong>Tulis (Write)</strong> dan tempelkan chip/kartu NFC ke smartphone Anda.</li>
                    </ol>
                  </div>
                </div>

                <div className="px-6 py-3 bg-[#F4FAF6] border-t border-[#104F38]/15 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setWritePayloadModalTag(null)}
                    className="px-4 py-1.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 font-bold rounded-none text-xs cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Verify PIN on Tap (when requirePinOnTap is enabled) */}
      {pinPromptTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2318]/75">
          <div
            className="relative w-full max-w-md bg-white rounded-none shadow-xl border border-[#104F38]/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-5 py-4 border-b border-[#104F38]/15 bg-[#F4FAF6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#104F38]" />
                <h3 className="text-base font-bold text-[#104F38]">
                  Verifikasi PIN Keamanan NFC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPinPromptTag(null)}
                aria-label="Tutup verifikasi PIN tap"
                className="text-[#104F38]/60 hover:text-[#104F38] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyTapPinSubmit} className="p-5 space-y-4 text-xs">
              <p className="text-[#104F38]/80 leading-relaxed">
                Tag NFC <strong>{pinPromptTag.placeName}</strong> dilindungi PIN saat ditempel. Masukkan PIN untuk merecord tap dan membuka tautan tujuan.
              </p>

              {tapPinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{tapPinError}</span>
                </div>
              )}

              <div>
                <label htmlFor="tapVerifyPinInput" className="block font-bold text-[#104F38] mb-1">
                  PIN Keamanan NFC <span className="text-rose-600">*</span>
                </label>
                <input
                  id="tapVerifyPinInput"
                  type="password"
                  autoFocus
                  required
                  value={tapPinInput}
                  onChange={(e) => setTapPinInput(e.target.value)}
                  placeholder="Masukkan PIN..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 font-mono text-[#104F38]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#104F38]/15">
                <button
                  type="button"
                  onClick={() => setPinPromptTag(null)}
                  className="px-4 py-2 font-semibold text-[#104F38]/75 bg-white border border-[#104F38]/20 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingTapPin}
                  className="px-5 py-2 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 font-bold cursor-pointer"
                >
                  {isVerifyingTapPin ? 'Memverifikasi...' : 'Verifikasi & Record Tap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tap Record History */}
      {historyTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2318]/75 overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-white rounded-none shadow-xl border border-[#104F38]/30 overflow-hidden my-auto max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-[#104F38]/15 bg-[#F4FAF6] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-mono text-[#104F38]/70 block">
                  UID: {historyTag.tagUid} · /nfc/{historyTag.id}
                </span>
                <h3 className="text-base font-bold text-[#104F38]">
                  Riwayat Record Tap NFC: {historyTag.placeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTag(null)}
                aria-label="Tutup riwayat tap NFC"
                className="text-[#104F38]/60 hover:text-[#104F38] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {Array.isArray(historyTag.tapHistory) && historyTag.tapHistory.length > 0 ? (
                <div className="border border-[#104F38]/15 divide-y divide-[#104F38]/10">
                  {historyTag.tapHistory.map(rec => (
                    <div key={rec.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-mono text-[11px] font-bold text-[#104F38] tabular-nums">
                          {new Date(rec.timestamp).toLocaleString('id-ID')} · UID {rec.tagUid}
                        </div>
                        <div className="text-[11px] text-[#104F38]/75">
                          {rec.device} / {rec.os} / {rec.browser}
                          {rec.readPayload ? ` · Payload: ${rec.readPayload}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold text-[#104F38]">
                        <span>
                          {rec.source === 'auto-scan' ? 'Auto-Scan' : rec.source === 'nfc-tap' ? 'Tap Fisik' : 'Simulasi'}
                        </span>
                        {rec.pinVerified && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-0.5">
                              <Lock className="w-3 h-3" /> PIN Verified
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-[#104F38]/70 space-y-2">
                  <History className="w-8 h-8 mx-auto text-[#104F38]/40" />
                  <p className="font-semibold text-[#104F38]">Belum ada log tap yang direcord untuk tag ini.</p>
                  <p className="text-[11px]">Setiap kali tag NFC ditempelkan atau diuji tap, detail waktu, UID, dan perangkat akan tercatat di sini.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-[#F4FAF6] border-t border-[#104F38]/15 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setHistoryTag(null)}
                className="px-4 py-1.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 font-bold rounded-none text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete NFC Tag with PIN */}
      {deleteTargetTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2318]/75">
          <div
            className="relative w-full max-w-md bg-white rounded-none shadow-xl border border-rose-600 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="h-1.5 bg-rose-600" />
            <div className="px-5 py-4 border-b border-rose-200 bg-rose-50/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-bold block">
                  Verifikasi Hapus NFC Tag
                </span>
                <h3 className="text-base font-bold text-[#104F38]">
                  Hapus &ldquo;{deleteTargetTag.placeName}&rdquo;?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetTag(null)}
                disabled={isDeletingTag}
                aria-label="Tutup konfirmasi hapus NFC"
                className="p-1 text-[#104F38]/60 hover:text-[#104F38] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeleteWithPin} className="p-5 space-y-4 text-xs">
              <p className="text-[#104F38]/80 leading-relaxed">
                Masukkan PIN NFC Tag untuk menghapus registrasi <strong className="font-mono">/nfc/{deleteTargetTag.id}</strong> secara permanen.
              </p>

              {deleteError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div>
                <label htmlFor="deleteNfcPinInput" className="block font-bold text-[#104F38] mb-1">
                  PIN NFC Tag <span className="text-rose-600">*</span>
                </label>
                <input
                  id="deleteNfcPinInput"
                  type="password"
                  autoFocus
                  required
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="Masukkan PIN keamanan NFC Tag..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none font-mono focus:outline-none focus:border-[#104F38] text-[#104F38]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#104F38]/15">
                <button
                  type="button"
                  onClick={() => setDeleteTargetTag(null)}
                  disabled={isDeletingTag}
                  className="px-4 py-2 font-semibold text-[#104F38]/75 hover:text-[#104F38] bg-white border border-[#104F38]/20 rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeletingTag}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-700 rounded-none cursor-pointer disabled:opacity-50"
                >
                  {isDeletingTag ? 'Menghapus...' : 'Hapus NFC Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
