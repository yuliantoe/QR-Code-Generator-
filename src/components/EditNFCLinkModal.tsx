import React, { useState, useEffect } from 'react';
import { Lock, MapPin, ExternalLink, Check, AlertTriangle, RefreshCw, X, Eye, EyeOff, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DynamicQRCode, NFCTag } from '../types.ts';

interface EditNFCLinkModalProps {
  tag: NFCTag;
  qrcodes: DynamicQRCode[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedTag: NFCTag) => void;
}

export const EditNFCLinkModal: React.FC<EditNFCLinkModalProps> = ({
  tag,
  qrcodes,
  isOpen,
  onClose,
  onUpdated
}) => {
  const [placeName, setPlaceName] = useState(tag.placeName);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(tag.googleReviewUrl);
  const [linkedQrId, setLinkedQrId] = useState<string>(tag.linkedQrId || '');
  const [linkedQrSlug, setLinkedQrSlug] = useState<string>(tag.linkedQrSlug || '');
  const [linkedQrCode, setLinkedQrCode] = useState<string>(tag.linkedQrCode || '');
  const [syncWithQr, setSyncWithQr] = useState<boolean>(tag.syncWithQr ?? Boolean(tag.linkedQrId));

  const [isAutoUrl, setIsAutoUrl] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ placeName: string; reviewUrl: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [notes, setNotes] = useState(tag.notes || '');
  const [status, setStatus] = useState<'active' | 'locked'>(tag.status === 'locked' ? 'locked' : 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSelectLinkedQR = (qrId: string) => {
    setLinkedQrId(qrId);
    if (!qrId) {
      setLinkedQrSlug('');
      setLinkedQrCode('');
      setSyncWithQr(false);
      return;
    }
    const found = qrcodes.find(q => q.id === qrId);
    if (found) {
      setPlaceName(found.title);
      setGoogleReviewUrl(found.targetUrl);
      setLinkedQrSlug(found.slug);
      setLinkedQrCode(found.code || '');
      setSyncWithQr(true);
      setIsAutoUrl(false);
    }
  };

  useEffect(() => {
    if (!placeName.trim() || placeName.trim().length < 2 || linkedQrId) {
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
  }, [placeName, linkedQrId]);

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

    if (newPin.trim() && newPin.trim().length < 4) {
      setErrorMessage('PIN baru minimal 4 karakter/angka.');
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
          requirePinOnTap: false,
          linkedQrId: linkedQrId || null,
          linkedQrSlug: linkedQrSlug || null,
          linkedQrCode: linkedQrCode || null,
          syncWithQr: linkedQrId ? syncWithQr : false,
          status,
          notes: notes.trim(),
          tagData: tag
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0a2318]/75 overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white rounded-none shadow-xl border border-[#104F38]/30 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#104F38]/15 flex items-center justify-between bg-[#F4FAF6] shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#104F38]/75">
              <span className="font-bold text-[#104F38]">
                NFC Tag ID: {tag.id}
              </span>
              <span aria-hidden="true">·</span>
              <span>UID: {tag.tagUid}</span>
            </div>
            <h2 className="text-base font-extrabold text-[#104F38] mt-1">
              Ubah Data &amp; Keamanan PIN NFC Tag
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal ubah NFC Tag"
            className="text-[#104F38]/60 hover:text-[#104F38] p-1.5 rounded-none hover:bg-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Alert */}
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-none flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Perubahan diarahkan langsung tanpa menulis ulang chip fisik NFC. Masukkan <strong>PIN keamanan NFC</strong> untuk menyimpan perubahan.
          </span>
        </div>

        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-none font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Link / Switch from existing QR Code */}
          {qrcodes.length > 0 && (
            <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/20 space-y-2">
              <label htmlFor="editNfcLinkedQr" className="text-xs font-bold text-[#104F38] flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                <span>Hubungkan / Ambil Data dari Daftar QR Code</span>
              </label>
              <select
                id="editNfcLinkedQr"
                value={linkedQrId}
                onChange={(e) => handleSelectLinkedQR(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none text-[#104F38] font-medium"
              >
                <option value="">-- Input Manual / Tidak Terhubung ke QR Tertentu --</option>
                {qrcodes.map(qr => (
                  <option key={qr.id} value={qr.id}>
                    {qr.code || 'QR'} · {qr.title} (/r/{qr.slug})
                  </option>
                ))}
              </select>
              {linkedQrId && (
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#104F38] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncWithQr}
                    onChange={(e) => setSyncWithQr(e.target.checked)}
                    className="accent-[#104F38]"
                  />
                  <span>Sinkronkan link otomatis jika QR Code terkait diperbarui</span>
                </label>
              )}
            </div>
          )}

          {/* Nama Tempat */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="editNfcPlaceName" className="block text-xs font-bold text-[#104F38]">
                Nama Tempat / Label NFC
              </label>
              {isLookingUp && (
                <span className="text-[10px] text-[#104F38]/70 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Mencari...
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#104F38]/50">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="editNfcPlaceName"
                type="text"
                required
                value={placeName}
                onChange={(e) => handlePlaceNameChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] text-[#104F38] font-medium"
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#104F38]/25 rounded-none shadow-lg overflow-hidden divide-y divide-[#104F38]/10">
                <div className="px-3 py-1.5 bg-[#F4FAF6] text-[10px] font-bold text-[#104F38]/75 flex justify-between items-center">
                  <span>Saran Tempat Google:</span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-[#104F38]/60 hover:text-[#104F38] cursor-pointer"
                    aria-label="Tutup saran tempat"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3 py-2 text-xs text-[#104F38] hover:bg-[#F4FAF6] flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{item.placeName}</span>
                    <span className="text-[10px] font-bold text-[#104F38] shrink-0">Gunakan</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tautan Tujuan */}
          <div className="p-3 bg-[#F4FAF6] rounded-none border border-[#104F38]/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="editNfcReviewUrl" className="block text-xs font-bold text-[#104F38]">
                Tautan Tujuan Dinamis
              </label>
              <button
                type="button"
                onClick={handleApplyAutoReviewUrl}
                className="text-[11px] font-bold text-[#104F38] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Otomatiskan dari Nama Tempat</span>
              </button>
            </div>
            <input
              id="editNfcReviewUrl"
              type="text"
              required
              value={googleReviewUrl}
              onChange={(e) => {
                setGoogleReviewUrl(e.target.value);
                setIsAutoUrl(false);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] font-mono text-[#104F38]"
            />
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-[#104F38]/75">
                {isAutoUrl ? 'Terhubung otomatis dari nama tempat' : 'Tautan saat ini'}
              </span>
              {googleReviewUrl && (
                <a
                  href={googleReviewUrl.startsWith('http') ? googleReviewUrl : `https://${googleReviewUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#104F38] hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Tes Buka Tautan
                </a>
              )}
            </div>
          </div>

          {/* PIN Verification & Security Settings */}
          <div className="p-3.5 bg-[#F4FAF6] rounded-none border border-[#104F38]/20 space-y-3">
            <div>
              <label htmlFor="editNfcCurrentPin" className="block text-xs font-bold text-[#104F38] mb-1">
                Masukkan PIN NFC Tag Anda <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#104F38]/50">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="editNfcCurrentPin"
                  type={showPin ? 'text' : 'password'}
                  required
                  placeholder="Masukkan PIN saat aktivasi tag..."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] font-mono text-[#104F38]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(p => !p)}
                  aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#104F38]/60 hover:text-[#104F38] cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#104F38]/15">
              <div>
                <label htmlFor="editNfcNewPin" className="block text-[11px] font-bold text-[#104F38] mb-1">
                  Ubah ke PIN Baru (Opsional)
                </label>
                <div className="relative">
                  <input
                    id="editNfcNewPin"
                    type={showNewPin ? 'text' : 'password'}
                    maxLength={8}
                    placeholder="Kosongkan jika PIN tetap"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full pl-2.5 pr-8 py-1.5 text-xs bg-white border border-[#104F38]/25 rounded-none font-mono text-[#104F38]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(p => !p)}
                    aria-label={showNewPin ? 'Sembunyikan PIN baru' : 'Tampilkan PIN baru'}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#104F38]/60 hover:text-[#104F38] cursor-pointer"
                  >
                    {showNewPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="editNfcStatus" className="block text-[11px] font-bold text-[#104F38] mb-1">
                  Status Tag NFC
                </label>
                <select
                  id="editNfcStatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'locked')}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#104F38]/25 rounded-none text-[#104F38]"
                >
                  <option value="active">Aktif (Bisa Di-tap)</option>
                  <option value="locked">Dikunci (Nonaktif Sementara)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#104F38]/15 text-xs">
              <span className="font-bold text-[#104F38] block">
                Tap NFC di Handphone Otomatis Tanpa PIN
              </span>
              <span className="text-[11px] text-[#104F38]/75">
                Pelanggan yang menempelkan tag NFC di smartphone langsung diarahkan ke link Google Review tanpa input PIN. PIN hanya diperlukan saat mengubah, menghapus, atau memprogram chip.
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="editNfcNotes" className="block text-xs font-bold text-[#104F38] mb-1">
              Catatan Penempatan Stand
            </label>
            <input
              id="editNfcNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none text-[#104F38]"
            />
          </div>

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
              disabled={isSubmitting || !pin.trim()}
              className="px-6 py-2 bg-[#FFE600] hover:bg-[#F2DA00] disabled:bg-stone-200 text-[#104F38] border border-[#104F38]/25 text-xs font-bold rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
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
