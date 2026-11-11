import React, { useState, useEffect } from 'react';
import { UserPlus, Users, User, Lock, Eye, EyeOff, Check, X, Shield, ShieldCheck, Sparkles, AlertTriangle, Copy, CheckCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AuthUser, SubscriptionPlan } from '../types.ts';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string;
}

interface UserItem {
  username: string;
  name: string;
  email?: string;
  phone?: string;
  plan: SubscriptionPlan;
  trialExpiresAt?: string | null;
  subscriptionExpiresAt?: string | null;
  isWatermarkActive: boolean;
  createdAt?: string;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  authToken
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>('monthly');
  const [isWatermarkActive, setIsWatermarkActive] = useState(false);

  // Users List State
  const [users, setUsers] = useState<UserItem[]>(() => {
    try {
      const cached = localStorage.getItem('dinamis_users_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [
      {
        username: 'admin',
        name: 'Administrator',
        plan: 'monthly',
        isWatermarkActive: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedUser, setCopiedUser] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setUsers(json.data);
          try {
            localStorage.setItem('dinamis_users_cache', JSON.stringify(json.data));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Fallback ke daftar user lokal:', err);
    }
  };

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

    if (!cleanName) {
      setErrorMessage('Nama lengkap user wajib diisi.');
      return;
    }

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username minimal 3 karakter (huruf kecil, angka, garis bawah).');
      return;
    }

    if (cleanUser === 'admin') {
      setErrorMessage('Username "admin" dilindungi khusus untuk Administrator sistem dan tidak dapat dibuat ulang.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Password minimal 4 karakter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: cleanName,
          username: cleanUser,
          password,
          plan,
          isWatermarkActive
        })
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        setSuccessMessage(`User "${cleanUser}" berhasil ditambahkan ke sistem!`);
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch {}

        const newUserItem: UserItem = {
          name: cleanName,
          username: cleanUser,
          plan,
          isWatermarkActive,
          createdAt: new Date().toISOString()
        };

        const updatedList = [...users.filter(u => u.username !== cleanUser), newUserItem];
        setUsers(updatedList);
        try {
          localStorage.setItem('dinamis_users_cache', JSON.stringify(updatedList));
        } catch {}

        // Reset form
        setName('');
        setUsername('');
        setPassword('');
        setPlan('monthly');
        setIsWatermarkActive(false);

        // Switch to list after brief pause
        setTimeout(() => {
          setActiveTab('list');
          setSuccessMessage(null);
        }, 1500);

      } else {
        setErrorMessage(json?.error || 'Gagal menambahkan user baru. Silakan periksa kembali data Anda.');
      }
    } catch (err) {
      console.warn('Simpan user offline fallback:', err);
      // Resilient local addition
      const newUserItem: UserItem = {
        name: cleanName,
        username: cleanUser,
        plan,
        isWatermarkActive,
        createdAt: new Date().toISOString()
      };
      const updatedList = [...users.filter(u => u.username !== cleanUser), newUserItem];
      setUsers(updatedList);
      try {
        localStorage.setItem('dinamis_users_cache', JSON.stringify(updatedList));
      } catch {}

      setSuccessMessage(`User "${cleanUser}" berhasil ditambahkan (Lokal)!`);
      setName('');
      setUsername('');
      setPassword('');
      setTimeout(() => {
        setActiveTab('list');
        setSuccessMessage(null);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUsername = (uname: string) => {
    navigator.clipboard.writeText(uname);
    setCopiedUser(uname);
    setTimeout(() => setCopiedUser(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white max-w-xl w-full border border-[#104F38]/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Wireframe Bracket Accent Top-Left */}
        <div className="absolute -left-2 -top-2 w-6 h-6 border-t-2 border-l-2 border-[#104F38]/50" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#104F38]/10 flex items-center justify-between bg-[#F4FAF6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#104F38] text-white flex items-center justify-center border border-[#104F38]">
              <UserPlus className="w-5 h-5 text-[#FFE600]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#104F38]">
                  Manajemen User & Hak Akses
                </h3>
                <span className="text-[10px] uppercase font-bold bg-[#FFE600] text-[#104F38] px-1.5 py-0.2 border border-[#104F38]/20">
                  Panel Admin
                </span>
              </div>
              <p className="text-[11px] text-[#104F38]/70 font-medium">
                Tambah akun baru untuk staf/karyawan (Username Administrator terkunci)
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 border-b border-[#104F38]/15 bg-[#F8FAF9] text-xs font-bold text-[#104F38]">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'create'
                ? 'bg-white text-[#104F38] border-b-2 border-[#104F38]'
                : 'text-[#104F38]/60 hover:text-[#104F38]'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#104F38]" />
            <span>+ Tambah User Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'list'
                ? 'bg-white text-[#104F38] border-b-2 border-[#104F38]'
                : 'text-[#104F38]/60 hover:text-[#104F38]'
            }`}
          >
            <Users className="w-4 h-4 text-[#104F38]" />
            <span>Daftar User Terdaftar ({users.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: FORM TAMBAH USER BARU */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              
              {/* Important Admin Protection Notice */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Akun bawaan <strong>Administrator (admin)</strong> terlindungi & tidak dapat diganti atau ditimpa username-nya.</span>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-[#104F38] mb-1">
                  Nama Lengkap / Identitas User <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso (Kasir Cafe)"
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-medium text-[#104F38]"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-[#104F38] mb-1">
                  Username Login <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="text-[#104F38]/50 font-bold absolute left-3 top-2 text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    placeholder="contoh: budi_kasir (tanpa spasi)"
                    className="w-full pl-8 pr-4 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-medium text-[#104F38]"
                  />
                </div>
                <p className="text-[10px] text-[#104F38]/60 mt-1">
                  Hanya huruf kecil, angka, dan karakter _ atau - (minimal 3 karakter). Username "admin" dilarang.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#104F38] mb-1">
                  Password Login <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#104F38]/50 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#104F38]/20 focus:outline-none focus:ring-2 focus:ring-[#104F38]/30 font-medium text-[#104F38]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#104F38]/50 hover:text-[#104F38] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pilihan Paket */}
              <div>
                <label className="block text-xs font-bold text-[#104F38] mb-1.5">
                  Paket Langganan / Akses User
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`p-2.5 border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      plan === 'monthly'
                        ? 'border-[#104F38] bg-[#F4FAF6] font-bold ring-1 ring-[#104F38]'
                        : 'border-[#104F38]/20 bg-white hover:bg-[#F8FAF9]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-[#104F38]">Pro Bulanan</span>
                      <input
                        type="radio"
                        name="plan_choice"
                        checked={plan === 'monthly'}
                        onChange={() => {
                          setPlan('monthly');
                          setIsWatermarkActive(false);
                        }}
                        className="text-[#104F38]"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-800 font-semibold">✓ Bebas Watermark</span>
                  </label>

                  <label
                    className={`p-2.5 border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      plan === 'yearly'
                        ? 'border-[#104F38] bg-[#F4FAF6] font-bold ring-1 ring-[#104F38]'
                        : 'border-[#104F38]/20 bg-white hover:bg-[#F8FAF9]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-[#104F38]">Paket Tahunan</span>
                      <input
                        type="radio"
                        name="plan_choice"
                        checked={plan === 'yearly'}
                        onChange={() => {
                          setPlan('yearly');
                          setIsWatermarkActive(false);
                        }}
                        className="text-[#104F38]"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-800 font-semibold">✓ Bebas Watermark (1 Thn)</span>
                  </label>

                  <label
                    className={`p-2.5 border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      plan === 'trial'
                        ? 'border-[#104F38] bg-[#F4FAF6] font-bold ring-1 ring-[#104F38]'
                        : 'border-[#104F38]/20 bg-white hover:bg-[#F8FAF9]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-[#104F38]">Trial 3 Hari</span>
                      <input
                        type="radio"
                        name="plan_choice"
                        checked={plan === 'trial'}
                        onChange={() => {
                          setPlan('trial');
                          setIsWatermarkActive(true);
                        }}
                        className="text-[#104F38]"
                      />
                    </div>
                    <span className="text-[10px] text-amber-800 font-semibold">Uji coba awal</span>
                  </label>
                </div>
              </div>

              {/* Status Watermark */}
              <div className="p-3 bg-[#F8FAF9] border border-[#104F38]/15 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#104F38]">Bebas Watermark Stand Meja</div>
                  <div className="text-[10px] text-[#104F38]/70">
                    {isWatermarkActive ? 'Watermark DinamisQR aktif pada ekspor desain' : 'Desain stand bersih tanpa cap DinamisQR'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWatermarkActive(!isWatermarkActive)}
                  className={`px-3 py-1 text-xs font-extrabold border transition-all cursor-pointer ${
                    !isWatermarkActive
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {!isWatermarkActive ? '✓ Bebas Watermark' : 'Watermark Aktif'}
                </button>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#104F38] hover:bg-[#0C3B2A] text-white text-xs font-bold tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-[#FFE600]" />
                  <span>{loading ? 'Menyimpan User...' : 'Simpan & Tambahkan User'}</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: DAFTAR USER */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="text-xs text-[#104F38]/70 font-medium flex items-center justify-between">
                <span>Daftar akun login yang terdaftar dalam sistem:</span>
                <button
                  onClick={fetchUsers}
                  className="text-[#104F38] underline font-bold text-[11px] cursor-pointer"
                >
                  Segarkan
                </button>
              </div>

              <div className="space-y-2">
                {users.map((u) => {
                  const isSuperAdmin = u.username.toLowerCase() === 'admin';
                  return (
                    <div
                      key={u.username}
                      className={`p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                        isSuperAdmin
                          ? 'border-[#104F38] bg-[#F4FAF6]'
                          : 'border-[#104F38]/15 bg-white hover:border-[#104F38]/40'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 border ${
                            isSuperAdmin
                              ? 'bg-[#104F38] text-[#FFE600] border-[#104F38]'
                              : 'bg-white text-[#104F38] border-[#104F38]/20'
                          }`}
                        >
                          {isSuperAdmin ? (
                            <Shield className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-[#104F38]">
                              {u.name}
                            </span>
                            <span className="font-mono text-[11px] bg-slate-100 text-[#104F38] px-1.5 py-0.2 border border-[#104F38]/15">
                              @{u.username}
                            </span>
                            {isSuperAdmin ? (
                              <span className="text-[9px] font-bold uppercase bg-[#FFE600] text-[#104F38] px-1.5 py-0.2 border border-[#104F38]/30 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Super Admin (Username Terkunci)
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-900 px-1.5 py-0.2">
                                User Aktif
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-[#104F38]/70 mt-1 flex items-center gap-2">
                            <span>Paket: <strong className="uppercase">{u.plan}</strong></span>
                            <span>·</span>
                            <span>{u.isWatermarkActive ? 'Watermark Aktif' : '✓ Bebas Watermark'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleCopyUsername(u.username)}
                          className="px-2 py-1 text-[11px] font-medium border border-[#104F38]/20 bg-white hover:bg-[#F4FAF6] text-[#104F38] flex items-center gap-1 cursor-pointer"
                          title="Salin Username"
                        >
                          {copiedUser === u.username ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#104F38]/60" />
                              <span>Salin User</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#F4FAF6] border-t border-[#104F38]/10 text-center text-[10px] text-[#104F38]/70">
          User baru yang ditambahkan dapat langsung login menggunakan form login awal dengan username & password yang Anda buat.
        </div>

      </div>
    </div>
  );
};
