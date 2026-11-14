import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Lock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  QrCode,
  Search,
  Eye,
  EyeOff,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DynamicQRCode, NFCTag } from '../types.ts';

interface ActivateNFCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (newTag: NFCTag) => void;
  qrcodes: DynamicQRCode[];
  initialTagUid?: string;
  initialSelectedQrId?: string;
  initialScannedPayload?: string;
}

export const ActivateNFCModal: React.FC<ActivateNFCModalProps> = ({
  isOpen,
  onClose,
  onActivated,
  qrcodes,
  initialTagUid,
  initialSelectedQrId,
  initialScannedPayload
}) => {
  const [sourceMode, setSourceMode] = useState<'qr' | 'manual'>(qrcodes.length > 0 ? 'qr' : 'manual');
  const [qrSearch, setQrSearch] = useState('');
  const [selectedQrId, setSelectedQrId] = useState<string>(initialSelectedQrId || '');
  const [syncWithQr, setSyncWithQr] = useState<boolean>(true);

  const [placeName, setPlaceName] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [isAutoUrl, setIsAutoUrl] = useState(true);
  const [suggestions, setSuggestions] = useState<Array<{ placeName: string; reviewUrl: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [tagUid, setTagUid] = useState(initialTagUid || '');
  const [notes, setNotes] = useState('');
  const [initialScanRecord, setInitialScanRecord] = useState<string | null>(initialScannedPayload || null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nfcScanStatus, setNfcScanStatus] = useState<'idle' | 'scanning' | 'detected' | 'unsupported'>('idle');
  const [nfcScanMessage, setNfcScanMessage] = useState<string | null>(null);

  const selectedQR = useMemo(
    () => qrcodes.find(q => q.id === selectedQrId) || null,
    [qrcodes, selectedQrId]
  );

  const filteredQRCodes = useMemo(() => {
    const q = qrSearch.trim().toLowerCase();
    if (!q) return qrcodes;
    return qrcodes.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      (item.code || '').toLowerCase().includes(q) ||
      item.targetUrl.toLowerCase().includes(q)
    );
  }, [qrcodes, qrSearch]);

  const applyQRData = (qr: DynamicQRCode) => {
    setSelectedQrId(qr.id);
    setSourceMode('qr');
    setPlaceName(qr.title);
    setGoogleReviewUrl(qr.targetUrl);
    setIsAutoUrl(false);
    setNotes(qr.notes || `Stand NFC terhubung ke ${qr.code || qr.slug}`);
    setErrorMessage(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (initialTagUid) setTagUid(initialTagUid);
    if (initialScannedPayload) setInitialScanRecord(initialScannedPayload);
    if (initialSelectedQrId) {
      const found = qrcodes.find(q => q.id === initialSelectedQrId);
      if (found) applyQRData(found);
    }
  }, [isOpen, initialTagUid, initialSelectedQrId, initialScannedPayload, qrcodes]);

  // Automatically read / generate Google Review URL when manual place name changes
  const handlePlaceNameChange = (val: string) => {
    setPlaceName(val);
    if (sourceMode === 'manual') {
      if (!val.trim()) {
        if (isAutoUrl) setGoogleReviewUrl('');
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (isAutoUrl) {
        const canonicalReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val.trim())}`;
        setGoogleReviewUrl(canonicalReviewUrl);
      }
    }
  };

  // Debounced lookup for manual places & branches
  useEffect(() => {
    if (sourceMode !== 'manual' || !placeName.trim() || placeName.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const res = await fetch(`/api/nfc/lookup-place?q=${encodeURIComponent(placeName.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn('Place lookup error:', err);
      } finally {
        setIsLookingUp(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [placeName, sourceMode]);

  const handleSelectSuggestion = (item: { placeName: string; reviewUrl: string }) => {
    setPlaceName(item.placeName);
    setGoogleReviewUrl(item.reviewUrl);
    setIsAutoUrl(true);
    setShowSuggestions(false);
  };

  const handleResetAutoUrl = () => {
    if (placeName.trim()) {
      const canonical = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName.trim())}`;
      setGoogleReviewUrl(canonical);
      setIsAutoUrl(true);
    }
  };

  // Process NFC tag read payload (from Web NFC NDEFReader OR simulated tap)
  const processDetectedTag = async (detectedUid: string, payloadUrl?: string, payloadText?: string) => {
    const cleanUid = detectedUid.trim().toUpperCase();
    setTagUid(cleanUid);
    const payloadStr = payloadUrl || payloadText || `UID:${cleanUid}`;
    setInitialScanRecord(payloadStr);

    try {
      const res = await fetch('/api/nfc/scan-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagUid: cleanUid,
          scannedUrl: payloadUrl,
          scannedText: payloadText,
          source: 'auto-scan'
        })
      });
      const json = await res.json();

      if (json.matchedType === 'nfc' && json.tag) {
        setNfcScanStatus('detected');
        setNfcScanMessage(`Tag NFC dengan UID ${cleanUid} sudah terdaftar atas nama "${json.tag.placeName}" dan tap baru saja direcord.`);
        return;
      }

      if (json.matchedType === 'qr' && json.qr) {
        const matchedLocal = qrcodes.find(q => q.id === json.qr.id || q.slug === json.qr.slug) || json.qr;
        applyQRData(matchedLocal);
        setNfcScanStatus('detected');
        setNfcScanMessage(`Tag NFC terbaca (UID: ${cleanUid}). Data QR "${matchedLocal.title}" otomatis dimuat!`);
        return;
      }

      setNfcScanStatus('detected');
      setNfcScanMessage(`Chip NFC berhasil terbaca (UID: ${cleanUid}). Data siap direcord saat aktivasi.`);
    } catch {
      setNfcScanStatus('detected');
      setNfcScanMessage(`UID chip terbaca: ${cleanUid}. Siap diaktivasi dan direcord.`);
    }
  };

  const handleScanPhysicalNFC = async () => {
    setErrorMessage(null);

    if (!('NDEFReader' in window)) {
      setNfcScanStatus('unsupported');
      setNfcScanMessage('Browser desktop/iOS belum mendukung Web NFC scan langsung. Gunakan tombol "Simulasi Tempel Tag" di sebelah kanan atau tempel chip di Chrome Android.');
      return;
    }

    try {
      setNfcScanStatus('scanning');
      setNfcScanMessage('Tempelkan kartu / stiker / stand NFC fisik ke bagian belakang smartphone Anda sekarang...');

      const ndef = new (window as any).NDEFReader();
      await ndef.scan();

      ndef.addEventListener('readingerror', () => {
        setNfcScanStatus('unsupported');
        setNfcScanMessage('Tag NFC tidak dapat dibaca. Coba tempelkan ulang lebih rapat.');
      });

      ndef.addEventListener('reading', async ({ serialNumber, message }: any) => {
        let detectedUrl = '';
        let detectedText = '';
        const decoder = new TextDecoder();

        if (message && Array.isArray(message.records)) {
          for (const rec of message.records) {
            try {
              if (rec.recordType === 'url') {
                detectedUrl = decoder.decode(rec.data);
              } else if (rec.recordType === 'text') {
                detectedText = decoder.decode(rec.data);
              }
            } catch {}
          }
        }

        const uid = serialNumber
          ? String(serialNumber).toUpperCase()
          : [
              '04',
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
              '80'
            ].join(':');

        await processDetectedTag(uid, detectedUrl, detectedText);
      }, { once: true });
    } catch (err: any) {
      setNfcScanStatus('unsupported');
      setNfcScanMessage(`Gagal mengaktifkan pembaca NFC: ${err?.message || 'Izin NFC ditolak'}.`);
    }
  };

  const handleSimulateTagTapRead = async () => {
    const generatedUid = [
      '04',
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      '80'
    ].join(':');

    const payloadUrl = selectedQR ? `${window.location.origin}/r/${selectedQR.slug}` : undefined;
    await processDetectedTag(generatedUid, payloadUrl, selectedQR?.title);
  };

  if (!isOpen) return null;

  const handleWebNFCWrite = async (redirectUrl: string) => {
    if (!('NDEFReader' in window)) return;
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: redirectUrl }]
      });
    } catch (err) {
      console.warn('Web NFC auto-write skipped/failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!placeName.trim() || !googleReviewUrl.trim()) {
      setErrorMessage('Pilih QR Code dari daftar atau lengkapi Nama Tempat & URL Tujuan.');
      return;
    }

    if (!pin.trim() || pin.trim().length < 4) {
      setErrorMessage('PIN keamanan NFC wajib diisi minimal 4 karakter/angka.');
      return;
    }

    let formattedUrl = googleReviewUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/nfc/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: placeName.trim(),
          googleReviewUrl: formattedUrl,
          pin: pin.trim(),
          requirePinOnTap: false,
          linkedQrId: sourceMode === 'qr' && selectedQrId ? selectedQrId : null,
          linkedQrSlug: sourceMode === 'qr' && selectedQR ? selectedQR.slug : null,
          linkedQrCode: sourceMode === 'qr' && selectedQR ? selectedQR.code || null : null,
          syncWithQr: sourceMode === 'qr' && selectedQrId ? syncWithQr : false,
          tagUid: tagUid.trim() || undefined,
          notes: notes.trim(),
          initialRecord: initialScanRecord || (tagUid.trim() ? `UID:${tagUid.trim()}` : undefined)
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.5 }
        });

        const fullRedirectUrl = `${window.location.origin}${json.redirectUrl}`;
        if ('NDEFReader' in window) {
          handleWebNFCWrite(fullRedirectUrl);
        }

        onActivated(json.data);
        onClose();
      } else {
        setErrorMessage(json.error || 'Gagal mengaktivasi NFC tag.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi gangguan koneksi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0a2318]/75 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-none shadow-xl border border-[#104F38]/30 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#104F38]/15 flex items-center justify-between bg-[#F4FAF6] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#104F38] text-[#FFE600] border border-[#104F38] flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#104F38]">
                Aktivasi Tag NFC Baru
              </h2>
              <p className="text-[11px] sm:text-xs text-[#104F38]/75">
                Ambil data langsung dari daftar QR Code, scan tag NFC otomatis, &amp; amankan dengan PIN.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal aktivasi NFC"
            className="text-[#104F38]/60 hover:text-[#104F38] p-1.5 rounded-none hover:bg-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-none flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            {/* Step 1: Auto-Read Physical NFC Tag */}
            <div className="p-3.5 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold text-[#104F38] block">
                    01. Tempel &amp; Baca Tag NFC (Otomatis Record UID &amp; Data)
                  </span>
                  <span className="text-[11px] text-[#104F38]/70">
                    Saat tag NFC ditempelkan, UID hardware dan payload langsung terbaca dan direcord saat aktivasi.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleScanPhysicalNFC}
                    className="px-3 py-1.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-[11px] font-bold rounded-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#FFE600]" />
                    <span>{nfcScanStatus === 'scanning' ? 'Menunggu Tag...' : 'Scan Tag NFC'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateTagTapRead}
                    className="px-3 py-1.5 bg-white hover:bg-[#FFE600]/20 text-[#104F38] border border-[#104F38]/25 text-[11px] font-bold rounded-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Simulasikan pembacaan UID chip NFC di desktop"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Simulasi Tempel</span>
                  </button>
                </div>
              </div>

              {nfcScanMessage && (
                <div
                  className={`p-2.5 border text-[11px] flex items-start gap-2 font-medium ${
                    nfcScanStatus === 'detected'
                      ? 'bg-white border-[#104F38]/30 text-[#104F38]'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {nfcScanStatus === 'detected' ? (
                    <Check className="w-3.5 h-3.5 text-[#104F38] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  )}
                  <span>{nfcScanMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="activateNfcUid" className="block text-[11px] font-bold text-[#104F38] mb-1">
                    Serial / UID Chip NFC
                  </label>
                  <input
                    id="activateNfcUid"
                    type="text"
                    placeholder="Terisi otomatis saat tempel tag (04:...)"
                    value={tagUid}
                    onChange={(e) => setTagUid(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none font-mono text-[#104F38]"
                  />
                </div>

                <div>
                  <label htmlFor="activateNfcNotes" className="block text-[11px] font-bold text-[#104F38] mb-1">
                    Catatan Stand / Penempatan
                  </label>
                  <input
                    id="activateNfcNotes"
                    type="text"
                    placeholder="Misal: Stand Meja Kasir 01"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none text-[#104F38]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Source Data Selector (Daftar QR Code vs Manual Google Maps) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#104F38]">
                  02. Sumber Data Tujuan Tag NFC
                </span>
                <div className="flex items-center gap-1 bg-[#F4FAF6] p-1 border border-[#104F38]/15 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSourceMode('qr')}
                    className={`px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      sourceMode === 'qr'
                        ? 'bg-[#104F38] text-[#FFE600]'
                        : 'text-[#104F38]/75 hover:text-[#104F38]'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Dari Daftar QR Code ({qrcodes.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode('manual')}
                    className={`px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      sourceMode === 'manual'
                        ? 'bg-[#104F38] text-[#FFE600]'
                        : 'text-[#104F38]/75 hover:text-[#104F38]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Input Tempat / Manual</span>
                  </button>
                </div>
              </div>

              {sourceMode === 'qr' && (
                <div className="border border-[#104F38]/20 bg-white">
                  <div className="p-2.5 bg-[#F4FAF6] border-b border-[#104F38]/15 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[#104F38]/60 shrink-0" />
                    <input
                      type="text"
                      value={qrSearch}
                      onChange={(e) => setQrSearch(e.target.value)}
                      placeholder="Cari QR Code berdasarkan kode (QR 001), judul, slug, atau URL..."
                      className="w-full bg-transparent text-xs text-[#104F38] placeholder:text-[#104F38]/45 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto divide-y divide-[#104F38]/10">
                    {filteredQRCodes.length > 0 ? (
                      filteredQRCodes.map((qr) => {
                        const isSelected = selectedQrId === qr.id;
                        return (
                          <button
                            key={qr.id}
                            type="button"
                            onClick={() => applyQRData(qr)}
                            className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected ? 'bg-[#FFE600]/25' : 'hover:bg-[#F4FAF6]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-[11px] font-mono text-[#104F38]/75">
                                <span className="font-bold text-[#104F38]">{qr.code || 'QR'}</span>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">/r/{qr.slug}</span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{qr.totalScans} pindai</span>
                              </div>
                              <div className="text-xs font-bold text-[#104F38] truncate mt-0.5">
                                {qr.title}
                              </div>
                              <div className="text-[11px] font-mono text-[#104F38]/65 truncate">
                                {qr.targetUrl}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#104F38] text-[#FFE600] text-[10px] font-bold">
                                  <Check className="w-3 h-3" /> Dipilih
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-[#104F38] underline">
                                  Gunakan Data
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-[#104F38]/65">
                        {qrcodes.length === 0
                          ? 'Belum ada QR Code di daftar. Silakan buat QR Code terlebih dahulu atau gunakan tab Input Manual.'
                          : 'Tidak ada QR Code yang cocok dengan pencarian.'}
                      </div>
                    )}
                  </div>

                  {selectedQR && (
                    <div className="px-3.5 py-2.5 bg-[#F4FAF6] border-t border-[#104F38]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <span className="text-[#104F38] font-semibold">
                        Terhubung ke QR: <strong>{selectedQR.code || selectedQR.slug}</strong> ({selectedQR.title})
                      </span>
                      <label className="flex items-center gap-1.5 text-[#104F38] font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={syncWithQr}
                          onChange={(e) => setSyncWithQr(e.target.checked)}
                          className="accent-[#104F38]"
                        />
                        <span>Sinkron otomatis jika link QR diubah</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Name & URL Fields (Auto-filled from selected QR or Manual Input) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="activateNfcPlaceName" className="block text-xs font-bold text-[#104F38]">
                    {sourceMode === 'qr' ? 'Nama Label / Tempat Tag NFC' : 'Nama Tempat di Google Review'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  {isLookingUp && sourceMode === 'manual' && (
                    <span className="text-[11px] text-[#104F38]/75 flex items-center gap-1 font-medium">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Mencari tempat...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#104F38]/50">
                    {sourceMode === 'qr' ? <QrCode className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <input
                    id="activateNfcPlaceName"
                    type="text"
                    required
                    placeholder={
                      sourceMode === 'qr'
                        ? 'Otomatis terisi saat memilih QR Code di atas...'
                        : 'Ketik nama bisnis (misal: Kopi Kenangan Senopati)...'
                    }
                    value={placeName}
                    onChange={(e) => handlePlaceNameChange(e.target.value)}
                    onFocus={() => { if (sourceMode === 'manual' && suggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] text-[#104F38] font-medium"
                  />
                </div>

                {sourceMode === 'manual' && showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#104F38]/25 rounded-none shadow-lg overflow-hidden divide-y divide-[#104F38]/10">
                    <div className="px-3 py-1.5 bg-[#F4FAF6] text-[10px] font-bold text-[#104F38]/75 flex items-center justify-between uppercase tracking-wider">
                      <span>Pilih Cabang / Tempat di Google:</span>
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="text-[#104F38]/60 hover:text-[#104F38] text-xs cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3.5 py-2 text-xs text-[#104F38] hover:bg-[#F4FAF6] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#104F38] shrink-0" />
                          <span className="font-semibold text-[#104F38] truncate">{item.placeName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#104F38] shrink-0">Pilih</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-none border border-[#104F38]/20 bg-[#F4FAF6] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="activateNfcReviewUrl" className="text-xs font-bold text-[#104F38]">
                    Tautan Tujuan Tag NFC <span className="text-rose-600">*</span>
                  </label>
                  {sourceMode === 'manual' && !isAutoUrl && (
                    <button
                      type="button"
                      onClick={handleResetAutoUrl}
                      className="text-[11px] font-bold text-[#104F38] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw className="w-3 h-3" /> Aktifkan Otomatis
                    </button>
                  )}
                </div>

                <input
                  id="activateNfcReviewUrl"
                  type="text"
                  required
                  placeholder="URL tujuan otomatis terisi dari QR Code atau Google Maps..."
                  value={googleReviewUrl}
                  onChange={(e) => {
                    setGoogleReviewUrl(e.target.value);
                    setIsAutoUrl(false);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none font-mono text-[#104F38] focus:outline-none focus:border-[#104F38]"
                />

                {googleReviewUrl && (
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] text-[#104F38]/75 truncate">
                      Tag NFC akan otomatis mengarahkan dan merecord setiap kali ditempel.
                    </span>
                    <a
                      href={googleReviewUrl.startsWith('http') ? googleReviewUrl : `https://${googleReviewUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#104F38] bg-white hover:bg-[#FFE600]/20 border border-[#104F38]/25 rounded-none transition-colors whitespace-nowrap shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Uji Tautan
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: PIN Keamanan NFC */}
            <div className="p-3.5 bg-white border border-[#104F38]/25 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#104F38]" />
                <span className="text-xs font-extrabold text-[#104F38]">
                  03. Keamanan PIN NFC Tag
                </span>
              </div>

              <div>
                <label htmlFor="activateNfcPin" className="block text-xs font-bold text-[#104F38] mb-1">
                  PIN Keamanan NFC (Minimal 4 Karakter/Angka) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#104F38]/50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="activateNfcPin"
                    type={showPin ? 'text' : 'password'}
                    required
                    minLength={4}
                    maxLength={8}
                    placeholder="Buat 4-8 digit PIN pengaman (Contoh: 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] text-[#104F38] font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(prev => !prev)}
                    aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#104F38]/60 hover:text-[#104F38] cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#104F38]/65 mt-1">
                  PIN wajib dimasukkan setiap kali mengubah data, menghapus tag, atau memprogram ulang chip NFC.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#F4FAF6] border border-[#104F38]/15 text-xs">
                <Smartphone className="w-4 h-4 text-[#104F38] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#104F38] block">
                    Tap NFC di Handphone Otomatis Tanpa PIN
                  </span>
                  <span className="text-[11px] text-[#104F38]/75">
                    Saat pelanggan menempelkan tag NFC ke smartphone, halaman Google Review langsung terbuka otomatis tanpa diminta memasukkan PIN. PIN hanya melindungi dashboard admin.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#104F38]/15">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-[#104F38]/75 hover:text-[#104F38] bg-white border border-[#104F38]/20 rounded-none cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !placeName.trim() || !googleReviewUrl.trim() || pin.trim().length < 4}
                className="px-6 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] disabled:bg-stone-200 text-[#104F38] border border-[#104F38]/25 text-xs font-bold rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Menyimpan &amp; Merekam...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#104F38]" />
                    <span>Aktivasi &amp; Kunci PIN NFC</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
