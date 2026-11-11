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
import { WhatsAppWelcomeEditor } from './WhatsAppWelcomeEditor.tsx';
import { parseWhatsAppUrl, buildWhatsAppUrl, WHATSAPP_HEADING_PRESETS } from '../utils/whatsappPresets.ts';

interface StandDesignViewProps {
  qrcodes: DynamicQRCode[];
  nfcTags: NFCTag[];
  initialSelectedId?: string;
  onOpenCreateQR?: () => void;
  onOpenActivateNFC?: () => void;
  onUpdateQR?: (updatedQR: DynamicQRCode) => void;
}

export const StandDesignView: React.FC<StandDesignViewProps> = ({
  qrcodes,
  nfcTags,
  initialSelectedId,
  onOpenCreateQR,
  onOpenActivateNFC,
  onUpdateQR
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

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Dedicated sync function for active slug in cloud sync store
  const syncCurrentSlugToCloud = async (force: boolean = false) => {
    if (!selectedItem || selectedItem.type !== 'qr' || !selectedItem.url || !selectedItem.rawUrl) return;
    const slug = selectedItem.url.split('/r/')[1]?.split('?')[0]?.toLowerCase().trim();
    if (!slug) return;

    setCloudSyncStatus('syncing');
    try {
      // Dual-dispatch to backend endpoint
      fetch('/api/qrcodes/sync-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugMap: { [slug]: selectedItem.rawUrl.trim() } })
      }).catch(() => {});

      // Direct cloud object sync to api.restful-api.dev
      const getRes = await fetch(`https://api.restful-api.dev/objects/ff808181a09d98f701a1b392719d5825`);
      let current: Record<string, string> = {};
      if (getRes.ok) {
        const obj = await getRes.json();
        if (obj?.data && typeof obj.data === 'object') {
          current = obj.data;
        }
      }
      if (force || current[slug] !== selectedItem.rawUrl.trim()) {
        current[slug] = selectedItem.rawUrl.trim();
        await fetch(`https://api.restful-api.dev/objects/ff808181a09d98f701a1b392719d5825`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'dinamis_qr', data: current })
        });
      }
      setCloudSyncStatus('synced');
    } catch {
      setCloudSyncStatus('synced');
    }
  };

  // Auto sync and activate selected item's slug in cloud sync store for Vercel
  useEffect(() => {
    syncCurrentSlugToCloud(false);
  }, [selectedItem?.id, selectedItem?.rawUrl, selectedItem?.url]);

  // Active Template State (Defaults to A6 Blue Cutout from user request)
  const [selectedTemplate, setSelectedTemplate] = useState<StandTemplateId>('a6-blue-cutout');
  
  // Format Size: A6 (105x148mm) vs Persegi (1:1)
  const [formatSize, setFormatSize] = useState<StandFormatSize>('a6');
  
  // Template Filter Tab: 'all' | 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'social' | 'google' | 'a6' | 'square'
  type TemplateCategoryFilter = 'all' | 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'social' | 'google' | 'a6' | 'square';
  const [templateFilter, setTemplateFilter] = useState<TemplateCategoryFilter>('all');

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

  // WhatsApp Custom Welcome Message & Heading state for Stand Customization
  const isSelectedWhatsApp = selectedTemplate.includes('whatsapp') || (selectedItem && parseWhatsAppUrl(selectedItem.rawUrl).isWhatsApp);
  const [waLiveUrl, setWaLiveUrl] = useState<string>('');
  const [waSaving, setWaSaving] = useState<boolean>(false);
  const [waSavedMessage, setWaSavedMessage] = useState<string | null>(null);
  const [waHeadingText, setWaHeadingText] = useState<string>('Hubungi & Pesan Menu di');
  const [waTopBadgeText, setWaTopBadgeText] = useState<string>('✓ CHAT LANGSUNG & LAYANAN RESMI');

  useEffect(() => {
    if (selectedItem?.rawUrl) {
      if (parseWhatsAppUrl(selectedItem.rawUrl).isWhatsApp) {
        setWaLiveUrl(selectedItem.rawUrl);
      } else if (selectedTemplate.includes('whatsapp')) {
        setWaLiveUrl('https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20promo%20hari%20ini.');
      }
    }
  }, [selectedItem?.id, selectedItem?.rawUrl, selectedTemplate]);

  const handleSaveWhatsAppToQR = async () => {
    if (!selectedItem || selectedItem.type !== 'qr' || !waLiveUrl) return;
    const qrObj = qrcodes.find(q => q.id === selectedItem.id);
    if (!qrObj) return;

    setWaSaving(true);
    setWaSavedMessage(null);
    try {
      const now = new Date().toISOString();
      const updatedQR: DynamicQRCode = {
        ...qrObj,
        targetUrl: waLiveUrl,
        updatedAt: now,
        urlHistory: [
          {
            url: waLiveUrl,
            changedAt: now,
            reason: 'Pembaruan Pesan Sambutan WhatsApp Welcome'
          },
          ...(qrObj.urlHistory || [])
        ]
      };

      if (qrObj.slug) {
        const cleanSlug = qrObj.slug.toLowerCase().trim();
        fetch(`https://api.restful-api.dev/objects/ff808181a09d98f701a1b392719d5825`)
          .then(r => r.json())
          .then(obj => {
            const currentData = (obj && obj.data && typeof obj.data === 'object') ? obj.data : {};
            currentData[cleanSlug] = waLiveUrl;
            return fetch(`https://api.restful-api.dev/objects/ff808181a09d98f701a1b392719d5825`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'dinamis_qr', data: currentData })
            });
          })
          .catch(() => {});
      }

      await fetch(`/api/qrcodes/${qrObj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: qrObj.title,
          targetUrl: waLiveUrl,
          reason: 'Pembaruan Pesan Sambutan WhatsApp Welcome',
          style: qrObj.style,
          qrData: updatedQR
        })
      });

      if (onUpdateQR) {
        onUpdateQR(updatedQR);
      }
      setWaSavedMessage('✓ Pesan sambutan WhatsApp berhasil disimpan & disinkronkan ke cloud!');
      setTimeout(() => setWaSavedMessage(null), 4000);
    } catch (e) {
      console.warn('Save WA link error:', e);
    } finally {
      setWaSaving(false);
    }
  };

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
        watermark: false,
        customHeading: waHeadingText,
        customTopBadge: waTopBadgeText
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [selectedTemplate, formatSize, activeQRText, activeRegCode, placeName, themeColor, showPlaceName, selectedItem?.rawUrl, selectedItem?.url, waHeadingText, waTopBadgeText]);

  const handleDownloadHD = async (isPrintQuality: boolean = true) => {
    if (urlMode === 'dynamic') {
      await syncCurrentSlugToCloud(true);
    }

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
      watermark: false,
      customHeading: waHeadingText,
      customTopBadge: waTopBadgeText
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
            watermark: false,
            customHeading: waHeadingText,
            customTopBadge: waTopBadgeText
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
          watermark: false,
          customHeading: waHeadingText,
          customTopBadge: waTopBadgeText
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
    if (templateFilter === 'all') return true;
    if (templateFilter === 'a6') return tmpl.formatSize === 'a6';
    if (templateFilter === 'square') return tmpl.formatSize === 'square';
    return tmpl.category === templateFilter;
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
              <span>Studio Stand Akrilik Meja & Media Sosial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#104F38] leading-tight">
              Desain Stand Meja: WhatsApp, Instagram, TikTok, Facebook & Google Review
            </h1>
            <p className="text-xs sm:text-sm text-[#104F38]/80 leading-relaxed font-medium">
              Tersedia <strong>19 variasi desain siap cetak</strong> dalam <strong>Ukuran A6 (105 × 148 mm)</strong> dan <strong>Persegi 1:1</strong> untuk stand akrilik meja kasir/kafe. Pilih template WhatsApp, Instagram, TikTok, Facebook, All-in-One Sosmed, atau Google Review bintang 5. Tautan dinamis cloud dapat diganti kapan saja tanpa cetak ulang akrilik fisik.
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

      {/* TOP SECTION: FORMAT SIZE & TEMPLATE PICKER */}
      <div className="bg-white border border-[#104F38]/20 p-4 sm:p-5 space-y-4">
        
        {/* Header with Category & Format Filter Tabs */}
        <div className="space-y-3 border-b border-[#104F38]/10 pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#104F38]" />
              <h2 className="text-xs sm:text-sm font-extrabold text-[#104F38]">
                PILIH TEMPLATE DESAIN STAND ({filteredTemplates.length} DARI {STAND_TEMPLATES.length} DESAIN)
              </h2>
            </div>
            <div className="text-xs font-semibold text-[#104F38]/70 flex items-center gap-2">
              <span>Format Stand Aktif:</span>
              <span className="font-bold text-[#104F38] bg-[#FFE600] px-2 py-0.5 border border-[#104F38]/20">
                {formatSize === 'a6' ? 'Ukuran A6 (105×148 mm)' : 'Kotak Persegi (1:1)'}
              </span>
            </div>
          </div>

          {/* Quick Platform Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-[#104F38]/80 mr-1">Kategori:</span>

            <button
              type="button"
              onClick={() => setTemplateFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border ${
                templateFilter === 'all'
                  ? 'bg-[#104F38] text-white border-[#104F38]'
                  : 'bg-white text-[#104F38] border-[#104F38]/20 hover:bg-[#F4FAF6]'
              }`}
            >
              Semua ({STAND_TEMPLATES.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('whatsapp');
                if (!selectedTemplate.includes('whatsapp')) {
                  handleSelectTemplate('a6-whatsapp');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'whatsapp'
                  ? 'bg-[#25D366] text-black border-[#25D366] font-black shadow-xs'
                  : 'bg-white text-[#075E54] border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <span>💬 WhatsApp</span>
              <span className="text-[9.5px] opacity-80 font-mono">({STAND_TEMPLATES.filter(t => t.category === 'whatsapp').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('instagram');
                if (!selectedTemplate.includes('instagram')) {
                  handleSelectTemplate('a6-instagram');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'instagram'
                  ? 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white border-transparent font-black shadow-xs'
                  : 'bg-white text-[#C13584] border-pink-300 hover:bg-pink-50'
              }`}
            >
              <span>📸 Instagram</span>
              <span className="text-[9.5px] opacity-80 font-mono">({STAND_TEMPLATES.filter(t => t.category === 'instagram').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('tiktok');
                if (!selectedTemplate.includes('tiktok')) {
                  handleSelectTemplate('a6-tiktok');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'tiktok'
                  ? 'bg-black text-[#00F2FE] border-black font-black shadow-xs'
                  : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>🎵 TikTok</span>
              <span className="text-[9.5px] opacity-80 font-mono">({STAND_TEMPLATES.filter(t => t.category === 'tiktok').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('facebook');
                if (!selectedTemplate.includes('facebook')) {
                  handleSelectTemplate('a6-facebook');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'facebook'
                  ? 'bg-[#1877F2] text-white border-[#1877F2] font-black shadow-xs'
                  : 'bg-white text-[#1877F2] border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span>📘 Facebook</span>
              <span className="text-[9.5px] opacity-80 font-mono">({STAND_TEMPLATES.filter(t => t.category === 'facebook').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('social');
                if (!selectedTemplate.includes('social')) {
                  handleSelectTemplate('a6-social-all');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'social'
                  ? 'bg-[#104F38] text-[#FFE600] border-[#104F38] font-black shadow-xs'
                  : 'bg-white text-[#104F38] border-[#104F38]/20 hover:bg-[#F4FAF6]'
              }`}
            >
              <span>🌐 Multi-Sosmed</span>
              <span className="text-[9.5px] opacity-80 font-mono">({STAND_TEMPLATES.filter(t => t.category === 'social').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('google');
                if (!['a6-blue-cutout', 'a6-onyx-dark', 'a6-blue-dome', 'a6-pinwheel', 'classic-blue', 'blue-arc', 'pinwheel-4color', 'border-4color', 'onyx-black'].includes(selectedTemplate)) {
                  handleSelectTemplate('a6-blue-cutout');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'google'
                  ? 'bg-[#0038CB] text-white border-[#0038CB] font-black shadow-xs'
                  : 'bg-white text-[#0038CB] border-blue-200 hover:bg-blue-50'
              }`}
            >
              <span>⭐ Google Review</span>
              <span className="text-[9.5px] opacity-80 font-mono">({STAND_TEMPLATES.filter(t => t.category === 'google').length})</span>
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('a6');
                setFormatSize('a6');
                if (!isA6Template(selectedTemplate)) {
                  handleSelectTemplate('a6-blue-cutout');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'a6'
                  ? 'bg-[#FFE600] text-[#104F38] border-[#104F38]'
                  : 'bg-white text-[#104F38] border-[#104F38]/20 hover:bg-[#F4FAF6]'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Stand A6 (9)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateFilter('square');
                setFormatSize('square');
                if (isA6Template(selectedTemplate)) {
                  handleSelectTemplate('classic-blue');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                templateFilter === 'square'
                  ? 'bg-[#104F38] text-white border-[#104F38]'
                  : 'bg-white text-[#104F38] border-[#104F38]/20 hover:bg-[#F4FAF6]'
              }`}
            >
              <Square className="w-3 h-3" />
              <span>Persegi 1:1 (10)</span>
            </button>
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

                {/* PILIHAN FORMAT LINK YANG DICETAK KE FISIK QR */}
                <div className="p-3 bg-white border border-[#104F38]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#104F38]">
                      Pilih Format Link yang Dicetak ke Fisik QR Code:
                    </span>
                    <span className="text-[10px] font-bold bg-[#FFE600] text-[#104F38] px-2 py-0.5 border border-[#104F38]/20">
                      {urlMode === 'direct' ? '1. Tautan Baru Langsung' : '2. Tautan Dinamis Cloud'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setUrlMode('direct')}
                      className={`p-2.5 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        urlMode === 'direct'
                          ? 'border-[#104F38] bg-[#FFE600] text-[#104F38] font-black shadow-xs ring-2 ring-[#104F38]'
                          : 'border-[#104F38]/20 bg-[#F4FAF6] text-[#104F38] hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center justify-between">
                          <span>1. Tautan Baru Langsung</span>
                          {urlMode === 'direct' && <span className="text-[9px] bg-[#104F38] text-white px-1.5 py-0.2">Aktif Dipilih</span>}
                        </div>
                        <div className="text-[10px] text-[#104F38]/80 font-normal mt-0.5 leading-snug">
                          QR fisik langsung memuat link baru Anda. Ketika discan HP, langsung membuka URL tujuan baru.
                        </div>
                      </div>
                      <div className="text-[9.5px] font-mono font-bold truncate mt-1.5 bg-white/80 px-1.5 py-0.5 border border-[#104F38]/20">
                        {selectedItem?.rawUrl}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUrlMode('dynamic');
                        syncCurrentSlugToCloud(true);
                      }}
                      className={`p-2.5 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        urlMode === 'dynamic'
                          ? 'border-[#104F38] bg-[#104F38] text-white font-black shadow-xs ring-2 ring-[#FFE600]'
                          : 'border-[#104F38]/20 bg-[#F4FAF6] text-[#104F38] hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>2. Tautan Dinamis Cloud</span>
                            <span className="inline-block w-2 h-2 rounded-full bg-[#FFE600] animate-pulse" />
                          </span>
                          {urlMode === 'dynamic' && <span className="text-[9px] bg-[#FFE600] text-[#104F38] px-1.5 py-0.2">Aktif Dipilih</span>}
                        </div>
                        <div className={`text-[10px] font-normal mt-0.5 leading-snug ${urlMode === 'dynamic' ? 'text-white/80' : 'text-[#104F38]/80'}`}>
                          QR fisik memuat URL pendek awan (/r/...). Bisa ganti link berkali-kali tanpa cetak ulang akrilik.
                        </div>
                      </div>
                      <div className={`text-[9.5px] font-mono font-bold truncate mt-1.5 px-1.5 py-0.5 border flex items-center justify-between gap-1 ${
                        urlMode === 'dynamic' ? 'bg-white/10 text-[#FFE600] border-white/20' : 'bg-white/80 text-[#104F38] border-[#104F38]/20'
                      }`}>
                        <span className="truncate">{selectedItem?.url}</span>
                        <span className="text-[8.5px] bg-emerald-600/80 text-white px-1 py-0.2 shrink-0 font-sans">🟢 Aktif Vercel</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Selected item summary */}
                {selectedItem && (
                  <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black text-[#104F38] bg-[#FFE600] px-1.5 py-0.5 border border-[#104F38]/20">
                          {selectedItem.code}
                        </span>
                        <span className="font-bold text-[#104F38] truncate">{selectedItem.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#104F38]/70 uppercase">
                        {urlMode === 'direct' ? 'Cetak Tautan Baru Langsung' : 'Cetak Tautan Dinamis Cloud'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white border border-[#104F38]/15 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#104F38] flex items-center gap-1">
                          {urlMode === 'direct' ? 'Tautan yang Dicetak ke QR (URL Baru Langsung):' : 'Tautan yang Dicetak ke QR (Dinamis Cloud /r/...):'}
                          {urlMode === 'dynamic' && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />}
                        </span>
                        <span className="text-[9px] font-bold bg-[#104F38] text-white px-2 py-0.5">
                          ✓ Sedang Aktif di Kanvas
                        </span>
                      </div>
                      <div className="font-mono text-[11.5px] font-black text-[#104F38] truncate flex items-center justify-between gap-2">
                        <span className="truncate">{activeQRText}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={handleCopy}
                            className="text-[10px] font-bold text-[#104F38] bg-[#FFE600] px-2 py-0.5 border border-[#104F38]/30 hover:bg-[#F2DA00] cursor-pointer"
                          >
                            {copiedLink ? 'Tersalin' : 'Salin'}
                          </button>
                          {urlMode === 'dynamic' && (
                            <a
                              href={activeQRText}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-white bg-[#104F38] px-2 py-0.5 border border-[#104F38] hover:bg-[#0c3c2b] flex items-center gap-1 cursor-pointer"
                              title="Uji buka link pengalihan dinamis di tab baru"
                            >
                              <span>⚡ Uji Pindai Fisik</span>
                            </a>
                          )}
                        </div>
                      </div>
                      {urlMode === 'dynamic' && (
                        <div className="text-[9.5px] text-[#104F38]/80 flex items-center justify-between pt-1 border-t border-[#104F38]/10">
                          <span className="flex items-center gap-1">
                            <span className="text-emerald-700 font-bold">🟢 Cloud Sync Siap:</span>
                            <span>QR fisik aktif di Vercel Serverless & Cloud Sync.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => syncCurrentSlugToCloud(true)}
                            className="text-[9px] underline font-bold text-[#104F38] hover:text-black cursor-pointer"
                          >
                            {cloudSyncStatus === 'syncing' ? 'Menyinkronkan...' : 'Sinkronkan Ulang'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                      <div className="truncate mr-2">
                        <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
                          Tautan Tujuan Baru:
                        </span>
                        <span className="font-mono text-emerald-900 font-black truncate block">
                          {selectedItem.rawUrl}
                        </span>
                      </div>
                      {urlMode === 'dynamic' ? (
                        <button
                          type="button"
                          onClick={() => setUrlMode('direct')}
                          className="text-[10px] font-bold bg-[#FFE600] text-[#104F38] px-2 py-1 border border-[#104F38]/20 hover:bg-[#F2DA00] shrink-0 cursor-pointer shadow-2xs"
                        >
                          ⚡ Gunakan Tautan Baru Ini Langsung ke QR
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold bg-[#104F38] text-white px-2 py-0.5 shrink-0">
                          ✓ Terpasang Langsung ke QR
                        </span>
                      )}
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

            {/* Custom WhatsApp Heading for Bisnis, Cafe, Sekolah, Kampus & Resto */}
            {selectedTemplate.includes('whatsapp') && (
              <div className="space-y-3 pt-3 border-t border-[#104F38]/10 bg-emerald-50/60 p-3.5 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">💬</span>
                    <label className="text-xs font-black text-[#075E54]">
                      Pilihan Teks Ajakan Stand WhatsApp (Custom Heading):
                    </label>
                  </div>
                  <span className="text-[9.5px] font-bold bg-[#25D366] text-white px-2 py-0.5 rounded-full">
                    Live Cetak
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Ubah teks <em>&quot;Hubungi & Pesan Menu di&quot;</em> sesuai bidang usaha Anda (Bisnis, Cafe, Sekolah, Kampus, atau Restoran).
                </p>

                {/* Sektor Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-700 block">
                    Pilihan Siap Pakai per Sektor (1-Klik Pilih):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {WHATSAPP_HEADING_PRESETS.map((hp) => {
                      const isSelected = waHeadingText.trim().toLowerCase() === hp.headingText.trim().toLowerCase();
                      return (
                        <button
                          key={hp.id}
                          type="button"
                          onClick={() => {
                            setWaHeadingText(hp.headingText);
                            if (hp.topBadgeText) setWaTopBadgeText(hp.topBadgeText);
                          }}
                          className={`p-2 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-100 border-[#25D366] ring-1 ring-[#25D366] font-bold text-[#075E54] shadow-xs'
                              : 'bg-white hover:bg-emerald-50/80 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wide bg-emerald-100/70 px-1.5 py-0.2 rounded-sm">
                              {hp.sectorLabel}
                            </span>
                            {isSelected && <span className="text-[9px] font-extrabold text-[#075E54]">✓ Terpilih</span>}
                          </div>
                          <span className="text-[11px] font-medium leading-snug">
                            &ldquo;{hp.headingText}&rdquo;
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Free Text Input for Heading */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#075E54]">
                      Ketik Bebas Teks Heading Stand Sendiri:
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {waHeadingText.length} huruf
                    </span>
                  </div>
                  <input
                    type="text"
                    value={waHeadingText}
                    onChange={(e) => setWaHeadingText(e.target.value)}
                    placeholder="Contoh: Hubungi & Konsultasi Layanan di / Pesan Kopi di"
                    className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#25D366] font-bold text-slate-900 shadow-2xs"
                  />
                  <p className="text-[10px] text-emerald-700/80 mt-1">
                    Teks ini langsung muncul di atas tulisan &quot;WhatsApp&quot; pada lembar cetak akrilik fisik Anda.
                  </p>
                </div>

                {/* Optional Pill Banner for A6 */}
                {selectedTemplate === 'a6-whatsapp' && (
                  <div className="pt-2 border-t border-emerald-200/60">
                    <label className="block text-[11px] font-bold text-[#075E54] mb-1">
                      Kustom Teks Lencana Lengkung Atas (Pill Banner A6):
                    </label>
                    <input
                      type="text"
                      value={waTopBadgeText}
                      onChange={(e) => setWaTopBadgeText(e.target.value)}
                      placeholder="✓ CHAT LANGSUNG & LAYANAN RESMI"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#25D366] text-slate-900 font-mono text-[11px]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Template specs callout & Platform Tips */}
            <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/15 text-xs text-[#104F38]/80 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#104F38]">
                <span>Template Aktif:</span>
                <span className="text-[#104F38] font-extrabold underline decoration-[#FFE600] decoration-2">
                  {STAND_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {STAND_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
              </p>

            {/* Dynamic Platform Tip */}
              {selectedTemplate.includes('whatsapp') && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-none text-[10.5px] mt-1.5">
                  💬 <strong>Tips Stand WhatsApp:</strong> Letakkan di atas meja kafe, kasir resto, lobi kantor bisnis, atau loket pendaftaran sekolah/kampus agar pengunjung dapat langsung chat CS atau panitia tanpa perlu simpan kontak terlebih dahulu.
                </div>
              )}
              {selectedTemplate.includes('instagram') && (
                <div className="p-2 bg-pink-50 border border-pink-200 text-[#833AB4] rounded-none text-[10.5px] mt-1.5">
                  📸 <strong>Tips Stand Instagram:</strong> Dorong pelanggan mengunggah foto kuliner ke IG Story dan tag akun resmi Anda untuk mendapatkan diskon langsung.
                </div>
              )}
              {selectedTemplate.includes('tiktok') && (
                <div className="p-2 bg-slate-900 text-[#00F2FE] border border-slate-700 rounded-none text-[10.5px] mt-1.5">
                  🎵 <strong>Tips Stand TikTok:</strong> Ajak pengunjung menonton konten video viral, proses pembuatan menu, dan review seru pengunjung lainnya.
                </div>
              )}
              {selectedTemplate.includes('facebook') && (
                <div className="p-2 bg-blue-50 border border-blue-200 text-[#1877F2] rounded-none text-[10.5px] mt-1.5">
                  📘 <strong>Tips Stand Facebook:</strong> Bagikan info promo bulanan, lowongan kerja, dan bangun komunitas pelanggan setia.
                </div>
              )}
              {selectedTemplate.includes('social-all') && (
                <div className="p-2 bg-[#FFFDEB] border border-[#FFE600] text-[#104F38] rounded-none text-[10.5px] mt-1.5">
                  🌐 <strong>Tips All-in-One:</strong> Hubungkan QR Code ke Linktree atau halaman utama yang memuat semua akun media sosial bisnis Anda dalam 1 scan.
                </div>
              )}
            </div>

            {/* WhatsApp Custom Welcome Greeting Panel */}
            {isSelectedWhatsApp && (
              <div className="p-3.5 bg-white border border-[#104F38]/20 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">💬</span>
                    <span className="text-xs font-black text-[#075E54]">
                      Kustomisasi Tampilan Awal & Pesan Sambutan WhatsApp
                    </span>
                  </div>
                  <span className="text-[9.5px] bg-[#25D366] text-white px-2 py-0.5 rounded-full font-bold">
                    Stand WhatsApp
                  </span>
                </div>

                <WhatsAppWelcomeEditor
                  currentUrl={waLiveUrl || (selectedItem ? selectedItem.rawUrl : '')}
                  onUrlChange={(updatedUrl) => setWaLiveUrl(updatedUrl)}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  {waSavedMessage ? (
                    <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                      {waSavedMessage}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      Klik simpan untuk memperbarui tautan tujuan QR code di cloud.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveWhatsAppToQR}
                    disabled={waSaving || !selectedItem || selectedItem.type !== 'qr'}
                    className="px-3.5 py-2 text-xs font-bold bg-[#104F38] hover:bg-[#0c3c2b] text-[#FFE600] rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <span>{waSaving ? 'Menyimpan...' : '💾 Simpan Pesan Sambutan ke QR'}</span>
                  </button>
                </div>
              </div>
            )}

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
