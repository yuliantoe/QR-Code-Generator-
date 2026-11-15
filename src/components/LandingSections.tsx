import React, { useState } from 'react';
import { Check, ChevronDown, ArrowRight } from 'lucide-react';

interface LandingSectionsProps {
  isAuthenticated: boolean;
  onActionLogin: () => void;
}

interface PricingTier {
  id: string;
  name: string;
  audience: string;
  monthlyPrice: string;
  annualPrice: string;
  unitLabel: string;
  highlight?: boolean;
  kicker: string;
  features: string[];
  ctaLabel: string;
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

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    audience: 'Cocok untuk 1 outlet, kedai kopi, atau toko ritel mandiri.',
    monthlyPrice: 'Rp 79.000',
    annualPrice: 'Rp 63.000',
    unitLabel: '/bulan',
    kicker: 'Paket Awal',
    features: [
      'Hingga 5 QR Code Dinamis aktif',
      '1 Tag NFC Google Review terhubung',
      'Ubah link tujuan kapan saja tanpa cetak ulang',
      'Template Desain Stand Meja A6 siap cetak'
    ],
    ctaLabel: 'Mulai Paket Starter'
  },
  {
    id: 'bisnis',
    name: 'Bisnis',
    audience: 'Pilihan utama restoran, klinik, barbershop, dan kafe ramai.',
    monthlyPrice: 'Rp 179.000',
    annualPrice: 'Rp 143.000',
    unitLabel: '/bulan',
    highlight: true,
    kicker: 'Paling Populer · Multi-Meja',
    features: [
      'Hingga 25 QR Code Dinamis & buat massal',
      '10 Tag NFC aktif dengan sinkronisasi otomatis ke QR',
      'Keamanan PIN NFC untuk edit & hapus tag',
      'Analitik jumlah scan QR & tap NFC real-time',
      'Kustomisasi warna & logo brand di Stand A6'
    ],
    ctaLabel: 'Pilih Paket Bisnis'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'Untuk jaringan franchise, grup kuliner, atau banyak cabang.',
    monthlyPrice: 'Rp 399.000',
    annualPrice: 'Rp 319.000',
    unitLabel: '/bulan',
    kicker: 'Skala Multi-Cabang',
    features: [
      'QR Dinamis & Tag NFC tidak terbatas',
      'Multi-akun operator cabang & manajemen admin',
      'Sinkronisasi instan lintas perangkat HP & Web',
      'Ekspor laporan performa seluruh outlet',
      'Prioritas pendampingan setup stand massal'
    ],
    ctaLabel: 'Gunakan Paket Enterprise'
  }
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Apakah QR Code dan tag NFC harus dicetak ulang jika link tujuan diganti?',
    answer:
      'Tidak perlu. Setiap QR Code dan tag NFC Projecttapp menggunakan tautan redirect dinamis. Saat Anda mengganti link Google Review, menu digital, atau halaman promo di dashboard, seluruh stand fisik di meja pelanggan langsung mengarah ke tautan baru dalam hitungan detik.'
  },
  {
    id: 'faq-2',
    question: 'Apakah pelanggan perlu aplikasi khusus atau memasukkan PIN saat tap NFC?',
    answer:
      'Tidak perlu. Pelanggan cukup menempelkan smartphone ke titik NFC pada stand meja akrilik, dan halaman ulasan Google Review langsung terbuka otomatis di browser. PIN hanya dipakai oleh pengelola di dashboard saat mengedit atau menghapus data tag NFC.'
  },
  {
    id: 'faq-3',
    question: 'Bagaimana sinkronisasi data jika tag NFC diaktifkan lewat HP lalu dicek di komputer?',
    answer:
      'Seluruh aktivasi tag NFC baru, pembaruan link QR, dan catatan jumlah tap tersimpan langsung di server serta tersinkronisasi real-time. Daftar tag yang baru direkam dari HP akan langsung muncul di layar dashboard website tanpa perlu input ulang.'
  },
  {
    id: 'faq-4',
    question: 'Apakah sudah tersedia desain stand meja akrilik siap cetak?',
    answer:
      'Ya. Setelah login ke dashboard, Anda dapat langsung membuka Studio Desain Stand A6 untuk mengatur tata letak stand segitiga, kotak, atau L-shape, menggabungkan QR dinamis dan ikon NFC, lalu mengunduhnya dalam resolusi cetak.'
  },
  {
    id: 'faq-5',
    question: 'Bagaimana jika link pada Daftar QR Code diubah, apakah daftar NFC ikut berubah?',
    answer:
      'Ya, jika tag NFC diaktifkan menggunakan data QR Code yang sudah ada, perubahan link tujuan pada QR tersebut akan otomatis memperbarui link pada daftar Tag NFC yang terhubung.'
  }
];

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    quote:
      'Dulu pelanggan sering malas mengetik link Google Maps karena terlalu panjang. Setelah taruh 12 stand meja QR dan NFC Projecttapp di kasir, pelanggan tinggal tap HP dan langsung kasih bintang 5. Saat kami ganti link ke promo Ramadhan, tidak ada satu pun stand akrilik yang perlu dicetak ulang.',
    name: 'Rina Kusuma',
    role: 'Pemilik Usaha',
    business: 'Kopi Senja Kemang',
    city: 'Jakarta Selatan',
    outcome: '+185 ulasan Google bintang 5 dalam 3 bulan'
  },
  {
    id: 'testi-2',
    quote:
      'Tim resepsionis kami mengaktifkan tag NFC langsung dari smartphone saat menempelkan stiker di meja antrean. Begitu dicek di komputer kasir, datanya langsung masuk dan sinkron. Pasien cukup tap tanpa perlu PIN atau instal aplikasi tambahan.',
    name: 'Hendra Wijaya',
    role: 'Manajer Operasional',
    business: 'Klinik Gigi Sehat Sentosa',
    city: 'Bandung',
    outcome: 'Update link 10 tag cabang selesai di bawah 15 detik'
  },
  {
    id: 'testi-3',
    quote:
      'Mengelola 6 cabang sekaligus jadi jauh lebih rapi karena setiap QR punya kode berurutan dan template Stand A6 siap cetak sudah satu paket. Jika satu link menu berubah, seluruh stand cabang langsung mengikuti otomatis.',
    name: 'Sari Wulandari',
    role: 'Co-Founder',
    business: 'Bakmi Nusantara Grup',
    city: 'Surabaya',
    outcome: 'Rating rata-rata cabang naik dari 4,2 ke 4,8 dalam 12 minggu'
  }
];

export const LandingSections: React.FC<LandingSectionsProps> = ({
  isAuthenticated,
  onActionLogin
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* SECTION 3: HARGA (#harga) */}
      <section id="harga" className="scroll-mt-24 pt-12 border-t border-[#104F38]/10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <p className="font-serif-italic text-sm sm:text-base text-[#104F38]">
              Harga Transparan Tanpa Biaya Cetak Ulang
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#104F38] tracking-tight leading-tight">
              Pilihan Paket Projecttapp
            </h2>
            <p className="text-xs sm:text-sm text-[#104F38]/75 leading-relaxed">
              Pilih kapasitas QR Code dinamis dan aktivasi NFC tag sesuai jumlah meja atau cabang usaha Anda.
            </p>
          </div>

          {/* Interactive Billing Cycle Segmented Control */}
          <div
            role="group"
            aria-label="Pilih siklus penagihan"
            className="inline-flex items-center gap-1 p-1 bg-[#F4FAF6] border border-[#104F38]/20 self-start md:self-auto shrink-0"
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#104F38] text-white'
                  : 'text-[#104F38]/75 hover:text-[#104F38]'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-[#FFE600] text-[#104F38]'
                  : 'text-[#104F38]/75 hover:text-[#104F38]'
              }`}
            >
              Tahunan · Hemat 20%
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {PRICING_TIERS.map((tier) => {
            const activePrice = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
            return (
              <div
                key={tier.id}
                className={`flex flex-col justify-between p-6 sm:p-7 border transition-colors ${
                  tier.highlight
                    ? 'bg-[#F4FAF6] border-[#104F38]'
                    : 'bg-white border-[#104F38]/20'
                }`}
              >
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-[#104F38]/70">
                      {tier.kicker}
                    </div>
                    <h3 className="text-xl font-extrabold text-[#104F38] tracking-tight">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-[#104F38]/75 leading-relaxed">
                      {tier.audience}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#104F38]/15">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-[#104F38] tabular-nums tracking-tight">
                        {activePrice}
                      </span>
                      <span className="text-xs font-medium text-[#104F38]/65">
                        {tier.unitLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#104F38]/60 mt-1 tabular-nums">
                      {billingCycle === 'annual'
                        ? 'Ditagih tahunan · bebas biaya pembaruan link'
                        : 'Tanpa kontrak jangka panjang · bisa upgrade kapan saja'}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#104F38]/85">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#104F38] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-[#104F38]/10">
                  <button
                    type="button"
                    onClick={onActionLogin}
                    className={`w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      tier.highlight
                        ? 'bg-[#FFE600] hover:bg-[#F2DA00] text-[#104F38] border border-[#104F38]/30'
                        : 'bg-white hover:bg-[#F4FAF6] text-[#104F38] border border-[#104F38]/30'
                    }`}
                  >
                    <span>{isAuthenticated ? 'Buka Dashboard' : tier.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
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
              Semua detail teknis mengenai cara kerja pengalihan tautan instan, keamanan PIN pengelola, hingga desain cetak stand meja akrilik A6.
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
