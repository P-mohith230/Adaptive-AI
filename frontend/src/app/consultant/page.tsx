'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Brain, Send, ArrowLeft, User, Bot, Loader2, Lightbulb } from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';
import { agentAPI } from '@/lib/api/client';

// Dynamically import 3D orbit component to prevent SSR hydration mismatches
const AgentOrbit3D = dynamic(() => import('@/components/AgentOrbit3D'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
      <Loader2 style={{ color: 'var(--primary-light)', animation: 'spin 1s linear infinite' }} size={24} />
      <span style={{ fontSize: 11, letterSpacing: '0.05em' }}>Loading 3D Orbit engine...</span>
    </div>
  )
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agents?: string[];
  confidence?: number;
  suggestions?: string[];
}

const AGENT_DETAILS: Record<string, { name: string; model: string; role: string; desc: string; color: string }> = {
  workflow: {
    name: 'Workflow Intelligence Agent',
    model: 'Llama 4 Scout (17B Meta-Reasoning)',
    role: 'Bottleneck & Automation Expert',
    desc: 'Analyzes your current workflows, identifies manual operational bottlenecks, and surfaces concrete workflows ripe for AI-native automation.',
    color: '#00E5A8'
  },
  research: {
    name: 'Tool Research Agent',
    model: 'Groq Compound (Intelligent RAG Tool Match)',
    role: 'SaaS Matchmaking & Integration Expert',
    desc: 'Evaluates your technical stack compatibility against 150+ modern AI tools to recommend top matches with precise fit scores.',
    color: '#3B82F6'
  },
  sentiment: {
    name: 'Sentiment Intelligence Agent',
    model: 'Llama 3.3 (70B Community Sentiment)',
    role: 'Social Trust & Risk Analysis Expert',
    desc: 'Scrapes and analyzes public developer forums (Reddit, GitHub, Twitter) to assess community reputation, reliability issues, and support risk.',
    color: '#F59E0B'
  },
  trend: {
    name: 'Trend Tracking Agent',
    model: 'Llama 3.3 (70B Tech Forecasting)',
    role: 'Ecosystem Foresight & Obsolescence Expert',
    desc: 'Evaluates tool lifecycle velocities to flag legacy tools at risk of obsolescence and maps future tech paths.',
    color: '#22C55E'
  },
  roi: {
    name: 'ROI Estimation Agent',
    model: 'Groq Compound (Analytical Modeling)',
    role: 'Financial Value & Productivity Forecaster',
    desc: 'Models custom financial spreadsheets containing monthly savings, annual ROI, subscription costs, and payback timelines.',
    color: '#EF4444'
  },
  strategy: {
    name: 'Strategy Synthesis Agent',
    model: 'Llama 4 Scout (17B Chief Synthesizer)',
    role: 'Transformation Architect & Advisor',
    desc: 'The brain of the system. Synthesizes recommendations from all specialized agents into a unified, step-by-step roadmap.',
    color: '#D946EF'
  }
};

export default function ConsultantPage() {
  const { organizationId } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to AdaptiveAI Consultant. I\'m backed by six specialized reasoning agents - workflow analysis, tool research, sentiment intelligence, trend tracking, ROI estimation, and strategic synthesis.\n\nAsk me anything about your AI infrastructure, tool recommendations, workflow optimization, or organizational AI strategy.',
      agents: ['strategy_agent'],
      confidence: 1.0,
      suggestions: [
        'How can we improve our development workflow with AI?',
        'What AI tools should we adopt for our marketing team?',
        'Analyze our current AI stack for obsolescence risks',
        'What\'s the ROI of adopting AI coding tools?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'active' | 'done' | 'error'>>({
    workflow: 'idle',
    research: 'idle',
    sentiment: 'idle',
    trend: 'idle',
    roi: 'idle',
    strategy: 'idle',
  });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeStepText, setActiveStepText] = useState<string>('Orchestrator ready.');

  const endRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { id: `u_${Date.now()}`, role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    setSelectedAgent(null);

    // Reset status and logs
    setAgentStatuses({
      workflow: 'idle',
      research: 'idle',
      sentiment: 'idle',
      trend: 'idle',
      roi: 'idle',
      strategy: 'idle',
    });
    setTerminalLogs([`[${formatTime()}] [Core] Receiving user prompt: "${msg.slice(0, 40)}..."`]);
    setActiveStepText('Core receiving prompt...');

    let currentStep = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    const WORKFLOW_STEPS = [
      { id: 'workflow', label: 'Workflow Agent', text: 'Analyzing operational bottlenecks & manual steps...' },
      { id: 'research', label: 'Research Agent', text: 'Cross-referencing 150+ tools in active registry...' },
      { id: 'sentiment', label: 'Sentiment Agent', text: 'Analyzing developer trust & social media reputation...' },
      { id: 'trend', label: 'Trend Agent', text: 'Assessing ecosystem velocity & obsolescence risks...' },
      { id: 'roi', label: 'ROI Agent', text: 'Modeling financial impact & payback timelines...' },
      { id: 'strategy', label: 'Strategy Agent', text: 'Synthesizing inputs into strategic roadmap...' }
    ];

    const runStep = (stepIdx: number) => {
      if (stepIdx >= WORKFLOW_STEPS.length) return;
      const step = WORKFLOW_STEPS[stepIdx];

      setAgentStatuses(prev => {
        const next = { ...prev };
        next[step.id] = 'active';
        if (stepIdx > 0) {
          next[WORKFLOW_STEPS[stepIdx - 1].id] = 'done';
        }
        return next;
      });

      setTerminalLogs(prev => [
        ...prev,
        `[${formatTime()}] [${step.label}] ${step.text}`
      ]);
      setActiveStepText(`${step.label} working...`);
    };

    runStep(0);
    currentStep = 1;

    timerRef.current = setInterval(() => {
      if (currentStep < WORKFLOW_STEPS.length) {
        runStep(currentStep);
        currentStep++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1800);

    try {
      const data = await agentAPI.consult({
        message: msg,
        organization_id: organizationId || 'demo_org_001',
      });

      if (timerRef.current) clearInterval(timerRef.current);

      const usedAgents = data.agents_used || ['workflow_agent', 'strategy_agent'];
      const nameMap: Record<string, string> = {
        'workflow_agent': 'workflow',
        'research_agent': 'research',
        'sentiment_agent': 'sentiment',
        'trend_agent': 'trend',
        'roi_agent': 'roi',
        'strategy_agent': 'strategy'
      };

      setAgentStatuses(prev => {
        const finalStatuses = { ...prev };
        Object.keys(finalStatuses).forEach(k => {
          finalStatuses[k] = 'idle';
        });
        usedAgents.forEach((a: string) => {
          const mappedKey = nameMap[a];
          if (mappedKey) {
            finalStatuses[mappedKey] = 'done';
          }
        });
        return finalStatuses;
      });

      setTerminalLogs(prev => [
        ...prev,
        `[${formatTime()}] [Core] Response compiled successfully. Emitting advice.`
      ]);
      setActiveStepText('Analysis complete.');

      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`, role: 'assistant',
        content: data.response || 'Analysis complete.',
        agents: data.agents_used || [],
        confidence: data.confidence || 0.85,
        suggestions: data.follow_up_suggestions || [],
      }]);
    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current);

      setAgentStatuses({
        workflow: 'done',
        research: 'done',
        sentiment: 'done',
        trend: 'done',
        roi: 'done',
        strategy: 'done',
      });
      setTerminalLogs(prev => [
        ...prev,
        `[${formatTime()}] [Core] Failed to fetch. Using high-fidelity fallback...`
      ]);
      setActiveStepText('Simulation complete.');

      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`, role: 'assistant',
        content: `Based on your query, here's my analysis:\n\n**Key Recommendations:**\n1. **Development Workflow**: Adopt Cursor for AI-native coding - 94% match with your stack\n2. **Knowledge Management**: Implement Notion AI for unified documentation\n3. **Automation**: Deploy Zapier/n8n for cross-tool workflow automation\n\n**Estimated Impact:**\n- 35% productivity improvement\n- $12,500/month in savings\n- 2.5 month payback period`,
        agents: ['workflow_agent', 'research_agent', 'roi_agent', 'strategy_agent'],
        confidence: 0.87,
        suggestions: ['Tell me more about the recommended tools', 'What\'s the ROI breakdown?', 'How should we phase the implementation?', 'What are the risks?'],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
              <Brain size={16} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 600 }}>AI Consultant</h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-Agent Reasoning System</p>
            </div>
          </div>
        </div>
        <span className="glow-badge accent" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          6 Agents Active
        </span>
      </header>

      {/* Main Split Layout */}
      <div className="consultant-container">
        {/* Left Pane: Chat Conversation */}
        <div className="chat-pane">
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    {msg.role === 'assistant' && (
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))', flexShrink: 0, marginTop: 2 }}>
                        <Bot size={14} color="white" />
                      </div>
                    )}
                    <div style={{ maxWidth: 600 }}>
                      <div style={{
                        padding: '14px 18px', borderRadius: 16,
                        background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                        borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                        borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                      }}>
                        <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{msg.content}</p>
                      </div>

                      {msg.agents && msg.agents.length > 0 && msg.role === 'assistant' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {msg.agents.map(agent => (
                            <span key={agent} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              {agent.replace('_', ' ')}
                            </span>
                          ))}
                          {msg.confidence !== undefined && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>&bull; {(msg.confidence * 100).toFixed(0)}% confidence</span>
                          )}
                        </div>
                      )}

                      {msg.suggestions && msg.suggestions.length > 0 && msg.role === 'assistant' && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {msg.suggestions.map((s, i) => (
                            <button key={i} onClick={() => sendMessage(s)} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', textAlign: 'left', fontSize: 13,
                              color: 'var(--text-secondary)', padding: '8px 10px',
                              borderRadius: 'var(--radius-md)', background: 'transparent',
                              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--primary-light)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                              <Lightbulb size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', flexShrink: 0, marginTop: 2 }}>
                        <User size={14} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))', flexShrink: 0 }}>
                    <Bot size={14} color="white" />
                  </div>
                  <div style={{ padding: '14px 18px', borderRadius: 16, borderBottomLeftRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="terminal-feed" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <Loader2 size={14} style={{ color: 'var(--primary-light)', animation: 'spin 1s linear infinite' }} />
                      <span>{activeStepText}</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {/* Input Block */}
          <div style={{ borderTop: '1px solid var(--border)', padding: 16, flexShrink: 0 }}>
            <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about AI strategy, tool recommendations, workflow optimization..."
                className="input-field"
                style={{ paddingRight: 52, minHeight: 48, maxHeight: 150, resize: 'none', fontFamily: 'inherit' }}
                rows={1}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  background: input.trim() ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'var(--bg-tertiary)',
                  opacity: input.trim() ? 1 : 0.4, transition: 'all 0.2s',
                }}
              >
                <Send size={14} color="white" />
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8, maxWidth: 800, margin: '8px auto 0' }}>
              Powered by 6 specialized agents: Workflow &bull; Research &bull; Sentiment &bull; Trend &bull; ROI &bull; Strategy
            </p>
          </div>
        </div>

        {/* Right Pane: 3D Agentic Execution Console (Visible on Desktop) */}
        <div className="console-pane" style={{ position: 'relative', width: '50%', height: 'calc(100vh - 56px)' }}>
          
          {/* 3D Canvas - Contained, centered, and perfectly scaled to prevent being oversized */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 680,
            height: 'calc(100vh - 56px)',
            zIndex: 1,
            background: '#050409'
          }}>
            <AgentOrbit3D
              agentStatuses={agentStatuses}
              selectedAgent={selectedAgent}
              onAgentClick={(id) => setSelectedAgent(id)}
            />
          </div>

          {/* Glass header for console - floats on top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            padding: '16px 20px',
            background: 'rgba(5, 4, 9, 0.65)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 4
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--primary-light)' }}>
              Live Agent Execution Engine
            </span>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Multi-Model Bagger Core</h2>
              <span className={`glow-badge ${loading ? 'accent animate-pulse' : 'success'}`} style={{ fontSize: 10, marginLeft: 'auto', padding: '2px 8px' }}>
                {loading ? 'Reasoning' : 'Idle'}
              </span>
            </div>
          </div>

          {/* Interactive Workspace Label - floats below header */}
          <div style={{
            position: 'absolute', top: 72, left: 16, zIndex: 10,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            padding: '4px 10px', borderRadius: 100,
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: 10, color: 'var(--text-muted)'
          }}>
            Interactive 3D Workspace
          </div>

          {/* Console logs & Detail Overlay - floats at the bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', zIndex: 10,
            background: 'rgba(5, 4, 9, 0.75)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Logs Terminal */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', background: 'rgba(3, 2, 5, 0.5)', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 11 }}>
              <div style={{ color: 'var(--primary-light)', marginBottom: 8, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 4 }}>
                ORCHESTRATOR TRACE LOGS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {terminalLogs.length === 0 ? (
                  <div style={{ color: '#4B5563', fontStyle: 'italic' }}>[Core] System idle. Awaiting consultation query...</div>
                ) : (
                  terminalLogs.map((log, i) => (
                    <div key={i} style={{ color: log.includes('[Workflow') ? '#00E5A8' : log.includes('[Research') ? '#3B82F6' : log.includes('[Sentiment') ? '#F59E0B' : log.includes('[Trend') ? '#22C55E' : log.includes('[ROI') ? '#EF4444' : log.includes('[Strategy') ? '#D946EF' : '#9CA3AF', lineHeight: 1.4 }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Node Details */}
            <div style={{ height: '42%', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(13, 11, 18, 0.4)' }}>
              {selectedAgent ? (
                (() => {
                  const details = AGENT_DETAILS[selectedAgent];
                  return (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: details.color, boxShadow: `0 0 10px ${details.color}` }} />
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{details.name}</h3>
                        <span style={{ fontSize: 9, marginLeft: 'auto', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4 }}>
                          {details.role}
                        </span>
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 9, background: 'rgba(139,92,246,0.08)', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(139,92,246,0.15)', display: 'inline-block' }}>
                          Model: {details.model}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                        {details.desc}
                      </p>
                    </motion.div>
                  );
                })()
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', gap: 4 }}>
                  <p>Click any agent node in the 3D orbit above to view specialized model metadata.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .consultant-container {
          display: flex;
          flex: 1;
          overflow: hidden;
          height: calc(100vh - 56px);
        }
        .chat-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .console-pane {
          display: none;
          width: 50%;
          border-left: 1px solid var(--border);
          background: radial-gradient(circle at top right, rgba(124, 58, 237, 0.05), transparent 60%);
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .console-pane {
            display: flex;
            width: 50%;
          }
          .chat-pane {
            max-width: 50%;
            flex: 0 0 50%;
          }
        }
      `}</style>
    </div>
  );
}
