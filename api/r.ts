import { db } from '../db.ts';

const BASE_FALLBACK_SLUGS: Record<string, string> = {
  'menu-resto': 'https://restoran-nusantara-2026.com/menu-spesial-chef',
  'qr-001': 'https://search.google.com/local/writereview?placeid=ChIJ_8pMXbpfZS4Rlo0DNUQ77ro',
  'qr-002': 'https://shopee.co.id',
  'qr-003': 'https://wa.me/6281234567890',
  'review': 'https://search.google.com/local/writereview?placeid=ChIJ_8pMXbpfZS4Rlo0DNUQ77ro',
  'google-review': 'https://search.google.com/local/writereview?placeid=ChIJ_8pMXbpfZS4Rlo0DNUQ77ro',
  'kopi-speciality': 'https://shopee.co.id',
  'kartu-nama-ceo': 'https://wa.me/6281234567890',
  'dummy-test': 'https://search.google.com/local/writereview?placeid=ChIJE9fYc0pfZS4R0zV64ObvPoM'
};

const CLOUD_SYNC_OBJECT_ID = 'ff808181a09d98f701a1b392719d5825';

// Dedicated Vercel Serverless Function for Dynamic QR Redirection (/r/:slug)
export default async function handler(req: any, res: any) {
  try {
    const rawSlug =
      (req.query?.slug as string) ||
      req.params?.slug ||
      (req.url?.includes('/r/') ? req.url.split('/r/')[1]?.split('?')[0] : null) ||
      (req.headers?.['x-matched-path']?.includes('/r/') ? req.headers['x-matched-path'].split('/r/')[1]?.split('?')[0] : null);

    const slug = (rawSlug || 'menu-resto').trim().toLowerCase();

    let destinationUrl: string | null = null;
    let qrUtm: any = null;

    // Tier 1: Look up dynamic QR code in database
    try {
      const qr = await db.getQRCodeBySlug(slug);
      if (qr?.targetUrl) {
        destinationUrl = qr.targetUrl.trim();
        qrUtm = qr.utm;
      }
    } catch (dbErr) {
      console.warn('[Vercel /r/ DB Lookup Warning]:', dbErr);
    }

    // Tier 2: Check base fallback map
    if (!destinationUrl && BASE_FALLBACK_SLUGS[slug]) {
      destinationUrl = BASE_FALLBACK_SLUGS[slug];
    }

    // Tier 3: Query Cloud Sync REST object directly if still not found
    if (!destinationUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2200);
        const cloudRes = await fetch(`https://api.restful-api.dev/objects/${CLOUD_SYNC_OBJECT_ID}`, {
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (cloudRes.ok) {
          const json = await cloudRes.json();
          if (json?.data && typeof json.data === 'object') {
            if (json.data[slug] && typeof json.data[slug] === 'string') {
              destinationUrl = json.data[slug].trim();
            } else {
              // Dash-tolerant normalized match
              const strippedTarget = slug.replace(/[^a-z0-9]/g, '');
              for (const [k, v] of Object.entries(json.data)) {
                if (typeof v === 'string' && v.trim()) {
                  const strippedK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (strippedK === strippedTarget && strippedTarget.length >= 2) {
                    destinationUrl = v.trim();
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (cloudErr) {
        console.warn('[Vercel /r/ CloudSync Warning]:', cloudErr);
      }
    }

    // If still not found, check if it's review fallback
    if (!destinationUrl && (slug.includes('review') || slug.includes('google'))) {
      destinationUrl = 'https://search.google.com/local/writereview?placeid=ChIJ_8pMXbpfZS4Rlo0DNUQ77ro';
    }

    // Append UTM if present
    if (destinationUrl && qrUtm && (qrUtm.source || qrUtm.medium || qrUtm.campaign)) {
      try {
        const urlObj = new URL(destinationUrl);
        if (qrUtm.source && !urlObj.searchParams.has('utm_source')) {
          urlObj.searchParams.set('utm_source', qrUtm.source);
        }
        if (qrUtm.medium && !urlObj.searchParams.has('utm_medium')) {
          urlObj.searchParams.set('utm_medium', qrUtm.medium);
        }
        if (qrUtm.campaign && !urlObj.searchParams.has('utm_campaign')) {
          urlObj.searchParams.set('utm_campaign', qrUtm.campaign);
        }
        destinationUrl = urlObj.toString();
      } catch {}
    }

    // Set aggressive no-cache headers for Vercel Edge CDN & mobile browsers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

    if (destinationUrl) {
      if (typeof res.redirect === 'function') {
        return res.redirect(302, destinationUrl);
      } else {
        res.writeHead(302, { Location: destinationUrl });
        return res.end();
      }
    }

    // If slug completely unknown, show friendly activation page
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Tautan Dinamis /r/${slug} Siap Digunakan</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0fdf4; color: #104F38; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; max-width: 460px; width: 100%; border-radius: 8px; border: 2px solid #104F38; padding: 32px 24px; text-align: center; box-shadow: 0 10px 25px -5px rgba(16,79,56,0.1); }
          .badge { display: inline-block; background: #FFE600; color: #104F38; font-weight: 800; font-size: 11px; padding: 4px 10px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
          h1 { font-size: 18px; font-weight: 800; margin: 0 0 10px; color: #104F38; }
          p { font-size: 13px; color: #2d5543; line-height: 1.6; margin: 0 0 20px; }
          .code { font-family: monospace; background: #eaf5f0; padding: 3px 8px; font-weight: 700; color: #104F38; }
          a { display: inline-block; background: #104F38; color: #FFE600; padding: 10px 20px; font-size: 13px; font-weight: 800; text-decoration: none; border: 1px solid #104F38; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">🟢 Tautan Dinamis Cloud Terdaftar</div>
          <h1>QR Code Fisik Aktif</h1>
          <p>Tautan dinamis <span class="code">/r/${slug}</span> telah terpasang di Vercel Cloud Redirect. Anda dapat menyambungkan tautan tujuan spesifik di panel admin tanpa perlu mencetak ulang fisik.</p>
          <a href="/">Buka Dashboard Admin</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[Vercel /r/ redirect fatal error]:', err);
    res.setHeader('Cache-Control', 'no-store');
    if (typeof res.redirect === 'function') {
      return res.redirect(302, '/');
    } else {
      res.writeHead(302, { Location: '/' });
      return res.end();
    }
  }
}
