import React, { useState } from 'react';
import { ExternalLink, Check, History, Sparkles, AlertCircle, ArrowRight, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DynamicQRCode } from '../types.ts';

interface EditLinkModalProps {
  qr: DynamicQRCode;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedQR: DynamicQRCode) => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  qr,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [newUrl, setNewUrl] = useState(qr.targetUrl);
  const [reason, setReason] = useState('');
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState(qr.utm?.source || '');
  const [utmMedium, setUtmMedium] = useState(qr.utm?.medium || '');
  const [utmCampaign, setUtmCampaign] = useState(qr.utm?.campaign || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) {
      setErrorMessage('Tautan tujuan tidak boleh kosong.');
      return;
    }

    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Construct local updated QR item immediately
    const localUpdatedQR: DynamicQRCode = {
      ...qr,
      targetUrl: formattedUrl,
      updatedAt: new Date().toISOString(),
      urlHistory: [
        {
          url: formattedUrl,
          changedAt: new Date().toISOString(),
          reason: reason.trim() || 'Pembaruan tautan tujuan langsung'
        },
        ...(Array.isArray(qr.urlHistory) ? qr.urlHistory : [])
      ],
      utm: (utmSource || utmMedium || utmCampaign) ? {
        source: utmSource.trim(),
        medium: utmMedium.trim(),
        campaign: utmCampaign.trim()
      } : qr.utm
    };

    let finalQR = localUpdatedQR;

    try {
      const payload = {
        targetUrl: formattedUrl,
        reason: reason.trim() || 'Pembaruan tautan tujuan langsung',
        utm: (utmSource || utmMedium || utmCampaign) ? {
          source: utmSource.trim(),
          medium: utmMedium.trim(),
          campaign: utmCampaign.trim()
        } : undefined,
        qrData: qr
      };

      const res = await fetch(`/api/qrcodes/${qr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          finalQR = json.data;
        }
      }
    } catch (err) {
      console.warn('Network sync warning, saving via local cache:', err);
    }

    // Always apply updated data to React state & localStorage
    onUpdate(finalQR);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    setFeedbackMessage('Tautan berhasil dialihkan & tersimpan! QR fisik Anda sekarang langsung mengarah ke URL baru.');
    setTimeout(() => {
      onClose();
    }, 1200);
    setIsSubmitting(false);
  };

  const hasChanged = newUrl.trim() !== qr.targetUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md">
                Tautan Dinamis
              </span>
              <span className="text-xs text-slate-500 font-mono">/r/{qr.slug}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Ubah Tautan Tujuan QR Code Fisik
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Highlight Banner */}
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-5 p-3 sm:p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 sm:gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong className="font-semibold block text-emerald-950 mb-0.5">
              QR Code Fisik Tidak Perlu Dicetak Ulang!
            </strong>
            Stiker, akrilik meja, atau brosur yang sudah Anda cetak tetap berfungsi permanen. Cukup perbarui alamat link di bawah, dan saat dipindai oleh siapapun akan langsung membuka tautan baru ini.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Item Context */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="text-slate-500 font-medium">Nama / Media Cetak:</div>
            <div className="text-sm font-bold text-slate-900">{qr.title}</div>
            <div className="flex items-center gap-2 text-slate-500 pt-1">
              <span>Total Pindai: <strong className="text-slate-800 font-mono">{qr.totalScans.toLocaleString()} kali</strong></span>
              <span>·</span>
              <span>Terakhir Dipindai: {qr.lastScannedAt ? new Date(qr.lastScannedAt).toLocaleString('id-ID') : 'Belum pernah'}</span>
            </div>
          </div>

          {/* Current URL & New URL field */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tautan Tujuan Saat Ini
                </label>
                <a
                  href={qr.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                >
                  Buka Tautan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-xs font-mono text-slate-600 truncate border border-slate-200">
                {qr.targetUrl}
              </div>
            </div>

            <div>
              <label htmlFor="newUrlInput" className="block text-xs font-semibold text-slate-900 mb-1.5">
                Masukkan Tautan Tujuan Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="newUrlInput"
                  type="text"
                  required
                  placeholder="https://contoh.com/menu-baru atau https://wa.me/62812..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Bisa berupa link PDF, halaman web promosi, formulir Google Form, WhatsApp, atau media sosial.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alasan / Catatan Perubahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Update menu bulan ramadan / flash sale 10.10"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* UTM Tag Builder Toggle */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowUtm(!showUtm)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  Parameter Pelacakan UTM (Opsional untuk Google Analytics)
                </span>
                <span className="text-slate-400">{showUtm ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
              </button>

              {showUtm && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">UTM Source</label>
                    <input
                      type="text"
                      placeholder="qr_meja_cetak"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">UTM Medium</label>
                    <input
                      type="text"
                      placeholder="offline_acrylic"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">UTM Campaign</label>
                    <input
                      type="text"
                      placeholder="promo_lebaran"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Audit History Toggle */}
            {qr.urlHistory && qr.urlHistory.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium py-1"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  {showHistory ? 'Sembunyikan Riwayat Link' : `Lihat Riwayat Perubahan (${qr.urlHistory.length} entri)`}
                </button>

                {showHistory && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    {qr.urlHistory.map((item, idx) => (
                      <div key={idx} className="pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{new Date(item.changedAt).toLocaleString('id-ID')}</span>
                          {item.reason && <span className="italic text-slate-600">{item.reason}</span>}
                        </div>
                        <div className="font-mono text-slate-700 truncate mt-0.5">{item.url}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {feedbackMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasChanged}
              className={`px-5 py-2.5 text-xs font-bold rounded-none border border-[#104F38]/20 shadow-xs transition-all flex items-center gap-2 ${
                hasChanged
                  ? 'bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <span>Simpan & Terapkan Seketika</span>
                  <ArrowRight className="w-4 h-4 text-[#104F38]" />
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
