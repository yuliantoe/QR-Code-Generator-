/**
 * WhatsApp Welcome Message Presets & URL Utilities
 * Membantu pembuatan tautan WhatsApp dinamis dengan pesan pembuka sambutan (welcome message) kustom.
 */

export interface WhatsAppWelcomePreset {
  id: string;
  category: 'bisnis' | 'sekolah' | 'kampus' | 'cafe' | 'resto' | 'table' | 'delivery' | 'cs' | 'promo' | 'feedback';
  categoryLabel: string;
  title: string;
  message: string;
  badge?: string;
}

export const WHATSAPP_WELCOME_PRESETS: WhatsAppWelcomePreset[] = [
  // 1. Bisnis & Kantor / Perusahaan
  {
    id: 'bisnis_welcome_layanan',
    category: 'bisnis',
    categoryLabel: 'Bisnis & Perusahaan',
    title: 'Selamat Datang di Bisnis & Konsultasi Layanan',
    message: 'Halo, selamat datang di [Nama Bisnis/Perusahaan]! Saya tertarik ingin konsultasi dan mengetahui rincian layanan bisnis yang tersedia.',
    badge: 'Bisnis & B2B'
  },
  {
    id: 'bisnis_janji_temu_tamu',
    category: 'bisnis',
    categoryLabel: 'Bisnis & Perusahaan',
    title: 'Tamu Lobi & Konfirmasi Janji Temu Kantor',
    message: 'Halo Resepsionis, selamat datang di kantor [Nama Perusahaan]. Saya tamu di lobi ingin konfirmasi janji temu dengan Bapak/Ibu ...'
  },
  {
    id: 'bisnis_kemitraan_proposal',
    category: 'bisnis',
    categoryLabel: 'Bisnis & Perusahaan',
    title: 'Tawaran Kerjasama & Proposal Kemitraan',
    message: 'Halo Manajemen [Nama Bisnis], kami bermaksud mengajukan penawaran kerjasama bisnis. Mohon info kontak divisi kemitraan/procurement.'
  },
  {
    id: 'bisnis_company_profile',
    category: 'bisnis',
    categoryLabel: 'Bisnis & Perusahaan',
    title: 'Minta Company Profile & Daftar Harga Produk',
    message: 'Halo Admin, selamat datang di layanan pelanggan kami. Boleh minta dikirimkan profil perusahaan resmi dan katalog harga produk lengkap?'
  },

  // 2. Sekolah & PPDB
  {
    id: 'sekolah_welcome_ppdb',
    category: 'sekolah',
    categoryLabel: 'Sekolah & PPDB',
    title: 'Selamat Datang di Sekolah & Pendaftaran Siswa Baru (PPDB)',
    message: 'Halo Panitia PPDB, selamat datang di [Nama Sekolah]! Saya orang tua calon siswa ingin menanyakan jadwal pendaftaran dan syarat masuk siswa baru.',
    badge: 'PPDB Sekolah'
  },
  {
    id: 'sekolah_biaya_brosur',
    category: 'sekolah',
    categoryLabel: 'Sekolah & PPDB',
    title: 'Informasi Biaya Masuk & Brosur Sekolah',
    message: 'Halo Admin Tata Usaha [Nama Sekolah], boleh minta dikirimkan brosur rincian biaya masuk dan program ekstrakurikuler unggulan?'
  },
  {
    id: 'sekolah_school_tour',
    category: 'sekolah',
    categoryLabel: 'Sekolah & PPDB',
    title: 'Kunjungan Langsung (School Tour) Fasilitas Sekolah',
    message: 'Halo Bapak/Ibu Guru, selamat datang di sekolah kami. Saya ingin menjadwalkan kunjungan langsung (school tour) untuk melihat sarana dan ruang kelas.'
  },
  {
    id: 'sekolah_konseling_akademik',
    category: 'sekolah',
    categoryLabel: 'Sekolah & PPDB',
    title: 'Konsultasi Akademik Siswa & Wali Murid',
    message: 'Halo Admin Sekolah, saya wali murid dari siswa kelas ... ingin berkonsultasi mengenai perkembangan akademik anak saya.'
  },

  // 3. Kampus & Universitas
  {
    id: 'kampus_welcome_pmb',
    category: 'kampus',
    categoryLabel: 'Kampus & Universitas',
    title: 'Selamat Datang di Kampus & Pendaftaran Mahasiswa Baru (PMB)',
    message: 'Halo Tim Admisi, selamat datang di [Nama Kampus/Universitas]! Saya calon mahasiswa ingin tanya informasi pendaftaran mahasiswa baru (PMB) dan jalur beasiswa.',
    badge: 'PMB Kampus'
  },
  {
    id: 'kampus_jurusan_fakultas',
    category: 'kampus',
    categoryLabel: 'Kampus & Universitas',
    title: 'Konsultasi Program Studi & Akreditasi Fakultas',
    message: 'Halo Admin Admisi [Nama Kampus], saya ingin konsultasi pemilihan jurusan program studi (S1/S2/D3) serta info prospek karir lulusan.'
  },
  {
    id: 'kampus_baak_akademik',
    category: 'kampus',
    categoryLabel: 'Kampus & Universitas',
    title: 'Layanan BAAK & Administrasi Mahasiswa Aktif',
    message: 'Halo Biro Akademik Kampus, saya mahasiswa aktif NIM: [Tulis NIM]. Ingin menanyakan perihal surat izin aktif kuliah / jadwal KRS semester ini.'
  },
  {
    id: 'kampus_beasiswa_ukt',
    category: 'kampus',
    categoryLabel: 'Kampus & Universitas',
    title: 'Informasi Biaya Kuliah (UKT) & Syarat Beasiswa',
    message: 'Halo Humas Kampus, boleh minta informasi rincian biaya kuliah per semester dan syarat pengajuan beasiswa prestasi/KIP-Kuliah?'
  },

  // 4. Kafe & Coffee Shop
  {
    id: 'cafe_welcome_barista',
    category: 'cafe',
    categoryLabel: 'Kafe & Coffee Shop',
    title: 'Selamat Datang di Kafe & Rekomendasi Menu Barista',
    message: 'Halo, selamat datang di [Nama Cafe]! Saya pengunjung di meja dan mau tanya menu signature kopi & pastry rekomendasi barista hari ini.',
    badge: 'Kafe Populer'
  },
  {
    id: 'cafe_wifi_workingspace',
    category: 'cafe',
    categoryLabel: 'Kafe & Coffee Shop',
    title: 'Password WiFi & Working Space / Colokan',
    message: 'Halo Kak Barista, selamat datang di [Nama Cafe]. Boleh minta info password WiFi dan tempat colokan untuk kerja / nugas laptop?'
  },
  {
    id: 'cafe_beans_manualbrew',
    category: 'cafe',
    categoryLabel: 'Kafe & Coffee Shop',
    title: 'Pilihan Beans Kopi Manual Brew & Roastery',
    message: 'Halo Barista, boleh tahu beans kopi manual brew (V60/Japanese) apa saja yang sedang ready di bar hari ini?'
  },
  {
    id: 'cafe_reservasi_outdoor',
    category: 'cafe',
    categoryLabel: 'Kafe & Coffee Shop',
    title: 'Reservasi Area Nongkrong / Nobar / Komunitas',
    message: 'Halo Admin [Nama Cafe], saya mau reservasi meja area outdoor/smoking untuk kumpul nongkrong bareng teman-teman nanti malam.'
  },

  // 5. Restoran & Kuliner
  {
    id: 'resto_order_promo',
    category: 'resto',
    categoryLabel: 'Pesan Menu & Resto',
    title: 'Order Menu & Tanya Promo Hari Ini',
    message: 'Halo Admin, selamat datang di restoran kami. Saya mau pesan menu dan tanya promo spesial hari ini.',
    badge: 'Resto & Makan'
  },
  {
    id: 'resto_reservasi',
    category: 'resto',
    categoryLabel: 'Pesan Menu & Resto',
    title: 'Reservasi Meja Makan Bersama',
    message: 'Halo Admin, saya ingin reservasi meja untuk acara makan bersama keluarga/teman.'
  },
  {
    id: 'resto_katalog',
    category: 'resto',
    categoryLabel: 'Pesan Menu & Resto',
    title: 'Minta Daftar Menu Lengkap & Rekomendasi',
    message: 'Halo, boleh minta daftar buku menu lengkap dan rekomendasi menu best seller-nya?'
  },

  // 2. Layanan Meja & Kasir (Pelanggan di Tempat)
  {
    id: 'table_order_bill',
    category: 'table',
    categoryLabel: 'Layanan Meja & Kasir',
    title: 'Minta Bill & Pembayaran di Meja',
    message: 'Halo Admin Kasir, saya pelanggan di Meja No. [Tulis No Meja]. Mau minta bill dan bayar ya.',
    badge: 'Khusus Meja Kafe'
  },
  {
    id: 'table_tambah_menu',
    category: 'table',
    categoryLabel: 'Layanan Meja & Kasir',
    title: 'Tambah Pesanan dari Meja',
    message: 'Halo pelayan, kami di Meja No. [Tulis No Meja] ingin menambah pesanan.'
  },
  {
    id: 'table_bantuan',
    category: 'table',
    categoryLabel: 'Layanan Meja & Kasir',
    title: 'Panggil Pelayan / Bantuan Meja',
    message: 'Halo pelayan, kami butuh bantuan dan tisu/alat makan tambahan di meja kami.'
  },

  // 3. Take Away & Delivery
  {
    id: 'delivery_order',
    category: 'delivery',
    categoryLabel: 'Take Away & Delivery',
    title: 'Pesan Antar Makanan (Delivery)',
    message: 'Halo Admin, saya mau pesan makanan untuk delivery ke alamat saya. Boleh kirim format ordernya?'
  },
  {
    id: 'takeaway_pickup',
    category: 'delivery',
    categoryLabel: 'Take Away & Delivery',
    title: 'Order Take Away Siap Ambil',
    message: 'Halo, saya mau pesan makanan take away untuk diambil jam ... hari ini.'
  },

  // 4. Customer Service & Konsultasi
  {
    id: 'cs_info_layanan',
    category: 'cs',
    categoryLabel: 'CS & Konsultasi',
    title: 'Bantuan Layanan Cepat',
    message: 'Halo Customer Service, saya butuh informasi produk dan bantuan layanan.',
    badge: 'Respon Cepat'
  },
  {
    id: 'cs_tanya_paket',
    category: 'cs',
    categoryLabel: 'CS & Konsultasi',
    title: 'Konsultasi & Tanya Harga Paket',
    message: 'Halo Kak, saya mau konsultasi dan tanya rincian harga paket layanan Anda.'
  },

  // 5. Promo Diskon & Member
  {
    id: 'promo_klaim_stand',
    category: 'promo',
    categoryLabel: 'Promo & Voucher',
    title: 'Klaim Diskon dari Scan Stand Meja',
    message: 'Halo Admin, saya baru saja scan stand meja di outlet dan mau klaim promo diskon spesial.',
    badge: 'Reward Scan'
  },
  {
    id: 'promo_daftar_member',
    category: 'promo',
    categoryLabel: 'Promo & Voucher',
    title: 'Daftar Membership & Reward Poin',
    message: 'Halo Admin, bagaimana cara mendaftar jadi member setia untuk dapat poin reward?'
  },

  // 6. Ulasan & Masukan Pelanggan
  {
    id: 'feedback_saran',
    category: 'feedback',
    categoryLabel: 'Kritik & Saran',
    title: 'Kirim Masukan Langsung ke Manajemen',
    message: 'Halo Manajemen, saya ingin menyampaikan masukan dan saran positif untuk pelayanan yang lebih baik.'
  }
];

/**
 * Normalizes an Indonesian / International phone number to E.164 without '+'
 * 081234567890 -> 6281234567890
 * 81234567890  -> 6281234567890
 * +62 812-345  -> 62812345
 */
export function normalizeWhatsAppPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  // Keep only digits
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return digits;
}

/**
 * Checks if a URL is a WhatsApp URL and parses phone & text
 */
export function parseWhatsAppUrl(rawUrl: string): {
  isWhatsApp: boolean;
  phone: string;
  text: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isWhatsApp: false, phone: '', text: '' };
  }

  const urlLower = rawUrl.toLowerCase().trim();
  const isWa =
    urlLower.includes('wa.me') ||
    urlLower.includes('api.whatsapp.com') ||
    urlLower.includes('web.whatsapp.com') ||
    urlLower.includes('whatsapp.com');

  if (!isWa) {
    return { isWhatsApp: false, phone: '', text: '' };
  }

  let phone = '';
  let text = '';

  try {
    const fullUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;
    
    const parsed = new URL(fullUrl);

    // Case 1: wa.me/{phone}?text={text}
    if (parsed.hostname.includes('wa.me')) {
      const pathParts = parsed.pathname.replace(/^\//, '').split('/');
      phone = normalizeWhatsAppPhone(pathParts[0] || '');
      text = parsed.searchParams.get('text') || '';
    } else {
      // Case 2: api.whatsapp.com/send?phone={phone}&text={text}
      phone = normalizeWhatsAppPhone(parsed.searchParams.get('phone') || '');
      text = parsed.searchParams.get('text') || '';
    }
  } catch {
    // Regex fallback
    const phoneMatch = rawUrl.match(/(?:wa\.me\/|phone=)(\d+)/i);
    if (phoneMatch) {
      phone = normalizeWhatsAppPhone(phoneMatch[1]);
    }
    const textMatch = rawUrl.match(/text=([^&]+)/i);
    if (textMatch) {
      try {
        text = decodeURIComponent(textMatch[1]);
      } catch {
        text = textMatch[1];
      }
    }
  }

  return {
    isWhatsApp: true,
    phone,
    text
  };
}

/**
 * Constructs a robust, clean wa.me URL
 */
export function buildWhatsAppUrl(rawPhone: string, text: string): string {
  const cleanPhone = normalizeWhatsAppPhone(rawPhone);
  const targetPhone = cleanPhone || '6281234567890';
  const cleanText = (text || '').trim();

  if (cleanText) {
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(cleanText)}`;
  }
  return `https://wa.me/${targetPhone}`;
}

/**
 * Pilihan Heading Stand WhatsApp untuk Bisnis, Cafe, Sekolah, Kampus & Resto
 */
export interface WhatsAppHeadingPreset {
  id: string;
  sector: 'bisnis' | 'cafe' | 'sekolah' | 'kampus' | 'resto';
  sectorLabel: string;
  headingText: string;
  topBadgeText?: string;
  badge?: string;
}

export const WHATSAPP_HEADING_PRESETS: WhatsAppHeadingPreset[] = [
  // 1. Bisnis & Kantor / Perusahaan
  {
    id: 'bisnis_konsultasi',
    sector: 'bisnis',
    sectorLabel: 'Bisnis',
    headingText: 'Hubungi & Konsultasi Layanan di',
    topBadgeText: 'KONSULTASI LAYANAN & CS RESMI',
    badge: 'Bisnis'
  },
  {
    id: 'bisnis_pelanggan',
    sector: 'bisnis',
    sectorLabel: 'Bisnis',
    headingText: 'Layanan Pelanggan Resmi di',
    topBadgeText: 'CS CEPAT & RESPONSIF'
  },
  {
    id: 'bisnis_kantor',
    sector: 'bisnis',
    sectorLabel: 'Bisnis',
    headingText: 'Hubungi Kantor Kami di',
    topBadgeText: 'LAYANAN RESEPSIONIS KANTOR'
  },

  // 2. Kafe & Coffee Shop
  {
    id: 'cafe_barista_menu',
    sector: 'cafe',
    sectorLabel: 'Cafe',
    headingText: 'Pesan Menu & Tanya Barista di',
    topBadgeText: 'ORDER CEPAT & TANYA BARISTA',
    badge: 'Cafe Populer'
  },
  {
    id: 'cafe_kopi_nongkrong',
    sector: 'cafe',
    sectorLabel: 'Cafe',
    headingText: 'Pesan Kopi & Nongkrong Asik di',
    topBadgeText: 'MENU KOPI & WORKING SPACE'
  },
  {
    id: 'cafe_reservasi_meja',
    sector: 'cafe',
    sectorLabel: 'Cafe',
    headingText: 'Hubungi & Reservasi Meja di',
    topBadgeText: 'BOOKING MEJA & KOMUNITAS'
  },

  // 3. Sekolah & Pendidikan (PPDB)
  {
    id: 'sekolah_ppdb',
    sector: 'sekolah',
    sectorLabel: 'Sekolah',
    headingText: 'Pusat Informasi & PPDB di',
    topBadgeText: 'PENDAFTARAN SISWA BARU',
    badge: 'Sekolah'
  },
  {
    id: 'sekolah_akademik',
    sector: 'sekolah',
    sectorLabel: 'Sekolah',
    headingText: 'Layanan Tata Usaha & Informasi di',
    topBadgeText: 'PUSAT LAYANAN SEKOLAH'
  },

  // 4. Kampus & Universitas (PMB)
  {
    id: 'kampus_admisi_pmb',
    sector: 'kampus',
    sectorLabel: 'Kampus',
    headingText: 'Layanan Admisi & PMB di',
    topBadgeText: 'INFORMASI MAHASISWA BARU',
    badge: 'Kampus'
  },
  {
    id: 'kampus_akademik_baak',
    sector: 'kampus',
    sectorLabel: 'Kampus',
    headingText: 'Pusat Layanan Mahasiswa di',
    topBadgeText: 'LAYANAN AKADEMIK KAMPUS'
  },

  // 5. Restoran & Kuliner
  {
    id: 'resto_order_menu',
    sector: 'resto',
    sectorLabel: 'Resto',
    headingText: 'Hubungi & Pesan Menu di',
    topBadgeText: 'CHAT LANGSUNG & ORDER RESMI'
  },
  {
    id: 'resto_reservasi_meja',
    sector: 'resto',
    sectorLabel: 'Resto',
    headingText: 'Reservasi Meja & Menu di',
    topBadgeText: 'BOOKING MEJA & MAKAN BERSAMA'
  }
];
