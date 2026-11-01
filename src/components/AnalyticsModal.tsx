import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, BarChart3, History, Smartphone, Globe, Calendar, RefreshCw, FileText, Check, Minimize2, Maximize2 } from 'lucide-react';
import { renderStyledQRToCanvas, downloadCanvasAsPNG, generateQRSVG, printFlyerSheet } from '../utils/qrRenderer.ts';
import {
  renderGoogleReviewStandToCanvas,
  downloadStandCanvas,
  printStandSheet,
  STAND_TEMPLATES,
  type StandTemplateId
} from '../utils/googleReviewStandRenderer.ts';
import type { DynamicQRCode, QRAnalyticsSummary } from '../types.ts';

interface AnalyticsModalProps {
  qr: DynamicQRCode;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditLink: () => void;
  onOpenStandStudio?: (qr: DynamicQRCode) => void;
  defaultCompact?: boolean;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  qr,
  isOpen,
  onClose,
  onOpenEditLink,
  onOpenStandStudio,
  defaultCompact = false
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'analytics' | 'history'>('download');
  const [analytics, setAnalytics] = useState<QRAnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedStandTemplate, setSelectedStandTemplate] = useState<StandTemplateId>('classic-blue');
  const [isCompactView, setIsCompactView] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dinamis_qr_view_mode');
      if (saved) return saved === 'compact';
      return defaultCompact;
    } catch {
      return defaultCompact;
    }
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${origin}/r/${qr.slug}`;

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, qr.id]);

  useEffect(() => {
    if (canvasRef.current && isOpen) {
      renderStyledQRToCanvas(canvasRef.current, redirectUrl, qr.style, 480);
    }
  }, [isOpen, qr, redirectUrl]);

  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/qrcodes/${qr.id}/analytics`);
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.data);
      }
    } catch (e) {
      console.warn('Failed to fetch analytics:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (!isOpen) return null;

  const handleDownloadPNG = (resolution: number) => {
    const tempCanvas = document.createElement('canvas');
    renderStyledQRToCanvas(tempCanvas, redirectUrl, qr.style, resolution).then(() => {
      downloadCanvasAsPNG(tempCanvas, `qrcode-${qr.slug}-${resolution}px`);
    });
  };

  const handleDownloadSVG = async () => {
    const svgStr = await generateQRSVG(redirectUrl, qr.style);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qrcode-${qr.slug}-vector.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintSheet = () => {
    if (canvasRef.current) {
      printFlyerSheet(canvasRef.current, qr.title, qr.slug, qr.targetUrl);
    }
  };

  const handleDownloadStandPNG = async (resolution: 1200 | 2400) => {
    const tempCanvas = document.createElement('canvas');
    await renderGoogleReviewStandToCanvas(tempCanvas, {
      templateId: selectedStandTemplate,
      qrText: redirectUrl,
      placeName: qr.title,
      themeColor: '#0038CB',
      width: resolution,
      height: resolution,
      showPlaceName: false
    });
    downloadStandCanvas(tempCanvas, `stand-google-review-${selectedStandTemplate}-${qr.slug}-${resolution}px`);
  };

  const handlePrintStandSheet = async () => {
    const tempCanvas = document.createElement('canvas');
    await renderGoogleReviewStandToCanvas(tempCanvas, {
      templateId: selectedStandTemplate,
      qrText: redirectUrl,
      placeName: qr.title,
      themeColor: '#0038CB',
      width: 1200,
      height: 1200,
      showPlaceName: false
    });
    printStandSheet(tempCanvas, `Stand Google Review - ${qr.title}`);
  };

  const handleCopyRedirect = () => {
    navigator.clipboard.writeText(redirectUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95 ${
          isCompactView ? 'max-w-2xl' : 'max-w-3xl'
        }`}
      >
        
        {/* Header */}
        <div
          className={`border-b border-slate-100 flex items-center justify-between bg-slate-50/70 transition-all ${
            isCompactView ? 'px-4 sm:px-5 py-3' : 'px-6 py-4'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Detail QR / QRIS Fisik
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                /r/{qr.slug}
              </span>
            </div>
            <h2
              className={`font-bold text-slate-900 mt-0.5 truncate ${
                isCompactView ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              }`}
            >
              {qr.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Normal vs Lebih Kecil */}
            <button
              onClick={() => {
                const next = !isCompactView;
                setIsCompactView(next);
                try {
                  localStorage.setItem('dinamis_qr_view_mode', next ? 'compact' : 'normal');
                } catch {}
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                isCompactView
                  ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title={isCompactView ? 'Beralih ke Tampilan Normal' : 'Beralih ke Tampilan Lebih Kecil'}
            >
              {isCompactView ? (
                <>
                  <Maximize2 className="w-3 h-3 text-sky-600" />
                  <span>Mode Ringkas (Kecil)</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3 h-3 text-slate-500" />
                  <span>Tampilan Lebih Kecil</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          className={`flex border-b border-slate-200 font-semibold text-slate-600 bg-white ${
            isCompactView ? 'px-4 sm:px-5 gap-4 text-[11px]' : 'px-6 gap-6 text-xs'
          }`}
        >
          <button
            onClick={() => setActiveTab('download')}
            className={`flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              isCompactView ? 'py-2' : 'py-3'
            } ${
              activeTab === 'download'
                ? 'border-[#557A60] text-[#557A60] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh & Cetak Fisik</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              isCompactView ? 'py-2' : 'py-3'
            } ${
              activeTab === 'analytics'
                ? 'border-[#557A60] text-[#557A60] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistik Pindai ({qr.totalScans.toLocaleString()})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              isCompactView ? 'py-2' : 'py-3'
            } ${
              activeTab === 'history'
                ? 'border-[#557A60] text-[#557A60] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Tautan ({qr.urlHistory?.length || 1})</span>
          </button>
        </div>

        {/* Tab 1: Download & Print Formats */}
        {activeTab === 'download' && (
          <div className={isCompactView ? 'p-4 sm:p-5 space-y-4' : 'p-6 space-y-6'}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* QR Preview Column */}
              <div className="md:col-span-5 text-center">
                <div
                  className={`bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-2xs ${
                    isCompactView ? 'p-2.5' : 'p-4 rounded-2xl'
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    className={`h-auto rounded-lg mx-auto shadow-xs ${
                      isCompactView ? 'w-32 sm:w-36' : 'w-48'
                    }`}
                  />
                </div>
                <div className="mt-1.5">
                  <button
                    onClick={handleCopyRedirect}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-mono inline-flex items-center gap-1"
                  >
                    {copiedLink ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tersalin!
                      </span>
                    ) : (
                      <span>Salin URL: /r/{qr.slug}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Download Buttons Column */}
              <div className="md:col-span-7 space-y-3">
                <div
                  className={`bg-sky-50/70 border border-sky-100 rounded-xl text-sky-900 space-y-1 ${
                    isCompactView ? 'p-2.5 text-[11px]' : 'p-4 text-xs'
                  }`}
                >
                  <div className="font-bold text-sky-950 flex items-center justify-between">
                    <span>Tautan Tujuan Saat Ini:</span>
                    <button
                      onClick={onOpenEditLink}
                      className="text-[11px] text-sky-700 hover:text-sky-900 underline font-semibold cursor-pointer"
                    >
                      Ubah Tautan Ini
                    </button>
                  </div>
                  <p className="font-mono truncate text-sky-800">{qr.targetUrl}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-800 block">
                    Pilihan Format Berkas Cetak:
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {/* PNG 1024px */}
                    <button
                      onClick={() => handleDownloadPNG(1024)}
                      className={`text-left rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer ${
                        isCompactView ? 'p-2' : 'p-3'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-slate-900">PNG 1024px</span>
                        <Download className="w-3 h-3 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500">Stand akrilik & brosur</p>
                    </button>

                    {/* PNG 2048px High-Res */}
                    <button
                      onClick={() => handleDownloadPNG(2048)}
                      className={`text-left rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer ${
                        isCompactView ? 'p-2' : 'p-3'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-slate-900">PNG 2048px</span>
                        <Download className="w-3 h-3 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500">Stiker & banner toko</p>
                    </button>

                    {/* SVG Vector */}
                    <button
                      onClick={handleDownloadSVG}
                      className={`text-left rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer ${
                        isCompactView ? 'p-2' : 'p-3'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-slate-900">Vektor SVG</span>
                        <FileText className="w-3 h-3 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500">Skala bebas vektor</p>
                    </button>

                    {/* Print Table Tent Card */}
                    <button
                      onClick={handlePrintSheet}
                      className={`text-left rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-50 transition-colors cursor-pointer ${
                        isCompactView ? 'p-2' : 'p-3'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-sky-900">Cetak Lembar Stand</span>
                        <Printer className="w-3 h-3 text-sky-600" />
                      </div>
                      <p className="text-[10px] text-sky-700">Format A4 ke printer</p>
                    </button>
                  </div>
                </div>

                {/* Featured: Template Stand Akrilik Google Review (Tap NFC & Scan QR) */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-xs font-bold text-blue-950">
                          Template Stand Akrilik Google Review (5 Desain)
                        </span>
                        <span className="text-[9px] font-bold bg-[#FFE600] text-blue-950 px-1.5 py-0.2 rounded">
                          5 Pilihan
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-800 leading-tight">
                        Pilih template akrilik meja. Otomatis memuat QR code ini & ikon Tap NFC siap cetak.
                      </p>
                    </div>

                    {onOpenStandStudio && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenStandStudio(qr);
                        }}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-1 rounded border border-blue-200 shrink-0 shadow-2xs hover:bg-blue-50 cursor-pointer"
                      >
                        Buka di Studio &rarr;
                      </button>
                    )}
                  </div>

                  {/* Template Selection Pills */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-700 block">Pilih Desain:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {STAND_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setSelectedStandTemplate(tmpl.id)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border text-left transition-all flex items-center justify-between cursor-pointer ${
                            selectedStandTemplate === tmpl.id
                              ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{tmpl.name.split('.')[1]?.trim() || tmpl.name}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 ml-1 border border-black/10"
                            style={{ backgroundColor: tmpl.previewColors[0] }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadStandPNG(2400)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Stand (2400px HD)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintStandSheet}
                      className="p-2 bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-700" />
                      <span>Cetak Lembar Stand</span>
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-[10px] text-slate-500">
                    💡 <strong>Tips Cetak:</strong> Setelah dicetak fisik di akrilik meja atau kemasan, Anda tidak perlu mengulang unduh/cetak saat mengganti URL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scan Analytics */}
        {activeTab === 'analytics' && (
          <div className={isCompactView ? 'p-4 sm:p-5 space-y-4' : 'p-6 space-y-6'}>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className={`bg-slate-50 rounded-xl border border-slate-200 ${isCompactView ? 'p-2.5' : 'p-3.5'}`}>
                <span className="text-[10px] text-slate-500 block font-medium">Total Pindai</span>
                <span className={`font-bold font-mono tabular-nums text-slate-900 ${isCompactView ? 'text-lg' : 'text-xl'}`}>
                  {qr.totalScans.toLocaleString()}
                </span>
              </div>
              <div className={`bg-slate-50 rounded-xl border border-slate-200 ${isCompactView ? 'p-2.5' : 'p-3.5'}`}>
                <span className="text-[10px] text-slate-500 block font-medium">Pindai Hari Ini</span>
                <span className={`font-bold font-mono tabular-nums text-emerald-600 ${isCompactView ? 'text-lg' : 'text-xl'}`}>
                  {analytics?.scansToday ?? 0}
                </span>
              </div>
              <div className={`bg-slate-50 rounded-xl border border-slate-200 ${isCompactView ? 'p-2.5' : 'p-3.5'}`}>
                <span className="text-[10px] text-slate-500 block font-medium">7 Hari Terakhir</span>
                <span className={`font-bold font-mono tabular-nums text-sky-600 ${isCompactView ? 'text-lg' : 'text-xl'}`}>
                  {analytics?.scansLast7Days ?? 0}
                </span>
              </div>
              <div className={`bg-emerald-50/80 rounded-xl border border-emerald-200 ${isCompactView ? 'p-2.5' : 'p-3.5'}`}>
                <span className="text-[10px] text-emerald-800 block font-medium">Biaya Cetak Dihemat</span>
                <span className={`font-bold font-mono text-emerald-900 mt-0.5 block ${isCompactView ? 'text-xs' : 'text-sm'}`}>
                  ~Rp {((qr.urlHistory?.length || 1) * 125000).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Daily Scans Mini Chart */}
            {analytics?.dailyScans && (
              <div className={`bg-slate-50 rounded-xl border border-slate-200 ${isCompactView ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Aktivitas Pindai 7 Hari Terakhir
                  </span>
                  <span className="text-[10px] text-slate-500">Pembaruan otomatis</span>
                </div>
                <div className={`flex items-end gap-2 pt-3 ${isCompactView ? 'h-20' : 'h-24'}`}>
                  {analytics.dailyScans.map((d, idx) => {
                    const max = Math.max(...analytics.dailyScans.map(s => s.count), 5);
                    const heightPercent = Math.max((d.count / max) * 100, 8);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-mono font-medium text-slate-700">
                          {d.count}
                        </span>
                        <div
                          className="w-full bg-sky-500 hover:bg-sky-600 rounded-t-sm transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[8px] text-slate-400 truncate">
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Device breakdown & Recent Logs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className={`bg-slate-50 rounded-xl border border-slate-200 text-xs ${isCompactView ? 'p-3' : 'p-4'}`}>
                <span className="font-semibold text-slate-800 block mb-1.5 text-xs">
                  Perangkat Pengunjung
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Smartphone / Mobile</span>
                    <span className="font-mono font-bold text-slate-900">{analytics?.deviceBreakdown.mobile || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Desktop / Komputer</span>
                    <span className="font-mono font-bold text-slate-900">{analytics?.deviceBreakdown.desktop || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1.5">📱 Tablet</span>
                    <span className="font-mono font-bold text-slate-900">{analytics?.deviceBreakdown.tablet || 0}</span>
                  </div>
                </div>
              </div>

              <div className={`bg-slate-50 rounded-xl border border-slate-200 text-xs ${isCompactView ? 'p-3' : 'p-4'}`}>
                <span className="font-semibold text-slate-800 block mb-1.5 text-xs">
                  Pindai Terakhir
                </span>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div>Terakhir Aktif: <strong className="text-slate-900">{qr.lastScannedAt ? new Date(qr.lastScannedAt).toLocaleString('id-ID') : 'Belum pernah'}</strong></div>
                  <div>Status QR: <span className="font-semibold text-emerald-700 capitalize">{qr.status}</span></div>
                  <div>Pengalihan HTTP: <span className="font-mono text-slate-900">302 Found (No-Cache)</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: URL Change Audit History */}
        {activeTab === 'history' && (
          <div className={isCompactView ? 'p-4 sm:p-5 space-y-3' : 'p-6 space-y-4'}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-800">
                  Riwayat Pergantian Tautan Tujuan
                </h3>
                <p className="text-[10px] text-slate-500">
                  Mencatat setiap kali Anda memperbarui tautan tanpa mengganti cetakan fisik.
                </p>
              </div>
              <button
                onClick={onOpenEditLink}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                + Ganti Tautan
              </button>
            </div>

            <div className={`space-y-2 overflow-y-auto ${isCompactView ? 'max-h-60' : 'max-h-80'}`}>
              {qr.urlHistory && qr.urlHistory.length > 0 ? (
                qr.urlHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-0.5 ${
                      isCompactView ? 'p-2' : 'p-3'
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.changedAt).toLocaleString('id-ID')}
                      </span>
                      {idx === 0 && (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[9px] font-bold">
                          SEDANG AKTIF
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-slate-800 truncate font-medium text-[11px]">
                      {item.url}
                    </div>
                    {item.reason && (
                      <div className="text-slate-500 text-[10px] italic">
                        Catatan: {item.reason}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Belum ada riwayat perubahan tautan.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className={`bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs ${
            isCompactView ? 'px-4 sm:px-5 py-2.5' : 'px-6 py-3'
          }`}
        >
          <span className="text-slate-500 text-[11px]">
            DinamisQR · Solusi QR Code Bebas Cetak Ulang
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
