'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getScan, ScanResult, ISSUE_TYPE_LABELS } from '@/lib/api';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return `${(ms / 1000).toFixed(0)}sn`;
}

export default function ScanPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [showPages, setShowPages] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function fetch() {
      try {
        const data = await getScan(params.id);
        setResult(data);
        if (data.scan.status === 'running' || data.scan.status === 'pending') {
          interval = setInterval(async () => {
            try {
              const updated = await getScan(params.id);
              setResult(updated);
              if (updated.scan.status !== 'running' && updated.scan.status !== 'pending') {
                clearInterval(interval);
              }
            } catch {}
          }, 3000);
        }
      } catch {
        setError('Scan bulunamadı veya bir hata oluştu.');
      }
    }

    fetch();
    return () => clearInterval(interval);
  }, [params.id]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
          ⚠ {error}
        </p>
        <Link href="/" className="back-link" style={{ marginTop: 16, display: 'inline-flex' }}>
          ← Ana sayfaya dön
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container">
        <div className="loading-wrap">
          <div className="spinner" />
          <p className="loading-text">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const { scan, pages, issues, summary } = result;
  const isRunning = scan.status === 'running' || scan.status === 'pending';
  const duration = formatDuration(scan.started_at, scan.finished_at);

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

          <div className="scan-url">{scan.url}</div>

          <div className="scan-meta-row">
            <span className={`status-badge status-${scan.status}`}>
              {scan.status === 'completed' ? 'Tamamlandı'
                : scan.status === 'running' ? 'Çalışıyor'
                : scan.status === 'failed' ? 'Hata'
                : 'Bekliyor'}
            </span>
            <span className="scan-meta-item">
              🕒 {formatDate(scan.created_at)}
            </span>
            {duration && (
              <span className="scan-meta-item">⚡ {duration}</span>
            )}
          </div>
        </div>

        {isRunning ? (
          <div className="running-card">
            <div className="running-icon" />
            <div className="running-title">Scan devam ediyor...</div>
            <div className="running-sub">
              Sayfa keşfediliyor ve analiz yapılıyor. Bu sayfa otomatik güncellenir.
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Toplam Sayfa</div>
                <div className="stat-value accent">{summary.total_pages}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Toplam Sorun</div>
                <div className="stat-value" style={{
                  color: summary.total_issues > 0 ? 'var(--red)' : 'var(--accent)'
                }}>
                  {summary.total_issues}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Yüksek Öncelik</div>
                <div className="stat-value red">{summary.by_severity.high}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Orta Öncelik</div>
                <div className="stat-value amber">{summary.by_severity.medium}</div>
              </div>
            </div>

            {/* Issues */}
            <div className="issues-section">
              <div className="section-header">
                <span className="section-title">
                  Tespit Edilen Sorunlar ({issues.length})
                </span>
              </div>

              {issues.length === 0 ? (
                <div className="empty-state">
                  <p>✓ Bu taramada sorun tespit edilmedi.</p>
                </div>
              ) : (
                issues.map(issue => (
                  <div key={issue.id} className="issue-card">
                    <div className="issue-card-top">
                      <div className="issue-badges">
                        <span className={`severity-badge severity-${issue.severity}`}>
                          {issue.severity === 'high' ? 'Yüksek'
                            : issue.severity === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                        <span className="type-badge">
                          {ISSUE_TYPE_LABELS[issue.type]}
                        </span>
                      </div>
                    </div>

                    <div className="issue-description">{issue.description}</div>

                    {issue.metadata?.affected_url && (
                      <div className="issue-url">
                        {issue.metadata.affected_url as string}
                      </div>
                    )}

                    {issue.repro_steps?.length > 0 && (
                      <div className="repro-steps">
                        <div className="repro-title">Nasıl tekrar edilir</div>
                        <ol className="repro-list">
                          {issue.repro_steps.map((step, i) => (
                            <li key={i} className="repro-item">
                              <span className="repro-num">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pages */}
            {pages.length > 0 && (
              <div className="section" style={{ marginTop: 48 }}>
                <div className="section-header">
                  <span className="section-title">
                    Taranan Sayfalar ({pages.length})
                  </span>
                  <button
                    onClick={() => setShowPages(v => !v)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-secondary)', fontSize: 12,
                      fontFamily: 'var(--font-mono)', padding: 0,
                    }}
                  >
                    {showPages ? 'Gizle' : 'Göster'}
                  </button>
                </div>

                {showPages && (
                  <div className="pages-grid">
                    {pages.map(page => (
                      <div key={page.id} className="page-pill">
                        <span className="page-pill-url" title={page.url}>
                          {page.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                        </span>
                        <span className={`page-type-tag page-type-${page.type}`}>
                          {page.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
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
