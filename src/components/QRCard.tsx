import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Edit3, BarChart2, Download, Copy, Check, Pause, Play, Trash2, Sparkles } from 'lucide-react';
import { renderStyledQRToCanvas } from '../utils/qrRenderer.ts';
import type { DynamicQRCode } from '../types.ts';

interface QRListItemProps {
  qr: DynamicQRCode;
  onOpenEditLink: (qr: DynamicQRCode) => void;
  onOpenAnalytics: (qr: DynamicQRCode) => void;
  onOpenStandStudio?: (qr: DynamicQRCode) => void;
  onToggleStatus: (qr: DynamicQRCode) => void;
  onDelete: (qr: DynamicQRCode) => void;
  viewMode?: 'normal' | 'compact';
  isWatermarkActive?: boolean;
}

export const QRCard: React.FC<QRListItemProps> = ({
  qr,
  onOpenEditLink,
  onOpenAnalytics,
  onOpenStandStudio,
  onToggleStatus,
  onDelete,
  viewMode = 'normal',
  isWatermarkActive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${origin}/r/${qr.slug}`;

  const isCompact = viewMode === 'compact';
  const canvasSize = isCompact ? 100 : 160;

  useEffect(() => {
    if (canvasRef.current) {
      renderStyledQRToCanvas(canvasRef.current, redirectUrl, qr.style, canvasSize, isWatermarkActive);
    }
  }, [qr, redirectUrl, canvasSize, isWatermarkActive]);

  const handleCopy = () => {
    navigator.clipboard.writeText(redirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPaused = qr.status === 'paused';

  // Render Compact / Detail Lebih Kecil (Agency Modern Minimalist)
  if (isCompact) {
    return (
      <div
        className={`bg-white rounded-none border transition-all duration-150 p-2 sm:py-2.5 sm:px-3.5 ${
          isPaused
            ? 'border-[#FCD5CE] bg-[#FFFBFB]'
            : 'border-[#104F38]/15 hover:border-[#104F38]/35 hover:shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          {/* Left: Mini QR + Title + Slug & Status */}
          <div className="flex items-center gap-2.5 min-w-0 sm:w-[38%] shrink-0">
            {/* Small QR Thumbnail with Kode Registrasi */}
            <div className="flex flex-col items-center shrink-0">
              <div
                onClick={() => onOpenAnalytics(qr)}
                className="cursor-pointer bg-[#F4FAF6] p-1 rounded-none border border-[#104F38]/20 shrink-0 hover:bg-[#EAF5F0] transition-colors group relative"
                title="Klik untuk detail & cetak"
              >
                <canvas
                  ref={canvasRef}
                  className="w-9 h-9 sm:w-10 sm:h-10 block"
                />
                <div className="absolute inset-0 bg-[#104F38]/20 rounded-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Download className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <span className="text-[8px] font-mono font-black text-[#104F38] text-center mt-0.5 leading-none">
                {qr.code || 'QR 001'}
              </span>
            </div>

            {/* Title & Slug */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[9px] font-mono font-black text-[#104F38] bg-[#FFE600] px-1.5 py-0.5 border border-[#104F38]/20 shrink-0">
                  {qr.code || 'QR 001'}
                </span>
                <span className="text-[10px] font-mono text-[#104F38]/70 font-medium truncate">
                  /r/{qr.slug}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-[#104F38]/50 hover:text-[#104F38] p-0.5 transition-colors cursor-pointer"
                  title="Salin tautan"
                >
                  {copied ? (
                    <Check className="w-2.5 h-2.5 text-[#104F38] font-bold" />
                  ) : (
                    <Copy className="w-2.5 h-2.5" />
                  )}
                </button>
                <span className="text-[#104F38]/30 text-[10px]">·</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-none ${
                    isPaused ? 'bg-[#FCD5CE] text-[#104F38]' : 'bg-[#FFE600] text-[#104F38]'
                  }`}
                >
                  {isPaused ? 'Dijeda' : 'Aktif'}
                </span>
              </div>

              <h4 className="text-xs font-bold text-[#104F38] truncate mt-1 leading-snug" title={qr.title}>
                {qr.title}
              </h4>
            </div>
          </div>

          {/* Middle: Compact Destination URL */}
          <div className="min-w-0 flex-1 bg-[#F8FAF9] rounded-none py-1 px-2.5 border border-[#104F38]/10 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-bold text-[#104F38]/60 uppercase shrink-0">
                Link:
              </span>
              <a
                href={qr.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-[#104F38] hover:text-[#0C3B2A] truncate hover:underline font-semibold"
                title={qr.targetUrl}
              >
                {qr.targetUrl}
              </a>
            </div>
            <ExternalLink className="w-3 h-3 text-[#104F38]/40 shrink-0" />
          </div>

          {/* Scans Count */}
          <div className="hidden md:flex items-center gap-1 shrink-0 px-2 text-[11px] font-mono text-[#104F38]/70">
            <span className="text-[#104F38]/50 text-[10px]">Pindai:</span>
            <strong className="text-[#104F38] tabular-nums font-bold">{qr.totalScans.toLocaleString()}</strong>
          </div>

          {/* Right: Compact Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#104F38]/10 w-full sm:w-auto">
            <button
              onClick={() => onOpenEditLink(qr)}
              className="px-2.5 py-1 bg-[#104F38] hover:bg-[#0C3B2A] text-white rounded-none text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
              title="Ganti URL tujuan"
            >
              <Edit3 className="w-3 h-3 text-[#FFE600]" />
              <span>Ganti Link</span>
            </button>

            <button
              onClick={() => onOpenAnalytics(qr)}
              className="px-2 py-1 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 rounded-none text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Statistik dan unduh cetak"
            >
              <BarChart2 className="w-3 h-3 text-[#104F38]/70" />
              <span>Detail</span>
            </button>

            {onOpenStandStudio && (
              <button
                onClick={() => onOpenStandStudio(qr)}
                className="px-2 py-1 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 rounded-none text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                title="Buka Template Stand Akrilik Google Review"
              >
                <Sparkles className="w-3 h-3 text-[#104F38]" />
                <span>Stand</span>
              </button>
            )}

            <button
              onClick={() => onToggleStatus(qr)}
              className={`p-1 rounded-none transition-colors cursor-pointer border ${
                isPaused
                  ? 'text-[#104F38] bg-[#FFE600] border-[#104F38]/30 font-bold'
                  : 'text-[#104F38]/60 hover:text-[#104F38] border-[#104F38]/15 hover:bg-[#F4FAF6]'
              }`}
              title={isPaused ? 'Aktifkan QR Code' : 'Jeda sementara'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>

            <button
              onClick={() => onDelete(qr)}
              className="p-1 text-[#104F38]/40 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="Hapus QR Code"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Render Normal / Standard View
  return (
    <div
      className={`bg-white rounded-none border transition-all duration-200 p-4 sm:p-5 ${
        isPaused
          ? 'border-[#FCD5CE] bg-[#FFFBFB]'
          : 'border-[#104F38]/15 hover:border-[#104F38]/35 hover:shadow-2xs'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Section: Thumbnail + Title + Slug & Status */}
        <div className="flex items-center gap-3.5 min-w-0 lg:w-[32%] shrink-0">
          {/* QR Thumbnail with Registration Code below */}
          <div className="flex flex-col items-center shrink-0">
            <div
              onClick={() => onOpenAnalytics(qr)}
              className="cursor-pointer bg-[#F4FAF6] p-1.5 rounded-none border border-[#104F38]/20 shrink-0 hover:bg-[#EAF5F0] transition-colors group relative"
              title="Klik untuk lihat pratinjau & unduh resolusi cetak"
            >
              <canvas
                ref={canvasRef}
                className="w-13 h-13 sm:w-14 sm:h-14 block"
              />
              <div className="absolute inset-0 bg-[#104F38]/20 rounded-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Download className="w-3.5 h-3.5 text-white drop-shadow-xs" />
              </div>
            </div>
            <div className="text-[9px] font-mono font-black text-[#104F38] bg-[#FFE600] px-1.5 py-0.2 border border-[#104F38]/20 mt-1 text-center w-full truncate shadow-2xs">
              {qr.code || 'QR 001'}
            </div>
            <span className="text-[7.5px] font-bold text-[#104F38]/60 uppercase tracking-tighter mt-0.5 text-center">
              Kode Registrasi
            </span>
          </div>

          {/* Title & Short Permanent URL */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-mono font-black text-[#104F38] bg-[#FFE600] px-2 py-0.5 border border-[#104F38]/20 tracking-tight shrink-0">
                {qr.code || 'QR 001'}
              </span>
              <span className="text-xs font-mono text-[#104F38]/70 font-medium">/r/{qr.slug}</span>
              <button
                onClick={handleCopy}
                className="text-[#104F38]/50 hover:text-[#104F38] p-0.5 rounded transition-colors cursor-pointer"
                title="Salin tautan permanen fisik"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-[#104F38] font-bold" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              <span className="text-[#104F38]/30">·</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none ${
                  isPaused ? 'bg-[#FCD5CE] text-[#104F38]' : 'bg-[#FFE600] text-[#104F38]'
                }`}
              >
                {isPaused ? 'Dijeda' : 'Aktif'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-[#104F38] mt-1 truncate" title={qr.title}>
              {qr.title}
            </h3>

            <div className="text-[11px] text-[#104F38]/60 sm:hidden mt-0.5">
              Pindai: <strong className="font-mono text-[#104F38]">{qr.totalScans.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Middle Section: Destination Target URL */}
        <div className="flex-1 min-w-0 bg-[#F8FAF9] rounded-none py-2 px-3 sm:px-4 border border-[#104F38]/10 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#104F38]/60 mb-0.5">
              <span>Tujuan Saat Ini (Dapat Diganti Kapan Saja)</span>
            </div>
            <a
              href={qr.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-[#104F38] hover:text-[#0C3B2A] truncate block font-semibold hover:underline"
              title={qr.targetUrl}
            >
              {qr.targetUrl}
            </a>
          </div>

          <a
            href={qr.targetUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-[#104F38]/60 hover:text-[#104F38] hover:bg-white rounded transition-colors shrink-0"
            title="Buka URL tujuan di tab baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Right Section: Scans Metric & Primary Actions */}
        <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#104F38]/10">
          
          {/* Total Scan Count Badge */}
          <div className="hidden sm:block text-right pr-2">
            <div className="text-xs font-mono font-bold text-[#104F38] tabular-nums">
              {qr.totalScans.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#104F38]/60 font-semibold uppercase">Total Pindai</div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end w-full sm:w-auto">
            {/* Ganti Link Button */}
            <button
              onClick={() => onOpenEditLink(qr)}
              className="px-3.5 py-1.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white rounded-none text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#FFE600]" />
              <span>Ganti Link</span>
            </button>

            {/* Detail / Analytics */}
            <button
              onClick={() => onOpenAnalytics(qr)}
              className="px-3 py-1.5 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 rounded-none text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Statistik dan opsi cetak"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#104F38]/70" />
              <span className="hidden md:inline">Detail</span>
            </button>

            {/* Stand Akrilik Google Review */}
            {onOpenStandStudio && (
              <button
                onClick={() => onOpenStandStudio(qr)}
                className="px-3 py-1.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Buka Template Stand Akrilik Google Review"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#104F38]" />
                <span>Stand Review</span>
              </button>
            )}

            {/* Pause / Play status */}
            <button
              onClick={() => onToggleStatus(qr)}
              className={`p-1.5 rounded-none transition-colors cursor-pointer border ${
                isPaused
                  ? 'text-[#104F38] bg-[#FFE600] border-[#104F38]/30 font-bold'
                  : 'text-[#104F38]/60 hover:text-[#104F38] border-[#104F38]/15 hover:bg-[#F4FAF6]'
              }`}
              title={isPaused ? 'Aktifkan QR Code' : 'Jeda QR Code'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Delete button */}
            <button
              onClick={() => onDelete(qr)}
              className="p-1.5 text-[#104F38]/40 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="Hapus QR Code"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
