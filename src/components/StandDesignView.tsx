import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Printer,
  Sparkles,
  Check,
  Sliders,
  RotateCcw,
  Palette,
  Layers,
  Maximize2,
  Square
} from 'lucide-react';
import {
  renderGoogleReviewStandToCanvas,
  downloadStandCanvas,
  printStandSheet,
  STAND_TEMPLATES,
  getStandDimensions,
  isA6Template,
  type StandTemplateId,
  type StandFormatSize
} from '../utils/googleReviewStandRenderer.ts';
import type { DynamicQRCode, NFCTag } from '../types.ts';

interface StandDesignViewProps {
  qrcodes: DynamicQRCode[];
  nfcTags: NFCTag[];
  initialSelectedId?: string;
  onOpenCreateQR?: () => void;
  onOpenActivateNFC?: () => void;
}

export const StandDesignView: React.FC<StandDesignViewProps> = ({
  qrcodes,
  nfcTags,
  initialSelectedId
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Consolidate all selectable sources (QR Codes and NFC Tags)
  const items = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      type: 'qr' | 'nfc';
      url: string;
      rawUrl: string;
    }> = [];

    // Add NFC tags first (they are natively for Google Review)
    nfcTags.forEach(tag => {
      list.push({
        id: `nfc-${tag.id}`,
        title: tag.placeName || `NFC Tag #${tag.id}`,
        type: 'nfc',
        url: `${origin}/nfc/${tag.id}`,
        rawUrl: tag.googleReviewUrl
      });
    });

    // Add QR codes
    qrcodes.forEach(qr => {
      list.push({
        id: `qr-${qr.id}`,
        title: qr.title || `QR #${qr.slug}`,
        type: 'qr',
        url: `${origin}/r/${qr.slug}`,
        rawUrl: qr.targetUrl
      });
    });

    return list;
  }, [qrcodes, nfcTags, origin]);

  // Selected item state
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (initialSelectedId) {
      const match = items.find(i => i.id === initialSelectedId || i.id.endsWith(initialSelectedId));
      if (match) return match.id;
    }
    return items.length > 0 ? items[0].id : '';
  });

  // Keep selected item valid if list loads
  useEffect(() => {
    if ((!selectedItemId || !items.some(i => i.id === selectedItemId)) && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  const selectedItem = items.find(i => i.id === selectedItemId) || items[0];

  // Active Template State (Defaults to A6 Blue Cutout from user request)
  const [selectedTemplate, setSelectedTemplate] = useState<StandTemplateId>('a6-blue-cutout');
  
  // Format Size: A6 (105x148mm) vs Persegi (1:1)
  const [formatSize, setFormatSize] = useState<StandFormatSize>('a6');
  
  // Template Filter Tab: 'all' | 'a6' | 'square'
  const [templateFilter, setTemplateFilter] = useState<'all' | 'a6' | 'square'>('all');

  // Customization State
  const [themeColor, setThemeColor] = useState<string>('#0038CB');
  const [placeName, setPlaceName] = useState<string>(selectedItem?.title || '');
  const [showPlaceName, setShowPlaceName] = useState<boolean>(false);
  const [urlMode, setUrlMode] = useState<'dynamic' | 'direct'>('dynamic');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync place name when selected item changes
  useEffect(() => {
    if (selectedItem) {
      setPlaceName(selectedItem.title);
    }
  }, [selectedItem?.id]);

  // Auto-sync formatSize when a template is selected
  const handleSelectTemplate = (tmplId: StandTemplateId) => {
    setSelectedTemplate(tmplId);
    if (isA6Template(tmplId)) {
      setFormatSize('a6');
    } else {
      setFormatSize('square');
    }
  };

  // Compute the exact QR text to encode
  const activeQRText = selectedItem
    ? (urlMode === 'dynamic' ? selectedItem.url : selectedItem.rawUrl)
    : `${origin}/r/review`;

  // Render to canvas
  const renderCanvas = async () => {
    if (!previewCanvasRef.current) return;
    setIsRendering(true);
    try {
      const dims = getStandDimensions(formatSize, false);
      await renderGoogleReviewStandToCanvas(previewCanvasRef.current, {
        templateId: selectedTemplate,
        formatSize,
        qrText: activeQRText,
        placeName: placeName.trim(),
        themeColor,
        showPlaceName,
        width: dims.width,
        height: dims.height
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [selectedTemplate, formatSize, activeQRText, placeName, themeColor, showPlaceName]);

  const handleDownloadHD = async (isPrintQuality: boolean = true) => {
    const offscreen = document.createElement('canvas');
    const dims = getStandDimensions(formatSize, isPrintQuality);

    await renderGoogleReviewStandToCanvas(offscreen, {
      templateId: selectedTemplate,
      formatSize,
      qrText: activeQRText,
      placeName: placeName.trim(),
      themeColor,
      showPlaceName,
      width: dims.width,
      height: dims.height
    });

    const safeTitle = (placeName || 'stand-google-review')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const sizeSlug = formatSize === 'a6' ? 'A6-105x148mm' : 'Kotak-1x1';
    downloadStandCanvas(offscreen, `${selectedTemplate}-${sizeSlug}-${safeTitle}-${dims.width}x${dims.height}px`);
  };

  const handlePrint = () => {
    if (!previewCanvasRef.current) return;
    printStandSheet(
      previewCanvasRef.current,
      `Stand Google Review (${selectedTemplate}) - ${placeName}`,
      formatSize
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeQRText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter templates list
  const filteredTemplates = STAND_TEMPLATES.filter(tmpl => {
    if (templateFilter === 'a6') return tmpl.formatSize === 'a6';
    if (templateFilter === 'square') return tmpl.formatSize === 'square';
    return true;
  });

  return (
    <div className="space-y-8">
      
      {/* Masthead Banner */}
      <div className="bg-white border border-[#104F38]/20 p-6 sm:p-8 relative overflow-hidden">
        <div className="w-24 h-24 rounded-full bg-[#FCD5CE] absolute -top-4 -right-4 -z-0 opacity-80 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#104F38] bg-[#FFE600] px-2.5 py-0.5 border border-[#104F38]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#104F38]" />
              <span>Studio Stand Akrilik Google Review Meja</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#104F38] leading-tight">
              Desain Stand Meja Ukuran A6 & Kotak Akrilik
            </h1>
            <p className="text-xs sm:text-sm text-[#104F38]/80 leading-relaxed font-medium">
              Tersedia 4 desain khusus <strong>Ukuran A6 (105 × 148 mm)</strong> standar stand akrilik meja kasir/kafe (Lengkung Biru, Onyx Hitam, Kubah Biru, 4-Warna Kuadran) serta 5 desain format persegi. QR Code & instruksi Tap NFC terpasang otomatis untuk mempercepat ulasan bintang 5 bisnis Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleDownloadHD(true)}
              className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#104F38]" />
              <span>Unduh Siap Cetak ({formatSize === 'a6' ? 'A6 300 DPI' : 'HD 2400px'})</span>
            </button>
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#FFE600]" />
              <span>Cetak Stand {formatSize === 'a6' ? 'A6' : 'Kotak'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION: FORMAT SIZE & TEMPLATE PICKER */}
      <div className="bg-white border border-[#104F38]/20 p-4 sm:p-5 space-y-4">
        
        {/* Header with Format Selector & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#104F38]/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#104F38]" />
            <h2 className="text-xs sm:text-sm font-extrabold text-[#104F38]">
              PILIH TEMPLATE DESAIN STAND (9 VARIASI)
            </h2>
          </div>

          {/* Quick Size Format Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[#104F38]/70">Ukuran Stand:</span>
            <div className="inline-flex p-1 bg-[#F4FAF6] border border-[#104F38]/15 gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTemplateFilter('all');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                  templateFilter === 'all'
                    ? 'bg-[#104F38] text-white'
                    : 'text-[#104F38] hover:bg-white'
                }`}
              >
                Semua (9)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateFilter('a6');
                  setFormatSize('a6');
                  if (!isA6Template(selectedTemplate)) {
                    setSelectedTemplate('a6-blue-cutout');
                  }
                }}
                className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  templateFilter === 'a6'
                    ? 'bg-[#FFE600] text-[#104F38]'
                    : 'text-[#104F38] hover:bg-white'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span>Stand Meja A6 (4 Baru)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateFilter('square');
                  setFormatSize('square');
                  if (isA6Template(selectedTemplate)) {
                    setSelectedTemplate('classic-blue');
                  }
                }}
                className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  templateFilter === 'square'
                    ? 'bg-[#104F38] text-white'
                    : 'text-[#104F38] hover:bg-white'
                }`}
              >
                <Square className="w-3 h-3" />
                <span>Persegi 1:1 (5)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid (Responsive) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {filteredTemplates.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            const isA6 = tmpl.formatSize === 'a6';
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-3 text-left border transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#104F38] bg-[#F4FAF6] ring-2 ring-[#FFE600] shadow-xs'
                    : 'border-[#104F38]/20 bg-white hover:border-[#104F38]/50 hover:bg-[#FAFCFB]'
                }`}
              >
                {/* Header Tag Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                    isSelected
                      ? 'bg-[#104F38] text-white border-[#104F38]'
                      : isA6
                      ? 'bg-[#FFE600] text-[#104F38] border-[#104F38]/20'
                      : 'bg-[#F4FAF6] text-[#104F38] border-[#104F38]/20'
                  }`}>
                    {tmpl.badge}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#104F38] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 mb-2">
                  {tmpl.previewColors.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Title & Desc */}
                <div>
                  <h4 className={`text-xs font-extrabold ${isSelected ? 'text-[#104F38]' : 'text-slate-900'}`}>
                    {tmpl.name}
                  </h4>
                  <p className="text-[10px] text-[#104F38]/70 line-clamp-2 mt-1 leading-snug">
                    {tmpl.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio 2-Column: Left Controls, Right Realtime Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls & QR Selection (order-2 on mobile, order-1 on desktop) */}
        <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
          
          {/* Card 0: Pilihan Dimensi / Ukuran Stand */}
          <div className="bg-white border border-[#104F38]/20 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#104F38]/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-[#104F38]" />
                <h3 className="text-sm font-bold text-[#104F38]">
                  Dimensi & Format Akrilik Meja
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-[#FFE600] text-[#104F38] px-2 py-0.5 border border-[#104F38]/20">
                {formatSize === 'a6' ? 'Ukuran A6 (105×148 mm)' : 'Kotak 1:1'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFormatSize('a6')}
                className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  formatSize === 'a6'
                    ? 'border-[#104F38] bg-[#F4FAF6] font-bold text-[#104F38] ring-1 ring-[#104F38]'
                    : 'border-[#104F38]/20 bg-white text-[#104F38]/70 hover:bg-[#F8FAF9]'
                }`}
              >
                <div>
                  <div className="font-extrabold text-[#104F38] flex items-center justify-between">
                    <span>Stand Meja A6</span>
                    <span className="text-[9px] bg-[#FFE600] px-1 py-0.2 text-[#104F38]">Favorit</span>
                  </div>
                  <div className="text-[10px] text-[#104F38]/70 font-normal mt-0.5">
                    105 × 148 mm (Vertikal)
                  </div>
                </div>
                <div className="text-[9px] text-[#104F38]/60 mt-2 font-mono">
                  Stand akrilik meja kasir standar
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormatSize('square')}
                className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  formatSize === 'square'
                    ? 'border-[#104F38] bg-[#F4FAF6] font-bold text-[#104F38] ring-1 ring-[#104F38]'
                    : 'border-[#104F38]/20 bg-white text-[#104F38]/70 hover:bg-[#F8FAF9]'
                }`}
              >
                <div>
                  <div className="font-extrabold text-[#104F38]">
                    Stand Kotak (1:1)
                  </div>
                  <div className="text-[10px] text-[#104F38]/70 font-normal mt-0.5">
                    Persegi Simetris
                  </div>
                </div>
                <div className="text-[9px] text-[#104F38]/60 mt-2 font-mono">
                  Akrilik kubus / tent card kotak
                </div>
              </button>
            </div>
          </div>

          {/* Card 1: Pilih Sumber QR Code / NFC */}
          <div className="bg-white border border-[#104F38]/20 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#104F38]/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#104F38]" />
                <h3 className="text-sm font-bold text-[#104F38]">
                  1. Pilih Data QR Code / NFC
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-[#F4FAF6] text-[#104F38] px-2 py-0.5 border border-[#104F38]/15">
                {items.length} Data Tersedia
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-4 bg-[#F4FAF6] border border-[#104F38]/20 text-xs text-[#104F38]/80 text-center">
                Belum ada QR Code atau NFC Tag. Buat QR terlebih dahulu atau gunakan tautan simulasi.
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#104F38]">
                  Pilih Data Tautan:
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#104F38]/20 rounded-none focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-semibold text-[#104F38] cursor-pointer"
                >
                  <optgroup label="Tag NFC Google Review (Rekomendasi)">
                    {items.filter(i => i.type === 'nfc').map(item => (
                      <option key={item.id} value={item.id}>
                        [NFC] {item.title}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Daftar QRIS & QR Code">
                    {items.filter(i => i.type === 'qr').map(item => (
                      <option key={item.id} value={item.id}>
                        [QR] {item.title}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Selected item summary */}
                {selectedItem && (
                  <div className="p-3 bg-[#F8FAF9] border border-[#104F38]/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#104F38]">{selectedItem.title}</span>
                      <span className="text-[10px] uppercase font-bold text-[#104F38]/60">
                        {selectedItem.type === 'nfc' ? 'Chip NFC Review' : 'QR Code'}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-[#104F38] truncate flex items-center justify-between gap-2 pt-1 border-t border-[#104F38]/10">
                      <span className="truncate">{activeQRText}</span>
                      <button
                        onClick={handleCopy}
                        className="text-[10px] font-bold text-[#104F38] bg-white px-2 py-0.5 border border-[#104F38]/20 hover:bg-[#FFE600] shrink-0 cursor-pointer"
                      >
                        {copiedLink ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode URL */}
            <div className="pt-2 border-t border-[#104F38]/10 space-y-2">
              <label className="block text-xs font-bold text-[#104F38]">
                Jenis URL yang Dicetak ke QR:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUrlMode('dynamic')}
                  className={`p-2.5 text-left border transition-all cursor-pointer ${
                    urlMode === 'dynamic'
                      ? 'border-[#104F38] bg-[#F4FAF6] font-bold text-[#104F38]'
                      : 'border-[#104F38]/20 bg-white text-[#104F38]/70 hover:bg-[#F8FAF9]'
                  }`}
                >
                  <div className="font-bold">Dinamis (Rekomendasi)</div>
                  <div className="text-[10px] text-[#104F38]/60 font-normal mt-0.5">
                    Bisa ganti link kapan saja tanpa cetak ulang
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrlMode('direct')}
                  className={`p-2.5 text-left border transition-all cursor-pointer ${
                    urlMode === 'direct'
                      ? 'border-[#104F38] bg-[#F4FAF6] font-bold text-[#104F38]'
                      : 'border-[#104F38]/20 bg-white text-[#104F38]/70 hover:bg-[#F8FAF9]'
                  }`}
                >
                  <div className="font-bold">Langsung Google</div>
                  <div className="text-[10px] text-[#104F38]/60 font-normal mt-0.5">
                    Langsung ke URL Google Maps / Review
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Card 2: Pengaturan Desain & Nama Usaha */}
          <div className="bg-white border border-[#104F38]/20 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#104F38]/10 pb-3">
              <Palette className="w-4 h-4 text-[#104F38]" />
              <h3 className="text-sm font-bold text-[#104F38]">
                2. Detail Desain & Teks Tambahan
              </h3>
            </div>

            {/* Template specific color customization for Blue Templates */}
            {(selectedTemplate === 'a6-blue-cutout' || selectedTemplate === 'a6-blue-dome' || selectedTemplate === 'classic-blue') && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#104F38]">
                  Warna Header Biru:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Biru Asli', color: '#0038CB' },
                    { name: 'Google Blue', color: '#1A73E8' },
                    { name: 'Forest Green', color: '#104F38' },
                    { name: 'Onyx Hitam', color: '#111827' }
                  ].map(item => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() => setThemeColor(item.color)}
                      className={`py-2 px-1 text-center border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        themeColor === item.color
                          ? 'border-[#104F38] ring-2 ring-[#FFE600] font-extrabold'
                          : 'border-[#104F38]/20 hover:border-[#104F38]/40'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/20"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate w-full text-[10px]">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nama Tempat / Usaha */}
            <div className="space-y-2 pt-2 border-t border-[#104F38]/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#104F38]">
                  Sertakan Nama Tempat / Cabang:
                </label>
                <input
                  type="checkbox"
                  id="showPlace"
                  checked={showPlaceName}
                  onChange={(e) => setShowPlaceName(e.target.checked)}
                  className="w-4 h-4 text-[#104F38] rounded-none cursor-pointer"
                />
              </div>

              {showPlaceName && (
                <input
                  type="text"
                  placeholder="Misal: Kopi Kenangan - Senayan City"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/20 rounded-none focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-semibold text-[#104F38]"
                />
              )}
            </div>

            {/* Template specs callout */}
            <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/15 text-xs text-[#104F38]/80">
              <div className="flex items-center gap-1.5 font-bold text-[#104F38] mb-1">
                <span>Template Aktif:</span>
                <span className="text-[#0038CB]">
                  {STAND_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </span>
              </div>
              <p className="text-[11px]">
                {STAND_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
              </p>
            </div>

            {/* Reset */}
            <div className="pt-2 border-t border-[#104F38]/10">
              <button
                type="button"
                onClick={() => {
                  setThemeColor('#0038CB');
                  setShowPlaceName(false);
                }}
                className="w-full py-2 text-xs font-semibold text-[#104F38] bg-[#F4FAF6] border border-[#104F38]/20 hover:bg-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pengaturan Teks</span>
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Live Canvas Preview & Download Strip (order-1 on mobile, order-2 on desktop) */}
        <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
          
          <div className="bg-white border border-[#104F38]/20 p-5 space-y-4">
            
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#104F38] flex items-center gap-1.5">
                  <span>Pratinjau Stand Akrilik {formatSize === 'a6' ? 'Ukuran A6' : 'Format Kotak'}</span>
                  {isRendering && (
                    <span className="text-[10px] text-[#104F38]/60 animate-pulse font-normal">
                      (Merender...)
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-[#104F38]/60">
                  {formatSize === 'a6'
                    ? 'Proporsi Stand Meja A6 (105 × 148 mm). QR Code & instruksi Tap NFC terpasang rapi.'
                    : 'Proporsi Persegi 1:1. Cocok untuk stand kubus atau tent card akrilik meja simetris.'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold bg-[#FFE600] text-[#104F38] px-2 py-0.5 border border-[#104F38]/20">
                  {formatSize === 'a6' ? 'Stand Meja A6' : 'Rasio 1:1'}
                </span>
              </div>
            </div>

            {/* Canvas Preview Container (Dynamically Sized based on format) */}
            <div className="bg-stone-100/70 p-4 border border-[#104F38]/15 flex items-center justify-center relative overflow-hidden min-h-[380px]">
              <canvas
                ref={previewCanvasRef}
                className={`w-full ${
                  formatSize === 'a6' ? 'max-w-[340px] sm:max-w-[380px]' : 'max-w-[440px]'
                } h-auto shadow-md block border border-slate-300 rounded-lg transition-all`}
                style={{ aspectRatio: formatSize === 'a6' ? '105/148' : '1/1' }}
              />
            </div>

            {/* Download Buttons Bar */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Option 1: PNG Standar */}
              <button
                type="button"
                onClick={() => handleDownloadHD(false)}
                className="p-3 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span>PNG Standar</span>
                  <Download className="w-3.5 h-3.5 text-[#104F38]/60" />
                </div>
                <span className="text-[10px] font-normal text-[#104F38]/60">
                  {formatSize === 'a6' ? '1200 × 1692 px (Digital)' : '1200 × 1200 px (Digital)'}
                </span>
              </button>

              {/* Option 2: PNG Super HD (Print Quality) */}
              <button
                type="button"
                onClick={() => handleDownloadHD(true)}
                className="p-3 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span>PNG Super HD (300 DPI)</span>
                  <Download className="w-3.5 h-3.5 text-[#104F38]" />
                </div>
                <span className="text-[10px] font-bold text-[#104F38]/70">
                  {formatSize === 'a6' ? '2400 × 3384 px (Siap Cetak A6)' : '2400 × 2400 px (Siap Cetak)'}
                </span>
              </button>

              {/* Option 3: Print Sheet */}
              <button
                type="button"
                onClick={handlePrint}
                className="p-3 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span>Cetak Lembar Stand</span>
                  <Printer className="w-3.5 h-3.5 text-[#FFE600]" />
                </div>
                <span className="text-[10px] font-normal text-white/80">
                  {formatSize === 'a6' ? 'A4 Format Cetak A6' : 'Langsung ke Printer / PDF'}
                </span>
              </button>

            </div>

            {/* Instruction Notice */}
            <div className="p-3.5 bg-[#F4FAF6] border border-[#104F38]/15 text-xs text-[#104F38]/80 space-y-1">
              <strong className="text-[#104F38] font-bold block">
                💡 Petunjuk Penggunaan Stand Akrilik Meja A6:
              </strong>
              <p className="text-[11px] leading-relaxed">
                1. Pilih salah satu dari <strong>4 Desain Stand Meja A6</strong> (atau 5 desain persegi) di atas.<br />
                2. Unduh format <strong>PNG Super HD (300 DPI)</strong> lalu cetak pada kertas foto/art carton ukuran <strong>A6 (105 × 148 mm)</strong>.<br />
                3. Tempelkan chip/stiker stiker NFC fisik di bagian belakang lambang <strong>TAP UNTUK REVIEW</strong>.<br />
                4. Selipkan ke dalam stand akrilik meja (T-Shape, L-Shape, atau Stand Segitiga). Pelanggan kasir cukup tap HP atau scan QR untuk memberikan ulasan bintang 5 Google Review secara instan!
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
