'use client';

import { useState, useRef, useMemo, useCallback, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Brain, ArrowLeft, Cpu, Activity, Eye, BarChart3,
  TrendingUp, Globe, Zap, ChevronRight, CheckCircle, Loader2,
  Play, Shield, Sparkles, XCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';
import { agentAPI } from '@/lib/api/client';

/* ─────────────────────────────────────────────────────
   Lazy-load the 3D orbital scene (Three.js is heavy)
   ───────────────────────────────────────────────────── */
const AgentOrbit3D = dynamic(() => import('@/components/AgentOrbit3D'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Loader2 size={28} style={{ color: 'var(--primary-light)', animation: 'spin 1s linear infinite' }} />
    </div>
  ),
});

/* ─────────────────────────────────────────────────────
   AGENT DEFINITIONS
   ───────────────────────────────────────────────────── */
const AGENTS = [
  {
    id: 'orchestrator', name: 'Orchestrator', icon: Cpu,
    color: '#8B5CF6', role: 'Central Coordination Engine', phase: 0,
    description: 'Receives queries, decomposes tasks, routes to specialized agents, manages execution phases, and assembles final synthesis.',
    capabilities: ['Task decomposition', 'Agent routing', 'Phase management', 'Result assembly'],
  },
  {
    id: 'workflow', name: 'Workflow Agent', icon: Activity,
    color: '#00E5A8', role: 'Workflow Bottleneck Analyst', phase: 1,
    description: 'Analyzes organizational workflows, identifies bottlenecks, maps automation opportunities, and estimates efficiency gains.',
    capabilities: ['Process mapping', 'Bottleneck detection', 'Automation scoring', 'Efficiency analysis'],
  },
  {
    id: 'research', name: 'Research Agent', icon: Eye,
    color: '#3B82F6', role: 'AI Tool Research Specialist', phase: 1,
    description: 'Searches the AI tools catalog, evaluates compatibility, scores workflow alignment, and recommends optimal tool stacks.',
    capabilities: ['Tool matching', 'Compatibility scoring', 'Stack optimization', 'Feature analysis'],
  },
  {
    id: 'sentiment', name: 'Sentiment Agent', icon: BarChart3,
    color: '#F59E0B', role: 'Community Trust Analyst', phase: 1,
    description: 'Analyzes community sentiment from Reddit, GitHub, ProductHunt. Assesses user satisfaction, trust levels, and adoption patterns.',
    capabilities: ['Sentiment analysis', 'Trust scoring', 'Community monitoring', 'Risk detection'],
  },
  {
    id: 'trend', name: 'Trend Agent', icon: TrendingUp,
    color: '#22C55E', role: 'Market Trend Tracker', phase: 1,
    description: 'Monitors AI ecosystem velocity, identifies emerging and declining categories, predicts market movements and adoption curves.',
    capabilities: ['Velocity tracking', 'Category analysis', 'Prediction models', 'Growth detection'],
  },
  {
    id: 'roi', name: 'ROI Agent', icon: Globe,
    color: '#EF4444', role: 'Business Value Estimator', phase: 2,
    description: 'Calculates ROI projections, estimates monthly savings, productivity gains, implementation costs, and payback periods.',
    capabilities: ['Cost modeling', 'Savings estimation', 'Payback analysis', 'Value projection'],
  },
  {
    id: 'strategy', name: 'Strategy Agent', icon: Brain,
    color: '#D946EF', role: 'Strategic Synthesis Engine', phase: 3,
    description: 'Combines all agent outputs into a unified strategic recommendation. Generates transformation roadmaps, priority initiatives, and risk assessments.',
    capabilities: ['Output synthesis', 'Roadmap generation', 'Priority ranking', 'Risk assessment'],
  },
];

const PHASES = [
  { id: 1, name: 'Parallel Analysis', agents: ['workflow', 'research', 'sentiment', 'trend'], color: '#3B82F6' },
  { id: 2, name: 'Value Assessment', agents: ['roi'], color: '#F59E0B' },
  { id: 3, name: 'Strategic Synthesis', agents: ['strategy'], color: '#D946EF' },
];

type AgentStatus = 'idle' | 'active' | 'done' | 'error';

/* ─────────────────────────────────────────────────────
   LIVE ANALYSIS PANEL — Triggers actual backend API
   ───────────────────────────────────────────────────── */
function LiveAnalysisPanel({
  agentStatuses, onRunAnalysis, isRunning, analysisResult, analysisError,
}: {
  agentStatuses: Record<string, AgentStatus>;
  onRunAnalysis: () => void;
  isRunning: boolean;
  analysisResult: any;
  analysisError: string | null;
}) {
  const activeAgents = Object.entries(agentStatuses).filter(([_, s]) => s === 'active');
  const doneAgents = Object.entries(agentStatuses).filter(([_, s]) => s === 'done');
  const currentPhase = activeAgents.length > 0
    ? AGENTS.find(a => a.id === activeAgents[0][0])?.phase || 0
    : doneAgents.length === 6 ? 3 : 0;

  return (
    <div className="intel-card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} style={{ color: 'var(--accent)' }} /> Live Multi-Agent Analysis
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Triggers a real backend analysis through all 6 agents
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isRunning}
          className="btn-primary"
          style={{ padding: '10px 24px', fontSize: 13, opacity: isRunning ? 0.5 : 1, gap: 8 }}
        >
          {isRunning ? (
            <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Running</>
          ) : (
            <><Play size={14} /> Run Analysis</>
          )}
        </button>
      </div>

      {/* Phase Progress */}
      {isRunning && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {PHASES.map(phase => {
              const phaseAgentIds = phase.agents;
              const allDone = phaseAgentIds.every(id => agentStatuses[id] === 'done');
              const anyActive = phaseAgentIds.some(id => agentStatuses[id] === 'active');
              return (
                <div key={phase.id} style={{ flex: 1 }}>
                  <div style={{
                    height: 4, borderRadius: 2, overflow: 'hidden',
                    background: 'var(--bg-tertiary)',
                  }}>
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: allDone ? '100%' : anyActive ? '60%' : '0%' }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: phase.color, borderRadius: 2 }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: allDone ? phase.color : 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Phase {phase.id}: {phase.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {AGENTS.filter(a => a.id !== 'orchestrator').map(agent => {
          const status = agentStatuses[agent.id] || 'idle';
          return (
            <motion.div
              key={agent.id}
              animate={{
                borderColor: status === 'active' ? agent.color : status === 'done' ? 'rgba(34,197,94,0.3)' : 'var(--border)',
                background: status === 'active' ? `${agent.color}08` : 'transparent',
              }}
              style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.3s',
              }}
            >
              {status === 'done' && <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />}
              {status === 'active' && <Loader2 size={14} style={{ color: agent.color, flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
              {status === 'error' && <XCircle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} />}
              {status === 'idle' && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: status === 'active' ? agent.color : 'var(--text-secondary)' }}>
                  {agent.name.replace(' Agent', '')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {status === 'idle' ? 'Waiting' : status === 'active' ? 'Processing...' : status === 'done' ? 'Complete' : 'Failed'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analysis Result */}
      <AnimatePresence>
        {analysisResult && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 20, padding: 16, borderRadius: 'var(--radius-md)',
              background: 'rgba(0,229,168,0.05)', border: '1px solid rgba(0,229,168,0.2)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> Analysis Complete
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {(() => {
                const rec = analysisResult?.strategy?.strategic_recommendation;
                if (!rec) {
                  return (
                    <p style={{ margin: 0 }}>
                      {analysisResult?.strategy?.synthesis || 'Strategic analysis complete. View your dashboard for detailed recommendations.'}
                    </p>
                  );
                }

                if (typeof rec === 'string') {
                  return <p style={{ margin: 0 }}>{rec}</p>;
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                    {rec.executive_summary && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Executive Summary</div>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{rec.executive_summary}</p>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      {rec.ai_maturity_current && (
                        <div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Current AI Maturity</div>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{rec.ai_maturity_current}</div>
                        </div>
                      )}
                      {rec.ai_maturity_target && (
                        <div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Target AI Maturity</div>
                          <div style={{ fontSize: 12, color: 'var(--primary-light)', fontWeight: 700 }}>{rec.ai_maturity_target}</div>
                        </div>
                      )}
                      {rec.transformation_timeline_months && (
                        <div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Timeline</div>
                          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{rec.transformation_timeline_months} Months</div>
                        </div>
                      )}
                    </div>
                    {rec.priority_initiatives && Array.isArray(rec.priority_initiatives) && rec.priority_initiatives.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Priority Initiatives</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {rec.priority_initiatives.map((init: any, idx: number) => (
                            <div key={idx} style={{ padding: 12, background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{init.initiative}</span>
                                <span className={`glow-badge ${init.impact === 'high' ? 'success' : 'info'}`} style={{ fontSize: 8, padding: '1px 6px' }}>{init.impact}</span>
                              </div>
                              {init.tools && Array.isArray(init.tools) && init.tools.length > 0 && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  Tools: {init.tools.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {analysisError && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 20, padding: 16, borderRadius: 'var(--radius-md)',
              background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)', marginBottom: 4 }}>
              Analysis Error
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{analysisError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   AGENT DETAIL PANEL
   ───────────────────────────────────────────────────── */
function AgentDetailPanel({ agent, onClose }: { agent: typeof AGENTS[0]; onClose: () => void }) {
  const Icon = agent.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute', top: 16, right: 16, width: 340, zIndex: 20,
        background: 'rgba(17,17,20,0.95)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 24,
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${agent.color}18`, border: `1px solid ${agent.color}33`,
        }}>
          <Icon size={22} style={{ color: agent.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{agent.name}</h3>
          <p style={{ fontSize: 12, color: agent.color }}>{agent.role}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>✕</button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{agent.description}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Capabilities</span>
        {agent.capabilities.map(cap => (
          <div key={cap} style={{
            fontSize: 12, padding: '6px 10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Sparkles size={10} style={{ color: agent.color }} /> {cap}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: `${agent.color}10`, border: `1px solid ${agent.color}20` }}>
        <span style={{ fontSize: 11, color: agent.color, fontWeight: 600 }}>
          Phase {agent.phase} · {agent.phase === 0 ? 'Coordination' : agent.phase === 1 ? 'Parallel Analysis' : agent.phase === 2 ? 'Value Assessment' : 'Strategic Synthesis'}
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────── */
export default function AgentsPage() {
  const { organizationId } = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const selected = AGENTS.find(a => a.id === selectedAgent);

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setAnalysisResult(null);
    setAnalysisError(null);

    // Reset all statuses
    const initialStatuses: Record<string, AgentStatus> = {};
    AGENTS.filter(a => a.id !== 'orchestrator').forEach(a => { initialStatuses[a.id] = 'idle'; });
    setAgentStatuses(initialStatuses);

    // Simulate phased activation with real API call
    const orgId = organizationId || 'demo_org_001';

    // Phase 1: Activate parallel agents
    await new Promise(r => setTimeout(r, 300));
    setAgentStatuses(prev => ({
      ...prev,
      workflow: 'active', research: 'active', sentiment: 'active', trend: 'active',
    }));

    try {
      // Fire the actual backend analysis
      const result = await agentAPI.fullAnalysis(orgId);

      // Phase 1 complete
      setAgentStatuses(prev => ({
        ...prev,
        workflow: 'done', research: 'done', sentiment: 'done', trend: 'done',
      }));

      // Phase 2: ROI
      await new Promise(r => setTimeout(r, 600));
      setAgentStatuses(prev => ({ ...prev, roi: 'active' }));
      await new Promise(r => setTimeout(r, 800));
      setAgentStatuses(prev => ({ ...prev, roi: 'done' }));

      // Phase 3: Strategy
      await new Promise(r => setTimeout(r, 400));
      setAgentStatuses(prev => ({ ...prev, strategy: 'active' }));
      await new Promise(r => setTimeout(r, 800));
      setAgentStatuses(prev => ({ ...prev, strategy: 'done' }));

      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis failed. Check backend connection.');
      // Mark remaining as error
      setAgentStatuses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(k => {
          if (updated[k] === 'active' || updated[k] === 'idle') updated[k] = 'error';
        });
        return updated;
      });
    } finally {
      setIsRunning(false);
    }
  }, [organizationId]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            }}>
              <Brain size={16} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700 }}>Multi-Agent Pipeline</h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>3D Orchestrator · 6 Specialized Agents</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="glow-badge accent" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            {isRunning ? 'Agents Active' : '7 Agents Ready'}
          </span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
        {/* 3D Visualization */}
        <div style={{ position: 'relative', height: 480, borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
          <Suspense fallback={
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={24} style={{ color: 'var(--primary-light)', animation: 'spin 1s linear infinite' }} />
            </div>
          }>
            <AgentOrbit3D
              agentStatuses={agentStatuses}
              onAgentClick={(id: string) => setSelectedAgent(selectedAgent === id ? null : id)}
              selectedAgent={selectedAgent}
            />
          </Suspense>

          {/* Agent label overlays */}
          <div style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
            padding: '0 24px',
          }}>
            {AGENTS.filter(a => a.id !== 'orchestrator').map(agent => {
              const status = agentStatuses[agent.id] || 'idle';
              const Icon = agent.icon;
              return (
                <motion.button
                  key={agent.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 100,
                    background: selectedAgent === agent.id ? `${agent.color}20` : 'rgba(17,17,20,0.8)',
                    border: `1px solid ${selectedAgent === agent.id ? agent.color : 'var(--border)'}`,
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    color: status === 'active' ? agent.color : selectedAgent === agent.id ? agent.color : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  {status === 'done' && <CheckCircle size={10} style={{ color: 'var(--success)' }} />}
                  {status === 'active' && <Loader2 size={10} style={{ color: agent.color, animation: 'spin 1s linear infinite' }} />}
                  {(status === 'idle' || !status) && <Icon size={10} />}
                  {agent.name.replace(' Agent', '')}
                </motion.button>
              );
            })}
          </div>

          {/* Selected Agent Detail Overlay */}
          <AnimatePresence>
            {selected && (
              <AgentDetailPanel agent={selected} onClose={() => setSelectedAgent(null)} />
            )}
          </AnimatePresence>
        </div>

        {/* Execution Phases + Live Analysis */}
        <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {/* Phase Architecture */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} style={{ color: 'var(--primary-light)' }} /> Execution Architecture
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {PHASES.map((phase, i) => {
                const phaseAgents = phase.agents.map(id => AGENTS.find(a => a.id === id)!);
                const allDone = phase.agents.every(id => agentStatuses[id] === 'done');
                const anyActive = phase.agents.some(id => agentStatuses[id] === 'active');

                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      padding: 20, borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${anyActive ? phase.color + '40' : allDone ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                      background: anyActive ? `${phase.color}08` : 'var(--bg-card)',
                      transition: 'all 0.4s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className="gradient-text" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Phase {phase.id}
                      </span>
                      {allDone && <CheckCircle size={14} style={{ color: 'var(--success)' }} />}
                      {anyActive && <Loader2 size={14} style={{ color: phase.color, animation: 'spin 1s linear infinite' }} />}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{phase.name}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {phaseAgents.map(a => (
                        <span key={a.id} style={{
                          fontSize: 10, padding: '3px 8px', borderRadius: 100,
                          background: `${a.color}15`, color: a.color,
                          border: `1px solid ${a.color}33`,
                        }}>{a.name.replace(' Agent', '')}</span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Live Analysis Panel */}
          <LiveAnalysisPanel
            agentStatuses={agentStatuses}
            onRunAnalysis={runAnalysis}
            isRunning={isRunning}
            analysisResult={analysisResult}
            analysisError={analysisError}
          />
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
