'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllScans, Scan } from '@/lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllScans()
      .then(setScans)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            Leak<span style={{ color: 'var(--accent)' }}>ly</span>
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Anasayfa</Link>
            <Link href="/scans" className="nav-link">Tüm Scanler</Link>
          </div>
        </div>
      </nav>

      <main className="container">
        <div className="scan-header">
          <Link href="/" className="back-link">← Geri dön</Link>
          <div className="scan-url">Tüm Scanler</div>
        </div>

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            <p className="loading-text">Yükleniyor...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="empty-state">
            <p>Henüz scan yapılmadı.</p>
            <Link href="/" style={{ marginTop: 16, display: 'inline-block', color: 'var(--accent)', fontSize: 14 }}>
              İlk scani başlat →
            </Link>
          </div>
        ) : (
          <div className="scan-list fade-up">
            {scans.map(scan => (
              <Link key={scan.id} href={`/scan/${scan.id}`} className="scan-card">
                <span className="scan-card-url">{scan.url}</span>
                <div className="scan-card-meta">
                  <span className={`status-badge status-${scan.status}`}>
                    {scan.status === 'completed' ? 'Tamamlandı'
                      : scan.status === 'running' ? 'Çalışıyor'
                      : scan.status === 'failed' ? 'Hata' : 'Bekliyor'}
                  </span>
                  <span className="scan-card-date">{formatDate(scan.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>Leak<span>ly</span> · E-ticaret Conversion Analiz Platformu</p>
        </div>
      </footer>
    </>
  );
}
