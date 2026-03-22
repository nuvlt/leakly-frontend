'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startScan, getAllScans, Scan } from '@/lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: Scan['status'] }) {
  const labels: Record<string, string> = {
    completed: 'Tamamlandı',
    running: 'Çalışıyor',
    pending: 'Bekliyor',
    failed: 'Hata',
  };
  return (
    <span className={`status-badge status-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scans, setScans] = useState<Scan[]>([]);
  const [scansLoading, setScansLoading] = useState(true);

  useEffect(() => {
    getAllScans()
      .then(setScans)
      .catch(() => {})
      .finally(() => setScansLoading(false));
  }, []);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let normalized = url.trim();
    if (!normalized) return;
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized;

    try {
      new URL(normalized);
    } catch {
      setError('Geçerli bir URL giriniz. Örn: https://site.com');
      return;
    }

    setLoading(true);
    try {
      const { scan_id } = await startScan(normalized);
      router.push(`/scan/${scan_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <div className="nav-logo">
            Leak<span>ly</span>
          </div>
          <div className="nav-links">
            <Link href="/" className="nav-link">Anasayfa</Link>
            <Link href="/scans" className="nav-link">Tüm Scanler</Link>
          </div>
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <div className="hero-tag">
            <span className="hero-tag-dot" />
            MVP · Kırık Link Tespiti Aktif
          </div>
          <h1>
            E-ticaret sitenizin<br />
            <em>gelir sızıntılarını</em> bulun
          </h1>
          <p>
            Kırık linkler, filtre tutarsızlıkları, arama sorunları ve listeleme
            hatalarını otomatik olarak tespit edin.
          </p>

          <form className="scan-form" onSubmit={handleScan}>
            <div className="input-wrap">
              <input
                className="url-input"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <button className="scan-btn" type="submit" disabled={loading}>
              {loading ? 'Başlatılıyor...' : 'Analiz Et →'}
            </button>
          </form>
          {error && <p className="error-msg">⚠ {error}</p>}
        </section>

        <section className="section">
          <div className="section-header">
            <span className="section-title">Son Scanler</span>
            {scans.length > 0 && (
              <Link href="/scans" className="nav-link" style={{ fontSize: 12 }}>
                Tümünü gör →
              </Link>
            )}
          </div>

          {scansLoading ? (
            <div className="loading-wrap" style={{ padding: '32px 0' }}>
              <div className="spinner" />
            </div>
          ) : scans.length === 0 ? (
            <div className="empty-state">
              <p>Henüz scan yapılmadı. Yukarıdan başlatın.</p>
            </div>
          ) : (
            <div className="scan-list">
              {scans.slice(0, 8).map(scan => (
                <Link key={scan.id} href={`/scan/${scan.id}`} className="scan-card">
                  <span className="scan-card-url">{scan.url}</span>
                  <div className="scan-card-meta">
                    <StatusBadge status={scan.status} />
                    <span className="scan-card-date">{formatDate(scan.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>Leak<span>ly</span> · E-ticaret Conversion Analiz Platformu</p>
        </div>
      </footer>
    </>
  );
}
