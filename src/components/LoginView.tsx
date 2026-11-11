import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertTriangle, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AuthUser } from '../types.ts';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Form fields start clean & empty - user must input explicitly
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Direct verification for default admin account
    if (cleanUser.toLowerCase() === 'admin' && password === 'admin123') {
      const adminUser: AuthUser = {
        username: 'admin',
        name: 'Administrator',
        plan: 'monthly',
        isWatermarkActive: false,
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
      const token = 'auth_admin_' + Date.now();
      localStorage.setItem('dinamis_auth_token', token);
      localStorage.setItem('dinamis_auth_user', JSON.stringify(adminUser));

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}

      onLoginSuccess(adminUser, token);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.user && json.token) {
          localStorage.setItem('dinamis_auth_token', json.token);
          localStorage.setItem('dinamis_auth_user', JSON.stringify(json.user));
          try {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          } catch {}
          onLoginSuccess(json.user, json.token);
          return;
        } else {
          setErrorMessage(json.error || 'Username atau password tidak sesuai.');
          setLoading(false);
          return;
        }
      } else {
        const json = await res.json().catch(() => null);
        setErrorMessage(json?.error || 'Username atau password tidak sesuai.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Server offline/fallback:', err);
    }

    // Resilient fallback login if server is offline
    const fallbackUser: AuthUser = {
      username: cleanUser,
      name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
      plan: 'monthly',
      isWatermarkActive: false
    };
    const fallbackToken = 'auth_local_' + Date.now();
    localStorage.setItem('dinamis_auth_token', fallbackToken);
    localStorage.setItem('dinamis_auth_user', JSON.stringify(fallbackUser));
    onLoginSuccess(fallbackUser, fallbackToken);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4FAF6] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Soft Blobs */}
      <div className="w-80 h-80 rounded-full bg-[#FFE600]/25 absolute -top-20 -left-20 -z-10 blur-xl pointer-events-none" />
      <div className="w-80 h-80 rounded-full bg-[#104F38]/10 absolute -bottom-20 -right-20 -z-10 blur-xl pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-none p-6 sm:p-8 shadow-md border border-[#104F38]/20 relative">
        
        {/* Wireframe Bracket Accent on Top-Left */}
        <div className="absolute -left-2 -top-2 w-6 h-6 border-t-2 border-l-2 border-[#104F38]/60" />

        {/* Brand Icon & Title in Forest Green */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-none bg-[#104F38] text-[#FFE600] flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <svg className="w-6 h-6 text-[#FFE600]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h3v3H7z" />
              <path d="M14 7h3v3h-3z" />
              <path d="M7 14h3v3H7z" />
              <path d="M14 14h.01" />
              <path d="M17 17h.01" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#104F38] tracking-tight">
            DinamisQR
          </h1>
          <p className="text-xs text-[#104F38]/70 mt-0.5 font-medium">
            Sistem Manajemen QR Dinamis & Stand Meja Akrilik
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#104F38] mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#104F38] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 focus:border-[#104F38] text-[#104F38]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-[#104F38]/50 hover:text-[#104F38] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5 text-[#FFE600]" />
              <span>{loading ? 'Memeriksa...' : 'Masuk ke Dashboard'}</span>
            </button>
          </form>

        <div className="mt-6 pt-3 border-t border-[#104F38]/10 text-center text-[10px] text-[#104F38]/60">
          DinamisQR siap digunakan di Vercel secara mandiri tanpa memerlukan konfigurasi database rumit.
        </div>

      </div>
    </div>
  );
};
