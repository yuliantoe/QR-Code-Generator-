import app from '../server.ts';

// Delegate /api/nfc requests directly to unified Express app
export default function handler(req: any, res: any) {
  const rawId =
    (req.query?.id as string) ||
    (req.query?.nfcId as string) ||
    (req.url?.includes('/nfc/') ? req.url.split('/nfc/')[1]?.split('?')[0] : null) ||
    (req.url?.includes('/n/') ? req.url.split('/n/')[1]?.split('?')[0] : null);

  if (rawId) {
    req.url = `/nfc/${encodeURIComponent(String(rawId).trim())}`;
  }

  return app(req, res);
}
