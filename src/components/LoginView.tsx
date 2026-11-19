import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, AlertTriangle, LogIn, Clock, ArrowLeft, Radio, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AuthUser } from '../types.ts';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onBackToHome?: () => void;
  onOpenPublicActivation?: () => void;
  sessionExpiredMessage?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onBackToHome,
  onOpenPublicActivation,
  sessionExpiredMessage
}) => {
  // Form fields start clean & empty - user must input explicitly
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const formatCooldown = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    if (mins > 0) {
      return `${mins} menit ${rem.toString().padStart(2, '0')} detik`;
    }
    return `${rem} detik`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password })
      });

      const contentType = res.headers.get('content-type') || '';
      const json = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

      if (res.status === 429 || json?.rateLimited) {
        const retryHeader = parseInt(res.headers.get('Retry-After') || '0', 10);
        const retrySecs = Number(json?.retryAfterSeconds) || (!isNaN(retryHeader) && retryHeader > 0 ? retryHeader : 60);
        setCooldownSeconds(retrySecs);
        setErrorMessage(
          json?.error ||
            `Terlalu banyak percobaan login gagal. Silakan tunggu ${formatCooldown(retrySecs)} sebelum mencoba lagi.`
        );
        return;
      }

      if (res.ok && json?.success && json?.user && json?.token) {
        localStorage.setItem('dinamis_auth_token', json.token);
        localStorage.setItem('dinamis_auth_user', JSON.stringify(json.user));
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch {}
        onLoginSuccess(json.user, json.token);
        return;
      }

      setErrorMessage(json?.error || 'Username atau password tidak sesuai.');
    } catch {
      setErrorMessage('Gagal terhubung ke server autentikasi. Pastikan server aktif dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FAF6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-none p-6 sm:p-8 border border-[#104F38]/25 relative">
        
        {/* Wireframe Bracket Accent on Top-Left */}
        <div className="absolute -left-2 -top-2 w-6 h-6 border-t-2 border-l-2 border-[#104F38]/60 pointer-events-none" />

        {/* Brand Icon & Title in Forest Green */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-none bg-[#104F38] text-[#FFE600] flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-7 h-7 text-[#FFE600]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3 3h7v7H3V3zm2 2v3h3V5H5z" />
              <rect x="6" y="6" width="1" height="1" />
              <path d="M14 3h7v7h-7V3zm2 2v3h3V5h-3z" />
              <rect x="17" y="6" width="1" height="1" />
              <path d="M3 14h7v7H3v-7zm2 2v3h3v-3H5z" />
              <rect x="6" y="17" width="1" height="1" />
              <rect x="11" y="3" width="2" height="2" />
              <rect x="11" y="7" width="2" height="2" />
              <rect x="3" y="11" width="2" height="2" />
              <rect x="7" y="11" width="2" height="2" />
              <rect x="11" y="11" width="2" height="2" />
              <rect x="14" y="11" width="3" height="2" />
              <rect x="19" y="11" width="2" height="2" />
              <rect x="11" y="15" width="2" height="2" />
              <rect x="14" y="14" width="2" height="2" />
              <rect x="18" y="14" width="3" height="2" />
              <rect x="15" y="17" width="2" height="2" />
              <rect x="11" y="19" width="2" height="2" />
              <rect x="14" y="19" width="2" height="2" />
              <rect x="18" y="18" width="3" height="3" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#104F38] tracking-tight">
            Projecttapp
          </h1>
          <p className="text-xs text-[#104F38]/75 mt-1 font-medium">
            Sistem Manajemen QR Dinamis &amp; Stand Meja Akrilik
          </p>
        </div>

        {/* Session Inactivity Timeout Notification (3 Menit Inactive) */}
        {sessionExpiredMessage && !errorMessage && cooldownSeconds === 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-amber-900">Sesi Berakhir Otomatis</div>
              <div className="text-[11px] text-amber-800 font-medium mt-0.5 leading-snug">{sessionExpiredMessage}</div>
            </div>
          </div>
        )}

        {/* Rate Limit / Security Lockout Banner */}
        {cooldownSeconds > 0 && (
          <div role="alert" className="mb-4 p-3 bg-amber-50 border border-amber-400 text-amber-950 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-amber-900">Proteksi Rate Limit Login Aktif</div>
              <div className="text-[11px] text-amber-900 leading-snug">{errorMessage}</div>
              <div className="text-[11px] font-mono font-bold text-[#104F38] tabular-nums">
                Tunggu: {formatCooldown(cooldownSeconds)}
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && cooldownSeconds === 0 && (
          <div role="alert" className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-xs font-bold text-[#104F38] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#104F38]/25 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-[#104F38] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/25 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-[#104F38]/50 hover:text-[#104F38] cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            className="w-full py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-3.5 h-3.5 text-[#FFE600]" />
            <span>
              {cooldownSeconds > 0
                ? `Terkunci (${formatCooldown(cooldownSeconds)})`
                : loading
                  ? 'Memeriksa...'
                  : 'Masuk ke Dashboard'}
            </span>
          </button>
        </form>

        <div className="mt-6 pt-3 border-t border-[#104F38]/10 text-center space-y-3">
          {onOpenPublicActivation && (
            <div className="p-3 bg-[#F4FAF6] border border-[#104F38]/20 space-y-2 text-left">
              <div className="text-xs font-extrabold text-[#104F38]">
                Aktivasi Tag NFC Mandiri
              </div>
              <p className="text-[11px] text-[#104F38]/75 leading-snug">
                Ingin aktivasi tag NFC dengan kode QR (misal QR001) tanpa username &amp; password?
              </p>
              <button
                type="button"
                onClick={onOpenPublicActivation}
                className="w-full py-2 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/25 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Buka Menu Aktivasi Tag NFC</span>
              </button>
            </div>
          )}

          <p className="text-[11px] text-[#104F38]/65">
            Masukkan akun terdaftar Anda untuk mengakses manajemen tautan &amp; desain stand meja.
          </p>
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#104F38] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
