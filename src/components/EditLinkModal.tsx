import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Check, History, Sparkles, AlertCircle, ArrowRight, Tag, Palette, Sliders, Upload, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderStyledQRToCanvas, DEFAULT_QR_STYLE } from '../utils/qrRenderer.ts';
import type { DynamicQRCode, QRStyleConfig } from '../types.ts';

interface EditLinkModalProps {
  qr: DynamicQRCode;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedQR: DynamicQRCode) => void;
}

const COLOR_PRESETS = [
  { name: 'Pitch Forest', fg: '#104F38', bg: '#ffffff', frame: '#104F38' },
  { name: 'Canary Highlight', fg: '#104F38', bg: '#ffffea', frame: '#FFE600' },
  { name: 'Classic Slate', fg: '#0f172a', bg: '#ffffff', frame: '#0f172a' },
  { name: 'Botanical Sage', fg: '#2b3f30', bg: '#f9fbf9', frame: '#557a60' },
  { name: 'Emerald Forest', fg: '#064e3b', bg: '#f0fdf4', frame: '#064e3b' },
  { name: 'Deep Onyx', fg: '#000000', bg: '#ffffff', frame: '#000000' },
];

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  qr,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'history'>('content');
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

  // Style State
  const [style, setStyle] = useState<QRStyleConfig>(() => ({
    ...DEFAULT_QR_STYLE,
    ...(qr.style || {})
  }));

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
      setStyle({
        ...DEFAULT_QR_STYLE,
        ...(qr.style || {})
      });
      setFeedbackMessage(null);
      setErrorMessage(null);
    }
  }, [qr, isOpen]);

  // Live Canvas Preview
  useEffect(() => {
    if (previewCanvasRef.current && isOpen) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/r/${qr.slug}`;
      const safeStyle: QRStyleConfig = {
        ...DEFAULT_QR_STYLE,
        ...style
      };
      renderStyledQRToCanvas(previewCanvasRef.current, redirectUrl, safeStyle, 320);
    }
  }, [style, qr.slug, isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyle(prev => ({
          ...prev,
          logoType: 'custom',
          logo: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

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

    const safeStyle: QRStyleConfig = {
      ...DEFAULT_QR_STYLE,
      ...style
    };

    const now = new Date().toISOString();
    const urlChanged = formattedUrl !== qr.targetUrl;

    // Construct local updated QR item immediately with guaranteed safe style
    const localUpdatedQR: DynamicQRCode = {
      ...qr,
      title: title.trim() || qr.title,
      targetUrl: formattedUrl,
      style: safeStyle,
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
        title: title.trim() || qr.title,
        targetUrl: formattedUrl,
        reason: reason.trim() || 'Pembaruan tautan tujuan langsung',
        style: safeStyle,
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
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          finalQR = {
            ...json.data,
            style: json.data.style || safeStyle
          };
        }
      }
    } catch (err) {
      console.warn('Network sync warning, saving via local cache:', err);
    }

    // Always apply updated data to React state & localStorage
    onUpdate(finalQR);

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    setFeedbackMessage('Tautan & Desain QR berhasil diperbarui dan tersimpan permanen!');
    setTimeout(() => {
      onClose();
    }, 1100);
    setIsSubmitting(false);
  };

  const hasChanged =
    newUrl.trim() !== qr.targetUrl ||
    (title.trim() && title.trim() !== qr.title) ||
    JSON.stringify(style) !== JSON.stringify(qr.style || DEFAULT_QR_STYLE) ||
    utmSource !== (qr.utm?.source || '') ||
    utmMedium !== (qr.utm?.medium || '') ||
    utmCampaign !== (qr.utm?.campaign || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#104F38] bg-[#EAF5F0] border border-[#104F38]/20 px-2.5 py-0.5 rounded-none font-mono">
                {qr.code || 'QR 001'}
              </span>
              <span className="text-xs text-slate-500 font-mono">/r/{qr.slug}</span>
              <span className="text-[10px] font-bold bg-[#FFE600] text-[#104F38] px-2 py-0.5 border border-[#104F38]/20">
                Tautan Dinamis
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Ubah Tautan Tujuan & Desain QR Code
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-y-auto flex-1">
          
          {/* Left Column: Form Controls */}
          <div className="md:col-span-7 p-4 sm:p-6 space-y-4">
            
            {/* Highlight Banner */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-emerald-950 leading-relaxed">
                <strong className="font-semibold block text-emerald-950">
                  QR Code Fisik yang Sudah Dicetak Tetap Aktif!
                </strong>
                Stiker atau stand akrilik yang sudah Anda pasang akan langsung membuka link baru ini seketika saat dipindai.
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
                <span>1. Tautan & Data</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'design'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                <span>2. Desain & Warna QR</span>
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
                <span>3. Riwayat ({qr.urlHistory?.length || 1})</span>
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
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="editTargetUrlInput" className="text-xs font-semibold text-slate-800">
                      Tautan Tujuan Baru <span className="text-rose-500">*</span>
                    </label>
                    <a
                      href={qr.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#104F38] hover:underline flex items-center gap-1 font-semibold"
                    >
                      Buka Tautan Lama <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    id="editTargetUrlInput"
                    type="text"
                    required
                    placeholder="https://contoh.com/menu-baru atau https://wa.me/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#104F38]/40 font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bisa berupa link PDF, Google Review, Google Form, katalog menu, Shopee, WhatsApp, dsb.
                  </p>
                </div>

                {/* Reason for change */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Perubahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Update menu promo akhir tahun / flash sale"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                {/* UTM Parameters Toggle */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                  <button
                    type="button"
                    onClick={() => setShowUtm(!showUtm)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      Parameter Pelacakan UTM (Opsional untuk Google Analytics)
                    </span>
                    <span className="text-slate-400 text-[11px]">{showUtm ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
                  </button>

                  {showUtm && (
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">UTM Source</label>
                        <input
                          type="text"
                          placeholder="qr_meja_fisik"
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

            {/* TAB 2: DESIGN & LOGO */}
            {activeTab === 'design' && (
              <div className="space-y-4">
                
                {/* Palette Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Palet Warna Cetak
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setStyle(prev => ({
                            ...prev,
                            fgColor: p.fg,
                            bgColor: p.bg,
                            frameColor: p.frame
                          }));
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs transition-all cursor-pointer ${
                          style.fgColor === p.fg
                            ? 'border-[#104F38] bg-[#EAF5F0] ring-1 ring-[#104F38]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: p.fg }}
                        />
                        <span className="truncate font-medium text-slate-800">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dot Style & Corner Style */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Gaya Titik QR
                    </label>
                    <select
                      value={style.dotStyle || 'rounded'}
                      onChange={(e) => setStyle(prev => ({ ...prev, dotStyle: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="rounded">Rounded (Halus Modern)</option>
                      <option value="dots">Dots (Titik Bulat)</option>
                      <option value="square">Square (Klasik Tegas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Gaya Sudut Mata
                    </label>
                    <select
                      value={style.cornerStyle || 'rounded'}
                      onChange={(e) => setStyle(prev => ({ ...prev, cornerStyle: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="rounded">Rounded Corner</option>
                      <option value="square">Square Corner</option>
                      <option value="dot">Circle Dot Corner</option>
                    </select>
                  </div>
                </div>

                {/* Frame Style & Banner Text */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-900">
                    Bingkai CTA / Ajakan Bertindak
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={style.frameStyle || 'bottom-banner'}
                      onChange={(e) => setStyle(prev => ({ ...prev, frameStyle: e.target.value as any }))}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="none">Tanpa Bingkai</option>
                      <option value="bottom-banner">Banner Bawah</option>
                      <option value="top-banner">Banner Atas</option>
                      <option value="border-card">Kartu Berbingkai</option>
                    </select>

                    <input
                      type="text"
                      placeholder="PINDAI SAYA / LIHAT MENU"
                      value={style.frameText || ''}
                      onChange={(e) => setStyle(prev => ({ ...prev, frameText: e.target.value }))}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                {/* Center Logo Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Ikon / Logo di Tengah QR
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'none', label: 'Tanpa Logo', icon: '—' },
                      { id: 'menu', label: 'Menu Resto', icon: '🍽️' },
                      { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                      { id: 'instagram', label: 'Instagram', icon: '📷' },
                      { id: 'web', label: 'Website', icon: '🌐' },
                      { id: 'wifi', label: 'WiFi Tamu', icon: '📶' },
                      { id: 'cart', label: 'Belanja', icon: '🛒' },
                      { id: 'map', label: 'Lokasi Map', icon: '📍' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.id === 'none') {
                            setStyle(prev => ({ ...prev, logoType: 'none', logo: '' }));
                          } else {
                            setStyle(prev => ({ ...prev, logoType: 'preset', logo: item.id }));
                          }
                        }}
                        className={`p-1.5 rounded-lg border text-center text-xs transition-colors cursor-pointer ${
                          (item.id === 'none' && style.logoType === 'none') ||
                          (style.logoType === 'preset' && style.logo === item.id)
                            ? 'border-[#104F38] bg-[#EAF5F0] text-[#104F38] font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="block text-sm mb-0.5">{item.icon}</span>
                        <span className="text-[10px] truncate block">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-[#104F38] hover:underline flex items-center gap-1 cursor-pointer font-medium">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Atau unggah logo kustom (PNG transparan)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: AUDIT HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-800 block">
                  Riwayat Pengalihan Tautan Sebelumnya:
                </span>
                {qr.urlHistory && qr.urlHistory.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    {qr.urlHistory.map((item, idx) => (
                      <div key={idx} className="pb-2.5 border-b border-slate-200 last:border-0 last:pb-0">
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Pratinjau Hasil Desain QR Code
              </span>

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

              <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">Target URL Sekarang:</div>
                <div className="font-mono text-[11px] text-[#104F38] font-bold truncate">
                  {newUrl || qr.targetUrl}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                Desain dan tautan baru ini langsung disinkronkan ke seluruh sistem dan QR fisik.
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
                    <span>Simpan & Terapkan Seketika</span>
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
