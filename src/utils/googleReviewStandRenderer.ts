import QRCode from 'qrcode';

export type StandFormatSize = 'a6' | 'square';

export type StandTemplateId =
  // 4 DESAIN KHUSUS STAND MEJA UKURAN A6 (105 x 148 mm)
  | 'a6-blue-cutout'    // 1_24661c48.png: A6 Lengkung Biru (Header Arch Cutout)
  | 'a6-onyx-dark'      // 4_a9355167.png: A6 Onyx Hitam Elegan (Dark Edition)
  | 'a6-blue-dome'      // 2_f3802f03.png: A6 Kubah Biru Google (Dome Curve)
  | 'a6-pinwheel'       // 3_84ea9530.png: A6 4-Warna Kuadran Google (Quadrant Color)
  // 5 DESAIN UNIVERSAL / KOTAK PERSEGI (1:1)
  | 'classic-blue'      // 2_c63faeab.png: Biru Klasik Meja
  | 'blue-arc'          // 3_d5f74b44.png: Lengkung Biru Modern
  | 'pinwheel-4color'   // 4_e087ce46.png: 4 Warna Geometris
  | 'border-4color'     // 5_b6857285.png: Bingkai 4 Warna Google
  | 'onyx-black';       // 1_f8254b9d.png: Onyx Dark Minimalis

export interface StandTemplateMeta {
  id: StandTemplateId;
  name: string;
  badge: string;
  formatSize: StandFormatSize;
  description: string;
  previewColors: string[];
  isDark?: boolean;
}

export const STAND_TEMPLATES: StandTemplateMeta[] = [
  // 4 A6 TABLE STAND DESIGNS (Matching uploaded images 1, 4, 2, 3)
  {
    id: 'a6-blue-cutout',
    name: '1. A6 Lengkung Biru (Resmi)',
    badge: 'A6 Stand Meja',
    formatSize: 'a6',
    description: 'Format A6 (105x148mm) dengan header biru royal, cutout lengkung putih untuk logo Google G, dan 5 bintang emas.',
    previewColors: ['#0038CB', '#FFFFFF', '#FBBC05']
  },
  {
    id: 'a6-onyx-dark',
    name: '2. A6 Onyx Hitam Elegan',
    badge: 'A6 Dark Edition',
    formatSize: 'a6',
    description: 'Format A6 latar hitam pekat premium, logo Google G berpadu 5 bintang putih solid dan tipografi kontras mewah.',
    previewColors: ['#000000', '#FFFFFF', '#4285F4'],
    isDark: true
  },
  {
    id: 'a6-blue-dome',
    name: '3. A6 Kubah Biru Google',
    badge: 'A6 Populer',
    formatSize: 'a6',
    description: 'Format A6 dengan kubah lengkung biru modern di atas, logo Google G menonjol dan teks warna-warni resmi.',
    previewColors: ['#0038CB', '#FFFFFF', '#FBBC05', '#EA4335']
  },
  {
    id: 'a6-pinwheel',
    name: '4. A6 4-Warna Kuadran Google',
    badge: 'A6 Penuh Warna',
    formatSize: 'a6',
    description: 'Format A6 4 kuadran diagonal warna khas Google (Merah, Biru, Hijau, Kuning) dengan 5 bintang hitam tegas.',
    previewColors: ['#EA4335', '#4285F4', '#34A853', '#FBBC05']
  },

  // 5 SQUARE 1:1 STAND DESIGNS
  {
    id: 'classic-blue',
    name: '5. Persegi: Biru Klasik Meja',
    badge: 'Kotak 1:1',
    formatSize: 'square',
    description: 'Format kotak 1:1 dengan header biru horizontal dan tata letak seimbang.',
    previewColors: ['#0038CB', '#FFFFFF', '#F9BC06']
  },
  {
    id: 'blue-arc',
    name: '6. Persegi: Lengkung Biru Modern',
    badge: 'Kotak 1:1',
    formatSize: 'square',
    description: 'Format kotak 1:1 kubah lengkung biru modern dengan lencana lingkaran Google dan teks warna-warni.',
    previewColors: ['#074BB3', '#FFFFFF', '#4285F4', '#EA4335']
  },
  {
    id: 'pinwheel-4color',
    name: '7. Persegi: Geometris 4 Warna',
    badge: 'Kotak 1:1',
    formatSize: 'square',
    description: 'Format kotak 1:1 4 kuadran segitiga Google dengan sudut melengkung dan bintang putih.',
    previewColors: ['#EA4335', '#4285F4', '#34A853', '#FBBC05']
  },
  {
    id: 'border-4color',
    name: '8. Persegi: Bingkai 4 Warna',
    badge: 'Kotak 1:1',
    formatSize: 'square',
    description: 'Format kotak 1:1 bingkai tebal 4 warna khas Google dengan latar putih minimalis.',
    previewColors: ['#FFFFFF', '#EA4335', '#4285F4', '#34A853']
  },
  {
    id: 'onyx-black',
    name: '9. Persegi: Onyx Dark Minimalis',
    badge: 'Kotak 1:1',
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
    templateId === 'a6-pinwheel'
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
  width?: number;
  height?: number;
  showPlaceName?: boolean;
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

  // Label under phone
  ctx.fillStyle = color;
  ctx.font = `800 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(customLabel, centerX, phoneY + phoneHeight + 66 * scale);
  ctx.restore();
}

/**
 * Draws the QR Code square container + rendered QR image + "SCAN QR UNTUK REVIEW" label
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
    customLabel = 'SCAN QR UNTUK REVIEW'
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

  // Label under QR Code box
  ctx.fillStyle = textColor;
  ctx.font = `800 ${26 * scale}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(customLabel, centerX, qrBoxY + qrBoxSize + 66 * scale);
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
    whitePadBackground: true
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
    whitePadBackground: true
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
    whitePadBackground: true
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
    whitePadBackground: true
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
    whitePadBackground: true
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
    whitePadBackground: true
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
    whitePadBackground: true
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
    whitePadBackground: true
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
    whitePadBackground: true
  });
}

/**
 * Main Entry Point: Renders any of the 9 Google Review Stand templates onto an HTML5 canvas.
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

  // Preload SVG logo once
  let gLogoImg: HTMLImageElement | null = null;
  try {
    gLogoImg = await loadSvgImage(GOOGLE_G_SVG);
  } catch (err) {
    console.warn('Failed to load Google G SVG:', err);
  }

  // Route to the appropriate template renderer
  switch (templateId) {
    // 4 A6 Table Stand Templates
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

    // 5 Square 1:1 Templates
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
