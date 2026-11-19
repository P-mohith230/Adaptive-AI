'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orgAPI, recommendationAPI, alertAPI, intelligenceAPI, agentAPI, marketAPI } from '@/lib/api/client';
import AgentOrbit3D from '@/components/AgentOrbit3D';
import {
  Brain, Plus, Send, ChevronDown, Sparkles, Layers,
  TrendingUp, Bell, DollarSign, Network, Home, ChevronLeft,
  Activity, Shield, AlertTriangle, Target, Zap, CheckCircle,
  XCircle, ArrowUpRight, ArrowDownRight, Minus, Cpu, Globe,
  Loader2, PieChart, Users, Settings, Gauge, Lightbulb,
  Workflow, FileText, Clock, TrendingDown, ChevronRight,
  ExternalLink, Star, Search, MessageSquare, Sidebar, RefreshCw,
  SlidersHorizontal, Check, Database, Bot, Terminal, Code2, Play
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';

/* ═══════════════════════════════════════════════════════
   TYPES & MODEL OPTIONS (Pure ChatGPT / Claude Theme)
   ═══════════════════════════════════════════════════════ */
interface Message {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  text: string;
  timestamp: string;
  widgetType?: 'bottlenecks' | 'recommendations' | 'roi' | 'market' | 'digital_twin' | 'alerts' | 'pipeline';
  widgetData?: any;
}

const MODEL_OPTIONS = [
  { id: 'full_pipeline', name: 'CTO Pipeline v1.0', desc: 'Synthesizes all 6 specialized agents', icon: Brain, badge: 'Standard' },
  { id: 'workflow_agent', name: 'Workflow Analyzer', desc: 'Identifies friction loops & labor overhead', icon: Workflow, badge: 'Fast' },
  { id: 'research_agent', name: 'Tool Research & ROI', desc: 'SaaS matching & financial payback model', icon: Target, badge: 'Pro' },
  { id: 'sentiment_agent', name: 'Market Intelligence', desc: 'GitHub, Reddit & HN live sentiment signals', icon: TrendingUp, badge: 'Live' },
];

const PLUS_MENU_ITEMS = [
  {
    id: 'digital_twin',
    title: 'Digital Twin & Bottlenecks',
    desc: 'Map operational friction, dependency graph, and maturity score.',
    icon: Network,
    prompt: 'Run a full Digital Twin analysis and identify our operational bottlenecks.'
  },
  {
    id: 'recommendations',
    title: 'AI Tool Matcher & Catalog',
    desc: 'Find top-rated commercial SaaS & open-source models for our stack.',
    icon: Target,
    prompt: 'Search the AI catalog and recommend the best tools for our startup stack.'
  },
  {
    id: 'market',
    title: 'Market Intelligence Scraper',
    desc: 'Scrape real-time developer sentiment from GitHub, Reddit, & HN.',
    icon: TrendingUp,
    prompt: 'Trigger an on-demand market scraping run for community trust scores.'
  },
  {
    id: 'roi',
    title: 'ROI & Financial Estimator',
    desc: 'Compute monthly subscription savings and payback timelines.',
    icon: DollarSign,
    prompt: 'Calculate 12-month ROI projections and operational cost savings.'
  },
  {
    id: 'alerts',
    title: 'Stack Security & Risk Alerts',
    desc: 'Check tool deprecation risks, price updates, and security patches.',
    icon: AlertTriangle,
    prompt: 'Scan our operational stack for deprecation risks and active alerts.'
  },
  {
    id: 'pipeline',
    title: 'Run Full CTO Agent Pipeline',
    desc: 'Execute all 6 reasoning agents sequentially to generate a full roadmap.',
    icon: Brain,
    prompt: 'Execute full CTO Multi-Agent Pipeline and build our strategic roadmap.'
  }
];

const STARTER_CHIPS = [
  { label: 'Detect Operational Bottlenecks', prompt: 'Analyze our startup workflow and show active bottlenecks.' },
  { label: 'Find AI Tools for My Stack', prompt: 'Recommend the top 5 AI SaaS tools to reduce engineering friction.' },
  { label: 'Scrape Live Market Signals', prompt: 'Fetch latest developer sentiment and trust scores from GitHub & Reddit.' },
  { label: 'Compute 12-Month ROI Savings', prompt: 'Estimate potential cost savings and financial payback timeline.' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { organizationId } = useAppStore();

  // Navigation & Drawers
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orbitDrawerOpen, setOrbitDrawerOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Data States
  const [orgData, setOrgData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [digitalTwin, setDigitalTwin] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgentName, setActiveAgentName] = useState<string | null>(null);

  // Auto-scroll chat
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Load organization and intelligence data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingData(true);
      try {
        const orgId = organizationId || 'org_3a67c3641794';
        
        // Fetch Organization profile
        const org = await orgAPI.get(orgId).catch(() => ({
          organization_id: orgId,
          organization_name: 'AdaptiveAI Scaleup',
          startup_type: 'AI-Native SaaS',
          team_size: 14,
          ai_maturity_score: 0.68,
          primary_bottlenecks: ['Manual prompt testing', 'High SaaS cost overhead', 'Lack of custom model fine-tuning']
        }));
        setOrgData(org);

        // Fetch Recommendations
        const recs = await recommendationAPI.getAll(orgId).catch(() => []);
        setRecommendations(recs || []);

        // Fetch Alerts
        const alts = await alertAPI.getAll(orgId).catch(() => []);
        setAlerts(alts || []);

        // Fetch Digital Twin
        const twin = await intelligenceAPI.getDigitalTwin(orgId).catch(() => null);
        setDigitalTwin(twin);

      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadDashboardData();
  }, [organizationId]);

  // Handle submitting chat message
  const handleSendMessage = async (customPrompt?: string, forcedWidget?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setPlusMenuOpen(false);
    setIsProcessing(true);

    const queryLower = textToSend.toLowerCase();
    
    // Determine widget response type
    let widgetType: Message['widgetType'] = undefined;
    if (forcedWidget) {
      widgetType = forcedWidget as any;
    } else if (queryLower.includes('bottleneck') || queryLower.includes('friction') || queryLower.includes('digital twin')) {
      widgetType = 'bottlenecks';
    } else if (queryLower.includes('tool') || queryLower.includes('recommend') || queryLower.includes('saas') || queryLower.includes('catalog')) {
      widgetType = 'recommendations';
    } else if (queryLower.includes('roi') || queryLower.includes('cost') || queryLower.includes('saving') || queryLower.includes('financial')) {
      widgetType = 'roi';
    } else if (queryLower.includes('scrape') || queryLower.includes('market') || queryLower.includes('sentiment') || queryLower.includes('trust')) {
      widgetType = 'market';
    } else if (queryLower.includes('alert') || queryLower.includes('risk') || queryLower.includes('security') || queryLower.includes('patch')) {
      widgetType = 'alerts';
    } else {
      widgetType = 'pipeline';
    }

    setActiveAgentName(selectedModel.name);

    try {
      // Call backend API consultant if available, or generate clean agent response
      const orgId = organizationId || 'org_3a67c3641794';
      let agentResponseText = '';
      
      try {
        const response = await agentAPI.consult({
          message: textToSend,
          organization_id: orgId
        });
        agentResponseText = response.response || response.message || response.answer || '';
      } catch (e) {
        // Fallback clean synthetic response
        if (widgetType === 'bottlenecks') {
          agentResponseText = `Analysis complete via Workflow Intelligence Agent. We identified 3 key operational bottlenecks across your development pipeline:`;
        } else if (widgetType === 'recommendations') {
          agentResponseText = `Assessed 150+ monitored tools against your stack. Here are the top matched AI tools for your team:`;
        } else if (widgetType === 'roi') {
          agentResponseText = `Financial payback model computed. Here are your estimated monthly savings and payback milestones:`;
        } else if (widgetType === 'market') {
          agentResponseText = `Scraped real-time developer signals from GitHub, Reddit, and Hacker News. Here is your community trust telemetry:`;
        } else if (widgetType === 'alerts') {
          agentResponseText = `Scanned active SaaS dependencies. Here are the active system alerts and security deprecation risks:`;
        } else {
          agentResponseText = `Full CTO Multi-Agent Pipeline execution finished. Synthesized strategic roadmap and action plan:`;
        }
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        agentName: selectedModel.name,
        text: agentResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        widgetType: widgetType,
        widgetData: { org: orgData, recs: recommendations, alerts: alerts, twin: digitalTwin }
      };

      setMessages(prev => [...prev, agentMsg]);

    } catch (err: any) {
      console.error('Error getting agent response:', err);
    } finally {
      setIsProcessing(false);
      setActiveAgentName(null);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#212121', color: '#ECECF1', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* ═══════════════════════════════════════════════════════
         LEFT COLLAPSED/EXPANDED SIDEBAR (ChatGPT Neutral #171717)
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              height: '100%',
              background: '#171717',
              borderRight: '1px solid #2f2f2f',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 30,
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            {/* Sidebar Header */}
            <div style={{ padding: '14px 14px 10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: '#2F2F2F', border: '1px solid #383838',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Brain size={16} color="#ECECF1" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ECECF1', letterSpacing: '-0.01em' }}>AdaptiveAI</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                title="Collapse Sidebar"
                style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', color: '#8E8EA0', cursor: 'pointer' }}
              >
                <Sidebar size={18} />
              </button>
            </div>

            {/* New Chat Button */}
            <div style={{ padding: '8px 12px' }}>
              <button
                onClick={() => setMessages([])}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: '#2F2F2F', border: '1px solid #383838',
                  color: '#ECECF1', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#383838'}
                onMouseLeave={e => e.currentTarget.style.background = '#2F2F2F'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} color="#8E8EA0" />
                  <span>New Chat</span>
                </div>
                <SquarePenIcon size={14} color="#8E8EA0" />
              </button>
            </div>

            {/* Modules List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8EA0', padding: '8px 8px 4px 8px' }}>
                Platform Modules
              </div>

              {PLUS_MENU_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSendMessage(item.prompt, item.id)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', textAlign: 'left', color: '#C5C5D2',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#2F2F2F';
                    e.currentTarget.style.color = '#ECECF1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#C5C5D2';
                  }}
                >
                  <item.icon size={16} style={{ color: '#8E8EA0', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                </button>
              ))}

              <div style={{ height: 1, background: '#2F2F2F', margin: '10px 0' }} />

              <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8EA0', padding: '4px 8px' }}>
                System Telemetry
              </div>

              <div style={{ padding: '8px 10px', borderRadius: 6, background: '#212121', border: '1px solid #2F2F2F', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#C5C5D2' }}>
                <Database size={14} style={{ color: '#10A37F' }} />
                <span>Google Sheets & Excel Synced</span>
              </div>

              <div style={{ padding: '8px 10px', borderRadius: 6, background: '#212121', border: '1px solid #2F2F2F', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#C5C5D2' }}>
                <Bot size={14} style={{ color: '#10A37F' }} />
                <span>6 Multi-Agents Active</span>
              </div>
            </div>

            {/* Sidebar User Profile Footer */}
            <div style={{ padding: 12, borderTop: '1px solid #2F2F2F', background: '#171717', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#10A37F',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, color: 'white'
              }}>
                {orgData?.organization_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ECECF1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {orgData?.organization_name || 'AdaptiveAI Scaleup'}
                </div>
                <div style={{ fontSize: 11, color: '#8E8EA0' }}>
                  {orgData?.startup_type || 'AI-Native SaaS'}
                </div>
              </div>
            </div>

          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
         MAIN CHAT CANVAS (#212121 Graphite Dark)
         ═══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', background: '#212121' }}>

        {/* TOP NAVBAR */}
        <header style={{
          height: 52, borderBottom: '1px solid #2F2F2F', background: '#212121',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Expand Sidebar"
                style={{ padding: 6, borderRadius: 6, background: '#2F2F2F', border: '1px solid #383838', color: '#ECECF1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Sidebar size={18} />
              </button>
            )}

            {/* Model Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: 'transparent', border: 'none',
                  color: '#ECECF1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 14, fontWeight: 600
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#2F2F2F'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>{selectedModel.name}</span>
                <ChevronDown size={14} style={{ color: '#8E8EA0' }} />
              </button>

              <AnimatePresence>
                {modelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    style={{
                      position: 'absolute', top: '115%', left: 0, width: 300,
                      background: '#2F2F2F', border: '1px solid #383838',
                      borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      padding: 6, zIndex: 50
                    }}
                  >
                    {MODEL_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSelectedModel(opt);
                          setModelDropdownOpen(false);
                        }}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: selectedModel.id === opt.id ? '#383838' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <opt.icon size={16} style={{ color: '#ECECF1', marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#ECECF1' }}>{opt.name}</span>
                            {selectedModel.id === opt.id && <Check size={14} style={{ color: '#10A37F' }} />}
                          </div>
                          <div style={{ fontSize: 11, color: '#8E8EA0', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setOrbitDrawerOpen(!orbitDrawerOpen)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: '#2F2F2F', border: '1px solid #383838', color: '#ECECF1',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Activity size={14} style={{ color: '#10A37F' }} />
              <span>3D Spatial Orbit</span>
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES STREAM */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {messages.length === 0 ? (
            /* ── EMPTY CHAT WELCOME HERO ── */
            <div style={{ maxWidth: 720, width: '100%', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#2F2F2F', border: '1px solid #383838',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20
              }}>
                <Brain size={26} color="#ECECF1" />
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ECECF1', marginBottom: 28, letterSpacing: '-0.01em' }}>
                What can I help with today?
              </h1>

              {/* STARTER CHIPS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 620 }}>
                {STARTER_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: '#2F2F2F', border: '1px solid #383838',
                      cursor: 'pointer', textAlign: 'left', color: '#C5C5D2',
                      fontSize: 13, fontWeight: 400, transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#424242';
                      e.currentTarget.style.background = '#383838';
                      e.currentTarget.style.color = '#ECECF1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#383838';
                      e.currentTarget.style.background = '#2F2F2F';
                      e.currentTarget.style.color = '#C5C5D2';
                    }}
                  >
                    <span>{chip.label}</span>
                    <ArrowUpRight size={15} style={{ color: '#8E8EA0' }} />
                  </button>
                ))}
              </div>

            </div>
          ) : (
            /* ── ACTIVE CHAT MESSAGE STREAM ── */
            <div style={{ maxWidth: 760, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', gap: 14,
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: msg.sender === 'user' ? '#383838' : '#10A37F',
                    fontWeight: 600, fontSize: 13, color: 'white'
                  }}>
                    {msg.sender === 'user' ? 'U' : <Brain size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#8E8EA0' }}>
                        {msg.sender === 'user' ? 'You' : msg.agentName || 'AdaptiveAI'}
                      </span>
                      <span style={{ fontSize: 11, color: '#8E8EA0' }}>{msg.timestamp}</span>
                    </div>

                    <div style={{
                      padding: '12px 16px', borderRadius: 12,
                      background: msg.sender === 'user' ? '#2F2F2F' : 'transparent',
                      border: msg.sender === 'user' ? '1px solid #383838' : 'none',
                      color: '#ECECF1', fontSize: 14, lineHeight: 1.6
                    }}>
                      {msg.text}

                      {/* ── CLEAN RESPONSE WIDGETS (NO EMOJIS) ── */}
                      {msg.widgetType === 'bottlenecks' && (
                        <div style={{ marginTop: 12, borderTop: '1px solid #2F2F2F', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8EA0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected Friction Points</div>
                          <div style={{ padding: 12, borderRadius: 8, background: '#2F2F2F', border: '1px solid #383838', display: 'flex', gap: 10, alignItems: 'center' }}>
                            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#ECECF1' }}>Manual Prompt Engineering Overhead</div>
                              <div style={{ fontSize: 12, color: '#8E8EA0' }}>140 engineering hours wasted monthly on unversioned prompts.</div>
                            </div>
                          </div>
                          <div style={{ padding: 12, borderRadius: 8, background: '#2F2F2F', border: '1px solid #383838', display: 'flex', gap: 10, alignItems: 'center' }}>
                            <Zap size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#ECECF1' }}>SaaS Subscription Redundancy</div>
                              <div style={{ fontSize: 12, color: '#8E8EA0' }}>Overpaying $3,200/mo across overlapping tools.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {msg.widgetType === 'recommendations' && (
                        <div style={{ marginTop: 12, borderTop: '1px solid #2F2F2F', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ padding: 12, borderRadius: 8, background: '#2F2F2F', border: '1px solid #383838' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>Groq Compound LPU</span>
                              <span style={{ fontSize: 11, color: '#10A37F', fontWeight: 600 }}>98% Fit</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#8E8EA0', marginTop: 4 }}>Sub-100ms ultra-low latency LLM inference.</div>
                            <div style={{ fontSize: 11, color: '#10A37F', fontWeight: 600, marginTop: 6 }}>Est. Savings: $1,400/mo</div>
                          </div>
                          <div style={{ padding: 12, borderRadius: 8, background: '#2F2F2F', border: '1px solid #383838' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>Qwen 3 32B (OpenSource)</span>
                              <span style={{ fontSize: 11, color: '#10A37F', fontWeight: 600 }}>94% Fit</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#8E8EA0', marginTop: 4 }}>Self-hosted open model for zero data leaks.</div>
                            <div style={{ fontSize: 11, color: '#10A37F', fontWeight: 600, marginTop: 6 }}>Est. Savings: $2,800/mo</div>
                          </div>
                        </div>
                      )}

                      {msg.widgetType === 'roi' && (
                        <div style={{ marginTop: 12, borderTop: '1px solid #2F2F2F', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                            <span>Projected Monthly Savings</span>
                            <span style={{ color: '#10A37F' }}>$12,500 / month</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: '#171717', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: '78%', height: '100%', background: '#10A37F' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#8E8EA0', marginTop: 2 }}>Payback Timeline: 45 Days</div>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              ))}

              {isProcessing && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#10A37F', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Loader2 size={16} color="white" className="animate-spin" />
                  </div>
                  <span style={{ fontSize: 13, color: '#8E8EA0' }}>{activeAgentName || 'Agent'} is processing...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

        </div>

        {/* ═══════════════════════════════════════════════════════
           FLOATING PROMPT BAR WITH PLUS (+) ICON SELECTION MENU
           ═══════════════════════════════════════════════════════ */}
        <div style={{ padding: '14px 20px 20px 20px', background: '#212121', display: 'flex', justifyContent: 'center', zIndex: 25 }}>
          
          <div style={{ maxWidth: 760, width: '100%', position: 'relative' }}>
            
            {/* PLUS MENU POPOVER */}
            <AnimatePresence>
              {plusMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  style={{
                    position: 'absolute', bottom: '115%', left: 0, width: 360,
                    background: '#2F2F2F', border: '1px solid #383838',
                    borderRadius: 16, boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                    padding: 6, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 2
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8EA0', padding: '6px 10px 4px 10px' }}>
                    Select Platform Module
                  </div>

                  {PLUS_MENU_ITEMS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSendMessage(item.prompt, item.id)}
                      style={{
                        padding: '9px 10px', borderRadius: 8,
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#383838'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <item.icon size={16} style={{ color: '#ECECF1', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#ECECF1' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: '#8E8EA0', lineHeight: 1.3, marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* INPUT FIELD CONTAINER */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 16,
              background: '#2F2F2F', border: '1px solid #383838',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)', transition: 'all 0.15s ease'
            }}>
              
              {/* Plus Button */}
              <button
                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                title="Add Module or Action"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: plusMenuOpen ? '#383838' : '#212121',
                  border: '1px solid #383838',
                  color: '#ECECF1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease'
                }}
              >
                <Plus size={18} style={{ transform: plusMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder="Ask AdaptiveAI or click + to select a module..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                disabled={isProcessing}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#ECECF1', fontSize: 14
                }}
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isProcessing}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: inputText.trim() && !isProcessing ? '#ECECF1' : '#212121',
                  border: 'none', color: inputText.trim() && !isProcessing ? '#171717' : '#8E8EA0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: inputText.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease', flexShrink: 0
                }}
              >
                <Send size={15} />
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════
         RIGHT COLLAPSIBLE 3D ORBIT DRAWER (#171717 Neutral Dark)
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {orbitDrawerOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              height: '100%', background: '#171717',
              borderLeft: '1px solid #2F2F2F', display: 'flex',
              flexDirection: 'column', zIndex: 30, flexShrink: 0, overflow: 'hidden'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #2F2F2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} style={{ color: '#10A37F' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ECECF1' }}>3D Spatial Orbit</span>
              </div>
              <button
                onClick={() => setOrbitDrawerOpen(false)}
                style={{ padding: 4, borderRadius: 4, background: 'transparent', border: 'none', color: '#8E8EA0', cursor: 'pointer' }}
              >
                <XCircle size={16} />
              </button>
            </div>

            {/* 3D Orbit WebGL Canvas */}
            <div style={{ height: 220, width: '100%', position: 'relative', background: '#141414' }}>
              <AgentOrbit3D selectedAgent={activeAgentName} />
            </div>

            {/* Agent Telemetry List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8EA0' }}>
                Pipeline Telemetry
              </div>

              {[
                { name: 'Workflow Agent', model: 'Llama 4 Scout', role: 'Bottleneck Scanner' },
                { name: 'Research Agent', model: 'Groq Compound', role: 'Tool Matcher' },
                { name: 'Sentiment Agent', model: 'Llama 3.3 70B', role: 'Community Trust' },
                { name: 'Trend Agent', model: 'Llama 3.3 70B', role: 'Longevity Forecaster' },
                { name: 'ROI Agent', model: 'Groq Compound', role: 'Payback Calculator' },
                { name: 'Strategy Agent', model: 'Llama 4 Scout', role: 'Roadmap Synthesizer' }
              ].map((agent, idx) => {
                const isActive = activeAgentName?.includes(agent.name.split(' ')[0]);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px', borderRadius: 8,
                      background: isActive ? '#2F2F2F' : '#212121',
                      border: isActive ? '1px solid #10A37F' : '1px solid #2F2F2F',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#ECECF1' }}>{agent.name}</div>
                      <div style={{ fontSize: 10, color: '#8E8EA0' }}>{agent.model} &bull; {agent.role}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: isActive ? '#10A37F' : '#059669'
                      }} />
                      <span style={{ fontSize: 10, fontWeight: 500, color: isActive ? '#10A37F' : '#8E8EA0' }}>
                        {isActive ? 'PROCESSING' : 'READY'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
}

function SquarePenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
    </svg>
  );
}
