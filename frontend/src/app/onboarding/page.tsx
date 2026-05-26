'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Workflow, Wrench, AlertTriangle, Target,
  BarChart3, ArrowRight, ArrowLeft, Brain, Check, Loader2,
  Globe, Sparkles, Terminal, ShieldCheck, PlayCircle, AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';

const MANUAL_STEPS = [
  { icon: Building2, title: 'Organization Details', subtitle: 'Tell us about your company' },
  { icon: Workflow, title: 'Workflow Analysis', subtitle: 'Map your key processes' },
  { icon: Wrench, title: 'Current AI Tools', subtitle: 'What AI do you use today?' },
  { icon: AlertTriangle, title: 'Pain Points', subtitle: 'Where does it hurt?' },
  { icon: Target, title: 'Operational Goals', subtitle: 'What do you want to achieve?' },
  { icon: BarChart3, title: 'AI Maturity', subtitle: 'Self-assessment' },
];

const AUTOPILOT_STATUS_LOGS = [
  { time: 0, text: '🛰️ [crawler]: Initiating DNS crawl handshake on domain...' },
  { time: 1.5, text: '🧬 [crawler]: Downloading HTML source & stripping scripts/CSS...' },
  { time: 3.0, text: '🧠 [agent_orchestrator]: Aligning semantic page content with AI Pipeline...' },
  { time: 4.5, text: '🤖 [workflow_agent]: Extracting department workflow bottlenecks...' },
  { time: 6.0, text: '📊 [research_agent]: Matching operational structure with 150+ AI catalog...' },
  { time: 7.5, text: '📋 [roi_agent]: Synthesizing financial and payback metrics...' },
  { time: 9.0, text: '💾 [sheets_database]: Opening editors session for USERS_MASTER & ORGANIZATIONS_MASTER...' },
  { time: 10.5, text: '☁️ [sheets_database]: Wording batch cell update transactions...' },
  { time: 12.0, text: '✅ [sys_status]: Sync complete! Provisioning dashboard views...' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setOrganization, organizationId, token } = useAppStore();

  // Mode: selection between manual vs autopilot
  const [onboardingMode, setOnboardingMode] = useState<'select' | 'manual' | 'autopilot'>('select');

  // Autopilot States
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [autopilotStep, setAutopilotStep] = useState<'input' | 'scanning' | 'success' | 'error'>('input');
  const [scanProgress, setScanProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [autopilotError, setAutopilotError] = useState<string | null>(null);

  // Manual States
  const [manualStep, setManualStep] = useState(0);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualData, setManualData] = useState({
    organization_name: '',
    startup_type: 'SaaS',
    team_size: 15,
    departments: '',
    workflows: '',
    current_ai_tools: '',
    pain_points: '',
    automation_goals: '',
    ai_maturity_self_score: 5,
  });

  // Pre-fill organization details from user's active startup registered in sign-up
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (organizationId) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}`);
          if (res.ok) {
            const org = await res.json();
            setManualData(d => ({
              ...d,
              organization_name: org.organization_name || '',
              startup_type: org.startup_type || 'SaaS',
              team_size: org.team_size || 15,
            }));
            if (org.organization_name) {
              setWebsiteUrl(org.startup_website || '');
            }
          }
        } catch (err) {
          console.error('Failed to prefill organization:', err);
        }
      }
    };
    fetchOrgDetails();
  }, [organizationId]);

  const updateManualField = (field: string, value: any) => setManualData(d => ({ ...d, [field]: value }));

  // ── AUTOPILOT AI WEB SCRAPING ONBOARDING ──────────────────────────────
  const handleAutopilotStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;

    setAutopilotStep('scanning');
    setScanProgress(0);
    setTerminalLogs([]);
    setAutopilotError(null);

    const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    let apiResolved = false;
    let apiResult: any = null;
    let apiError: string | null = null;

    // Start API request in parallel
    const triggerScrape = async () => {
      let finalOrgId = organizationId;
      try {
        // Create organization if none exists
        if (!finalOrgId) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              organization_name: 'Auto Extracted Startup',
              startup_type: 'SaaS',
              team_size: 15,
            }),
          });
          if (res.ok) {
            const org = await res.json();
            finalOrgId = org.organization_id;
          }
        }

        if (!finalOrgId) throw new Error('Failed to register startup profile.');

        // Trigger Scrape API
        const scrapeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${finalOrgId}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ url: websiteUrl }),
        });

        if (!scrapeRes.ok) {
          const errData = await scrapeRes.json();
          throw new Error(errData.detail || 'Scraping analysis failed.');
        }

        apiResult = await scrapeRes.json();
        setOrganization(finalOrgId, apiResult.organization);
        apiResolved = true;
      } catch (err: any) {
        apiError = err.message || 'Verification failed.';
        apiResolved = true;
      }
    };

    triggerScrape();

    // Start loading spinner progress & terminal messages (12 seconds countdown)
    const startTime = Date.now();
    const duration = 12000; // 12 seconds
    let intervalCleared = false;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(99, Math.floor((elapsed / duration) * 100));
      
      // Update progress
      setScanProgress(pct);

      // Append logs based on elapsed seconds
      const elapsedSec = elapsed / 1000;
      const logsToAdd = AUTOPILOT_STATUS_LOGS.filter(log => log.time <= elapsedSec);
      setTerminalLogs(logsToAdd.map(log => log.text));

      // Check if API has resolved (either early or after countdown)
      if (apiResolved) {
        clearInterval(progressInterval);
        intervalCleared = true;
        if (apiError) {
          setAutopilotError(apiError);
          setAutopilotStep('error');
        } else {
          setScanProgress(100);
          setTimeout(() => {
            setAutopilotStep('success');
            setTimeout(() => router.push('/dashboard'), 1500);
          }, 500);
        }
      }
    }, 150);

    // Cleanup on unmount to prevent memory leaks
    return () => {
      if (!intervalCleared) clearInterval(progressInterval);
    };
  };

  // ── MANUAL ONBOARDING ────────────────────────────────────────────────
  const handleManualSubmit = async () => {
    setManualLoading(true);
    const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      let finalOrgId = organizationId;

      // 1. Create organization if none exists
      if (!finalOrgId) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            organization_name: manualData.organization_name,
            startup_type: manualData.startup_type,
            team_size: manualData.team_size,
          }),
        });
        if (res.ok) {
          const org = await res.json();
          finalOrgId = org.organization_id;
        }
      }

      // 2. Submit onboarding questionnaire
      if (finalOrgId) {
        const onboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${finalOrgId}/onboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(manualData),
        });
        if (onboardRes.ok) {
          const org = await onboardRes.json();
          setOrganization(finalOrgId, org);
        }
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setOrganization(organizationId || 'demo_org_001');
    } finally {
      setManualLoading(false);
      router.push('/dashboard');
    }
  };

  // Rendering Functions
  const renderSelectionView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Select Onboarding Method</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Configure your company data dynamically or manually.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Autopilot Scraper Option */}
        <motion.div
          whileHover={{ scale: 1.02, borderColor: 'var(--primary)' }}
          className="glass-card"
          onClick={() => setOnboardingMode('autopilot')}
          style={{ padding: 28, cursor: 'pointer', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Sparkles size={22} style={{ color: 'var(--primary-light)' }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>AI Autopilot Scraper</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Provide your website URL and let our multi-agent Llama pipeline crawl and extract your workflows, pain points, team sizes, and AI maturity instantly.
            </p>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--primary-light)', marginTop: 24 }}>
            Launch AI Autopilot <ArrowRight size={14} />
          </span>
        </motion.div>

        {/* Manual Option */}
        <motion.div
          whileHover={{ scale: 1.02, borderColor: 'var(--accent)' }}
          className="glass-card"
          onClick={() => setOnboardingMode('manual')}
          style={{ padding: 28, cursor: 'pointer', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(0,229,168,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(0,229,168,0.12)', border: '1px solid rgba(0,229,168,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Building2 size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Manual Assessment</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Don&apos;t have an active website or prefer a self-guided flow? Fill in our standard 6-step interactive operational questionnaire manually.
            </p>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginTop: 24 }}>
            Enter Details Manually <ArrowRight size={14} />
          </span>
        </motion.div>
      </div>
    </div>
  );

  const renderAutopilotView = () => {
    if (autopilotStep === 'input') {
      return (
        <form onSubmit={handleAutopilotStart} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Autopilot Operational Scraping</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Provide your company website, and the AI will extract all structural parameters.</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Website landing page URL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., https://mycompany.com"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                required
                style={{ paddingLeft: 40 }}
              />
              <Globe size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={() => setOnboardingMode('select')} className="btn-secondary" style={{ flex: 0.35 }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 0.65, gap: 8 }}>
              Analyze Website <PlayCircle size={16} />
            </button>
          </div>
        </form>
      );
    }

    if (autopilotStep === 'scanning') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '12px 0' }}>
          {/* Radial progress loader */}
          <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ position: 'absolute', transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="44" stroke="var(--border)" strokeWidth="4" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="var(--primary)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * scanProgress) / 100}
                style={{ transition: 'stroke-dashoffset 0.15s ease-in-out' }}
              />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)' }}>{scanProgress}%</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 className="pulse-glow" style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-light)' }}>
              Autopilot Crawling &amp; Extracting
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Crawl speed: 1.2s. Live multi-agent analysis is running.
            </p>
          </div>

          {/* Futuristic Terminal status feed */}
          <div style={{ width: '100%', background: '#09090b', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, fontFamily: 'Geist Mono, JetBrains Mono, monospace', fontSize: 11, color: '#38BDF8', textAlign: 'left', minHeight: 180, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 4 }}>
              <Terminal size={12} />
              <span>[sys_autopilot_terminal]</span>
            </div>
            {terminalLogs.map((log, i) => (
              <div key={i} style={{ lineBreak: 'anywhere' }}>{log}</div>
            ))}
            <div className="pulse-glow" style={{ color: 'var(--primary-light)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>&gt;_ Running sub-pipelines...</span>
              <Loader2 size={10} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          </div>
        </div>
      );
    }

    if (autopilotStep === 'success') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <ShieldCheck size={36} style={{ color: 'var(--success)' }} />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--success)' }}>Onboarding Sync Successful!</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360 }}>
            Operational metrics successfully mapped and logged in the Google Sheets database. Redirecting you to your strategy dashboard...
          </p>
        </div>
      );
    }

    if (autopilotStep === 'error') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <AlertCircle size={28} style={{ color: 'var(--error)' }} />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--error)' }}>Crawl Analysis Failed</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400 }}>
            {autopilotError || 'We encountered a problem crawling or extracting data from your landing page.'}
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 14, width: '100%', maxWidth: 320 }}>
            <button onClick={() => setOnboardingMode('select')} className="btn-secondary" style={{ flex: 1 }}>
              Back to Options
            </button>
            <button onClick={() => setAutopilotStep('input')} className="btn-primary" style={{ flex: 1 }}>
              Retry
            </button>
          </div>
        </div>
      );
    }
  };

  const renderManualView = () => {
    const inputStyle = { marginBottom: 0 };
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 };

    const renderManualStepContent = () => {
      switch (manualStep) {
        case 0:
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Organization Name *</label>
                <input className="input-field" placeholder="e.g., Acme Corp" value={manualData.organization_name} onChange={e => updateManualField('organization_name', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Type of Organization</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {['SaaS', 'AI-native', 'E-commerce', 'Fintech', 'HealthTech', 'Agency', 'Enterprise', 'Other'].map(t => (
                    <button key={t} type="button" onClick={() => updateManualField('startup_type', t)} style={{
                      padding: 10, borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
                      border: `1px solid ${manualData.startup_type === t ? 'var(--primary)' : 'var(--border)'}`,
                      background: manualData.startup_type === t ? 'rgba(124,58,237,0.1)' : 'transparent',
                      color: manualData.startup_type === t ? 'var(--primary-light)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Team Size: <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{manualData.team_size}</span></label>
                <input type="range" min="1" max="500" value={manualData.team_size} onChange={e => updateManualField('team_size', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}><span>1</span><span>500+</span></div>
              </div>
            </div>
          );
        case 1:
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Key Departments</label>
                <input className="input-field" placeholder="e.g., Engineering, Marketing, Sales, Support" value={manualData.departments} onChange={e => updateManualField('departments', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Key Workflows &amp; Processes</label>
                <textarea className="input-field" style={{ minHeight: 120, resize: 'none' }} placeholder={'Describe your most important workflows...\ne.g., Code review > Deploy, Lead > Demo > Close'} value={manualData.workflows} onChange={e => updateManualField('workflows', e.target.value)} />
              </div>
            </div>
          );
        case 2:
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Current AI Tools</label>
                <textarea className="input-field" style={{ minHeight: 120, resize: 'none' }} placeholder={'List the AI tools your org currently uses...\ne.g., GitHub Copilot, Notion AI, Slack, Zapier'} value={manualData.current_ai_tools} onChange={e => updateManualField('current_ai_tools', e.target.value)} />
              </div>
              <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Include any software with AI features your team uses &mdash; even basic ones like Grammarly.</p>
              </div>
            </div>
          );
        case 3:
          return (
            <div>
              <label style={labelStyle}>Pain Points &amp; Bottlenecks</label>
              <textarea className="input-field" style={{ minHeight: 160, resize: 'none' }} placeholder={'What frustrates your team the most?\ne.g., Manual data entry, slow code reviews, repetitive queries'} value={manualData.pain_points} onChange={e => updateManualField('pain_points', e.target.value)} />
            </div>
          );
        case 4:
          return (
            <div>
              <label style={labelStyle}>Automation &amp; AI Goals</label>
              <textarea className="input-field" style={{ minHeight: 160, resize: 'none' }} placeholder={'What would you love AI to handle?\ne.g., Automate testing, AI customer support, intelligent lead scoring'} value={manualData.automation_goals} onChange={e => updateManualField('automation_goals', e.target.value)} />
            </div>
          );
        case 5:
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={labelStyle}>
                  AI Maturity Self-Assessment
                  <span style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: 24, marginLeft: 12 }}>{manualData.ai_maturity_self_score}/10</span>
                </label>
                <input type="range" min="1" max="10" value={manualData.ai_maturity_self_score} onChange={e => updateManualField('ai_maturity_self_score', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>No AI</span><span>Exploring</span><span>Adopting</span><span>Advanced</span><span>AI-native</span>
                </div>
              </div>
              <div className="glass-card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Assessment Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <p><strong>{manualData.organization_name || 'Your Org'}</strong> &bull; {manualData.startup_type || 'Unknown type'} &bull; {manualData.team_size} people</p>
                  {manualData.departments && <p>Departments: {manualData.departments}</p>}
                  {manualData.current_ai_tools && <p>Current AI: {manualData.current_ai_tools.substring(0, 80)}...</p>}
                </div>
              </div>
            </div>
          );
      }
    };

    const canProceed = manualStep === 0 ? manualData.organization_name.length >= 2 : true;

    return (
      <div style={{ width: '100%' }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {MANUAL_STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width 0.5s ease',
                width: i < manualStep ? '100%' : i === manualStep ? '50%' : '0%',
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              }} />
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          {(() => { const Icon = MANUAL_STEPS[manualStep].icon; return <Icon size={20} style={{ color: 'var(--primary-light)' }} />; })()}
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>{MANUAL_STEPS[manualStep].title}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{MANUAL_STEPS[manualStep].subtitle}</p>
          </div>
        </div>

        {/* Step content */}
        <div className="glass-card" style={{ padding: 32, marginBottom: 20 }}>
          <AnimatePresence mode="wait">
            <motion.div key={manualStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {renderManualStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between' }}>
          {manualStep === 0 ? (
            <button onClick={() => setOnboardingMode('select')} className="btn-secondary">
              <ArrowLeft size={16} /> Back to Options
            </button>
          ) : (
            <button onClick={() => setManualStep(s => s - 1)} className="btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {manualStep < 5 ? (
            <button onClick={() => setManualStep(s => s + 1)} disabled={!canProceed} className="btn-primary" style={{ opacity: canProceed ? 1 : 0.5 }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleManualSubmit} disabled={manualLoading} className="btn-primary" style={{ opacity: manualLoading ? 0.6 : 1 }}>
              {manualLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <>Launch AI Analysis <Check size={16} /></>}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      
      {/* Background glow orbs */}
      <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(50px)', top: '10%', left: '10%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', filter: 'blur(50px)', bottom: '10%', right: '10%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: onboardingMode === 'select' ? 680 : 640, position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <Brain size={28} style={{ color: 'var(--primary-light)' }} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>AdaptiveAI</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>AI Assessment Onboarding</h1>
          {onboardingMode === 'manual' && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Step {manualStep + 1} of 6</p>
          )}
        </div>

        <div className="glass-card" style={{ padding: onboardingMode === 'select' ? 24 : 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={onboardingMode}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {onboardingMode === 'select' && renderSelectionView()}
              {onboardingMode === 'autopilot' && renderAutopilotView()}
              {onboardingMode === 'manual' && renderManualView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
