import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ExternalLink, QrCode, ShieldAlert, Loader2 } from 'lucide-react';
import type { DynamicQRCode } from '../types.ts';

interface DeleteQRConfirmModalProps {
  isOpen: boolean;
  qr: DynamicQRCode | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<boolean>;
}

export const DeleteQRConfirmModal: React.FC<DeleteQRConfirmModalProps> = ({
  isOpen,
  qr,
  onClose,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !qr) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${origin}/r/${qr.slug}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const success = await onConfirmDelete(qr.id);
      if (!success) {
        setErrorMessage('Gagal menghapus QR Code. Silakan coba lagi.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menghapus QR Code.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2318]/75 animate-in fade-in duration-150">
      <div 
        className="bg-white border border-rose-600 w-full max-w-md shadow-xl overflow-hidden relative rounded-none"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Warning Banner Accent */}
        <div className="h-1.5 bg-rose-600" />

        {/* Header */}
        <div className="p-5 pb-4 flex items-start justify-between gap-3 border-b border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-rose-700 font-bold mb-1">
                Konfirmasi Hapus
              </span>
              <h3 className="text-base font-bold text-[#104F38] leading-tight">
                Yakin ingin menghapus QR Code ini?
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Tutup"
            className="p-1 text-[#104F38]/50 hover:text-[#104F38] hover:bg-white rounded-none cursor-pointer transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target QR Code Summary Box */}
          <div className="bg-[#F4FAF6] border border-[#104F38]/20 p-3.5 space-y-2 rounded-none">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[#104F38] bg-[#FFE600] px-2 py-0.5 border border-[#104F38]/20 tabular-nums">
                {qr.code || 'QR DINAMIS'}
              </span>
              <span className="text-[11px] text-[#104F38]/70 flex items-center gap-1 font-mono">
                <QrCode className="w-3.5 h-3.5 text-[#104F38]/50" />
                /r/{qr.slug}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-[#104F38] text-sm break-words line-clamp-1">
                {qr.title || 'Tanpa Judul'}
              </h4>
              <p className="text-[11px] text-[#104F38]/75 break-all line-clamp-2 mt-0.5">
                Tautan Tujuan: <span className="text-[#104F38] font-mono">{qr.targetUrl}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-[#104F38]/75 border-t border-[#104F38]/15 tabular-nums">
              <span>Total Pindai: <strong className="font-mono text-[#104F38]">{qr.totalScans || 0} kali</strong></span>
              <span aria-hidden="true">·</span>
              <span className={qr.status === 'active' ? 'text-[#104F38] font-bold' : 'text-amber-800 font-bold'}>
                Status: {qr.status === 'active' ? 'Aktif' : 'Dijeda'}
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950 mb-0.5">Tindakan ini tidak dapat dibatalkan!</p>
              <p className="text-amber-800 text-[11px]">
                Jika QR code ini sudah dicetak pada stand meja atau flyer fisik, pemindai tidak akan dapat membuka tautan tujuan lagi.
              </p>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 rounded-none cursor-pointer transition-colors shadow-2xs"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-700 rounded-none cursor-pointer transition-colors flex items-center gap-2 shadow-2xs disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus QR Code</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
