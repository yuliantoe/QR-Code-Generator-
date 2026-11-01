import QRCode from 'qrcode';
import type { QRStyleConfig } from '../types.ts';

/**
 * Generates an SVG string of the QR code
 */
export async function generateQRSVG(text: string, style?: Partial<QRStyleConfig>): Promise<string> {
  const fg = style?.fgColor || '#0f172a';
  const bg = style?.bgColor || '#ffffff';

  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: fg,
      light: bg
    }
  });
}

/**
 * Renders the styled QR code with optional frames, rounded dots, and logos onto an HTML5 Canvas.
 */
export async function renderStyledQRToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  style: QRStyleConfig,
  size: number = 600
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const hasFrame = style.frameStyle && style.frameStyle !== 'none' && style.frameText;
  const frameHeight = hasFrame ? Math.round(size * 0.18) : 0;
  
  canvas.width = size;
  canvas.height = size + frameHeight;

  // Background
  ctx.fillStyle = style.bgColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generate QR data matrix using QRCode lib
  const qrData = QRCode.create(text, {
    errorCorrectionLevel: 'H'
  });

  const modules = qrData.modules;
  const moduleCount = modules.size;
  const margin = 2; // modules padding
  const totalGrid = moduleCount + margin * 2;
  const cellSize = size / totalGrid;
  const qrOffsetTop = style.frameStyle === 'top-banner' && hasFrame ? frameHeight : 0;

  ctx.fillStyle = style.fgColor || '#0f172a';

  // Draw modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.get(row, col)) {
        const x = (col + margin) * cellSize;
        const y = qrOffsetTop + (row + margin) * cellSize;

        // Check if inside finder patterns (corner 7x7 squares)
        const isFinder =
          (row < 7 && col < 7) ||
          (row < 7 && col >= moduleCount - 7) ||
          (row >= moduleCount - 7 && col < 7);

        if (isFinder) {
          // Render finder pattern with chosen corner style
          if (style.cornerStyle === 'rounded') {
            drawRoundedRect(ctx, x, y, cellSize, cellSize, cellSize * 0.25);
          } else if (style.cornerStyle === 'dot') {
            drawCircle(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * 0.45);
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        } else {
          // Inner modules
          if (style.dotStyle === 'dots') {
            drawCircle(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * 0.45);
          } else if (style.dotStyle === 'rounded') {
            drawRoundedRect(ctx, x, y, cellSize, cellSize, cellSize * 0.35);
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }
  }

  // Draw Logo if specified
  if (style.logoType && style.logoType !== 'none') {
    const logoSize = size * 0.22;
    const logoX = (size - logoSize) / 2;
    const logoY = qrOffsetTop + (size - logoSize) / 2;

    // Draw circular white background pad for logo
    ctx.save();
    ctx.fillStyle = style.bgColor || '#ffffff';
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = style.fgColor || '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Render preset icon or custom image
    if (style.logoType === 'custom' && style.logo) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = style.logo!;
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch (e) {
        console.warn('Failed to load custom logo:', e);
      }
    } else if (style.logoType === 'preset' && style.logo) {
      drawPresetIcon(ctx, style.logo, logoX, logoY, logoSize, style.fgColor);
    }
  }

  // Draw Frame / Banner if enabled
  if (hasFrame) {
    const bannerColor = style.frameColor || style.fgColor || '#0f172a';
    const textColor = style.frameTextColor || '#ffffff';
    const textStr = (style.frameText || 'PINDAI SAYA').toUpperCase();

    if (style.frameStyle === 'bottom-banner') {
      const bannerY = size;
      ctx.fillStyle = bannerColor;
      ctx.fillRect(0, bannerY, size, frameHeight);

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(frameHeight * 0.38)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textStr, size / 2, bannerY + frameHeight / 2);
    } else if (style.frameStyle === 'top-banner') {
      ctx.fillStyle = bannerColor;
      ctx.fillRect(0, 0, size, frameHeight);

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(frameHeight * 0.38)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textStr, size / 2, frameHeight / 2);
    } else if (style.frameStyle === 'border-card') {
      ctx.strokeStyle = bannerColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

      const bannerY = size;
      ctx.fillStyle = bannerColor;
      ctx.fillRect(0, bannerY, size, frameHeight);

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(frameHeight * 0.36)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textStr, size / 2, bannerY + frameHeight / 2);
    }
  }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundedRect(
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
  ctx.fill();
}

function drawPresetIcon(
  ctx: CanvasRenderingContext2D,
  preset: string,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = x + size / 2;
  const cy = y + size / 2;
  const iconFontSize = Math.round(size * 0.5);

  let symbol = '🔗';
  if (preset === 'whatsapp') symbol = '💬';
  else if (preset === 'instagram') symbol = '📷';
  else if (preset === 'menu') symbol = '🍽️';
  else if (preset === 'wifi') symbol = '📶';
  else if (preset === 'web') symbol = '🌐';
  else if (preset === 'cart') symbol = '🛒';
  else if (preset === 'map') symbol = '📍';

  ctx.font = `${iconFontSize}px sans-serif`;
  ctx.fillText(symbol, cx, cy);
  ctx.restore();
}

/**
 * Download a canvas as a PNG with custom pixel resolution
 */
export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * Triggers standard browser print layout for physical display (table tent card or flyer)
 */
export function printFlyerSheet(
  qrCanvas: HTMLCanvasElement,
  title: string,
  slug: string,
  targetUrl: string
): void {
  const dataUrl = qrCanvas.toDataURL('image/png');
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak QR Code - ${title}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; color: #0f172a; margin: 0; padding: 20px; }
        .sheet { max-width: 500px; margin: 0 auto; border: 2px dashed #cbd5e1; padding: 40px 30px; border-radius: 16px; }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 10px; color: #0f172a; }
        p.desc { font-size: 14px; color: #64748b; margin: 0 0 24px; }
        .qr-wrap { display: inline-block; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .qr-wrap img { width: 320px; height: auto; display: block; }
        .footer-info { margin-top: 24px; font-size: 12px; color: #94a3b8; }
        .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        @media print {
          .no-print { display: none; }
          .sheet { border: 2px solid #000000; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 24px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cetak Sekarang (Ctrl + P)</button>
      </div>
      <div class="sheet">
        <span class="badge">QR Code Dinamis - Siap Cetak</span>
        <h1>${title}</h1>
        <p class="desc">Arahkan kamera smartphone Anda ke kode di bawah untuk mengakses tautan terkini.</p>
        <div class="qr-wrap">
          <img src="${dataUrl}" alt="${title}" />
        </div>
        <div class="footer-info">
          <p>Tautan Fisik Permanen: <strong>/r/${slug}</strong></p>
          <p>Tautan tujuan saat ini dapat diperbarui kapan saja tanpa mencetak ulang lembar ini.</p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}
