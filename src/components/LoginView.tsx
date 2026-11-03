import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
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

      const json = await res.json();
      if (json.success && json.user && json.token) {
        localStorage.setItem('dinamis_auth_token', json.token);
        localStorage.setItem('dinamis_auth_user', JSON.stringify(json.user));
        onLoginSuccess(json.user, json.token);
      } else {
        setErrorMessage(json.error || 'Username atau password tidak sesuai.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Soft Whimsical Blobs */}
      <div className="w-64 h-64 rounded-full bg-[#FCD5CE] absolute -top-16 -left-16 -z-10 opacity-70 pointer-events-none" />
      <div className="w-56 h-56 rounded-full bg-[#EAF5F0] absolute -bottom-16 -right-16 -z-10 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-none p-5 sm:p-9 shadow-sm border border-[#104F38]/20 relative">
        
        {/* Wireframe Bracket Accent on Top-Left */}
        <div className="absolute -left-2 -top-2 w-6 h-6 border-t-2 border-l-2 border-[#104F38]/40" />

        {/* Brand Icon & Title in Forest Green */}
        <div className="text-center mb-8">
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
          <p className="text-xs text-[#104F38]/70 mt-1.5 leading-relaxed font-medium">
            Pitch Excellence: Masuk ke panel generator QR Code dinamis & aktivasi NFC.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 p-3 bg-[#FCD5CE]/40 border border-[#FCD5CE] text-[#104F38] text-xs rounded-none font-bold animate-in fade-in">
            {errorMessage}
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
                placeholder="Masukkan username"
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

        <div className="mt-8 pt-6 border-t border-[#104F38]/10 text-center text-[11px] text-[#104F38]/60">
          Sistem manajemen cetak QR dinamis & NFC Google Review terlindungi otentikasi.
        </div>

      </div>
    </div>
  );
};
