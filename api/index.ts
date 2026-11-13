import app from '../server.ts';

export default function handler(req: any, res: any) {
  const rawUrl = req.url || '/';
  const qIdx = rawUrl.indexOf('?');
  if (qIdx !== -1) {
    const sp = new URLSearchParams(rawUrl.slice(qIdx + 1));
    const rewritePath = sp.get('__path')?.trim();
    if (rewritePath && rewritePath.startsWith('/') && !rewritePath.startsWith('/api/index.ts')) {
      sp.delete('__path');
      if (rewritePath.startsWith('/r/')) sp.delete('slug');
      if (rewritePath.startsWith('/nfc/') || rewritePath.startsWith('/n/')) sp.delete('nfcId');
      const qs = sp.toString();
      req.url = rewritePath + (qs ? (rewritePath.includes('?') ? '&' : '?') + qs : '');
    }
  }
  return app(req, res);
}
