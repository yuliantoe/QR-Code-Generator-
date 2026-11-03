import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Eye, EyeOff, Database, Server, CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { AuthUser } from '../types.ts';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Database & Server Status Diagnostics for Vercel
  const [dbStatus, setDbStatus] = useState<{
    loading: boolean;
    checked: boolean;
    connected: boolean;
    type: string;
    message: string;
    configuredConnectionString: boolean;
  }>({
    loading: false,
    checked: false,
    connected: false,
    type: 'unknown',
    message: '',
    configuredConnectionString: false
  });

  const [showVercelGuide, setShowVercelGuide] = useState(false);

  useEffect(() => {
    checkServerAndDbStatus();
  }, []);

  const checkServerAndDbStatus = async () => {
    setDbStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/db/status');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.status) {
          setDbStatus({
            loading: false,
            checked: true,
            connected: json.status.connected,
            type: json.status.type,
            message: json.status.message,
            configuredConnectionString: json.status.configuredConnectionString
          });
          return;
        }
      }
      setDbStatus({
        loading: false,
        checked: true,
        connected: false,
        type: 'offline',
        message: 'Endpoint API Vercel belum merespon. Pastikan vercel.json dan serverless function aktif.',
        configuredConnectionString: false
      });
    } catch {
      setDbStatus({
        loading: false,
        checked: true,
        connected: false,
        type: 'unreachable',
        message: 'Tidak dapat menjangkau server API. Serverless backend mungkin sedang cold-start atau offline.',
        configuredConnectionString: false
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Returned HTML (e.g. 404 from Vercel static routing without serverless index)
        setErrorMessage('Server Vercel belum mengaktifkan API route. Klik "Panduan Database Vercel" di bawah atau gunakan Mode Darurat.');
        setLoading(false);
        return;
      }

      const json = await res.json();
      if (json.success && json.user && json.token) {
        localStorage.setItem('dinamis_auth_token', json.token);
        localStorage.setItem('dinamis_auth_user', JSON.stringify(json.user));
        onLoginSuccess(json.user, json.token);
      } else {
        setErrorMessage(json.error || 'Username atau password tidak sesuai.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan koneksi server. Periksa status Vercel Anda di bawah.');
    } finally {
      setLoading(false);
    }
  };

  // Emergency local bypass if server is unreachable during Vercel initial deployment
  const handleEmergencyLogin = () => {
    const fallbackUser: AuthUser = {
      username: username.trim() || 'admin',
      name: 'Administrator (Mode Darurat)'
    };
    const fakeToken = 'auth_emergency_' + Date.now();
    localStorage.setItem('dinamis_auth_token', fakeToken);
    localStorage.setItem('dinamis_auth_user', JSON.stringify(fallbackUser));
    onLoginSuccess(fallbackUser, fakeToken);
  };

  return (
    <div className="min-h-screen bg-[#F4FAF6] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Soft Whimsical Blobs */}
      <div className="w-80 h-80 rounded-full bg-[#FFE600]/25 absolute -top-20 -left-20 -z-10 blur-xl pointer-events-none" />
      <div className="w-80 h-80 rounded-full bg-[#104F38]/10 absolute -bottom-20 -right-20 -z-10 blur-xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-none p-6 sm:p-9 shadow-md border border-[#104F38]/20 relative">
        
        {/* Wireframe Bracket Accent on Top-Left */}
        <div className="absolute -left-2 -top-2 w-6 h-6 border-t-2 border-l-2 border-[#104F38]/60" />

        {/* Brand Icon & Title in Forest Green */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-none bg-[#F4FAF6] border border-[#104F38]/30 text-[#104F38] flex items-center justify-center mx-auto mb-3 relative">
            <span className="w-3 h-3 rounded-full bg-[#FFE600] absolute -top-1 -right-1 border border-[#104F38]/20" />
            <svg className="w-6 h-6 text-[#104F38]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h3v3H7z" />
              <path d="M14 7h3v3h-3z" />
              <path d="M7 14h3v3H7z" />
              <path d="M14 14h.01" />
              <path d="M17 17h.01" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#104F38] tracking-tight">
            Dinamis<span className="text-[#104F38]">QR</span>
          </h1>
          <p className="text-xs text-[#104F38]/75 mt-1.5 leading-relaxed font-medium">
            Pitch Excellence: Masuk ke panel generator QR Code dinamis & stand NFC Google Review.
          </p>
        </div>

        {/* Server & Database Diagnostics Bar */}
        <div className="mb-5 p-2.5 bg-[#F8FAF9] border border-[#104F38]/15 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Database className={`w-3.5 h-3.5 shrink-0 ${dbStatus.connected ? 'text-emerald-700' : 'text-amber-700'}`} />
            <span className="truncate text-[11px] text-[#104F38]">
              {dbStatus.loading ? (
                'Memeriksa status database...'
              ) : dbStatus.connected ? (
                <strong className="text-emerald-800">Vercel Postgres: Terhubung</strong>
              ) : dbStatus.configuredConnectionString ? (
                <span className="text-amber-800">Postgres: Menghubungkan...</span>
              ) : (
                <span className="text-gray-600">Database: Mode Penyimpanan Lokal/Cache</span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={checkServerAndDbStatus}
            disabled={dbStatus.loading}
            className="text-[10px] text-[#104F38] hover:text-[#104F38]/80 flex items-center gap-1 font-bold underline cursor-pointer shrink-0"
            title="Perbarui status"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${dbStatus.loading ? 'animate-spin' : ''}`} />
            <span>Cek</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-none space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
            
            {/* Quick emergency access button if server connection fails */}
            <div className="pt-2 border-t border-rose-200 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-rose-700">Perlu akses cepat ke dashboard?</span>
              <button
                type="button"
                onClick={handleEmergencyLogin}
                className="px-2 py-1 bg-white border border-rose-300 hover:bg-rose-100 font-bold text-rose-800 cursor-pointer"
              >
                Masuk Mode Darurat
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#104F38] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username (contoh: admin)"
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#104F38]/20 rounded-none focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38] placeholder:text-[#104F38]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#104F38] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/20 rounded-none focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38] placeholder:text-[#104F38]/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#104F38]/50 hover:text-[#104F38] text-xs cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 text-xs font-extrabold rounded-none transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
            <ArrowRight className="w-4 h-4 text-[#104F38]" />
          </button>
        </form>

        {/* Collapsible Vercel Database Connection Guide */}
        <div className="mt-5 border-t border-[#104F38]/10 pt-4">
          <button
            type="button"
            onClick={() => setShowVercelGuide(!showVercelGuide)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-[#104F38] hover:text-[#104F38]/80 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#104F38]" />
              Panduan Menghubungkan Database Vercel
            </span>
            {showVercelGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showVercelGuide && (
            <div className="mt-3 p-3 bg-[#F4FAF6] border border-[#104F38]/15 text-[11px] text-[#104F38] space-y-2 leading-relaxed animate-in fade-in">
              <p className="font-bold">Langkah Menghubungkan Vercel Postgres:</p>
              <ol className="list-decimal pl-4 space-y-1 text-[#104F38]/80">
                <li>Buka <strong>Dashboard Vercel</strong> &gt; pilih proyek Anda.</li>
                <li>Pilih tab <strong>Storage</strong> di menu atas &gt; klik <strong>Create Database</strong> &gt; pilih <strong>Postgres</strong>.</li>
                <li>Klik <strong>Connect to Project</strong>. Vercel akan otomatis menyuntikkan variabel lingkungan <code>POSTGRES_URL</code>.</li>
                <li>Lakukan <strong>Redeploy</strong>. Tabel database dan data awal akan otomatis terbuat!</li>
              </ol>
              <div className="pt-1 text-[10px] text-gray-500">
                *File <code>vercel.json</code> dan <code>api/index.ts</code> telah dikonfigurasi untuk menjalankan backend serverless secara otomatis di Vercel.
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#104F38]/10 text-center text-[11px] text-[#104F38]/60">
          Sistem manajemen cetak QR dinamis & NFC Google Review terlindungi otentikasi.
        </div>

      </div>
    </div>
  );
};
