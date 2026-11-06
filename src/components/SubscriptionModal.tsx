import React, { useState } from 'react';
import { X, Check, ShieldCheck, Sparkles, Zap, Award, Crown, ArrowRight, HelpCircle, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AuthUser, SubscriptionPlan } from '../types.ts';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  authToken: string | null;
  onPlanUpdated: (updatedUser: AuthUser) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  onPlanUpdated
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate remaining trial days
  let trialRemainingDays = 3;
  if (currentUser.trialExpiresAt) {
    const diffMs = new Date(currentUser.trialExpiresAt).getTime() - Date.now();
    trialRemainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const handleSelectPlan = async (plan: 'monthly' | 'yearly') => {
    setIsUpgrading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/upgrade-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || ''}`
        },
        body: JSON.stringify({ plan })
      });

      const json = await res.json();
      if (json.success && json.user) {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });

        setSuccessMessage(json.message || 'Paket langganan berhasil diaktifkan!');
        onPlanUpdated(json.user);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMessage(json.error || 'Gagal mengupgrade paket. Silakan coba kembali.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Terjadi kesalahan saat memproses paket.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const openWhatsAppCheckout = (planName: string, price: string) => {
    const text = encodeURIComponent(
      `Halo Admin DinamisQR, saya ingin mengaktifkan *${planName}* (${price}) untuk akun: *${currentUser.username}* (*${currentUser.name}*). Mohon informasi invoice dan aktivasi tanpa watermark. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0a2318]/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white border-2 border-[#104F38] w-full max-w-4xl shadow-2xl my-auto overflow-hidden relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#104F38] via-[#FFE600] to-[#2D8A68]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-4 flex items-start justify-between gap-4 border-b border-[#104F38]/10 bg-[#F4FAF6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#104F38] bg-[#FFE600] px-2.5 py-0.5 border border-[#104F38]/20">
                <Crown className="w-3.5 h-3.5" />
                Paket Berlangganan DinamisQR
              </span>
              {currentUser.plan === 'trial' ? (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200">
                  ⚠️ Akun Trial (Sisa {trialRemainingDays} Hari • Watermark Aktif)
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Paket {currentUser.plan === 'yearly' ? 'Bisnis Tahunan' : 'Pro Bulanan'} Aktif (Tanpa Watermark)
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#104F38] tracking-tight">
              Tingkatkan Bisnis & Hapus Watermark Desain
            </h2>
            <p className="text-xs sm:text-sm text-[#104F38]/75 mt-0.5 max-w-2xl leading-relaxed">
              Cetak stand akrilik meja Google Review dan QR dinamis berkualitas cetak profesional tanpa watermark, tanpa batasan scan, dan resolusi tajam 300 DPI.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#104F38]/50 hover:text-[#104F38] hover:bg-white rounded-none cursor-pointer transition-colors shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error Messages */}
        {successMessage && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* PLAN 1: TRIAL 3 HARI */}
          <div className={`p-4 sm:p-5 border flex flex-col justify-between transition-all ${
            currentUser.plan === 'trial' 
              ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-300/60' 
              : 'border-gray-200 bg-white opacity-80'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Uji Coba
                </span>
                {currentUser.plan === 'trial' && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-300">
                    Paket Saat Ini
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-[#104F38]">Trial 3 Hari</h3>
              <p className="text-xs text-gray-500 mt-1">Uji coba gratis seluruh fitur desain sebelum mencetak massal.</p>
              
              <div className="my-4 pt-3 border-t border-gray-200">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#104F38]">Gratis</span>
                  <span className="text-xs text-gray-500 font-medium">/ 3 hari</span>
                </div>
                <div className="text-[11px] text-amber-700 font-medium mt-1">
                  Sisa masa aktif: {trialRemainingDays} hari lagi
                </div>
              </div>

              <ul className="space-y-2 text-xs text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 shrink-0 mt-0.5 font-bold">⚠️</span>
                  <span><strong>Ada Watermark</strong> pada hasil download PNG & lembar cetak</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Maksimal 5 QR Code Dinamis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Akses 4 Desain Stand Meja A6</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Simulasi Tap NFC & Scan Fisik</span>
                </li>
              </ul>
            </div>

            <button
              disabled={currentUser.plan === 'trial'}
              className="w-full py-2.5 px-3 text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded-none cursor-not-allowed"
            >
              {currentUser.plan === 'trial' ? 'Sedang Digunakan' : 'Paket Dasar'}
            </button>
          </div>

          {/* PLAN 2: PAKET PRO BULANAN */}
          <div className={`p-4 sm:p-5 border-2 flex flex-col justify-between transition-all relative ${
            currentUser.plan === 'monthly'
              ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-400'
              : 'border-[#104F38] bg-white hover:shadow-lg'
          }`}>
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#104F38] text-white text-[10px] font-extrabold px-3 py-0.5 uppercase tracking-wider">
              Paling Populer UMKM
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <span className="text-[11px] font-bold text-[#104F38] uppercase tracking-wider">
                  Paket Fleksibel
                </span>
                {currentUser.plan === 'monthly' && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                    Aktif
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-[#104F38]">Paket Pro Bulanan</h3>
              <p className="text-xs text-[#104F38]/70 mt-1">Bebas watermark untuk kafe, restoran, klinik & toko retail.</p>
              
              <div className="my-4 pt-3 border-t border-[#104F38]/15">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#104F38]">Rp 49.000</span>
                  <span className="text-xs text-gray-500 font-medium">/ bulan</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  ✓ Langsung Hapus Watermark 100%
                </div>
              </div>

              <ul className="space-y-2 text-xs text-[#104F38] mb-6">
                <li className="flex items-start gap-2 font-bold text-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% BEBAS WATERMARK pada semua desain</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Download Stand Meja A6 Resolusi Super HD (300 DPI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Unlimited QR Code Dinamis & Ganti URL Kapan Saja</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Fitur Lengkap NFC Google Review & PIN Keamanan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Cetak Lembar Stand Akrilik Siap Gunting</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectPlan('monthly')}
                disabled={isUpgrading || currentUser.plan === 'monthly'}
                className="w-full py-2.5 px-3 text-xs font-extrabold text-[#104F38] bg-[#FFE600] hover:bg-[#F2DA00] border border-[#104F38]/30 rounded-none cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{currentUser.plan === 'monthly' ? 'Paket Sedang Aktif' : 'Aktifkan Paket Bulanan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => openWhatsAppCheckout('Paket Pro Bulanan', 'Rp 49.000 / bln')}
                className="w-full py-1.5 text-[11px] font-semibold text-[#104F38]/70 hover:text-[#104F38] text-center underline cursor-pointer"
              >
                Atau Bayar via WhatsApp Manual
              </button>
            </div>
          </div>

          {/* PLAN 3: PAKET BISNIS TAHUNAN */}
          <div className={`p-4 sm:p-5 border-2 flex flex-col justify-between transition-all relative ${
            currentUser.plan === 'yearly'
              ? 'border-[#104F38] bg-[#F4FAF6] shadow-md ring-2 ring-[#104F38]'
              : 'border-[#104F38]/30 bg-gradient-to-b from-white to-[#F4FAF6] hover:shadow-lg'
          }`}>
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFE600] text-[#104F38] border border-[#104F38]/30 text-[10px] font-black px-3 py-0.5 uppercase tracking-wider">
              Hemat 35% • Pilihan Terbaik
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <span className="text-[11px] font-bold text-[#104F38] uppercase tracking-wider">
                  Paket Tahunan
                </span>
                {currentUser.plan === 'yearly' && (
                  <span className="text-[10px] font-bold text-[#104F38] bg-[#FFE600] px-2 py-0.5 border border-[#104F38]/30">
                    Aktif (VIP)
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-[#104F38]">Paket Bisnis Tahunan</h3>
              <p className="text-xs text-[#104F38]/70 mt-1">Solusi komplit untuk banyak meja, cabang & kemasan produk.</p>
              
              <div className="my-4 pt-3 border-t border-[#104F38]/15">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#104F38]">Rp 399.000</span>
                  <span className="text-xs text-gray-500 font-medium">/ tahun</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  Setara hanya ~Rp 33.250 / bulan
                </div>
              </div>

              <ul className="space-y-2 text-xs text-[#104F38] mb-6">
                <li className="flex items-start gap-2 font-bold text-[#104F38]">
                  <Sparkles className="w-3.5 h-3.5 text-[#104F38] shrink-0 mt-0.5" />
                  <span>BEBAS WATERMARK SELAMANYA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Semua fitur Paket Pro Bulanan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Cetak Sekaligus 5, 10, 15 & 30 Stand Meja (Batch Mode)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Logo Kustom & Format Vektor SVG Cetak Offset</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Dukungan Konsultasi Cetak Akrilik Meja WhatsApp Prioritas</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectPlan('yearly')}
                disabled={isUpgrading || currentUser.plan === 'yearly'}
                className="w-full py-2.5 px-3 text-xs font-extrabold text-white bg-[#104F38] hover:bg-[#0c3c2b] border border-[#104F38] rounded-none cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{currentUser.plan === 'yearly' ? 'Paket VIP Aktif' : 'Pilih Paket Tahunan (Hemat 35%)'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FFE600]" />
              </button>

              <button
                type="button"
                onClick={() => openWhatsAppCheckout('Paket Bisnis Tahunan', 'Rp 399.000 / thn')}
                className="w-full py-1.5 text-[11px] font-semibold text-[#104F38]/70 hover:text-[#104F38] text-center underline cursor-pointer"
              >
                Atau Bayar via WhatsApp Manual
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer Guarantee Notice */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Garansi aktivasi instan tanpa ribet. Akun dan desain Anda aman tersimpan.</span>
          </div>

          <div className="text-[11px] text-[#104F38]/70">
            DinamisQR • Pitch Excellence
          </div>
        </div>

      </div>
    </div>
  );
};
