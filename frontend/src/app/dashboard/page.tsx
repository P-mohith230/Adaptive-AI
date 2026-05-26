'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orgAPI, recommendationAPI, alertAPI, intelligenceAPI, agentAPI, marketAPI } from '@/lib/api/client';
import {
  Brain, BarChart3, TrendingUp, Bell, DollarSign,
  MessageSquare, Network, Layers, Home, ChevronLeft,
  Activity, Shield, AlertTriangle, Target, Zap, Eye,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Minus,
  Cpu, Globe, Loader2, PieChart, Users, Settings, Gauge,
  Lightbulb, Workflow, FileText, Clock, TrendingDown,
  ChevronRight, ExternalLink, Star, Search, Sparkles
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';

/* ═══════════════════════════════════════════════════════
   SIDEBAR NAVIGATION
   ═══════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: 'overview', icon: Home, label: 'Overview' },
  { id: 'maturity', icon: Gauge, label: 'AI Maturity' },
  { id: 'market', icon: TrendingUp, label: 'Market Intel' },
  { id: 'stack', icon: Layers, label: 'AI Stack' },
  { id: 'alerts', icon: Bell, label: 'Alerts' },
  { id: 'roi', icon: DollarSign, label: 'ROI Analytics' },
  { id: 'twin', icon: Network, label: 'Digital Twin' },
  { id: 'agents', icon: Brain, label: 'Agent Pipeline' },
];

/* ═══════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════ */

function SectionHeader({ title, subtitle, icon: Icon, badge, color = 'var(--primary-light)' }: {
  title: string; subtitle: string; icon: any; badge?: string; color?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}18`, border: `1px solid ${color}33`,
        }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
      </div>
      {badge && <span className="glow-badge accent">{badge}</span>}
    </div>
  );
}

function ScoreGauge({ score, size = 130, color = 'var(--primary-light)', label }: {
  score: number; size?: number; color?: string; label?: string;
}) {
  const pct = Math.round(score * 100);
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score * circ);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x={size/2} y={size/2 - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontWeight="700">{pct}</text>
        <text x={size/2} y={size/2 + 18} textAnchor="middle" fill="var(--text-muted)" fontSize="11">/100</text>
      </svg>
      {label && <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>{label}</span>}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, trend, trendLabel, delay = 0 }: {
  label: string; value: string | number; icon: any; color: string; trend?: 'up' | 'down' | 'stable'; trendLabel?: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{
        padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 16,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`, border: `1px solid ${color}33`,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--error)' : 'var(--text-muted)' }}>
          {trend === 'up' && <ArrowUpRight size={14} />}
          {trend === 'down' && <ArrowDownRight size={14} />}
          {trend === 'stable' && <Minus size={14} />}
          {trendLabel}
        </div>
      )}
    </motion.div>
  );
}

function ProgressBar({ value, color = 'var(--primary-light)', height = 6 }: { value: number; color?: string; height?: number }) {
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: height / 2, background: color }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EDUCATIONAL AND UTILITY COMPONENTS
   ═══════════════════════════════════════════════════════ */

interface TabProps {
  orgData: any;
  dashboardData: any;
  latestRecommendation: any;
  alerts: any[];
  digitalTwin: any;
  onUpdate: (updatedFields: any) => Promise<void>;
  isUpdating: boolean;
  onRefresh: () => Promise<void>;
}

function EducationalGuidance({ title, purpose, need }: { title: string; purpose: string; need: string }) {
  return (
    <div style={{
      padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.15)',
      background: 'rgba(9, 13, 26, 0.4)', backdropFilter: 'blur(12px)',
      marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.03)'
    }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
        <Lightbulb size={15} style={{ color: 'var(--accent)' }} /> CTO Insights &bull; {title}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--primary-light)', fontWeight: 600, marginBottom: 4 }}>Why this tab is specially designed:</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{purpose}</p>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--primary-light)', fontWeight: 600, marginBottom: 4 }}>What is the need of this?</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{need}</p>
        </div>
      </div>
    </div>
  );
}

function TakeawayNote({ title, takeaway }: { title: string; takeaway: string }) {
  return (
    <div style={{
      marginTop: 24,
      padding: '14px 18px',
      borderRadius: 'var(--radius-md)',
      border: '1px dashed rgba(139, 92, 246, 0.25)',
      background: 'rgba(139, 92, 246, 0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Sparkles size={12} style={{ color: 'var(--accent)' }} /> What should you get from this?
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
        <strong style={{ color: 'var(--text-primary)' }}>{title}:</strong> {takeaway}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: OVERVIEW
   ═══════════════════════════════════════════════════════ */
function OverviewTab({ orgData, dashboardData, latestRecommendation, alerts, onUpdate, isUpdating }: TabProps) {
  const [name, setName] = useState(orgData?.organization_name || '');
  const [type, setType] = useState(orgData?.startup_type || '');
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (orgData) {
      setName(orgData.organization_name || '');
      setType(orgData.startup_type || '');
    }
  }, [orgData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setMessage('Saving...');
    try {
      await onUpdate({ organization_name: name, startup_type: type });
      setMessage('Successfully saved and recalculated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setScraping(true);
    setMessage('Scraping website and analyzing operational stack via agents...');
    try {
      const scraperService = (await import('@/lib/api/client')).orgAPI;
      // In Next.js client request
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/organizations/${orgData.organization_id}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('adaptiveai_token') ? { Authorization: `Bearer ${localStorage.getItem('adaptiveai_token')}` } : {}) },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Web extraction failed');
      setMessage('Analysis completed! Refreshing stats...');
      window.location.reload();
    } catch (err: any) {
      setMessage(`Scraper Error: ${err.message}`);
      setScraping(false);
    }
  };

  const parsedROI = latestRecommendation?.roi_estimation ? JSON.parse(latestRecommendation.roi_estimation) : null;
  const monthlySavings = parsedROI?.roi_analysis?.estimated_monthly_savings 
    ? `$${Math.round(parsedROI.roi_analysis.estimated_monthly_savings / 1000)}K` 
    : '$12.5K';

  const recCount = latestRecommendation?.recommended_tools 
    ? JSON.parse(latestRecommendation.recommended_tools).length 
    : 8;

  return (
    <div>
      <SectionHeader icon={Home} title="Operations Overview" subtitle="Your organization's AI intelligence at a glance" badge="Live" />
      
      <EducationalGuidance 
        title="Operations Command Center"
        purpose="To give you a quick, single-screen summary of your company's AI maturity, active tool match recommendations, critical stack alerts, and projected monthly cost savings."
        need="It helps founders and leaders quickly see how their business is adapting to AI and spot any critical issues or financial savings immediately without wasting hours digging through logs."
      />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="AI Maturity Score" value={`${Math.round((orgData?.ai_maturity_score || 0.52) * 100)}%`} icon={Gauge} color="var(--primary-light)" trend="up" trendLabel="+8%" delay={0} />
        <MetricCard label="Active Recommendations" value={recCount} icon={Target} color="var(--accent)" trend="up" trendLabel="+3" delay={0.05} />
        <MetricCard label="Critical Alerts" value={alerts ? alerts.filter(a => !a.is_dismissed && a.severity === 'critical').length : 2} icon={AlertTriangle} color="var(--error)" trend="down" trendLabel="-1" delay={0.1} />
        <MetricCard label="Est. Monthly Savings" value={monthlySavings} icon={DollarSign} color="var(--success)" trend="up" trendLabel="+$2K" delay={0.15} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {/* Profile Card & Recalculation Form */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} style={{ color: 'var(--primary-light)' }} /> Configure Startup Requirements
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Update your core startup settings below. Saving will automatically trigger the Multi-Agent pipeline to re-evaluate your maturity, ROI, and tool recommendations.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Startup Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Startup Vertical</label>
                <input type="text" value={type} onChange={e => setType(e.target.value)} placeholder="e.g. SaaS, Fintech, AI-native"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', alignSelf: 'flex-start', fontSize: 13, gap: 6 }}>
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
              Update & Recalculate
            </button>
          </form>

          {/* Scrape Form */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={14} style={{ color: 'var(--accent)' }} /> Autopilot: Extraction from Website
            </h4>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              Have an active landing page? Enter your URL. Our Llama crawler will scrape it, auto-detect your stack, map pain points, and re-engineer your dashboard.
            </p>
            <form onSubmit={handleScrape} style={{ display: 'flex', gap: 8 }}>
              <input type="url" placeholder="https://yourstartup.com" value={url} onChange={e => setUrl(e.target.value)} required
                style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              <button type="submit" disabled={scraping || isUpdating} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                {scraping ? <Loader2 className="animate-spin" size={14} /> : 'Scrape & Align'}
              </button>
            </form>
          </div>

          {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginTop: 8 }}>{message}</div>}
        </div>

        {/* Latest Agent Reasoning Log */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} style={{ color: 'var(--primary-light)' }} /> Live Agent Activity
          </h3>
          <div className="terminal-feed" style={{ flex: 1, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'monospace', overflowY: 'auto', maxHeight: 220 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}># Active execution logs:</div>
            {[
              { agent: 'workflow_agent', color: '#8B5CF6', msg: `Scanned workflows: '${orgData?.workflows || "Manual entry, support routing"}'` },
              { agent: 'research_agent', color: '#00E5A8', msg: `Identified ${recCount} matched software suites in master registry` },
              { agent: 'sentiment_agent', color: '#F59E0B', msg: 'Reddit/GitHub developers rating stack at 92.4% health' },
              { agent: 'roi_agent', color: '#22C55E', msg: `Projecting ${monthlySavings}/mo saved based on average hourly rates` },
              { agent: 'strategy_agent', color: '#8B5CF6', msg: 'Compiled 12-month evolution roadmap successfully' },
            ].map((line, i) => (
              <div key={i} style={{ marginBottom: 4, lineHeight: 1.4 }}>
                <span style={{ color: line.color }}>[{line.agent}]</span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{line.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TakeawayNote 
        title="Key Operational Takeaway"
        takeaway="A clear, aggregated snapshot of your startup's technical state. It solves the pain point of fragmented operations by letting you know in 3 seconds whether your maturity, security alerts, and cash savings are on track."
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: AI MATURITY
   ═══════════════════════════════════════════════════════ */
function MaturityTab({ orgData, onUpdate, isUpdating }: TabProps) {
  const [sliderVal, setSliderVal] = useState(orgData?.ai_maturity_score ? Math.round(orgData.ai_maturity_score * 10) : 5);
  const [goals, setGoals] = useState(orgData?.automation_goals || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (orgData) {
      setSliderVal(orgData.ai_maturity_score ? Math.round(orgData.ai_maturity_score * 10) : 5);
      setGoals(orgData.automation_goals || '');
    }
  }, [orgData]);

  const handleMaturitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Updating AI maturity self-assessment...');
    try {
      await onUpdate({
        ai_maturity_score: sliderVal / 10,
        automation_goals: goals
      });
      setMessage('Successfully updated self-assessment and saved to sheets!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const dimensions = [
    { name: 'Strategy & Vision', score: orgData?.ai_maturity_score || 0.65, color: '#8B5CF6', desc: 'AI vision clarity and executive alignment' },
    { name: 'Data Readiness', score: (orgData?.ai_maturity_score || 0.52) * 0.9, color: '#3B82F6', desc: 'Data infrastructure and pipeline maturity' },
    { name: 'Tool Adoption', score: (orgData?.ai_maturity_score || 0.52) * 1.3 > 1 ? 0.95 : (orgData?.ai_maturity_score || 0.52) * 1.3, color: '#00E5A8', desc: 'AI tool integration depth across teams' },
    { name: 'Team Capability', score: (orgData?.ai_maturity_score || 0.52) * 1.1 > 1 ? 0.88 : (orgData?.ai_maturity_score || 0.52) * 1.1, color: '#F59E0B', desc: 'Staff AI literacy and upskilling status' },
    { name: 'Process Automation', score: (orgData?.ai_maturity_score || 0.52) * 0.8, color: '#EF4444', desc: 'Workflow automation coverage percentage' },
  ];

  const score = orgData?.ai_maturity_score || 0.52;
  const milestones = [
    { level: 'Initial', range: '0-20', status: score <= 0.2 ? 'current' : 'done', desc: 'Ad-hoc AI usage, no organizational strategy' },
    { level: 'Exploring', range: '21-40', status: score > 0.2 && score <= 0.4 ? 'current' : score > 0.4 ? 'done' : 'future', desc: 'Piloting AI tools, building awareness' },
    { level: 'Developing', range: '41-60', status: score > 0.4 && score <= 0.6 ? 'current' : score > 0.6 ? 'done' : 'future', desc: 'Systematic AI adoption, workflow integration' },
    { level: 'Advanced', range: '61-80', status: score > 0.6 && score <= 0.8 ? 'current' : score > 0.8 ? 'done' : 'next', desc: 'AI-driven decision making, cross-team adoption' },
    { level: 'AI-Native', range: '81-100', status: score > 0.8 ? 'current' : 'future', desc: 'AI embedded in every operational layer' },
  ];

  return (
    <div>
      <SectionHeader icon={Gauge} title="AI Maturity Assessment" subtitle="Comprehensive organizational AI readiness analysis" color="var(--primary-light)" />
      
      <EducationalGuidance 
        title="AI Maturity & Vision"
        purpose="To measure how deeply and effectively your organization uses AI across key areas like Strategy, Data Readiness, Tools, Team Skills, and Automation."
        need="It shows you exactly where your team stands today and gives you a step-by-step roadmap to move from basic AI usage to a highly efficient, AI-Native startup."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, marginBottom: 24 }}>
        {/* Main Score & Edit Form */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
            <ScoreGauge score={orgData?.ai_maturity_score || 0.52} size={130} label="Current AI Maturity" />
          </div>
          <form onSubmit={handleMaturitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Self-Assessment Score: {sliderVal}/10
              </label>
              <input type="range" min="1" max="10" value={sliderVal} onChange={e => setSliderVal(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-light)', cursor: 'pointer' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Automation & Scaling Goals</label>
              <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} placeholder="Describe what processes you want automated next..."
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }} />
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Save Assessment'}
            </button>
          </form>
          {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{message}</div>}
        </div>

        {/* Dimension Breakdown */}
        <div className="intel-card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Maturity Dimensions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {dimensions.map((d, i) => (
              <div key={d.name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{Math.round(d.score * 100)}%</span>
                </div>
                <ProgressBar value={d.score * 100} color={d.color} height={8} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maturity Roadmap */}
      <div className="intel-card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Evolution Roadmap</h3>
        <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 18, left: 20, right: 20, height: 3, background: 'var(--border)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 18, left: 20, height: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent))', zIndex: 1, width: `${(orgData?.ai_maturity_score || 0.52) * 90}%` }} />

          {milestones.map((m, i) => (
            <div key={m.level} style={{ flex: 1, position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 8px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: m.status === 'done' ? 'var(--accent)' : m.status === 'current' ? 'var(--primary)' : 'var(--bg-tertiary)',
                border: m.status === 'current' ? '3px solid var(--primary-glow)' : '2px solid var(--border)',
                boxShadow: m.status === 'current' ? '0 0 16px var(--primary-glow)' : 'none',
              }}>
                {m.status === 'done' ? <CheckCircle size={16} color="white" /> :
                 m.status === 'current' ? <Zap size={16} color="white" /> :
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />}
              </div>
              <div style={{ fontSize: 13, fontWeight: m.status === 'current' ? 700 : 500, color: m.status === 'current' ? 'var(--primary-light)' : m.status === 'done' ? 'var(--accent)' : 'var(--text-muted)' }}>
                {m.level}
              </div>
            </div>
          ))}
        </div>
      </div>
      <TakeawayNote 
        title="Strategic Growth Takeaway"
        takeaway="An honest benchmark of your team's AI adoption speed. It solves the pain point of strategic directionlessness by showing you exactly which skills or data structures to uplevel next to reach a highly efficient, AI-Native scale."
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: MARKET INTELLIGENCE
   ═══════════════════════════════════════════════════════ */
function MarketTab({ orgData, onUpdate, isUpdating, onRefresh }: TabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(orgData?.startup_type || '');
  const [goals, setGoals] = useState(orgData?.automation_goals || '');
  const [message, setMessage] = useState('');

  const [trendSummary, setTrendSummary] = useState<any>(null);
  const [crawlingMarket, setCrawlingMarket] = useState(false);
  const [marketMessage, setMarketMessage] = useState('');

  const fetchTrends = async () => {
    try {
      const data = await marketAPI.getTrends();
      setTrendSummary(data);
    } catch (err) {
      console.error("Failed to fetch market trends:", err);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleMarketCrawl = async () => {
    if (!orgData?.organization_id) return;
    setCrawlingMarket(true);
    setMarketMessage('Activating news channels, GitHub momentum trackers, and Product Hunt V2 feeds...');
    try {
      await marketAPI.crawl(orgData.organization_id);
      setMarketMessage('Ecosystem market crawl complete! Loaded new signals into Google Sheet.');
      setTimeout(() => setMarketMessage(''), 4000);
      await fetchTrends();
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setMarketMessage(`Market Scan Error: ${err.message}`);
    } finally {
      setCrawlingMarket(false);
    }
  };

  useEffect(() => {
    if (orgData) {
      setType(orgData.startup_type || '');
      setGoals(orgData.automation_goals || '');
    }
  }, [orgData]);

  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      try {
        const data = await marketAPI.getTools({ limit: 8, search: searchQuery });
        setTools(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const delayDebounce = setTimeout(fetchTools, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Saving target market requirements...');
    try {
      await onUpdate({ startup_type: type, automation_goals: goals });
      setMessage('Successfully saved target market and goals to Sheets!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const liveTrendingTools = trendSummary?.trending_tools || [
    { tool_name: "Cursor", avg_sentiment: 0.92, avg_velocity: 0.95, total_mentions: 15400 },
    { tool_name: "v0.dev", avg_sentiment: 0.88, avg_velocity: 0.91, total_mentions: 8200 },
    { tool_name: "Claude", avg_sentiment: 0.90, avg_velocity: 0.87, total_mentions: 22000 },
    { tool_name: "Linear", avg_sentiment: 0.86, avg_velocity: 0.68, total_mentions: 5200 },
  ];

  return (
    <div>
      <SectionHeader icon={TrendingUp} title="AI Market Intelligence" subtitle="Real-time ecosystem monitoring and trend analysis" color="var(--accent)" badge="Live Signals" />
      
      <EducationalGuidance 
        title="Market Risk & Velocity"
        purpose="To scan public forums, developer sites, and tech registries for real-time reviews, developer sentiment, and risk levels of popular SaaS tools."
        need="It protects your company from using obsolete, buggy, or untrusted software by showing you which tools are accelerating and which are losing market trust."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {/* Tool Rankings */}
        <div className="intel-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>SaaS Ecosystem Directory</h3>
            <div style={{ position: 'relative', width: 200 }}>
              <input type="text" placeholder="Search registry..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '6px 12px 6px 28px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 12 }} />
              <Search size={12} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Tool</span>
            <span>Category</span>
            <span>Trust Score</span>
            <span>Future-Proof</span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 440 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
            ) : tools.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No tools found in registry matching query.</div>
            ) : (
              tools.map((t, i) => (
                <div key={t.tool_id || t.tool_name} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px', gap: 8, padding: '12px 20px', alignItems: 'center', borderBottom: i < tools.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.tool_name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 280 }}>{t.description || 'Modern AI assistant.'}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.category}</span>
                  <div>
                    <ProgressBar value={(t.trust_score || 0.85) * 100} color="var(--accent)" />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{Math.round((t.trust_score || 0.85) * 100)}%</span>
                  </div>
                  <span className="glow-badge success" style={{ fontSize: 10, padding: '2px 6px', textAlign: 'center' }}>
                    {Math.round((t.future_proof_score || 0.8) * 100)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Velocities & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="intel-card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Ecosystem Trend Velocities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {liveTrendingTools.map((t: any, i: number) => {
                const velocityPct = Math.round((t.avg_velocity || 0.85) * 100);
                const sentimentPct = Math.round((t.avg_sentiment || 0.8) * 100);
                const colors = ['var(--primary-light)', 'var(--accent)', 'var(--info)', 'var(--warning)'];
                const color = colors[i % colors.length];
                return (
                  <div key={t.tool_name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{t.tool_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="glow-badge info" style={{ fontSize: 9, padding: '2px 6px' }}>{t.total_mentions ? t.total_mentions.toLocaleString() : '12,400'} mentions</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{velocityPct}%</span>
                      </div>
                    </div>
                    <ProgressBar value={velocityPct} color={color} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>Community Sentiment: {sentimentPct}% positive</span>
                      <span>Risk Profile: {velocityPct > 85 ? 'Highly Growth' : 'Stable'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Configure Target Market
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Specify your target industry type and automation desires. Our models will recalculate the tool velocities based on these constraints.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Startup Vertical / Target Market</label>
                <input type="text" value={type} onChange={e => setType(e.target.value)} placeholder="e.g. Fintech, SaaS, Healthtech" required
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Key Automation Focus</label>
                <input type="text" value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g. Lead scoring, automated content" required
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
              <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Save Market Profile'}
              </button>
            </form>
            {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{message}</div>}

            {/* Live Market Signals Scraper button */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={14} style={{ color: 'var(--accent)' }} /> Live Ecosystem Signals Crawler
              </h4>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Query developer communities, GitHub repositories, and tech launches to extract fresh sentiment and interest momentum indices.
              </p>
              <button 
                type="button" 
                onClick={handleMarketCrawl} 
                disabled={crawlingMarket || isUpdating} 
                className="btn-secondary" 
                style={{ width: '100%', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {crawlingMarket ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} style={{ color: 'var(--accent)' }} />}
                {crawlingMarket ? 'Crawling Ecosystem Signals...' : 'Check Live Market Sentiment & Trends'}
              </button>
              {marketMessage && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginTop: 8 }}>{marketMessage}</div>}

              {/* Connected Sentiment APIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                {[
                  { name: 'GitHub Search', desc: 'Category star metrics', icon: Star, color: '#333' },
                  { name: 'News API Scrape', desc: 'SaaS announcement feeds', icon: Globe, color: '#3B82F6' },
                  { name: 'Product Hunt V2', desc: 'Featured upvotes indices', icon: Zap, color: '#DA552F' },
                  { name: 'Groq Llama 3.3', desc: 'Sentiment & Trend Engine', icon: Brain, color: '#8B5CF6' }
                ].map((src) => (
                  <div key={src.name} style={{
                    padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
                      <src.icon size={12} style={{ color: src.color }} />
                      {src.name}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A8', marginLeft: 'auto', display: 'inline-block' }} />
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{src.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <TakeawayNote 
        title="Market Risk Takeaway"
        takeaway="A live feed tracking which softwares are trustworthy. It solves the pain point of wasting time on buggy or unreliable tools by revealing community reviews, developer adoption rates, and market velocities instantly."
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: AI STACK
   ═══════════════════════════════════════════════════════ */
function StackTab({ orgData, latestRecommendation, onUpdate, isUpdating, onRefresh }: TabProps) {
  const [toolsInput, setToolsInput] = useState(orgData?.current_ai_tools || '');
  const [workflows, setWorkflows] = useState(orgData?.workflows || '');
  const [message, setMessage] = useState('');
  const [scanningTech, setScanningTech] = useState(false);
  const [liveDiscoveryMessage, setLiveDiscoveryMessage] = useState('');

  useEffect(() => {
    if (orgData) {
      setToolsInput(orgData.current_ai_tools || '');
      setWorkflows(orgData.workflows || '');
    }
  }, [orgData]);

  const handleStackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Saving active tech stack and triggering strategy re-evaluation...');
    try {
      await onUpdate({
        current_ai_tools: toolsInput,
        workflows: workflows
      });
      setMessage('Successfully saved! Multi-agent pipeline re-analyzing in background...');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleLiveStackOptimize = async () => {
    if (!orgData?.organization_id) return;
    setScanningTech(true);
    setLiveDiscoveryMessage('Activating parallel live API integrations & Groq model bagger...');
    try {
      await recommendationAPI.generate(orgData.organization_id);
      setLiveDiscoveryMessage('Live discovery complete! New optimized tools stack recommendation saved in Sheet.');
      setTimeout(() => setLiveDiscoveryMessage(''), 4000);
      await onRefresh();
    } catch (err: any) {
      setLiveDiscoveryMessage(`Live Discovery Error: ${err.message}`);
    } finally {
      setScanningTech(false);
    }
  };

  const recommendedTools = latestRecommendation?.recommended_tools 
    ? JSON.parse(latestRecommendation.recommended_tools) 
    : [
        { name: 'Cursor', category: 'Development', match_score: 0.94, reason: 'AI-native code editor with strong workflow integration', pricing: '$20/mo', trust: 0.94, color: '#8B5CF6' },
        { name: 'Notion AI', category: 'Knowledge Mgmt', match_score: 0.89, reason: 'Unified workspace with AI-powered organization', pricing: '$10/mo', trust: 0.89, color: '#00E5A8' },
        { name: 'Zapier', category: 'Automation', match_score: 0.86, reason: 'No-code workflow automation across 5000+ apps', pricing: '$30/mo', trust: 0.86, color: '#3B82F6' },
      ];

  const compatibility = latestRecommendation?.compatibility_score 
    ? Math.round(latestRecommendation.compatibility_score * 100) 
    : 91;

  return (
    <div>
      <SectionHeader icon={Layers} title="AI Stack Recommendation" subtitle="Optimized tool stack based on your organization's workflows and goals" color="var(--info)" badge="Dynamic Matched" />
      
      <EducationalGuidance 
        title="Custom Architecture Stack"
        purpose="To analyze your custom workflows and recommend a tailor-made software stack that matches your business needs and budget perfectly."
        need="It stops your business from wasting money on overlapping software subscriptions and suggests the highest-matching tools to automate your specific tasks."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {/* Tool Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recommendedTools.map((tool: any, i: number) => {
            const color = tool.color || '#3B82F6';
            return (
              <motion.div key={tool.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="intel-card" style={{ display: 'flex', gap: 14 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color,
                  background: `${color}15`, border: `1px solid ${color}33`,
                }}>
                  {tool.match_score ? Math.round(tool.match_score * 100) : 90}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{tool.name}</h4>
                    <span className="glow-badge accent" style={{ fontSize: 9, padding: '1px 6px' }}>{tool.match_score ? Math.round(tool.match_score * 100) : 90}% match</span>
                  </div>
                  <div style={{ fontSize: 11, color, marginBottom: 4 }}>{tool.category} &bull; {tool.pricing || 'Free tier available'}</div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{tool.reason}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Recalculation Form */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} style={{ color: 'var(--info)' }} /> Adjust Current Stack
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            List your current software below. We will scan our SaaS catalog to replace underperforming legacy platforms.
          </p>
          <form onSubmit={handleStackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Current Tools Used (comma-separated)</label>
              <input type="text" value={toolsInput} onChange={e => setToolsInput(e.target.value)} placeholder="Slack, Legacy CRM, Jira"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Core Internal Workflows</label>
              <textarea value={workflows} onChange={e => setWorkflows(e.target.value)} rows={3} placeholder="Support routing, continuous deployment pipeline"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }} />
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Optimize Stack'}
            </button>
          </form>
          {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{message}</div>}

          {/* Live Discovery & Optimization section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={14} style={{ color: 'var(--accent)' }} /> Live Tech Discovery & Optimization
            </h4>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              Query live API endpoints to harvest trending tech directly from developers, journals, and releases.
            </p>
            <button 
              type="button" 
              onClick={handleLiveStackOptimize} 
              disabled={scanningTech || isUpdating} 
              className="btn-secondary" 
              style={{ width: '100%', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {scanningTech ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} style={{ color: 'var(--accent)' }} />}
              {scanningTech ? 'Scanning Live Tech Channels...' : 'Check Live Tools & Optimize Stack'}
            </button>
            {liveDiscoveryMessage && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginTop: 8 }}>{liveDiscoveryMessage}</div>}

            {/* Visual API Source Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              {[
                { name: 'GitHub Repos', desc: 'Star count & growth', icon: Star, color: '#333' },
                { name: 'News API SaaS', desc: 'Ecosystem announcements', icon: Globe, color: '#3B82F6' },
                { name: 'Product Hunt V2', desc: 'Featured tech launches', icon: Zap, color: '#DA552F' },
                { name: 'Groq Bagger AI', desc: 'Llama 4, Llama 3.3, Compound', icon: Brain, color: '#8B5CF6' }
              ].map((src) => (
                <div key={src.name} style={{
                  padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
                    <src.icon size={12} style={{ color: src.color }} />
                    {src.name}
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A8', marginLeft: 'auto', display: 'inline-block' }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{src.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TakeawayNote 
        title="SaaS Architecture Takeaway"
        takeaway="A targeted, high-compatibility tool stack matching your actual workflows. It solves the pain point of SaaS budget waste and redundant subscription costs by selecting only high-value, fully compatible AI integrations."
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: ALERTS
   ═══════════════════════════════════════════════════════ */
function AlertsTab({ orgData, alerts, onRefresh, onUpdate, isUpdating }: TabProps) {
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [toolsInput, setToolsInput] = useState(orgData?.current_ai_tools || '');
  const [workflows, setWorkflows] = useState(orgData?.workflows || '');
  const [alertMessage, setAlertMessage] = useState('');
  const [scanningNews, setScanningNews] = useState(false);

  const handleNewsCheck = async () => {
    if (!orgData?.organization_id) return;
    setScanningNews(true);
    setAlertMessage('Activating News API and crawling live vulnerability signals...');
    try {
      await alertAPI.newsCheck(orgData.organization_id);
      setAlertMessage('Ecosystem threat scan complete! New custom alerts saved and loaded.');
      setTimeout(() => setAlertMessage(''), 4000);
      await onRefresh();
    } catch (err: any) {
      setAlertMessage(`Threat Scan Error: ${err.message}`);
    } finally {
      setScanningNews(false);
    }
  };

  useEffect(() => {
    if (orgData) {
      setToolsInput(orgData.current_ai_tools || '');
      setWorkflows(orgData.workflows || '');
    }
  }, [orgData]);

  const handleDismiss = async (alertId: string) => {
    try {
      await alertAPI.dismiss(alertId);
      setMessage('Alert dismissed successfully.');
      setTimeout(() => setMessage(''), 3000);
      await onRefresh();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAlertsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage('Updating stack tools to scan for alerts...');
    try {
      await onUpdate({
        current_ai_tools: toolsInput,
        workflows: workflows
      });
      setAlertMessage('Tools saved! Re-calculating alert triggers in Sheet...');
      setTimeout(() => setAlertMessage(''), 3000);
    } catch (err: any) {
      setAlertMessage(`Error: ${err.message}`);
    }
  };

  const severityColor: Record<string, string> = { critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' };
  const severityIcon: Record<string, any> = { critical: XCircle, high: AlertTriangle, medium: Lightbulb, low: Activity };

  const displayedAlerts = alerts || [];
  const activeAlerts = displayedAlerts.filter(a => !a.is_dismissed);
  const filteredAlerts = filter === 'all' ? displayedAlerts : displayedAlerts.filter(a => a.severity === filter);

  return (
    <div>
      <SectionHeader icon={Bell} title="Alert Center" subtitle="AI ecosystem alerts, obsolescence warnings, and opportunity signals" color="var(--warning)" badge={`${activeAlerts.length} Active`} />
      
      <EducationalGuidance 
        title="Automated Stack Monitoring"
        purpose="To warn you instantly about critical vulnerabilities, deprecations, price hikes, or safety concerns in the AI tools you currently use."
        need="It helps you stay secure and cost-efficient by automatically suggesting safe, modern replacement tools the second a software becomes high-risk."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Critical', count: displayedAlerts.filter(a => a.severity === 'critical' && !a.is_dismissed).length, color: 'var(--critical)', icon: XCircle },
          { label: 'High', count: displayedAlerts.filter(a => a.severity === 'high' && !a.is_dismissed).length, color: 'var(--high)', icon: AlertTriangle },
          { label: 'Medium', count: displayedAlerts.filter(a => a.severity === 'medium' && !a.is_dismissed).length, color: 'var(--medium)', icon: Lightbulb },
          { label: 'Low', count: displayedAlerts.filter(a => a.severity === 'low' && !a.is_dismissed).length, color: 'var(--low)', icon: Activity },
        ].map((s, i) => (
          <button key={s.label} onClick={() => setFilter(filter === s.label.toLowerCase() ? 'all' : s.label.toLowerCase())}
            style={{
              padding: 12, borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              border: `1px solid ${filter === s.label.toLowerCase() ? s.color : 'var(--border)'}`,
              background: filter === s.label.toLowerCase() ? `${s.color}12` : 'var(--bg-card)',
              textAlign: 'left', transition: 'all 0.2s',
            }}
          >
            <s.icon size={16} style={{ color: s.color, marginBottom: 4 }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {/* Left Pane: Alert List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredAlerts.length === 0 ? (
            <div className="intel-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              No alerts found in active worksheet. Your stack is fully optimized!
            </div>
          ) : (
            filteredAlerts.map(a => {
              const SevIcon = severityIcon[a.severity] || Activity;
              return (
                <div key={a.alert_id} className="intel-card" style={{ display: 'flex', gap: 16, opacity: a.is_dismissed ? 0.45 : 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${severityColor[a.severity]}18`, border: `1px solid ${severityColor[a.severity]}33`,
                  }}>
                    <SevIcon size={18} style={{ color: severityColor[a.severity] }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`glow-badge ${a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'warning' : 'info'}`} style={{ fontSize: 9, padding: '2px 8px' }}>
                        {a.severity}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.alert_type}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Active'}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0 0 0' }}>{a.alert_message}</p>
                    {a.replacement_tool && (
                      <p style={{ fontSize: 12, color: 'var(--accent)', margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ChevronRight size={12} /> Recommended Replacement: {a.replacement_tool}
                      </p>
                    )}
                    {!a.is_dismissed && (
                      <button onClick={() => handleDismiss(a.alert_id)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, marginTop: 8 }}>
                        Dismiss Warning
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Pane: Stack Security Monitor Config */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'fit-content' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} style={{ color: 'var(--warning)' }} /> Monitor Stack Tools
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            List the software products you use. If they have safety, support, or pricing alerts in our registry, they will display on the left automatically.
          </p>
          <form onSubmit={handleAlertsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Active AI & SaaS Tools (comma-separated)</label>
              <input type="text" value={toolsInput} onChange={e => setToolsInput(e.target.value)} placeholder="Slack, OpenAI, Cursor, Legacy CRM" required
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Target Workflows to Protect</label>
              <textarea value={workflows} onChange={e => setWorkflows(e.target.value)} rows={3} placeholder="Customer communication channels, daily developer routines" required
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }} />
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Save Security Profile'}
            </button>
          </form>
          {alertMessage && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginTop: 8 }}>{alertMessage}</div>}

          {/* Live News Intelligence scan button */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={14} style={{ color: 'var(--accent)' }} /> Live Threat Intelligence Scan
            </h4>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              Scan live news articles, tech journals, and vulnerability reports for competitor updates, software breaches, or compliance alerts tailored to your vertical.
            </p>
            <button 
              type="button" 
              onClick={handleNewsCheck} 
              disabled={scanningNews || isUpdating} 
              className="btn-secondary" 
              style={{ width: '100%', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {scanningNews ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
              {scanningNews ? 'Scanning Tech Signals...' : 'Check Live News & Updates'}
            </button>
          </div>
        </div>
      </div>
      <TakeawayNote 
        title="Stack Security Takeaway"
        takeaway="Instant warnings when tools in your active stack are depreciating or inflating in price. It solves the pain point of unexpected security risks and licensing price hikes by automatically recommending safe, drop-in replacement options."
      />
      {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginTop: 12 }}>{message}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: ROI ANALYTICS
   ═══════════════════════════════════════════════════════ */
function ROITab({ orgData, latestRecommendation, onUpdate, isUpdating }: TabProps) {
  const [teamSize, setTeamSize] = useState(orgData?.team_size || 5);
  const [hours, setHours] = useState(orgData?.monthly_manual_hours || 40);
  const [rate, setRate] = useState(orgData?.employee_hourly_rate || 50);
  const [budget, setBudget] = useState(orgData?.annual_ai_budget || 5000);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (orgData) {
      setTeamSize(orgData.team_size || 5);
      setHours(orgData.monthly_manual_hours || 40);
      setRate(orgData.employee_hourly_rate || 50);
      setBudget(orgData.annual_ai_budget || 5000);
    }
  }, [orgData]);

  const handleROISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Submitting stats and invoking ROI Agent multi-agent computation...');
    try {
      await onUpdate({
        team_size: teamSize,
        monthly_manual_hours: hours,
        employee_hourly_rate: rate,
        annual_ai_budget: budget
      });
      setMessage('Successfully saved stats! Multi-agent calculating exact ROI returns...');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const parsedROI = latestRecommendation?.roi_estimation ? JSON.parse(latestRecommendation.roi_estimation) : null;
  const analysis = parsedROI?.roi_analysis || {
    estimated_monthly_savings: 12500,
    productivity_gain_percent: 35,
    payback_period_months: 2.5,
    annual_roi_percent: 340,
    cost_breakdown: { tool_subscriptions: 2800, implementation_cost: 5000, training_cost: 1500 },
    savings_breakdown: { time_saved_hours_monthly: 280, reduced_manual_errors: 8500, faster_delivery: 4000 }
  };

  const monthlyBars = [
    { month: 'Jan', saved: Math.round(analysis.savings_breakdown?.time_saved_hours_monthly * 0.45) || 40 },
    { month: 'Mar', saved: Math.round(analysis.savings_breakdown?.time_saved_hours_monthly * 0.7) || 70 },
    { month: 'May', saved: Math.round(analysis.savings_breakdown?.time_saved_hours_monthly * 0.9) || 110 },
    { month: 'Jul', saved: Math.round(analysis.savings_breakdown?.time_saved_hours_monthly * 1.1) || 160 },
    { month: 'Sep', saved: Math.round(analysis.savings_breakdown?.time_saved_hours_monthly * 1.25) || 210 },
    { month: 'Nov', saved: Math.round(analysis.savings_breakdown?.time_saved_hours_monthly * 1.35) || 260 },
  ];

  return (
    <div>
      <SectionHeader icon={DollarSign} title="ROI Analytics" subtitle="Business value estimation and productivity impact analysis" color="var(--success)" />
      
      <EducationalGuidance 
        title="AI Financial Valuation"
        purpose="To calculate how much money and time you save by replacing manual, repetitive tasks with automated AI workflows."
        need="It gives you concrete, dollar-based proof of your software savings and payback milestones, making it easy to justify tech budgets to investors and financial directors."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Monthly Savings" value={`$${Math.round(analysis.estimated_monthly_savings || 12500).toLocaleString()}`} icon={DollarSign} color="var(--success)" trend="up" trendLabel="+$2K" />
        <MetricCard label="Annual ROI" value={`${analysis.annual_roi_percent || 340}%`} icon={TrendingUp} color="var(--accent)" trend="up" trendLabel="+45%" delay={0.05} />
        <MetricCard label="Productivity Gain" value={`+${analysis.productivity_gain_percent || 35}%`} icon={Zap} color="var(--primary-light)" trend="up" trendLabel="+8%" delay={0.1} />
        <MetricCard label="Payback Period" value={`${analysis.payback_period_months || 2.5} mo`} icon={Clock} color="var(--info)" delay={0.15} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, marginBottom: 24 }}>
        {/* Core ROI Config Form */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={16} style={{ color: 'var(--success)' }} /> Input Company Statistics
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Enter your exact operational constraints. Submitting will save fields to Excel/Sheets and re-invoke the ROI Agent to analyze your exact dollar returns.
          </p>
          <form onSubmit={handleROISubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Team Size (active users)</label>
                <input type="number" min="1" value={teamSize} onChange={e => setTeamSize(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Avg Monthly Manual Hours / User</label>
                <input type="number" min="0" value={hours} onChange={e => setHours(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Avg Hourly Rate ($/hr)</label>
                <input type="number" min="0" value={rate} onChange={e => setRate(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Annual AI Tools Budget ($)</label>
                <input type="number" min="0" value={budget} onChange={e => setBudget(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, gap: 4 }}>
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <DollarSign size={14} />}
              Compute ROI & Save to Sheets
            </button>
          </form>
          {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{message}</div>}
        </div>

        {/* Cost vs Savings Breakdown */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Projected Hours Saved (Monthly)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, padding: '0 4px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            {monthlyBars.map((b, i) => {
              const maxVal = Math.max(...monthlyBars.map(bar => bar.saved)) || 280;
              const pct = (b.saved / maxVal) * 90;
              return (
                <div key={b.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{b.saved}h</span>
                  <div style={{ width: '100%', height: `${pct}%`, borderRadius: '3px 3px 0 0', background: 'linear-gradient(to top, var(--primary), var(--accent))', minHeight: 4 }} />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{b.month}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,229,168,0.04)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,229,168,0.1)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Calculated Monthly Time Savings:</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{analysis.savings_breakdown?.time_saved_hours_monthly || 280} hours</span>
          </div>
        </div>
      </div>
      <TakeawayNote 
        title="Financial Return Takeaway"
        takeaway="A real-time calculation of your team's return on investment. It solves the pain point of justifying tech budgets to stakeholders by translating staff hours saved directly into concrete monthly and annual dollar savings."
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: DIGITAL TWIN
   ═══════════════════════════════════════════════════════ */
function TwinTab({ orgData, digitalTwin, onUpdate, isUpdating }: TabProps) {
  const [painPoints, setPainPoints] = useState(orgData?.pain_points || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (orgData) {
      setPainPoints(orgData.pain_points || '');
    }
  }, [orgData]);

  const handleTwinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Committing custom pain points and re-generating digital twin workflow bottlenecks...');
    try {
      await onUpdate({
        pain_points: painPoints
      });
      setMessage('Successfully saved! Re-modeling twin structure in Sheets...');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const parsedBottlenecks = digitalTwin?.bottlenecks ? JSON.parse(digitalTwin.bottlenecks) : [
    { area: 'Code Review delays', severity: 'high', department: 'Engineering' },
    { area: 'Content Creation bottleneck', severity: 'medium', department: 'Marketing' }
  ];

  const departments = [
    { name: 'Engineering', aiAdoption: 0.72, bottlenecks: ['Code review delays', 'Test automation gaps'], tools: 4, icon: Cpu, color: '#8B5CF6' },
    { name: 'Marketing', aiAdoption: 0.45, bottlenecks: ['Content creation speed', 'Campaign analytics'], tools: 2, icon: Globe, color: '#3B82F6' },
    { name: 'Sales', aiAdoption: 0.38, bottlenecks: ['Lead qualification', 'CRM data entry'], tools: 1, icon: Users, color: '#F59E0B' },
    { name: 'Support', aiAdoption: 0.55, bottlenecks: ['Response time', 'Knowledge base gaps'], tools: 3, icon: MessageSquare, color: '#22C55E' },
  ];

  return (
    <div>
      <SectionHeader icon={Network} title="Organizational Digital Twin" subtitle="Virtual intelligence model of your AI infrastructure" color="var(--info)" />
      
      <EducationalGuidance 
        title="Virtual Workflow Modeling"
        purpose="To build a virtual model of your company departments (Engineering, Marketing, Sales, Support) and map out how work flows between them."
        need="It visually points out where work is getting stuck (bottlenecks) and predicts how much more efficient each team will become if they adopt recommended AI tools."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Overall AI Adoption" value="52%" icon={Gauge} color="var(--primary-light)" />
        <MetricCard label="Optimization Potential" value="78%" icon={TrendingUp} color="var(--accent)" delay={0.05} />
        <MetricCard label="Active Bottlenecks" value={parsedBottlenecks.length} icon={AlertTriangle} color="var(--warning)" delay={0.1} />
        <MetricCard label="Predicted Efficiency" value="+42%" icon={Zap} color="var(--success)" delay={0.15} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {/* Department Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {departments.map((dept, i) => (
            <div key={dept.name} className="intel-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${dept.color}18`, border: `1px solid ${dept.color}33`,
                }}>
                  <dept.icon size={16} style={{ color: dept.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{dept.name}</h4>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dept.tools} tools</span>
                </div>
              </div>
              <ProgressBar value={dept.aiAdoption * 100} color={dept.color} height={6} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>Adoption</span>
                <span>{Math.round(dept.aiAdoption * 100)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Adjust Pain Points Form */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Map Operational Bottlenecks
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            List your operational bottlenecks (comma-separated). Submitting maps them directly to your Digital Twin model.
          </p>
          <form onSubmit={handleTwinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Workflow Friction & Pain Points</label>
              <textarea value={painPoints} onChange={e => setPainPoints(e.target.value)} rows={3} placeholder="Lead scoring delays, customer response lags, code review pipelines"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }} />
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Re-Model Digital Twin'}
            </button>
          </form>
          {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{message}</div>}
        </div>
      </div>
      <TakeawayNote 
        title="Workflow Friction Takeaway"
        takeaway="A virtual visualization of your company's operational departments. It solves the pain point of workflow blockages by mapping exactly where bottlenecks occur and showing you which teams are lagging in AI adoption."
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: AGENT PIPELINE
   ═══════════════════════════════════════════════════════ */
function AgentTab({ orgData, onRefresh, onUpdate, isUpdating }: TabProps) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [painPoints, setPainPoints] = useState(orgData?.pain_points || '');
  const [goals, setGoals] = useState(orgData?.automation_goals || '');
  const [agentFormMessage, setAgentFormMessage] = useState('');

  useEffect(() => {
    if (orgData) {
      setPainPoints(orgData.pain_points || '');
      setGoals(orgData.automation_goals || '');
    }
  }, [orgData]);

  const triggerAnalysis = async () => {
    setRunning(true);
    setMessage('Invoking uvicorn REST controller API to run 6-agent cooperative pipeline...');
    try {
      await agentAPI.fullAnalysis(orgData.organization_id);
      setMessage('Analysis finished successfully! Retrieving fresh recommendations...');
      await onRefresh();
      setMessage('System dashboard fully updated with live agent outcomes!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleAgentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentFormMessage('Saving operational goals to guide agent reasoning...');
    try {
      await onUpdate({
        pain_points: painPoints,
        automation_goals: goals
      });
      setAgentFormMessage('Goal criteria saved to Sheets! Run agent pipeline to re-calculate.');
      setTimeout(() => setAgentFormMessage(''), 3000);
    } catch (err: any) {
      setAgentFormMessage(`Error: ${err.message}`);
    }
  };

  const agents = [
    { id: 'orchestrator', name: 'Orchestrator', icon: Cpu, color: '#8B5CF6', description: 'Routes queries, decomposes tasks, manages execution phases' },
    { id: 'workflow', name: 'Workflow Agent', icon: Activity, color: '#00E5A8', description: 'Analyzes workflows, identifies bottlenecks, maps automation' },
    { id: 'research', name: 'Research Agent', icon: Eye, color: '#3B82F6', description: 'Searches AI tool catalog, evaluates compatibility scores' },
    { id: 'sentiment', name: 'Sentiment Agent', icon: BarChart3, color: '#F59E0B', description: 'Analyzes community sentiment from Reddit, GitHub, PH' },
    { id: 'trend', name: 'Trend Agent', icon: TrendingUp, color: '#22C55E', description: 'Monitors ecosystem velocity, predicts market movements' },
    { id: 'roi', name: 'ROI Agent', icon: Globe, color: '#EF4444', description: 'Calculates ROI, estimates savings, models payback period' },
  ];

  return (
    <div>
      <SectionHeader icon={Brain} title="Agent Pipeline Monitor" subtitle="Multi-agent reasoning system status and activity" color="var(--primary-light)" badge="6 Collaborative" />
      
      <EducationalGuidance 
        title="Multi-Agent Pipeline"
        purpose="To monitor the six specialized backend AI agents (Workflow, Research, Sentiment, Trend, ROI, and Strategy) working together in real time."
        need="It provides full transparency, showing you exactly how the AI agents arrived at their conclusions, what data they scanned, and why they recommend certain paths."
      />

      {/* Recalculate CTA */}
      <div className="intel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 24, background: 'rgba(139,92,246,0.03)' }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px 0' }}>Trigger Manual Cooperative Analysis</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Re-run the entire pipeline to re-scrape SaaS directories, re-compute budget saving matrices, and update sheets.
          </p>
        </div>
        <button onClick={triggerAnalysis} disabled={running} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13, gap: 6, flexShrink: 0 }}>
          {running ? <Loader2 className="animate-spin" size={14} /> : <Brain size={14} />}
          {running ? 'Agents Running...' : 'Execute Cooperative Core'}
        </button>
      </div>

      {message && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginBottom: 20 }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 16, marginBottom: 24 }}>
        {/* Left Pane: Agent Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, height: 'fit-content' }}>
          {agents.map((agent) => (
            <div key={agent.id} style={{ padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <agent.icon size={18} style={{ color: agent.color }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</span>
                <span className="glow-badge success" style={{ fontSize: 9, padding: '2px 8px', marginLeft: 'auto' }}>Active</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{agent.description}</p>
            </div>
          ))}
        </div>

        {/* Right Pane: Agent Target Configuration Form */}
        <div className="intel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'fit-content' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} style={{ color: 'var(--primary-light)' }} /> Configure Agent Focus
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Guide the agents' multi-model bagger core by defining your primary workflows constraints and operational pain points.
          </p>
          <form onSubmit={handleAgentFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Operational Pain Points</label>
              <textarea value={painPoints} onChange={e => setPainPoints(e.target.value)} rows={3} placeholder="e.g. Content creation lag, manual ticket sorting" required
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Primary Automation Goals</label>
              <input type="text" value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g. Reduce support time by 50%" required
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Save Agent Criteria'}
            </button>
          </form>
          {agentFormMessage && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{agentFormMessage}</div>}
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Link href="/agents" className="btn-secondary" style={{ padding: '10px 24px', fontSize: 13 }}>
          Open Full Agent Pipeline <ExternalLink size={14} />
        </Link>
      </div>
      <TakeawayNote 
        title="Agentic Transparency Takeaway"
        takeaway="A real-time overview of the cooperative AI agents driving your platform. It solves the pain point of 'black-box' AI systems by providing complete visibility and step-by-step reasoning traceability for every recommendation."
      />
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD SHELL
   ═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, organizationId } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [orgData, setOrgData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [latestRecommendation, setLatestRecommendation] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [digitalTwin, setDigitalTwin] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDashboardData = async () => {
    if (!organizationId) return;
    try {
      const [org, dash, rec, alts, twin] = await Promise.all([
        orgAPI.get(organizationId),
        orgAPI.getDashboard(organizationId),
        recommendationAPI.getLatest(organizationId),
        alertAPI.getAll(organizationId),
        intelligenceAPI.getDigitalTwin(organizationId).catch(() => null)
      ]);
      setOrgData(org);
      setDashboardData(dash);
      setLatestRecommendation(rec?.recommendation || rec);
      setAlerts(alts || []);
      setDigitalTwin(twin);
    } catch (err) {
      console.error("Failed to fetch dashboard intelligence:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [organizationId]);

  const handleUpdate = async (updatedFields: any) => {
    if (!organizationId) return;
    setIsUpdating(true);
    try {
      await orgAPI.update(organizationId, updatedFields);
      // Wait slightly for backend background cooperative agent recalculation
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to update startup constraints:", err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const TAB_COMPONENTS: Record<string, any> = {
    overview: OverviewTab,
    maturity: MaturityTab,
    market: MarketTab,
    stack: StackTab,
    alerts: AlertsTab,
    roi: ROITab,
    twin: TwinTab,
    agents: AgentTab,
  };

  const ActiveTabComponent = TAB_COMPONENTS[activeTab] || OverviewTab;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
              <Brain size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>AdaptiveAI</span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/consultant" className="sidebar-link">
            <MessageSquare size={18} /><span>AI Consultant</span>
          </Link>
          <Link href="/" className="sidebar-link">
            <ChevronLeft size={18} /><span>Back to Home</span>
          </Link>
          <button onClick={() => { logout(); router.push('/login'); }} className="sidebar-link" style={{ color: 'var(--error)' }}>
            <XCircle size={18} /><span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
              {orgData ? `${orgData.organization_name} — Intelligence` : 'Intelligence Dashboard'}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {user ? `Logged in as ${user.name} (${user.role})` : 'Organizational AI Operations Center'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="glow-badge accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              Live Intelligence
            </span>
            <Link href="/consultant" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
              <MessageSquare size={14} /> AI Consultant
            </Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <ActiveTabComponent
              orgData={orgData}
              dashboardData={dashboardData}
              latestRecommendation={latestRecommendation}
              alerts={alerts}
              digitalTwin={digitalTwin}
              onUpdate={handleUpdate}
              isUpdating={isUpdating}
              onRefresh={fetchDashboardData}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
