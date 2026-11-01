import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { DynamicQRCode, ScanRecord, QRAnalyticsSummary } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = path.resolve(__dirname, 'data');
const QR_FILE = path.resolve(DATA_DIR, 'qrcodes.json');
const SCANS_FILE = path.resolve(DATA_DIR, 'scans.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic seed data for Indonesian context
const initialQRCodes: DynamicQRCode[] = [
  {
    id: 'qr-menu-resto',
    code: 'QR-001',
    slug: 'menu-resto',
    title: 'Daftar Menu Restoran & Kafe (Meja Akrilik 01-25)',
    targetUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    tags: ['Restoran', 'Meja Cetak', 'Buku Menu'],
    notes: 'Dicetak di 25 stand akrilik meja. Saat pergantian musim atau promo baru, cukup ganti link tujuan di sini tanpa ganti akrilik.',
    totalScans: 842,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    urlHistory: [
      {
        url: 'https://example.com/menu-grand-opening-2026.pdf',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        reason: 'Menu Awal Grand Opening'
      },
      {
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        reason: 'Pembaruan Menu Baru Spesial Chef'
      }
    ],
    style: {
      fgColor: '#1e293b',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI UNTUK DAFTAR MENU',
      frameColor: '#0f172a',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'menu'
    },
    utm: {
      source: 'qr_meja_fisik',
      medium: 'offline_print',
      campaign: 'menu_pelanggan'
    }
  },
  {
    id: 'qr-kemasan-kopi',
    code: 'QR-002',
    slug: 'kopi-speciality',
    title: 'Stiker Kemasan Kopi Robusta 250gr (5.000 Pcs Cetak)',
    targetUrl: 'https://shopee.co.id',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    tags: ['Packaging', 'Stiker Cetak', 'Shopee'],
    notes: 'Stiker fisik sudah dicetak 5.000 pouch aluminium. Link tujuan diarahkan ke promo Shopee bulan ini.',
    totalScans: 1394,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    urlHistory: [
      {
        url: 'https://tokopedia.com',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        reason: 'Peluncuran batch 1'
      },
      {
        url: 'https://shopee.co.id',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        reason: 'Dialihkan ke Toko Shopee Flash Sale'
      }
    ],
    style: {
      fgColor: '#78350f',
      bgColor: '#fffbeb',
      dotStyle: 'dots',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'KLAIM PROMO PRODUK',
      frameColor: '#78350f',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'web'
    }
  },
  {
    id: 'qr-kartu-nama',
    code: 'QR-003',
    slug: 'budi-kartunama',
    title: 'Kartu Nama Bisnis CEO (Cetak Kartu PVC Eksklusif)',
    targetUrl: 'https://linkedin.com',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    tags: ['Kartu Nama', 'Networking', 'PVC Card'],
    notes: 'Dicetak di kartu nama fisik PVC. Bisa diubah ke portofolio, WhatsApp bisnis, atau LinkedIn kapan saja.',
    totalScans: 168,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    urlHistory: [
      {
        url: 'https://linkedin.com',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        reason: 'Profil awal'
      }
    ],
    style: {
      fgColor: '#09090b',
      bgColor: '#ffffff',
      dotStyle: 'square',
      cornerStyle: 'square',
      frameStyle: 'none',
      frameColor: '#09090b',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  }
];

function loadQRCodes(): DynamicQRCode[] {
  try {
    if (fs.existsSync(QR_FILE)) {
      const content = fs.readFileSync(QR_FILE, 'utf-8');
      const items: DynamicQRCode[] = JSON.parse(content);
      let modified = false;
      items.forEach((item, idx) => {
        if (!item.code) {
          item.code = `QR-${(idx + 1).toString().padStart(3, '0')}`;
          modified = true;
        }
      });
      if (modified) {
        saveQRCodes(items);
      }
      return items;
    }
  } catch (err) {
    console.error('Failed to read qrcodes.json:', err);
  }
  saveQRCodes(initialQRCodes);
  return initialQRCodes;
}

function saveQRCodes(items: DynamicQRCode[]): void {
  try {
    fs.writeFileSync(QR_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save qrcodes.json:', err);
  }
}

function loadScans(): ScanRecord[] {
  try {
    if (fs.existsSync(SCANS_FILE)) {
      const content = fs.readFileSync(SCANS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read scans.json:', err);
  }
  return [];
}

function saveScans(scans: ScanRecord[]): void {
  try {
    // Keep last 2,000 scans
    const trimmed = scans.slice(-2000);
    fs.writeFileSync(SCANS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save scans.json:', err);
  }
}

const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const defaultUsers = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Administrator'
  }
];

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read users.json:', err);
  }
  saveUsers(defaultUsers);
  return defaultUsers;
}

function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save users.json:', err);
  }
}

const NFC_FILE = path.resolve(DATA_DIR, 'nfc_tags.json');
const initialNFCTags: any[] = [
  {
    id: 'nfc-senopati',
    tagUid: '04:3A:82:1F:B4:71:80',
    placeName: 'Kopi Kenangan Senopati',
    googleReviewUrl: 'https://maps.app.goo.gl/kopi-kenangan-review',
    pin: '1234',
    status: 'active',
    totalTaps: 428,
    lastTappedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    notes: 'Akrilik stand NFC di meja kasir utama',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'nfc-bukris',
    tagUid: '04:6B:91:2E:C5:82:80',
    placeName: 'Warung Bu Kris Fatmawati',
    googleReviewUrl: 'https://maps.app.goo.gl/warung-bukris-review',
    pin: '8888',
    status: 'active',
    totalTaps: 892,
    lastTappedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    notes: 'Kartu tap NFC Google Review di kasir & resepsionis',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  }
];

function loadNFCTags(): any[] {
  try {
    if (fs.existsSync(NFC_FILE)) {
      const content = fs.readFileSync(NFC_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read nfc_tags.json:', err);
  }
  saveNFCTags(initialNFCTags);
  return initialNFCTags;
}

function saveNFCTags(tags: any[]) {
  try {
    fs.writeFileSync(NFC_FILE, JSON.stringify(tags, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save nfc_tags.json:', err);
  }
}

function parseUserAgent(uaString: string | undefined): { device: 'mobile' | 'desktop' | 'tablet' | 'unknown'; os: string; browser: string } {
  const ua = uaString || '';
  let device: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'desktop';
  let os = 'Unknown OS';
  let browser = 'Browser';

  if (/ipad|tablet/i.test(ua)) {
    device = 'tablet';
  } else if (/mobile|iphone|android/i.test(ua)) {
    device = 'mobile';
  }

  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/linux/i.test(ua)) os = 'Linux';

  if (/chrome|crios/i.test(ua) && !/edge|edg|opr/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  return { device, os, browser };
}

// ==========================================
// DYNAMIC REDIRECT HANDLER: GET /r/:slug
// This is what physical printed QR codes point to!
// ==========================================
app.get('/r/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const qrcodes = loadQRCodes();
  const qr = qrcodes.find(item => item.slug.toLowerCase() === slug.toLowerCase() || item.id === slug);

  if (!qr) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>QR Code Tidak Ditemukan</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 440px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 28px; text-align: center; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 700; margin: 0 0 10px; color: #0f172a; }
          p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }
          .code { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; }
          a { display: inline-block; background: #0f172a; color: white; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔍</div>
          <h1>QR Code Tidak Ditemukan</h1>
          <p>Tautan dengan kode <span class="code">${slug}</span> tidak terdaftar atau telah dinonaktifkan oleh pemilik.</p>
          <a href="/">Buka Dashboard Generator</a>
        </div>
      </body>
      </html>
    `);
  }

  // Check if paused
  if (qr.status === 'paused') {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Tautan Sedang Dijeda</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 440px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 28px; text-align: center; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 700; margin: 0 0 10px; color: #0f172a; }
          p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px; }
          .title { font-weight: 600; color: #334155; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⏸️</div>
          <h1>Tautan Sedang Dijeda</h1>
          <p><span class="title">${qr.title}</span> sedang dijeda sementara oleh pemiliknya untuk pembaruan. Silakan coba kembali nanti.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Check expiry
  if (qr.expiryDate && new Date(qr.expiryDate).getTime() < Date.now()) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Tautan Kedaluwarsa</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 440px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 28px; text-align: center; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 700; margin: 0 0 10px; color: #0f172a; }
          p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⏳</div>
          <h1>Masa Berlaku Telah Berakhir</h1>
          <p>QR code ini telah melewati batas waktu kedaluwarsa yang ditentukan.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Check password protection
  if (qr.password && req.query.p !== qr.password) {
    const errorMsg = req.query.p !== undefined ? 'Kata sandi tidak tepat. Silakan coba lagi.' : '';
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Akses Dilindungi Kata Sandi</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 400px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 24px; text-align: center; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
          .icon { font-size: 40px; margin-bottom: 12px; }
          h1 { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: #0f172a; }
          p { font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
          input { width: 100%; padding: 12px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; outline: none; }
          input:focus { border-color: #0284c7; ring: 2px solid #bae6fd; }
          button { width: 100%; background: #0f172a; color: white; padding: 12px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
          button:hover { background: #1e293b; }
          .error { color: #dc2626; font-size: 12px; margin-bottom: 12px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔒</div>
          <h1>Tautan Terproteksi</h1>
          <p>Masukkan kata sandi untuk mengakses tujuan tautan dari <strong>${qr.title}</strong></p>
          ${errorMsg ? `<div class="error">${errorMsg}</div>` : ''}
          <form method="GET" action="/r/${qr.slug}">
            <input type="password" name="p" placeholder="Masukkan kata sandi..." required autofocus />
            <button type="submit">Buka Tautan</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }

  // Record scan analytics
  const ua = req.headers['user-agent'];
  const { device, os, browser } = parseUserAgent(ua);
  const referer = (req.headers['referer'] || req.headers['referrer'] || 'Direct / Scan Fisik') as string;

  const nowIso = new Date().toISOString();
  qr.totalScans = (qr.totalScans || 0) + 1;
  qr.lastScannedAt = nowIso;
  saveQRCodes(qrcodes);

  const scans = loadScans();
  const scanRecord: ScanRecord = {
    id: 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    qrId: qr.id,
    timestamp: nowIso,
    device,
    os,
    browser,
    referer: referer.length > 100 ? referer.substring(0, 100) + '...' : referer
  };
  scans.push(scanRecord);
  saveScans(scans);

  // Construct final redirect URL with UTM if present
  let destinationUrl = qr.targetUrl;
  if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
    destinationUrl = 'https://' + destinationUrl;
  }

  if (qr.utm && (qr.utm.source || qr.utm.medium || qr.utm.campaign)) {
    try {
      const urlObj = new URL(destinationUrl);
      if (qr.utm.source) urlObj.searchParams.set('utm_source', qr.utm.source);
      if (qr.utm.medium) urlObj.searchParams.set('utm_medium', qr.utm.medium);
      if (qr.utm.campaign) urlObj.searchParams.set('utm_campaign', qr.utm.campaign);
      destinationUrl = urlObj.toString();
    } catch {
      // Keep destinationUrl as is if invalid URL structure
    }
  }

  // Send no-cache headers so browsers and QR scanner apps always perform fresh redirect
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  return res.redirect(302, destinationUrl);
});

// ==========================================
// DYNAMIC NFC REDIRECT HANDLER: GET /nfc/:id
// Physical NFC chips are programmed with this URL!
// ==========================================
app.get(['/nfc/:id', '/n/:id'], (req: Request, res: Response) => {
  const { id } = req.params;
  const tags = loadNFCTags();
  const tag = tags.find((t: any) => t.id === id || t.tagUid === id || t.id.toLowerCase() === id.toLowerCase());

  if (!tag) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>NFC Tag Belum Terdaftar</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 440px; width: 100%; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px 28px; text-align: center; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 800; margin: 0 0 10px; color: #0f172a; }
          p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }
          a { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🏷️</div>
          <h1>NFC Tag Belum Terdaftar</h1>
          <p>Tag NFC ini belum diaktivasi untuk Google Review toko.</p>
          <a href="/">Buka Dashboard DinamisQR</a>
        </div>
      </body>
      </html>
    `);
  }

  if (tag.status === 'locked') {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Tag NFC Dikunci</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 440px; width: 100%; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px 28px; text-align: center; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 800; margin: 0 0 10px; color: #0f172a; }
          p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔒</div>
          <h1>Tag NFC Sedang Dikunci</h1>
          <p>Tag untuk <strong>${tag.placeName}</strong> dinonaktifkan sementara oleh pemilik.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Increment total taps
  tag.totalTaps = (tag.totalTaps || 0) + 1;
  tag.lastTappedAt = new Date().toISOString();
  saveNFCTags(tags);

  let target = tag.googleReviewUrl.trim();
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = 'https://' + target;
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  return res.redirect(302, target);
});

// ==========================================
// REST API ROUTES
// ==========================================

// Authentication: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
  }

  const users = loadUsers();
  const user = users.find(
    (u: any) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: 'Username atau password salah. Silakan coba lagi.' });
  }

  const token = 'auth_' + Buffer.from(`${user.username}:${Date.now()}:${Math.random()}`).toString('base64');
  return res.json({
    success: true,
    token,
    user: {
      username: user.username,
      name: user.name || 'Administrator'
    }
  });
});

// Authentication: Current User
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Sesi belum terautentikasi' });
  }

  const token = authHeader.substring(7);
  if (!token.startsWith('auth_')) {
    return res.status(401).json({ success: false, error: 'Token sesi tidak valid' });
  }

  const users = loadUsers();
  const defaultAdmin = users[0] || { username: 'admin', name: 'Administrator' };
  return res.json({
    success: true,
    user: {
      username: defaultAdmin.username,
      name: defaultAdmin.name
    }
  });
});

// Authentication: Logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Berhasil keluar' });
});

// ==========================================
// NFC TAGS REST API ROUTES
// ==========================================

// List all NFC tags
app.get('/api/nfc', (_req: Request, res: Response) => {
  const tags = loadNFCTags();
  res.json({ success: true, data: tags });
});

// Auto-resolve Google Review URL from place name
app.get('/api/nfc/lookup-place', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ success: true, query: '', autoUrl: '', suggestions: [] });
  }

  const encodedQuery = encodeURIComponent(query);
  const autoUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  try {
    const fetchRes = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&hl=id&gl=id&q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (fetchRes.ok) {
      const data: any = await fetchRes.json();
      const rawSuggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
      const suggestions = rawSuggestions.slice(0, 6).map((item: string) => ({
        placeName: item,
        reviewUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item)}`
      }));

      return res.json({
        success: true,
        query,
        autoUrl,
        suggestions
      });
    }
  } catch (err) {
    console.warn('Place lookup fallback:', err);
  }

  return res.json({
    success: true,
    query,
    autoUrl,
    suggestions: [
      {
        placeName: query,
        reviewUrl: autoUrl
      }
    ]
  });
});

// Activate or input new NFC tag
app.post('/api/nfc/activate', (req: Request, res: Response) => {
  const { placeName, googleReviewUrl, pin, tagUid, notes } = req.body;

  if (!placeName || !googleReviewUrl || !pin) {
    return res.status(400).json({
      success: false,
      error: 'Nama tempat, link Google Review, dan PIN NFC tag wajib diisi'
    });
  }

  const tags = loadNFCTags();
  const now = new Date().toISOString();

  let cleanId = 'nfc-' + placeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 18);

  if (!cleanId || cleanId === 'nfc-') {
    cleanId = 'nfc-' + Math.random().toString(36).substring(2, 7);
  }

  let finalId = cleanId;
  let counter = 1;
  while (tags.some((t: any) => t.id === finalId)) {
    finalId = `${cleanId}-${counter}`;
    counter++;
  }

  const autoUid = tagUid || [
    '04',
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    '80'
  ].join(':');

  const newTag = {
    id: finalId,
    tagUid: autoUid,
    placeName: placeName.trim(),
    googleReviewUrl: googleReviewUrl.trim(),
    pin: String(pin).trim(),
    status: 'active',
    totalTaps: 0,
    lastTappedAt: null,
    notes: notes?.trim() || 'Aktivasi NFC Google Review Stand',
    createdAt: now,
    updatedAt: now
  };

  tags.unshift(newTag);
  saveNFCTags(tags);

  res.status(201).json({
    success: true,
    data: newTag,
    redirectUrl: `/nfc/${newTag.id}`,
    message: `Tag NFC untuk "${newTag.placeName}" berhasil diaktivasi!`
  });
});

// Update NFC tag (requires PIN verification)
app.put('/api/nfc/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { placeName, googleReviewUrl, pin, newPin, status, notes } = req.body;

  const tags = loadNFCTags();
  const index = tags.findIndex((t: any) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
  }

  const tag = tags[index];

  // Verify PIN
  if (pin && String(pin).trim() !== String(tag.pin).trim()) {
    return res.status(403).json({
      success: false,
      error: 'PIN NFC Tag tidak sesuai! Masukkan PIN yang tepat.'
    });
  }

  if (placeName !== undefined) tag.placeName = placeName.trim();
  if (googleReviewUrl !== undefined) tag.googleReviewUrl = googleReviewUrl.trim();
  if (newPin !== undefined && newPin.trim()) tag.pin = String(newPin).trim();
  if (status !== undefined) tag.status = status;
  if (notes !== undefined) tag.notes = notes;
  tag.updatedAt = new Date().toISOString();

  tags[index] = tag;
  saveNFCTags(tags);

  res.json({
    success: true,
    data: tag,
    message: 'Data NFC Tag berhasil diperbarui!'
  });
});

// Delete NFC tag (with PIN verification)
app.delete('/api/nfc/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { pin } = req.body;
  let tags = loadNFCTags();
  const tag = tags.find((t: any) => t.id === id);

  if (!tag) {
    return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
  }

  if (pin && String(pin).trim() !== String(tag.pin).trim()) {
    return res.status(403).json({ success: false, error: 'PIN NFC Tag salah.' });
  }

  tags = tags.filter((t: any) => t.id !== id);
  saveNFCTags(tags);

  res.json({ success: true, message: 'Tag NFC berhasil dihapus' });
});

// Test tap simulation
app.post('/api/nfc/:id/test-tap', (req: Request, res: Response) => {
  const { id } = req.params;
  const tags = loadNFCTags();
  const tag = tags.find((t: any) => t.id === id);

  if (!tag) {
    return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
  }

  tag.totalTaps = (tag.totalTaps || 0) + 1;
  tag.lastTappedAt = new Date().toISOString();
  saveNFCTags(tags);

  res.json({
    success: true,
    message: `Simulasi tap NFC pada "${tag.placeName}" berhasil!`,
    totalTaps: tag.totalTaps,
    targetUrl: tag.googleReviewUrl
  });
});


// Batch create QR codes (5, 10, or 15 at once)
app.post('/api/qrcodes/batch', (req: Request, res: Response) => {
  const { baseTitle, baseTargetUrl, count = 5, style, baseSlug, notes } = req.body;

  if (!baseTitle || !baseTargetUrl) {
    return res.status(400).json({ success: false, error: 'Nama dasar dan tautan tujuan wajib diisi' });
  }

  const batchCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);
  const qrcodes = loadQRCodes();
  const now = new Date().toISOString();

  let cleanBase = (baseSlug || baseTitle)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!cleanBase || cleanBase.length < 2) {
    cleanBase = 'qr-batch';
  }

  const createdItems: DynamicQRCode[] = [];

  for (let i = 1; i <= batchCount; i++) {
    const pad = i.toString().padStart(2, '0');
    const itemTitle = `${baseTitle.trim()} #${pad}`;

    // Unique slug
    let itemSlug = `${cleanBase}-${pad}`;
    let counter = 1;
    while (
      qrcodes.some(item => item.slug.toLowerCase() === itemSlug.toLowerCase()) ||
      createdItems.some(item => item.slug.toLowerCase() === itemSlug.toLowerCase())
    ) {
      itemSlug = `${cleanBase}-${pad}-${counter}`;
      counter++;
    }

    const autoCode = `QR-${(qrcodes.length + i).toString().padStart(3, '0')}`;
    const newQR: DynamicQRCode = {
      id: 'qr-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6),
      code: autoCode,
      slug: itemSlug,
      title: itemTitle,
      targetUrl: baseTargetUrl.trim(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: [],
      notes: notes || `Dibuat serentak dalam batch (${batchCount} item)`,
      totalScans: 0,
      lastScannedAt: null,
      urlHistory: [
        {
          url: baseTargetUrl.trim(),
          changedAt: now,
          reason: 'Tautan Awal Dibuat (Batch)'
        }
      ],
      style: style ? {
        ...style,
        frameText: style.frameText ? `${style.frameText} #${pad}` : undefined
      } : {
        fgColor: '#0f172a',
        bgColor: '#ffffff',
        dotStyle: 'rounded',
        cornerStyle: 'rounded',
        frameStyle: 'bottom-banner',
        frameText: `PINDAI #${pad}`,
        frameColor: '#0f172a',
        frameTextColor: '#ffffff',
        logoType: 'none'
      }
    };

    createdItems.push(newQR);
  }

  qrcodes.unshift(...createdItems);
  saveQRCodes(qrcodes);

  res.status(201).json({
    success: true,
    count: createdItems.length,
    data: createdItems,
    message: `Berhasil membuat ${createdItems.length} QR Code dinamis sekaligus!`
  });
});

// List all QR codes
app.get('/api/qrcodes', (req: Request, res: Response) => {
  const qrcodes = loadQRCodes();
  res.json({ success: true, data: qrcodes });
});

// Get single QR code
app.get('/api/qrcodes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const qrcodes = loadQRCodes();
  const qr = qrcodes.find(item => item.id === id || item.slug === id);
  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not found' });
  }
  res.json({ success: true, data: qr });
});

// Create new dynamic QR code
app.post('/api/qrcodes', (req: Request, res: Response) => {
  const { title, targetUrl, slug, code, tags, notes, style, password, expiryDate, utm } = req.body;

  if (!title || !targetUrl) {
    return res.status(400).json({ success: false, error: 'Judul dan URL tujuan wajib diisi' });
  }

  const qrcodes = loadQRCodes();
  const autoCode = code?.trim() || `QR-${(qrcodes.length + 1).toString().padStart(3, '0')}`;

  // Create clean unique slug
  let generatedSlug = (slug || autoCode || title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!generatedSlug || generatedSlug.length < 3) {
    generatedSlug = autoCode.toLowerCase();
  }

  // Ensure slug uniqueness
  let finalSlug = generatedSlug;
  let counter = 1;
  while (qrcodes.some(item => item.slug.toLowerCase() === finalSlug.toLowerCase())) {
    finalSlug = `${generatedSlug}-${counter}`;
    counter++;
  }

  const now = new Date().toISOString();
  const newQR: DynamicQRCode = {
    id: 'qr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    code: autoCode,
    slug: finalSlug,
    title: title.trim(),
    targetUrl: targetUrl.trim(),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    tags: Array.isArray(tags) ? tags : [],
    notes: notes || '',
    totalScans: 0,
    lastScannedAt: null,
    urlHistory: [
      {
        url: targetUrl.trim(),
        changedAt: now,
        reason: 'Tautan Awal Dibuat'
      }
    ],
    style: style || {
      fgColor: '#0f172a',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI SAYA',
      frameColor: '#0f172a',
      frameTextColor: '#ffffff',
      logoType: 'none'
    },
    password: password || undefined,
    expiryDate: expiryDate || undefined,
    utm: utm || undefined
  };

  qrcodes.unshift(newQR);
  saveQRCodes(qrcodes);

  res.status(201).json({ success: true, data: newQR });
});

// Update dynamic QR code (The core feature: update target URL!)
app.put('/api/qrcodes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, targetUrl, status, tags, notes, style, password, expiryDate, utm, reason } = req.body;

  const qrcodes = loadQRCodes();
  const index = qrcodes.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
  }

  const current = qrcodes[index];
  const now = new Date().toISOString();
  let urlChanged = false;

  if (targetUrl && targetUrl.trim() !== current.targetUrl) {
    urlChanged = true;
    current.urlHistory.unshift({
      url: targetUrl.trim(),
      changedAt: now,
      reason: reason || 'Pembaruan tautan tujuan'
    });
    current.targetUrl = targetUrl.trim();
  }

  if (title !== undefined) current.title = title.trim();
  if (status !== undefined) current.status = status;
  if (tags !== undefined) current.tags = Array.isArray(tags) ? tags : [];
  if (notes !== undefined) current.notes = notes;
  if (style !== undefined) current.style = style;
  if (password !== undefined) current.password = password ? password.trim() : undefined;
  if (expiryDate !== undefined) current.expiryDate = expiryDate || undefined;
  if (utm !== undefined) current.utm = utm;
  current.updatedAt = now;

  qrcodes[index] = current;
  saveQRCodes(qrcodes);

  res.json({
    success: true,
    data: current,
    message: urlChanged
      ? 'Tautan tujuan berhasil diperbarui! QR code fisik yang dicetak akan langsung mengarah ke tautan baru.'
      : 'Pengaturan QR code berhasil diperbarui.'
  });
});

// Delete QR code
app.delete('/api/qrcodes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let qrcodes = loadQRCodes();
  const exists = qrcodes.some(item => item.id === id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
  }

  qrcodes = qrcodes.filter(item => item.id !== id);
  saveQRCodes(qrcodes);

  res.json({ success: true, message: 'QR Code berhasil dihapus' });
});

// Analytics for a specific QR code
app.get('/api/qrcodes/:id/analytics', (req: Request, res: Response) => {
  const { id } = req.params;
  const qrcodes = loadQRCodes();
  const qr = qrcodes.find(item => item.id === id);

  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not found' });
  }

  const allScans = loadScans();
  const qrScans = allScans.filter(s => s.qrId === qr.id);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let scansToday = 0;
  let scansLast7Days = 0;
  const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
  const osBreakdown: Record<string, number> = {};
  const browserBreakdown: Record<string, number> = {};
  const dailyCountMap: Record<string, number> = {};

  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    dailyCountMap[dateStr] = 0;
  }

  qrScans.forEach(scan => {
    const scanDate = scan.timestamp.split('T')[0];
    if (scanDate === todayStr) scansToday++;
    if (new Date(scan.timestamp) >= sevenDaysAgo) scansLast7Days++;

    // Device
    if (scan.device in deviceBreakdown) {
      deviceBreakdown[scan.device]++;
    } else {
      deviceBreakdown.unknown++;
    }

    // OS
    osBreakdown[scan.os] = (osBreakdown[scan.os] || 0) + 1;
    // Browser
    browserBreakdown[scan.browser] = (browserBreakdown[scan.browser] || 0) + 1;

    // Daily
    if (scanDate in dailyCountMap) {
      dailyCountMap[scanDate]++;
    }
  });

  const dailyScans = Object.keys(dailyCountMap).map(date => ({
    date,
    count: dailyCountMap[date]
  }));

  const summary: QRAnalyticsSummary = {
    qrId: qr.id,
    totalScans: qr.totalScans || qrScans.length,
    scansToday,
    scansLast7Days,
    deviceBreakdown,
    osBreakdown,
    browserBreakdown,
    dailyScans,
    recentScans: qrScans.slice(-20).reverse()
  };

  res.json({ success: true, data: summary });
});

// Synthetic test scan trigger for interactive in-dashboard simulation
app.post('/api/qrcodes/:id/test-scan', (req: Request, res: Response) => {
  const { id } = req.params;
  const { simulatedDevice = 'mobile', simulatedOs = 'Android' } = req.body;

  const qrcodes = loadQRCodes();
  const qr = qrcodes.find(item => item.id === id);

  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not found' });
  }

  const nowIso = new Date().toISOString();
  qr.totalScans = (qr.totalScans || 0) + 1;
  qr.lastScannedAt = nowIso;
  saveQRCodes(qrcodes);

  const scans = loadScans();
  const newScan: ScanRecord = {
    id: 'test-scan-' + Date.now(),
    qrId: qr.id,
    timestamp: nowIso,
    device: simulatedDevice as any,
    os: simulatedOs,
    browser: simulatedDevice === 'mobile' ? 'Mobile Chrome' : 'Desktop Safari',
    referer: 'Simulator Uji Scan Dashboard'
  };
  scans.push(newScan);
  saveScans(scans);

  res.json({
    success: true,
    message: 'Simulasi scan fisik berhasil! Total pindai bertambah dan tautan berhasil dialihkan.',
    targetUrl: qr.targetUrl,
    totalScans: qr.totalScans
  });
});

// Platform overview statistics
app.get('/api/stats/overview', (req: Request, res: Response) => {
  const qrcodes = loadQRCodes();
  const scans = loadScans();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalQRs = qrcodes.length;
  const activeQRs = qrcodes.filter(q => q.status === 'active').length;
  const totalScans = qrcodes.reduce((acc, q) => acc + (q.totalScans || 0), 0);
  const scansToday = scans.filter(s => s.timestamp.startsWith(todayStr)).length;

  res.json({
    success: true,
    data: {
      totalQRs,
      activeQRs,
      totalScans,
      scansToday
    }
  });
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DinamisQR server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
