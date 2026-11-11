import QRCode from 'qrcode';

export type StandFormatSize = 'a6' | 'square';

export type StandTemplateId =
  // 4 DESAIN KHUSUS STAND MEJA UKURAN A6 (105 x 148 mm) - GOOGLE REVIEW
  | 'a6-blue-cutout'    // A6 Lengkung Biru (Header Arch Cutout)
  | 'a6-onyx-dark'      // A6 Onyx Hitam Elegan (Dark Edition)
  | 'a6-blue-dome'      // A6 Kubah Biru Google (Dome Curve)
  | 'a6-pinwheel'       // A6 4-Warna Kuadran Google (Quadrant Color)
  // DESAIN STAND MEJA SOSIAL MEDIA - A6 (105 x 148 mm)
  | 'a6-whatsapp'       // A6 WhatsApp: Chat & Order Langsung
  | 'a6-instagram'      // A6 Instagram: Follow & Tag Story
  | 'a6-tiktok'         // A6 TikTok: Tonton Keseruan & Review
  | 'a6-facebook'       // A6 Facebook: Komunitas & Fanspage
  | 'a6-social-all'     // A6 Multi-Sosmed All-in-One (WA • IG • TikTok • FB)
  // DESAIN UNIVERSAL / KOTAK PERSEGI (1:1) - GOOGLE REVIEW
  | 'classic-blue'      // Biru Klasik Meja
  | 'blue-arc'          // Lengkung Biru Modern
  | 'pinwheel-4color'   // 4 Warna Geometris
  | 'border-4color'     // Bingkai 4 Warna Google
  | 'onyx-black'        // Onyx Dark Minimalis
  // DESAIN STAND MEJA SOSIAL MEDIA - KOTAK PERSEGI (1:1)
  | 'square-whatsapp'   // Persegi: WhatsApp Stand Akrilik
  | 'square-instagram'  // Persegi: Instagram Acrylic Card
  | 'square-tiktok'     // Persegi: TikTok Neon Dark
  | 'square-facebook'   // Persegi: Facebook Stand Meja
  | 'square-social-all';// Persegi: Semua Sosmed (1:1)

export interface StandTemplateMeta {
  id: StandTemplateId;
  name: string;
  badge: string;
  category: 'google' | 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'social';
  formatSize: StandFormatSize;
  description: string;
  previewColors: string[];
  isDark?: boolean;
}

export const STAND_TEMPLATES: StandTemplateMeta[] = [
  // === TEMPLATE STAND WHATSAPP ===
  {
    id: 'a6-whatsapp',
    name: 'WhatsApp: Chat & Order A6 (105×148mm)',
    badge: 'WhatsApp A6',
    category: 'whatsapp',
    formatSize: 'a6',
    description: 'Format A6 stand meja akrilik khusus WhatsApp. Header hijau zamrud, logo WhatsApp resmi, ajakan chat CS & order menu tanpa simpan nomor HP.',
    previewColors: ['#25D366', '#075E54', '#FFFFFF']
  },
  {
    id: 'square-whatsapp',
    name: 'WhatsApp: Stand Meja Persegi (1:1)',
    badge: 'WhatsApp 1:1',
    category: 'whatsapp',
    formatSize: 'square',
    description: 'Format kotak 1:1 stand akrilik WhatsApp. Bingkai hijau segar, lencana chat resmi, dan layout seimbang untuk pemesanan meja kasir.',
    previewColors: ['#25D366', '#128C7E', '#FFFFFF']
  },

  // === TEMPLATE STAND INSTAGRAM ===
  {
    id: 'a6-instagram',
    name: 'Instagram: Follow & Tag A6 (105×148mm)',
    badge: 'Instagram A6',
    category: 'instagram',
    formatSize: 'a6',
    description: 'Format A6 stand akrilik Instagram dengan gradien sunset ikonik (#833AB4 → #FD1D1D → #FCB045), logo kamera elegan, dan ajakan tag story berhadiah diskon.',
    previewColors: ['#833AB4', '#FD1D1D', '#FCB045', '#FFFFFF']
  },
  {
    id: 'square-instagram',
    name: 'Instagram: Acrylic Card Persegi (1:1)',
    badge: 'Instagram 1:1',
    category: 'instagram',
    formatSize: 'square',
    description: 'Format kotak 1:1 stand akrilik Instagram. Bingkai gradien warna-warni, logo kamera resmi, dan tampilan profil feeds modern.',
    previewColors: ['#E1306C', '#833AB4', '#FFDC80']
  },

  // === TEMPLATE STAND TIKTOK ===
  {
    id: 'a6-tiktok',
    name: 'TikTok: Review & Video Viral A6 (105×148mm)',
    badge: 'TikTok Dark A6',
    category: 'tiktok',
    formatSize: 'a6',
    description: 'Format A6 stand akrilik tema gelap elegan TikTok (#010101) dengan aksen chromatic neon cyan & magenta, logo not balok resmi, dan pad QR putih 100% kontras.',
    previewColors: ['#010101', '#00F2FE', '#FE2C55'],
    isDark: true
  },
  {
    id: 'square-tiktok',
    name: 'TikTok: Neon Dark Persegi (1:1)',
    badge: 'TikTok 1:1',
    category: 'tiktok',
    formatSize: 'square',
    description: 'Format kotak 1:1 stand akrilik TikTok. Latar hitam pekat, bingkai neon dinamis, dan ajakan tonton video konten seru & ulasan viral.',
    previewColors: ['#000000', '#00F2FE', '#FE2C55'],
    isDark: true
  },

  // === TEMPLATE STAND FACEBOOK ===
  {
    id: 'a6-facebook',
    name: 'Facebook: Komunitas & Fanspage A6 (105×148mm)',
    badge: 'Facebook A6',
    category: 'facebook',
    formatSize: 'a6',
    description: 'Format A6 stand akrilik Facebook dengan header biru klasik (#1877F2), logo f lingkaran resmi, dan ajakan gabung komunitas pelanggan setia.',
    previewColors: ['#1877F2', '#0C4A9E', '#FFFFFF']
  },
  {
    id: 'square-facebook',
    name: 'Facebook: Stand Meja Persegi (1:1)',
    badge: 'Facebook 1:1',
    category: 'facebook',
    formatSize: 'square',
    description: 'Format kotak 1:1 stand akrilik Facebook. Lencana biru royal elegan, tata letak proporsional untuk kasir atau meja ruang tunggu.',
    previewColors: ['#1877F2', '#FFFFFF', '#E7F3FF']
  },

  // === TEMPLATE STAND ALL-IN-ONE (SEMUA SOSMED) ===
  {
    id: 'a6-social-all',
    name: 'Semua Sosmed: All-in-One A6 (105×148mm)',
    badge: 'Multi-Sosmed A6',
    category: 'social',
    formatSize: 'a6',
    description: 'Format A6 stand akrilik memuat 4 ikon sosial media sekaligus (WhatsApp, Instagram, TikTok, Facebook) dalam satu lembar cetak rapi.',
    previewColors: ['#104F38', '#25D366', '#E1306C', '#1877F2']
  },
  {
    id: 'square-social-all',
    name: 'Semua Sosmed: All-in-One Persegi (1:1)',
    badge: 'Multi-Sosmed 1:1',
    category: 'social',
    formatSize: 'square',
    description: 'Format kotak 1:1 memuat lencana lengkap 4 platform sosial media dengan QR Code / Linktree sentral.',
    previewColors: ['#104F38', '#FFE600', '#25D366', '#FE2C55']
  },

  // === TEMPLATE STAND GOOGLE REVIEW (ORIGINAL A6 & SQUARE) ===
  {
    id: 'a6-blue-cutout',
    name: 'Google Review: A6 Lengkung Biru (Resmi)',
    badge: 'Google A6',
    category: 'google',
    formatSize: 'a6',
    description: 'Format A6 (105x148mm) dengan header biru royal, cutout lengkung putih untuk logo Google G, dan 5 bintang emas.',
    previewColors: ['#0038CB', '#FFFFFF', '#FBBC05']
  },
  {
    id: 'a6-onyx-dark',
    name: 'Google Review: A6 Onyx Hitam Elegan',
    badge: 'Google A6 Dark',
    category: 'google',
    formatSize: 'a6',
    description: 'Format A6 latar hitam pekat premium, logo Google G berpadu 5 bintang putih solid dan tipografi kontras mewah.',
    previewColors: ['#000000', '#FFFFFF', '#4285F4'],
    isDark: true
  },
  {
    id: 'a6-blue-dome',
    name: 'Google Review: A6 Kubah Biru Google',
    badge: 'Google A6',
    category: 'google',
    formatSize: 'a6',
    description: 'Format A6 dengan kubah lengkung biru modern di atas, logo Google G menonjol dan teks warna-warni resmi.',
    previewColors: ['#0038CB', '#FFFFFF', '#FBBC05', '#EA4335']
  },
  {
    id: 'a6-pinwheel',
    name: 'Google Review: A6 4-Warna Kuadran',
    badge: 'Google A6 Warna',
    category: 'google',
    formatSize: 'a6',
    description: 'Format A6 4 kuadran diagonal warna khas Google (Merah, Biru, Hijau, Kuning) dengan 5 bintang hitam tegas.',
    previewColors: ['#EA4335', '#4285F4', '#34A853', '#FBBC05']
  },
  {
    id: 'classic-blue',
    name: 'Google Review: Persegi Biru Klasik Meja',
    badge: 'Google 1:1',
    category: 'google',
    formatSize: 'square',
    description: 'Format kotak 1:1 dengan header biru horizontal dan tata letak seimbang.',
    previewColors: ['#0038CB', '#FFFFFF', '#F9BC06']
  },
  {
    id: 'blue-arc',
    name: 'Google Review: Persegi Lengkung Biru Modern',
    badge: 'Google 1:1',
    category: 'google',
    formatSize: 'square',
    description: 'Format kotak 1:1 kubah lengkung biru modern dengan lencana lingkaran Google dan teks warna-warni.',
    previewColors: ['#074BB3', '#FFFFFF', '#4285F4', '#EA4335']
  },
  {
    id: 'pinwheel-4color',
    name: 'Google Review: Persegi Geometris 4 Warna',
    badge: 'Google 1:1',
    category: 'google',
    formatSize: 'square',
    description: 'Format kotak 1:1 4 kuadran segitiga Google dengan sudut melengkung dan bintang putih.',
    previewColors: ['#EA4335', '#4285F4', '#34A853', '#FBBC05']
  },
  {
    id: 'border-4color',
    name: 'Google Review: Persegi Bingkai 4 Warna',
    badge: 'Google 1:1',
    category: 'google',
    formatSize: 'square',
    description: 'Format kotak 1:1 bingkai tebal 4 warna khas Google dengan latar putih minimalis.',
    previewColors: ['#FFFFFF', '#EA4335', '#4285F4', '#34A853']
  },
  {
    id: 'onyx-black',
    name: 'Google Review: Persegi Onyx Dark Minimalis',
    badge: 'Google 1:1 Dark',
    category: 'google',
    formatSize: 'square',
    description: 'Format kotak 1:1 latar hitam legam premium dengan bintang emas berkilau.',
    previewColors: ['#0A0A0A', '#FFFFFF', '#FBBC05'],
    isDark: true
  }
];

export function isA6Template(templateId: StandTemplateId): boolean {
  return (
    templateId === 'a6-blue-cutout' ||
    templateId === 'a6-onyx-dark' ||
    templateId === 'a6-blue-dome' ||
    templateId === 'a6-pinwheel' ||
    templateId === 'a6-whatsapp' ||
    templateId === 'a6-instagram' ||
    templateId === 'a6-tiktok' ||
    templateId === 'a6-facebook' ||
    templateId === 'a6-social-all'
  );
}

export function getStandDimensions(formatSize: StandFormatSize = 'a6', highRes = false): { width: number; height: number } {
  if (formatSize === 'a6') {
    // A6 Standard Ratio 105 mm x 148 mm (~1:1.41)
    return highRes
      ? { width: 2400, height: 3384 }
      : { width: 1200, height: 1692 };
  }
  return highRes
    ? { width: 2400, height: 2400 }
    : { width: 1200, height: 1200 };
}

export interface StandDesignOptions {
  templateId?: StandTemplateId;
  formatSize?: StandFormatSize;
  placeName?: string;
  themeColor?: string;
  qrText: string;
  registrationCode?: string;
  width?: number;
  height?: number;
  showPlaceName?: boolean;
  watermark?: boolean;
  customHeading?: string;
  customTopBadge?: string;
}

/**
 * Draws a 5-pointed star onto a 2D canvas context
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws rounded rectangle path
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Loads an SVG data URL image into an HTMLImageElement
 */
function loadSvgImage(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  });
}

// Official Google G Logo SVG String
const GOOGLE_G_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>`;

// WhatsApp Logo SVG String
const WHATSAPP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="46" fill="#25D366"/>
  <path fill="#ffffff" d="M48 18c-16.57 0-30 13.43-30 30 0 5.3 1.38 10.28 3.79 14.61L18 78l16.03-3.69C38.12 76.4 42.9 78 48 78c16.57 0 30-13.43 30-30s-13.43-30-30-30zm17.48 42.42c-.74 2.08-3.66 3.82-5.99 4.32-1.6.34-3.68.61-10.7-2.3-9.01-3.73-14.77-12.87-15.22-13.47-.44-.6-3.63-4.83-3.63-9.21s2.29-6.53 3.1-7.42c.81-.89 1.77-1.11 2.36-1.11.59 0 1.18.01 1.7.03.55.02 1.28-.21 2 .1.54 1.3 2.66 6.5 2.89 7.09.23.59.39 1.28-.01 2.06-.4.78-.6 1.27-1.19 1.96-.59.69-1.24 1.54-1.77 2.07-.59.59-1.2 1.23-.52 2.4 1.39 2.39 3.08 4.78 5.79 7.19 3.5 3.12 6.45 4.19 7.64 4.79 1.19.6 1.88.5 2.57-.3.69-.79 2.97-3.46 3.76-4.65.79-1.19 1.58-1 2.66-.6 1.09.4 6.89 3.25 8.08 3.84 1.19.59 1.98.89 2.28 1.38.3.49.3 2.86-.44 4.94z"/>
</svg>`;

// Instagram Logo SVG String (with sunset gradient)
const INSTAGRAM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="ig-grad-svg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFDC80"/>
      <stop offset="25%" stop-color="#F77737"/>
      <stop offset="50%" stop-color="#F56040"/>
      <stop offset="75%" stop-color="#FD1D1D"/>
      <stop offset="100%" stop-color="#833AB4"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="92" height="92" rx="26" fill="url(#ig-grad-svg)"/>
  <rect x="20" y="20" width="56" height="56" rx="16" fill="none" stroke="#ffffff" stroke-width="6"/>
  <circle cx="48" cy="48" r="14" fill="none" stroke="#ffffff" stroke-width="6"/>
  <circle cx="64" cy="32" r="3.5" fill="#ffffff"/>
</svg>`;

// TikTok Logo SVG String
const TIKTOK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect x="2" y="2" width="92" height="92" rx="24" fill="#010101"/>
  <g transform="translate(26, 20)">
    <path fill="#00F2FE" d="M37.8 11.5a16.8 16.8 0 0 1-9.8-3.1v19.4a16.2 16.2 0 1 1-16.2-16.2c.9 0 1.8.1 2.7.2v7.2a9 9 0 1 0 6.3 8.6V0h7.2a9.6 9.6 0 0 0 9.8 9.6v1.9z"/>
    <path fill="#FE2C55" d="M39.8 13.5a16.8 16.8 0 0 1-9.8-3.1v19.4a16.2 16.2 0 1 1-16.2-16.2c.9 0 1.8.1 2.7.2v7.2a9 9 0 1 0 6.3 8.6V2h7.2a9.6 9.6 0 0 0 9.8 9.6v1.9z"/>
    <path fill="#FFFFFF" d="M38.8 12.5a16.8 16.8 0 0 1-9.8-3.1v19.4a16.2 16.2 0 1 1-16.2-16.2c.9 0 1.8.1 2.7.2v7.2a9 9 0 1 0 6.3 8.6V1h7.2a9.6 9.6 0 0 0 9.8 9.6v1.9z"/>
  </g>
</svg>`;

// Facebook Logo SVG String
const FACEBOOK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="46" fill="#1877F2"/>
  <path fill="#ffffff" d="M53.6 78V48.5h9.9l1.5-11.5h-11.4v-7.3c0-3.3.9-5.6 5.7-5.6h6.1V13.8c-1.1-.1-4.7-.5-8.9-.5-8.8 0-14.8 5.4-14.8 15.2v8.5H32v11.5h9.7V78h11.9z"/>
</svg>`;

/**
 * Draws the standardized NFC Phone icon + waves + "TAP UNTUK REVIEW" label
 */
function drawNfcPhoneSection(
  ctx: CanvasRenderingContext2D,
  options: {
    centerX: number;
    centerY: number;
    scale: number;
    color: string;
    customLabel?: string;
    subLabel?: string;
    fillColor?: string;
  }
) {
  const { centerX, centerY, scale, color, customLabel = 'TAP UNTUK REVIEW', fillColor } = options;
  const phoneWidth = 158 * scale;
  const phoneHeight = 280 * scale;
  const phoneX = centerX - phoneWidth / 2;
  const phoneY = centerY - phoneHeight / 2 - 20 * scale;

  ctx.save();

  // If fillColor is provided (e.g. #ffffff on dark/colored background), fill body
  if (fillColor) {
    ctx.fillStyle = fillColor;
    drawRoundedRectPath(ctx, phoneX, phoneY, phoneWidth, phoneHeight, 26 * scale);
    ctx.fill();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 8 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw Phone Outer Shell
  drawRoundedRectPath(ctx, phoneX, phoneY, phoneWidth, phoneHeight, 26 * scale);
  ctx.stroke();

  // Top Speaker Notch & Camera Dot
  ctx.beginPath();
  ctx.moveTo(phoneX + phoneWidth / 2 - 20 * scale, phoneY + 16 * scale);
  ctx.lineTo(phoneX + phoneWidth / 2 + 10 * scale, phoneY + 16 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(phoneX + phoneWidth / 2 + 22 * scale, phoneY + 16 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // NFC Text inside Phone
  ctx.fillStyle = color;
  ctx.font = `800 ${44 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NFC', centerX, phoneY + phoneHeight / 2);

  // Concentric Radio Waves
  const waveRadius1 = 110 * scale;
  const waveRadius2 = 135 * scale;
  const waveRadius3 = 160 * scale;
  const waveCenterY = phoneY + phoneHeight / 2;

  const drawWaveArc = (radius: number, isLeft: boolean) => {
    ctx.beginPath();
    const cx = isLeft ? phoneX + 30 * scale : phoneX + phoneWidth - 30 * scale;
    const startAngle = isLeft ? Math.PI * 0.72 : -Math.PI * 0.28;
    const endAngle = isLeft ? Math.PI * 1.28 : Math.PI * 0.28;
    ctx.arc(cx, waveCenterY, radius, startAngle, endAngle);
    ctx.stroke();
  };

  ctx.lineWidth = 7 * scale;
  drawWaveArc(waveRadius1, true);
  drawWaveArc(waveRadius2, true);
  drawWaveArc(waveRadius3, true);

  drawWaveArc(waveRadius1, false);
  drawWaveArc(waveRadius2, false);
  drawWaveArc(waveRadius3, false);

  // Label under phone: ONLY "TAP UNTUK REVIEW" (tulisan di bawahnya telah dihapus sesuai permintaan)
  ctx.fillStyle = color;
  ctx.font = `800 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(customLabel, centerX, phoneY + phoneHeight + 66 * scale);

  ctx.restore();
}

/**
 * Draws the QR Code square container + rendered QR image + "SCAN QR UNTUK REVIEW" + "QR 001" (Registration Code)
 */
async function drawQrCodeSection(
  ctx: CanvasRenderingContext2D,
  options: {
    centerX: number;
    centerY: number;
    scale: number;
    qrText: string;
    borderColor: string;
    textColor: string;
    whitePadBackground?: boolean;
    customLabel?: string;
    registrationCode?: string;
  }
) {
  const {
    centerX,
    centerY,
    scale,
    qrText,
    borderColor,
    textColor,
    whitePadBackground = true,
    customLabel = 'SCAN QR UNTUK REVIEW',
    registrationCode = 'QR 001'
  } = options;

  const qrBoxSize = 380 * scale;
  const qrBoxX = centerX - qrBoxSize / 2;
  const qrBoxY = centerY - qrBoxSize / 2 - 20 * scale;

  ctx.save();

  // If dark mode or colorful background, fill inside box with solid white for scannability
  if (whitePadBackground) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  }

  // Draw border outline
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 6 * scale;
  ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

  // Render QR Code inside
  if (qrText) {
    try {
      const offscreen = document.createElement('canvas');
      const innerMargin = 16 * scale;
      const innerQRSize = qrBoxSize - innerMargin * 2;
      offscreen.width = innerQRSize;
      offscreen.height = innerQRSize;

      await QRCode.toCanvas(offscreen, qrText, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: innerQRSize,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      ctx.drawImage(offscreen, qrBoxX + innerMargin, qrBoxY + innerMargin, innerQRSize, innerQRSize);
    } catch (e) {
      console.error('Failed to render QR on stand canvas:', e);
    }
  }

  // Label under QR Code box: "SCAN QR UNTUK REVIEW"
  ctx.fillStyle = textColor;
  ctx.font = `800 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(customLabel, centerX, qrBoxY + qrBoxSize + 66 * scale);

  // Kode Registrasi di Bawah QR Code: berupa "QR 001", "QR 002", dan seterusnya
  if (registrationCode) {
    const cleanNum = registrationCode.replace(/^QR[- ]?/i, '').trim();
    const formattedCode = cleanNum ? `QR ${cleanNum}` : registrationCode;

    ctx.font = `900 ${26 * scale}px "Plus Jakarta Sans", monospace, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(formattedCode, centerX, qrBoxY + qrBoxSize + 104 * scale);
  }

  ctx.restore();
}

/* ======================================================================================
   4 DESAIN STAND MEJA UKURAN A6 (105 x 148 mm)
   ====================================================================================== */

/**
 * A6 Template 1: A6 Lengkung Biru (Arch Cutout) - exactly matching 1_24661c48.png
 */
async function renderA6BlueCutout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, themeColor = '#0038CB', showPlaceName } = options;

  // Background: Pure White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top Banner: Rich Blue
  const bannerH = 430 * scale;
  ctx.fillStyle = themeColor;
  ctx.fillRect(0, 0, width, bannerH);

  // Semicircle cutout into the blue banner at bottom center
  const cutoutCx = width / 2;
  const cutoutCy = bannerH;
  const cutoutR = 210 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cutoutCx, cutoutCy, cutoutR, Math.PI, 0, false);
  ctx.fill();

  // Draw Google G Logo centered in the arch cutout
  if (gLogoImg) {
    const gSize = 310 * scale;
    ctx.drawImage(gLogoImg, cutoutCx - gSize / 2, cutoutCy - gSize / 2, gSize, gSize);
  }

  // 5 Golden Yellow Stars (★★★★★)
  const starY = 700 * scale;
  const starOuter = 40 * scale;
  const starInner = 19 * scale;
  const starSpacing = 78 * scale;
  ctx.fillStyle = '#FBBC05';

  const starsStartX = cutoutCx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text: "Bantu Kami Dengan Ulasan"
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Bantu Kami Dengan Ulasan', cutoutCx, 820 * scale);

  // Text: "Google Review" (Multi-color Google + black Review)
  const googleLetters = [
    { char: 'G', color: '#4285F4' },
    { char: 'o', color: '#EA4335' },
    { char: 'o', color: '#FBBC05' },
    { char: 'g', color: '#4285F4' },
    { char: 'l', color: '#34A853' },
    { char: 'e', color: '#EA4335' }
  ];

  ctx.font = `800 ${84 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const reviewWord = ' Review';
  let googleWidth = 0;
  googleLetters.forEach(item => {
    googleWidth += ctx.measureText(item.char).width;
  });
  const reviewWidth = ctx.measureText(reviewWord).width;
  const totalBrandWidth = googleWidth + reviewWidth;

  let startLetterX = cutoutCx - totalBrandWidth / 2;
  const brandY = 925 * scale;

  ctx.textAlign = 'left';
  googleLetters.forEach(item => {
    ctx.fillStyle = item.color;
    ctx.fillText(item.char, startLetterX, brandY);
    startLetterX += ctx.measureText(item.char).width;
  });

  ctx.fillStyle = '#000000';
  ctx.fillText(reviewWord, startLetterX, brandY);

  if (showPlaceName && placeName) {
    ctx.textAlign = 'center';
    ctx.font = `600 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = themeColor;
    ctx.fillText(placeName, cutoutCx, 980 * scale);
  }

  // Bottom Section: Left Phone, Right QR Code
  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#000000'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#000000',
    textColor: '#000000',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/**
 * A6 Template 2: A6 Onyx Hitam Elegan (Dark Edition) - matching 4_a9355167.png
 */
async function renderA6OnyxDark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  // Background: Pure Black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Top White Circular Disc
  const discCx = width / 2;
  const discCy = 360 * scale;
  const discR = 210 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(discCx, discCy, discR, 0, Math.PI * 2);
  ctx.fill();

  // Draw Google G Logo in center of disc
  if (gLogoImg) {
    const gSize = 310 * scale;
    ctx.drawImage(gLogoImg, discCx - gSize / 2, discCy - gSize / 2, gSize, gSize);
  }

  // 5 Solid White Stars (★★★★★)
  const starY = 660 * scale;
  const starOuter = 40 * scale;
  const starInner = 19 * scale;
  const starSpacing = 78 * scale;
  ctx.fillStyle = '#ffffff';

  const starsStartX = discCx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text: "Bantu Kami Dengan Ulasan" in White
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Bantu Kami Dengan Ulasan', discCx, 780 * scale);

  // Text: "Google Review" in Solid White
  ctx.font = `800 ${86 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Google Review', discCx, 885 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `600 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#FFE600';
    ctx.fillText(placeName, discCx, 940 * scale);
  }

  // Bottom Section: White Phone & White QR Box
  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#ffffff'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#ffffff',
    textColor: '#ffffff',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/**
 * A6 Template 3: A6 Kubah Biru Google (Dome Curve) - matching 2_f3802f03.png
 */
async function renderA6BlueDome(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, themeColor = '#0038CB', showPlaceName } = options;

  // Background: Pure White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top Blue Dome Curve
  ctx.save();
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 160 * scale);
  ctx.bezierCurveTo(
    width * 0.85, 480 * scale,
    width * 0.15, 480 * scale,
    0, 160 * scale
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // White Circular Disc centered at top curve
  const discCx = width / 2;
  const discCy = 360 * scale;
  const discR = 210 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(discCx, discCy, discR, 0, Math.PI * 2);
  ctx.fill();

  // Google G Logo
  if (gLogoImg) {
    const gSize = 310 * scale;
    ctx.drawImage(gLogoImg, discCx - gSize / 2, discCy - gSize / 2, gSize, gSize);
  }

  // 5 Golden Yellow Stars (★★★★★)
  const starY = 660 * scale;
  const starOuter = 40 * scale;
  const starInner = 19 * scale;
  const starSpacing = 78 * scale;
  ctx.fillStyle = '#FBBC05';

  const starsStartX = discCx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text: "Bantu Kami Dengan Ulasan"
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Bantu Kami Dengan Ulasan', discCx, 780 * scale);

  // Text: "Google Review" (Multi-color Google + black Review)
  const googleLetters = [
    { char: 'G', color: '#4285F4' },
    { char: 'o', color: '#EA4335' },
    { char: 'o', color: '#FBBC05' },
    { char: 'g', color: '#4285F4' },
    { char: 'l', color: '#34A853' },
    { char: 'e', color: '#EA4335' }
  ];

  ctx.font = `800 ${84 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const reviewWord = ' Review';
  let googleWidth = 0;
  googleLetters.forEach(item => {
    googleWidth += ctx.measureText(item.char).width;
  });
  const reviewWidth = ctx.measureText(reviewWord).width;
  const totalBrandWidth = googleWidth + reviewWidth;

  let startLetterX = discCx - totalBrandWidth / 2;
  const brandY = 885 * scale;

  ctx.textAlign = 'left';
  googleLetters.forEach(item => {
    ctx.fillStyle = item.color;
    ctx.fillText(item.char, startLetterX, brandY);
    startLetterX += ctx.measureText(item.char).width;
  });

  ctx.fillStyle = '#000000';
  ctx.fillText(reviewWord, startLetterX, brandY);

  if (showPlaceName && placeName) {
    ctx.textAlign = 'center';
    ctx.font = `600 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = themeColor;
    ctx.fillText(placeName, discCx, 940 * scale);
  }

  // Bottom Section: Left Phone, Right QR Code
  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#000000'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#000000',
    textColor: '#000000',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/**
 * A6 Template 4: A6 4-Warna Kuadran Google (Quadrant Color) - matching 3_84ea9530.png
 */
async function renderA6Pinwheel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  // Center meeting point behind the logo disc
  const cx = width / 2;
  const cy = 360 * scale;

  // Top Triangle: Red #EA4335
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#EA4335';
  ctx.fill();

  // Right Triangle: Blue #4285F4
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#4285F4';
  ctx.fill();

  // Bottom Triangle: Green #34A853
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#34A853';
  ctx.fill();

  // Left Triangle: Yellow #FBBC05
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#FBBC05';
  ctx.fill();

  // White Circular Disc centered at (cx, cy)
  const discR = 210 * scale;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, discR, 0, Math.PI * 2);
  ctx.fill();

  // Google G Logo in center
  if (gLogoImg) {
    const gSize = 310 * scale;
    ctx.drawImage(gLogoImg, cx - gSize / 2, cy - gSize / 2, gSize, gSize);
  }

  // 5 Solid Black Stars (★★★★★) as in 3_84ea9530.png!
  const starY = 660 * scale;
  const starOuter = 40 * scale;
  const starInner = 19 * scale;
  const starSpacing = 78 * scale;
  ctx.fillStyle = '#000000';

  const starsStartX = cx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text: "Bantu Kami Dengan Ulasan" in Black
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Bantu Kami Dengan Ulasan', cx, 780 * scale);

  // Text: "Google Review" in Solid Black
  ctx.font = `800 ${86 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Google Review', cx, 885 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `600 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.fillText(placeName, cx, 940 * scale);
  }

  // Bottom Section: Phone with solid white fill & black outline, QR box with white fill & black outline
  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#000000',
    fillColor: '#ffffff'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#000000',
    textColor: '#000000',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/* ======================================================================================
   5 DESAIN STAND KOTAK / PERSEGI (1:1)
   ====================================================================================== */

/**
 * 1. Template: Classic Blue Half (Original 2_c63faeab.png)
 */
async function renderClassicBlue(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, themeColor = '#0038CB', showPlaceName } = options;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top Banner
  const topBannerHeight = height * 0.42;
  ctx.fillStyle = themeColor;
  ctx.fillRect(0, 0, width, topBannerHeight);

  // Google G Logo
  if (gLogoImg) {
    const gSize = 250 * scale;
    const gx = 45 * scale;
    const gy = (topBannerHeight - gSize) / 2 + 10 * scale;
    ctx.drawImage(gLogoImg, gx, gy, gSize, gSize);
  }

  // Texts
  const textLeft = 330 * scale;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `600 ${44 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Bantu Kami Dengan', textLeft, 160 * scale);

  ctx.font = `800 ${76 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Google Review', textLeft, 250 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `600 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#FFE600';
    ctx.fillText(placeName, textLeft, 290 * scale);
  }

  // 5 Gold Stars
  const starY = showPlaceName && placeName ? 345 * scale : 325 * scale;
  const starOuter = 34 * scale;
  const starInner = 16 * scale;
  const starSpacing = 68 * scale;
  ctx.fillStyle = '#F9BC06';

  for (let i = 0; i < 5; i++) {
    const sx = textLeft + 25 * scale + i * starSpacing;
    drawStar(ctx, sx, starY, 5, starOuter, starInner);
  }

  // Bottom Content
  const bottomCenterY = topBannerHeight + (height - topBannerHeight) / 2;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale,
    color: '#000000'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#000000',
    textColor: '#000000',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/**
 * 2. Template: Blue Arc Curve (3_d5f74b44.png)
 */
async function renderBlueArc(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  // Background: Pure White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top Arc: Rich Royal Blue dome canopy
  ctx.save();
  ctx.fillStyle = '#074BB3';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 100 * scale);
  ctx.bezierCurveTo(
    width * 0.82, 330 * scale,
    width * 0.18, 330 * scale,
    0, 100 * scale
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // White Circular Badge with Google G in Center
  const badgeCx = width / 2;
  const badgeCy = 230 * scale;
  const badgeRadius = 185 * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  if (gLogoImg) {
    const gSize = 250 * scale;
    ctx.drawImage(gLogoImg, badgeCx - gSize / 2, badgeCy - gSize / 2, gSize, gSize);
  }

  // 5 Stars below the badge (Yellow / Gold)
  const starY = 445 * scale;
  const starOuter = 34 * scale;
  const starInner = 16 * scale;
  const starSpacing = 68 * scale;
  ctx.fillStyle = '#FBBC05';

  const starsStartX = badgeCx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text 1: "Bantu Kami Dengan Ulasan"
  ctx.fillStyle = '#000000';
  ctx.font = `700 ${44 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Bantu Kami Dengan Ulasan', badgeCx, 520 * scale);

  // Text 2: "Google Review" (with multicolor "Google")
  const googleLetters = [
    { char: 'G', color: '#4285F4' },
    { char: 'o', color: '#EA4335' },
    { char: 'o', color: '#FBBC05' },
    { char: 'g', color: '#4285F4' },
    { char: 'l', color: '#34A853' },
    { char: 'e', color: '#EA4335' }
  ];

  ctx.font = `800 ${68 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const reviewWord = ' Review';
  
  let googleWidth = 0;
  googleLetters.forEach(item => {
    googleWidth += ctx.measureText(item.char).width;
  });
  const reviewWidth = ctx.measureText(reviewWord).width;
  const totalBrandWidth = googleWidth + reviewWidth;

  let startLetterX = badgeCx - totalBrandWidth / 2;
  const brandY = 600 * scale;

  ctx.textAlign = 'left';
  googleLetters.forEach(item => {
    ctx.fillStyle = item.color;
    ctx.fillText(item.char, startLetterX, brandY);
    startLetterX += ctx.measureText(item.char).width;
  });

  ctx.fillStyle = '#000000';
  ctx.fillText(reviewWord, startLetterX, brandY);

  if (showPlaceName && placeName) {
    ctx.textAlign = 'center';
    ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#074BB3';
    ctx.fillText(placeName, badgeCx, 638 * scale);
  }

  // Bottom Content: Left Phone, Right QR Box
  const bottomCenterY = 880 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale,
    color: '#000000'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#000000',
    textColor: '#000000',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/**
 * 3. Template: Google Pinwheel 4-Color (4_e087ce46.png)
 */
async function renderPinwheel4Color(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.save();
  const cornerRadius = 56 * scale;
  drawRoundedRectPath(ctx, 0, 0, width, height, cornerRadius);
  ctx.clip();

  // 4 Triangular Quadrants meeting at center
  const cx = width / 2;
  const cy = height / 2;

  // Top Triangle: Red #EA4335
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#EA4335';
  ctx.fill();

  // Right Triangle: Blue #4285F4
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#4285F4';
  ctx.fill();

  // Bottom Triangle: Green #34A853
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#34A853';
  ctx.fill();

  // Left Triangle: Yellow #FBBC05
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#FBBC05';
  ctx.fill();

  ctx.restore();

  // Center Top: White Circular Disc with Google G Logo
  const badgeCx = width / 2;
  const badgeCy = 245 * scale;
  const badgeRadius = 180 * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  if (gLogoImg) {
    const gSize = 250 * scale;
    ctx.drawImage(gLogoImg, badgeCx - gSize / 2, badgeCy - gSize / 2, gSize, gSize);
  }

  // 5 PURE WHITE Stars
  const starY = 445 * scale;
  const starOuter = 34 * scale;
  const starInner = 16 * scale;
  const starSpacing = 68 * scale;
  ctx.fillStyle = '#ffffff';

  const starsStartX = badgeCx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text 1: "Bantu Kami Dengan Ulasan" (White)
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${44 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Bantu Kami Dengan Ulasan', badgeCx, 520 * scale);

  // Text 2: "Google Review" (White)
  ctx.font = `800 ${70 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Google Review', badgeCx, 600 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(placeName, badgeCx, 638 * scale);
  }

  // Bottom Content: White Phone & White QR Box
  const bottomCenterY = 880 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale,
    color: '#ffffff'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#ffffff',
    textColor: '#ffffff',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/**
 * 4. Template: Google 4-Color Border (5_b6857285.png)
 */
async function renderBorder4Color(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.save();
  const cornerRadius = 60 * scale;
  drawRoundedRectPath(ctx, 0, 0, width, height, cornerRadius);
  ctx.clip();

  // Background: Pure White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw 4-Color Border Frame
  const borderWidth = 38 * scale;
  const halfBorder = borderWidth / 2;

  // Top Border: Google Red #EA4335
  ctx.strokeStyle = '#EA4335';
  ctx.lineWidth = borderWidth;
  ctx.beginPath();
  ctx.moveTo(0, halfBorder);
  ctx.lineTo(width, halfBorder);
  ctx.stroke();

  // Right Border: Google Blue #4285F4
  ctx.strokeStyle = '#4285F4';
  ctx.beginPath();
  ctx.moveTo(width - halfBorder, 0);
  ctx.lineTo(width - halfBorder, height);
  ctx.stroke();

  // Bottom Border: Google Green #34A853
  ctx.strokeStyle = '#34A853';
  ctx.beginPath();
  ctx.moveTo(width, height - halfBorder);
  ctx.lineTo(0, height - halfBorder);
  ctx.stroke();

  // Left Border: Google Yellow #FBBC05
  ctx.strokeStyle = '#FBBC05';
  ctx.beginPath();
  ctx.moveTo(halfBorder, height);
  ctx.lineTo(halfBorder, 0);
  ctx.stroke();

  ctx.restore();

  // Top Center: White Circular Disc with Google G Logo
  const badgeCx = width / 2;
  const badgeCy = 230 * scale;
  const badgeRadius = 185 * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = 16 * scale;
  ctx.shadowOffsetY = 4 * scale;
  ctx.fill();
  ctx.restore();

  if (gLogoImg) {
    const gSize = 250 * scale;
    ctx.drawImage(gLogoImg, badgeCx - gSize / 2, badgeCy - gSize / 2, gSize, gSize);
  }

  // 5 Golden Yellow Stars
  const starY = 445 * scale;
  const starOuter = 34 * scale;
  const starInner = 16 * scale;
  const starSpacing = 68 * scale;
  ctx.fillStyle = '#FBBC05';

  const starsStartX = badgeCx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text 1: "Bantu Kami Dengan Ulasan"
  ctx.fillStyle = '#000000';
  ctx.font = `700 ${44 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Bantu Kami Dengan Ulasan', badgeCx, 520 * scale);

  // Text 2: "Google Review" (Bold Black)
  ctx.font = `800 ${70 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Google Review', badgeCx, 600 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#4285F4';
    ctx.fillText(placeName, badgeCx, 638 * scale);
  }

  // Bottom Content: Black Phone & Black QR Box
  const bottomCenterY = 880 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale,
    color: '#000000'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#000000',
    textColor: '#000000',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/**
 * 5. Template: Onyx Black Minimalist (1_f8254b9d.png)
 */
async function renderOnyxBlack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  gLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.save();
  const cornerRadius = 60 * scale;
  drawRoundedRectPath(ctx, 0, 0, width, height, cornerRadius);
  ctx.clip();

  // Background: Deep Onyx Black
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  // Top Lockup: Google G Logo + "Google" in pure white
  const badgeCx = width / 2;
  const topLockupY = 180 * scale;

  ctx.save();
  ctx.font = `700 ${112 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const googleWord = 'Google';
  const textMetric = ctx.measureText(googleWord);
  const gSize = 138 * scale;
  const gap = 34 * scale;
  const totalLockupWidth = gSize + gap + textMetric.width;

  const gLogoX = badgeCx - totalLockupWidth / 2;
  const textX = gLogoX + gSize + gap;

  if (gLogoImg) {
    ctx.drawImage(gLogoImg, gLogoX, topLockupY - gSize / 2, gSize, gSize);
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(googleWord, textX, topLockupY + 6 * scale);
  ctx.restore();

  // 5 Golden Stars below the lockup
  const starY = 365 * scale;
  const starOuter = 38 * scale;
  const starInner = 18 * scale;
  const starSpacing = 74 * scale;
  ctx.fillStyle = '#FBBC05';

  const starsStartX = badgeCx - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, starY, 5, starOuter, starInner);
  }

  // Text: "Bantu Kami Dengan Ulasan" in pure white
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('Bantu Kami Dengan Ulasan', badgeCx, 475 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `600 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#FFE600';
    ctx.fillText(placeName, badgeCx, 525 * scale);
  }

  // Bottom: White Phone & White QR Box on dark canvas
  const bottomCenterY = 820 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.28,
    centerY: bottomCenterY,
    scale,
    color: '#ffffff'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#ffffff',
    textColor: '#ffffff',
    whitePadBackground: true,
    registrationCode: options.registrationCode
  });
}

/* ======================================================================================
   DESAIN STAND MEJA SOSIAL MEDIA (WHATSAPP, INSTAGRAM, TIKTOK, FACEBOOK, ALL-IN-ONE)
   ====================================================================================== */

/**
 * 1. A6 WhatsApp: Chat & Order Langsung (105 x 148 mm)
 */
async function renderA6WhatsApp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  waLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  // Background: Pure White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top Curved Header: WhatsApp Deep Forest
  const bannerH = 430 * scale;
  ctx.fillStyle = '#075E54';
  ctx.fillRect(0, 0, width, bannerH);

  // Decorative arch cutout for WhatsApp logo
  const cutoutCx = width / 2;
  const cutoutCy = bannerH;
  const cutoutR = 210 * scale;

  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.arc(cutoutCx, cutoutCy, cutoutR + 10 * scale, Math.PI, 0, false);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cutoutCx, cutoutCy, cutoutR, Math.PI, 0, false);
  ctx.fill();

  // Draw WhatsApp Logo
  if (waLogoImg) {
    const waSize = 290 * scale;
    ctx.drawImage(waLogoImg, cutoutCx - waSize / 2, cutoutCy - waSize / 2, waSize, waSize);
  }

  // Top Pill Badge
  ctx.save();
  ctx.fillStyle = '#EAF8F0';
  drawRoundedRectPath(ctx, cutoutCx - 270 * scale, 130 * scale, 540 * scale, 56 * scale, 28 * scale);
  ctx.fill();
  ctx.strokeStyle = '#25D366';
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  ctx.fillStyle = '#075E54';
  ctx.font = `800 ${22 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const topPillText = options.customTopBadge || '✓ CHAT LANGSUNG & LAYANAN RESMI';
  ctx.fillText(topPillText, cutoutCx, 158 * scale);
  ctx.restore();

  // Text: Custom Heading for Bisnis / Cafe / Sekolah / Kampus / Resto
  const headingText = options.customHeading || 'Hubungi & Pesan Menu di';
  let headingFontSize = 52 * scale;
  if (headingText.length > 32) {
    headingFontSize = 38 * scale;
  } else if (headingText.length > 25) {
    headingFontSize = 44 * scale;
  }
  ctx.fillStyle = '#075E54';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${headingFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText(headingText, cutoutCx, 760 * scale);

  ctx.font = `900 ${92 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#25D366';
  ctx.fillText('WhatsApp', cutoutCx, 865 * scale);

  ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#475569';
  ctx.fillText('Pindai QR atau Tap NFC dengan Kamera HP Anda', cutoutCx, 930 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${32 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#075E54';
    ctx.fillText(placeName, cutoutCx, 995 * scale);
  }

  // Bottom Content: NFC & QR Code (Identik Google Review)
  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#075E54',
    customLabel: 'TAP CHAT WA'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#25D366',
    textColor: '#075E54',
    whitePadBackground: true,
    customLabel: 'SCAN QR WHATSAPP',
    registrationCode: options.registrationCode
  });
}

/**
 * 2. Persegi WhatsApp (1:1) - Desain Format Kotak Google Review
 */
async function renderSquareWhatsApp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  waLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top WhatsApp Bar
  ctx.fillStyle = '#075E54';
  ctx.fillRect(0, 0, width, 240 * scale);

  const badgeCx = width / 2;
  const badgeCy = 240 * scale;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, 140 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#25D366';
  ctx.lineWidth = 6 * scale;
  ctx.stroke();

  if (waLogoImg) {
    const waSize = 210 * scale;
    ctx.drawImage(waLogoImg, badgeCx - waSize / 2, badgeCy - waSize / 2, waSize, waSize);
  }

  // Headings: Custom Heading for Bisnis / Cafe / Sekolah / Kampus / Resto
  const squareHeadingText = options.customHeading
    ? (options.customHeading.toUpperCase().includes('WHATSAPP')
        ? options.customHeading.toUpperCase()
        : `${options.customHeading.toUpperCase()} WHATSAPP`)
    : 'CHAT & PESAN LEWAT WHATSAPP';

  let squareFontSize = 46 * scale;
  if (squareHeadingText.length > 35) {
    squareFontSize = 34 * scale;
  } else if (squareHeadingText.length > 26) {
    squareFontSize = 39 * scale;
  }

  ctx.fillStyle = '#075E54';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${squareFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText(squareHeadingText, badgeCx, 460 * scale);

  ctx.font = `600 ${24 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('Pindai QR atau Dekatkan HP Anda (Tap NFC)', badgeCx, 510 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#25D366';
    ctx.fillText(placeName, badgeCx, 560 * scale);
  }

  const bottomCenterY = 820 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.28,
    centerY: bottomCenterY,
    scale,
    color: '#075E54',
    customLabel: 'TAP CHAT WA'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#25D366',
    textColor: '#075E54',
    whitePadBackground: true,
    customLabel: 'SCAN QR WHATSAPP',
    registrationCode: options.registrationCode
  });
}

/**
 * 3. A6 Instagram: Follow & Tag Story (105 x 148 mm)
 */
async function renderA6Instagram(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  igLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top Sunset Gradient Banner
  const bannerH = 430 * scale;
  const grad = ctx.createLinearGradient(0, 0, width, bannerH);
  grad.addColorStop(0, '#833AB4');
  grad.addColorStop(0.4, '#FD1D1D');
  grad.addColorStop(1, '#FCB045');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, bannerH);

  // Arch cutout
  const cutoutCx = width / 2;
  const cutoutCy = bannerH;
  const cutoutR = 210 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cutoutCx, cutoutCy, cutoutR, Math.PI, 0, false);
  ctx.fill();

  if (igLogoImg) {
    const igSize = 280 * scale;
    ctx.drawImage(igLogoImg, cutoutCx - igSize / 2, cutoutCy - igSize / 2, igSize, igSize);
  }

  // Top Pill Badge
  ctx.save();
  ctx.fillStyle = '#FFF5F7';
  drawRoundedRectPath(ctx, cutoutCx - 270 * scale, 130 * scale, 540 * scale, 56 * scale, 28 * scale);
  ctx.fill();
  ctx.strokeStyle = '#FD1D1D';
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  ctx.fillStyle = '#E1306C';
  ctx.font = `800 ${22 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📸 TAG STORY ANDA & DAPATKAN DISKON', cutoutCx, 158 * scale);
  ctx.restore();

  // 5 Golden Yellow Stars (★★★★★) - Identik Google Review Stand
  // Headings (Stars removed for social templates)
  ctx.fillStyle = '#833AB4';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Ikuti & Tag Kami di', cutoutCx, 760 * scale);

  ctx.font = `900 ${92 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#E1306C';
  ctx.fillText('Instagram', cutoutCx, 865 * scale);

  ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#475569';
  ctx.fillText('Pindai QR atau Tap NFC dengan Kamera HP Anda', cutoutCx, 930 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${32 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#833AB4';
    ctx.fillText(placeName, cutoutCx, 995 * scale);
  }

  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#E1306C',
    customLabel: 'TAP FOLLOW IG'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#E1306C',
    textColor: '#833AB4',
    whitePadBackground: true,
    customLabel: 'SCAN QR INSTAGRAM',
    registrationCode: options.registrationCode
  });
}

/**
 * 4. Persegi Instagram (1:1) - Format Kotak Google Review
 */
async function renderSquareInstagram(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  igLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Gradient Top Bar
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, '#833AB4');
  grad.addColorStop(0.5, '#FD1D1D');
  grad.addColorStop(1, '#FCB045');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 240 * scale);

  const badgeCx = width / 2;
  const badgeCy = 240 * scale;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, 140 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#E1306C';
  ctx.lineWidth = 6 * scale;
  ctx.stroke();

  if (igLogoImg) {
    const igSize = 200 * scale;
    ctx.drawImage(igLogoImg, badgeCx - igSize / 2, badgeCy - igSize / 2, igSize, igSize);
  }

  // Headings (Stars removed for social templates)
  ctx.fillStyle = '#833AB4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${46 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('FOLLOW KAMI DI INSTAGRAM', badgeCx, 460 * scale);

  ctx.font = `600 ${24 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('Pindai QR atau Dekatkan HP Anda (Tap NFC)', badgeCx, 510 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#E1306C';
    ctx.fillText(placeName, badgeCx, 560 * scale);
  }

  const bottomCenterY = 820 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.28,
    centerY: bottomCenterY,
    scale,
    color: '#E1306C',
    customLabel: 'TAP FOLLOW IG'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#E1306C',
    textColor: '#833AB4',
    whitePadBackground: true,
    customLabel: 'SCAN QR INSTAGRAM',
    registrationCode: options.registrationCode
  });
}

/**
 * 5. A6 TikTok: Review & Video Viral (105 x 148 mm)
 */
async function renderA6TikTok(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  ttLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  // Dark Jet Black Background
  ctx.fillStyle = '#010101';
  ctx.fillRect(0, 0, width, height);

  const cutoutCx = width / 2;
  const bannerH = 430 * scale;

  // Neon dual gradient lines
  ctx.save();
  ctx.strokeStyle = '#00F2FE';
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.arc(cutoutCx - 4 * scale, bannerH - 4 * scale, 212 * scale, Math.PI, 0, false);
  ctx.stroke();

  ctx.strokeStyle = '#FE2C55';
  ctx.beginPath();
  ctx.arc(cutoutCx + 4 * scale, bannerH + 4 * scale, 212 * scale, Math.PI, 0, false);
  ctx.stroke();
  ctx.restore();

  // White disc for logo
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(cutoutCx, bannerH, 200 * scale, 0, Math.PI * 2);
  ctx.fill();

  if (ttLogoImg) {
    const ttSize = 280 * scale;
    ctx.drawImage(ttLogoImg, cutoutCx - ttSize / 2, bannerH - ttSize / 2, ttSize, ttSize);
  }

  // Top Neon Pill Badge
  ctx.save();
  ctx.fillStyle = '#111111';
  drawRoundedRectPath(ctx, cutoutCx - 260 * scale, 130 * scale, 520 * scale, 56 * scale, 28 * scale);
  ctx.fill();
  ctx.strokeStyle = '#00F2FE';
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  ctx.fillStyle = '#00F2FE';
  ctx.font = `800 ${22 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎵 TONTON KESERUAN & REVIEW VIRAL', cutoutCx, 158 * scale);
  ctx.restore();

  // Headings (Stars removed for social templates)
  const textCenterY = 760 * scale;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Tonton Video Viral Kami di', cutoutCx, textCenterY);

  // 3D chromatic drop text for "TikTok"
  ctx.font = `900 ${92 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#00F2FE';
  ctx.fillText('TikTok', cutoutCx - 4 * scale, textCenterY + 103 * scale);
  ctx.fillStyle = '#FE2C55';
  ctx.fillText('TikTok', cutoutCx + 4 * scale, textCenterY + 107 * scale);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('TikTok', cutoutCx, textCenterY + 105 * scale);

  ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Pindai QR atau Tap NFC dengan Kamera HP Anda', cutoutCx, textCenterY + 170 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${32 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#00F2FE';
    ctx.fillText(placeName, cutoutCx, textCenterY + 230 * scale);
  }

  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#00F2FE',
    fillColor: '#161616',
    customLabel: 'TAP TIKTOK'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#FE2C55',
    textColor: '#FFFFFF',
    whitePadBackground: true,
    customLabel: 'SCAN QR TIKTOK',
    registrationCode: options.registrationCode
  });
}

/**
 * 6. Persegi TikTok (1:1) - Format Kotak Google Review
 */
async function renderSquareTikTok(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  ttLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#010101';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, width, 240 * scale);

  const badgeCx = width / 2;
  const badgeCy = 240 * scale;
  ctx.fillStyle = '#010101';
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, 140 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00F2FE';
  ctx.lineWidth = 6 * scale;
  ctx.stroke();

  if (ttLogoImg) {
    const ttSize = 200 * scale;
    ctx.drawImage(ttLogoImg, badgeCx - ttSize / 2, badgeCy - ttSize / 2, ttSize, ttSize);
  }

  // Headings (Stars removed for social templates)
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${46 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('FOLLOW KAMI DI TIKTOK', badgeCx, 460 * scale);

  ctx.font = `600 ${24 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Pindai QR atau Dekatkan HP Anda (Tap NFC)', badgeCx, 510 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#00F2FE';
    ctx.fillText(placeName, badgeCx, 560 * scale);
  }

  const bottomCenterY = 820 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.28,
    centerY: bottomCenterY,
    scale,
    color: '#00F2FE',
    fillColor: '#161616',
    customLabel: 'TAP TIKTOK'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#FE2C55',
    textColor: '#FFFFFF',
    whitePadBackground: true,
    customLabel: 'SCAN QR TIKTOK',
    registrationCode: options.registrationCode
  });
}

/**
 * 7. A6 Facebook: Komunitas & Fanspage (105 x 148 mm)
 */
async function renderA6Facebook(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  fbLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const bannerH = 430 * scale;
  ctx.fillStyle = '#1877F2';
  ctx.fillRect(0, 0, width, bannerH);

  const cutoutCx = width / 2;
  const cutoutCy = bannerH;
  const cutoutR = 210 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cutoutCx, cutoutCy, cutoutR, Math.PI, 0, false);
  ctx.fill();

  if (fbLogoImg) {
    const fbSize = 280 * scale;
    ctx.drawImage(fbLogoImg, cutoutCx - fbSize / 2, cutoutCy - fbSize / 2, fbSize, fbSize);
  }

  // Top Pill Badge
  ctx.save();
  ctx.fillStyle = '#E7F3FF';
  drawRoundedRectPath(ctx, cutoutCx - 270 * scale, 130 * scale, 540 * scale, 56 * scale, 28 * scale);
  ctx.fill();
  ctx.strokeStyle = '#1877F2';
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  ctx.fillStyle = '#1877F2';
  ctx.font = `800 ${22 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👍 GABUNG DI KOMUNITAS KAMI', cutoutCx, 158 * scale);
  ctx.restore();

  // Headings (Stars removed for social templates)
  const textCenterY = 760 * scale;
  ctx.fillStyle = '#0C4A9E';
  ctx.font = `800 ${52 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Ikuti Komunitas Kami di', cutoutCx, textCenterY);

  ctx.font = `900 ${92 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#1877F2';
  ctx.fillText('Facebook', cutoutCx, textCenterY + 105 * scale);

  ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#475569';
  ctx.fillText('Pindai QR atau Tap NFC dengan Kamera HP Anda', cutoutCx, textCenterY + 170 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${32 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#1877F2';
    ctx.fillText(placeName, cutoutCx, textCenterY + 230 * scale);
  }

  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#1877F2',
    customLabel: 'TAP HALAMAN FB'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#1877F2',
    textColor: '#0C4A9E',
    whitePadBackground: true,
    customLabel: 'SCAN QR FACEBOOK',
    registrationCode: options.registrationCode
  });
}

/**
 * 8. Persegi Facebook (1:1) - Format Kotak Google Review
 */
async function renderSquareFacebook(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  fbLogoImg: HTMLImageElement | null
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#1877F2';
  ctx.fillRect(0, 0, width, 240 * scale);

  const badgeCx = width / 2;
  const badgeCy = 240 * scale;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, 140 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1877F2';
  ctx.lineWidth = 6 * scale;
  ctx.stroke();

  if (fbLogoImg) {
    const fbSize = 200 * scale;
    ctx.drawImage(fbLogoImg, badgeCx - fbSize / 2, badgeCy - fbSize / 2, fbSize, fbSize);
  }

  // Headings (Stars removed for social templates)
  ctx.fillStyle = '#0C4A9E';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${46 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('IKUTI HALAMAN FACEBOOK KAMI', badgeCx, 460 * scale);

  ctx.font = `600 ${24 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('Pindai QR atau Dekatkan HP Anda (Tap NFC)', badgeCx, 510 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#1877F2';
    ctx.fillText(placeName, badgeCx, 560 * scale);
  }

  const bottomCenterY = 820 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.28,
    centerY: bottomCenterY,
    scale,
    color: '#1877F2',
    customLabel: 'TAP HALAMAN FB'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#1877F2',
    textColor: '#0C4A9E',
    whitePadBackground: true,
    customLabel: 'SCAN QR FACEBOOK',
    registrationCode: options.registrationCode
  });
}

/**
 * 9. A6 Semua Sosmed All-in-One (105 x 148 mm)
 */
async function renderA6SocialAll(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  logos: {
    wa: HTMLImageElement | null;
    ig: HTMLImageElement | null;
    tt: HTMLImageElement | null;
    fb: HTMLImageElement | null;
  }
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const bannerH = 400 * scale;
  ctx.fillStyle = '#104F38';
  ctx.fillRect(0, 0, width, bannerH);

  // Decorative yellow bar
  ctx.fillStyle = '#FFE600';
  ctx.fillRect(0, bannerH - 8 * scale, width, 8 * scale);

  // 4 Social Logos Row
  const logoY = 480 * scale;
  const logoItems = [
    { img: logos.wa, bg: '#25D366' },
    { img: logos.ig, bg: '#E1306C' },
    { img: logos.tt, bg: '#010101' },
    { img: logos.fb, bg: '#1877F2' }
  ];

  const totalLogosWidth = 4 * 160 * scale;
  const startLogoX = (width - totalLogosWidth) / 2 + 80 * scale;

  logoItems.forEach((item, idx) => {
    const cx = startLogoX + idx * 160 * scale;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, logoY, 70 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = item.bg;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    if (item.img) {
      const s = 100 * scale;
      ctx.drawImage(item.img, cx - s / 2, logoY - s / 2, s, s);
    }
    ctx.restore();
  });

  // Top Title in Banner
  ctx.fillStyle = '#FFE600';
  ctx.font = `900 ${24 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HUBUNGI & IKUTI KAMI DI', width / 2, 120 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${70 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('SEMUA SOSMED', width / 2, 210 * scale);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `600 ${24 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('WhatsApp • Instagram • TikTok • Facebook', width / 2, 290 * scale);

  // Headings below logos
  const textCenterY = 720 * scale;
  ctx.fillStyle = '#104F38';
  ctx.font = `800 ${42 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SATU SCAN UNTUK SEMUA', width / 2, textCenterY);

  ctx.font = `600 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('Pindai QR atau Tap NFC untuk Terhubung ke Seluruh Akun Resmi Kami', width / 2, textCenterY + 60 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${32 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#104F38';
    ctx.fillText(placeName, width / 2, textCenterY + 120 * scale);
  }

  const bottomCenterY = 1330 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.30,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    color: '#104F38',
    customLabel: 'TAP SOSIAL MEDIA'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale: scale * 1.15,
    qrText,
    borderColor: '#104F38',
    textColor: '#104F38',
    whitePadBackground: true,
    customLabel: 'SCAN QR SEMUA SOSMED',
    registrationCode: options.registrationCode
  });
}

/**
 * 10. Persegi Semua Sosmed (1:1)
 */
async function renderSquareSocialAll(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  options: StandDesignOptions,
  logos: {
    wa: HTMLImageElement | null;
    ig: HTMLImageElement | null;
    tt: HTMLImageElement | null;
    fb: HTMLImageElement | null;
  }
) {
  const { qrText, placeName, showPlaceName } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#104F38';
  ctx.fillRect(0, 0, width, 220 * scale);

  ctx.fillStyle = '#FFE600';
  ctx.font = `800 ${24 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TEMUKAN & HUBUNGI KAMI DI', width / 2, 80 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${56 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText('SOSIAL MEDIA RESMI', width / 2, 145 * scale);

  // 4 logos
  const logoY = 290 * scale;
  const logoItems = [
    { img: logos.wa, bg: '#25D366' },
    { img: logos.ig, bg: '#E1306C' },
    { img: logos.tt, bg: '#010101' },
    { img: logos.fb, bg: '#1877F2' }
  ];
  const startX = (width - 4 * 140 * scale) / 2 + 70 * scale;
  logoItems.forEach((item, idx) => {
    const cx = startX + idx * 140 * scale;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, logoY, 56 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = item.bg;
    ctx.lineWidth = 3.5 * scale;
    ctx.stroke();

    if (item.img) {
      const s = 80 * scale;
      ctx.drawImage(item.img, cx - s / 2, logoY - s / 2, s, s);
    }
    ctx.restore();
  });

  ctx.fillStyle = '#104F38';
  ctx.font = `800 ${36 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('WhatsApp • Instagram • TikTok • Facebook', width / 2, 420 * scale);

  if (showPlaceName && placeName) {
    ctx.font = `800 ${28 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#104F38';
    ctx.fillText(placeName, width / 2, 470 * scale);
  }

  const bottomCenterY = 820 * scale;
  drawNfcPhoneSection(ctx, {
    centerX: width * 0.28,
    centerY: bottomCenterY,
    scale,
    color: '#104F38',
    customLabel: 'TAP SOSIAL MEDIA'
  });

  await drawQrCodeSection(ctx, {
    centerX: width * 0.74,
    centerY: bottomCenterY,
    scale,
    qrText,
    borderColor: '#104F38',
    textColor: '#104F38',
    whitePadBackground: true,
    customLabel: 'SCAN QR SEMUA SOSMED',
    registrationCode: options.registrationCode
  });
}

/**
 * Main Entry Point: Renders any of the Stand templates onto an HTML5 canvas.
 */
export async function renderGoogleReviewStandToCanvas(
  canvas: HTMLCanvasElement,
  options: StandDesignOptions
): Promise<void> {
  const templateId = options.templateId || 'a6-blue-cutout';
  const isA6 = isA6Template(templateId) || options.formatSize === 'a6';

  // Automatically determine canvas aspect ratio based on format size
  const defaultDims = getStandDimensions(isA6 ? 'a6' : 'square', (options.width || 1200) > 1600);
  const width = options.width || defaultDims.width;
  const height = options.height || defaultDims.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = width / 1200;

  // Preload SVG logos based on template requirements
  let gLogoImg: HTMLImageElement | null = null;
  let waLogoImg: HTMLImageElement | null = null;
  let igLogoImg: HTMLImageElement | null = null;
  let ttLogoImg: HTMLImageElement | null = null;
  let fbLogoImg: HTMLImageElement | null = null;

  try {
    if (templateId.includes('whatsapp') || templateId.includes('social')) {
      waLogoImg = await loadSvgImage(WHATSAPP_SVG);
    }
    if (templateId.includes('instagram') || templateId.includes('social')) {
      igLogoImg = await loadSvgImage(INSTAGRAM_SVG);
    }
    if (templateId.includes('tiktok') || templateId.includes('social')) {
      ttLogoImg = await loadSvgImage(TIKTOK_SVG);
    }
    if (templateId.includes('facebook') || templateId.includes('social')) {
      fbLogoImg = await loadSvgImage(FACEBOOK_SVG);
    }
    if (!waLogoImg && !igLogoImg && !ttLogoImg && !fbLogoImg) {
      gLogoImg = await loadSvgImage(GOOGLE_G_SVG);
    }
  } catch (err) {
    console.warn('SVG preload warning:', err);
  }

  const socialLogos = { wa: waLogoImg, ig: igLogoImg, tt: ttLogoImg, fb: fbLogoImg };

  // Route to the appropriate template renderer
  switch (templateId) {
    // === WHATSAPP STAND TEMPLATES ===
    case 'a6-whatsapp':
      await renderA6WhatsApp(ctx, width, height, scale, options, waLogoImg);
      break;
    case 'square-whatsapp':
      await renderSquareWhatsApp(ctx, width, height, scale, options, waLogoImg);
      break;

    // === INSTAGRAM STAND TEMPLATES ===
    case 'a6-instagram':
      await renderA6Instagram(ctx, width, height, scale, options, igLogoImg);
      break;
    case 'square-instagram':
      await renderSquareInstagram(ctx, width, height, scale, options, igLogoImg);
      break;

    // === TIKTOK STAND TEMPLATES ===
    case 'a6-tiktok':
      await renderA6TikTok(ctx, width, height, scale, options, ttLogoImg);
      break;
    case 'square-tiktok':
      await renderSquareTikTok(ctx, width, height, scale, options, ttLogoImg);
      break;

    // === FACEBOOK STAND TEMPLATES ===
    case 'a6-facebook':
      await renderA6Facebook(ctx, width, height, scale, options, fbLogoImg);
      break;
    case 'square-facebook':
      await renderSquareFacebook(ctx, width, height, scale, options, fbLogoImg);
      break;

    // === ALL-IN-ONE MULTI-SOCIAL STAND TEMPLATES ===
    case 'a6-social-all':
      await renderA6SocialAll(ctx, width, height, scale, options, socialLogos);
      break;
    case 'square-social-all':
      await renderSquareSocialAll(ctx, width, height, scale, options, socialLogos);
      break;

    // === 4 A6 GOOGLE REVIEW TABLE STAND TEMPLATES ===
    case 'a6-blue-cutout':
      await renderA6BlueCutout(ctx, width, height, scale, options, gLogoImg);
      break;

    case 'a6-onyx-dark':
      await renderA6OnyxDark(ctx, width, height, scale, options, gLogoImg);
      break;

    case 'a6-blue-dome':
      await renderA6BlueDome(ctx, width, height, scale, options, gLogoImg);
      break;

    case 'a6-pinwheel':
      await renderA6Pinwheel(ctx, width, height, scale, options, gLogoImg);
      break;

    // === 5 SQUARE GOOGLE REVIEW 1:1 TEMPLATES ===
    case 'blue-arc':
      await renderBlueArc(ctx, width, height, scale, options, gLogoImg);
      break;

    case 'pinwheel-4color':
      await renderPinwheel4Color(ctx, width, height, scale, options, gLogoImg);
      break;

    case 'border-4color':
      await renderBorder4Color(ctx, width, height, scale, options, gLogoImg);
      break;

    case 'onyx-black':
      await renderOnyxBlack(ctx, width, height, scale, options, gLogoImg);
      break;

    case 'classic-blue':
    default:
      await renderClassicBlue(ctx, width, height, scale, options, gLogoImg);
      break;
  }

  // Render watermark for Trial 3 Hari
  if (options.watermark) {
    ctx.save();

    // 1. Diagonal Watermark across the entire stand card
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 5);
    ctx.font = `900 ${Math.round(42 * scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(225, 29, 72, 0.25)'; // translucent rose-600
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DINAMISQR • TRIAL 3 HARI', 0, -110 * scale);
    ctx.fillText('VERSI UJI COBA • WATERMARK AKTIF', 0, 0);
    ctx.fillText('UPGRADE KE PRO BULANAN / TAHUNAN', 0, 110 * scale);
    ctx.restore();

    // 2. High-visibility warning bar at the bottom
    const barHeight = Math.round(38 * scale);
    ctx.fillStyle = 'rgba(225, 29, 72, 0.95)';
    ctx.fillRect(0, height - barHeight, width, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(13 * scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      '⚠️ DESAIN TRIAL 3 HARI — Upgrade ke Paket Bulanan / Tahunan untuk Cetak Bersih Tanpa Watermark',
      width / 2,
      height - barHeight / 2
    );
  }
}

/**
 * Downloads the generated stand canvas as high-resolution PNG
 */
export function downloadStandCanvas(
  canvas: HTMLCanvasElement,
  filename: string = 'stand-google-review'
): void {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * Opens browser print dialog formatted for acrylic stand / table tent card sheet
 */
export function printStandSheet(
  canvas: HTMLCanvasElement,
  title: string = 'Stand Google Review Akrilik',
  formatSize: StandFormatSize = 'a6'
): void {
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const isA6 = formatSize === 'a6';
  const sizeLabel = isA6 ? 'Ukuran A6 (105 × 148 mm)' : 'Ukuran Persegi 1:1 (Kotak Akrilik)';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak ${title} - ${sizeLabel}</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; color: #000; margin: 0; padding: 10px; }
        .sheet { max-width: ${isA6 ? '460px' : '520px'}; margin: 0 auto; border: 2px dashed #94a3b8; padding: 16px; border-radius: 6px; }
        .guide-text { font-size: 12px; color: #475569; margin-bottom: 12px; font-weight: 500; }
        .stand-img { width: 100%; height: auto; display: block; margin: 0 auto; box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
        .cut-lines { border-top: 1px dashed #cbd5e1; margin-top: 14px; padding-top: 8px; font-size: 11px; color: #94a3b8; }
        @media print {
          .no-print { display: none; }
          .sheet { border: 1px dashed #cbd5e1; padding: 0; margin: 0 auto; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px;">
        <button onclick="window.print()" style="padding: 10px 24px; background: #0038CB; color: white; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 13px;">
          Cetak Stand Akrilik ${sizeLabel} (Ctrl + P)
        </button>
      </div>
      <div class="sheet">
        <p class="guide-text no-print">Potong mengikuti garis tepi putus-putus untuk diselipkan ke stand akrilik meja ${sizeLabel}.</p>
        <img class="stand-img" src="${dataUrl}" alt="${title}" />
        <div class="cut-lines">
          <span>Garis lipat / batas akrilik meja ${sizeLabel} · DinamisQR Tap to Review</span>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Opens browser print dialog formatted for multiple acrylic stand / table tent card sheets
 */
export function printMultipleStandSheets(
  stands: Array<{
    dataUrl: string;
    title: string;
    code: string;
  }>,
  formatSize: StandFormatSize = 'a6'
): void {
  if (!stands || stands.length === 0) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const isA6 = formatSize === 'a6';
  const sizeLabel = isA6 ? 'Ukuran A6 (105 × 148 mm)' : 'Ukuran Persegi 1:1';

  const itemsHtml = stands.map((item, idx) => `
    <div class="sheet">
      <div class="sheet-meta no-print">
        <span class="badge-code">${item.code}</span>
        <strong>${item.title}</strong>
        <span style="color: #64748b; font-size: 11px;">(Lembar ${idx + 1} dari ${stands.length})</span>
      </div>
      <p class="guide-text no-print">Potong garis tepi untuk diselipkan ke stand meja akrilik ${sizeLabel}.</p>
      <img class="stand-img" src="${item.dataUrl}" alt="${item.title}" />
      <div class="cut-lines">
        <span>Garis lipat / batas akrilik meja ${sizeLabel} · ${item.code} · DinamisQR</span>
      </div>
    </div>
  `).join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak ${stands.length} Stand Akrilik Meja - ${sizeLabel}</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; color: #000; margin: 0; padding: 10px; background: #f8fafc; }
        .toolbar { position: sticky; top: 0; background: #ffffff; padding: 12px 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; gap: 16px; z-index: 100; }
        .sheet { max-width: ${isA6 ? '460px' : '520px'}; margin: 0 auto 24px auto; background: #ffffff; border: 2px dashed #94a3b8; padding: 16px; border-radius: 6px; page-break-after: always; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
        .sheet:last-child { page-break-after: avoid; margin-bottom: 0; }
        .sheet-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
        .badge-code { background: #ffe600; color: #104f38; padding: 2px 8px; font-family: monospace; font-weight: 800; border: 1px solid rgba(16,79,56,0.3); }
        .guide-text { font-size: 11px; color: #64748b; margin: 0 0 10px 0; font-weight: 500; }
        .stand-img { width: 100%; height: auto; display: block; margin: 0 auto; }
        .cut-lines { border-top: 1px dashed #cbd5e1; margin-top: 12px; padding-top: 6px; font-size: 11px; color: #94a3b8; }
        @media print {
          body { background: #ffffff; padding: 0; }
          .no-print, .toolbar { display: none !important; }
          .sheet { border: 1px dashed #cbd5e1; padding: 0; margin: 0 auto; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar no-print">
        <button onclick="window.print()" style="padding: 10px 24px; background: #0038CB; color: white; border: none; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 14px; box-shadow: 0 2px 8px rgba(0,56,203,0.3);">
          🖨️ Cetak Semua ${stands.length} Stand Meja (Ctrl + P)
        </button>
        <span style="font-size: 13px; font-weight: 600; color: #334155;">
          ${stands.length} Stand Meja (${sizeLabel})
        </span>
      </div>
      ${itemsHtml}
    </body>
    </html>
  `);
  printWindow.document.close();
}
