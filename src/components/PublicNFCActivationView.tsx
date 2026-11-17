import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Radio,
  Search,
  QrCode,
  Check,
  AlertCircle,
  ExternalLink,
  Copy,
  Smartphone,
  MapPin,
  RefreshCw,
  ArrowLeft,
  LogIn,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface PublicActivationQR {
  id: string;
  code: string;
  normalizedCode: string;
  slug: string;
  title: string;
  targetUrl: string;
  status: string;
  notes?: string;
  linkedNfcCount: number;
}

interface PublicNFCStatus {
  exists: boolean;
  activated: boolean;
  id: string;
  status?: string;
  placeName?: string;
  targetUrl?: string;
  linkedQrId?: string | null;
  linkedQrCode?: string | null;
}

interface ActivatedResult {
  id: string;
  tagUid: string;
  placeName: string;
  googleReviewUrl: string;
  linkedQrCode?: string | null;
  linkedQrSlug?: string | null;
  recoveryPin: string;
  redirectUrl: string;
}

interface PublicNFCActivationViewProps {
  initialNfcId?: string;
  initialQrQuery?: string;
  onBackHome: () => void;
  onOpenLogin: () => void;
}

function normalizeCodeKey(val: string): string {
  return val.replace(/[\s_-]+/g, '').toUpperCase().trim();
}

export const PublicNFCActivationView: React.FC<PublicNFCActivationViewProps> = ({
  initialNfcId,
  initialQrQuery,
  onBackHome,
  onOpenLogin
}) => {
  const [requestedTagId, setRequestedTagId] = useState<string>(initialNfcId || '');
  const [tagStatus, setTagStatus] = useState<PublicNFCStatus | null>(null);
  const [checkingTagStatus, setCheckingTagStatus] = useState<boolean>(Boolean(initialNfcId));

  const [qrList, setQrList] = useState<PublicActivationQR[]>([]);
  const [loadingQRs, setLoadingQRs] = useState<boolean>(true);
  const [codeInput, setCodeInput] = useState<string>(initialQrQuery || '');
  const [selectedQR, setSelectedQR] = useState<PublicActivationQR | null>(null);

  // Step 2 Form fields
  const [placeName, setPlaceName] = useState<string>('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>('');
  const [syncQrTarget, setSyncQrTarget] = useState<boolean>(false);
  const [tagUid, setTagUid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [initialScanRecord, setInitialScanRecord] = useState<string | null>(null);

  // Place suggestions
  const [suggestions, setSuggestions] = useState<Array<{ placeName: string; reviewUrl: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLookingUpPlace, setIsLookingUpPlace] = useState<boolean>(false);

  // Web NFC read/write state
  const [nfcScanStatus, setNfcScanStatus] = useState<'idle' | 'scanning' | 'detected' | 'unsupported'>('idle');
  const [nfcScanMessage, setNfcScanMessage] = useState<string | null>(null);
  const [nfcWriteStatus, setNfcWriteStatus] = useState<'idle' | 'writing' | 'success' | 'unsupported'>('idle');
  const [nfcWriteMessage, setNfcWriteMessage] = useState<string | null>(null);

  // Submit & result state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activatedResult, setActivatedResult] = useState<ActivatedResult | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const selectQRItem = useCallback((qr: PublicActivationQR) => {
    setSelectedQR(qr);
    setPlaceName(qr.title);
    setGoogleReviewUrl(qr.targetUrl);
    setSyncQrTarget(false);
    setNotes(qr.notes || `Aktivasi mandiri via ${qr.code}`);
    setErrorMessage(null);
  }, []);

  // Load public QR codes for activation
  useEffect(() => {
    let active = true;
    const loadQRs = async () => {
      setLoadingQRs(true);
      try {
        const res = await fetch(`/api/public/qrcodes/activation?t=${Date.now()}`, { cache: 'no-store' });
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          setQrList(json.data);
          if (initialQrQuery) {
            const norm = normalizeCodeKey(initialQrQuery);
            const exact = json.data.find((q: PublicActivationQR) => q.normalizedCode === norm);
            if (exact) {
              selectQRItem(exact);
            }
          }
        }
      } catch {
        if (active) setErrorMessage('Gagal memuat daftar kode QR dari server.');
      } finally {
        if (active) setLoadingQRs(false);
      }
    };
    void loadQRs();
    return () => {
      active = false;
    };
  }, [initialQrQuery, selectQRItem]);

  // Check status of requestedTagId (when tapped from unactivated /nfc/:id)
  useEffect(() => {
    if (!requestedTagId) {
      setTagStatus(null);
      setCheckingTagStatus(false);
      return;
    }

    let active = true;
    setCheckingTagStatus(true);
    fetch(`/api/public/nfc/status/${encodeURIComponent(requestedTagId)}?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success) {
          setTagStatus(json);
          if (!json.activated && json.linkedQrCode && !codeInput) {
            setCodeInput(json.linkedQrCode);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingTagStatus(false);
      });

    return () => {
      active = false;
    };
  }, [requestedTagId, codeInput]);

  // Filter QR codes sequentially matching user input (e.g. "QR001", "QR 001", "001")
  const filteredQRs = useMemo(() => {
    const raw = codeInput.trim();
    if (!raw) return qrList;
    const norm = normalizeCodeKey(raw);
    const lower = raw.toLowerCase();
    return qrList.filter(
      (q) =>
        (norm && q.normalizedCode.includes(norm)) ||
        q.code.toLowerCase().includes(lower) ||
        q.slug.toLowerCase().includes(lower) ||
        q.title.toLowerCase().includes(lower)
    );
  }, [qrList, codeInput]);

  // Debounced Google Maps place lookup when user edits placeName
  useEffect(() => {
    if (!selectedQR || !placeName.trim() || placeName.trim() === selectedQR.title || placeName.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUpPlace(true);
      try {
        const res = await fetch(`/api/nfc/lookup-place?q=${encodeURIComponent(placeName.trim())}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.suggestions)) {
          setSuggestions(json.suggestions);
        }
      } catch {}
      finally {
        setIsLookingUpPlace(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [placeName, selectedQR]);

  const handleScanPhysicalNFC = async () => {
    setErrorMessage(null);
    if (!('NDEFReader' in window)) {
      setNfcScanStatus('unsupported');
      setNfcScanMessage('Browser desktop/iOS belum mendukung Web NFC langsung. Anda tetap dapat mengaktivasi langsung dengan klik Kode QR di samping.');
      return;
    }

    try {
      setNfcScanStatus('scanning');
      setNfcScanMessage('Tempelkan tag NFC ke bagian belakang smartphone Anda sekarang...');
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();

      ndef.addEventListener(
        'readingerror',
        () => {
          setNfcScanStatus('unsupported');
          setNfcScanMessage('Tag NFC belum terbaca sempurna. Tempelkan kembali lebih rapat.');
        },
        { once: true }
      );

      ndef.addEventListener(
        'reading',
        async ({ serialNumber, message }: any) => {
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
          if (cleanUid) setTagUid(cleanUid);
          setInitialScanRecord(detectedUrl || detectedText || (cleanUid ? `UID:${cleanUid}` : 'Tap NFC Mandiri'));

          const idMatch = (detectedUrl || detectedText).match(/\/(?:nfc|n)\/([^/?#\s]+)/i);
          if (idMatch?.[1]) {
            setRequestedTagId(decodeURIComponent(idMatch[1]));
          }

          setNfcScanStatus('detected');
          setNfcScanMessage(
            cleanUid
              ? `Chip NFC terbaca (UID: ${cleanUid}). Lanjutkan aktivasi untuk menghubungkan ke Kode QR.`
              : 'Chip NFC terbaca dan siap diaktivasi.'
          );
        },
        { once: true }
      );
    } catch (err: any) {
      setNfcScanStatus('unsupported');
      setNfcScanMessage(`Gagal membuka pembaca NFC: ${err?.message || 'Izin NFC ditolak'}.`);
    }
  };

  const handleWriteNFCUrl = async (targetRedirectUrl: string) => {
    if (!('NDEFReader' in window)) {
      setNfcWriteStatus('unsupported');
      setNfcWriteMessage('Perangkat ini tidak mendukung penulisan chip Web NFC langsung. Salin URL di atas jika ingin menulis ke chip via aplikasi NFC Tools.');
      return;
    }

    try {
      setNfcWriteStatus('writing');
      setNfcWriteMessage('Tempelkan tag NFC ke belakang smartphone untuk menulis tautan aktif...');
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: targetRedirectUrl }]
      });
      setNfcWriteStatus('success');
      setNfcWriteMessage('Tautan aktif berhasil ditulis langsung ke chip NFC fisik Anda!');
    } catch (err: any) {
      setNfcWriteStatus('unsupported');
      setNfcWriteMessage(`Penulisan otomatis ke chip dilewati (${err?.message || 'tag digerakkan terlalu cepat'}). Anda dapat klik tombol "Tulis ke Chip NFC" lagi.`);
    }
  };

  const handleQuickCodeFind = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizeCodeKey(codeInput);
    if (!norm) return;
    const exact = qrList.find((q) => q.normalizedCode === norm || normalizeCodeKey(q.slug) === norm);
    if (exact) {
      selectQRItem(exact);
    } else if (filteredQRs.length === 1) {
      selectQRItem(filteredQRs[0]);
    } else if (filteredQRs.length === 0) {
      setErrorMessage(`Kode "${codeInput.trim()}" tidak ditemukan. Contoh kode valid: QR001, QR002, QR003.`);
    }
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedQR) {
      setErrorMessage('Silakan input kode (misal QR001) lalu klik Kode QR terlebih dahulu.');
      return;
    }

    if (!googleReviewUrl.trim()) {
      setErrorMessage('Tautan tujuan (Google Review / URL) wajib diisi.');
      return;
    }

    if (pin.trim().length > 0 && pin.trim().length < 4) {
      setErrorMessage('Jika diisi, PIN keamanan minimal 4 karakter/angka.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public/nfc/self-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedTagId: requestedTagId || undefined,
          qrId: selectedQR.id,
          qrCode: selectedQR.code,
          placeName: placeName.trim() || selectedQR.title,
          googleReviewUrl: googleReviewUrl.trim(),
          pin: pin.trim() || undefined,
          tagUid: tagUid.trim() || undefined,
          notes: notes.trim() || undefined,
          syncQrTarget,
          initialRecord: initialScanRecord || (requestedTagId ? `/nfc/${requestedTagId}` : `Aktivasi-${selectedQR.code}`)
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        setErrorMessage(json.error || 'Gagal mengaktivasi tag NFC.');
        return;
      }

      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.55 } });
      } catch {}

      const fullRedirectUrl = `${origin}${json.redirectUrl}`;
      setActivatedResult({
        id: json.data.id,
        tagUid: json.data.tagUid,
        placeName: json.data.placeName,
        googleReviewUrl: json.data.googleReviewUrl,
        linkedQrCode: json.data.linkedQrCode,
        linkedQrSlug: json.data.linkedQrSlug,
        recoveryPin: json.recoveryPin,
        redirectUrl: fullRedirectUrl
      });

      if ('NDEFReader' in window) {
        void handleWriteNFCUrl(fullRedirectUrl);
      }
    } catch {
      setErrorMessage('Terjadi gangguan koneksi server saat mengaktivasi tag NFC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetActivation = () => {
    setRequestedTagId('');
    setTagStatus(null);
    setSelectedQR(null);
    setCodeInput('');
    setPlaceName('');
    setGoogleReviewUrl('');
    setSyncQrTarget(false);
    setTagUid('');
    setNotes('');
    setPin('');
    setErrorMessage(null);
    setActivatedResult(null);
    setNfcScanStatus('idle');
    setNfcScanMessage(null);
    setNfcWriteStatus('idle');
    setNfcWriteMessage(null);
  };

  const isAlreadyActivatedTag = Boolean(tagStatus?.exists && tagStatus?.activated);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#104F38] font-sans flex flex-col">
      {/* Restricted Public Top Bar: ONLY Activation Menu Title + Beranda & Login Admin */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#104F38]/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className="flex items-center gap-2.5 text-left cursor-pointer shrink-0 whitespace-nowrap"
            >
              <div className="w-9 h-9 bg-[#104F38] border border-[#104F38] flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 text-[#FFE600]" />
              </div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#104F38] whitespace-nowrap">
                Projecttapp
              </span>
            </button>
            <span aria-hidden="true" className="text-[#104F38]/30 hidden sm:inline">/</span>
            <span className="text-xs sm:text-sm font-bold text-[#104F38]/80 truncate hidden sm:inline">
              Menu Aktivasi Tag NFC Mandiri
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBackHome}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-[#104F38] bg-white hover:bg-[#F4FAF6] border border-[#104F38]/20 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Beranda</span>
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-bold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/25 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Admin</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* Page Heading */}
        <div className="bg-white border border-[#104F38]/20 p-5 sm:p-7 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#104F38]/75 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#104F38]" />
            <span>Aktivasi Mandiri Tanpa Username &amp; Password</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#104F38] leading-tight [text-wrap:balance]">
            Aktivasi Tag NFC dengan Kode QR
          </h1>
          <p className="text-xs sm:text-sm text-[#104F38]/80 leading-relaxed max-w-3xl font-medium">
            Masukkan kode produk Anda (contoh: <span className="font-mono font-bold text-[#104F38]">QR001</span>,{' '}
            <span className="font-mono font-bold text-[#104F38]">QR002</span>, dan seterusnya) lalu klik Kode QR untuk
            mengaktivasi tag NFC Anda secara langsung tanpa login admin.
          </p>
        </div>

        {/* Detected NFC Tag Banner (when arriving from unactivated /nfc/:id tap) */}
        {requestedTagId && (
          <div className="bg-white border border-[#104F38]/25 p-4 sm:p-5">
            {checkingTagStatus ? (
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#104F38]/75">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memeriksa status Tag NFC /nfc/{requestedTagId}...</span>
              </div>
            ) : isAlreadyActivatedTag && tagStatus ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-[#104F38] flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#104F38]" />
                    <span>Tag NFC /nfc/{tagStatus.id} Sudah Aktif</span>
                  </div>
                  <p className="text-xs text-[#104F38]/75">
                    Terdaftar untuk <strong>{tagStatus.placeName}</strong>
                    {tagStatus.linkedQrCode ? ` (${tagStatus.linkedQrCode})` : ''}. Saat ditempelkan di smartphone, tag ini langsung mengarah ke tautan tujuan.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {tagStatus.targetUrl && (
                    <a
                      href={tagStatus.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Link Tujuan</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleResetActivation}
                    className="px-4 py-2 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    Aktivasi Tag Lain
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-[#104F38] font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#104F38] shrink-0" />
                  <span>
                    Tag NFC <span className="font-mono font-bold">/nfc/{requestedTagId}</span> belum teraktivasi. Silakan masukkan &amp; klik Kode QR di bawah untuk mengaktifkannya sekarang.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SUCCESS VIEW AFTER ACTIVATION */}
        {activatedResult ? (
          <div className="bg-white border border-[#104F38]/30 p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-[#104F38] text-[#FFE600] flex items-center justify-center shrink-0">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-[#104F38]">
                  Tag NFC Berhasil Diaktivasi!
                </h2>
                <p className="text-xs sm:text-sm text-[#104F38]/80 font-medium">
                  Stand / Chip NFC untuk <strong>{activatedResult.placeName}</strong> kini aktif terhubung ke{' '}
                  <span className="font-mono font-bold text-[#104F38]">{activatedResult.linkedQrCode || 'QR Code'}</span>.
                  Saat pelanggan menempelkan HP, halaman tujuan langsung terbuka otomatis tanpa PIN.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F4FAF6] border border-[#104F38]/15 p-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#104F38]/65 uppercase tracking-wider block">
                  Alamat NFC Aktif
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#104F38] truncate">{activatedResult.redirectUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activatedResult.redirectUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2 py-1 bg-white border border-[#104F38]/20 text-[11px] font-bold text-[#104F38] hover:bg-[#FFE600]/30 cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#104F38]/65 uppercase tracking-wider block">
                  Tautan Tujuan (Langsung Saat Tap)
                </span>
                <a
                  href={activatedResult.googleReviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-semibold text-[#104F38] hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{activatedResult.googleReviewUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#104F38]/65 uppercase tracking-wider block">
                  UID Chip NFC
                </span>
                <span className="font-mono font-bold text-[#104F38] tabular-nums">{activatedResult.tagUid}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#104F38]/65 uppercase tracking-wider block">
                  PIN Pengaman Pengeditan Tag (Catat)
                </span>
                <span className="font-mono font-extrabold text-[#104F38] bg-[#FFE600] px-2 py-0.5 inline-block tabular-nums">
                  {activatedResult.recoveryPin}
                </span>
              </div>
            </div>

            {nfcWriteMessage && (
              <div className="p-3 bg-white border border-[#104F38]/20 text-xs text-[#104F38] flex items-center gap-2">
                <Radio className="w-4 h-4 shrink-0" />
                <span>{nfcWriteMessage}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#104F38]/15">
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={activatedResult.redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#FFE600]" />
                  <span>Uji Buka Link NFC</span>
                </a>
                <button
                  type="button"
                  onClick={() => void handleWriteNFCUrl(activatedResult.redirectUrl)}
                  disabled={nfcWriteStatus === 'writing'}
                  className="px-4 py-2.5 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{nfcWriteStatus === 'writing' ? 'Menempel Tag...' : 'Tulis ke Chip NFC'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetActivation}
                className="px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 text-xs font-bold cursor-pointer"
              >
                Aktivasi Tag NFC Lain
              </button>
            </div>
          </div>
        ) : (
          !isAlreadyActivatedTag && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Input Kode (QR001...) & Klik Kode QR */}
              <div className="lg:col-span-5 bg-white border border-[#104F38]/20 p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-[#104F38] block">
                    01. Input &amp; Klik Kode QR (Contoh: QR001)
                  </span>
                  <p className="text-[11px] text-[#104F38]/70">
                    Ketik kode QR pada produk Anda, lalu klik kode QR yang tampil untuk memilihnya.
                  </p>
                </div>

                <form onSubmit={handleQuickCodeFind} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Masukkan kode (misal: QR001, QR002...)"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#104F38]/25 focus:outline-none focus:border-[#104F38] text-[#104F38] font-mono font-bold uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-[#104F38]/45"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-[#FFE600] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Cari Kode
                  </button>
                </form>

                {/* Clickable QR Code List */}
                <div className="border border-[#104F38]/15 divide-y divide-[#104F38]/10 max-h-[420px] overflow-y-auto">
                  {loadingQRs ? (
                    <div className="p-6 text-center text-xs text-[#104F38]/65">
                      Memuat daftar kode QR...
                    </div>
                  ) : filteredQRs.length > 0 ? (
                    filteredQRs.map((qr) => {
                      const isSelected = selectedQR?.id === qr.id;
                      return (
                        <button
                          key={qr.id}
                          type="button"
                          onClick={() => selectQRItem(qr)}
                          className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFE600]/25'
                              : 'bg-white hover:bg-[#F4FAF6]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-[#104F38] text-[#FFE600] font-mono text-xs font-extrabold tracking-wide shrink-0">
                                {qr.code}
                              </span>
                              <span className="text-[11px] font-mono text-[#104F38]/65 truncate">
                                /r/{qr.slug}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-[#104F38] truncate">
                              {qr.title}
                            </div>
                            <div className="text-[11px] font-mono text-[#104F38]/60 truncate">
                              {qr.targetUrl}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#104F38] text-[#FFE600] text-[11px] font-bold">
                                <Check className="w-3.5 h-3.5" /> Dipilih
                              </span>
                            ) : (
                              <span className="px-2.5 py-1.5 border border-[#104F38]/25 bg-[#F4FAF6] text-[#104F38] text-[11px] font-bold">
                                Klik QR
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <QrCode className="w-6 h-6 text-[#104F38]/40 mx-auto" />
                      <div className="text-xs font-bold text-[#104F38]">
                        Kode &ldquo;{codeInput}&rdquo; tidak ditemukan
                      </div>
                      <p className="text-[11px] text-[#104F38]/65">
                        Coba ketik kode seperti QR001, QR002, QR003, atau kosongkan pencarian untuk melihat semua kode QR.
                      </p>
                      {codeInput && (
                        <button
                          type="button"
                          onClick={() => setCodeInput('')}
                          className="px-3 py-1.5 text-xs font-bold text-[#104F38] border border-[#104F38]/25 bg-[#F4FAF6] cursor-pointer"
                        >
                          Tampilkan Semua Kode
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Activation Form after Clicking QR Code */}
              <div className="lg:col-span-7 bg-white border border-[#104F38]/20 p-5 sm:p-6">
                {!selectedQR ? (
                  <div className="py-14 px-4 text-center space-y-3">
                    <div className="w-12 h-12 bg-[#F4FAF6] border border-[#104F38]/20 flex items-center justify-center mx-auto text-[#104F38]">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-extrabold text-[#104F38]">
                      Klik Kode QR untuk Memulai Aktivasi
                    </h2>
                    <p className="text-xs text-[#104F38]/75 max-w-md mx-auto leading-relaxed">
                      Ketik kode pada kolom sebelah kiri (misal <span className="font-mono font-bold">QR001</span>) lalu
                      klik tombol kode QR yang sesuai untuk mengisi detail Google Review &amp; mengaktifkan tag NFC Anda.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleActivateSubmit} className="space-y-5">
                    <div className="pb-3.5 border-b border-[#104F38]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-[#104F38] block">
                          02. Detail Aktivasi untuk {selectedQR.code}
                        </span>
                        <span className="text-[11px] text-[#104F38]/70">
                          Terhubung ke tautan dinamis /r/{selectedQR.slug}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-[#104F38] text-[#FFE600] font-mono text-xs font-extrabold self-start sm:self-auto">
                        {selectedQR.code}
                      </span>
                    </div>

                    {/* Optional Web NFC Scan Box */}
                    <div className="p-3.5 bg-[#F4FAF6] border border-[#104F38]/15 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-[#104F38] block">
                            Tempel Tag NFC Fisik (Opsional di Chrome Android)
                          </span>
                          <span className="text-[11px] text-[#104F38]/70">
                            {requestedTagId
                              ? `ID Tag terdeteksi: /nfc/${requestedTagId}`
                              : 'Atau langsung isi data di bawah untuk membuat & mengaktifkan link NFC.'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleScanPhysicalNFC}
                          className="px-3 py-2 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                        >
                          <Radio className="w-3.5 h-3.5 text-[#FFE600]" />
                          <span>{nfcScanStatus === 'scanning' ? 'Menunggu Tag...' : 'Scan Chip NFC'}</span>
                        </button>
                      </div>

                      {nfcScanMessage && (
                        <div className="p-2.5 bg-white border border-[#104F38]/20 text-[11px] text-[#104F38] font-medium">
                          {nfcScanMessage}
                        </div>
                      )}
                    </div>

                    {/* Business Name / Place Name */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="selfActPlaceName" className="block text-xs font-bold text-[#104F38]">
                          Nama Toko / Usaha / Stand <span className="text-rose-600">*</span>
                        </label>
                        {isLookingUpPlace && (
                          <span className="text-[11px] text-[#104F38]/70 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Mencari di Maps...
                          </span>
                        )}
                      </div>
                      <input
                        id="selfActPlaceName"
                        type="text"
                        required
                        value={placeName}
                        onChange={(e) => {
                          setPlaceName(e.target.value);
                          setShowSuggestions(true);
                        }}
                        placeholder="Contoh: Kopi Nusantara Cabang Kemang"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#104F38]/25 focus:outline-none focus:border-[#104F38] text-[#104F38] font-semibold"
                      />

                      {showSuggestions && suggestions.length > 0 && (
                        <div className="mt-1 bg-white border border-[#104F38]/25 divide-y divide-[#104F38]/10">
                          <div className="px-3 py-1.5 bg-[#F4FAF6] text-[10px] font-bold text-[#104F38]/70 flex items-center justify-between">
                            <span>Rekomendasi Google Maps (Klik untuk isi URL Review):</span>
                            <button
                              type="button"
                              onClick={() => setShowSuggestions(false)}
                              className="underline cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>
                          {suggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPlaceName(item.placeName);
                                setGoogleReviewUrl(item.reviewUrl);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-[#104F38] hover:bg-[#F4FAF6] flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5 truncate font-semibold">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{item.placeName}</span>
                              </span>
                              <span className="text-[10px] font-bold underline shrink-0">Pilih</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Google Review / Destination URL */}
                    <div className="space-y-2">
                      <label htmlFor="selfActReviewUrl" className="block text-xs font-bold text-[#104F38]">
                        Link Google Review / Tujuan Saat Di-Tap <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="selfActReviewUrl"
                        type="text"
                        required
                        value={googleReviewUrl}
                        onChange={(e) => setGoogleReviewUrl(e.target.value)}
                        placeholder="https://g.page/r/..."
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#104F38]/25 focus:outline-none focus:border-[#104F38] text-[#104F38] font-mono"
                      />
                      <label className="flex items-center gap-2 text-xs text-[#104F38]/85 font-semibold cursor-pointer select-none pt-0.5">
                        <input
                          type="checkbox"
                          checked={syncQrTarget}
                          onChange={(e) => setSyncQrTarget(e.target.checked)}
                          className="accent-[#104F38]"
                        />
                        <span>Perbarui juga link tujuan {selectedQR.code} agar sama dengan link NFC ini</span>
                      </label>
                    </div>

                    {/* Optional UID + Optional PIN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="selfActUid" className="block text-xs font-bold text-[#104F38] mb-1">
                          UID Chip NFC (Opsional)
                        </label>
                        <input
                          id="selfActUid"
                          type="text"
                          value={tagUid}
                          onChange={(e) => setTagUid(e.target.value)}
                          placeholder="Otomatis jika kosong"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 font-mono text-[#104F38]"
                        />
                      </div>

                      <div>
                        <label htmlFor="selfActPin" className="block text-xs font-bold text-[#104F38] mb-1">
                          PIN Ubah Link Nanti (Opsional, 4-8 Digit)
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-[#104F38]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="selfActPin"
                            type={showPin ? 'text' : 'password'}
                            maxLength={8}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Kosong = PIN otomatis"
                            className="w-full pl-8 pr-9 py-2 text-xs bg-white border border-[#104F38]/25 font-mono text-[#104F38]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin((p) => !p)}
                            aria-label={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#104F38]/60 hover:text-[#104F38] cursor-pointer"
                          >
                            {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/15 text-[11px] text-[#104F38]/80 flex items-start gap-2">
                      <Smartphone className="w-4 h-4 text-[#104F38] shrink-0 mt-0.5" />
                      <span>
                        Setelah aktif, pelanggan yang menempelkan HP ke tag NFC Anda akan{' '}
                        <strong className="text-[#104F38]">langsung diarahkan ke link Google Review</strong> secara otomatis tanpa perlu memasukkan PIN.
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#104F38]/15 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedQR(null)}
                        className="px-4 py-2.5 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 text-xs font-bold cursor-pointer"
                      >
                        Pilih Kode Lain
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !googleReviewUrl.trim()}
                        className="px-6 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] disabled:bg-stone-200 text-[#104F38] border border-[#104F38]/25 text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSubmitting ? 'Mengaktivasi...' : `Aktivasi Tag (${selectedQR.code})`}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )
        )}
      </main>

      <footer className="border-t border-[#104F38]/10 bg-white py-5 text-xs text-[#104F38]/65">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-extrabold text-[#104F38]">Projecttapp 2026</span>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBackHome} className="hover:text-[#104F38] hover:underline cursor-pointer">
              Kembali ke Beranda
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={onOpenLogin} className="font-bold text-[#104F38] hover:underline cursor-pointer">
              Login Admin Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
