import { db } from '../db.ts';

// Dedicated Vercel Serverless Function for NFC Tap Redirection (/nfc/:id)
export default async function handler(req: any, res: any) {
  try {
    const rawId =
      (req.query?.id as string) ||
      req.params?.id ||
      (req.url?.includes('/nfc/') ? req.url.split('/nfc/')[1]?.split('?')[0] : null) ||
      (req.url?.includes('/n/') ? req.url.split('/n/')[1]?.split('?')[0] : null);

    const id = (rawId || '').trim();
    const tag = await db.getNFCTagById(id);

    const destinationUrl = tag?.googleReviewUrl || 'https://maps.google.com';

    // Set aggressive no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

    if (typeof res.redirect === 'function') {
      return res.redirect(302, destinationUrl);
    } else {
      res.writeHead(302, { Location: destinationUrl });
      return res.end();
    }
  } catch (err) {
    console.error('[Vercel /nfc/ redirect error]:', err);
    res.setHeader('Cache-Control', 'no-store');
    if (typeof res.redirect === 'function') {
      return res.redirect(302, 'https://maps.google.com');
    } else {
      res.writeHead(302, { Location: 'https://maps.google.com' });
      return res.end();
    }
  }
}
