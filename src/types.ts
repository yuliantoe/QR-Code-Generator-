export interface QRStyleConfig {
  fgColor: string;
  bgColor: string;
  dotStyle: 'square' | 'rounded' | 'dots';
  cornerStyle: 'square' | 'rounded' | 'dot';
  logo?: string;
  logoType?: 'preset' | 'custom' | 'none';
  frameText?: string;
  frameStyle: 'none' | 'bottom-banner' | 'top-banner' | 'border-card';
  frameColor: string;
  frameTextColor: string;
}

export interface URLChangeRecord {
  url: string;
  changedAt: string;
  reason?: string;
}

export interface ScanRecord {
  id: string;
  qrId: string;
  timestamp: string;
  device: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  referer: string;
  ipMasked?: string;
}

export interface DynamicQRCode {
  id: string;
  code?: string; // Automatic sequential identifier (e.g. QR-001, QR-002)
  slug: string;
  title: string;
  targetUrl: string;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes?: string;
  totalScans: number;
  lastScannedAt?: string | null;
  urlHistory: URLChangeRecord[];
  style: QRStyleConfig;
  password?: string;
  expiryDate?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export interface QRAnalyticsSummary {
  qrId: string;
  totalScans: number;
  scansToday: number;
  scansLast7Days: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
    unknown: number;
  };
  osBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  dailyScans: Array<{ date: string; count: number }>;
  recentScans: ScanRecord[];
}

export interface AuthUser {
  username: string;
  name: string;
}

export interface NFCTag {
  id: string;
  tagUid: string;
  placeName: string;
  googleReviewUrl: string;
  pin: string;
  status: 'active' | 'pending' | 'locked';
  totalTaps: number;
  lastTappedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

