import React, { useState, useEffect } from 'react';
import { Radio, Lock, MapPin, ExternalLink, ShieldCheck, Check, AlertCircle, RefreshCw, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { NFCTag } from '../types.ts';

interface ActivateNFCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (newTag: NFCTag) => void;
}

export const ActivateNFCModal: React.FC<ActivateNFCModalProps> = ({
  isOpen,
  onClose,
  onActivated
}) => {
  const [placeName, setPlaceName] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [isAutoUrl, setIsAutoUrl] = useState(true);
  const [suggestions, setSuggestions] = useState<Array<{ placeName: string; reviewUrl: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [pin, setPin] = useState('');
  const [tagUid, setTagUid] = useState('');
  const [notes, setNotes] = useState('Akrilik Stand Google Review Meja Kasir');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nfcWritingStatus, setNfcWritingStatus] = useState<'idle' | 'scanning' | 'success' | 'unsupported'>('idle');
  const [nfcWriteMessage, setNfcWriteMessage] = useState<string | null>(null);

  // Automatically read / generate Google Review URL when place name changes
  const handlePlaceNameChange = (val: string) => {
    setPlaceName(val);
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
  };

  // Debounced lookup for real places & branches
  useEffect(() => {
    if (!placeName.trim() || placeName.trim().length < 2) {
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
  }, [placeName]);

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

  if (!isOpen) return null;

  // Web NFC Scan & Write if supported on Chrome Android
  const handleWebNFCWrite = async (redirectUrl: string) => {
    if (!('NDEFReader' in window)) {
      setNfcWritingStatus('unsupported');
      setNfcWriteMessage('Web NFC hanya didukung di Google Chrome Android. Anda juga dapat menggunakan aplikasi "NFC Tools" gratis di Play Store / App Store dengan menyalin URL di bawah.');
      return;
    }

    try {
      setNfcWritingStatus('scanning');
      setNfcWriteMessage('Dekatkan chip / kartu NFC fisik ke bagian belakang smartphone Anda sekarang...');
      
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [
          { recordType: 'url', data: redirectUrl }
        ]
      });

      setNfcWritingStatus('success');
      setNfcWriteMessage('Berhasil! URL telah ditulis ke dalam chip NFC fisik.');
    } catch (err: any) {
      console.warn('Web NFC error:', err);
      setNfcWritingStatus('unsupported');
      setNfcWriteMessage(`Gagal menulis: ${err.message || 'Izin NFC ditolak atau tag bergerak terlalu cepat'}. Gunakan URL langsung.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!placeName.trim() || !googleReviewUrl.trim() || !pin.trim()) {
      setErrorMessage('Nama tempat, link Google Review, dan PIN NFC wajib diisi.');
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
          tagUid: tagUid.trim() || undefined,
          notes: notes.trim()
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
        // Attempt web nfc write if possible
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
        className="relative w-full max-w-xl bg-white rounded-none shadow-xl border border-[#104F38]/30 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#104F38]/15 flex items-center justify-between bg-[#F4FAF6] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#104F38] text-[#FFE600] border border-[#104F38] flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#104F38]">
                Aktivasi &amp; Input NFC Tag Google Review
              </h2>
              <p className="text-[11px] sm:text-xs text-[#104F38]/75">
                Cukup ketik Nama Tempat, tautan ulasan Google Review otomatis terhubung.
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
          {/* Explainer Banner */}
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-5 p-3 sm:p-4 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none flex items-start gap-2.5 sm:gap-3">
            <ShieldCheck className="w-4 h-4 text-[#104F38] mt-0.5 shrink-0" />
            <div className="text-xs text-[#104F38] leading-relaxed space-y-0.5">
              <strong className="font-bold block text-[#104F38]">
                Otomatisasi Tautan Google Review &amp; Kunci PIN
              </strong>
              <span className="text-[11px] sm:text-xs text-[#104F38]/80">
                Ketik <strong>Nama Tempat</strong>, sistem akan <strong>otomatis membaca dan menyusun tautan Google Review</strong>. Stand NFC fisik cukup diprogram sekali dengan URL dinamis dan dilindungi <strong>PIN</strong>.
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-none flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* 1. Nama Tempat di Google Review dengan Autocomplete & Auto-read */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="activateNfcPlaceName" className="block text-xs font-bold text-[#104F38]">
                Nama Tempat di Google Review <span className="text-rose-600">*</span>
              </label>
              {isLookingUp && (
                <span className="text-[11px] text-[#104F38]/75 flex items-center gap-1 font-medium">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Mencari tempat...
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#104F38]/50">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="activateNfcPlaceName"
                type="text"
                required
                autoFocus
                placeholder="Ketik nama bisnis (misal: Kopi Kenangan Senopati / Warung Bu Kris)..."
                value={placeName}
                onChange={(e) => handlePlaceNameChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] text-[#104F38] font-medium"
              />
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
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
                    <span className="text-[10px] font-bold text-[#104F38] shrink-0">
                      Pilih
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-[#104F38]/65 mt-1">
              Ketik nama tempat atau cabang. Tautan ulasan Google akan otomatis dibaca dan dibuatkan di bawah.
            </p>
          </div>

          {/* 2. Link Google Review (Auto-generated & Verified) */}
          <div className="p-3.5 rounded-none border border-[#104F38]/20 bg-[#F4FAF6] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="activateNfcReviewUrl" className="text-xs font-bold text-[#104F38]">
                Tautan Google Review (Otomatis Membaca) <span className="text-rose-600">*</span>
              </label>

              {!isAutoUrl ? (
                <button
                  type="button"
                  onClick={handleResetAutoUrl}
                  className="text-[11px] font-bold text-[#104F38] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3" /> Aktifkan Otomatis
                </button>
              ) : (
                <span className="text-[10px] font-bold text-[#104F38] flex items-center gap-1 whitespace-nowrap">
                  <Check className="w-3 h-3" /> Sinkron Otomatis
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="activateNfcReviewUrl"
                type="text"
                required
                placeholder="Tautan ulasan akan otomatis muncul saat nama tempat diisi..."
                value={googleReviewUrl}
                onChange={(e) => {
                  setGoogleReviewUrl(e.target.value);
                  setIsAutoUrl(false);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none font-mono text-[#104F38] focus:outline-none focus:border-[#104F38]"
              />
            </div>

            {/* Live Test & Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-[#104F38]/75">
                {placeName.trim() ? (
                  <span className="text-[#104F38] font-semibold">
                    Terhubung ke ulasan Google untuk <strong>{placeName}</strong>
                  </span>
                ) : (
                  <span>Isi nama tempat di atas untuk menghubungkan tautan review.</span>
                )}
              </p>

              {googleReviewUrl && (
                <a
                  href={googleReviewUrl.startsWith('http') ? googleReviewUrl : `https://${googleReviewUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#104F38] bg-white hover:bg-[#FFE600]/20 border border-[#104F38]/25 rounded-none transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="w-3 h-3" />
                  Uji Buka Google Review
                </a>
              )}
            </div>
          </div>

          {/* 3. PIN NFC Tag */}
          <div>
            <label htmlFor="activateNfcPin" className="block text-xs font-bold text-[#104F38] mb-1">
              PIN NFC Tag (Keamanan &amp; Pembaruan) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#104F38]/50">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="activateNfcPin"
                type="password"
                required
                maxLength={8}
                placeholder="Buat 4-6 angka PIN pengaman (Contoh: 1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] text-[#104F38] font-mono"
              />
            </div>
            <p className="text-[11px] text-[#104F38]/65 mt-1">
              PIN ini wajib dimasukkan setiap kali Anda ingin mengubah tautan review atau nama tempat agar tidak diubah sembarang orang.
            </p>
          </div>

          {/* 4. UID Chip NFC Fisik (Opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="activateNfcUid" className="block text-xs font-bold text-[#104F38] mb-1">
                Serial / UID Chip NFC (Opsional)
              </label>
              <input
                id="activateNfcUid"
                type="text"
                placeholder="Otomatis jika dikosongkan (04:...)"
                value={tagUid}
                onChange={(e) => setTagUid(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none font-mono text-[#104F38]"
              />
            </div>

            <div>
              <label htmlFor="activateNfcNotes" className="block text-xs font-bold text-[#104F38] mb-1">
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

          {/* Web NFC Scanning Info if active */}
          {nfcWriteMessage && (
            <div className={`p-3 rounded-none border text-xs flex items-start gap-2 ${
              nfcWritingStatus === 'success'
                ? 'bg-[#F4FAF6] border-[#104F38]/30 text-[#104F38]'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{nfcWriteMessage}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#104F38]/15">
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
              disabled={isSubmitting || !placeName.trim() || !googleReviewUrl.trim() || !pin.trim()}
              className="px-6 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] disabled:bg-stone-200 text-[#104F38] border border-[#104F38]/25 text-xs font-bold rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#104F38]" />
                  <span>Aktivasi NFC Tag</span>
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
