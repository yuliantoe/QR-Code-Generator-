import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DynamicQRCode, ScanRecord } from './src/types.ts';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine writable directory for file fallback (use /tmp in serverless environments like Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.resolve('/tmp', 'dinamis-data') : path.resolve(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create DATA_DIR:', e);
  }
}

const QR_FILE = path.resolve(DATA_DIR, 'qrcodes.json');
const SCANS_FILE = path.resolve(DATA_DIR, 'scans.json');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const NFC_FILE = path.resolve(DATA_DIR, 'nfc_tags.json');

export interface UserRecord {
  username: string;
  password?: string;
  name: string;
  email?: string;
  phone?: string;
  plan: 'trial' | 'monthly' | 'yearly';
  trialExpiresAt?: string | null;
  subscriptionExpiresAt?: string | null;
  isWatermarkActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Default initial data
const initialUsers: UserRecord[] = [
  {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: 'Administrator',
    email: 'admin@dinamisqr.com',
    phone: '',
    plan: 'monthly',
    trialExpiresAt: null,
    subscriptionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    isWatermarkActive: false,
    createdAt: new Date().toISOString()
  }
];

const initialQRCodes: DynamicQRCode[] = [
  {
    id: 'qr-meja-01',
    code: 'QR 001',
    slug: 'menu-meja-01',
    title: 'Stand Meja 01 (Akrilik Kasir / Meja)',
    targetUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ['Meja Makan', 'Stand Meja', 'Menu PDF'],
    notes: 'Dicetak di stand akrilik meja 01.',
    totalScans: 842,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    urlHistory: [
      {
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        reason: 'Menu Musim Hujan Awal'
      }
    ],
    style: {
      fgColor: '#104F38',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI SAYA',
      frameColor: '#104F38',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  },
  {
    id: 'qr-menu-resto',
    code: 'QR 001',
    slug: 'menu-resto',
    title: 'Daftar Menu Restoran & Kafe (Meja Akrilik 01-25)',
    targetUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    tags: ['Restoran', 'Meja Cetak', 'Buku Menu'],
    notes: 'Dicetak di 25 stand akrilik meja.',
    totalScans: 842,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    urlHistory: [
      {
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        reason: 'Pembaruan Menu Baru Spesial Chef'
      }
    ],
    style: {
      fgColor: '#104F38',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI UNTUK DAFTAR MENU',
      frameColor: '#104F38',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  },
  {
    id: 'qr-kemasan-kopi',
    code: 'QR 002',
    slug: 'kopi-speciality',
    title: 'Stiker Kemasan Kopi Robusta 250gr (5.000 Pcs Cetak)',
    targetUrl: 'https://shopee.co.id',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    tags: ['Packaging', 'Stiker Cetak', 'Shopee'],
    notes: 'Stiker kemasan kopi fisik.',
    totalScans: 1394,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    urlHistory: [
      {
        url: 'https://shopee.co.id',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        reason: 'Dialihkan ke Toko Shopee Flash Sale'
      }
    ],
    style: {
      fgColor: '#104F38',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI SAYA',
      frameColor: '#104F38',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  },
  {
    id: 'qr-kartu-nama',
    code: 'QR 003',
    slug: 'kartu-nama-ceo',
    title: 'Kartu Nama Bisnis Eksekutif & Kontak WhatsApp',
    targetUrl: 'https://wa.me/6281234567890',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    tags: ['Kartu Nama', 'WhatsApp', 'Founder'],
    notes: 'Kartu nama kertas PVC premium.',
    totalScans: 289,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    urlHistory: [
      {
        url: 'https://wa.me/6281234567890',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        reason: 'Tautan Awal WhatsApp Direct'
      }
    ],
    style: {
      fgColor: '#104F38',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI SAYA',
      frameColor: '#104F38',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  },
  {
    id: 'qr-whatsapp-order',
    code: 'QR 004',
    slug: 'wa-order',
    title: 'WhatsApp CS & Pemesanan Meja Langsung',
    targetUrl: 'https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20info',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tags: ['WhatsApp', 'Customer Service', 'Order'],
    notes: 'Dicetak di stand meja akrilik untuk chat langsung tanpa simpan nomor HP.',
    totalScans: 412,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    urlHistory: [
      {
        url: 'https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20info',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        reason: 'Tautan WhatsApp CS & Pesan Meja'
      }
    ],
    style: {
      fgColor: '#075E54',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'CHAT WHATSAPP',
      frameColor: '#25D366',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'whatsapp'
    }
  },
  {
    id: 'qr-instagram-official',
    code: 'QR 005',
    slug: 'ig-official',
    title: 'Instagram Resmi Promo & Menu Spesial',
    targetUrl: 'https://instagram.com/restoran_official',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tags: ['Instagram', 'Sosial Media', 'Promo'],
    notes: 'Dicetak di stand meja untuk ajakan follow & tag IG story.',
    totalScans: 578,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    urlHistory: [
      {
        url: 'https://instagram.com/restoran_official',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        reason: 'Tautan Profil Instagram Resmi'
      }
    ],
    style: {
      fgColor: '#833AB4',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'FOLLOW INSTAGRAM',
      frameColor: '#E1306C',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'instagram'
    }
  },
  {
    id: 'qr-tiktok-promo',
    code: 'QR 006',
    slug: 'tiktok-promo',
    title: 'TikTok Video Viral & Review Kuliner',
    targetUrl: 'https://tiktok.com/@restoran_official',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    tags: ['TikTok', 'Video Viral', 'Review'],
    notes: 'Dicetak di stand meja & kasir untuk tonton konten seru.',
    totalScans: 724,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    urlHistory: [
      {
        url: 'https://tiktok.com/@restoran_official',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        reason: 'Tautan Akun TikTok Resmi'
      }
    ],
    style: {
      fgColor: '#000000',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'FOLLOW TIKTOK',
      frameColor: '#000000',
      frameTextColor: '#00F2FE',
      logoType: 'none',
      logo: ''
    }
  },
  {
    id: 'qr-facebook-fanspage',
    code: 'QR 007',
    slug: 'fb-fanspage',
    title: 'Facebook Fanspage & Komunitas Pelanggan',
    targetUrl: 'https://facebook.com/restoran.official',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    tags: ['Facebook', 'Fanspage', 'Komunitas'],
    notes: 'Dicetak di stand akrilik untuk info event dan promo komunitas.',
    totalScans: 215,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    urlHistory: [
      {
        url: 'https://facebook.com/restoran.official',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        reason: 'Tautan Halaman Facebook Resmi'
      }
    ],
    style: {
      fgColor: '#1877F2',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'GABUNG FACEBOOK',
      frameColor: '#1877F2',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'web'
    }
  }
];

const initialNFCTags = [
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
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
];

// ----------------------------------------------------
// UPSTASH / VERCEL KV REST CLIENT (Zero-dependency persistence for Vercel)
// ----------------------------------------------------
const KV_REST_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/$/, '');
const KV_REST_TOKEN = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const isKVConfigured = Boolean(KV_REST_URL && KV_REST_TOKEN && KV_REST_URL.startsWith('http'));

async function kvCommand(args: (string | number)[]): Promise<any | null> {
  if (!isKVConfigured) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(KV_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(args),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result ?? null;
  } catch (err) {
    console.warn('[KV] Command failed:', err);
    return null;
  }
}

async function kvGetJson<T>(key: string): Promise<T | null> {
  const raw = await kvCommand(['GET', key]);
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function kvSetJson(key: string, value: unknown): Promise<boolean> {
  const res = await kvCommand(['SET', key, JSON.stringify(value)]);
  return res === 'OK';
}

// Validate and sanitize PostgreSQL connection string to prevent invalid strings (like "database", "base", etc.)
function parseAndValidatePostgresUrl(): { url: string | null; invalidReason: string | null; rawFound: string | null } {
  const rawCandidates = [
    { key: 'POSTGRES_URL', val: process.env.POSTGRES_URL },
    { key: 'DATABASE_URL', val: process.env.DATABASE_URL },
    { key: 'POSTGRES_PRISMA_URL', val: process.env.POSTGRES_PRISMA_URL },
    { key: 'POSTGRES_URL_NON_POOLING', val: process.env.POSTGRES_URL_NON_POOLING }
  ];

  let rawFound: string | null = null;

  for (const { key, val } of rawCandidates) {
    if (!val || typeof val !== 'string') continue;
    const trimmed = val.trim();
    if (!trimmed) continue;

    rawFound = `${key}=${trimmed.length > 20 ? trimmed.substring(0, 15) + '...' : trimmed}`;

    if (
      trimmed.toLowerCase() === 'database' ||
      trimmed.toLowerCase() === 'base' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.includes('ep-example') ||
      trimmed.includes('MY_APP_URL') ||
      trimmed.includes('user:password@host')
    ) {
      const reason = `Variabel ${key} berisi teks placeholder ("${trimmed}"). Di Vercel, sambungkan Vercel Postgres melalui tab Storage > Connect Project agar mendapatkan Connection String resmi.`;
      console.warn(`[DB] Mengabaikan ${key}="${trimmed}": ${reason}`);
      return { url: null, invalidReason: reason, rawFound };
    }

    if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
      const reason = `Variabel ${key} harus diawali dengan "postgres://" atau "postgresql://", bukan "${trimmed.substring(0, 12)}...".`;
      console.warn(`[DB] ${reason}`);
      return { url: null, invalidReason: reason, rawFound };
    }

    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname;
      if (!host || host === 'base' || host === 'database') {
        const reason = `Host database tidak valid ("${host}"). Harap periksa format URL PostgreSQL Anda.`;
        console.warn(`[DB] ${reason}`);
        return { url: null, invalidReason: reason, rawFound };
      }
      return { url: trimmed, invalidReason: null, rawFound };
    } catch {
      const reason = `Gagal mem-parse URL pada variabel ${key}. Format URI tidak valid.`;
      console.warn(`[DB] ${reason}`);
      return { url: null, invalidReason: reason, rawFound };
    }
  }

  if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_DATABASE) {
    const host = process.env.POSTGRES_HOST.trim();
    if (host && host !== 'base' && host !== 'database') {
      const user = encodeURIComponent(process.env.POSTGRES_USER.trim());
      const pass = process.env.POSTGRES_PASSWORD ? encodeURIComponent(process.env.POSTGRES_PASSWORD.trim()) : '';
      const dbName = encodeURIComponent(process.env.POSTGRES_DATABASE.trim());
      const port = process.env.POSTGRES_PORT ? process.env.POSTGRES_PORT.trim() : '5432';
      const constructed = `postgres://${user}:${pass}@${host}:${port}/${dbName}?sslmode=require`;
      return { url: constructed, invalidReason: null, rawFound: 'POSTGRES_HOST config' };
    }
  }

  return { url: null, invalidReason: null, rawFound: null };
}

const { url: postgresConnectionString, invalidReason: postgresConfigInvalidReason, rawFound: rawEnvDetected } = parseAndValidatePostgresUrl();

let pool: pg.Pool | null = null;
let isPostgresReady = false;
let postgresInitPromise: Promise<boolean> | null = null;
let lastPostgresError: string | null = null;
let lastInitAttemptTime = 0;

if (postgresConnectionString) {
  try {
    pool = new Pool({
      connectionString: postgresConnectionString,
      ssl: process.env.NODE_ENV === 'development' && !postgresConnectionString.includes('vercel-storage.com') && !postgresConnectionString.includes('neon.tech') && !postgresConnectionString.includes('supabase.co')
        ? undefined
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 4000
    });

    pool.on('error', (err) => {
      console.warn('[DB] PostgreSQL pool background warning:', err?.message || err);
    });

    console.log('[DB] Menginisialisasi koneksi ke Database Vercel Postgres / PostgreSQL...');
  } catch (err: any) {
    lastPostgresError = err?.message || String(err);
    console.error('[DB] Gagal membuat pool PostgreSQL:', err);
  }
} else if (postgresConfigInvalidReason) {
  console.log(`[DB] Menggunakan mode fallback aman: ${postgresConfigInvalidReason}`);
}

async function initPostgresTables(): Promise<boolean> {
  if (!pool) return false;
  if (isPostgresReady) return true;

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS dinamis_users (
          username VARCHAR(100) PRIMARY KEY,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          plan VARCHAR(50) DEFAULT 'trial',
          trial_expires_at TIMESTAMP WITH TIME ZONE,
          subscription_expires_at TIMESTAMP WITH TIME ZONE,
          is_watermark_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await client.query(`
        ALTER TABLE dinamis_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        ALTER TABLE dinamis_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
        ALTER TABLE dinamis_users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'trial';
        ALTER TABLE dinamis_users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE dinamis_users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE dinamis_users ADD COLUMN IF NOT EXISTS is_watermark_active BOOLEAN DEFAULT true;
        ALTER TABLE dinamis_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dinamis_qrcodes (
          id VARCHAR(100) PRIMARY KEY,
          code VARCHAR(50),
          slug VARCHAR(100) UNIQUE NOT NULL,
          title TEXT NOT NULL,
          target_url TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE dinamis_qrcodes ADD COLUMN IF NOT EXISTS code VARCHAR(50);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dinamis_scans (
          id VARCHAR(100) PRIMARY KEY,
          qr_id VARCHAR(100),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          device VARCHAR(50),
          os VARCHAR(50),
          browser VARCHAR(100),
          referer TEXT
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dinamis_nfc_tags (
          id VARCHAR(100) PRIMARY KEY,
          tag_uid VARCHAR(100),
          place_name TEXT NOT NULL,
          google_review_url TEXT NOT NULL,
          pin VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          total_taps INT DEFAULT 0,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      const userCheck = await client.query('SELECT COUNT(*) FROM dinamis_users');
      if (parseInt(userCheck.rows[0].count, 10) === 0) {
        const defaultUser = initialUsers[0];
        await client.query(
          'INSERT INTO dinamis_users (username, password, name) VALUES ($1, $2, $3)',
          [defaultUser.username, defaultUser.password, defaultUser.name]
        );
        console.log('[DB] User admin default berhasil di-seed ke Vercel Postgres.');
      }

      const qrCheck = await client.query('SELECT COUNT(*) FROM dinamis_qrcodes');
      if (parseInt(qrCheck.rows[0].count, 10) === 0) {
        for (const qr of initialQRCodes) {
          await client.query(
            `INSERT INTO dinamis_qrcodes (id, code, slug, title, target_url, status, data, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (slug) DO NOTHING`,
            [qr.id, qr.code, qr.slug.toLowerCase(), qr.title, qr.targetUrl, qr.status, JSON.stringify(qr), qr.createdAt, qr.updatedAt]
          );
        }
        console.log('[DB] Data QR Code awal berhasil di-seed ke Vercel Postgres.');
      }

      const nfcCheck = await client.query('SELECT COUNT(*) FROM dinamis_nfc_tags');
      if (parseInt(nfcCheck.rows[0].count, 10) === 0) {
        for (const nfc of initialNFCTags) {
          await client.query(
            'INSERT INTO dinamis_nfc_tags (id, tag_uid, place_name, google_review_url, pin, status, total_taps, data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [nfc.id, nfc.tagUid, nfc.placeName, nfc.googleReviewUrl, nfc.pin, nfc.status, nfc.totalTaps, JSON.stringify(nfc), nfc.createdAt, nfc.updatedAt]
          );
        }
        console.log('[DB] Data NFC awal berhasil di-seed ke Vercel Postgres.');
      }

      isPostgresReady = true;
      lastPostgresError = null;
      console.log('[DB] Vercel Postgres / PostgreSQL siap digunakan!');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    lastPostgresError = err?.message || String(err);
    isPostgresReady = false;
    console.warn('[DB] Peringatan koneksi PostgreSQL:', lastPostgresError);
    return false;
  }
}

function ensurePostgres(): Promise<boolean> {
  if (!pool) return Promise.resolve(false);
  if (isPostgresReady) return Promise.resolve(true);

  const now = Date.now();
  if (lastPostgresError && (now - lastInitAttemptTime < 15000)) {
    return Promise.resolve(false);
  }

  if (!postgresInitPromise) {
    lastInitAttemptTime = now;
    postgresInitPromise = initPostgresTables().then(ready => {
      postgresInitPromise = null;
      return ready;
    });
  }
  return postgresInitPromise;
}

// ----------------------------------------------------
// FALLBACK FILE / MEMORY HELPERS
// ----------------------------------------------------
let memoryUsers = [...initialUsers];
let memoryQRCodes = [...initialQRCodes];
let memoryScans: ScanRecord[] = [];
let memoryNFCTags = [...initialNFCTags];

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Running in read-only environment without /tmp setup
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Continue with memory/KV fallback
  }
}

// Static default fallback map used ONLY if slug does not exist in DB/KV/JSON/Memory
const DEFAULT_FALLBACK_SLUG_MAP: Record<string, string> = {
  'menu-meja-01': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  'menu-resto': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop',
  'qr-001': 'https://search.google.com/local/writereview?placeid=ChIJE9fYc0pfZS4R0zV64ObvPoM',
  'review': 'https://search.google.com/local/writereview?placeid=ChIJE9fYc0pfZS4R0zV64ObvPoM',
  'google-review': 'https://search.google.com/local/writereview?placeid=ChIJE9fYc0pfZS4R0zV64ObvPoM',
  'kopi-speciality': 'https://shopee.co.id',
  'kartu-nama-ceo': 'https://wa.me/6281234567890',
  'wa-order': 'https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20info',
  'whatsapp': 'https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20info',
  'qr-004': 'https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20info',
  'ig-official': 'https://instagram.com/restoran_official',
  'instagram': 'https://instagram.com/restoran_official',
  'qr-005': 'https://instagram.com/restoran_official',
  'tiktok-promo': 'https://tiktok.com/@restoran_official',
  'tiktok': 'https://tiktok.com/@restoran_official',
  'qr-006': 'https://tiktok.com/@restoran_official',
  'fb-fanspage': 'https://facebook.com/restoran.official',
  'facebook': 'https://facebook.com/restoran.official',
  'qr-007': 'https://facebook.com/restoran.official'
};

function mergeQRCodesPreserveLatest(base: DynamicQRCode[], incoming: DynamicQRCode[]): DynamicQRCode[] {
  const bySlug = new Map<string, DynamicQRCode>();

  const upsertItem = (item: DynamicQRCode) => {
    if (!item || !item.slug) return;
    const key = item.slug.trim().toLowerCase();
    const existing = bySlug.get(key);
    if (!existing) {
      bySlug.set(key, item);
      return;
    }
    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const incomingTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
    if (incomingTime >= existingTime) {
      bySlug.set(key, item);
    }
  };

  base.forEach(upsertItem);
  incoming.forEach(upsertItem);
  return Array.from(bySlug.values());
}

async function syncQRToKV(qr: DynamicQRCode): Promise<void> {
  if (!isKVConfigured || !qr?.slug) return;
  const cleanSlug = qr.slug.trim().toLowerCase();
  await kvSetJson(`dinamis:qr:slug:${cleanSlug}`, qr);

  const list = (await kvGetJson<DynamicQRCode[]>('dinamis:qrcodes:all')) || [];
  const idx = list.findIndex(item => item.id === qr.id || item.slug.trim().toLowerCase() === cleanSlug);
  if (idx !== -1) {
    list[idx] = qr;
  } else {
    list.unshift(qr);
  }
  await kvSetJson('dinamis:qrcodes:all', list);
}

async function syncSlugToCloud(slug: string, targetUrl: string): Promise<boolean> {
  if (!slug || !targetUrl) return false;
  const cleanSlug = slug.trim().toLowerCase();
  const trimmedUrl = targetUrl.trim();

  const existing = await db.getQRCodeBySlug(cleanSlug);
  if (existing && existing.targetUrl !== trimmedUrl) {
    const now = new Date().toISOString();
    existing.targetUrl = trimmedUrl;
    existing.updatedAt = now;
    existing.urlHistory = [
      { url: trimmedUrl, changedAt: now, reason: 'Sinkronisasi tautan' },
      ...(existing.urlHistory || [])
    ];
    await db.saveQRCode(existing);
    return true;
  }
  return Boolean(existing);
}

async function syncAllSlugsToCloud(
  slugMap: Record<string, string>,
  fullQRs?: DynamicQRCode[]
): Promise<boolean> {
  try {
    if (Array.isArray(fullQRs) && fullQRs.length > 0) {
      const existing = await db.getQRCodes();
      const existingBySlug = new Map(existing.map(q => [q.slug.trim().toLowerCase(), q]));
      for (const incoming of fullQRs) {
        if (!incoming?.slug || !incoming?.targetUrl) continue;
        const cleanSlug = incoming.slug.trim().toLowerCase();
        const serverItem = existingBySlug.get(cleanSlug);
        const serverTime = serverItem ? new Date(serverItem.updatedAt || serverItem.createdAt || 0).getTime() : 0;
        const incomingTime = new Date(incoming.updatedAt || incoming.createdAt || 0).getTime();
        if (!serverItem || incomingTime > serverTime) {
          await db.saveQRCode(incoming);
        }
      }
      return true;
    }

    if (slugMap && typeof slugMap === 'object') {
      const existing = await db.getQRCodes();
      for (const [rawSlug, rawUrl] of Object.entries(slugMap)) {
        if (!rawSlug || typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
        const cleanSlug = rawSlug.trim().toLowerCase();
        const found = existing.find(q => q.slug.trim().toLowerCase() === cleanSlug);
        if (!found) {
          const now = new Date().toISOString();
          await db.saveQRCode({
            id: `qr-sync-${cleanSlug}`,
            code: `QR-${cleanSlug.toUpperCase().slice(0, 8)}`,
            slug: cleanSlug,
            title: `QR Code #${cleanSlug}`,
            targetUrl: rawUrl.trim(),
            status: 'active',
            createdAt: now,
            updatedAt: now,
            tags: ['Synced'],
            notes: 'Disinkronkan dari dashboard.',
            totalScans: 0,
            lastScannedAt: null,
            urlHistory: [{ url: rawUrl.trim(), changedAt: now, reason: 'Sinkronisasi awal' }],
            style: {
              fgColor: '#104F38',
              bgColor: '#ffffff',
              dotStyle: 'rounded',
              cornerStyle: 'rounded',
              frameStyle: 'bottom-banner',
              frameText: 'PINDAI SAYA',
              frameColor: '#104F38',
              frameTextColor: '#ffffff',
              logoType: 'none'
            }
          });
        }
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[DB] syncAllSlugsToCloud warning:', err);
    return false;
  }
}

async function getCloudUrlForSlug(slug: string): Promise<string | null> {
  const qr = await db.getQRCodeBySlug(slug);
  return qr?.targetUrl || null;
}

// ----------------------------------------------------
// DATABASE API EXPORT
// ----------------------------------------------------
export const db = {
  async getStatus() {
    const isPgConfigured = Boolean(pool);
    let pgConnected = false;
    let message = 'Menggunakan penyimpanan file lokal/memori.';

    if (pool) {
      try {
        pgConnected = await ensurePostgres();
        if (pgConnected) {
          message = 'Terhubung ke Database Vercel Postgres / PostgreSQL.';
        } else if (lastPostgresError) {
          message = `Koneksi PostgreSQL gagal (${lastPostgresError}). Menggunakan penyimpanan cadangan.`;
        } else {
          message = 'Koneksi PostgreSQL belum siap, menggunakan penyimpanan cadangan.';
        }
      } catch (e: any) {
        message = `Error database: ${e?.message || 'Unknown'}`;
      }
    } else if (isKVConfigured) {
      message = 'Terhubung ke Vercel KV / Upstash Redis REST.';
    } else if (postgresConfigInvalidReason) {
      message = postgresConfigInvalidReason;
    }

    return {
      connected: (isPgConfigured && pgConnected) || isKVConfigured,
      type: pgConnected ? 'vercel-postgres' : (isKVConfigured ? 'vercel-kv' : (isServerless ? 'serverless-cache' : 'local-file')),
      message,
      configuredConnectionString: Boolean(postgresConnectionString),
      configuredKV: isKVConfigured,
      invalidReason: postgresConfigInvalidReason || null,
      rawEnvDetected: rawEnvDetected || null,
      lastError: lastPostgresError || null
    };
  },

  // USERS
  async getUsers(): Promise<UserRecord[]> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query(
          'SELECT username, password, name, email, phone, plan, trial_expires_at as "trialExpiresAt", subscription_expires_at as "subscriptionExpiresAt", is_watermark_active as "isWatermarkActive", created_at as "createdAt" FROM dinamis_users'
        );
        if (res.rows.length > 0) {
          return res.rows.map(r => ({
            ...r,
            plan: r.plan || 'trial',
            isWatermarkActive: r.isWatermarkActive !== undefined ? r.isWatermarkActive : (r.plan === 'trial')
          }));
        }
      } catch (err) {
        console.error('[DB] getUsers error:', err);
      }
    }

    if (isKVConfigured) {
      const kvUsers = await kvGetJson<UserRecord[]>('dinamis:users:all');
      if (kvUsers && kvUsers.length > 0) {
        memoryUsers = kvUsers;
        return kvUsers;
      }
    }

    const loaded = readJsonFile<UserRecord[]>(USERS_FILE, memoryUsers);
    memoryUsers = loaded.length ? loaded : initialUsers;
    return memoryUsers;
  },

  async getUserByUsername(username: string): Promise<UserRecord | null> {
    const users = await this.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase().trim()) || null;
  },

  async createUser(newUser: UserRecord): Promise<UserRecord> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        await pool.query(
          `INSERT INTO dinamis_users (username, password, name, email, phone, plan, trial_expires_at, subscription_expires_at, is_watermark_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (username) DO UPDATE
           SET password = EXCLUDED.password,
               name = EXCLUDED.name,
               email = EXCLUDED.email,
               phone = EXCLUDED.phone,
               plan = EXCLUDED.plan,
               trial_expires_at = EXCLUDED.trial_expires_at,
               subscription_expires_at = EXCLUDED.subscription_expires_at,
               is_watermark_active = EXCLUDED.is_watermark_active,
               updated_at = NOW()`,
          [
            newUser.username.toLowerCase().trim(),
            newUser.password || 'admin123',
            newUser.name,
            newUser.email || null,
            newUser.phone || null,
            newUser.plan || 'trial',
            newUser.trialExpiresAt || null,
            newUser.subscriptionExpiresAt || null,
            newUser.isWatermarkActive !== undefined ? newUser.isWatermarkActive : true,
            newUser.createdAt || new Date().toISOString(),
            new Date().toISOString()
          ]
        );
      } catch (err) {
        console.error('[DB] createUser error:', err);
      }
    }

    const users = await this.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (idx !== -1) {
      users[idx] = newUser;
    } else {
      users.push(newUser);
    }
    memoryUsers = users;
    writeJsonFile(USERS_FILE, users);
    if (isKVConfigured) await kvSetJson('dinamis:users:all', users);
    return newUser;
  },

  async updateUserPlan(username: string, plan: 'monthly' | 'yearly'): Promise<UserRecord | null> {
    const durationDays = plan === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query(
          `UPDATE dinamis_users
           SET plan = $1,
               subscription_expires_at = $2,
               is_watermark_active = false,
               updated_at = NOW()
           WHERE LOWER(username) = LOWER($3)
           RETURNING username, name, email, phone, plan, trial_expires_at as "trialExpiresAt", subscription_expires_at as "subscriptionExpiresAt", is_watermark_active as "isWatermarkActive"`,
          [plan, expiresAt, username.trim()]
        );
        if (res.rows[0]) {
          return {
            ...res.rows[0],
            isWatermarkActive: false
          };
        }
      } catch (err) {
        console.error('[DB] updateUserPlan error:', err);
      }
    }

    const users = await this.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (idx !== -1) {
      users[idx].plan = plan;
      users[idx].subscriptionExpiresAt = expiresAt;
      users[idx].isWatermarkActive = false;
      users[idx].updatedAt = new Date().toISOString();
      memoryUsers = users;
      writeJsonFile(USERS_FILE, users);
      if (isKVConfigured) await kvSetJson('dinamis:users:all', users);
      return users[idx];
    }
    return null;
  },

  async updateUser(username: string, newPassword?: string, newUsername?: string, name?: string): Promise<boolean> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const targetUsername = newUsername || username;
        if (newUsername && newUsername !== username) {
          await pool.query(
            'UPDATE dinamis_users SET username = $1, password = COALESCE($2, password), name = COALESCE($3, name), updated_at = NOW() WHERE username = $4',
            [targetUsername, newPassword || null, name || null, username]
          );
        } else {
          await pool.query(
            'UPDATE dinamis_users SET password = COALESCE($1, password), name = COALESCE($2, name), updated_at = NOW() WHERE username = $3',
            [newPassword || null, name || null, username]
          );
        }
        return true;
      } catch (err) {
        console.error('[DB] updateUser error:', err);
      }
    }

    const users = await this.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx !== -1) {
      if (newUsername) users[idx].username = newUsername;
      if (newPassword) users[idx].password = newPassword;
      if (name) users[idx].name = name;
      memoryUsers = users;
      writeJsonFile(USERS_FILE, users);
      if (isKVConfigured) await kvSetJson('dinamis:users:all', users);
      return true;
    }
    return false;
  },

  // QR CODES
  async getQRCodes(): Promise<DynamicQRCode[]> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data, target_url, status, updated_at FROM dinamis_qrcodes ORDER BY created_at DESC');
        if (res.rows.length > 0) {
          const rows = res.rows.map(r => ({
            ...r.data,
            targetUrl: r.target_url || r.data?.targetUrl,
            status: r.status || r.data?.status || 'active',
            updatedAt: r.data?.updatedAt || (r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at)
          }));
          memoryQRCodes = rows;
          return rows;
        }
      } catch (err) {
        console.error('[DB] getQRCodes error:', err);
      }
    }

    if (isKVConfigured) {
      const kvList = await kvGetJson<DynamicQRCode[]>('dinamis:qrcodes:all');
      if (kvList && kvList.length > 0) {
        const merged = mergeQRCodesPreserveLatest(initialQRCodes, kvList);
        memoryQRCodes = merged;
        return merged;
      }
    }

    const loaded = readJsonFile<DynamicQRCode[]>(QR_FILE, memoryQRCodes);
    memoryQRCodes = loaded.length ? loaded : initialQRCodes;
    return memoryQRCodes;
  },

  async getQRCodeById(id: string): Promise<DynamicQRCode | null> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data, target_url, status FROM dinamis_qrcodes WHERE id = $1', [id]);
        if (res.rows[0]?.data) {
          return {
            ...res.rows[0].data,
            targetUrl: res.rows[0].target_url || res.rows[0].data.targetUrl,
            status: res.rows[0].status || res.rows[0].data.status || 'active'
          };
        }
      } catch (err) {
        console.error('[DB] getQRCodeById error:', err);
      }
    }

    const all = await this.getQRCodes();
    return all.find(q => q.id === id) || null;
  },

  async getQRCodeBySlug(slug: string): Promise<DynamicQRCode | null> {
    let decodedSlug = slug || '';
    try {
      decodedSlug = decodeURIComponent(decodedSlug);
    } catch {}
    const cleanSlug = decodedSlug.trim().toLowerCase().replace(/\.png$/i, '').replace(/\/+$/, '');
    if (!cleanSlug) return null;

    // 1. Check PostgreSQL first (authoritative)
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query(
          'SELECT data, target_url, status FROM dinamis_qrcodes WHERE LOWER(slug) = LOWER($1) LIMIT 1',
          [cleanSlug]
        );
        if (res.rows[0]?.data) {
          return {
            ...res.rows[0].data,
            targetUrl: res.rows[0].target_url || res.rows[0].data.targetUrl,
            status: res.rows[0].status || res.rows[0].data.status || 'active'
          };
        }

        // Dash/punctuation tolerant search in Postgres
        const strippedTarget = cleanSlug.replace(/[^a-z0-9]/g, '');
        if (strippedTarget.length >= 2) {
          const fuzzyRes = await pool.query(
            "SELECT data, target_url, status FROM dinamis_qrcodes WHERE regexp_replace(LOWER(slug), '[^a-z0-9]', '', 'g') = $1 LIMIT 1",
            [strippedTarget]
          );
          if (fuzzyRes.rows[0]?.data) {
            return {
              ...fuzzyRes.rows[0].data,
              targetUrl: fuzzyRes.rows[0].target_url || fuzzyRes.rows[0].data.targetUrl,
              status: fuzzyRes.rows[0].status || fuzzyRes.rows[0].data.status || 'active'
            };
          }
        }
      } catch (err) {
        console.error('[DB] getQRCodeBySlug error:', err);
      }
    }

    // 2. Check Vercel KV / Upstash Redis direct slug key & full list
    if (isKVConfigured) {
      const kvDirect = await kvGetJson<DynamicQRCode>(`dinamis:qr:slug:${cleanSlug}`);
      if (kvDirect && kvDirect.targetUrl) {
        return kvDirect;
      }
      const kvAll = await kvGetJson<DynamicQRCode[]>('dinamis:qrcodes:all');
      if (kvAll && kvAll.length > 0) {
        const foundKV = kvAll.find(q => q.slug?.toLowerCase().trim() === cleanSlug);
        if (foundKV) return foundKV;
      }
    }

    // 3. Check local file (/tmp or data/qrcodes.json) and memory cache
    const loaded = readJsonFile<DynamicQRCode[]>(QR_FILE, memoryQRCodes);
    if (loaded.length > 0) {
      memoryQRCodes = loaded;
    }
    let found = memoryQRCodes.find(q => q.slug?.toLowerCase().trim() === cleanSlug) || null;
    if (!found) {
      const strippedTarget = cleanSlug.replace(/[^a-z0-9]/g, '');
      if (strippedTarget.length >= 2) {
        found = memoryQRCodes.find(q => (q.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '') === strippedTarget) || null;
      }
    }
    if (found) return found;

    // 4. Static fallback map only if not found anywhere in persistent stores
    const fallbackUrl = DEFAULT_FALLBACK_SLUG_MAP[cleanSlug];
    if (fallbackUrl) {
      return {
        id: 'qr-' + cleanSlug,
        code: 'QR-' + cleanSlug.toUpperCase(),
        slug: cleanSlug,
        title: `QR Code #${cleanSlug}`,
        targetUrl: fallbackUrl,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Default'],
        notes: 'Tautan default sistem.',
        totalScans: 0,
        lastScannedAt: null,
        urlHistory: [{ url: fallbackUrl, changedAt: new Date().toISOString(), reason: 'Default' }],
        style: {
          fgColor: '#104F38',
          bgColor: '#ffffff',
          dotStyle: 'rounded',
          cornerStyle: 'rounded',
          frameStyle: 'bottom-banner',
          frameText: 'PINDAI SAYA',
          frameColor: '#104F38',
          frameTextColor: '#ffffff',
          logoType: 'none'
        }
      };
    }

    if (cleanSlug.includes('review') || cleanSlug.includes('google')) {
      const reviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJ_8pMXbpfZS4Rlo0DNUQ77ro';
      return {
        id: 'qr-review',
        code: 'QR-REVIEW',
        slug: cleanSlug,
        title: 'Google Review Stand',
        targetUrl: reviewUrl,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Google Review'],
        notes: 'Fallback review URL',
        totalScans: 0,
        lastScannedAt: null,
        urlHistory: [],
        style: {
          fgColor: '#104F38',
          bgColor: '#ffffff',
          dotStyle: 'rounded',
          cornerStyle: 'rounded',
          frameStyle: 'bottom-banner',
          frameText: 'ULAS KAMI DI GOOGLE',
          frameColor: '#104F38',
          frameTextColor: '#ffffff',
          logoType: 'none'
        }
      };
    }

    return null;
  },

  async saveQRCode(qr: DynamicQRCode): Promise<void> {
    const cleanSlug = (qr.slug || '').trim().toLowerCase();
    const normalizedQR: DynamicQRCode = {
      ...qr,
      slug: cleanSlug || qr.slug,
      targetUrl: (qr.targetUrl || '').trim()
    };

    // Persist to PostgreSQL if connected, avoiding UNIQUE(slug) 23505 conflicts
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const existingRes = await pool.query(
          'SELECT id FROM dinamis_qrcodes WHERE id = $1 OR LOWER(slug) = LOWER($2) LIMIT 1',
          [normalizedQR.id, normalizedQR.slug]
        );

        if (existingRes.rows.length > 0) {
          const existingId = existingRes.rows[0].id;
          await pool.query(
            `UPDATE dinamis_qrcodes
             SET id = $1,
                 code = $2,
                 slug = $3,
                 title = $4,
                 target_url = $5,
                 status = $6,
                 data = $7,
                 updated_at = $8
             WHERE id = $9`,
            [
              normalizedQR.id,
              normalizedQR.code || null,
              normalizedQR.slug,
              normalizedQR.title,
              normalizedQR.targetUrl,
              normalizedQR.status,
              JSON.stringify(normalizedQR),
              normalizedQR.updatedAt || new Date().toISOString(),
              existingId
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO dinamis_qrcodes (id, code, slug, title, target_url, status, data, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (slug) DO UPDATE
             SET code = EXCLUDED.code,
                 title = EXCLUDED.title,
                 target_url = EXCLUDED.target_url,
                 status = EXCLUDED.status,
                 data = EXCLUDED.data,
                 updated_at = EXCLUDED.updated_at`,
            [
              normalizedQR.id,
              normalizedQR.code || null,
              normalizedQR.slug,
              normalizedQR.title,
              normalizedQR.targetUrl,
              normalizedQR.status,
              JSON.stringify(normalizedQR),
              normalizedQR.createdAt || new Date().toISOString(),
              normalizedQR.updatedAt || new Date().toISOString()
            ]
          );
        }
      } catch (err) {
        console.error('[DB] saveQRCode Postgres error:', err);
      }
    }

    // Persist to Vercel KV / Upstash Redis if configured
    if (isKVConfigured) {
      await syncQRToKV(normalizedQR);
    }

    // Always update memory and local/tmp JSON file so same-instance reads are immediately fresh
    const currentList = readJsonFile<DynamicQRCode[]>(QR_FILE, memoryQRCodes);
    const list = currentList.length ? [...currentList] : [...memoryQRCodes];
    const idx = list.findIndex(
      q => q.id === normalizedQR.id || q.slug?.toLowerCase().trim() === normalizedQR.slug
    );
    if (idx !== -1) {
      list[idx] = normalizedQR;
    } else {
      list.unshift(normalizedQR);
    }
    memoryQRCodes = list;
    writeJsonFile(QR_FILE, list);
  },

  async saveBatchQRCodes(qrs: DynamicQRCode[]): Promise<void> {
    for (const qr of qrs) {
      await this.saveQRCode(qr);
    }
  },

  async deleteQRCode(id: string): Promise<boolean> {
    let deletedFromPg = false;
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('DELETE FROM dinamis_qrcodes WHERE id = $1 RETURNING slug', [id]);
        deletedFromPg = (res.rowCount || 0) > 0;
        if (isKVConfigured && res.rows[0]?.slug) {
          await kvCommand(['DEL', `dinamis:qr:slug:${String(res.rows[0].slug).toLowerCase().trim()}`]);
        }
      } catch (err) {
        console.error('[DB] deleteQRCode error:', err);
      }
    }

    let list = readJsonFile<DynamicQRCode[]>(QR_FILE, memoryQRCodes);
    const target = list.find(q => q.id === id);
    const existsInFile = Boolean(target);
    if (existsInFile) {
      list = list.filter(q => q.id !== id);
      memoryQRCodes = list;
      writeJsonFile(QR_FILE, list);
    }

    if (isKVConfigured) {
      const kvList = (await kvGetJson<DynamicQRCode[]>('dinamis:qrcodes:all')) || [];
      const kvTarget = kvList.find(q => q.id === id);
      if (kvTarget) {
        await kvCommand(['DEL', `dinamis:qr:slug:${kvTarget.slug.toLowerCase().trim()}`]);
        await kvSetJson('dinamis:qrcodes:all', kvList.filter(q => q.id !== id));
      } else if (target) {
        await kvCommand(['DEL', `dinamis:qr:slug:${target.slug.toLowerCase().trim()}`]);
      }
    }

    return deletedFromPg || existsInFile;
  },

  // SCANS
  async getScans(): Promise<ScanRecord[]> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT * FROM dinamis_scans ORDER BY timestamp DESC LIMIT 2000');
        return res.rows.map(r => ({
          id: r.id,
          qrId: r.qr_id,
          timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
          device: r.device,
          os: r.os,
          browser: r.browser,
          referer: r.referer
        }));
      } catch (err) {
        console.error('[DB] getScans error:', err);
      }
    }

    if (isKVConfigured) {
      const kvScans = await kvGetJson<ScanRecord[]>('dinamis:scans:all');
      if (kvScans) {
        memoryScans = kvScans;
        return kvScans;
      }
    }

    const loaded = readJsonFile(SCANS_FILE, memoryScans);
    memoryScans = loaded;
    return memoryScans;
  },

  async addScan(scan: ScanRecord): Promise<void> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        await pool.query(
          'INSERT INTO dinamis_scans (id, qr_id, timestamp, device, os, browser, referer) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [scan.id, scan.qrId, scan.timestamp, scan.device, scan.os, scan.browser, scan.referer]
        );
        return;
      } catch (err) {
        console.error('[DB] addScan error:', err);
      }
    }

    const scans = await this.getScans();
    scans.push(scan);
    const trimmed = scans.slice(-2000);
    memoryScans = trimmed;
    writeJsonFile(SCANS_FILE, trimmed);
    if (isKVConfigured) await kvSetJson('dinamis:scans:all', trimmed);
  },

  // NFC TAGS
  async getNFCTags(): Promise<any[]> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data FROM dinamis_nfc_tags ORDER BY created_at DESC');
        if (res.rows.length > 0) return res.rows.map(r => r.data);
      } catch (err) {
        console.error('[DB] getNFCTags error:', err);
      }
    }

    if (isKVConfigured) {
      const kvNfc = await kvGetJson<any[]>('dinamis:nfc:all');
      if (kvNfc && kvNfc.length > 0) {
        memoryNFCTags = kvNfc;
        return kvNfc;
      }
    }

    const loaded = readJsonFile(NFC_FILE, memoryNFCTags);
    memoryNFCTags = loaded.length ? loaded : initialNFCTags;
    return memoryNFCTags;
  },

  async getNFCTagById(id: string): Promise<any | null> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data FROM dinamis_nfc_tags WHERE id = $1', [id]);
        if (res.rows[0]?.data) return res.rows[0].data;
      } catch (err) {
        console.error('[DB] getNFCTagById error:', err);
      }
    }

    const tags = await this.getNFCTags();
    return tags.find(t => t.id === id) || null;
  },

  async saveNFCTag(tag: any): Promise<void> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        await pool.query(
          `INSERT INTO dinamis_nfc_tags (id, tag_uid, place_name, google_review_url, pin, status, total_taps, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE
           SET tag_uid = EXCLUDED.tag_uid,
               place_name = EXCLUDED.place_name,
               google_review_url = EXCLUDED.google_review_url,
               pin = EXCLUDED.pin,
               status = EXCLUDED.status,
               total_taps = EXCLUDED.total_taps,
               data = EXCLUDED.data,
               updated_at = EXCLUDED.updated_at`,
          [tag.id, tag.tagUid, tag.placeName, tag.googleReviewUrl, tag.pin, tag.status, tag.totalTaps || 0, JSON.stringify(tag), tag.createdAt, tag.updatedAt]
        );
      } catch (err) {
        console.error('[DB] saveNFCTag error:', err);
      }
    }

    const tags = await this.getNFCTags();
    const idx = tags.findIndex(t => t.id === tag.id);
    if (idx !== -1) {
      tags[idx] = tag;
    } else {
      tags.unshift(tag);
    }
    memoryNFCTags = tags;
    writeJsonFile(NFC_FILE, tags);
    if (isKVConfigured) await kvSetJson('dinamis:nfc:all', tags);
  },

  async deleteNFCTag(id: string): Promise<boolean> {
    let deletedPg = false;
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('DELETE FROM dinamis_nfc_tags WHERE id = $1', [id]);
        deletedPg = (res.rowCount || 0) > 0;
      } catch (err) {
        console.error('[DB] deleteNFCTag error:', err);
      }
    }

    let tags = await this.getNFCTags();
    const exists = tags.some(t => t.id === id);
    if (exists) {
      tags = tags.filter(t => t.id !== id);
      memoryNFCTags = tags;
      writeJsonFile(NFC_FILE, tags);
      if (isKVConfigured) await kvSetJson('dinamis:nfc:all', tags);
    }
    return deletedPg || exists;
  }
};

export { syncSlugToCloud, syncAllSlugsToCloud, getCloudUrlForSlug };
