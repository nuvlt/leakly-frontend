const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';
export type IssueSeverity = 'low' | 'medium' | 'high';
export type IssueType =
  | 'broken_link'
  | 'filter_inconsistency'
  | 'search_quality'
  | 'listing_problem';

export interface Scan {
  id: string;
  url: string;
  status: ScanStatus;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface Page {
  id: string;
  scan_id: string;
  url: string;
  type: string;
  status_code: number | null;
  crawled_at: string;
}

export interface Issue {
  id: string;
  scan_id: string;
  page_id: string | null;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  repro_steps: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ScanResult {
  scan: Scan;
  pages: Page[];
  issues: Issue[];
  summary: {
    total_pages: number;
    total_issues: number;
    by_severity: Record<IssueSeverity, number>;
    by_type: Record<IssueType, number>;
  };
}

export async function startScan(url: string): Promise<{ scan_id: string }> {
  const res = await fetch(`${API_URL}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Scan başlatılamadı.');
  }
  return res.json();
}

export async function getScan(id: string): Promise<ScanResult> {
  const res = await fetch(`${API_URL}/api/scans/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Scan bulunamadı.');
  return res.json();
}

export async function getAllScans(): Promise<Scan[]> {
  const res = await fetch(`${API_URL}/api/scans`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Scanler alınamadı.');
  return res.json();
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  broken_link: 'Kırık Link',
  filter_inconsistency: 'Filtre Tutarsızlığı',
  search_quality: 'Arama Kalitesi',
  listing_problem: 'Listeleme Problemi',
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
};
