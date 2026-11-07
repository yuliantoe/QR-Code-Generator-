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
  Square,
  CheckSquare,
  ListFilter,
  CheckCheck,
  Eye,
  Crown
} from 'lucide-react';
import {
  renderGoogleReviewStandToCanvas,
  downloadStandCanvas,
  printStandSheet,
  printMultipleStandSheets,
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
  isWatermarkActive?: boolean;
  onOpenSubscriptionModal?: () => void;
}

export const StandDesignView: React.FC<StandDesignViewProps> = ({
  qrcodes,
  nfcTags,
  initialSelectedId,
  isWatermarkActive = false,
  onOpenSubscriptionModal
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Consolidate selectable sources - prioritize QR Codes as requested ("Pilih Data Tautan pilihannya kode QR")
  const items = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      type: 'qr' | 'nfc';
      url: string;
      rawUrl: string;
      code: string;
    }> = [];

    // Add QR codes first as primary choices (QR 001, QR 002, ...)
    qrcodes.forEach(qr => {
      list.push({
        id: `qr-${qr.id}`,
        title: qr.title || `QR #${qr.slug}`,
        type: 'qr',
        url: `${origin}/r/${qr.slug}`,
        rawUrl: qr.targetUrl,
        code: qr.code || 'QR 001'
      });
    });

    // Also include NFC tags if available
    nfcTags.forEach(tag => {
      list.push({
        id: `nfc-${tag.id}`,
        title: tag.placeName || `NFC Tag #${tag.id}`,
        type: 'nfc',
        url: `${origin}/nfc/${tag.id}`,
        rawUrl: tag.googleReviewUrl,
        code: `NFC-${tag.id.slice(0, 4).toUpperCase()}`
      });
    });

    return list;
  }, [qrcodes, nfcTags, origin]);

  // Selected item state (default to first QR code)
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (initialSelectedId) {
      const match = items.find(i => i.id === initialSelectedId || i.id.endsWith(initialSelectedId));
      if (match) return match.id;
    }
    const firstQR = items.find(i => i.type === 'qr');
    if (firstQR) return firstQR.id;
    return items.length > 0 ? items[0].id : '';
  });

  // Keep selected item valid if list loads, or sync when initialSelectedId changes
  useEffect(() => {
    if (initialSelectedId) {
      const match = items.find(i => i.id === initialSelectedId || i.id.endsWith(initialSelectedId));
      if (match) {
        setSelectedItemId(match.id);
        return;
      }
    }
    if (!selectedItemId || !items.some(i => i.id === selectedItemId)) {
      const firstQR = items.find(i => i.type === 'qr');
      if (firstQR) {
        setSelectedItemId(firstQR.id);
      } else if (items.length > 0) {
        setSelectedItemId(items[0].id);
      }
    }
  }, [items, selectedItemId, initialSelectedId]);

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

  // Sync place name when selected item changes or when title/targetUrl is edited
  useEffect(() => {
    if (selectedItem) {
      setPlaceName(selectedItem.title);
    }
  }, [selectedItem?.id, selectedItem?.title]);

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

  const activeRegCode = selectedItem?.code || 'QR 001';

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
        registrationCode: activeRegCode,
        placeName: placeName.trim(),
        themeColor,
        showPlaceName,
        width: dims.width,
        height: dims.height,
        watermark: isWatermarkActive
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [selectedTemplate, formatSize, activeQRText, activeRegCode, placeName, themeColor, showPlaceName, isWatermarkActive, selectedItem?.rawUrl, selectedItem?.url]);

  const handleDownloadHD = async (isPrintQuality: boolean = true) => {
    const offscreen = document.createElement('canvas');
    const dims = getStandDimensions(formatSize, isPrintQuality);

    await renderGoogleReviewStandToCanvas(offscreen, {
      templateId: selectedTemplate,
      formatSize,
      qrText: activeQRText,
      registrationCode: activeRegCode,
      placeName: placeName.trim(),
      themeColor,
      showPlaceName,
      width: dims.width,
      height: dims.height,
      watermark: isWatermarkActive
    });

    const safeTitle = (placeName || 'stand-google-review')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const sizeSlug = formatSize === 'a6' ? 'A6-105x148mm' : 'Kotak-1x1';
    downloadStandCanvas(offscreen, `${selectedTemplate}-${sizeSlug}-${safeTitle}-${dims.width}x${dims.height}px`);
  };

  // Selection Mode: 'single' (Pilihan Dropdown) vs 'checklist' (Pilihan Ceklis untuk Cetak Banyak Stand)
  const [selectionMode, setSelectionMode] = useState<'single' | 'checklist'>('single');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (initialSelectedId) {
      s.add(initialSelectedId);
    } else if (items.length > 0) {
      const firstQr = items.find(i => i.type === 'qr');
      if (firstQr) s.add(firstQr.id);
    }
    return s;
  });
  const [checklistSearch, setChecklistSearch] = useState('');
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState('');

  // Toggle single item in checklist
  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSelectedItemId(id);
  };

  // Check all QR codes
  const handleCheckAllQRs = () => {
    const allQrIds = items.filter(i => i.type === 'qr').map(i => i.id);
    setCheckedIds(new Set(allQrIds));
  };

  // Uncheck all
  const handleUncheckAll = () => {
    setCheckedIds(new Set());
  };

  const checkedItems = items.filter(i => checkedIds.has(i.id));

  const handlePrint = async () => {
    // If in checklist mode and multiple items checked:
    if (selectionMode === 'checklist' && checkedItems.length > 1) {
      setIsBatchPrinting(true);
      setBatchProgressText(`Menyiapkan ${checkedItems.length} lembar stand cetak...`);
      try {
        const dims = getStandDimensions(formatSize, true);
        const standsToPrint: Array<{ dataUrl: string; title: string; code: string }> = [];

        for (let i = 0; i < checkedItems.length; i++) {
          const item = checkedItems[i];
          setBatchProgressText(`Membuat lembar ${i + 1} dari ${checkedItems.length} (${item.code})...`);
          const tempCanvas = document.createElement('canvas');
          const qrText = urlMode === 'dynamic' ? item.url : item.rawUrl;

          await renderGoogleReviewStandToCanvas(tempCanvas, {
            templateId: selectedTemplate,
            formatSize,
            qrText,
            registrationCode: item.code,
            placeName: showPlaceName ? placeName.trim() : item.title,
            themeColor,
            showPlaceName,
            width: dims.width,
            height: dims.height,
            watermark: isWatermarkActive
          });

          standsToPrint.push({
            dataUrl: tempCanvas.toDataURL('image/png', 0.95),
            title: item.title,
            code: item.code
          });
        }

        printMultipleStandSheets(standsToPrint, formatSize);
      } catch (err) {
        console.error('Batch print error:', err);
      } finally {
        setIsBatchPrinting(false);
        setBatchProgressText('');
      }
      return;
    }

    // Single stand print
    if (!previewCanvasRef.current) return;
    printStandSheet(
      previewCanvasRef.current,
      `Stand Google Review (${selectedTemplate}) - ${activeRegCode} ${placeName}`,
      formatSize
    );
  };

  const handleDownloadBatchChecked = async () => {
    if (checkedItems.length === 0) return;
    setIsBatchPrinting(true);
    setBatchProgressText(`Mengunduh ${checkedItems.length} stand meja...`);
    try {
      const dims = getStandDimensions(formatSize, true);
      for (let i = 0; i < checkedItems.length; i++) {
        const item = checkedItems[i];
        setBatchProgressText(`Mengunduh ${i + 1}/${checkedItems.length}: ${item.code}...`);
        const tempCanvas = document.createElement('canvas');
        const qrText = urlMode === 'dynamic' ? item.url : item.rawUrl;

        await renderGoogleReviewStandToCanvas(tempCanvas, {
          templateId: selectedTemplate,
          formatSize,
          qrText,
          registrationCode: item.code,
          placeName: showPlaceName ? placeName.trim() : item.title,
          themeColor,
          showPlaceName,
          width: dims.width,
          height: dims.height,
          watermark: isWatermarkActive
        });

        const safeCode = item.code.replace(/\s+/g, '-');
        const safeTitle = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
        downloadStandCanvas(tempCanvas, `stand-${safeCode}-${selectedTemplate}-${safeTitle}`);

        if (i < checkedItems.length - 1) {
          await new Promise(r => setTimeout(r, 450));
        }
      }
    } catch (err) {
      console.error('Batch download error:', err);
    } finally {
      setIsBatchPrinting(false);
      setBatchProgressText('');
    }
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
            {selectionMode === 'checklist' && checkedItems.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadBatchChecked}
                  disabled={isBatchPrinting}
                  className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#104F38]" />
                  <span>Unduh Semua ({checkedItems.length} Stand HD)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isBatchPrinting}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#FFE600]" />
                  <span>Cetak {checkedItems.length} Stand Ceklis</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleDownloadHD(true)}
                  disabled={isBatchPrinting}
                  className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#104F38]" />
                  <span>Unduh Siap Cetak ({formatSize === 'a6' ? 'A6 300 DPI' : 'HD 2400px'})</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isBatchPrinting}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#FFE600]" />
                  <span>Cetak Stand {formatSize === 'a6' ? 'A6' : 'Kotak'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trial Watermark Notice Banner */}
      {isWatermarkActive && (
        <div className="bg-amber-50 border-2 border-amber-400 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <span className="text-rose-600 font-black text-xs bg-rose-100 border border-rose-300 px-2 py-0.5 mt-0.5 shrink-0">
              WATERMARK AKTIF (TRIAL)
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
                Desain Stand Meja & QR Code Anda saat ini memiliki Watermark "Trial 3 Hari"
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Tingkatkan ke <strong>Paket Pro Bulanan (Rp 49.000)</strong> atau <strong>Paket Bisnis Tahunan (Rp 399.000)</strong> untuk langsung mencetak bersih tanpa watermark selamanya.
              </p>
            </div>
          </div>

          {onOpenSubscriptionModal && (
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="px-4 py-2 bg-[#104F38] hover:bg-[#0c3c2b] text-white text-xs font-black flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Crown className="w-4 h-4 text-[#FFE600]" />
              <span>Hapus Watermark (Pilih Paket)</span>
            </button>
          )}
        </div>
      )}

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

          {/* Card 1: Pilih Sumber QR Code / Mode Ceklis Cetak Banyak */}
          <div className="bg-white border border-[#104F38]/20 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#104F38]/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#104F38]" />
                <h3 className="text-sm font-bold text-[#104F38]">
                  1. Pilih Data Tautan (Kode QR)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                {selectionMode === 'checklist' && (
                  <span className="text-[10px] font-bold bg-[#FFE600] text-[#104F38] px-2 py-0.5 border border-[#104F38]/20 font-mono">
                    {checkedIds.size} Stand Terpilih
                  </span>
                )}
                <span className="text-[10px] font-bold bg-[#F4FAF6] text-[#104F38] px-2 py-0.5 border border-[#104F38]/20 font-mono">
                  {items.filter(i => i.type === 'qr').length} Kode QR
                </span>
              </div>
            </div>

            {/* Selection Mode Switcher: Single vs Checklist */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F4FAF6] border border-[#104F38]/20">
              <button
                type="button"
                onClick={() => setSelectionMode('single')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectionMode === 'single'
                    ? 'bg-[#104F38] text-white shadow-xs'
                    : 'text-[#104F38] hover:bg-white'
                }`}
              >
                <span>Pilihan Tunggal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectionMode('checklist');
                  if (checkedIds.size === 0) {
                    handleCheckAllQRs();
                  }
                }}
                className={`flex-1 py-1.5 px-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectionMode === 'checklist'
                    ? 'bg-[#104F38] text-white shadow-xs'
                    : 'text-[#104F38] hover:bg-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>Pilihan Ceklis Cetak Banyak ({checkedIds.size})</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-4 bg-[#F4FAF6] border border-[#104F38]/20 text-xs text-[#104F38]/80 text-center">
                Belum ada QR Code. Buat QR Code dinamis terlebih dahulu.
              </div>
            ) : selectionMode === 'single' ? (
              /* SINGLE MODE DROPDOWN */
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#104F38] flex items-center justify-between">
                  <span>Pilih Data Tautan:</span>
                  <span className="text-[10px] text-[#104F38]/70 font-normal">
                    Pilihan Kode QR otomatis
                  </span>
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#104F38]/20 rounded-none focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-semibold text-[#104F38] cursor-pointer"
                >
                  <optgroup label="Daftar Kode QR (QR 001, QR 002, ...)">
                    {items.filter(i => i.type === 'qr').map(item => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.title}
                      </option>
                    ))}
                  </optgroup>
                  {items.some(i => i.type === 'nfc') && (
                    <optgroup label="Tag NFC Google Review (Opsional)">
                      {items.filter(i => i.type === 'nfc').map(item => (
                        <option key={item.id} value={item.id}>
                          {item.code} — {item.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Selected item summary */}
                {selectedItem && (
                  <div className="p-3 bg-[#F8FAF9] border border-[#104F38]/15 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black text-[#104F38] bg-[#FFE600] px-1.5 py-0.5 border border-[#104F38]/20">
                          {selectedItem.code}
                        </span>
                        <span className="font-bold text-[#104F38] truncate">{selectedItem.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#104F38]/60 uppercase">
                        {selectedItem.type === 'qr' ? 'Kode QR Dinamis' : 'Tag NFC'}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-[#104F38]/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#104F38]/70 font-semibold">Tautan Cetak Fisik:</span>
                        <div className="font-mono text-[#104F38] flex items-center gap-1.5">
                          <span className="font-bold truncate max-w-[180px] sm:max-w-[240px]">{activeQRText}</span>
                          <button
                            onClick={handleCopy}
                            className="text-[10px] font-bold text-[#104F38] bg-white px-2 py-0.5 border border-[#104F38]/20 hover:bg-[#FFE600] shrink-0 cursor-pointer"
                          >
                            {copiedLink ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="truncate mr-2">
                          <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
                            Tautan Tujuan Aktif (Ketika Discan):
                          </span>
                          <span className="font-mono text-[11px] text-emerald-900 font-extrabold truncate block">
                            {selectedItem.rawUrl}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold bg-[#104F38] text-white px-2 py-0.5 border border-[#104F38] self-start sm:self-center shrink-0">
                          ✓ Terupdate & Aktif
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-[#FFFDEB] border border-[#FFE600]/60 text-[11px] text-[#104F38] flex items-center justify-between">
                  <span>💡 Mau cetak 5, 10, atau 15 stand sekaligus?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode('checklist');
                      handleCheckAllQRs();
                    }}
                    className="font-bold underline hover:text-black cursor-pointer text-xs"
                  >
                    Buka Pilihan Ceklis →
                  </button>
                </div>
              </div>
            ) : (
              /* CHECKLIST MODE (PILIHAN CEKLIS KODE DATA TAUTAN) */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#104F38] flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#104F38]" />
                    <span>Ceklis Stand yang Ingin Dicetak:</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={handleCheckAllQRs}
                      className="px-2 py-0.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 font-bold text-[11px] cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleUncheckAll}
                      className="px-2 py-0.5 bg-white hover:bg-[#F8FAF9] text-[#104F38] border border-[#104F38]/20 font-medium text-[11px] cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                {/* Search filter inside checklist */}
                <div className="relative">
                  <input
                    type="text"
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    placeholder="Saring kode (contoh: QR 001) atau nama meja..."
                    className="w-full pl-3 pr-3 py-1.5 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-1 focus:ring-[#104F38] text-[#104F38]"
                  />
                </div>

                {/* Scrollable Checkbox List */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 border border-[#104F38]/20 p-2 bg-[#F8FAF9]">
                  {items
                    .filter(item => {
                      if (!checklistSearch.trim()) return true;
                      const q = checklistSearch.toLowerCase();
                      return (
                        item.code.toLowerCase().includes(q) ||
                        item.title.toLowerCase().includes(q) ||
                        item.url.toLowerCase().includes(q)
                      );
                    })
                    .map(item => {
                      const isChecked = checkedIds.has(item.id);
                      const isPreviewed = selectedItemId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 text-xs border transition-all ${
                            isChecked
                              ? 'bg-white border-[#104F38]/30 shadow-2xs'
                              : 'bg-white/50 border-slate-200 text-slate-500'
                          } ${isPreviewed ? 'ring-2 ring-[#0038CB] border-transparent' : ''}`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 mr-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCheck(item.id)}
                              className="w-4 h-4 text-[#104F38] rounded-none border-[#104F38]/40 focus:ring-0 cursor-pointer accent-[#104F38]"
                            />
                            <span className="font-mono font-black text-[10px] bg-[#FFE600] text-[#104F38] px-1.5 py-0.5 border border-[#104F38]/30 shrink-0">
                              {item.code}
                            </span>
                            <span className="font-bold text-[#104F38] truncate">{item.title}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setSelectedItemId(item.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 border transition-all cursor-pointer shrink-0 ${
                              isPreviewed
                                ? 'bg-[#0038CB] text-white border-[#0038CB]'
                                : 'bg-white text-[#104F38] border-[#104F38]/20 hover:bg-[#FFE600]'
                            }`}
                            title="Tampilkan pada Pratinjau Kanvas"
                          >
                            {isPreviewed ? 'Pratinjau' : 'Lihat'}
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Checked Summary Banner */}
                <div className="p-2.5 bg-[#F4FAF6] border border-[#104F38]/20 text-xs text-[#104F38] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-[#104F38]" />
                    <span className="font-bold">
                      {checkedIds.size} Stand Meja Diceklis Siap Cetak
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#FFE600] px-1.5 py-0.5 border border-[#104F38]/20">
                    Format {formatSize.toUpperCase()}
                  </span>
                </div>
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

            {/* Download & Print Buttons Bar */}
            {isBatchPrinting ? (
              <div className="p-4 bg-[#F4FAF6] border border-[#104F38]/30 text-center space-y-2 animate-in fade-in">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#104F38]">
                  <span className="w-3.5 h-3.5 border-2 border-[#104F38] border-t-transparent rounded-full animate-spin" />
                  <span>{batchProgressText || 'Sedang memproses stand meja...'}</span>
                </div>
                <div className="w-full bg-[#104F38]/10 h-1.5 overflow-hidden">
                  <div className="bg-[#104F38] h-full w-2/3 animate-pulse" />
                </div>
                <span className="text-[10px] text-[#104F38]/70 block">
                  Mohon tunggu sebentar, setiap stand meja sedang disiapkan dengan resolusi tinggi...
                </span>
              </div>
            ) : (
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

                {/* Option 2: PNG Super HD / Batch Download */}
                {selectionMode === 'checklist' && checkedItems.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleDownloadBatchChecked}
                    className="p-3 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span>Unduh Semua ({checkedItems.length} Stand)</span>
                      <Download className="w-3.5 h-3.5 text-[#104F38]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#104F38]/70">
                      Format PNG HD Tiap Meja ({formatSize.toUpperCase()})
                    </span>
                  </button>
                ) : (
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
                )}

                {/* Option 3: Print Sheet */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-3 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span>
                      {selectionMode === 'checklist' && checkedItems.length > 1
                        ? `Cetak ${checkedItems.length} Stand (Ceklis)`
                        : 'Cetak Lembar Stand'}
                    </span>
                    <Printer className="w-3.5 h-3.5 text-[#FFE600]" />
                  </div>
                  <span className="text-[10px] font-normal text-white/80">
                    {selectionMode === 'checklist' && checkedItems.length > 1
                      ? `${checkedItems.length} lembar berturut-turut`
                      : formatSize === 'a6' ? 'A4 Format Cetak A6' : 'Langsung ke Printer / PDF'}
                  </span>
                </button>

              </div>
            )}

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
