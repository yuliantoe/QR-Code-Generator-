import app from '../server.ts';

// Delegate /api/r requests directly to unified Express app so scans share the exact same
// database, /tmp cache, password/pause checks, UTM params, and analytics recording.
export default function handler(req: any, res: any) {
  const rawSlug =
    (req.query?.slug as string) ||
    (req.url?.includes('/r/') ? req.url.split('/r/')[1]?.split('?')[0] : null) ||
    (req.headers?.['x-matched-path']?.includes('/r/') ? req.headers['x-matched-path'].split('/r/')[1]?.split('?')[0] : null);

  if (rawSlug) {
    const cleanSlug = encodeURIComponent(String(rawSlug).trim().toLowerCase());
    req.url = `/r/${cleanSlug}`;
  }

  return app(req, res);
}
