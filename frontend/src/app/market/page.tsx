'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Brain, TrendingUp, TrendingDown, Minus,
  ExternalLink, BarChart3
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   MARKET DATA
   ───────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    name: 'AI Code Generation',
    velocity: 0.95,
    direction: 'accelerating' as const,
    tools: [
      { name: 'Cursor', score: 0.94, sentiment: 0.92, trend: 'up' },
      { name: 'GitHub Copilot', score: 0.91, sentiment: 0.82, trend: 'stable' },
      { name: 'Replit', score: 0.82, sentiment: 0.72, trend: 'up' },
      { name: 'Tabnine', score: 0.75, sentiment: 0.68, trend: 'down' },
    ],
  },
  {
    name: 'AI Agents & LLMs',
    velocity: 0.88,
    direction: 'accelerating' as const,
    tools: [
      { name: 'Claude', score: 0.93, sentiment: 0.90, trend: 'up' },
      { name: 'GPT-4o', score: 0.92, sentiment: 0.85, trend: 'stable' },
      { name: 'Gemini', score: 0.88, sentiment: 0.80, trend: 'up' },
      { name: 'Llama', score: 0.80, sentiment: 0.78, trend: 'up' },
    ],
  },
  {
    name: 'AI Automation',
    velocity: 0.78,
    direction: 'stable' as const,
    tools: [
      { name: 'Zapier', score: 0.86, sentiment: 0.82, trend: 'stable' },
      { name: 'n8n', score: 0.85, sentiment: 0.85, trend: 'up' },
      { name: 'Make', score: 0.78, sentiment: 0.76, trend: 'stable' },
      { name: 'Pipedream', score: 0.72, sentiment: 0.74, trend: 'up' },
    ],
  },
  {
    name: 'Knowledge & Docs',
    velocity: 0.72,
    direction: 'stable' as const,
    tools: [
      { name: 'Notion AI', score: 0.89, sentiment: 0.78, trend: 'stable' },
      { name: 'Obsidian', score: 0.82, sentiment: 0.88, trend: 'up' },
      { name: 'Mem', score: 0.70, sentiment: 0.72, trend: 'down' },
      { name: 'Coda AI', score: 0.68, sentiment: 0.65, trend: 'stable' },
    ],
  },
  {
    name: 'AI Security',
    velocity: 0.75,
    direction: 'accelerating' as const,
    tools: [
      { name: 'Snyk', score: 0.88, sentiment: 0.82, trend: 'up' },
      { name: 'Wiz', score: 0.85, sentiment: 0.80, trend: 'up' },
      { name: 'Orca', score: 0.78, sentiment: 0.75, trend: 'stable' },
      { name: 'CrowdStrike', score: 0.82, sentiment: 0.78, trend: 'stable' },
    ],
  },
  {
    name: 'AI UI/Design',
    velocity: 0.91,
    direction: 'accelerating' as const,
    tools: [
      { name: 'v0.dev', score: 0.91, sentiment: 0.88, trend: 'up' },
      { name: 'Bolt.new', score: 0.89, sentiment: 0.85, trend: 'up' },
      { name: 'Figma AI', score: 0.84, sentiment: 0.80, trend: 'up' },
      { name: 'Framer AI', score: 0.78, sentiment: 0.76, trend: 'stable' },
    ],
  },
];

function scoreToColor(score: number): string {
  if (score >= 0.9) return '#22C55E';
  if (score >= 0.8) return '#34D399';
  if (score >= 0.7) return '#EAB308';
  if (score >= 0.6) return '#F97316';
  return '#EF4444';
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp size={12} style={{ color: 'var(--success)' }} />;
  if (trend === 'down') return <TrendingDown size={12} style={{ color: 'var(--error)' }} />;
  return <Minus size={12} style={{ color: 'var(--text-muted)' }} />;
}

/* ─────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────── */
export default function MarketPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
              <BarChart3 size={16} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 600 }}>AI Market Intelligence</h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ecosystem Heatmap &amp; Trend Analysis</p>
            </div>
          </div>
        </div>
        <span className="glow-badge accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Live Data
        </span>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        {/* Heatmap Grid */}
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>AI Ecosystem Heatmap</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Tool trust scores across categories. Hover for details. Color indicates strength.
        </p>

        {/* Heatmap Table */}
        <div className="intel-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '200px repeat(4, 1fr) 100px',
            borderBottom: '1px solid var(--border)', padding: '12px 16px',
            background: 'var(--bg-secondary)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Category</span>
            {['Tool 1', 'Tool 2', 'Tool 3', 'Tool 4'].map(h => (
              <span key={h} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>{h}</span>
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>Velocity</span>
          </div>

          {/* Data rows */}
          {CATEGORIES.map((cat, ci) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ci * 0.08 }}
              style={{
                display: 'grid', gridTemplateColumns: '200px repeat(4, 1fr) 100px',
                padding: '14px 16px', alignItems: 'center',
                borderBottom: ci < CATEGORIES.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {cat.direction === 'accelerating' && <TrendingUp size={10} style={{ color: 'var(--success)' }} />}
                  {cat.direction === 'stable' && <Minus size={10} style={{ color: 'var(--text-muted)' }} />}
                  {cat.direction}
                </div>
              </div>

              {cat.tools.map((tool) => (
                <div key={tool.name} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    className="heatmap-cell"
                    style={{
                      width: 64, height: 40, borderRadius: 'var(--radius-sm)',
                      background: `${scoreToColor(tool.score)}22`,
                      border: `1px solid ${scoreToColor(tool.score)}44`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 2,
                    }}
                    title={`${tool.name}: Trust ${(tool.score * 100).toFixed(0)}%, Sentiment ${(tool.sentiment * 100).toFixed(0)}%`}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreToColor(tool.score) }}>
                      {(tool.score * 100).toFixed(0)}
                    </span>
                    <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{tool.name}</span>
                  </div>
                </div>
              ))}

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 100,
                  background: cat.velocity >= 0.85 ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                  color: cat.velocity >= 0.85 ? 'var(--success)' : 'var(--warning)',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {(cat.velocity * 100).toFixed(0)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Category Cards */}
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Category Deep Dive</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
          {CATEGORIES.map((cat, ci) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.08 }}
              className="intel-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{cat.name}</h3>
                <span className={`glow-badge ${cat.direction === 'accelerating' ? 'success' : 'info'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                  {cat.direction}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cat.tools.map((tool, ti) => (
                  <div key={tool.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16 }}>#{ti + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{tool.name}</span>
                    <TrendIcon trend={tool.trend} />
                    <div style={{ width: 48, height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                      <div style={{ width: `${tool.score * 100}%`, height: '100%', borderRadius: 3, background: scoreToColor(tool.score) }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: scoreToColor(tool.score), width: 30, textAlign: 'right' }}>
                      {(tool.score * 100).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category Velocity</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{(cat.velocity * 100).toFixed(0)}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tools Tracked</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{cat.tools.length}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
