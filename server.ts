import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DynamicQRCode, ScanRecord, QRAnalyticsSummary } from './src/types.ts';
import { db } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// The dev server in AI Studio must run on port 3000 because Nginx runs on port 8080 proxying to 3000.
function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  // In the container environment, process.env.PORT is 8080 (used by Nginx). The applet must listen on 3000.
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 3000;
}
const PORT = resolvePort();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper: Parse user agent for device and browser stats
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
// DYNAMIC REDIRECT HANDLER: GET /r/:slug & Vercel rewrites
// This is what physical printed QR codes point to!
// ==========================================
app.get(['/r/:slug', '/r', '/api/index.ts', '/api'], async (req: Request, res: Response, next: NextFunction) => {
  const rawSlug = req.params.slug ||
    (req.query.slug as string) ||
    (req.url.includes('/r/') ? req.url.split('/r/')[1]?.split('?')[0] : null);

  if (!rawSlug) {
    return next();
  }
  const slug = rawSlug.trim().toLowerCase();
  const qr = await db.getQRCodeBySlug(slug);

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
          a { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔍</div>
          <h1>QR Code Tidak Ditemukan</h1>
          <p>Tautan dinamis <code>/r/${slug}</code> belum terdaftar atau telah dinonaktifkan oleh pemilik.</p>
          <a href="/">Kembali ke Dashboard</a>
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
  await db.saveQRCode(qr);

  const scanRecord: ScanRecord = {
    id: 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    qrId: qr.id,
    timestamp: nowIso,
    device,
    os,
    browser,
    referer
  };
  await db.addScan(scanRecord);

  // Construct destination URL with UTM params if configured
  let destinationUrl = qr.targetUrl.trim();
  if (qr.utm && (qr.utm.source || qr.utm.medium || qr.utm.campaign)) {
    try {
      const urlObj = new URL(destinationUrl);
      if (qr.utm.source && !urlObj.searchParams.has('utm_source')) {
        urlObj.searchParams.set('utm_source', qr.utm.source);
      }
      if (qr.utm.medium && !urlObj.searchParams.has('utm_medium')) {
        urlObj.searchParams.set('utm_medium', qr.utm.medium);
      }
      if (qr.utm.campaign && !urlObj.searchParams.has('utm_campaign')) {
        urlObj.searchParams.set('utm_campaign', qr.utm.campaign);
      }
      destinationUrl = urlObj.toString();
    } catch {
      // Keep destinationUrl as is if parsing fails
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
app.get(['/nfc/:id', '/n/:id'], async (req: Request, res: Response) => {
  const { id } = req.params;
  const tag = await db.getNFCTagById(id);

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
  await db.saveNFCTag(tag);

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

// Database Connection Status Check (Vercel Postgres Diagnostics)
app.get('/api/db/status', async (_req: Request, res: Response) => {
  try {
    const status = await db.getStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database status check failed' });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Authentication: Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
  }

  const users = await db.getUsers();
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
      name: user.name || 'Pengguna',
      email: user.email || '',
      phone: user.phone || '',
      plan: user.plan || 'trial',
      trialExpiresAt: user.trialExpiresAt,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      isWatermarkActive: user.isWatermarkActive !== undefined ? user.isWatermarkActive : (user.plan === 'trial')
    }
  });
});

// Authentication: Register New User (Trial 3 Hari)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, password, name, fullName, phone, email } = req.body;
  const userNameVal = (name || fullName || '').trim();

  if (!username || !password || !userNameVal) {
    return res.status(400).json({
      success: false,
      error: 'Nama lengkap, username, dan password wajib diisi.'
    });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Username minimal 3 karakter huruf/angka tanpa spasi.'
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      error: 'Password minimal 4 karakter.'
    });
  }

  const existing = await db.getUserByUsername(cleanUsername);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `Username "${cleanUsername}" sudah digunakan. Silakan gunakan username lain.`
    });
  }

  // Calculate 3-day trial expiry
  const now = new Date();
  const trialDays = 3;
  const trialExpiresAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  const newUser = await db.createUser({
    username: cleanUsername,
    password: password,
    name: userNameVal,
    email: email?.trim() || '',
    phone: phone?.trim() || '',
    plan: 'trial',
    trialExpiresAt,
    subscriptionExpiresAt: null,
    isWatermarkActive: true,
    createdAt: now.toISOString()
  });

  const token = 'auth_' + Buffer.from(`${newUser.username}:${Date.now()}:${Math.random()}`).toString('base64');

  return res.status(201).json({
    success: true,
    message: 'Selamat! Akun baru Anda dengan Trial 3 Hari Gratis telah berhasil dibuat.',
    token,
    user: {
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      plan: newUser.plan,
      trialExpiresAt: newUser.trialExpiresAt,
      subscriptionExpiresAt: newUser.subscriptionExpiresAt,
      isWatermarkActive: newUser.isWatermarkActive
    }
  });
});

// Authentication: Upgrade Subscription Plan (Bulanan / Tahunan)
app.post('/api/auth/upgrade-plan', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Sesi belum terautentikasi' });
  }

  const token = authHeader.substring(7);
  let targetUsername = 'admin';
  try {
    const raw = Buffer.from(token.replace(/^auth_/, ''), 'base64').toString('ascii');
    const parts = raw.split(':');
    if (parts[0]) targetUsername = parts[0];
  } catch {
    // fallback
  }

  const { plan = 'monthly' } = req.body;
  if (plan !== 'monthly' && plan !== 'yearly') {
    return res.status(400).json({ success: false, error: 'Pilihan paket harus bulanan ("monthly") atau tahunan ("yearly").' });
  }

  const updatedUser = await db.updateUserPlan(targetUsername, plan);
  if (!updatedUser) {
    return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
  }

  return res.json({
    success: true,
    message: plan === 'yearly'
      ? 'Selamat! Akun Anda telah diupgrade ke Paket Bisnis Tahunan. Semua watermark pada QR dan Stand meja telah dihapus permanen!'
      : 'Selamat! Akun Anda telah diupgrade ke Paket Pro Bulanan. Semua watermark pada QR dan Stand meja telah dihapus!',
    user: {
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      plan: updatedUser.plan,
      trialExpiresAt: updatedUser.trialExpiresAt,
      subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
      isWatermarkActive: false
    }
  });
});

// Authentication: Current User
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Sesi belum terautentikasi' });
  }

  const token = authHeader.substring(7);
  let targetUsername = '';
  try {
    const raw = Buffer.from(token.replace(/^auth_/, ''), 'base64').toString('ascii');
    const parts = raw.split(':');
    if (parts[0]) targetUsername = parts[0];
  } catch {
    // ignore
  }

  const user = targetUsername ? await db.getUserByUsername(targetUsername) : null;
  const currentUser = user || (await db.getUsers())[0] || {
    username: 'admin',
    name: 'Administrator',
    plan: 'yearly',
    isWatermarkActive: false
  };

  return res.json({
    success: true,
    user: {
      username: currentUser.username,
      name: currentUser.name,
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      plan: currentUser.plan || 'trial',
      trialExpiresAt: currentUser.trialExpiresAt,
      subscriptionExpiresAt: currentUser.subscriptionExpiresAt,
      isWatermarkActive: currentUser.isWatermarkActive !== undefined ? currentUser.isWatermarkActive : (currentUser.plan === 'trial')
    }
  });
});

// Authentication: Logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Berhasil keluar' });
});

// Authentication: Change Username and Password
app.post('/api/auth/change-credentials', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Sesi belum terautentikasi' });
  }

  const { currentPassword, newUsername, newPassword } = req.body;
  if (!currentPassword || !newUsername || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Password saat ini, username baru, dan password baru wajib diisi.'
    });
  }

  const trimmedUsername = newUsername.trim();
  if (trimmedUsername.length < 3) {
    return res.status(400).json({ success: false, error: 'Username baru minimal 3 karakter.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ success: false, error: 'Password baru minimal 4 karakter.' });
  }

  const users = await db.getUsers();
  const user = users[0];

  if (!user || user.password !== currentPassword) {
    return res.status(401).json({ success: false, error: 'Password saat ini tidak sesuai.' });
  }

  await db.updateUser(user.username, newPassword, trimmedUsername, user.name);

  return res.json({
    success: true,
    message: 'Username dan password berhasil diperbarui.',
    user: {
      username: trimmedUsername,
      name: user.name || 'Administrator'
    }
  });
});

// ==========================================
// NFC TAGS REST API ROUTES
// ==========================================

// List all NFC tags
app.get('/api/nfc', async (_req: Request, res: Response) => {
  const tags = await db.getNFCTags();
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
app.post('/api/nfc/activate', async (req: Request, res: Response) => {
  const { placeName, googleReviewUrl, pin, tagUid, notes } = req.body;

  if (!placeName || !googleReviewUrl || !pin) {
    return res.status(400).json({
      success: false,
      error: 'Nama tempat, link Google Review, dan PIN NFC tag wajib diisi'
    });
  }

  const tags = await db.getNFCTags();
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

  await db.saveNFCTag(newTag);

  res.status(201).json({
    success: true,
    data: newTag,
    redirectUrl: `/nfc/${newTag.id}`,
    message: `Tag NFC untuk "${newTag.placeName}" berhasil diaktivasi!`
  });
});

// Update NFC tag (requires PIN verification)
app.put('/api/nfc/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { placeName, googleReviewUrl, pin, newPin, status, notes, tagData } = req.body;

    let tag = await db.getNFCTagById(id);
    if (!tag) {
      if (tagData) {
        tag = {
          ...tagData,
          id,
          placeName: placeName !== undefined ? placeName.trim() : tagData.placeName,
          googleReviewUrl: googleReviewUrl !== undefined ? googleReviewUrl.trim() : tagData.googleReviewUrl,
          pin: newPin ? String(newPin).trim() : tagData.pin,
          status: status || tagData.status,
          notes: notes !== undefined ? notes : tagData.notes,
          updatedAt: new Date().toISOString()
        };
      } else {
        return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
      }
    } else {
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
    }

    try {
      await db.saveNFCTag(tag);
    } catch (saveErr) {
      console.warn('[NFC] Warning saving NFC tag to DB:', saveErr);
    }

    return res.json({
      success: true,
      data: tag,
      message: 'Data NFC Tag berhasil diperbarui!'
    });
  } catch (err: any) {
    console.error('Update NFC error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal memperbarui NFC: ' + (err?.message || 'Terjadi kesalahan sistem')
    });
  }
});

// Delete NFC tag (with PIN verification)
app.delete('/api/nfc/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pin } = req.body;
  const tag = await db.getNFCTagById(id);

  if (!tag) {
    return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
  }

  if (pin && String(pin).trim() !== String(tag.pin).trim()) {
    return res.status(403).json({ success: false, error: 'PIN NFC Tag salah.' });
  }

  await db.deleteNFCTag(id);
  res.json({ success: true, message: 'Tag NFC berhasil dihapus' });
});

// Test tap simulation
app.post('/api/nfc/:id/test-tap', async (req: Request, res: Response) => {
  const { id } = req.params;
  const tag = await db.getNFCTagById(id);

  if (!tag) {
    return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
  }

  tag.totalTaps = (tag.totalTaps || 0) + 1;
  tag.lastTappedAt = new Date().toISOString();
  await db.saveNFCTag(tag);

  res.json({
    success: true,
    message: `Simulasi tap NFC pada "${tag.placeName}" berhasil!`,
    totalTaps: tag.totalTaps,
    targetUrl: tag.googleReviewUrl
  });
});

// Batch create QR codes (5, 10, or 15 at once)
app.post('/api/qrcodes/batch', async (req: Request, res: Response) => {
  try {
    const { baseTitle, baseTargetUrl, count = 5, style, baseSlug, notes } = req.body;

    const batchCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);
    const qrcodes = await db.getQRCodes();
    const now = new Date().toISOString();

    const safeTitle = (baseTitle && String(baseTitle).trim()) ? String(baseTitle).trim() : 'Meja Restoran';

    let finalTarget = (baseTargetUrl && String(baseTargetUrl).trim()) ? String(baseTargetUrl).trim() : 'https://google.com';
    if (!finalTarget.startsWith('http://') && !finalTarget.startsWith('https://')) {
      finalTarget = 'https://' + finalTarget;
    }

    let maxExistingNum = 0;
    for (const q of qrcodes) {
      if (q.code) {
        const match = q.code.match(/QR\s*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxExistingNum) {
            maxExistingNum = num;
          }
        }
      }
    }
    const startSeq = maxExistingNum + 1;

    let cleanBase = (baseSlug || safeTitle)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!cleanBase || cleanBase.length < 2) {
      cleanBase = 'meja';
    }

    const createdItems: DynamicQRCode[] = [];

    for (let i = 1; i <= batchCount; i++) {
      const pad = i.toString().padStart(2, '0');
      const itemTitle = `${safeTitle} #${pad}`;

      let itemSlug = `${cleanBase}-${pad}`;
      let counter = 1;
      while (
        qrcodes.some(item => item.slug.toLowerCase() === itemSlug.toLowerCase()) ||
        createdItems.some(item => item.slug.toLowerCase() === itemSlug.toLowerCase())
      ) {
        itemSlug = `${cleanBase}-${pad}-${counter}`;
        counter++;
      }

      const seqNum = startSeq + (i - 1);
      const autoCode = `QR ${seqNum.toString().padStart(3, '0')}`;

      const newQR: DynamicQRCode = {
        id: `qr-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        code: autoCode,
        slug: itemSlug,
        title: itemTitle,
        targetUrl: finalTarget,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        tags: ['Batch Stand', safeTitle],
        notes: notes || `Dibuat serentak batch ${batchCount} pcs stand meja.`,
        totalScans: 0,
        lastScannedAt: null,
        urlHistory: [
          {
            url: finalTarget,
            changedAt: now,
            reason: `Batch generate ${batchCount} item`
          }
        ],
        style: style || {
          fgColor: '#104F38',
          bgColor: '#ffffff',
          dotStyle: 'rounded',
          cornerStyle: 'rounded',
          frameStyle: 'bottom-banner',
          frameText: `PINDAI #${pad}`,
          frameColor: '#104F38',
          frameTextColor: '#ffffff',
          logoType: 'none'
        }
      };

      createdItems.push(newQR);
    }

    await db.saveBatchQRCodes(createdItems);

    return res.status(201).json({
      success: true,
      count: createdItems.length,
      data: createdItems,
      message: `Berhasil membuat ${createdItems.length} QR Code dinamis sekaligus!`
    });
  } catch (err: any) {
    console.error('Batch create error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal membuat QR Code secara batch: ' + (err?.message || 'Terjadi kesalahan sistem')
    });
  }
});

// List all QR codes
app.get('/api/qrcodes', async (_req: Request, res: Response) => {
  const qrcodes = await db.getQRCodes();
  res.json({ success: true, data: qrcodes });
});

// Get single QR code
app.get('/api/qrcodes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const qr = await db.getQRCodeById(id);
  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not found' });
  }
  res.json({ success: true, data: qr });
});

// Get QR code by slug
app.get('/api/qrcodes/slug/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const qr = await db.getQRCodeBySlug(slug);
  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
  }
  res.json({ success: true, data: qr });
});

// Create new dynamic QR code
app.post('/api/qrcodes', async (req: Request, res: Response) => {
  try {
    const { title, targetUrl, slug, code, tags, notes, style, password, expiryDate, utm } = req.body;

    if (!title || !targetUrl) {
      return res.status(400).json({ success: false, error: 'Judul dan URL tujuan wajib diisi' });
    }

    const qrcodes = await db.getQRCodes().catch(() => []);
    const autoCode = code?.trim() || `QR ${(qrcodes.length + 1).toString().padStart(3, '0')}`;

    let generatedSlug = (slug || autoCode || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!generatedSlug || generatedSlug.length < 3) {
      generatedSlug = autoCode.toLowerCase().replace(/\s+/g, '-');
    }

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
        fgColor: '#104F38',
        bgColor: '#ffffff',
        dotStyle: 'rounded',
        cornerStyle: 'rounded',
        frameStyle: 'bottom-banner',
        frameText: 'PINDAI SAYA',
        frameColor: '#104F38',
        frameTextColor: '#ffffff',
        logoType: 'none'
      },
      password: password || undefined,
      expiryDate: expiryDate || undefined,
      utm: utm || undefined
    };

    try {
      await db.saveQRCode(newQR);
    } catch (saveErr) {
      console.warn('[QR] Warning saving to persistent DB, returning item anyway:', saveErr);
    }

    return res.status(201).json({ success: true, data: newQR });
  } catch (err: any) {
    console.error('Create QR error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal membuat QR Code: ' + (err?.message || 'Terjadi kesalahan sistem')
    });
  }
});

// Update dynamic QR code (update target URL or properties)
app.put('/api/qrcodes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, targetUrl, status, tags, notes, style, password, expiryDate, utm, reason, qrData } = req.body;

    let current = await db.getQRCodeById(id);
    const now = new Date().toISOString();
    let urlChanged = false;

    if (!current) {
      // If not in database or serverless instance cache, recover from client qrData
      if (qrData) {
        current = {
          ...qrData,
          id,
          targetUrl: targetUrl ? targetUrl.trim() : (qrData.targetUrl || 'https://google.com'),
          updatedAt: now,
          urlHistory: [
            {
              url: targetUrl ? targetUrl.trim() : (qrData.targetUrl || 'https://google.com'),
              changedAt: now,
              reason: reason || 'Pembaruan tautan tujuan'
            },
            ...(Array.isArray(qrData.urlHistory) ? qrData.urlHistory : [])
          ]
        };
        urlChanged = true;
      } else {
        return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
      }
    } else {
      if (targetUrl && targetUrl.trim() !== current.targetUrl) {
        urlChanged = true;
        current.urlHistory = current.urlHistory || [];
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
      if (style !== undefined) current.style = { ...(current.style || {}), ...style };
      if (password !== undefined) current.password = password ? password.trim() : undefined;
      if (expiryDate !== undefined) current.expiryDate = expiryDate || undefined;
      if (utm !== undefined) current.utm = utm || undefined;
      current.updatedAt = now;
    }

    if (!current) {
      return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
    }

    try {
      await db.saveQRCode(current);
    } catch (saveErr) {
      console.warn('[QR] Warning saving updated QR code to DB:', saveErr);
    }

    return res.json({
      success: true,
      data: current,
      message: urlChanged
        ? 'Tautan tujuan berhasil diperbarui! QR code fisik yang dicetak akan langsung mengarah ke tautan baru.'
        : 'Pengaturan QR code berhasil diperbarui.'
    });
  } catch (err: any) {
    console.error('Update QR error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal memperbarui tautan: ' + (err?.message || 'Terjadi kesalahan sistem')
    });
  }
});

// Delete QR code
app.delete('/api/qrcodes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const success = await db.deleteQRCode(id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
  }
  res.json({ success: true, message: 'QR Code berhasil dihapus' });
});

// Analytics for a specific QR code
app.get('/api/qrcodes/:id/analytics', async (req: Request, res: Response) => {
  const { id } = req.params;
  const qr = await db.getQRCodeById(id);

  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not found' });
  }

  const allScans = await db.getScans();
  const qrScans = allScans.filter(s => s.qrId === qr.id);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let scansToday = 0;
  let scansLast7Days = 0;

  const deviceBreakdown: { mobile: number; desktop: number; tablet: number; unknown: number } = {
    mobile: 0,
    desktop: 0,
    tablet: 0,
    unknown: 0
  };
  const osBreakdown: Record<string, number> = {};
  const browserBreakdown: Record<string, number> = {};

  const dailyCountMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    dailyCountMap[dateStr] = 0;
  }

  qrScans.forEach(scan => {
    const scanDate = scan.timestamp.split('T')[0];
    const scanTime = new Date(scan.timestamp);

    if (scanDate === todayStr) scansToday++;
    if (scanTime >= sevenDaysAgo) scansLast7Days++;

    if (scan.device === 'mobile' || scan.device === 'desktop' || scan.device === 'tablet') {
      deviceBreakdown[scan.device]++;
    } else {
      deviceBreakdown.unknown++;
    }

    osBreakdown[scan.os] = (osBreakdown[scan.os] || 0) + 1;
    browserBreakdown[scan.browser] = (browserBreakdown[scan.browser] || 0) + 1;

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
app.post('/api/qrcodes/:id/test-scan', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { simulatedDevice = 'mobile', simulatedOs = 'Android' } = req.body;

  const qr = await db.getQRCodeById(id);
  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not found' });
  }

  const nowIso = new Date().toISOString();
  qr.totalScans = (qr.totalScans || 0) + 1;
  qr.lastScannedAt = nowIso;
  await db.saveQRCode(qr);

  const newScan: ScanRecord = {
    id: 'test-scan-' + Date.now(),
    qrId: qr.id,
    timestamp: nowIso,
    device: simulatedDevice as any,
    os: simulatedOs,
    browser: simulatedDevice === 'mobile' ? 'Mobile Chrome' : 'Desktop Safari',
    referer: 'Simulator Uji Scan Dashboard'
  };
  await db.addScan(newScan);

  res.json({
    success: true,
    message: 'Simulasi scan fisik berhasil! Total pindai bertambah dan tautan berhasil dialihkan.',
    targetUrl: qr.targetUrl,
    totalScans: qr.totalScans
  });
});

// Platform overview statistics
app.get('/api/stats/overview', async (_req: Request, res: Response) => {
  const qrcodes = await db.getQRCodes();
  const scans = await db.getScans();
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

// Mount Vite in local development or serve static assets in production
async function startServer() {
  // If running in Vercel Serverless environment, do not start local HTTP listener
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`DinamisQR server running on http://0.0.0.0:${PORT}`);
  });
  server.on('error', (err: any) => {
    console.error(`DinamisQR server error on port ${PORT}:`, err);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

export { app };
export default app;
