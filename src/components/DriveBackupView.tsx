import React, { useState, useEffect, useRef } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  CloudUpload,
  RefreshCw,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Upload,
  LogOut,
  ShieldAlert,
  FolderArchive
} from 'lucide-react';
import type { DynamicQRCode, NFCTag } from '../types.ts';
import {
  listDriveBackups,
  downloadDriveBackup,
  deleteDriveBackup,
  type DriveBackupFile,
  type ProjecttappBackupPayload,
  type AutoBackupConfig
} from '../utils/googleDriveBackup.ts';

interface DriveBackupViewProps {
  qrcodes: DynamicQRCode[];
  nfcTags: NFCTag[];
  driveUser: FirebaseUser | null;
  driveAccessToken: string | null;
  isConnectingDrive: boolean;
  isBackingUp: boolean;
  autoConfig: AutoBackupConfig;
  lastError: string | null;
  lastNotice: string | null;
  onConnectDrive: () => Promise<void>;
  onDisconnectDrive: () => Promise<void>;
  onTriggerBackupNow: () => Promise<DriveBackupFile | null>;
  onUpdateAutoConfig: (next: AutoBackupConfig) => void;
  onRestoreComplete: (restored: { qrcodes: DynamicQRCode[]; nfcTags: NFCTag[] }) => void;
  onClearBanner: () => void;
}

interface PendingRestoreState {
  sourceLabel: string;
  fileName: string;
  payload: ProjecttappBackupPayload;
  mode: 'replace' | 'merge';
}

export const DriveBackupView: React.FC<DriveBackupViewProps> = ({
  qrcodes,
  nfcTags,
  driveUser,
  driveAccessToken,
  isConnectingDrive,
  isBackingUp,
  autoConfig,
  lastError,
  lastNotice,
  onConnectDrive,
  onDisconnectDrive,
  onTriggerBackupNow,
  onUpdateAutoConfig,
  onRestoreComplete,
  onClearBanner
}) => {
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const [pendingRestore, setPendingRestore] = useState<PendingRestoreState | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [loadingPreviewFileId, setLoadingPreviewFileId] = useState<string | null>(null);

  const [pendingDeleteFile, setPendingDeleteFile] = useState<DriveBackupFile | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const [confirmEnableAutoOpen, setConfirmEnableAutoOpen] = useState(false);
  const [isExportingLocal, setIsExportingLocal] = useState(false);
  const localFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchBackupsList = async () => {
    if (!driveAccessToken) {
      setBackups([]);
      return;
    }
    setLoadingList(true);
    setLocalError(null);
    try {
      const files = await listDriveBackups(driveAccessToken);
      setBackups(files);
    } catch (err: any) {
      if (err?.message === 'AUTH_EXPIRED') {
        setLocalError('Sesi akses Google Drive telah berakhir. Silakan klik "Sign in with Google" lagi.');
      } else {
        setLocalError(err?.message || 'Gagal memuat daftar cadangan Google Drive.');
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (driveAccessToken) {
      void fetchBackupsList();
    } else {
      setBackups([]);
    }
  }, [driveAccessToken]);

  const handleManualBackupClick = async () => {
    setLocalError(null);
    setLocalNotice(null);
    const created = await onTriggerBackupNow();
    if (created) {
      setLocalNotice(`Cadangan "${created.name}" berhasil disimpan ke folder Projecttapp Backups di Google Drive.`);
      await fetchBackupsList();
    }
  };

  const handlePrepareDriveRestore = async (file: DriveBackupFile) => {
    if (!driveAccessToken) return;
    setLoadingPreviewFileId(file.id);
    setLocalError(null);
    try {
      const payload = await downloadDriveBackup(driveAccessToken, file.id);
      setPendingRestore({
        sourceLabel: 'Google Drive',
        fileName: file.name,
        payload,
        mode: 'replace'
      });
    } catch (err: any) {
      setLocalError(err?.message || 'Gagal membaca isi file cadangan dari Google Drive.');
    } finally {
      setLoadingPreviewFileId(null);
    }
  };

  const handleDownloadDriveBackupFile = async (file: DriveBackupFile) => {
    if (!driveAccessToken) return;
    setLoadingPreviewFileId(file.id);
    setLocalError(null);
    try {
      const payload = await downloadDriveBackup(driveAccessToken, file.id);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.endsWith('.json') ? file.name : `${file.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLocalNotice(`File "${file.name}" berhasil diunduh.`);
    } catch (err: any) {
      setLocalError(err?.message || 'Gagal mengunduh file cadangan.');
    } finally {
      setLoadingPreviewFileId(null);
    }
  };

  const handleExportLocalJson = async () => {
    setIsExportingLocal(true);
    setLocalError(null);
    try {
      const res = await fetch('/api/backup/export');
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal mengekspor data dari server.');
      }
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const fname = `projecttapp-backup-lokal-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLocalNotice(`File cadangan lokal "${fname}" berhasil diunduh.`);
    } catch (err: any) {
      setLocalError(err?.message || 'Gagal mengekspor cadangan lokal.');
    } finally {
      setIsExportingLocal(false);
    }
  };

  const handlePickLocalFileForRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLocalError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || (!Array.isArray(parsed.qrcodes) && !Array.isArray(parsed.nfcTags))) {
        throw new Error('File JSON tidak memiliki data QR Dinamis atau Tag NFC yang valid.');
      }
      setPendingRestore({
        sourceLabel: 'File Lokal Komputer/HP',
        fileName: file.name,
        payload: parsed as ProjecttappBackupPayload,
        mode: 'replace'
      });
    } catch (err: any) {
      setLocalError(err?.message || 'File cadangan tidak dapat dibaca.');
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setIsRestoring(true);
    setLocalError(null);
    setLocalNotice(null);
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrcodes: pendingRestore.payload.qrcodes || [],
          nfcTags: pendingRestore.payload.nfcTags || [],
          scans: pendingRestore.payload.scans || [],
          mode: pendingRestore.mode
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal memulihkan data.');
      }
      onRestoreComplete({
        qrcodes: json.data.qrcodes || [],
        nfcTags: json.data.nfcTags || []
      });
      setLocalNotice(json.message || 'Data berhasil dipulihkan dari cadangan!');
      setPendingRestore(null);
    } catch (err: any) {
      setLocalError(err?.message || 'Terjadi kesalahan saat restore data.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!pendingDeleteFile || !driveAccessToken) return;
    setIsDeletingFile(true);
    setLocalError(null);
    try {
      await deleteDriveBackup(driveAccessToken, pendingDeleteFile.id);
      setBackups((prev) => prev.filter((item) => item.id !== pendingDeleteFile.id));
      setLocalNotice(`File cadangan "${pendingDeleteFile.name}" telah dihapus dari Google Drive.`);
      setPendingDeleteFile(null);
    } catch (err: any) {
      setLocalError(err?.message || 'Gagal menghapus file dari Google Drive.');
    } finally {
      setIsDeletingFile(false);
    }
  };

  const handleToggleAutoBackup = () => {
    if (autoConfig.enabled) {
      onUpdateAutoConfig({ ...autoConfig, enabled: false });
      setLocalNotice('Automatisasi backup Google Drive dinonaktifkan.');
    } else {
      setConfirmEnableAutoOpen(true);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return 'Belum pernah';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const formatSize = (bytesStr?: string) => {
    const n = Number(bytesStr || 0);
    if (!n || isNaN(n)) return '-';
    if (n < 1024) return `${n} B`;
    return `${(n / 1024).toFixed(1)} KB`;
  };

  const activeError = localError || lastError;
  const activeNotice = localNotice || lastNotice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#104F38]/20 p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-2xl space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#104F38]/75 flex items-center gap-1.5">
            <FolderArchive className="w-3.5 h-3.5 text-[#104F38]" />
            <span>Automatisasi Backup &amp; Restore</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#104F38] leading-tight">
            Backup &amp; Restore Google Drive
          </h1>
          <p className="text-xs sm:text-sm text-[#104F38]/80 leading-relaxed font-medium">
            Simpan cadangan seluruh QR Code Dinamis, Tag NFC, dan riwayat scan secara otomatis ke folder <strong className="text-[#104F38]">Projecttapp Backups</strong> di Google Drive Anda serta pulihkan kapan saja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {driveAccessToken ? (
            <button
              type="button"
              onClick={handleManualBackupClick}
              disabled={isBackingUp}
              className="px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs font-bold border border-[#104F38]/30 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <CloudUpload className="w-4 h-4 shrink-0" />
              <span>{isBackingUp ? 'Mengunggah ke Drive...' : 'Backup Sekarang'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectDrive}
              disabled={isConnectingDrive}
              className="inline-flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-[#F4FAF6] text-[#1F1F1F] border border-[#747775] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-2xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isConnectingDrive ? 'Menghubungkan...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banners */}
      {activeError && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              onClearBanner();
            }}
            className="text-rose-700 hover:underline font-bold cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {activeNotice && (
        <div className="bg-[#F4FAF6] border border-[#104F38]/30 text-[#104F38] px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#104F38] shrink-0" />
            <span>{activeNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalNotice(null);
              onClearBanner();
            }}
            className="text-[#104F38] hover:underline font-bold cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#104F38]/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-[#104F38]/65">QR Code Dinamis Aktif</div>
          <div className="text-2xl font-extrabold text-[#104F38] tabular-nums">{qrcodes.length}</div>
        </div>
        <div className="bg-white border border-[#104F38]/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-[#104F38]/65">Tag NFC Terdaftar</div>
          <div className="text-2xl font-extrabold text-[#104F38] tabular-nums">{nfcTags.length}</div>
        </div>
        <div className="bg-white border border-[#104F38]/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-[#104F38]/65">File Cadangan di Drive</div>
          <div className="text-2xl font-extrabold text-[#104F38] tabular-nums">
            {driveAccessToken ? backups.length : '-'}
          </div>
        </div>
      </div>

      {/* Two-Column Setup: Google Drive Connection & Automation Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Google Drive Account & Local Fallback */}
        <div className="lg:col-span-5 bg-white border border-[#104F38]/20 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-[#104F38]">Koneksi Akun Google Drive</h2>
              <p className="text-xs text-[#104F38]/75 leading-relaxed">
                Aplikasi hanya mengakses file cadangan milik Projecttapp yang dibuat melalui aplikasi ini.
              </p>
            </div>

            {driveAccessToken && driveUser ? (
              <div className="bg-[#F4FAF6] border border-[#104F38]/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#104F38] truncate">
                      {driveUser.displayName || 'Akun Google Terhubung'}
                    </div>
                    <div className="text-[11px] font-mono text-[#104F38]/70 truncate">
                      {driveUser.email}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#104F38] shrink-0">Terhubung</span>
                </div>
                <button
                  type="button"
                  onClick={onDisconnectDrive}
                  className="w-full py-2 px-3 bg-white hover:bg-rose-50 text-[#104F38] hover:text-rose-700 border border-[#104F38]/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan Koneksi Drive</span>
                </button>
              </div>
            ) : (
              <div className="bg-[#F4FAF6] border border-[#104F38]/20 p-4 space-y-3">
                <p className="text-xs text-[#104F38]/80 leading-relaxed">
                  Masuk dengan akun Google Anda untuk mengaktifkan unggahan otomatis, melihat riwayat file backup, dan memulihkan data dari Google Drive.
                </p>
                <button
                  type="button"
                  onClick={onConnectDrive}
                  disabled={isConnectingDrive}
                  className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-[#F8FAF9] text-[#1F1F1F] border border-[#747775] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isConnectingDrive ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Local JSON Backup & Restore Controls */}
          <div className="pt-4 border-t border-[#104F38]/15 space-y-2.5">
            <div className="text-xs font-bold text-[#104F38]">Cadangan File Lokal (.json)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportLocalJson}
                disabled={isExportingLocal}
                className="py-2 px-3 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingLocal ? 'Mengunduh...' : 'Unduh JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => localFileInputRef.current?.click()}
                className="py-2 px-3 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore File Lokal</span>
              </button>
              <input
                ref={localFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handlePickLocalFileForRestore}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Right: Automation Rules & Schedule */}
        <div className="lg:col-span-7 bg-white border border-[#104F38]/20 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#104F38]/15">
              <div className="space-y-0.5">
                <h2 className="text-base font-extrabold text-[#104F38]">Pengaturan Automatisasi Backup</h2>
                <p className="text-xs text-[#104F38]/75">
                  Jadwalkan pencadangan otomatis ke Google Drive saat dashboard aktif.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoBackup}
                aria-pressed={autoConfig.enabled}
                className={`px-4 py-2 text-xs font-extrabold border transition-colors cursor-pointer shrink-0 ${
                  autoConfig.enabled
                    ? 'bg-[#104F38] text-[#FFE600] border-[#104F38]'
                    : 'bg-[#F4FAF6] text-[#104F38] border-[#104F38]/25 hover:bg-[#FFE600]/40'
                }`}
              >
                {autoConfig.enabled ? 'Auto-Backup: Aktif' : 'Aktifkan Auto-Backup'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="drive-interval-select" className="block text-xs font-bold text-[#104F38]">
                  Interval Jadwal Backup Otomatis
                </label>
                <select
                  id="drive-interval-select"
                  value={autoConfig.intervalMinutes}
                  onChange={(e) =>
                    onUpdateAutoConfig({
                      ...autoConfig,
                      intervalMinutes: Number(e.target.value) || 15
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#104F38]/25 text-[#104F38] font-semibold focus:outline-none focus:border-[#104F38]"
                >
                  <option value={5}>Setiap 5 Menit</option>
                  <option value={15}>Setiap 15 Menit</option>
                  <option value={60}>Setiap 1 Jam</option>
                  <option value={360}>Setiap 6 Jam</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-[#104F38]">Pemicu Perubahan Data</span>
                <label className="flex items-start gap-2.5 p-2.5 bg-[#F4FAF6] border border-[#104F38]/15 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoConfig.autoOnDataChange}
                    onChange={(e) =>
                      onUpdateAutoConfig({
                        ...autoConfig,
                        autoOnDataChange: e.target.checked
                      })
                    }
                    className="mt-0.5 accent-[#104F38]"
                  />
                  <span className="text-xs text-[#104F38]/85 leading-snug">
                    Backup otomatis setiap kali data QR atau Tag NFC berubah
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-[#F4FAF6] border border-[#104F38]/15 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="text-[#104F38]/65 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Backup Terakhir</span>
              </div>
              <div className="font-bold text-[#104F38] tabular-nums">
                {formatDateTime(autoConfig.lastBackupAt)}
              </div>
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[#104F38]/65 font-semibold">Nama File Terakhir</div>
              <div className="font-mono text-[11px] font-bold text-[#104F38] truncate">
                {autoConfig.lastBackupFileName || 'Belum ada file backup'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Backup Files Table / List */}
      <div className="bg-white border border-[#104F38]/20">
        <div className="px-5 py-4 border-b border-[#104F38]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#104F38]">
              Daftar File Cadangan di Google Drive
            </h2>
            <p className="text-xs text-[#104F38]/70">
              Folder tujuan: <span className="font-mono font-semibold text-[#104F38]">Projecttapp Backups</span>
            </p>
          </div>

          {driveAccessToken && (
            <button
              type="button"
              onClick={fetchBackupsList}
              disabled={loadingList}
              className="px-3.5 py-2 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/25 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          )}
        </div>

        {!driveAccessToken ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-bold text-[#104F38]">
              Google Drive belum terhubung pada sesi ini
            </p>
            <p className="text-xs text-[#104F38]/70 max-w-md mx-auto">
              Klik tombol <strong>Sign in with Google</strong> di atas untuk melihat daftar file cadangan Anda dan memulihkan data dari Google Drive.
            </p>
          </div>
        ) : loadingList ? (
          <div className="p-5 space-y-2.5">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-12 bg-[#F4FAF6] border border-[#104F38]/10" />
            ))}
          </div>
        ) : backups.length === 0 ? (
          <div className="p-10 text-center space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#104F38]">Belum ada file cadangan di Google Drive</p>
              <p className="text-xs text-[#104F38]/70">
                Buat cadangan pertama Anda sekarang agar data QR Dinamis dan Tag NFC aman tersimpan di Drive.
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualBackupClick}
              disabled={isBackingUp}
              className="px-5 py-2.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isBackingUp ? 'Mengunggah...' : 'Buat Backup Pertama'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#104F38]/15 bg-[#F4FAF6] text-[#104F38]/75 font-bold">
                  <th className="py-3 px-4">Nama File Cadangan</th>
                  <th className="py-3 px-4 whitespace-nowrap">Waktu Dibuat</th>
                  <th className="py-3 px-4 whitespace-nowrap">Ukuran</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#104F38]/10">
                {backups.map((file) => {
                  const isBusy = loadingPreviewFileId === file.id;
                  return (
                    <tr key={file.id} className="hover:bg-[#F4FAF6]/60 transition-colors">
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="font-mono font-bold text-[#104F38]">{file.name}</div>
                        {file.description && (
                          <div className="text-[11px] text-[#104F38]/70 mt-0.5">{file.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums text-[#104F38]/80">
                        {formatDateTime(file.createdTime || file.modifiedTime)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-[#104F38]/75">
                        {formatSize(file.size)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrepareDriveRestore(file)}
                            disabled={isBusy}
                            className="px-3 py-1.5 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isBusy ? 'Memuat...' : 'Restore'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadDriveBackupFile(file)}
                            disabled={isBusy}
                            title="Unduh file cadangan"
                            className="p-1.5 bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/20 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPendingDeleteFile(file)}
                            disabled={isBusy}
                            title="Hapus file dari Google Drive"
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL: Enable Auto-Backup */}
      {confirmEnableAutoOpen && (
        <div className="fixed inset-0 z-50 bg-[#0a2318]/65 flex items-center justify-center p-4">
          <div className="bg-white border border-[#104F38]/30 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <CloudUpload className="w-5 h-5 text-[#104F38] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#104F38]">
                  Aktifkan Backup Otomatis ke Google Drive?
                </h3>
                <p className="text-xs text-[#104F38]/80 leading-relaxed">
                  Saat aktif dan Google Drive terhubung, aplikasi akan otomatis membuat file cadangan baru (<span className="font-mono">projecttapp-backup-auto-*.json</span>) ke folder <strong>Projecttapp Backups</strong> setiap <strong>{autoConfig.intervalMinutes} menit</strong>{autoConfig.autoOnDataChange ? ' serta saat ada perubahan data QR atau NFC' : ''}.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEnableAutoOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#104F38] bg-white hover:bg-[#F4FAF6] border border-[#104F38]/25 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateAutoConfig({ ...autoConfig, enabled: true });
                  setConfirmEnableAutoOpen(false);
                  setLocalNotice('Automatisasi backup Google Drive berhasil diaktifkan.');
                }}
                className="px-4 py-2 text-xs font-bold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/30 cursor-pointer"
              >
                Ya, Aktifkan Auto-Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Restore Data from Backup */}
      {pendingRestore && (
        <div className="fixed inset-0 z-50 bg-[#0a2318]/65 flex items-center justify-center p-4">
          <div className="bg-white border border-[#104F38]/30 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#104F38]">
                  Konfirmasi Pulihkan (Restore) Data
                </h3>
                <p className="text-xs text-[#104F38]/80 leading-relaxed">
                  Anda akan memulihkan data dari <strong>{pendingRestore.sourceLabel}</strong> (<span className="font-mono">{pendingRestore.fileName}</span>).
                </p>
              </div>
            </div>

            <div className="bg-[#F4FAF6] border border-[#104F38]/15 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#104F38]/70">Waktu Ekspor Cadangan:</span>
                <strong className="text-[#104F38] tabular-nums">
                  {formatDateTime(pendingRestore.payload.exportedAt)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#104F38]/70">Jumlah QR Dinamis dalam File:</span>
                <strong className="text-[#104F38] tabular-nums">
                  {pendingRestore.payload.qrcodes?.length || 0} item
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#104F38]/70">Jumlah Tag NFC dalam File:</span>
                <strong className="text-[#104F38] tabular-nums">
                  {pendingRestore.payload.nfcTags?.length || 0} tag
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#104F38]/70">Riwayat Scan dalam File:</span>
                <strong className="text-[#104F38] tabular-nums">
                  {pendingRestore.payload.scans?.length || 0} catatan
                </strong>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#104F38]">Pilih Metode Pemulihan Data:</div>
              <label className="flex items-start gap-2.5 p-2.5 border border-[#104F38]/20 cursor-pointer hover:bg-[#F4FAF6]">
                <input
                  type="radio"
                  name="restore-mode"
                  checked={pendingRestore.mode === 'replace'}
                  onChange={() => setPendingRestore({ ...pendingRestore, mode: 'replace' })}
                  className="mt-0.5 accent-[#104F38]"
                />
                <span>
                  <strong className="text-[#104F38] block">Restore Penuh (Timpa Data Saat Ini)</strong>
                  <span className="text-[#104F38]/75">
                    Mengganti seluruh data QR Dinamis ({qrcodes.length}) &amp; Tag NFC ({nfcTags.length}) di server dengan isi file cadangan ini.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 border border-[#104F38]/20 cursor-pointer hover:bg-[#F4FAF6]">
                <input
                  type="radio"
                  name="restore-mode"
                  checked={pendingRestore.mode === 'merge'}
                  onChange={() => setPendingRestore({ ...pendingRestore, mode: 'merge' })}
                  className="mt-0.5 accent-[#104F38]"
                />
                <span>
                  <strong className="text-[#104F38] block">Gabungkan (Merge Tanpa Hapus Data Lama)</strong>
                  <span className="text-[#104F38]/75">
                    Mempertahankan data yang sudah ada dan menambahkan/memperbarui item dari file cadangan.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setPendingRestore(null)}
                className="px-4 py-2 text-xs font-bold text-[#104F38] bg-white hover:bg-[#F4FAF6] border border-[#104F38]/25 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-[#104F38] hover:bg-[#0C3B2A] border border-[#104F38] cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? 'Memulihkan Data...' : 'Ya, Pulihkan Data Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Delete Backup File from Google Drive */}
      {pendingDeleteFile && (
        <div className="fixed inset-0 z-50 bg-[#0a2318]/65 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#104F38]">
                  Hapus Cadangan dari Google Drive?
                </h3>
                <p className="text-xs text-[#104F38]/80 leading-relaxed">
                  File <span className="font-mono font-bold text-[#104F38]">{pendingDeleteFile.name}</span> akan dihapus permanen dari akun Google Drive Anda. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={() => setPendingDeleteFile(null)}
                className="px-4 py-2 text-xs font-bold text-[#104F38] bg-white hover:bg-[#F4FAF6] border border-[#104F38]/25 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={handleConfirmDeleteDriveFile}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {isDeletingFile ? 'Menghapus...' : 'Ya, Hapus dari Drive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
