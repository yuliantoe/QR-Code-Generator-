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

// Default initial data
const initialUsers = [
  {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: 'Administrator'
  }
];

const initialQRCodes: DynamicQRCode[] = [
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

// Check PostgreSQL connection string from Vercel Postgres or other cloud providers
const postgresConnectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

let pool: pg.Pool | null = null;
let isPostgresReady = false;
let postgresInitPromise: Promise<boolean> | null = null;

if (postgresConnectionString) {
  try {
    pool = new Pool({
      connectionString: postgresConnectionString,
      ssl: process.env.NODE_ENV === 'development' && !postgresConnectionString.includes('vercel-storage.com') && !postgresConnectionString.includes('neon.tech')
        ? undefined
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
    console.log('[DB] Menginisialisasi koneksi ke Database Vercel Postgres / PostgreSQL...');
  } catch (err) {
    console.error('[DB] Gagal membuat pool PostgreSQL:', err);
  }
}

async function initPostgresTables(): Promise<boolean> {
  if (!pool) return false;
  if (isPostgresReady) return true;

  try {
    const client = await pool.connect();
    try {
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dinamis_users (
          username VARCHAR(100) PRIMARY KEY,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Create qrcodes table
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
      `);

      // Create scans table
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

      // Create nfc tags table
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

      // Seed initial users if empty
      const userCheck = await client.query('SELECT COUNT(*) FROM dinamis_users');
      if (parseInt(userCheck.rows[0].count, 10) === 0) {
        const defaultUser = initialUsers[0];
        await client.query(
          'INSERT INTO dinamis_users (username, password, name) VALUES ($1, $2, $3)',
          [defaultUser.username, defaultUser.password, defaultUser.name]
        );
        console.log('[DB] User admin default berhasil di-seed ke Vercel Postgres.');
      }

      // Seed initial QR codes if empty
      const qrCheck = await client.query('SELECT COUNT(*) FROM dinamis_qrcodes');
      if (parseInt(qrCheck.rows[0].count, 10) === 0) {
        for (const qr of initialQRCodes) {
          await client.query(
            'INSERT INTO dinamis_qrcodes (id, code, slug, title, target_url, status, data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [qr.id, qr.code, qr.slug, qr.title, qr.targetUrl, qr.status, JSON.stringify(qr), qr.createdAt, qr.updatedAt]
          );
        }
        console.log('[DB] Data QR Code awal berhasil di-seed ke Vercel Postgres.');
      }

      // Seed initial NFC tags if empty
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
      console.log('[DB] Vercel Postgres / PostgreSQL siap digunakan!');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB] Gagal menginisialisasi tabel PostgreSQL:', err);
    return false;
  }
}

function ensurePostgres(): Promise<boolean> {
  if (!pool) return Promise.resolve(false);
  if (isPostgresReady) return Promise.resolve(true);
  if (!postgresInitPromise) {
    postgresInitPromise = initPostgresTables();
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
  } catch (err) {
    // If running in read-only environment without /tmp setup
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Silently continue with memory fallback
  }
}

// ----------------------------------------------------
// DATABASE API EXPORT
// ----------------------------------------------------
export const db = {
  async getStatus() {
    const isPgAvailable = Boolean(pool);
    let pgConnected = false;
    let message = 'Menggunakan penyimpanan file lokal/memori.';

    if (pool) {
      try {
        pgConnected = await ensurePostgres();
        if (pgConnected) {
          message = 'Terhubung ke Database Vercel Postgres / PostgreSQL.';
        } else {
          message = 'Koneksi PostgreSQL gagal, menggunakan penyimpanan fallback.';
        }
      } catch (e: any) {
        message = `Error database: ${e?.message || 'Unknown'}`;
      }
    }

    return {
      connected: isPgAvailable && pgConnected,
      type: pgConnected ? 'vercel-postgres' : (isServerless ? 'serverless-cache' : 'local-file'),
      message,
      configuredConnectionString: Boolean(postgresConnectionString)
    };
  },

  // USERS
  async getUsers(): Promise<Array<{ username: string; password: string; name: string }>> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT username, password, name FROM dinamis_users');
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err) {
        console.error('[DB] getUsers error:', err);
      }
    }

    const loaded = readJsonFile(USERS_FILE, memoryUsers);
    memoryUsers = loaded.length ? loaded : initialUsers;
    return memoryUsers;
  },

  async updateUser(username: string, newPassword?: string, newUsername?: string, name?: string): Promise<boolean> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const targetUsername = newUsername || username;
        if (newUsername && newUsername !== username) {
          // Username change
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
      return true;
    }
    return false;
  },

  // QR CODES
  async getQRCodes(): Promise<DynamicQRCode[]> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data FROM dinamis_qrcodes ORDER BY created_at DESC');
        return res.rows.map(r => r.data);
      } catch (err) {
        console.error('[DB] getQRCodes error:', err);
      }
    }

    const loaded = readJsonFile(QR_FILE, memoryQRCodes);
    memoryQRCodes = loaded.length ? loaded : initialQRCodes;
    return memoryQRCodes;
  },

  async getQRCodeById(id: string): Promise<DynamicQRCode | null> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data FROM dinamis_qrcodes WHERE id = $1', [id]);
        return res.rows[0]?.data || null;
      } catch (err) {
        console.error('[DB] getQRCodeById error:', err);
      }
    }

    const all = await this.getQRCodes();
    return all.find(q => q.id === id) || null;
  },

  async getQRCodeBySlug(slug: string): Promise<DynamicQRCode | null> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data FROM dinamis_qrcodes WHERE LOWER(slug) = LOWER($1)', [slug]);
        return res.rows[0]?.data || null;
      } catch (err) {
        console.error('[DB] getQRCodeBySlug error:', err);
      }
    }

    const all = await this.getQRCodes();
    return all.find(q => q.slug.toLowerCase() === slug.toLowerCase()) || null;
  },

  async saveQRCode(qr: DynamicQRCode): Promise<void> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        await pool.query(
          `INSERT INTO dinamis_qrcodes (id, code, slug, title, target_url, status, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE
           SET code = EXCLUDED.code,
               slug = EXCLUDED.slug,
               title = EXCLUDED.title,
               target_url = EXCLUDED.target_url,
               status = EXCLUDED.status,
               data = EXCLUDED.data,
               updated_at = EXCLUDED.updated_at`,
          [qr.id, qr.code || null, qr.slug, qr.title, qr.targetUrl, qr.status, JSON.stringify(qr), qr.createdAt, qr.updatedAt]
        );
        return;
      } catch (err) {
        console.error('[DB] saveQRCode error:', err);
      }
    }

    const list = await this.getQRCodes();
    const idx = list.findIndex(q => q.id === qr.id);
    if (idx !== -1) {
      list[idx] = qr;
    } else {
      list.unshift(qr);
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
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('DELETE FROM dinamis_qrcodes WHERE id = $1', [id]);
        return (res.rowCount || 0) > 0;
      } catch (err) {
        console.error('[DB] deleteQRCode error:', err);
      }
    }

    let list = await this.getQRCodes();
    const exists = list.some(q => q.id === id);
    if (!exists) return false;
    list = list.filter(q => q.id !== id);
    memoryQRCodes = list;
    writeJsonFile(QR_FILE, list);
    return true;
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
  },

  // NFC TAGS
  async getNFCTags(): Promise<any[]> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('SELECT data FROM dinamis_nfc_tags ORDER BY created_at DESC');
        return res.rows.map(r => r.data);
      } catch (err) {
        console.error('[DB] getNFCTags error:', err);
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
        return res.rows[0]?.data || null;
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
        return;
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
  },

  async deleteNFCTag(id: string): Promise<boolean> {
    const ok = await ensurePostgres();
    if (ok && pool) {
      try {
        const res = await pool.query('DELETE FROM dinamis_nfc_tags WHERE id = $1', [id]);
        return (res.rowCount || 0) > 0;
      } catch (err) {
        console.error('[DB] deleteNFCTag error:', err);
      }
    }

    let tags = await this.getNFCTags();
    const exists = tags.some(t => t.id === id);
    if (!exists) return false;
    tags = tags.filter(t => t.id !== id);
    memoryNFCTags = tags;
    writeJsonFile(NFC_FILE, tags);
    return true;
  }
};
