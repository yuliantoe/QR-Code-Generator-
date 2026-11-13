import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Check, History, AlertCircle, ArrowRight, Tag, Sliders, ShieldCheck, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderStyledQRToCanvas, DEFAULT_QR_STYLE } from '../utils/qrRenderer.ts';
import type { DynamicQRCode, QRStyleConfig } from '../types.ts';
import { WhatsAppWelcomeEditor } from './WhatsAppWelcomeEditor.tsx';
import { parseWhatsAppUrl, buildWhatsAppUrl } from '../utils/whatsappPresets.ts';

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
  const [activeTab, setActiveTab] = useState<'content' | 'history'>('content');
  const [newUrl, setNewUrl] = useState(qr.targetUrl);
  const [title, setTitle] = useState(qr.title || '');
  const [reason, setReason] = useState('');
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState(qr.utm?.source || '');
  const [utmMedium, setUtmMedium] = useState(qr.utm?.medium || '');
  const [utmCampaign, setUtmCampaign] = useState(qr.utm?.campaign || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forceShowWaEditor, setForceShowWaEditor] = useState(false);

  // Preserve initial QR Code design exactly as generated initially
  const initialStyle: QRStyleConfig = {
    ...DEFAULT_QR_STYLE,
    ...(qr.style || {})
  };

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state whenever qr or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setNewUrl(qr.targetUrl);
      setTitle(qr.title || '');
      setReason('');
      setUtmSource(qr.utm?.source || '');
      setUtmMedium(qr.utm?.medium || '');
      setUtmCampaign(qr.utm?.campaign || '');
      setFeedbackMessage(null);
      setErrorMessage(null);
      setForceShowWaEditor(false);
      setActiveTab('content');
    }
  }, [qr, isOpen]);

  // Live Canvas Preview keeping the initial generated QR style
  useEffect(() => {
    if (previewCanvasRef.current && isOpen) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/r/${qr.slug}`;
      renderStyledQRToCanvas(previewCanvasRef.current, redirectUrl, initialStyle, 320, false);
    }
  }, [qr.slug, qr.style, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

    const now = new Date().toISOString();
    const urlChanged = formattedUrl !== qr.targetUrl;

    // Construct local updated QR item keeping initial style untouched
    const localUpdatedQR: DynamicQRCode = {
      ...qr,
      title: title.trim() || qr.title,
      targetUrl: formattedUrl,
      style: initialStyle,
      updatedAt: now,
      urlHistory: urlChanged
        ? [
            {
              url: formattedUrl,
              changedAt: now,
              reason: reason.trim() || 'Pembaruan tautan tujuan langsung'
            },
            ...(Array.isArray(qr.urlHistory) ? qr.urlHistory : [])
          ]
        : (qr.urlHistory || []),
      utm: (utmSource.trim() || utmMedium.trim() || utmCampaign.trim()) ? {
        source: utmSource.trim(),
        medium: utmMedium.trim(),
        campaign: utmCampaign.trim()
      } : undefined
    };

    let finalQR = localUpdatedQR;

    try {
      const payload = {
        slug: qr.slug,
        title: title.trim() || qr.title,
        targetUrl: formattedUrl,
        reason: reason.trim() || 'Pembaruan tautan tujuan langsung',
        style: initialStyle,
        utm: (utmSource.trim() || utmMedium.trim() || utmCampaign.trim()) ? {
          source: utmSource.trim(),
          medium: utmMedium.trim(),
          campaign: utmCampaign.trim()
        } : undefined,
        qrData: localUpdatedQR
      };

      const res = await fetch(`/api/qrcodes/${qr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (!res.ok || !json.success) {
          setErrorMessage(json.error || `Gagal menyimpan pembaruan ke server (HTTP ${res.status}).`);
          setIsSubmitting(false);
          return;
        }
        if (json.data) {
          finalQR = {
            ...json.data,
            style: json.data.style || initialStyle
          };
        }
      } else if (!res.ok) {
        setErrorMessage(`Server mengembalikan kesalahan (HTTP ${res.status}) saat memperbarui tautan.`);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('Network sync warning, saving via local cache:', err);
    }

    // Apply updated data to React state & localStorage
    onUpdate(finalQR);

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    setFeedbackMessage('Tautan tujuan berhasil diperbarui! Desain QR fisik tetap sesuai generate awal.');
    setTimeout(() => {
      onClose();
    }, 1100);
    setIsSubmitting(false);
  };

  const hasChanged =
    newUrl.trim() !== qr.targetUrl ||
    (title.trim() && title.trim() !== qr.title) ||
    utmSource !== (qr.utm?.source || '') ||
    utmMedium !== (qr.utm?.medium || '') ||
    utmCampaign !== (qr.utm?.campaign || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#104F38]/40 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-none shadow-2xl border border-[#104F38]/25 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#104F38]/15 bg-[#F4FAF6] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#104F38] bg-white border border-[#104F38]/20 px-2.5 py-0.5 rounded-none font-mono">
                {qr.code || 'QR 001'}
              </span>
              <span className="text-xs text-[#104F38]/70 font-mono">/r/{qr.slug}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#104F38] mt-1">
              Ganti Link Tujuan QR Code
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#104F38]/60 hover:text-[#104F38] p-1.5 rounded-none hover:bg-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#104F38]/15 overflow-y-auto flex-1">
          
          {/* Left Column: Form Controls */}
          <div className="md:col-span-7 p-4 sm:p-6 space-y-4">
            
            {/* Highlight Banner */}
            <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none flex items-start gap-2.5">
              <div className="p-1.5 bg-[#104F38] text-[#FFE600] rounded-none shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs text-[#104F38] leading-relaxed">
                <strong className="font-bold block text-[#104F38] text-[13px]">
                  Desain Fisik QR Code Tetap Sesuai Generate Awal
                </strong>
                QR Code fisik yang sudah dicetak di meja, stand akrilik, atau stiker tidak perlu dicetak ulang. Masukkan link tujuan baru di bawah agar pemindaian otomatis diarahkan ke link baru.
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'content'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>1. Ganti Tautan Tujuan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>2. Riwayat Tautan ({qr.urlHistory?.length || 1})</span>
              </button>
            </div>

            {/* TAB 1: CONTENT & TARGET URL */}
            {activeTab === 'content' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Judul / Nama Media Cetak
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-semibold text-slate-900"
                  />
                </div>

                {/* Target URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-800">
                      Tautan Tujuan Baru <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!parseWhatsAppUrl(newUrl).isWhatsApp) {
                            setNewUrl('https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20promo%20hari%20ini.');
                          }
                          setForceShowWaEditor(!forceShowWaEditor);
                        }}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-none border transition-colors cursor-pointer flex items-center gap-1 ${
                          (parseWhatsAppUrl(newUrl).isWhatsApp || forceShowWaEditor)
                            ? 'bg-emerald-100 text-[#075E54] border-emerald-300'
                            : 'bg-white text-slate-700 hover:bg-emerald-50 border-slate-300'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{(parseWhatsAppUrl(newUrl).isWhatsApp || forceShowWaEditor) ? 'Mode WhatsApp Aktif' : 'Ubah ke WhatsApp'}</span>
                      </button>
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Dialihkan Seketika
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="https://restoran.com/menu-baru.pdf"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#104F38] focus:border-[#104F38] font-mono text-slate-900 shadow-2xs"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>Mendukung link Google Review, PDF, Website, WhatsApp, dan Sosial Media.</span>
                    {newUrl && (
                      <a
                        href={newUrl.startsWith('http') ? newUrl : `https://${newUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#104F38] font-medium hover:underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>Uji Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* WhatsApp Welcome Message Editor (Shows when URL is WhatsApp or toggled) */}
                {(parseWhatsAppUrl(newUrl).isWhatsApp || forceShowWaEditor) && (
                  <WhatsAppWelcomeEditor
                    currentUrl={newUrl}
                    onUrlChange={(updatedWaUrl) => setNewUrl(updatedWaUrl)}
                  />
                )}

                {/* Optional Change Reason / Audit Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Catatan Alasan Perubahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Update menu Ramadan / Promo Musim Baru"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 text-slate-800"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Catatan ini akan tersimpan rapi di riwayat untuk mempermudah pelacakan tim Anda.
                  </p>
                </div>

                {/* Optional UTM Campaign Tracking */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUtm(!showUtm)}
                    className="text-xs font-semibold text-[#104F38] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{showUtm ? 'Sembunyikan Pelacak UTM' : '+ Tambah Pelacak UTM Google Analytics (Opsional)'}</span>
                  </button>

                  {showUtm && (
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">UTM Source</label>
                        <input
                          type="text"
                          placeholder="stand_meja_akrilik"
                          value={utmSource}
                          onChange={(e) => setUtmSource(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">UTM Medium</label>
                        <input
                          type="text"
                          placeholder="offline_print"
                          value={utmMedium}
                          onChange={(e) => setUtmMedium(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">UTM Campaign</label>
                        <input
                          type="text"
                          placeholder="promo_2026"
                          value={utmCampaign}
                          onChange={(e) => setUtmCampaign(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </form>
            )}

            {/* TAB 2: AUDIT HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Log Riwayat Perubahan Tautan
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Total {qr.urlHistory?.length || 1} versi tautan
                  </span>
                </div>

                {qr.urlHistory && qr.urlHistory.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {qr.urlHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold">{new Date(item.changedAt).toLocaleString('id-ID')}</span>
                          {item.reason && <span className="italic text-slate-600 bg-white px-2 py-0.5 border border-slate-200 rounded">{item.reason}</span>}
                        </div>
                        <div className="font-mono text-slate-800 truncate mt-1 bg-white p-1.5 rounded border border-slate-200">
                          {item.url}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                    Belum ada riwayat perubahan tautan sebelumnya.
                  </div>
                )}
              </div>
            )}

            {/* Error & Feedback Messages */}
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

          </div>

          {/* Right Column: Live QR Preview */}
          <div className="md:col-span-5 p-5 bg-slate-50/70 flex flex-col justify-between items-center text-center">
            <div className="w-full">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#104F38]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#104F38]">
                  Desain Fisik QR Sesuai Generate Awal
                </span>
              </div>

              {/* Render Canvas */}
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 inline-block mx-auto max-w-[240px]">
                <canvas
                  ref={previewCanvasRef}
                  className="w-44 h-auto rounded-lg mx-auto"
                />
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{qr.code || 'QR 001'}</span>
                  <span className="font-bold text-[#104F38]">/r/{qr.slug}</span>
                </div>
              </div>

              <div className="mt-3 bg-white p-2.5 rounded-none border border-[#104F38]/20 text-left text-xs space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-[#104F38]/60">Target URL Baru:</div>
                <div className="font-mono text-[11px] text-[#104F38] font-bold truncate">
                  {newUrl || qr.targetUrl}
                </div>
                <div className="pt-1.5 border-t border-[#104F38]/10 flex items-center justify-between">
                  <span className="text-[10px] text-[#104F38]/70">URL Fisik: /r/{qr.slug}</span>
                    <a
                      href={`/r/${qr.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-[#104F38] bg-[#FFE600] px-2 py-0.5 border border-[#104F38]/30 hover:bg-[#F2DA00] flex items-center gap-1"
                      title="Uji buka tautan pengalihan fisik"
                    >
                      <span>Uji Pengalihan</span>
                    </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                Desain fisik QR Code di atas terkunci sesuai saat dibuat pertama kali. Mengganti link di sini tidak akan mengubah tampilan cetakan fisik di lapangan.
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="w-full pt-4 mt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
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
                    <span>Simpan Tautan Baru</span>
                    <ArrowRight className="w-4 h-4 text-[#104F38]" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
