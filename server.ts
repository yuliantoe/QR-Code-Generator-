import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import crypto from 'crypto';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { DynamicQRCode, ScanRecord, QRAnalyticsSummary, NFCTapRecord } from './src/types.ts';
import { db, syncAllSlugsToCloud, computeSyncRevision } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// HTTP Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Real-time cross-device sync hub (WebSocket + SSE)
type SyncEventType =
  | 'connected'
  | 'snapshot'
  | 'qr:created'
  | 'qr:batch-created'
  | 'qr:updated'
  | 'qr:deleted'
  | 'qr:scanned'
  | 'nfc:created'
  | 'nfc:updated'
  | 'nfc:deleted'
  | 'nfc:tapped';

const sseClients = new Set<Response>();
const wsClients = new Set<WebSocket>();
let lastKnownRevision = 'rev-init';

async function getSyncedSnapshot() {
  const [qrcodes, rawTags] = await Promise.all([db.getQRCodes(), db.getNFCTags()]);
  const qrById = new Map(qrcodes.map(q => [q.id, q]));
  const qrBySlug = new Map(qrcodes.map(q => [q.slug.toLowerCase().trim(), q]));

  const nfcTags = await Promise.all(
    rawTags.map(async (tag: any) => {
      if (tag.syncWithQr === false) return tag;
      const linkedQr =
        (tag.linkedQrId ? qrById.get(tag.linkedQrId) : undefined) ||
        (tag.linkedQrSlug ? qrBySlug.get(String(tag.linkedQrSlug).toLowerCase().trim()) : undefined);

      if (linkedQr && linkedQr.targetUrl && linkedQr.targetUrl !== tag.googleReviewUrl) {
        const updatedTag = {
          ...tag,
          linkedQrId: tag.linkedQrId || linkedQr.id,
          linkedQrSlug: tag.linkedQrSlug || linkedQr.slug,
          linkedQrCode: tag.linkedQrCode || linkedQr.code || null,
          googleReviewUrl: linkedQr.targetUrl,
          updatedAt: linkedQr.updatedAt || new Date().toISOString()
        };
        await db.saveNFCTag(updatedTag);
        return updatedTag;
      }
      return tag;
    })
  );

  const revision = computeSyncRevision(qrcodes, nfcTags);
  lastKnownRevision = revision;
  return { revision, qrcodes, nfcTags };
}

async function computeCurrentRevision(): Promise<string> {
  try {
    const [qrcodes, nfcTags] = await Promise.all([db.getQRCodes(), db.getNFCTags()]);
    const rev = computeSyncRevision(qrcodes, nfcTags);
    lastKnownRevision = rev;
    return rev;
  } catch {
    return lastKnownRevision;
  }
}

async function broadcastSyncEvent(type: SyncEventType, payload?: any): Promise<void> {
  try {
    const revision = await computeCurrentRevision();
    const message = JSON.stringify({
      type,
      revision,
      timestamp: new Date().toISOString(),
      payload
    });

    for (const ws of wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch {
          wsClients.delete(ws);
        }
      }
    }

    for (const res of sseClients) {
      if (!res.writableEnded) {
        try {
          res.write(`data: ${message}\n\n`);
        } catch {
          sseClients.delete(res);
        }
      }
    }
  } catch (err) {
    console.warn('[Sync] Broadcast warning:', err);
  }
}

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

const jsonParser = express.json({ limit: '10mb' });
const urlencodedParser = express.urlencoded({ extended: true });

app.use((req: Request, res: Response, next: NextFunction) => {
  // On Vercel Node runtime, req.body may already be pre-parsed as object, string, or Buffer
  if (Buffer.isBuffer(req.body)) {
    try {
      const str = req.body.toString('utf-8').trim();
      req.body = str ? JSON.parse(str) : {};
    } catch {
      req.body = {};
    }
    return next();
  }
  if (typeof req.body === 'string') {
    try {
      req.body = req.body.trim() ? JSON.parse(req.body) : {};
    } catch {
      req.body = {};
    }
    return next();
  }
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object') {
    return next();
  }
  return jsonParser(req, res, (err) => {
    if (err) return next(err);
    return urlencodedParser(req, res, next);
  });
});

// Restore original path when Vercel rewrites to /api/index.ts or /api/[...all].ts
app.use((req: Request, _res: Response, next: NextFunction) => {
  const rawUrl = req.url || '/';
  const qIndex = rawUrl.indexOf('?');
  const rawPath = qIndex !== -1 ? rawUrl.slice(0, qIndex) : rawPathFallback(rawUrl);
  const searchParams = new URLSearchParams(qIndex !== -1 ? rawUrl.slice(qIndex + 1) : '');

  const rewritePath = (searchParams.get('__path') || (typeof req.query?.__path === 'string' ? req.query.__path : '')).trim();
  const querySlug = (searchParams.get('slug') || (typeof req.query?.slug === 'string' ? req.query.slug : '')).trim();
  const queryNfcId = (searchParams.get('nfcId') || (typeof req.query?.nfcId === 'string' ? req.query.nfcId : '')).trim();

  if (
    rewritePath &&
    rewritePath.startsWith('/') &&
    !rewritePath.startsWith('/api/index.ts') &&
    !rewritePath.startsWith('/api/[...all]')
  ) {
    searchParams.delete('__path');
    if (rewritePath.startsWith('/r/')) searchParams.delete('slug');
    if (rewritePath.startsWith('/nfc/') || rewritePath.startsWith('/n/')) searchParams.delete('nfcId');
    const cleanQuery = searchParams.toString();
    req.url = rewritePath + (cleanQuery ? (rewritePath.includes('?') ? '&' : '?') + cleanQuery : '');
  } else if (querySlug && (rawPath === '/api/index.ts' || rawPath === '/api' || rawPath === '/api/r' || rawPath === '/r')) {
    searchParams.delete('__path');
    const cleanQuery = searchParams.toString();
    req.url = `/r/${encodeURIComponent(querySlug)}${cleanQuery ? '?' + cleanQuery : ''}`;
  } else if (queryNfcId && (rawPath === '/api/index.ts' || rawPath === '/api' || rawPath === '/api/nfc' || rawPath === '/nfc')) {
    searchParams.delete('__path');
    const cleanQuery = searchParams.toString();
    req.url = `/nfc/${encodeURIComponent(queryNfcId)}${cleanQuery ? '?' + cleanQuery : ''}`;
  } else {
    const matchedPath = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'] || req.headers['x-forwarded-url']) as string;
    if (
      matchedPath &&
      !matchedPath.startsWith('/api/index.ts') &&
      !matchedPath.startsWith('/api/[...all]') &&
      (rawPath === '/api/index.ts' || rawPath === '/api' || rawPath.startsWith('/api/[...all]'))
    ) {
      const cleanQuery = searchParams.toString();
      req.url = matchedPath + (cleanQuery ? (matchedPath.includes('?') ? '&' : '?') + cleanQuery : '');
    }
  }
  next();
});

function rawPathFallback(u: string): string {
  return u || '/';
}

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
app.get(['/r/:slug', '/r/:slug/*', '/r', '/api/r', '/api/index.ts', '/api', '/'], async (req: Request, res: Response, next: NextFunction) => {
  const rawSlug = req.params.slug ||
    (req.query.slug as string) ||
    (req.path.startsWith('/r/') ? req.path.replace(/^\/r\//, '').split('/')[0].split('?')[0] : null) ||
    (req.url.includes('/r/') ? req.url.split('/r/')[1]?.split('?')[0] : null);

  if (!rawSlug) {
    return next();
  }
  let decodedSlug = String(rawSlug);
  try {
    decodedSlug = decodeURIComponent(decodedSlug);
  } catch {}
  const slug = decodedSlug.trim().toLowerCase().replace(/\.png$/i, '').replace(/\/+$/, '');
  if (!slug) {
    return next();
  }
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

  // Record scan analytics (never block redirect if analytics persistence fails)
  const ua = req.headers['user-agent'];
  const { device, os, browser } = parseUserAgent(ua);
  const referer = (req.headers['referer'] || req.headers['referrer'] || 'Direct / Scan Fisik') as string;

  const nowIso = new Date().toISOString();
  try {
    const updatedForScan: DynamicQRCode = {
      ...qr,
      totalScans: (qr.totalScans || 0) + 1,
      lastScannedAt: nowIso
    };
    await db.saveQRCode(updatedForScan);

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
    void broadcastSyncEvent('qr:scanned', { qr: updatedForScan });
  } catch (scanErr) {
    console.warn('[Redirect] Non-blocking analytics error:', scanErr);
  }

  // Construct destination URL with protocol check & UTM params if configured
  let destinationUrl = (qr.targetUrl || '').trim();
  if (destinationUrl && !/^https?:\/\//i.test(destinationUrl)) {
    destinationUrl = 'https://' + destinationUrl;
  }
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

  // Send strict no-cache headers so browsers, edge CDNs (Vercel/Cloudflare) and QR scanner apps always perform fresh redirect
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  return res.redirect(302, destinationUrl);
});

// ==========================================
// DYNAMIC NFC REDIRECT HANDLER: GET /nfc/:id
// Physical NFC chips are programmed with this URL!
// ==========================================
app.get(['/nfc/:id', '/nfc/:id/*', '/n/:id', '/n/:id/*'], async (req: Request, res: Response) => {
  let cleanId = String(req.params.id || '');
  try {
    cleanId = decodeURIComponent(cleanId);
  } catch {}
  cleanId = cleanId.trim().replace(/\/+$/, '');
  let tag = await db.getNFCTagById(cleanId);

  if (!tag || tag.status === 'pending') {
    const query = new URLSearchParams();
    if (cleanId) query.set('nfcId', cleanId);
    if (tag?.linkedQrCode) query.set('qr', String(tag.linkedQrCode));
    const activationHref = `/aktivasi?${query.toString()}`;

    const escapeHtml = (str: string) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const safeTagId = escapeHtml(cleanId || 'tag-baru');
    const safeLinkedQr = tag?.linkedQrCode ? escapeHtml(String(tag.linkedQrCode)) : '';
    const safePlaceName = tag?.placeName ? escapeHtml(String(tag.placeName)) : '';

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Tag NFC Belum Diaktivasi - Projecttapp</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #F8FAF9;
            color: #104F38;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .topbar {
            background: #FFFFFF;
            border-bottom: 1px solid rgba(16, 79, 56, 0.15);
            padding: 14px 20px;
          }
          .topbar-inner {
            max-width: 640px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: #104F38;
            font-weight: 800;
            font-size: 16px;
          }
          .brand-mark {
            width: 34px;
            height: 34px;
            background: #104F38;
            color: #FFE600;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .sys-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: rgba(16, 79, 56, 0.7);
          }
          .main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px 40px;
          }
          .card {
            background: #FFFFFF;
            max-width: 500px;
            width: 100%;
            border: 1px solid rgba(16, 79, 56, 0.22);
            box-shadow: 0 12px 32px -12px rgba(16, 79, 56, 0.14);
          }
          .accent-strip {
            height: 6px;
            background: #FFE600;
            border-bottom: 1px solid rgba(16, 79, 56, 0.2);
          }
          .card-body {
            padding: 28px 24px;
          }
          .notice-header {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 18px;
          }
          .icon-box {
            width: 48px;
            height: 48px;
            background: #FFF9CC;
            border: 1px solid rgba(16, 79, 56, 0.25);
            color: #104F38;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .kicker {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #9A6700;
            margin: 0 0 4px;
          }
          h1 {
            font-size: 22px;
            font-weight: 800;
            line-height: 1.25;
            margin: 0;
            color: #104F38;
          }
          .desc {
            font-size: 14px;
            line-height: 1.65;
            color: rgba(16, 79, 56, 0.85);
            margin: 0 0 18px;
          }
          .meta-box {
            background: #F4FAF6;
            border: 1px solid rgba(16, 79, 56, 0.16);
            padding: 14px;
            margin-bottom: 18px;
            font-size: 12px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 4px 0;
          }
          .meta-row + .meta-row {
            border-top: 1px solid rgba(16, 79, 56, 0.1);
            margin-top: 4px;
            padding-top: 8px;
          }
          .meta-key {
            color: rgba(16, 79, 56, 0.65);
            font-weight: 600;
          }
          .meta-val {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-weight: 700;
            color: #104F38;
            text-align: right;
            word-break: break-all;
          }
          .status-pending {
            color: #9A6700;
            font-family: inherit;
          }
          .steps {
            border: 1px solid rgba(16, 79, 56, 0.12);
            background: #FFFFFF;
            padding: 12px 14px;
            margin-bottom: 22px;
            font-size: 12px;
            color: rgba(16, 79, 56, 0.82);
          }
          .steps-title {
            font-weight: 800;
            color: #104F38;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .steps ol {
            margin: 0;
            padding-left: 18px;
            line-height: 1.6;
          }
          .actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .btn-primary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 14px 18px;
            background: #FFE600;
            color: #104F38;
            border: 1px solid rgba(16, 79, 56, 0.35);
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
            text-align: center;
            transition: background-color 0.15s ease;
          }
          .btn-primary:hover {
            background: #F2DA00;
          }
          .btn-secondary {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 11px 16px;
            background: #FFFFFF;
            color: #104F38;
            border: 1px solid rgba(16, 79, 56, 0.2);
            font-size: 12px;
            font-weight: 700;
            text-decoration: none;
            text-align: center;
          }
          .btn-secondary:hover {
            background: #F4FAF6;
          }
          @media (max-width: 480px) {
            .card-body { padding: 22px 18px; }
            h1 { font-size: 19px; }
          }
        </style>
      </head>
      <body>
        <header class="topbar">
          <div class="topbar-inner">
            <a href="/" class="brand">
              <div class="brand-mark" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
                  <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
                  <circle cx="12" cy="12" r="2"></circle>
                  <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
                  <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
                </svg>
              </div>
              <span>Projecttapp</span>
            </a>
            <span class="sys-label">Sistem Info NFC Tag</span>
          </div>
        </header>

        <main class="main">
          <section class="card" role="alert" aria-live="polite">
            <div class="accent-strip"></div>
            <div class="card-body">
              <div class="notice-header">
                <div class="icon-box" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <p class="kicker">Pemberitahuan Sistem NFC</p>
                  <h1>Tag NFC Belum Diaktivasi</h1>
                </div>
              </div>

              <p class="desc">
                Tag NFC yang Anda tap saat ini belum terhubung ke tautan Google Review atau halaman usaha tujuan.
                Silakan lakukan aktivasi terlebih dahulu agar tag dapat langsung digunakan pelanggan saat ditempelkan ke smartphone.
              </p>

              <div class="meta-box">
                <div class="meta-row">
                  <span class="meta-key">ID Tag NFC</span>
                  <span class="meta-val">/nfc/${safeTagId}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-key">Status Tag</span>
                  <span class="meta-val status-pending">Belum Diaktivasi</span>
                </div>
                ${safeLinkedQr ? `
                <div class="meta-row">
                  <span class="meta-key">Kode QR Terkait</span>
                  <span class="meta-val">${safeLinkedQr}</span>
                </div>` : ''}
                ${safePlaceName ? `
                <div class="meta-row">
                  <span class="meta-key">Nama Terdaftar</span>
                  <span class="meta-val" style="font-family:inherit;">${safePlaceName}</span>
                </div>` : ''}
              </div>

              <div class="steps">
                <div class="steps-title">Cara Aktivasi Mandiri (Tanpa Username &amp; Password):</div>
                <ol>
                  <li>Klik tombol <strong>Masuk Aktivasi Tag NFC Mandiri</strong> di bawah.</li>
                  <li>Masukkan kode produk Anda (contoh: <strong>QR001</strong>, <strong>QR002</strong>) lalu klik Kode QR tersebut.</li>
                  <li>Isi atau periksa tautan Google Review Anda, lalu klik <strong>Aktifkan Tag NFC</strong>.</li>
                </ol>
              </div>

              <div class="actions">
                <a href="${escapeHtml(activationHref)}" class="btn-primary">
                  <span>Masuk Aktivasi Tag NFC Mandiri</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
                <a href="/" class="btn-secondary">Kembali ke Beranda</a>
              </div>
            </div>
          </section>
        </main>
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
        <title>Tag NFC Dikunci - Projecttapp</title>
        <style>
          body { font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F4FAF6; color: #104F38; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 440px; width: 100%; border: 1px solid rgba(16,79,56,0.2); padding: 36px 28px; text-align: center; }
          h1 { font-size: 20px; font-weight: 800; margin: 0 0 10px; color: #104F38; }
          p { font-size: 14px; color: rgba(16,79,56,0.75); line-height: 1.6; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Tag NFC Sedang Dikunci</h1>
          <p>Tag untuk <strong>${tag.placeName}</strong> dinonaktifkan sementara oleh pemilik.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Sync latest URL if linked to an existing QR Code
  if (tag.linkedQrId && tag.syncWithQr !== false) {
    const linkedQr = await db.getQRCodeById(tag.linkedQrId);
    if (linkedQr?.targetUrl && linkedQr.targetUrl !== tag.googleReviewUrl) {
      tag.googleReviewUrl = linkedQr.targetUrl;
    }
  }

  // Automatically record NFC tap data and redirect directly to Google Review link without requiring PIN
  const ua = parseUserAgent(req.headers['user-agent']);
  const now = new Date().toISOString();
  const tapRecord: NFCTapRecord = {
    id: 'tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    tagId: tag.id,
    tagUid: tag.tagUid,
    timestamp: now,
    device: ua.device,
    os: ua.os,
    browser: ua.browser,
    source: 'nfc-tap',
    pinVerified: false,
    readPayload: `/nfc/${tag.id}`
  };

  tag.totalTaps = (tag.totalTaps || 0) + 1;
  tag.lastTappedAt = now;
  tag.tapHistory = [tapRecord, ...(Array.isArray(tag.tapHistory) ? tag.tapHistory : [])].slice(0, 100);
  await db.saveNFCTag(tag);
  void broadcastSyncEvent('nfc:tapped', { tag });

  let target = (tag.googleReviewUrl || '').trim();
  if (target && !target.startsWith('http://') && !target.startsWith('https://')) {
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

// Cross-device real-time sync endpoints
app.get('/api/sync/version', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const { revision, qrcodes, nfcTags } = await getSyncedSnapshot();
    res.json({
      success: true,
      revision,
      qrCount: qrcodes.length,
      nfcCount: nfcTags.length,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Gagal cek versi sinkronisasi' });
  }
});

app.get('/api/sync/snapshot', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const { revision, qrcodes, nfcTags } = await getSyncedSnapshot();
    res.json({
      success: true,
      revision,
      qrcodes,
      nfcTags,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Gagal memuat snapshot sinkronisasi' });
  }
});

app.get('/api/sync/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const revision = await computeCurrentRevision();
  res.write(
    `data: ${JSON.stringify({ type: 'connected', revision, timestamp: new Date().toISOString() })}\n\n`
  );

  if (process.env.VERCEL) {
    res.end();
    return;
  }

  sseClients.add(res);
  const keepAlive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(`: ping ${Date.now()}\n\n`);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Export & Restore full snapshot for Google Drive Automatisasi Backup & Restore
app.get('/api/backup/export', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const [{ revision, qrcodes, nfcTags }, scans] = await Promise.all([
      getSyncedSnapshot(),
      db.getScans()
    ]);

    res.json({
      success: true,
      data: {
        version: '1.0',
        app: 'Projecttapp',
        exportedAt: new Date().toISOString(),
        revision,
        summary: {
          qrCount: qrcodes.length,
          nfcCount: nfcTags.length,
          scanCount: scans.length
        },
        qrcodes,
        nfcTags,
        scans
      }
    });
  } catch (err: any) {
    console.error('[Backup Export] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengekspor cadangan data: ' + (err?.message || 'Error')
    });
  }
});

app.post('/api/backup/restore', async (req: Request, res: Response) => {
  try {
    const { qrcodes, nfcTags, scans = [], mode = 'replace' } = req.body || {};

    if (!Array.isArray(qrcodes) && !Array.isArray(nfcTags)) {
      return res.status(400).json({
        success: false,
        error: 'Format file cadangan tidak valid. Data qrcodes atau nfcTags tidak ditemukan.'
      });
    }

    const result = await db.restoreSnapshot({
      qrcodes: Array.isArray(qrcodes) ? qrcodes : [],
      nfcTags: Array.isArray(nfcTags) ? nfcTags : [],
      scans: Array.isArray(scans) ? scans : [],
      mode: mode === 'merge' ? 'merge' : 'replace'
    });

    lastKnownRevision = result.revision;
    void broadcastSyncEvent('snapshot', {
      qrcodes: result.qrcodes,
      nfcTags: result.nfcTags
    });

    res.json({
      success: true,
      data: result,
      message: `Data berhasil dipulihkan (${result.qrcodes.length} QR Code, ${result.nfcTags.length} Tag NFC, ${result.scansCount} riwayat scan).`
    });
  } catch (err: any) {
    console.error('[Backup Restore] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal memulihkan data dari cadangan: ' + (err?.message || 'Error')
    });
  }
});

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

// ==========================================
// AUTHENTICATION SECURITY, SIGNED TOKENS & RATE LIMITING MIDDLEWARE
// ==========================================
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`${process.cwd()}:projecttapp_session_hmac_v2`).digest('hex');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam masa berlaku token server
const revokedSessionTokens = new Set<string>();

interface SessionPayload {
  u: string;
  iat: number;
  exp: number;
  jti: string;
}

interface AuthenticatedRequest extends Request {
  authUser?: any;
  authToken?: string;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a), 'utf-8');
  const bufB = Buffer.from(String(b), 'utf-8');
  if (bufA.length !== bufB.length) {
    // Compare equal-length dummy buffer to preserve constant timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function createSignedSessionToken(username: string): string {
  const now = Date.now();
  const payload: SessionPayload = {
    u: username.trim().toLowerCase(),
    iat: now,
    exp: now + SESSION_TTL_MS,
    jti: crypto.randomBytes(8).toString('hex')
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signatureB64 = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `auth_v2.${payloadB64}.${signatureB64}`;
}

function verifySignedSessionToken(token: string): SessionPayload | null {
  if (!token || revokedSessionTokens.has(token)) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'auth_v2') return null;

  const [, payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  if (!timingSafeStringEqual(signatureB64, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as SessionPayload;
    if (!parsed || typeof parsed.u !== 'string' || typeof parsed.exp !== 'number') return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getRetryAfterSeconds(req: Request, fallbackSeconds: number, propName: string = 'rateLimit'): number {
  const rl = (req as any)[propName];
  if (rl?.resetTime instanceof Date) {
    const diff = Math.ceil((rl.resetTime.getTime() - Date.now()) / 1000);
    if (diff > 0) return diff;
  }
  return fallbackSeconds;
}

// 1. Express Rate Limit: Proteksi Brute-Force Login per IP
const loginIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 20, // Maksimal 20 percobaan login per IP dalam 15 menit
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const retryAfterSeconds = getRetryAfterSeconds(req, 15 * 60, 'rateLimit');
    const retryMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      rateLimited: true,
      limitType: 'ip',
      retryAfterSeconds,
      error: `Terlalu banyak permintaan login dari perangkat Anda. Coba lagi dalam ${retryMinutes} menit (${retryAfterSeconds} detik).`
    });
  }
});

// 2. Express Rate Limit: Rate Limit User Middleware per Username + IP (hanya hitung percobaan gagal)
const loginUserRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 5, // Maksimal 5 kali login gagal per akun dalam 15 menit
  skipSuccessfulRequests: true,
  requestPropertyName: 'rateLimitUser',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const rawUser = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : 'anonymous';
    const ipKey = ipKeyGenerator(req.ip || '127.0.0.1');
    return `login_user:${rawUser || 'anonymous'}:ip:${ipKey}`;
  },
  handler: (req: Request, res: Response) => {
    const retryAfterSeconds = getRetryAfterSeconds(req, 15 * 60, 'rateLimitUser');
    const retryMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    const attemptedUser = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      rateLimited: true,
      limitType: 'user',
      retryAfterSeconds,
      error: attemptedUser
        ? `Akun "${attemptedUser}" sementara dikunci karena 5 kali gagal login. Silakan tunggu ${retryMinutes} menit (${retryAfterSeconds} detik).`
        : `Terlalu banyak percobaan login gagal. Silakan tunggu ${retryMinutes} menit (${retryAfterSeconds} detik).`
    });
  }
});

// 3. Express Rate Limit: Registrasi & Endpoint Sensitif Akun / Admin
const authRegisterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const retryAfterSeconds = getRetryAfterSeconds(req, 15 * 60);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      rateLimited: true,
      retryAfterSeconds,
      error: `Terlalu banyak percobaan pendaftaran akun. Silakan tunggu ${Math.ceil(retryAfterSeconds / 60)} menit.`
    });
  }
});

const authSensitiveUserRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => {
    const uname = req.authUser?.username ? String(req.authUser.username).toLowerCase() : 'guest';
    const ipKey = ipKeyGenerator(req.ip || '127.0.0.1');
    return `auth_user:${uname}:ip:${ipKey}`;
  },
  handler: (req: Request, res: Response) => {
    const retryAfterSeconds = getRetryAfterSeconds(req, 15 * 60);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      rateLimited: true,
      retryAfterSeconds,
      error: `Batas permintaan keamanan akun tercapai. Coba lagi dalam ${Math.ceil(retryAfterSeconds / 60)} menit.`
    });
  }
});

const publicActivationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const retryAfterSeconds = getRetryAfterSeconds(req, 15 * 60);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      rateLimited: true,
      retryAfterSeconds,
      error: `Terlalu banyak permintaan aktivasi. Silakan tunggu ${Math.ceil(retryAfterSeconds / 60)} menit.`
    });
  }
});

// 4. User Middleware: Verifikasi Token Sesi & Muat Profil User Terotentikasi
async function requireAuthUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      authError: true,
      error: 'Sesi belum terautentikasi. Silakan login terlebih dahulu.'
    });
  }

  const token = authHeader.substring(7).trim();
  const payload = verifySignedSessionToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      authError: true,
      error: 'Token sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.'
    });
  }

  try {
    const user = await db.getUserByUsername(payload.u);
    if (!user) {
      return res.status(401).json({
        success: false,
        authError: true,
        error: 'Akun pengguna tidak ditemukan. Silakan login kembali.'
      });
    }
    req.authUser = user;
    req.authToken = token;
    return next();
  } catch (err) {
    console.error('[Auth Middleware] Error:', err);
    return res.status(500).json({ success: false, error: 'Gagal memverifikasi sesi pengguna.' });
  }
}

// 5. Admin Middleware: Pastikan User Terotentikasi adalah Administrator
function requireAdminUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser || String(req.authUser.username || '').toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Akses ditolak. Hanya Administrator yang diizinkan mengakses menu ini.'
    });
  }
  return next();
}

// Authentication: Login (Protected by express-rate-limit per IP + per User)
app.post('/api/auth/login', loginIpRateLimiter, loginUserRateLimiter, async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const rawUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!rawUsername || !rawPassword) {
    return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
  }

  const users = await db.getUsers();
  const user = users.find(
    (u: any) => u.username.toLowerCase() === rawUsername.toLowerCase()
  );

  if (!user || !timingSafeStringEqual(String(user.password || ''), rawPassword)) {
    const userRl = (req as any).rateLimitUser;
    const remainingAttempts = typeof userRl?.remaining === 'number' ? Math.max(0, userRl.remaining) : undefined;
    return res.status(401).json({
      success: false,
      remainingAttempts,
      error:
        remainingAttempts !== undefined && remainingAttempts <= 2 && remainingAttempts > 0
          ? `Username atau password salah. Sisa ${remainingAttempts} kali percobaan sebelum akun dikunci sementara.`
          : 'Username atau password salah. Silakan coba lagi.'
    });
  }

  const token = createSignedSessionToken(user.username);
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
app.post('/api/auth/register', authRegisterRateLimiter, async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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

  const token = createSignedSessionToken(newUser.username);

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
app.post('/api/auth/upgrade-plan', requireAuthUser, authSensitiveUserRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const targetUsername = req.authUser.username;
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
    message: 'Selamat! Akun Anda telah diupgrade ke Paket Pro Bulanan. Semua watermark pada QR dan Stand meja telah dihapus!',
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
app.get('/api/auth/me', requireAuthUser, async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = req.authUser;
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

// Authentication: Logout (Revokes active signed token if sent)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      revokedSessionTokens.add(token);
      if (revokedSessionTokens.size > 5000) {
        const first = revokedSessionTokens.values().next().value;
        if (first) revokedSessionTokens.delete(first);
      }
    }
  }
  res.json({ success: true, message: 'Berhasil keluar' });
});

// Authentication: Change Username and Password (Protected by User Middleware + Rate Limit)
app.post('/api/auth/change-credentials', requireAuthUser, authSensitiveUserRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  if (!currentPassword || !newUsername || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Password saat ini, username baru, dan password baru wajib diisi.'
    });
  }

  const trimmedUsername = newUsername.trim().toLowerCase();
  if (trimmedUsername.length < 3) {
    return res.status(400).json({ success: false, error: 'Username baru minimal 3 karakter.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ success: false, error: 'Password baru minimal 4 karakter.' });
  }

  const user = req.authUser;
  if (!user || !timingSafeStringEqual(String(user.password || ''), String(currentPassword))) {
    return res.status(401).json({ success: false, error: 'Password saat ini tidak sesuai.' });
  }

  // ATURAN KEAMANAN: User tidak bisa ganti username Administrator
  if (user.username.toLowerCase() === 'admin' && trimmedUsername !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Username Administrator terkunci demi keamanan sistem dan tidak dapat diubah.'
    });
  }

  if (user.username.toLowerCase() !== 'admin' && trimmedUsername === 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Username "admin" dilindungi sebagai Administrator sistem.'
    });
  }

  const finalUsername = user.username.toLowerCase() === 'admin' ? 'admin' : trimmedUsername;
  await db.updateUser(user.username, newPassword, finalUsername, user.name);

  return res.json({
    success: true,
    message: user.username.toLowerCase() === 'admin' ? 'Password Administrator berhasil diperbarui (Username terkunci).' : 'Username dan password berhasil diperbarui.',
    user: {
      username: finalUsername,
      name: user.name || 'Administrator'
    }
  });
});

// Admin Dashboard: List All Users (Protected by requireAuthUser + requireAdminUser + Rate Limit)
app.get('/api/admin/users', requireAuthUser, requireAdminUser, authSensitiveUserRateLimiter, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const sanitized = users.map(u => ({
      username: u.username,
      name: u.name,
      email: u.email || '',
      phone: u.phone || '',
      plan: u.plan || 'trial',
      trialExpiresAt: u.trialExpiresAt,
      subscriptionExpiresAt: u.subscriptionExpiresAt,
      isWatermarkActive: u.isWatermarkActive !== undefined ? u.isWatermarkActive : (u.plan === 'trial'),
      createdAt: u.createdAt || new Date().toISOString()
    }));
    return res.json({ success: true, data: sanitized });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, error: 'Gagal memuat daftar user.' });
  }
});

// Admin Dashboard: Add New User (Protected by requireAuthUser + requireAdminUser + Rate Limit)
app.post('/api/admin/users', requireAuthUser, requireAdminUser, authSensitiveUserRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { username, password, name, plan, isWatermarkActive } = req.body;
  if (!username || !password || !name) {
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

  if (cleanUsername === 'admin') {
    return res.status(400).json({
      success: false,
      error: 'Username "admin" tidak dapat dibuat ulang karena merupakan akun bawaan Administrator.'
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
      error: `Username "${cleanUsername}" sudah digunakan oleh user lain.`
    });
  }

  const selectedPlan = plan === 'trial' ? 'trial' : (plan === 'yearly' ? 'yearly' : 'monthly');
  const watermarkStatus = isWatermarkActive !== undefined ? Boolean(isWatermarkActive) : (selectedPlan === 'trial');

  const newUser = await db.createUser({
    username: cleanUsername,
    password,
    name: name.trim(),
    email: '',
    phone: '',
    plan: selectedPlan,
    trialExpiresAt: selectedPlan === 'trial' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
    subscriptionExpiresAt: selectedPlan !== 'trial' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
    isWatermarkActive: watermarkStatus,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({
    success: true,
    message: `User baru "${newUser.username}" berhasil ditambahkan ke sistem.`,
    user: {
      username: newUser.username,
      name: newUser.name,
      plan: newUser.plan,
      isWatermarkActive: newUser.isWatermarkActive,
      createdAt: newUser.createdAt
    }
  });
});

// ==========================================
// NFC TAGS REST API ROUTES
// ==========================================

// List all NFC tags (with live sync from linked QR codes)
app.get('/api/nfc', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const [tags, qrcodes] = await Promise.all([db.getNFCTags(), db.getQRCodes()]);
  const qrById = new Map(qrcodes.map(q => [q.id, q]));
  const qrBySlug = new Map(qrcodes.map(q => [q.slug.toLowerCase().trim(), q]));

  const syncedTags = await Promise.all(
    tags.map(async (tag: any) => {
      if (tag.syncWithQr === false) return tag;
      const linkedQr =
        (tag.linkedQrId ? qrById.get(tag.linkedQrId) : undefined) ||
        (tag.linkedQrSlug ? qrBySlug.get(String(tag.linkedQrSlug).toLowerCase().trim()) : undefined);

      if (linkedQr && linkedQr.targetUrl && linkedQr.targetUrl !== tag.googleReviewUrl) {
        const updatedTag = {
          ...tag,
          linkedQrId: tag.linkedQrId || linkedQr.id,
          linkedQrSlug: tag.linkedQrSlug || linkedQr.slug,
          linkedQrCode: tag.linkedQrCode || linkedQr.code || null,
          googleReviewUrl: linkedQr.targetUrl,
          updatedAt: linkedQr.updatedAt || new Date().toISOString()
        };
        await db.saveNFCTag(updatedTag);
        return updatedTag;
      }
      return tag;
    })
  );

  res.json({ success: true, data: syncedTags });
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

// Activate or input new NFC tag (supports auto-populating from existing QR Code data & physical tap scan)
app.post('/api/nfc/activate', async (req: Request, res: Response) => {
  const {
    placeName,
    googleReviewUrl,
    pin,
    requirePinOnTap,
    linkedQrId,
    linkedQrSlug,
    linkedQrCode,
    syncWithQr,
    tagUid,
    notes,
    initialRecord
  } = req.body;

  if (!pin || String(pin).trim().length < 4) {
    return res.status(400).json({
      success: false,
      error: 'PIN keamanan NFC wajib diisi minimal 4 karakter/angka.'
    });
  }

  let resolvedPlaceName = (placeName || '').trim();
  let resolvedUrl = (googleReviewUrl || '').trim();
  let resolvedQrId = linkedQrId || null;
  let resolvedQrSlug = linkedQrSlug || null;
  let resolvedQrCode = linkedQrCode || null;
  let resolvedNotes = (notes || '').trim();

  // Auto-read from existing QR Code list if linkedQrId is provided
  if (resolvedQrId) {
    const existingQr = await db.getQRCodeById(resolvedQrId);
    if (existingQr) {
      if (!resolvedPlaceName) resolvedPlaceName = existingQr.title;
      if (!resolvedUrl) resolvedUrl = existingQr.targetUrl;
      resolvedQrSlug = resolvedQrSlug || existingQr.slug;
      resolvedQrCode = resolvedQrCode || existingQr.code || null;
      if (!resolvedNotes) {
        resolvedNotes = existingQr.notes || `Terhubung otomatis ke ${existingQr.code || existingQr.slug}`;
      }
    }
  }

  if (!resolvedPlaceName || !resolvedUrl) {
    return res.status(400).json({
      success: false,
      error: 'Nama tempat/judul dan URL tujuan wajib diisi atau dipilih dari daftar QR Code.'
    });
  }

  if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
    resolvedUrl = 'https://' + resolvedUrl;
  }

  const tags = await db.getNFCTags();
  const now = new Date().toISOString();

  // Check if hardware UID is already registered
  const normalizedUid = tagUid ? String(tagUid).trim().toUpperCase() : '';
  if (normalizedUid) {
    const duplicateUid = tags.find((t: any) => (t.tagUid || '').trim().toUpperCase() === normalizedUid);
    if (duplicateUid) {
      return res.status(409).json({
        success: false,
        error: `Chip NFC dengan UID ${normalizedUid} sudah terdaftar atas nama "${duplicateUid.placeName}". Gunakan menu Ubah Link (PIN) untuk memperbaruinya.`
      });
    }
  }

  let cleanId = 'nfc-' + resolvedPlaceName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
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

  const autoUid = normalizedUid || [
    '04',
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    '80'
  ].join(':');

  const tapHistory: NFCTapRecord[] = [];
  if (initialRecord) {
    const ua = parseUserAgent(req.headers['user-agent']);
    tapHistory.push({
      id: 'tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      tagId: finalId,
      tagUid: autoUid,
      timestamp: now,
      device: ua.device,
      os: ua.os,
      browser: ua.browser,
      source: 'auto-scan',
      pinVerified: true,
      readPayload: typeof initialRecord === 'string' ? initialRecord : 'Aktivasi Tempel Tag NFC'
    });
  }

  const newTag = {
    id: finalId,
    tagUid: autoUid,
    placeName: resolvedPlaceName,
    googleReviewUrl: resolvedUrl,
    pin: String(pin).trim(),
    requirePinOnTap: false,
    linkedQrId: resolvedQrId,
    linkedQrSlug: resolvedQrSlug,
    linkedQrCode: resolvedQrCode,
    syncWithQr: resolvedQrId ? syncWithQr !== false : false,
    status: 'active',
    totalTaps: tapHistory.length,
    lastTappedAt: tapHistory.length > 0 ? now : null,
    notes: resolvedNotes || 'Aktivasi NFC Tag',
    tapHistory,
    createdAt: now,
    updatedAt: now
  };

  await db.saveNFCTag(newTag);
  void broadcastSyncEvent('nfc:created', { tag: newTag });

  res.status(201).json({
    success: true,
    data: newTag,
    redirectUrl: `/nfc/${newTag.id}`,
    message: `Tag NFC untuk "${newTag.placeName}" berhasil diaktivasi dengan proteksi PIN!`
  });
});

// Auto-read and record physical NFC tag tap/scan
app.post('/api/nfc/scan-record', async (req: Request, res: Response) => {
  try {
    const { tagUid, scannedUrl, scannedText, source = 'auto-scan', pin } = req.body;
    const cleanUid = (tagUid || '').trim().toUpperCase();
    const rawPayload = (scannedUrl || scannedText || '').trim();

    let matchedTag: any = null;

    // 1. Try matching by hardware tag UID
    if (cleanUid) {
      matchedTag = await db.getNFCTagByUid(cleanUid);
    }

    // 2. Try matching by /nfc/:id or /n/:id extracted from NDEF URL payload
    if (!matchedTag && rawPayload) {
      const nfcMatch = rawPayload.match(/\/(?:nfc|n)\/([^/?#\s]+)/i);
      if (nfcMatch?.[1]) {
        matchedTag = await db.getNFCTagById(decodeURIComponent(nfcMatch[1]));
      }
    }

    if (matchedTag) {
      if (matchedTag.status === 'pending') {
        return res.json({
          success: true,
          matchedType: 'pending-nfc',
          unactivated: true,
          tagId: matchedTag.id,
          tagUid: cleanUid || matchedTag.tagUid,
          linkedQrCode: matchedTag.linkedQrCode || null,
          scannedPayload: rawPayload || `/nfc/${matchedTag.id}`,
          message: `Tag NFC "/nfc/${matchedTag.id}" belum diaktivasi. Silakan masuk ke Aktivasi Tag NFC Mandiri.`
        });
      }

      if (matchedTag.status === 'locked') {
        return res.status(403).json({
          success: false,
          matchedType: 'nfc',
          locked: true,
          tag: matchedTag,
          error: `Tag NFC "${matchedTag.placeName}" sedang dikunci.`
        });
      }

      // Sync linked QR url if enabled
      if (matchedTag.linkedQrId && matchedTag.syncWithQr !== false) {
        const linkedQr = await db.getQRCodeById(matchedTag.linkedQrId);
        if (linkedQr?.targetUrl) {
          matchedTag.googleReviewUrl = linkedQr.targetUrl;
        }
      }

      const ua = parseUserAgent(req.headers['user-agent']);
      const now = new Date().toISOString();
      const record: NFCTapRecord = {
        id: 'tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        tagId: matchedTag.id,
        tagUid: cleanUid || matchedTag.tagUid,
        timestamp: now,
        device: ua.device,
        os: ua.os,
        browser: ua.browser,
        source: source === 'simulation' ? 'simulation' : 'auto-scan',
        pinVerified: false,
        readPayload: rawPayload || `/nfc/${matchedTag.id}`
      };

      matchedTag.totalTaps = (matchedTag.totalTaps || 0) + 1;
      matchedTag.lastTappedAt = now;
      matchedTag.tapHistory = [record, ...(Array.isArray(matchedTag.tapHistory) ? matchedTag.tapHistory : [])].slice(0, 100);
      await db.saveNFCTag(matchedTag);
      void broadcastSyncEvent('nfc:tapped', { tag: matchedTag });

      return res.json({
        success: true,
        matchedType: 'nfc',
        tag: matchedTag,
        record,
        targetUrl: matchedTag.googleReviewUrl,
        message: `Tag NFC "${matchedTag.placeName}" terbaca dan berhasil direcord!`
      });
    }

    // 3. Check if NDEF payload points to an existing QR Code (/r/:slug)
    if (rawPayload) {
      const qrMatch = rawPayload.match(/\/r\/([^/?#\s]+)/i);
      if (qrMatch?.[1]) {
        const cleanSlug = decodeURIComponent(qrMatch[1]).replace(/\.png$/i, '').trim().toLowerCase();
        const qr = await db.getQRCodeBySlug(cleanSlug);
        if (qr) {
          return res.json({
            success: true,
            matchedType: 'qr',
            qr,
            tagUid: cleanUid || undefined,
            scannedPayload: rawPayload,
            message: `Terdeteksi data QR Code "${qr.title}" (${qr.code || qr.slug}). Siap diaktivasi ke NFC Tag!`
          });
        }
      }
    }

    return res.json({
      success: true,
      matchedType: 'blank',
      tagUid: cleanUid || undefined,
      scannedPayload: rawPayload || undefined,
      message: cleanUid
        ? `Tag NFC baru dengan UID ${cleanUid} terbaca. Pilih data QR Code untuk mengaktivasi.`
        : 'Tag NFC baru terbaca dan siap diaktivasi.'
    });
  } catch (err: any) {
    console.error('[NFC Scan Record] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal membaca dan merecord data tag NFC: ' + (err?.message || 'Error')
    });
  }
});

// Verify NFC PIN for tap, programming chip, or management actions
app.post('/api/nfc/:id/verify-pin', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pin, action = 'manage', source = 'nfc-tap', readPayload } = req.body;

    const tag = await db.getNFCTagById(id);
    if (!tag) {
      return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan.' });
    }

    if (!pin || String(pin).trim() !== String(tag.pin).trim()) {
      return res.status(403).json({
        success: false,
        error: 'PIN keamanan NFC salah! Akses ditolak.'
      });
    }

    if (action === 'tap') {
      if (tag.status === 'locked') {
        return res.status(403).json({
          success: false,
          error: `Tag NFC "${tag.placeName}" sedang dikunci.`
        });
      }

      if (tag.linkedQrId && tag.syncWithQr !== false) {
        const linkedQr = await db.getQRCodeById(tag.linkedQrId);
        if (linkedQr?.targetUrl) {
          tag.googleReviewUrl = linkedQr.targetUrl;
        }
      }

      const ua = parseUserAgent(req.headers['user-agent']);
      const now = new Date().toISOString();
      const record: NFCTapRecord = {
        id: 'tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        tagId: tag.id,
        tagUid: tag.tagUid,
        timestamp: now,
        device: ua.device,
        os: ua.os,
        browser: ua.browser,
        source: source === 'simulation' ? 'simulation' : source === 'auto-scan' ? 'auto-scan' : 'nfc-tap',
        pinVerified: true,
        readPayload: readPayload || `/nfc/${tag.id}`
      };

      tag.totalTaps = (tag.totalTaps || 0) + 1;
      tag.lastTappedAt = now;
      tag.tapHistory = [record, ...(Array.isArray(tag.tapHistory) ? tag.tapHistory : [])].slice(0, 100);
      await db.saveNFCTag(tag);
      void broadcastSyncEvent('nfc:tapped', { tag });

      let targetUrl = tag.googleReviewUrl.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      return res.json({
        success: true,
        verified: true,
        totalTaps: tag.totalTaps,
        targetUrl,
        record,
        data: tag,
        message: 'PIN terverifikasi! Tap NFC berhasil direcord.'
      });
    }

    return res.json({
      success: true,
      verified: true,
      data: tag,
      message: 'PIN keamanan NFC terverifikasi.'
    });
  } catch (err: any) {
    console.error('[NFC Verify PIN] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal memverifikasi PIN NFC: ' + (err?.message || 'Error')
    });
  }
});

// Update NFC tag (requires strict PIN verification)
app.put('/api/nfc/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      placeName,
      googleReviewUrl,
      pin,
      newPin,
      requirePinOnTap,
      linkedQrId,
      linkedQrSlug,
      linkedQrCode,
      syncWithQr,
      status,
      notes,
      tagData
    } = req.body;

    let tag = await db.getNFCTagById(id);
    if (!tag) {
      if (tagData) {
        tag = {
          ...tagData,
          id,
          placeName: placeName !== undefined ? placeName.trim() : tagData.placeName,
          googleReviewUrl: googleReviewUrl !== undefined ? googleReviewUrl.trim() : tagData.googleReviewUrl,
          pin: newPin ? String(newPin).trim() : tagData.pin,
          requirePinOnTap: false,
          linkedQrId: linkedQrId !== undefined ? linkedQrId : tagData.linkedQrId,
          linkedQrSlug: linkedQrSlug !== undefined ? linkedQrSlug : tagData.linkedQrSlug,
          linkedQrCode: linkedQrCode !== undefined ? linkedQrCode : tagData.linkedQrCode,
          syncWithQr: syncWithQr !== undefined ? Boolean(syncWithQr) : tagData.syncWithQr,
          status: status || tagData.status,
          notes: notes !== undefined ? notes : tagData.notes,
          updatedAt: new Date().toISOString()
        };
      } else {
        return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
      }
    } else {
      // Strict PIN check (cannot be bypassed with empty pin)
      if (!pin || String(pin).trim() !== String(tag.pin).trim()) {
        return res.status(403).json({
          success: false,
          error: 'PIN NFC Tag wajib diisi dan harus sesuai! Perubahan ditolak.'
        });
      }

      if (newPin !== undefined && String(newPin).trim().length > 0) {
        if (String(newPin).trim().length < 4) {
          return res.status(400).json({
            success: false,
            error: 'PIN baru minimal 4 karakter/angka.'
          });
        }
        tag.pin = String(newPin).trim();
      }

      if (placeName !== undefined) tag.placeName = placeName.trim();
      if (googleReviewUrl !== undefined) tag.googleReviewUrl = googleReviewUrl.trim();
      tag.requirePinOnTap = false;
      if (linkedQrId !== undefined) tag.linkedQrId = linkedQrId;
      if (linkedQrSlug !== undefined) tag.linkedQrSlug = linkedQrSlug;
      if (linkedQrCode !== undefined) tag.linkedQrCode = linkedQrCode;
      if (syncWithQr !== undefined) tag.syncWithQr = Boolean(syncWithQr);
      if (status !== undefined) tag.status = status;
      if (notes !== undefined) tag.notes = notes;
      tag.updatedAt = new Date().toISOString();
    }

    try {
      await db.saveNFCTag(tag);
      void broadcastSyncEvent('nfc:updated', { tag });
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

// Delete NFC tag (strict PIN verification)
app.delete('/api/nfc/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pin } = req.body;
  const tag = await db.getNFCTagById(id);

  if (!tag) {
    return res.status(404).json({ success: false, error: 'Tag NFC tidak ditemukan' });
  }

  if (!pin || String(pin).trim() !== String(tag.pin).trim()) {
    return res.status(403).json({ success: false, error: 'PIN NFC Tag salah atau kosong. Penghapusan dibatalkan.' });
  }

  await db.deleteNFCTag(id);
  void broadcastSyncEvent('nfc:deleted', { id });
  res.json({ success: true, message: 'Tag NFC berhasil dihapus' });
});

// Test tap simulation (checks lock status and immediately records tap without requiring PIN)
app.post('/api/nfc/:id/test-tap', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { source = 'simulation' } = req.body || {};
  const tag = await db.getNFCTagById(id);

  if (!tag) {
    return res.status(404).json({
      success: false,
      unactivated: true,
      nfcId: id,
      error: 'Tag NFC belum teraktivasi.'
    });
  }

  if (tag.status === 'pending') {
    return res.status(403).json({
      success: false,
      unactivated: true,
      nfcId: tag.id,
      linkedQrCode: tag.linkedQrCode || null,
      error: 'Tag NFC belum diaktivasi. Silakan aktivasi menggunakan kode QR.'
    });
  }

  if (tag.status === 'locked') {
    return res.status(403).json({
      success: false,
      locked: true,
      error: `Tag NFC "${tag.placeName}" sedang dikunci dan tidak bisa diakses.`
    });
  }

  if (tag.linkedQrId && tag.syncWithQr !== false) {
    const linkedQr = await db.getQRCodeById(tag.linkedQrId);
    if (linkedQr?.targetUrl) {
      tag.googleReviewUrl = linkedQr.targetUrl;
    }
  }

  const ua = parseUserAgent(req.headers['user-agent']);
  const now = new Date().toISOString();
  const record: NFCTapRecord = {
    id: 'tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    tagId: tag.id,
    tagUid: tag.tagUid,
    timestamp: now,
    device: ua.device,
    os: ua.os,
    browser: ua.browser,
    source: source === 'nfc-tap' ? 'nfc-tap' : source === 'auto-scan' ? 'auto-scan' : 'simulation',
    pinVerified: false,
    readPayload: `/nfc/${tag.id}`
  };

  tag.totalTaps = (tag.totalTaps || 0) + 1;
  tag.lastTappedAt = now;
  tag.tapHistory = [record, ...(Array.isArray(tag.tapHistory) ? tag.tapHistory : [])].slice(0, 100);
  await db.saveNFCTag(tag);
  void broadcastSyncEvent('nfc:tapped', { tag });

  let targetUrl = (tag.googleReviewUrl || '').trim();
  if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  res.json({
    success: true,
    message: `Tap NFC pada "${tag.placeName}" berhasil dan langsung dialihkan ke tautan tujuan!`,
    totalTaps: tag.totalTaps,
    targetUrl,
    record,
    data: tag
  });
});

// ==========================================
// PUBLIC SELF-ACTIVATION API (No Username/Password Required)
// Restricted strictly to activating unactivated NFC tags via QR codes (e.g., QR001)
// ==========================================
function normalizeQRCodeKey(value?: string | null): string {
  return String(value || '').replace(/[\s_-]+/g, '').toUpperCase().trim();
}

function extractQRCodeNum(code?: string | null): number {
  const match = String(code || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

app.get('/api/public/qrcodes/activation', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const rawQuery = String(req.query.q || '').trim();
    const normQuery = normalizeQRCodeKey(rawQuery);
    const lowerQuery = rawQuery.toLowerCase();

    const [qrcodes, nfcTags] = await Promise.all([db.getQRCodes(), db.getNFCTags()]);

    const nfcCountByQrId = new Map<string, number>();
    for (const tag of nfcTags) {
      if (tag.status !== 'pending' && tag.linkedQrId) {
        nfcCountByQrId.set(tag.linkedQrId, (nfcCountByQrId.get(tag.linkedQrId) || 0) + 1);
      }
    }

    const mapped = qrcodes
      .filter((qr) => qr.status !== 'paused')
      .filter((qr) => {
        if (!rawQuery) return true;
        const normCode = normalizeQRCodeKey(qr.code);
        const normSlug = normalizeQRCodeKey(qr.slug);
        return (
          (normQuery && normCode.includes(normQuery)) ||
          (normQuery && normSlug.includes(normQuery)) ||
          (qr.code || '').toLowerCase().includes(lowerQuery) ||
          qr.slug.toLowerCase().includes(lowerQuery) ||
          qr.title.toLowerCase().includes(lowerQuery)
        );
      })
      .sort((a, b) => {
        const numDiff = extractQRCodeNum(a.code) - extractQRCodeNum(b.code);
        if (numDiff !== 0) return numDiff;
        return String(a.code || a.slug).localeCompare(String(b.code || b.slug));
      })
      .map((qr) => ({
        id: qr.id,
        code: qr.code || `QR-${qr.slug.toUpperCase()}`,
        normalizedCode: normalizeQRCodeKey(qr.code || qr.slug),
        slug: qr.slug,
        title: qr.title,
        targetUrl: qr.targetUrl,
        status: qr.status,
        notes: qr.notes || '',
        linkedNfcCount: nfcCountByQrId.get(qr.id) || 0
      }));

    res.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error('[Public Activation QR List] Error:', err);
    res.status(500).json({ success: false, error: 'Gagal memuat daftar kode QR untuk aktivasi.' });
  }
});

app.get('/api/public/nfc/status/:id', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const cleanId = decodeURIComponent(String(req.params.id || '')).trim().replace(/\/+$/, '');
    if (!cleanId) {
      return res.status(400).json({ success: false, error: 'ID Tag NFC tidak valid.' });
    }
    const tag = await db.getNFCTagById(cleanId);
    if (!tag) {
      return res.json({
        success: true,
        exists: false,
        activated: false,
        id: cleanId
      });
    }
    if (tag.status === 'pending') {
      return res.json({
        success: true,
        exists: true,
        activated: false,
        id: tag.id,
        status: 'pending',
        placeName: tag.placeName || '',
        linkedQrId: tag.linkedQrId || null,
        linkedQrCode: tag.linkedQrCode || null
      });
    }
    return res.json({
      success: true,
      exists: true,
      activated: true,
      id: tag.id,
      status: tag.status,
      placeName: tag.placeName,
      targetUrl: tag.googleReviewUrl,
      linkedQrCode: tag.linkedQrCode || null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Gagal memeriksa status tag NFC.' });
  }
});

app.post('/api/public/nfc/self-activate', publicActivationRateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      requestedTagId,
      qrId,
      qrCode,
      placeName,
      googleReviewUrl,
      pin,
      tagUid,
      notes,
      syncQrTarget,
      initialRecord
    } = req.body || {};

    const qrcodes = await db.getQRCodes();
    const normInputCode = normalizeQRCodeKey(qrCode);
    const matchedQr =
      (qrId ? qrcodes.find((q) => q.id === qrId) : undefined) ||
      (normInputCode ? qrcodes.find((q) => normalizeQRCodeKey(q.code) === normInputCode) : undefined) ||
      (normInputCode ? qrcodes.find((q) => normalizeQRCodeKey(q.slug) === normInputCode) : undefined);

    if (!matchedQr) {
      return res.status(400).json({
        success: false,
        error: 'Kode QR tidak ditemukan. Silakan masukkan kode seperti QR001 lalu klik kode QR dari daftar.'
      });
    }

    const tags = await db.getNFCTags();
    const cleanRequestedId = typeof requestedTagId === 'string'
      ? requestedTagId.trim().replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      : '';

    let existingPendingTag: any = null;
    if (cleanRequestedId) {
      const existingById = tags.find((t: any) => t.id === cleanRequestedId);
      if (existingById) {
        if (existingById.status !== 'pending') {
          return res.status(409).json({
            success: false,
            alreadyActivated: true,
            error: `Tag NFC "/nfc/${existingById.id}" sudah teraktivasi sebelumnya atas nama "${existingById.placeName}".`
          });
        }
        existingPendingTag = existingById;
      }
    }

    const normalizedUid = tagUid ? String(tagUid).trim().toUpperCase() : '';
    if (normalizedUid) {
      const duplicateUid = tags.find(
        (t: any) =>
          (t.tagUid || '').trim().toUpperCase() === normalizedUid &&
          (!existingPendingTag || t.id !== existingPendingTag.id)
      );
      if (duplicateUid) {
        return res.status(409).json({
          success: false,
          error: `Chip NFC dengan UID ${normalizedUid} sudah teraktivasi atas nama "${duplicateUid.placeName}".`
        });
      }
    }

    const rawPin = typeof pin === 'string' ? pin.trim() : '';
    if (rawPin.length > 0 && rawPin.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Jika diisi, PIN keamanan minimal 4 karakter/angka.'
      });
    }
    const finalPin = rawPin.length >= 4
      ? rawPin
      : String(Math.floor(1000 + Math.random() * 9000));

    const resolvedPlaceName = (placeName || '').trim() || matchedQr.title;
    let resolvedUrl = (googleReviewUrl || '').trim() || matchedQr.targetUrl;
    if (!resolvedUrl) {
      return res.status(400).json({
        success: false,
        error: 'Tautan tujuan (Google Review) wajib diisi.'
      });
    }
    if (!/^https?:\/\//i.test(resolvedUrl)) {
      resolvedUrl = 'https://' + resolvedUrl;
    }

    let finalId = existingPendingTag?.id || cleanRequestedId;
    if (!finalId) {
      let baseSlug = 'nfc-' + normalizeQRCodeKey(matchedQr.code || matchedQr.slug).toLowerCase();
      if (baseSlug === 'nfc-' || baseSlug.length < 5) {
        baseSlug = 'nfc-' + Math.random().toString(36).substring(2, 7);
      }
      finalId = baseSlug;
      let counter = 1;
      while (tags.some((t: any) => t.id === finalId)) {
        finalId = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const now = new Date().toISOString();
    const autoUid = normalizedUid || existingPendingTag?.tagUid || [
      '04',
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      '80'
    ].join(':');

    const tapHistory: NFCTapRecord[] = Array.isArray(existingPendingTag?.tapHistory)
      ? [...existingPendingTag.tapHistory]
      : [];
    if (initialRecord) {
      const ua = parseUserAgent(req.headers['user-agent']);
      tapHistory.unshift({
        id: 'tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        tagId: finalId,
        tagUid: autoUid,
        timestamp: now,
        device: ua.device,
        os: ua.os,
        browser: ua.browser,
        source: 'auto-scan',
        pinVerified: false,
        readPayload: typeof initialRecord === 'string' ? initialRecord : 'Aktivasi Mandiri User'
      });
    }

    const shouldSyncQr = Boolean(syncQrTarget);
    if (shouldSyncQr && resolvedUrl !== matchedQr.targetUrl) {
      const updatedQr: DynamicQRCode = {
        ...matchedQr,
        targetUrl: resolvedUrl,
        title: resolvedPlaceName || matchedQr.title,
        updatedAt: now,
        urlHistory: [
          {
            url: resolvedUrl,
            changedAt: now,
            reason: `Aktivasi Mandiri NFC (${matchedQr.code || matchedQr.slug})`
          },
          ...(Array.isArray(matchedQr.urlHistory) ? matchedQr.urlHistory : [])
        ]
      };
      await db.saveQRCode(updatedQr);
      void broadcastSyncEvent('qr:updated', { qr: updatedQr });
    }

    const activatedTag = {
      ...(existingPendingTag || {}),
      id: finalId,
      tagUid: autoUid,
      placeName: resolvedPlaceName,
      googleReviewUrl: resolvedUrl,
      pin: finalPin,
      requirePinOnTap: false,
      linkedQrId: matchedQr.id,
      linkedQrSlug: matchedQr.slug,
      linkedQrCode: matchedQr.code || null,
      syncWithQr: shouldSyncQr || resolvedUrl === matchedQr.targetUrl,
      status: 'active',
      totalTaps: tapHistory.length,
      lastTappedAt: tapHistory.length > 0 ? now : null,
      notes: (notes || '').trim() || `Aktivasi mandiri via ${matchedQr.code || matchedQr.slug}`,
      tapHistory,
      createdAt: existingPendingTag?.createdAt || now,
      updatedAt: now
    };

    await db.saveNFCTag(activatedTag);
    void broadcastSyncEvent(existingPendingTag ? 'nfc:updated' : 'nfc:created', { tag: activatedTag });

    const { pin: _hiddenPin, ...publicTagData } = activatedTag;
    return res.status(201).json({
      success: true,
      data: publicTagData,
      recoveryPin: finalPin,
      redirectUrl: `/nfc/${activatedTag.id}`,
      message: `Tag NFC untuk "${activatedTag.placeName}" berhasil diaktivasi melalui kode ${matchedQr.code || matchedQr.slug}!`
    });
  } catch (err: any) {
    console.error('[Public Self-Activate NFC] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal melakukan aktivasi mandiri NFC: ' + (err?.message || 'Error')
    });
  }
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
    void broadcastSyncEvent('qr:batch-created', { qrcodes: createdItems });

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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const qrcodes = await db.getQRCodes();
  res.json({ success: true, data: qrcodes });
});

// Get single QR code
app.get('/api/qrcodes/:id', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const { id } = req.params;
  const qr = await db.getQRCodeById(id);
  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not found' });
  }
  res.json({ success: true, data: qr });
});

// Get QR code by slug
app.get('/api/qrcodes/slug/:slug', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const { slug } = req.params;
  const qr = await db.getQRCodeBySlug(slug);
  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
  }
  res.json({ success: true, data: qr });
});

// Bulk sync slugs / QR codes to server persistence (Postgres / Vercel KV / local cache)
app.post('/api/qrcodes/sync-cloud', async (req: Request, res: Response) => {
  const { slugMap, qrcodes } = req.body;
  await syncAllSlugsToCloud(slugMap || {}, Array.isArray(qrcodes) ? qrcodes : undefined);
  void broadcastSyncEvent('snapshot', {});
  res.json({ success: true, message: 'Cloud sync updated' });
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
      void broadcastSyncEvent('qr:created', { qr: newQR });
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
    const { title, targetUrl, slug, status, tags, notes, style, password, expiryDate, utm, reason, qrData } = req.body;

    let current = await db.getQRCodeById(id);
    if (!current && (slug || qrData?.slug)) {
      current = await db.getQRCodeBySlug(String(slug || qrData.slug));
    }

    const previousTargetUrl = current?.targetUrl;
    const previousTitle = current?.title;
    const now = new Date().toISOString();
    let urlChanged = false;

    const normalizeUrl = (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return trimmed;
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    if (!current) {
      // Recover from client qrData if serverless cold start didn't have this QR in local cache yet
      if (qrData) {
        const finalTarget = normalizeUrl(targetUrl || qrData.targetUrl || 'https://google.com');
        current = {
          ...qrData,
          id,
          slug: String(slug || qrData.slug || id).trim().toLowerCase(),
          targetUrl: finalTarget,
          updatedAt: now,
          urlHistory: [
            {
              url: finalTarget,
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
      const normalizedNewUrl = targetUrl ? normalizeUrl(targetUrl) : '';
      if (normalizedNewUrl && normalizedNewUrl !== current.targetUrl) {
        urlChanged = true;
        current.urlHistory = current.urlHistory || [];
        current.urlHistory.unshift({
          url: normalizedNewUrl,
          changedAt: now,
          reason: reason || 'Pembaruan tautan tujuan'
        });
        current.targetUrl = normalizedNewUrl;
      }

      if (title !== undefined) current.title = String(title).trim();
      if (status !== undefined) current.status = status;
      if (tags !== undefined) current.tags = Array.isArray(tags) ? tags : [];
      if (notes !== undefined) current.notes = notes;
      if (style !== undefined) current.style = { ...(current.style || {}), ...style };
      if (password !== undefined) current.password = password ? String(password).trim() : undefined;
      if (expiryDate !== undefined) current.expiryDate = expiryDate || undefined;
      if (utm !== undefined) current.utm = utm || undefined;
      current.updatedAt = now;
    }

    if (!current) {
      return res.status(404).json({ success: false, error: 'QR Code tidak ditemukan' });
    }

    await db.saveQRCode(current);

    // Automatically propagate QR link updates to linked NFC tags
    const syncedNfcTags: any[] = [];
    try {
      const allNfcTags = await db.getNFCTags();
      const qrSlugLower = (current.slug || '').trim().toLowerCase();
      const qrCodeLower = (current.code || '').trim().toLowerCase();
      const prevTitleLower = (previousTitle || '').trim().toLowerCase();

      for (const nfcTag of allNfcTags) {
        if (nfcTag.syncWithQr === false) continue;

        const matchesById = Boolean(nfcTag.linkedQrId && nfcTag.linkedQrId === current.id);
        const matchesBySlug = Boolean(
          qrSlugLower && nfcTag.linkedQrSlug && String(nfcTag.linkedQrSlug).trim().toLowerCase() === qrSlugLower
        );
        const matchesByCode = Boolean(
          qrCodeLower && nfcTag.linkedQrCode && String(nfcTag.linkedQrCode).trim().toLowerCase() === qrCodeLower
        );
        const matchesByRedirectSlug = Boolean(
          qrSlugLower && typeof nfcTag.googleReviewUrl === 'string' && nfcTag.googleReviewUrl.toLowerCase().includes(`/r/${qrSlugLower}`)
        );
        const matchesByLegacyTitleUrl = Boolean(
          !nfcTag.linkedQrId &&
          previousTargetUrl &&
          nfcTag.googleReviewUrl === previousTargetUrl &&
          prevTitleLower &&
          String(nfcTag.placeName || '').trim().toLowerCase() === prevTitleLower
        );

        if (matchesById || matchesBySlug || matchesByCode || matchesByRedirectSlug || matchesByLegacyTitleUrl) {
          const nextPlaceName =
            prevTitleLower && String(nfcTag.placeName || '').trim().toLowerCase() === prevTitleLower && current.title
              ? current.title
              : nfcTag.placeName;

          if (
            nfcTag.googleReviewUrl !== current.targetUrl ||
            nextPlaceName !== nfcTag.placeName ||
            nfcTag.linkedQrId !== current.id
          ) {
            const updatedTag = {
              ...nfcTag,
              placeName: nextPlaceName,
              googleReviewUrl: current.targetUrl,
              linkedQrId: current.id,
              linkedQrSlug: current.slug,
              linkedQrCode: current.code || nfcTag.linkedQrCode || null,
              syncWithQr: true,
              updatedAt: now
            };
            await db.saveNFCTag(updatedTag);
            syncedNfcTags.push(updatedTag);
          }
        }
      }
    } catch (syncErr) {
      console.warn('[NFC Sync] Warning propagating QR link update to NFC tags:', syncErr);
    }

    void broadcastSyncEvent('qr:updated', { qr: current, syncedNfcTags });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.json({
      success: true,
      data: current,
      syncedNfcTags,
      message: urlChanged
        ? syncedNfcTags.length > 0
          ? `Tautan tujuan berhasil diperbarui dan ${syncedNfcTags.length} NFC tag terhubung ikut diperbarui otomatis!`
          : 'Tautan tujuan berhasil diperbarui! QR code fisik yang dicetak akan langsung mengarah ke tautan baru.'
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
  void broadcastSyncEvent('qr:deleted', { id });
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
  void broadcastSyncEvent('qr:scanned', { qr });

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

// JSON 404 fallback for unmatched /api/* routes (never return HTML error pages for API calls)
app.all('/api/*', (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: `Endpoint API tidak ditemukan: ${req.method} ${req.path}`
  });
});

// Express JSON error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  if (res.headersSent) return;
  return res.status(err?.status || 500).json({
    success: false,
    error: err?.message || 'Terjadi kesalahan internal server'
  });
});

// Mount Vite in local development or serve static assets in production
async function startServer() {
  // If running in Vercel Serverless environment, do not start local HTTP listener or load Vite
  if (process.env.VERCEL) {
    return;
  }

  const distPath = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');

  let viteServerInstance: { close: () => Promise<void> } | null = null;
  let frontendHandler: ((req: Request, res: Response, next: NextFunction) => void) | null = null;

  const frontendReadyPromise = (async () => {
    if (process.env.NODE_ENV === 'production') {
      if (fs.existsSync(indexHtmlPath)) {
        const staticMw = express.static(distPath);
        frontendHandler = (req, res, next) => {
          staticMw(req, res, (err) => {
            if (err) return next(err);
            res.sendFile(indexHtmlPath);
          });
        };
      } else {
        console.warn('dist/index.html not found in production, mounting Vite middleware fallback');
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true, hmr: false, ws: false, watch: null, allowedHosts: true },
          appType: 'spa'
        });
        viteServerInstance = vite;
        frontendHandler = vite.middlewares;
      }
    } else {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true, hmr: false, ws: false, watch: null, allowedHosts: true },
          appType: 'spa'
        });
        viteServerInstance = vite;
        frontendHandler = vite.middlewares;
      } catch (viteErr) {
        console.warn('Vite middleware warning in dev, trying static dist fallback:', viteErr);
        if (fs.existsSync(indexHtmlPath)) {
          const staticMw = express.static(distPath);
          frontendHandler = (req, res, next) => {
            staticMw(req, res, (err) => {
              if (err) return next(err);
              res.sendFile(indexHtmlPath);
            });
          };
        }
      }
    }
  })();

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await frontendReadyPromise;
      if (frontendHandler) {
        return frontendHandler(req, res, next);
      }
    } catch (err) {
      return next(err);
    }
    return next();
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws: WebSocket) => {
    wsClients.add(ws);
    try {
      const revision = await computeCurrentRevision();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'connected',
          revision,
          timestamp: new Date().toISOString()
        }));
      }
    } catch {}

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.type === 'ping' && ws.readyState === WebSocket.OPEN) {
          const revision = await computeCurrentRevision();
          ws.send(JSON.stringify({
            type: 'pong',
            revision,
            timestamp: new Date().toISOString()
          }));
        }
      } catch {}
    });

    ws.on('close', () => {
      wsClients.delete(ws);
    });
    ws.on('error', () => {
      wsClients.delete(ws);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Projecttapp server running on http://0.0.0.0:${PORT}`);
  });
  server.on('error', (err: any) => {
    console.error(`Projecttapp server error on port ${PORT}:`, err);
  });

  const shutdown = async () => {
    for (const client of wsClients) {
      try { client.close(); } catch {}
    }
    wsClients.clear();
    for (const res of sseClients) {
      try { res.end(); } catch {}
    }
    sseClients.clear();
    try { wss.close(); } catch {}
    server.close();
    if (viteServerInstance) {
      try {
        await viteServerInstance.close();
      } catch {}
    }
    process.exit(0);
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

export { app };
export default app;
