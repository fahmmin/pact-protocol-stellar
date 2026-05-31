'use client';

import { useEffect, useState } from 'react';
import { listPrompts } from '@/lib/agentApi';
import { Settings, Loader } from 'lucide-react';

export default function AdminPromptsPage() {
  const [apiKey, setApiKey] = useState('');
  const [prompts, setPrompts] = useState<Array<{
    id: string;
    version: number;
    persona_id: string;
    system_prompt: string;
    active: number;
  }>>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!apiKey) return;
    setLoading(true);
    try {
      const data = await listPrompts(apiKey);
      setPrompts(data.prompts);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (apiKey) load();
  }, [apiKey]);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">ORACLE OPS</div>
      <h1 style={{ marginBottom: '2rem' }}>
        PROMPT & <span style={{ color: 'var(--accent-purple)' }}>PERSONA</span> ADMIN
      </h1>

      <div className="card" style={{ marginBottom: '2rem', maxWidth: 480 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oracle API Key</label>
        <input
          className="input"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ marginTop: '0.5rem' }}
        />
        <button className="btn btn-sm" style={{ marginTop: '0.75rem' }} onClick={load}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Loader size={16} className="spinner" /> Loading prompts…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {prompts.map((p) => (
            <div key={`${p.id}-${p.version}`} className="card card-dim">
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Settings size={14} /> {p.persona_id} v{p.version}
                </span>
                {p.active ? (
                  <span className="badge badge-green">ACTIVE</span>
                ) : (
                  <span className="badge badge-gray">inactive</span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {p.system_prompt.slice(0, 200)}
                {p.system_prompt.length > 200 ? '…' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
