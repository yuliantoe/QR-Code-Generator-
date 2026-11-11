import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Phone,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
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
    { id: 'bisnis', label: '💼 Bisnis & Kantor' },
    { id: 'sekolah', label: '🏫 Sekolah & PPDB' },
    { id: 'kampus', label: '🎓 Kampus & Kuliah' },
    { id: 'cafe', label: '☕ Kafe & Barista' },
    { id: 'resto', label: '🍽️ Menu & Resto' },
    { id: 'table', label: '🛎️ Meja & Kasir' },
    { id: 'delivery', label: '🛵 Delivery' },
    { id: 'cs', label: '💬 CS & Bantuan' },
    { id: 'promo', label: '🎁 Promo & Voucher' }
  ];

  const filteredPresets = selectedCategory === 'all'
    ? WHATSAPP_WELCOME_PRESETS
    : WHATSAPP_WELCOME_PRESETS.filter(p => p.category === selectedCategory);

  const fullGeneratedUrl = buildWhatsAppUrl(phone, welcomeText);

  return (
    <div className={`p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4 ${className}`}>
      
      {/* Header Panel */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#075E54] flex items-center gap-1.5">
              <span>Editor Tampilan Awal WhatsApp & Welcome Greeting</span>
              <span className="px-1.5 py-0.5 bg-[#25D366] text-white text-[9.5px] rounded-md font-extrabold uppercase tracking-wide">
                Live Sync
              </span>
            </h4>
            <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
              Saat pelanggan memindai QR code, pesan sambutan ini langsung otomatis terisi di chat WhatsApp pelanggan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-100 text-[#075E54] border border-emerald-300 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Salin tautan WhatsApp"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
          </button>
          <a
            href={fullGeneratedUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 text-[11px] font-semibold bg-[#25D366] hover:bg-[#1faa53] text-white rounded-lg flex items-center gap-1 transition-all shadow-2xs"
            title="Buka dan tes di WhatsApp"
          >
            <span>Uji Buka</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Row 1: Phone Number Input */}
      <div>
        <label className="block text-[11px] font-bold text-[#075E54] mb-1">
          Nomor WhatsApp Penerima (Admin / Kasir / Restoran) <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center">
          <div className="px-3 py-2 bg-emerald-100/90 border border-r-0 border-emerald-300 rounded-l-xl text-xs font-bold text-[#075E54] flex items-center gap-1.5">
            <span className="text-sm">🇮🇩</span>
            <span>+62</span>
          </div>
          <input
            type="text"
            required
            placeholder="081234567890 atau 6281234567890"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] font-mono text-slate-900"
          />
        </div>
        <p className="text-[10px] text-emerald-700/80 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          <span>Awalan 08... akan otomatis dikonversi ke kode internasional 628... agar tautan universal.</span>
        </p>
      </div>

      {/* Row 2: WhatsApp Chat Balloon Live Preview */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-[#075E54] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Pratinjau Layar Chat WhatsApp Pelanggan:</span>
          </span>
          <span className="text-[10px] text-slate-500">Tampilan Saat Discan Pelanggan</span>
        </div>

        <div className="p-3 bg-[#EFEAE2] border border-emerald-200/80 rounded-xl relative overflow-hidden shadow-inner">
          {/* Subtle WhatsApp doodle background representation */}
          <div className="flex justify-end">
            <div className="max-w-[85%] sm:max-w-[75%] bg-[#D9FDD3] rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-2xs border border-emerald-200/60 relative">
              <p className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed font-sans">
                {welcomeText || <span className="text-slate-400 italic">(Pesan sambutan masih kosong...)</span>}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500">
                <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-sky-600 font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Custom Welcome Text Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-[#075E54]">
            Kalimat Sambutan Kustom (Bisa Diedit Bebas):
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {welcomeText.length} karakter
          </span>
        </div>
        <textarea
          rows={2}
          value={welcomeText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Tulis kalimat sambutan pembuka untuk pelanggan..."
          className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] text-slate-900 font-sans shadow-2xs leading-relaxed"
        />
      </div>

      {/* Row 4: Pre-Written Welcome Sentences (Pilihan Kalimat Siap Pakai) */}
      <div className="space-y-2 pt-1 border-t border-emerald-200/60">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-[11px] font-bold text-[#075E54] flex items-center gap-1.5">
            <span>✨ Pilihan Kalimat Welcome Siap Pakai (1-Klik Pilih):</span>
          </span>
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2 py-0.5 text-[10px] rounded-md font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[#075E54] text-white shadow-2xs'
                    : 'bg-white/80 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
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
                className={`p-2 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-100 border-[#25D366] shadow-xs ring-1 ring-[#25D366]'
                    : 'bg-white hover:bg-emerald-50/80 border-emerald-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 line-clamp-1">
                      {preset.title}
                    </span>
                    {preset.badge && (
                      <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[8.5px] font-bold rounded-sm shrink-0">
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-600 line-clamp-2 leading-tight">
                    &ldquo;{preset.message}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 text-[9.5px]">
                  <span className="text-emerald-700 font-medium">{preset.categoryLabel}</span>
                  <span className={`font-bold flex items-center gap-0.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
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
