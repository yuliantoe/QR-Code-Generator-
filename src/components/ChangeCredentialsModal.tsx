import React, { useState } from 'react';
import { KeyRound, User, Lock, Eye, EyeOff, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '../types.ts';

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  authToken: string;
  onCredentialsUpdated: (updatedUser: AuthUser) => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  onCredentialsUpdated
}) => {
  const isAdmin = currentUser.username.toLowerCase() === 'admin';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(currentUser.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Password saat ini wajib diisi untuk verifikasi keamanan.');
      return;
    }

    // ATURAN KEAMANAN: User tidak bisa ganti username Administrator
    if (isAdmin && newUsername.trim().toLowerCase() !== 'admin') {
      setErrorMessage('Username Administrator sistem terkunci dan tidak dapat diubah.');
      return;
    }

    if (!isAdmin && newUsername.trim().toLowerCase() === 'admin') {
      setErrorMessage('Username "admin" dilindungi khusus untuk akun Administrator.');
      return;
    }

    const finalTargetUsername = isAdmin ? 'admin' : newUsername.trim();

    if (!finalTargetUsername || finalTargetUsername.length < 3) {
      setErrorMessage('Username minimal 3 karakter.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('Password baru minimal 4 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currentPassword,
          newUsername: finalTargetUsername,
          newPassword
        })
      });

      const json = await res.json();
      if (json.success && json.user) {
        setSuccessMessage(isAdmin ? 'Password Administrator berhasil diperbarui!' : 'Username dan password berhasil diubah!');
        onCredentialsUpdated(json.user);
        localStorage.setItem('dinamis_auth_user', JSON.stringify(json.user));
        
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(json.error || 'Gagal mengubah kredensial.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full border border-[#104F38]/30 shadow-xl relative overflow-hidden">
        
        {/* Wireframe Bracket Accent Top-Left */}
        <div className="absolute -left-2 -top-2 w-6 h-6 border-t-2 border-l-2 border-[#104F38]/40" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#104F38]/10 flex items-center justify-between bg-[#F4FAF6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#104F38] text-white flex items-center justify-center border border-[#104F38]">
              <KeyRound className="w-5 h-5 text-[#FFE600]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#104F38]">
                {isAdmin ? 'Ganti Password Administrator' : 'Ganti Username & Password'}
              </h3>
              <p className="text-[11px] text-[#104F38]/70 font-medium">
                {isAdmin
                  ? 'Perbarui password akun administrator (Username "admin" terkunci permanen)'
                  : 'Perbarui data login akun Anda'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#104F38]/60 hover:text-[#104F38] p-1.5 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {/* Notification Messages */}
          {errorMessage && (
            <div className="p-3 bg-[#FCD5CE]/50 border border-[#FCD5CE] text-[#104F38] text-xs font-bold flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current Username Info */}
          <div className="p-3 bg-[#F8FAF9] border border-[#104F38]/15 text-xs flex items-center justify-between">
            <span className="text-[#104F38]/70">Akun Saat Ini:</span>
            <span className="font-mono font-bold text-[#104F38] bg-[#FFE600] px-2 py-0.5 border border-[#104F38]/20 flex items-center gap-1.5">
              {isAdmin && <Lock className="w-3 h-3 text-[#104F38]" />}
              {currentUser.username}
            </span>
          </div>

          {/* 1. Current Password (Verification) */}
          <div>
            <label className="block text-xs font-bold text-[#104F38] mb-1">
              Password Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
              <input
                type={showCurrentPass ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password lama Anda"
                className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-medium text-[#104F38]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-2.5 text-[#104F38]/50 hover:text-[#104F38]"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#104F38]/10 space-y-3">
            {/* 2. Username Field: Readonly & locked if Administrator */}
            <div>
              <label className="block text-xs font-bold text-[#104F38] mb-1">
                {isAdmin ? 'Username Administrator (Terkunci)' : 'Username Baru'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
                {isAdmin ? (
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="admin"
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-[#104F38]/20 font-bold text-[#104F38]/70 cursor-not-allowed select-none"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Username baru (minimal 3 karakter)"
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-medium text-[#104F38]"
                  />
                )}
              </div>
              {isAdmin && (
                <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Username Administrator tidak dapat diubah demi perlindungan hak akses sistem.</span>
                </div>
              )}
            </div>

            {/* 3. New Password */}
            <div>
              <label className="block text-xs font-bold text-[#104F38] mb-1">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru (minimal 4 karakter)"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-medium text-[#104F38]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-[#104F38]/50 hover:text-[#104F38]"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 4. Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-[#104F38] mb-1">
                Konfirmasi Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-medium text-[#104F38]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-2.5 text-[#104F38]/50 hover:text-[#104F38]"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[#104F38]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#104F38]/70 hover:text-[#104F38] bg-white border border-[#104F38]/20 cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/20 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Kredensial Baru</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
