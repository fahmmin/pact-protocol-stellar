'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Gauge, HeartPulse } from 'lucide-react';
import { getDealMetrics } from '@/lib/agentApi';

type MetricsSummary = {
  uptime_seconds: number;
  total_requests: number;
  total_negotiations: number;
  avg_latency_ms: number;
  status_codes: Record<string, number>;
};

const runtimeBaseUrl =
  process.env.NEXT_PUBLIC_AGENT_RUNTIME_URL || 'http://localhost:8000';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dealId, setDealId] = useState('1');
  const [dealMetrics, setDealMetrics] = useState<Awaited<ReturnType<typeof getDealMetrics>> | null>(null);

  async function loadSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${runtimeBaseUrl}/metrics/summary`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as MetricsSummary;
      setMetrics(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load metrics');
    } finally {
      setLoading(false);
    }
  }

  async function loadDealMetrics() {
    try {
      const data = await getDealMetrics(parseInt(dealId, 10));
      setDealMetrics(data);
    } catch {
      setDealMetrics(null);
    }
  }

  useEffect(() => {
    loadSummary();
    const timer = setInterval(loadSummary, 10000);
    return () => clearInterval(timer);
  }, []);

  const statusRows = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.status_codes).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [metrics]);

  const badgeColor =
    dealMetrics?.settlement_readiness?.badge === 'Ready'
      ? 'var(--accent-green)'
      : dealMetrics?.settlement_readiness?.badge === 'Under Review'
        ? 'var(--accent-yellow)'
        : 'var(--text-muted)';

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 3rem' }}>
      <div className="section-eyebrow">RUNTIME OBSERVABILITY</div>
      <h1 style={{ marginBottom: '0.5rem' }}>
        LIVE <span style={{ color: 'var(--accent-yellow)' }}>METRICS</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Source: <code>{runtimeBaseUrl}/metrics/summary</code>
      </p>

      {error && (
        <div className="card" style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)', marginBottom: '1rem' }}>
          <AlertTriangle size={16} style={{ marginRight: '0.4rem' }} />
          {error}
        </div>
      )}

      <div className="grid-4" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
        <StatCard icon={<HeartPulse size={16} />} label="Uptime (s)" value={metrics ? metrics.uptime_seconds.toString() : loading ? 'Loading…' : '-'} />
        <StatCard icon={<Activity size={16} />} label="Requests" value={metrics ? metrics.total_requests.toString() : loading ? 'Loading…' : '-'} />
        <StatCard icon={<Gauge size={16} />} label="Avg Latency" value={metrics ? `${metrics.avg_latency_ms} ms` : loading ? 'Loading…' : '-'} />
        <StatCard icon={<Activity size={16} />} label="Negotiations" value={metrics ? metrics.total_negotiations.toString() : loading ? 'Loading…' : '-'} />
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Deal KPI & settlement readiness</h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input className="input" type="number" value={dealId} onChange={(e) => setDealId(e.target.value)} style={{ maxWidth: 120 }} />
          <button className="btn btn-sm" onClick={loadDealMetrics}>Load deal metrics</button>
          <Link href="/admin/settlement" className="btn btn-sm btn-ghost">Oracle settle →</Link>
        </div>
        {dealMetrics && (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: badgeColor, marginBottom: '0.75rem' }}>
              Badge: {dealMetrics.settlement_readiness.badge}
            </div>
            {dealMetrics.daily_checks.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No daily checks recorded yet.</p>
            ) : (
              dealMetrics.daily_checks.slice(0, 3).map((c) => (
                <div key={c.id} style={{ fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  {c.engagement_bps} bps · {c.views} views · KPI {c.kpi_met ? 'met' : 'miss'}
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>HTTP Status Breakdown</h3>
        {statusRows.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No status samples yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {statusRows.map(([code, count]) => (
              <div key={code} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-dim)', padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <span>{code}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--accent-yellow)',
          marginBottom: '0.45rem',
        }}
      >
        {icon}
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem' }}>{value}</div>
    </div>
  );
}
