import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { DynamicQRCode, NFCTag, ScanRecord } from '../types.ts';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// STRICT SECURITY RULE: Access token cached strictly in memory (never localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedDriveUser: User | null = null;

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  description?: string;
}

export interface ProjecttappBackupPayload {
  version: string;
  app: string;
  exportedAt: string;
  revision?: string;
  reason?: 'manual' | 'auto-schedule' | 'auto-change';
  summary?: {
    qrCount: number;
    nfcCount: number;
    scanCount: number;
  };
  qrcodes: DynamicQRCode[];
  nfcTags: NFCTag[];
  scans?: ScanRecord[];
}

export interface AutoBackupConfig {
  enabled: boolean;
  intervalMinutes: number;
  autoOnDataChange: boolean;
  lastBackupAt: string | null;
  lastBackupFileName: string | null;
  lastBackedUpRevision: string | null;
}

const AUTO_CONFIG_STORAGE_KEY = 'projecttapp_drive_auto_config';
const BACKUP_FOLDER_NAME = 'Projecttapp Backups';

export function loadAutoBackupConfig(): AutoBackupConfig {
  try {
    const raw = localStorage.getItem(AUTO_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        intervalMinutes: Math.max(1, Number(parsed.intervalMinutes) || 15),
        autoOnDataChange: parsed.autoOnDataChange !== false,
        lastBackupAt: typeof parsed.lastBackupAt === 'string' ? parsed.lastBackupAt : null,
        lastBackupFileName: typeof parsed.lastBackupFileName === 'string' ? parsed.lastBackupFileName : null,
        lastBackedUpRevision: typeof parsed.lastBackedUpRevision === 'string' ? parsed.lastBackedUpRevision : null
      };
    }
  } catch {}
  return {
    enabled: false,
    intervalMinutes: 15,
    autoOnDataChange: true,
    lastBackupAt: null,
    lastBackupFileName: null,
    lastBackedUpRevision: null
  };
}

export function saveAutoBackupConfig(config: AutoBackupConfig): void {
  try {
    localStorage.setItem(AUTO_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      cachedDriveUser = user;
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedDriveUser = null;
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Token akses Google Drive tidak diterima. Silakan coba masuk kembali.');
    }
    cachedAccessToken = credential.accessToken;
    cachedDriveUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => cachedAccessToken;
export const getDriveUser = (): User | null => cachedDriveUser;

export const clearDriveTokenOnError = () => {
  cachedAccessToken = null;
};

export const googleDriveSignOut = async (): Promise<void> => {
  cachedAccessToken = null;
  cachedDriveUser = null;
  try {
    await auth.signOut();
  } catch {}
};

async function driveFetch(url: string, accessToken: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {})
    }
  });

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('AUTH_EXPIRED');
  }
  return res;
}

async function ensureBackupFolder(accessToken: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(
      `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=5`,
      accessToken
    );
    if (searchRes.ok) {
      const json = await searchRes.json();
      if (Array.isArray(json.files) && json.files.length > 0) {
        return json.files[0].id;
      }
    }

    const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files', accessToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Folder otomatis cadangan data QR Dinamis & Tag NFC Projecttapp'
      })
    });
    if (createRes.ok) {
      const created = await createRes.json();
      return created.id || null;
    }
  } catch (err: any) {
    if (err?.message === 'AUTH_EXPIRED') throw err;
  }
  return null;
}

export async function listDriveBackups(accessToken: string): Promise<DriveBackupFile[]> {
  const query = encodeURIComponent(
    "name contains 'projecttapp-backup-' and mimeType = 'application/json' and trashed = false"
  );
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=30&fields=files(id,name,createdTime,modifiedTime,size,description)`,
    accessToken
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal memuat daftar cadangan Google Drive (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return Array.isArray(json.files) ? json.files : [];
}

function buildBackupFileName(reason: 'manual' | 'auto-schedule' | 'auto-change'): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const tag = reason === 'manual' ? 'manual' : 'auto';
  return `projecttapp-backup-${tag}-${stamp}.json`;
}

export async function uploadDriveBackup(
  accessToken: string,
  payload: ProjecttappBackupPayload,
  reason: 'manual' | 'auto-schedule' | 'auto-change' = 'manual'
): Promise<DriveBackupFile> {
  const folderId = await ensureBackupFolder(accessToken);
  const fileName = buildBackupFileName(reason);
  const qrCount = payload.qrcodes.length;
  const nfcCount = payload.nfcTags.length;
  const scanCount = payload.scans?.length || 0;

  const fullPayload: ProjecttappBackupPayload = {
    ...payload,
    version: payload.version || '1.0',
    app: 'Projecttapp',
    exportedAt: payload.exportedAt || new Date().toISOString(),
    reason,
    summary: { qrCount, nfcCount, scanCount }
  };

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: 'application/json',
    description: `Projecttapp Backup (${reason}): ${qrCount} QR Dinamis, ${nfcCount} Tag NFC, ${scanCount} riwayat scan`
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = 'projecttapp_drive_boundary_' + Date.now();
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(fullPayload, null, 2) +
    `\r\n--${boundary}--`;

  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,modifiedTime,size,description',
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal mengunggah cadangan ke Google Drive (${res.status}): ${errText}`);
  }

  return await res.json();
}

export async function downloadDriveBackup(
  accessToken: string,
  fileId: string
): Promise<ProjecttappBackupPayload> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    accessToken
  );

  if (!res.ok) {
    throw new Error(`Gagal mengunduh file cadangan Google Drive (${res.status}).`);
  }

  const data = await res.json();
  if (!data || (!Array.isArray(data.qrcodes) && !Array.isArray(data.nfcTags))) {
    throw new Error('Struktur isi file cadangan tidak valid untuk Projecttapp.');
  }

  return data as ProjecttappBackupPayload;
}

export async function deleteDriveBackup(accessToken: string, fileId: string): Promise<void> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    accessToken,
    {
      method: 'DELETE'
    }
  );

  if (!res.ok && res.status !== 204) {
    throw new Error(`Gagal menghapus file dari Google Drive (${res.status}).`);
  }
}
