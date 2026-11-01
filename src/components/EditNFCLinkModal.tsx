import React, { useState, useEffect } from 'react';
import { Lock, MapPin, ExternalLink, ShieldCheck, Check, ArrowRight, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { NFCTag } from '../types.ts';

interface EditNFCLinkModalProps {
  tag: NFCTag;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedTag: NFCTag) => void;
}

export const EditNFCLinkModal: React.FC<EditNFCLinkModalProps> = ({
  tag,
  isOpen,
  onClose,
  onUpdated
}) => {
  const [placeName, setPlaceName] = useState(tag.placeName);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(tag.googleReviewUrl);
  const [isAutoUrl, setIsAutoUrl] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ placeName: string; reviewUrl: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [notes, setNotes] = useState(tag.notes || '');
  const [status, setStatus] = useState<'active' | 'locked'>(tag.status === 'locked' ? 'locked' : 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate review link when place name changes and auto is toggled
  const handlePlaceNameChange = (val: string) => {
    setPlaceName(val);
    if (isAutoUrl && val.trim()) {
      setGoogleReviewUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val.trim())}`);
    }
  };

  const handleApplyAutoReviewUrl = () => {
    if (placeName.trim()) {
      const canonical = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName.trim())}`;
      setGoogleReviewUrl(canonical);
      setIsAutoUrl(true);
    }
  };

  // Debounced search for place lookup
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
        }
      } catch (err) {
        console.warn('Place lookup error', err);
      } finally {
        setIsLookingUp(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [placeName]);

  const handleSelectSuggestion = (item: { placeName: string; reviewUrl: string }) => {
    setPlaceName(item.placeName);
    setGoogleReviewUrl(item.reviewUrl);
    setIsAutoUrl(true);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMessage('Wajib memasukkan PIN NFC Tag untuk verifikasi keamanan.');
      return;
    }

    let formattedUrl = googleReviewUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/nfc/${tag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: placeName.trim(),
          googleReviewUrl: formattedUrl,
          pin: pin.trim(),
          newPin: newPin.trim() || undefined,
          status,
          notes: notes.trim()
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
        onUpdated(json.data);
        onClose();
      } else {
        setErrorMessage(json.error || 'PIN NFC Tag tidak sesuai.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi gangguan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                NFC Tag ID: {tag.id}
              </span>
              <span className="text-xs text-slate-500 font-mono">UID: {tag.tagUid}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Ubah Data NFC Tag Google Review
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Security Alert */}
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Perubahan diarahkan langsung tanpa perlu menulis ulang chip fisik NFC. Masukkan <strong>PIN NFC Tag</strong> yang Anda buat untuk verifikasi.
          </span>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Nama Tempat */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Nama Tempat di Google Review
              </label>
              {isLookingUp && (
                <span className="text-[10px] text-sky-600 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Mencari...
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
                value={placeName}
                onChange={(e) => handlePlaceNameChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
              />
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100">
                <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 flex justify-between">
                  <span>Saran Tempat Google:</span>
                  <button type="button" onClick={() => setShowSuggestions(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-900 flex items-center justify-between"
                  >
                    <span className="truncate">{item.placeName}</span>
                    <span className="text-[10px] text-sky-600 bg-sky-50 px-1 py-0.5 rounded">Gunakan</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tautan Google Review */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Tautan Google Review (Tujuan Dinamis)
              </label>
              <button
                type="button"
                onClick={handleApplyAutoReviewUrl}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Otomatiskan dari Nama Tempat
              </button>
            </div>
            <input
              type="text"
              required
              value={googleReviewUrl}
              onChange={(e) => {
                setGoogleReviewUrl(e.target.value);
                setIsAutoUrl(false);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-900"
            />
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-500">
                {isAutoUrl ? '✓ Terhubung otomatis dari nama tempat' : 'Tautan saat ini'}
              </span>
              {googleReviewUrl && (
                <a
                  href={googleReviewUrl.startsWith('http') ? googleReviewUrl : `https://${googleReviewUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Tes Buka Review
                </a>
              )}
            </div>
          </div>

          {/* PIN Verification (Required) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Masukkan PIN NFC Tag Anda <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Masukkan PIN saat aktivasi tag..."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ubah ke PIN Baru (Opsional)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika PIN tetap"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Status Tag NFC
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="active">Aktif (Bisa Di-tap)</option>
                  <option value="locked">Dikunci (Nonaktif Sementara)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Penempatan Stand
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !pin.trim()}
              className="px-6 py-2 bg-[#FFE600] hover:bg-[#F2DA00] disabled:bg-stone-200 text-[#104F38] border border-[#104F38]/20 text-xs font-bold rounded-none shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#104F38]" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
