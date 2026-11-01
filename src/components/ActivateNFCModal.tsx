import React, { useState, useEffect } from 'react';
import { Radio, Lock, MapPin, ExternalLink, ShieldCheck, Check, Smartphone, AlertCircle, Copy, Sparkles, Search, RefreshCw } from 'lucide-react';
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
    if (!placeName.trim() || !googleReviewUrl.trim() || !pin.trim()) {
      alert('Nama tempat, link Google Review, dan PIN NFC wajib diisi!');
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
        alert(json.error || 'Gagal mengaktivasi NFC tag.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi gangguan koneksi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Aktivasi & Input NFC Tag Google Review
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Cukup ketik Nama Tempat, tautan ulasan Google Review otomatis terhubung.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1">
          {/* Explainer Banner */}
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-5 p-3 sm:p-4 bg-sky-50/80 border border-sky-200/90 rounded-xl flex items-start gap-2.5 sm:gap-3">
            <ShieldCheck className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />
            <div className="text-xs text-sky-950 leading-relaxed space-y-0.5">
              <strong className="font-semibold block text-sky-950">
                Otomatisasi Tautan Google Review & Kunci PIN
              </strong>
              <span className="text-[11px] sm:text-xs">
                Ketik <strong>Nama Tempat</strong>, sistem akan <strong>otomatis membaca dan menyusun tautan Google Review</strong>. Stand NFC fisik cukup diprogram sekali dengan URL dinamis dan dilindungi <strong>PIN</strong>.
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* 1. Nama Tempat di Google Review dengan Autocomplete & Auto-read */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Nama Tempat di Google Review <span className="text-rose-500">*</span>
              </label>
              {isLookingUp && (
                <span className="text-[11px] text-sky-600 flex items-center gap-1 font-medium">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Mencari tempat...
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ketik nama bisnis (misal: Kopi Kenangan Senopati / Warung Bu Kris)..."
                value={placeName}
                onChange={(e) => handlePlaceNameChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
              />
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider">
                  <span>Pilih Cabang / Tempat di Google:</span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Tutup ✕
                  </button>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-900 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">{item.placeName}</span>
                    </div>
                    <span className="text-[10px] text-sky-600 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded shrink-0">
                      Pilih
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-1">
              Ketik nama tempat atau cabang. Tautan ulasan Google akan otomatis dibaca dan dibuatkan di bawah.
            </p>
          </div>

          {/* 2. Link Google Review (Auto-generated & Verified) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <label className="text-xs font-bold text-slate-800">
                  Tautan Google Review (Otomatis Membaca) <span className="text-rose-500">*</span>
                </label>
              </div>

              {!isAutoUrl ? (
                <button
                  type="button"
                  onClick={handleResetAutoUrl}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Aktifkan Otomatis
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Sinkron Otomatis
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                required
                placeholder="Tautan ulasan akan otomatis muncul saat nama tempat diisi..."
                value={googleReviewUrl}
                onChange={(e) => {
                  setGoogleReviewUrl(e.target.value);
                  setIsAutoUrl(false);
                }}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 ${
                  isAutoUrl ? 'border-emerald-300 ring-emerald-500/20' : 'border-slate-300 focus:ring-sky-500'
                }`}
              />
            </div>

            {/* Live Test & Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-slate-500">
                {placeName.trim() ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ Terhubung ke ulasan Google untuk <strong>{placeName}</strong>
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-300 rounded-lg shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Uji Buka Google Review
                </a>
              )}
            </div>
          </div>

          {/* 3. PIN NFC Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              PIN NFC Tag (Keamanan & Pembaruan) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                maxLength={8}
                placeholder="Buat 4-6 angka PIN pengaman (Contoh: 1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              PIN ini wajib dimasukkan setiap kali Anda ingin mengubah tautan review atau nama tempat agar tidak diubah sembarang orang.
            </p>
          </div>

          {/* 4. UID Chip NFC Fisik (Opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serial / UID Chip NFC (Opsional)
              </label>
              <input
                type="text"
                placeholder="Otomatis jika dikosongkan (04:...)"
                value={tagUid}
                onChange={(e) => setTagUid(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Stand / Penempatan
              </label>
              <input
                type="text"
                placeholder="Misal: Stand Meja Kasir 01"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700"
              />
            </div>
          </div>

          {/* Web NFC Scanning Info if active */}
          {nfcWriteMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              nfcWritingStatus === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{nfcWriteMessage}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !placeName.trim() || !googleReviewUrl.trim() || !pin.trim()}
              className="px-6 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] disabled:bg-stone-200 text-[#104F38] border border-[#104F38]/20 text-xs font-bold rounded-none shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
