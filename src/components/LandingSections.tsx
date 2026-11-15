import React, { useState } from 'react';
import { Check, ChevronDown, MessageCircle, Copy } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsappPresets.ts';
import standA5PinwheelImg from '../assets/images/stand_a5_pinwheel_1794750491655.jpg';
import standA5BlueDomeImg from '../assets/images/stand_a5_bluedome_1794750493710.jpg';
import standA5OnyxImg from '../assets/images/stand_a5_onyx_1794750494730.jpg';
import standA5BlueCutoutImg from '../assets/images/stand_a5_bluecutout_1794750493803.jpg';

interface ProductVariant {
  id: string;
  label: string;
  imageSrc: string;
  alt: string;
}

interface AcrylicProduct {
  id: string;
  kicker: string;
  name: string;
  sizeSpec: string;
  priceShort: string;
  priceFull: string;
  unitLabel: string;
  summary: string;
  features: string[];
  variants: ProductVariant[];
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  role: string;
  business: string;
  city: string;
  outcome: string;
}

const ADMIN_WHATSAPP_PHONE = '6285159746119';

const ACRYLIC_PRODUCTS: AcrylicProduct[] = [
  {
    id: 'acrylic-10x10',
    kicker: 'Tap Bahan Akrilik · Ukuran 10cm × 10cm',
    name: 'Akrilik Tap Kotak 10×10 cm',
    sizeSpec: '10 cm × 10 cm · Flat / Tempel Meja & Kasir',
    priceShort: '49K',
    priceFull: 'Rp 49.000',
    unitLabel: '/ unit',
    summary:
      'Desain ringkas berbahan akrilik tebal cetak tajam dengan chip NFC tertanam dan QR Code Dinamis siap pakai.',
    features: [
      'Ukuran presisi 10 cm × 10 cm bahan akrilik kokoh',
      'Sudah termasuk chip NFC aktif — tap HP langsung ke Google Review',
      'QR Dinamis terintegrasi (ganti link kapan saja tanpa cetak ulang)',
      'Pilihan 4 motif siap pakai: Onyx Black, Border 4 Warna, Blue Arc, Pinwheel'
    ],
    variants: [
      {
        id: 'sq-onyx',
        label: 'Onyx Black',
        imageSrc: '/assets/aistudio/onyx-black-Kotak-1x1-meja-vip-01-1200x1200px_2df2a9f3.png',
        alt: 'Desain Akrilik Tap NFC & QR 10x10cm motif Onyx Black'
      },
      {
        id: 'sq-border',
        label: 'Border 4 Warna',
        imageSrc: '/assets/aistudio/border-4color-Kotak-1x1-meja-vip-01-1200x1200px_5e11edd1.png',
        alt: 'Desain Akrilik Tap NFC & QR 10x10cm motif Border 4 Warna'
      },
      {
        id: 'sq-blue-arc',
        label: 'Blue Arc',
        imageSrc: '/assets/aistudio/blue-arc-Kotak-1x1-meja-vip-01-1200x1200px_7a1da24d.png',
        alt: 'Desain Akrilik Tap NFC & QR 10x10cm motif Blue Arc'
      },
      {
        id: 'sq-pinwheel',
        label: 'Pinwheel',
        imageSrc: '/assets/aistudio/pinwheel-4color-Kotak-1x1-meja-vip-01-1200x1200px_551db738.png',
        alt: 'Desain Akrilik Tap NFC & QR 10x10cm motif Pinwheel 4 Warna'
      }
    ]
  },
  {
    id: 'acrylic-a5-fold',
    kicker: 'Tap Bahan Akrilik Meja Lipat · Ukuran A5',
    name: 'Akrilik Meja Lipat A5',
    sizeSpec: 'Ukuran A5 · Stand Meja Lipat Berdiri',
    priceShort: '69K',
    priceFull: 'Rp 69.000',
    unitLabel: '/ unit',
    summary:
      'Stand meja akrilik lipat berdiri ukuran A5 yang sangat jelas terbaca di meja tamu, kasir, maupun resepsionis.',
    features: [
      'Model meja lipat berdiri ukuran A5 berbahan akrilik premium',
      'Area tap NFC luas & QR Dinamis mudah dipindai dari meja pelanggan',
      'Sinkronisasi otomatis link Daftar QR Code ke Tag NFC via dashboard',
      'Pilihan 4 motif siap pakai: Pinwheel, Blue Dome, Onyx Dark, Blue Cutout'
    ],
    variants: [
      {
        id: 'a5-pinwheel',
        label: 'Pinwheel',
        imageSrc: standA5PinwheelImg,
        alt: 'Stand Akrilik Meja Lipat A5 NFC & QR motif Pinwheel 4 Warna'
      },
      {
        id: 'a5-blue-dome',
        label: 'Blue Dome',
        imageSrc: standA5BlueDomeImg,
        alt: 'Stand Akrilik Meja Lipat A5 NFC & QR motif Blue Dome'
      },
      {
        id: 'a5-onyx-dark',
        label: 'Onyx Dark',
        imageSrc: standA5OnyxImg,
        alt: 'Stand Akrilik Meja Lipat A5 NFC & QR motif Onyx Dark'
      },
      {
        id: 'a5-blue-cutout',
        label: 'Blue Cutout',
        imageSrc: standA5BlueCutoutImg,
        alt: 'Stand Akrilik Meja Lipat A5 NFC & QR motif Blue Cutout'
      }
    ]
  }
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Apakah stand akrilik 10×10 cm (49K) dan meja lipat A5 (69K) harus dicetak ulang jika link diganti?',
    answer:
      'Tidak perlu. Setiap unit akrilik sudah terhubung ke sistem QR Dinamis dan NFC Projecttapp. Saat Anda mengganti link Google Review, menu digital, atau tautan promo di dashboard, stand fisik Anda otomatis mengarah ke tautan baru.'
  },
  {
    id: 'faq-2',
    question: 'Apakah pelanggan perlu aplikasi khusus atau memasukkan PIN saat tap NFC?',
    answer:
      'Tidak perlu. Pelanggan cukup menempelkan smartphone ke area NFC pada stand akrilik, dan halaman ulasan Google Review langsung terbuka otomatis di browser. PIN hanya dipakai oleh pengelola di dashboard saat mengedit atau menghapus data tag NFC.'
  },
  {
    id: 'faq-3',
    question: 'Bagaimana sinkronisasi data jika tag NFC diaktifkan lewat HP lalu dicek di komputer?',
    answer:
      'Seluruh aktivasi tag NFC baru, pembaruan link QR, dan catatan jumlah tap tersimpan langsung di server serta tersinkronisasi real-time. Daftar tag yang baru direkam dari HP langsung tampil di dashboard website tanpa perlu input ulang.'
  },
  {
    id: 'faq-4',
    question: 'Bagaimana cara mendapatkan harga khusus Reseller untuk pembelian grosir?',
    answer:
      'Kami membuka program Welcome Reseller untuk toko, percetakan, agensi digital, maupun pemilik jaringan outlet. Klik tombol Kontak WhatsApp Reseller pada bagian Harga untuk konsultasi minimal order dan daftar harga grosir terbaru.'
  },
  {
    id: 'faq-5',
    question: 'Apakah tersedia pilihan desain motif atau cetak custom brand?',
    answer:
      'Ya. Tersedia 4 motif populer untuk ukuran 10×10 cm maupun meja lipat A5, dan di dalam dashboard Projecttapp juga tersedia Studio Desain Stand siap ekspor jika Anda ingin menyesuaikan warna atau nama usaha.'
  }
];

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    quote:
      'Dulu pelanggan sering malas mengetik link Google Maps karena terlalu panjang. Setelah taruh stand akrilik 10×10 cm dan meja lipat A5 Projecttapp di kasir, pelanggan tinggal tap HP dan langsung kasih bintang 5. Tidak ada satu pun stand yang perlu dicetak ulang saat kami ganti link promo.',
    name: 'Rina Kusuma',
    role: 'Pemilik Usaha',
    business: 'Kopi Senja Kemang',
    city: 'Jakarta Selatan',
    outcome: '+185 ulasan Google bintang 5 dalam 3 bulan'
  },
  {
    id: 'testi-2',
    quote:
      'Tim resepsionis kami mengaktifkan tag NFC langsung dari smartphone saat menaruh stand meja lipat A5 di ruang tunggu. Begitu dicek di komputer kasir, datanya langsung masuk dan sinkron. Pasien cukup tap tanpa perlu PIN atau instal aplikasi tambahan.',
    name: 'Hendra Wijaya',
    role: 'Manajer Operasional',
    business: 'Klinik Gigi Sehat Sentosa',
    city: 'Bandung',
    outcome: 'Update link 10 tag cabang selesai di bawah 15 detik'
  },
  {
    id: 'testi-3',
    quote:
      'Awalnya pesan beberapa unit 10×10 cm untuk coba di 2 meja, lalu lanjut ambil harga reseller untuk 6 cabang sekaligus. Hasil cetak akriliknya rapi, NFC responsif, dan rating rata-rata seluruh cabang naik stabil.',
    name: 'Sari Wulandari',
    role: 'Co-Founder',
    business: 'Bakmi Nusantara Grup',
    city: 'Surabaya',
    outcome: 'Rating rata-rata cabang naik dari 4,2 ke 4,8 dalam 12 minggu'
  }
];

export const LandingSections: React.FC = () => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'acrylic-10x10': ACRYLIC_PRODUCTS[0].variants[0].id,
    'acrylic-a5-fold': ACRYLIC_PRODUCTS[1].variants[0].id
  });
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [resellerNote, setResellerNote] = useState('');
  const [copiedResellerMsg, setCopiedResellerMsg] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleSelectVariant = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  const handleImageError = (imageSrc: string) => {
    setFailedImages((prev) => ({ ...prev, [imageSrc]: true }));
  };

  const resellerMessage = resellerNote.trim()
    ? `Halo Admin Projecttapp, saya tertarik program Welcome Reseller untuk Tap Akrilik NFC & QR Dinamis. Info saya: ${resellerNote.trim()}. Mohon info daftar harga reseller-nya.`
    : 'Halo Admin Projecttapp, saya tertarik program Welcome Reseller untuk Tap Akrilik 10x10cm (49K) & Meja Lipat A5 (69K). Mohon info daftar harga reseller dan minimal ordernya.';

  const resellerWaHref = buildWhatsAppUrl(ADMIN_WHATSAPP_PHONE, resellerMessage);

  const handleCopyResellerMsg = async () => {
    try {
      await navigator.clipboard.writeText(resellerMessage);
      setCopiedResellerMsg(true);
      setTimeout(() => setCopiedResellerMsg(false), 2000);
    } catch {}
  };

  return (
    <>
      {/* SECTION 3: HARGA (#harga) */}
      <section id="harga" className="scroll-mt-24 pt-12 border-t border-[#104F38]/10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <p className="font-serif-italic text-sm sm:text-base text-[#104F38]">
              Media Fisik Siap Pakai · NFC + QR Dinamis
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#104F38] tracking-tight leading-tight">
              Harga Tap Bahan Akrilik
            </h2>
            <p className="text-xs sm:text-sm text-[#104F38]/75 leading-relaxed">
              Pilih ukuran akrilik sesuai penempatan di meja atau kasir Anda. Klik motif desain di bawah foto untuk melihat pratinjau warna.
            </p>
          </div>

          <div className="text-xs font-semibold text-[#104F38]/75 flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0">
            <span>Sudah termasuk chip NFC + QR Dinamis</span>
            <span aria-hidden="true">·</span>
            <span>Welcome Reseller tersedia</span>
          </div>
        </div>

        {/* 2 Product Cards: 10x10cm (49K) & Meja Lipat A5 (69K) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {ACRYLIC_PRODUCTS.map((product) => {
            const activeVariantId = selectedVariants[product.id] || product.variants[0].id;
            const activeVariant =
              product.variants.find((v) => v.id === activeVariantId) || product.variants[0];
            const isBroken = Boolean(failedImages[activeVariant.imageSrc]);

            const productWaMessage = `Halo Admin Projecttapp, saya ingin pesan ${product.name} (${product.sizeSpec}) harga ${product.priceFull}, pilihan motif: ${activeVariant.label}.`;
            const productWaHref = buildWhatsAppUrl(ADMIN_WHATSAPP_PHONE, productWaMessage);

            return (
              <article
                key={product.id}
                className="flex flex-col justify-between bg-white border border-[#104F38]/20 p-6 sm:p-7"
              >
                <div className="space-y-6">
                  {/* Top Product Header & Price */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#104F38]/15">
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-[#104F38]/70">
                        {product.kicker}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#104F38] tracking-tight">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#104F38]/70">
                        {product.sizeSpec}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="flex sm:justify-end items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#104F38] tabular-nums tracking-tight">
                          {product.priceShort}
                        </span>
                        <span className="text-xs font-semibold text-[#104F38]/65">
                          {product.unitLabel}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#104F38]/75 tabular-nums">
                        {product.priceFull}
                      </div>
                    </div>
                  </div>

                  {/* Product Visual Preview Stage + Interactive 4-Design Switcher */}
                  <div className="space-y-3">
                    <div className="h-72 sm:h-80 w-full bg-[#F4FAF6] border border-[#104F38]/15 flex items-center justify-center p-5 relative overflow-hidden">
                      {!isBroken ? (
                        <img
                          src={activeVariant.imageSrc}
                          alt={activeVariant.alt}
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(activeVariant.imageSrc)}
                          className="max-h-full max-w-full w-auto h-auto object-contain shadow-sm"
                        />
                      ) : (
                        <div className="text-center space-y-2 p-6">
                          <div className="text-sm font-extrabold text-[#104F38]">{product.name}</div>
                          <div className="text-xs text-[#104F38]/70">Motif: {activeVariant.label}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#104F38]/75">
                      <span>
                        Motif dipilih: <strong className="text-[#104F38]">{activeVariant.label}</strong>
                      </span>
                      <span className="tabular-nums">4 pilihan desain</span>
                    </div>

                    {/* 4 Design Thumbnails */}
                    <div className="grid grid-cols-4 gap-2.5" role="group" aria-label={`Pilih motif ${product.name}`}>
                      {product.variants.map((variant) => {
                        const isSelected = variant.id === activeVariant.id;
                        const thumbBroken = Boolean(failedImages[variant.imageSrc]);
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => handleSelectVariant(product.id, variant.id)}
                            aria-pressed={isSelected}
                            className={`p-1.5 bg-[#F4FAF6] border text-left transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                              isSelected
                                ? 'border-[#104F38] ring-1 ring-[#104F38] bg-[#FFE600]/20'
                                : 'border-[#104F38]/15 hover:border-[#104F38]/45'
                            }`}
                          >
                            <div className="w-full h-14 flex items-center justify-center bg-white border border-[#104F38]/10 p-1 overflow-hidden">
                              {!thumbBroken ? (
                                <img
                                  src={variant.imageSrc}
                                  alt={variant.label}
                                  referrerPolicy="no-referrer"
                                  onError={() => handleImageError(variant.imageSrc)}
                                  className="max-h-full max-w-full w-auto h-auto object-contain"
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-[#104F38] truncate">{variant.label}</span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[#104F38] truncate w-full text-center">
                              {variant.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description & Features */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs sm:text-sm text-[#104F38]/80 leading-relaxed">
                      {product.summary}
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-[#104F38]/85">
                      {product.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#104F38] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-6 mt-6 border-t border-[#104F38]/15">
                  <a
                    href={productWaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Pesan WhatsApp · {product.priceShort}</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {/* WELCOME RESELLER — HARGA KONTAK WHATSAPP */}
        <div className="bg-[#104F38] text-white border border-[#104F38] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-bold text-[#FFE600]">
              Welcome Reseller · Harga Khusus Grosir
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Welcome Reseller — Harga Kontak WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-2xl">
              Dapatkan penawaran harga khusus reseller untuk pembelian grosir Tap Bahan Akrilik 10×10 cm dan Meja Lipat A5. Cocok untuk mitra percetakan, agensi digital, dropshipper, maupun pengadaan jaringan restoran dan klinik.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80 font-medium tabular-nums">
              <span>WhatsApp: 085159746119</span>
              <span aria-hidden="true">·</span>
              <span>Harga khusus qty grosir</span>
              <span aria-hidden="true">·</span>
              <span>Siap kirim seluruh Indonesia</span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#0C3B2A] border border-white/15 p-5 space-y-3.5">
            <label htmlFor="reseller-note-input" className="block text-xs font-bold text-white">
              Catatan Pesanan / Kota (Opsional)
            </label>
            <input
              id="reseller-note-input"
              type="text"
              value={resellerNote}
              onChange={(e) => setResellerNote(e.target.value)}
              placeholder="Contoh: Reseller Jakarta · 25 pcs campur 10x10 & A5"
              className="w-full px-3.5 py-2 text-xs bg-white text-[#104F38] placeholder:text-[#104F38]/45 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
            />

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <a
                href={resellerWaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Kontak WhatsApp Reseller</span>
              </a>
              <button
                type="button"
                onClick={handleCopyResellerMsg}
                className="py-2.5 px-3.5 bg-transparent hover:bg-white/10 text-white border border-white/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedResellerMsg ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#FFE600]" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PERTANYAAN (#pertanyaan) */}
      <section id="pertanyaan" className="scroll-mt-24 pt-12 border-t border-[#104F38]/10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-3">
            <p className="font-serif-italic text-sm sm:text-base text-[#104F38]">
              Pertanyaan yang Sering Diajukan
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#104F38] tracking-tight leading-tight">
              Pertanyaan Seputar QR &amp; NFC
            </h2>
            <p className="text-xs sm:text-sm text-[#104F38]/75 leading-relaxed">
              Informasi lengkap mengenai stand akrilik 10×10 cm, meja lipat A5, sistem QR Dinamis &amp; tap NFC langsung, hingga harga grosir reseller.
            </p>
          </div>

          <div className="lg:col-span-7 border border-[#104F38]/20 bg-white divide-y divide-[#104F38]/15">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(item.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#F4FAF6] transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#104F38] leading-snug">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#104F38] shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#104F38]/80 leading-relaxed bg-[#F4FAF6]/60">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: APA KATA CUSTOMER (#testimoni) */}
      <section id="testimoni" className="scroll-mt-24 pt-12 border-t border-[#104F38]/10 space-y-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <p className="font-serif-italic text-sm sm:text-base text-[#104F38]">
              Pengalaman Pelaku Usaha Indonesia
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#104F38] tracking-tight leading-tight">
              Apa Kata Customer
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-[#104F38]/75 tabular-nums">
            <span>4,8 / 5 Rata-rata rating outlet</span>
            <span aria-hidden="true">·</span>
            <span>&lt; 10 detik ubah link massal</span>
            <span aria-hidden="true">·</span>
            <span>0 biaya cetak ulang stand</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between p-6 bg-white border border-[#104F38]/20 space-y-6"
            >
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#104F38] tabular-nums">
                  {item.outcome}
                </div>
                <p className="text-xs sm:text-sm text-[#104F38]/85 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[#104F38]/10 space-y-0.5">
                <div className="text-sm font-extrabold text-[#104F38]">
                  {item.name}
                </div>
                <div className="text-xs text-[#104F38]/70">
                  {item.role} · {item.business} · {item.city}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
};
