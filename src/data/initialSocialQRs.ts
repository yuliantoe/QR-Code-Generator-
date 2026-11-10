import type { DynamicQRCode } from '../types.ts';

export const INITIAL_DEFAULT_QRCODES: DynamicQRCode[] = [
  {
    id: 'qr-meja-01',
    code: 'QR 001',
    slug: 'menu-meja-01',
    title: 'Stand Meja 01 (Akrilik Kasir / Meja)',
    targetUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ['Meja Makan', 'Stand Meja', 'Menu PDF'],
    notes: 'Dicetak di stand akrilik meja 01.',
    totalScans: 842,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    urlHistory: [
      {
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        reason: 'Menu Musim Hujan Awal'
      }
    ],
    style: {
      fgColor: '#104F38',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI SAYA',
      frameColor: '#104F38',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  },
  {
    id: 'qr-kemasan-kopi',
    code: 'QR 002',
    slug: 'kopi-speciality',
    title: 'Stiker Kemasan Kopi Robusta 250gr (5.000 Pcs Cetak)',
    targetUrl: 'https://shopee.co.id',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    tags: ['Packaging', 'Stiker Cetak', 'Shopee'],
    notes: 'Stiker kemasan kopi fisik.',
    totalScans: 1394,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    urlHistory: [
      {
        url: 'https://shopee.co.id',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        reason: 'Dialihkan ke Toko Shopee Flash Sale'
      }
    ],
    style: {
      fgColor: '#104F38',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI SAYA',
      frameColor: '#104F38',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  },
  {
    id: 'qr-kartu-nama',
    code: 'QR 003',
    slug: 'kartu-nama-ceo',
    title: 'Kartu Nama Bisnis Eksekutif & Kontak WhatsApp',
    targetUrl: 'https://wa.me/6281234567890',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    tags: ['Kartu Nama', 'WhatsApp', 'Founder'],
    notes: 'Kartu nama kertas PVC premium.',
    totalScans: 289,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    urlHistory: [
      {
        url: 'https://wa.me/6281234567890',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        reason: 'Tautan Awal WhatsApp Direct'
      }
    ],
    style: {
      fgColor: '#104F38',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'PINDAI SAYA',
      frameColor: '#104F38',
      frameTextColor: '#ffffff',
      logoType: 'none'
    }
  },
  // DAFTAR QR CODE RESMI MEDIA SOSIAL (WHATSAPP, INSTAGRAM, TIKTOK, FACEBOOK)
  {
    id: 'qr-whatsapp-order',
    code: 'QR 004',
    slug: 'wa-order',
    title: 'WhatsApp CS & Pemesanan Meja Langsung',
    targetUrl: 'https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20info',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tags: ['WhatsApp', 'Customer Service', 'Order'],
    notes: 'Dicetak di stand meja akrilik untuk chat langsung tanpa simpan nomor HP.',
    totalScans: 412,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    urlHistory: [
      {
        url: 'https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20mau%20pesan%20menu%20dan%20tanya%20info',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        reason: 'Tautan WhatsApp CS & Pesan Meja'
      }
    ],
    style: {
      fgColor: '#075E54',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'CHAT WHATSAPP',
      frameColor: '#25D366',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'whatsapp'
    }
  },
  {
    id: 'qr-instagram-official',
    code: 'QR 005',
    slug: 'ig-official',
    title: 'Instagram Resmi Promo & Menu Spesial',
    targetUrl: 'https://instagram.com/restoran_official',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tags: ['Instagram', 'Sosial Media', 'Promo'],
    notes: 'Dicetak di stand meja untuk ajakan follow & tag IG story.',
    totalScans: 578,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    urlHistory: [
      {
        url: 'https://instagram.com/restoran_official',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        reason: 'Tautan Profil Instagram Resmi'
      }
    ],
    style: {
      fgColor: '#833AB4',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'FOLLOW INSTAGRAM',
      frameColor: '#E1306C',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'instagram'
    }
  },
  {
    id: 'qr-tiktok-promo',
    code: 'QR 006',
    slug: 'tiktok-promo',
    title: 'TikTok Video Viral & Review Kuliner',
    targetUrl: 'https://tiktok.com/@restoran_official',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    tags: ['TikTok', 'Video Viral', 'Review'],
    notes: 'Dicetak di stand meja & kasir untuk tonton konten seru.',
    totalScans: 724,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    urlHistory: [
      {
        url: 'https://tiktok.com/@restoran_official',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        reason: 'Tautan Akun TikTok Resmi'
      }
    ],
    style: {
      fgColor: '#000000',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'FOLLOW TIKTOK',
      frameColor: '#000000',
      frameTextColor: '#00F2FE',
      logoType: 'none',
      logo: ''
    }
  },
  {
    id: 'qr-facebook-fanspage',
    code: 'QR 007',
    slug: 'fb-fanspage',
    title: 'Facebook Fanspage & Komunitas Pelanggan',
    targetUrl: 'https://facebook.com/restoran.official',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    tags: ['Facebook', 'Fanspage', 'Komunitas'],
    notes: 'Dicetak di stand akrilik untuk info event dan promo komunitas.',
    totalScans: 215,
    lastScannedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    urlHistory: [
      {
        url: 'https://facebook.com/restoran.official',
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        reason: 'Tautan Halaman Facebook Resmi'
      }
    ],
    style: {
      fgColor: '#1877F2',
      bgColor: '#ffffff',
      dotStyle: 'rounded',
      cornerStyle: 'rounded',
      frameStyle: 'bottom-banner',
      frameText: 'GABUNG FACEBOOK',
      frameColor: '#1877F2',
      frameTextColor: '#ffffff',
      logoType: 'preset',
      logo: 'web'
    }
  }
];
