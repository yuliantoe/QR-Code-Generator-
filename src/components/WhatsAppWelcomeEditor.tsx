import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Check,
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  WHATSAPP_WELCOME_PRESETS,
  parseWhatsAppUrl,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  WhatsAppWelcomePreset
} from '../utils/whatsappPresets.ts';

interface WhatsAppWelcomeEditorProps {
  currentUrl: string;
  onUrlChange: (newUrl: string) => void;
  className?: string;
}

export const WhatsAppWelcomeEditor: React.FC<WhatsAppWelcomeEditorProps> = ({
  currentUrl,
  onUrlChange,
  className = ''
}) => {
  // Parse incoming URL
  const parsed = parseWhatsAppUrl(currentUrl);

  const [phone, setPhone] = useState(parsed.phone || '6281234567890');
  const [welcomeText, setWelcomeText] = useState(
    parsed.text || 'Halo Admin, saya mau pesan menu dan tanya promo hari ini.'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Sync internal state when external currentUrl changes significantly
  useEffect(() => {
    const ext = parseWhatsAppUrl(currentUrl);
    if (ext.isWhatsApp) {
      if (ext.phone && ext.phone !== normalizeWhatsAppPhone(phone)) {
        setPhone(ext.phone);
      }
      if (ext.text !== undefined && ext.text !== welcomeText) {
        setWelcomeText(ext.text);
      }
    }
  }, [currentUrl]);

  // Propagate URL change up whenever phone or welcomeText updates
  const updateUrl = (newPhone: string, newText: string) => {
    const url = buildWhatsAppUrl(newPhone, newText);
    onUrlChange(url);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    updateUrl(val, welcomeText);
  };

  const handleTextChange = (val: string) => {
    setWelcomeText(val);
    setActivePresetId(null);
    updateUrl(phone, val);
  };

  const handleSelectPreset = (preset: WhatsAppWelcomePreset) => {
    setWelcomeText(preset.message);
    setActivePresetId(preset.id);
    updateUrl(phone, preset.message);
  };

  const handleCopyUrl = async () => {
    const fullUrl = buildWhatsAppUrl(phone, welcomeText);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const categories = [
    { id: 'all', label: 'Semua Kalimat' },
    { id: 'bisnis', label: 'Bisnis & Kantor' },
    { id: 'sekolah', label: 'Sekolah & PPDB' },
    { id: 'kampus', label: 'Kampus & Kuliah' },
    { id: 'cafe', label: 'Kafe & Barista' },
    { id: 'resto', label: 'Menu & Resto' },
    { id: 'table', label: 'Meja & Kasir' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'cs', label: 'CS & Bantuan' },
    { id: 'promo', label: 'Promo & Voucher' }
  ];

  const filteredPresets = selectedCategory === 'all'
    ? WHATSAPP_WELCOME_PRESETS
    : WHATSAPP_WELCOME_PRESETS.filter(p => p.category === selectedCategory);

  const fullGeneratedUrl = buildWhatsAppUrl(phone, welcomeText);

  return (
    <div className={`p-4 bg-[#F4FAF6] border border-[#104F38]/20 rounded-none space-y-4 ${className}`}>
      
      {/* Header Panel */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#104F38] text-[#FFE600] flex items-center justify-center shrink-0 border border-[#104F38]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#104F38]">
              Editor Tampilan Awal WhatsApp &amp; Welcome Greeting
            </h4>
            <p className="text-[11px] text-[#104F38]/75 leading-tight mt-0.5">
              Saat pelanggan memindai QR code, pesan sambutan ini langsung otomatis terisi di chat WhatsApp pelanggan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 rounded-none flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            title="Salin tautan WhatsApp"
          >
            {copied ? <Check className="w-3 h-3 text-[#104F38]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
          </button>
          <a
            href={fullGeneratedUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 text-[11px] font-bold bg-[#104F38] hover:bg-[#0C3B2A] text-white border border-[#104F38] rounded-none flex items-center gap-1 transition-colors whitespace-nowrap"
            title="Buka dan tes di WhatsApp"
          >
            <span>Uji Buka</span>
            <ExternalLink className="w-3 h-3 text-[#FFE600]" />
          </a>
        </div>
      </div>

      {/* Row 1: Phone Number Input */}
      <div>
        <label htmlFor="waPhoneInput" className="block text-[11px] font-bold text-[#104F38] mb-1">
          Nomor WhatsApp Penerima (Admin / Kasir / Restoran) <span className="text-rose-600">*</span>
        </label>
        <div className="flex items-center">
          <div className="px-3 py-2 bg-white border border-r-0 border-[#104F38]/25 rounded-none text-xs font-mono font-bold text-[#104F38] flex items-center">
            <span>+62</span>
          </div>
          <input
            id="waPhoneInput"
            type="text"
            required
            placeholder="081234567890 atau 6281234567890"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] font-mono tabular-nums text-[#104F38]"
          />
        </div>
        <p className="text-[10px] text-[#104F38]/70 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          <span>Awalan 08... akan otomatis dikonversi ke kode internasional 628... agar tautan universal.</span>
        </p>
      </div>

      {/* Row 2: WhatsApp Chat Balloon Live Preview */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-[#104F38]">
            Pratinjau Layar Chat WhatsApp Pelanggan
          </span>
          <span className="text-[10px] text-[#104F38]/60">Tampilan Saat Discan Pelanggan</span>
        </div>

        <div className="p-3 bg-[#EFEAE2] border border-[#104F38]/20 rounded-none relative overflow-hidden">
          <div className="flex justify-end">
            <div className="max-w-[85%] sm:max-w-[75%] bg-[#D9FDD3] rounded-none px-3.5 py-2.5 border border-[#104F38]/15 relative">
              <p className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed font-sans">
                {welcomeText || <span className="text-slate-500 italic">(Pesan sambutan masih kosong...)</span>}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1 text-[9px] font-mono tabular-nums text-slate-600">
                <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-sky-700 font-bold">Dibaca</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Custom Welcome Text Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="waWelcomeTextarea" className="text-[11px] font-bold text-[#104F38]">
            Kalimat Sambutan Kustom (Bisa Diedit Bebas)
          </label>
          <span className="text-[10px] text-[#104F38]/60 font-mono tabular-nums">
            {welcomeText.length} karakter
          </span>
        </div>
        <textarea
          id="waWelcomeTextarea"
          rows={2}
          value={welcomeText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Tulis kalimat sambutan pembuka untuk pelanggan..."
          className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 rounded-none focus:outline-none focus:border-[#104F38] text-[#104F38] font-sans leading-relaxed"
        />
      </div>

      {/* Row 4: Pre-Written Welcome Sentences (Pilihan Kalimat Siap Pakai) */}
      <div className="space-y-2 pt-2 border-t border-[#104F38]/15">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-[11px] font-bold text-[#104F38]">
            Pilihan Kalimat Welcome Siap Pakai (1-Klik Pilih)
          </span>
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2 py-1 text-[10px] rounded-none font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[#104F38] text-white'
                    : 'bg-white text-[#104F38]/80 hover:text-[#104F38] border border-[#104F38]/20'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
          {filteredPresets.map((preset) => {
            const isSelected = activePresetId === preset.id || welcomeText.trim() === preset.message.trim();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-none text-left transition-colors border cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#FFE600]/25 border-[#104F38] ring-1 ring-[#104F38]'
                    : 'bg-white hover:bg-[#F4FAF6] border-[#104F38]/15'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[11px] font-bold text-[#104F38] line-clamp-1">
                      {preset.title}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#104F38]/75 line-clamp-2 leading-tight">
                    &ldquo;{preset.message}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#104F38]/10 text-[9.5px]">
                  <span className="text-[#104F38]/70 font-medium">
                    {preset.categoryLabel}{preset.badge ? ` · ${preset.badge}` : ''}
                  </span>
                  <span className={`font-bold flex items-center gap-0.5 ${isSelected ? 'text-[#104F38]' : 'text-[#104F38]/45'}`}>
                    {isSelected ? <Check className="w-2.5 h-2.5" /> : null}
                    {isSelected ? 'Terpilih' : 'Pilih'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
