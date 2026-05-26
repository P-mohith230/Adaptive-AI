'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Mail, Lock, User, Building2, Briefcase,
  ArrowRight, Sparkles, AlertCircle, Loader2, CheckCircle, Terminal
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';
import { authAPI, orgAPI } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setOrganization, isAuthenticated } = useAppStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>('Ready to authenticate with Adaptive AI Layer.');

  // Available startups fetched from backend
  const [existingStartups, setExistingStartups] = useState<any[]>([]);
  const [startupMode, setStartupMode] = useState<'existing' | 'new'>('existing');

  // Form states
  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    organization_id: '',
    new_organization_name: '',
    startup_type: '',
    team_size: 10,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Fetch registered organizations
  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const data = await orgAPI.list();
        setExistingStartups(data || []);
        if (data && data.length > 0) {
          setSignupForm(prev => ({ ...prev, organization_id: data[0].organization_id }));
        }
      } catch (err) {
        console.error('Failed to load startups:', err);
        // Fallback preloads if backend fails or empty
        const fallbacks = [
          { organization_id: 'org_3a67c3641794', organization_name: 'skillup', startup_type: 'Fintech' },
          { organization_id: 'org_c2fd924032cb', organization_name: 'jhj', startup_type: 'SaaS' },
          { organization_id: 'org_c8007ceb1f9f', organization_name: 'hmbhj', startup_type: 'HealthTech' }
        ];
        setExistingStartups(fallbacks);
        setSignupForm(prev => ({ ...prev, organization_id: fallbacks[0].organization_id }));
      }
    };
    fetchStartups();
  }, []);

  const handleSigninSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signinForm.email || !signinForm.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugLog('Establishing connection to multi-agent security pipeline...');

    try {
      setTimeout(() => setDebugLog('Verifying user credentials with USERS_MASTER...'), 600);
      const res = await authAPI.login({
        email: signinForm.email,
        password: signinForm.password,
      });

      setTimeout(() => setDebugLog('Session authorized! Allocating secure JWT token...'), 1200);
      
      // Store auth session
      setAuth(res.user, res.access_token);
      
      if (res.user.organization_id) {
        setOrganization(res.user.organization_id);
      }

      setSuccess('Access authorized. Welcome back!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1800);

    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setDebugLog('Connection aborted: verification failed.');
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { name, email, password, role, organization_id, new_organization_name, startup_type, team_size } = signupForm;

    if (!name || !email || !password) {
      setError('Please fill in all required user profile fields.');
      return;
    }

    if (startupMode === 'new' && !new_organization_name) {
      setError('Please provide a startup name.');
      return;
    }

    setLoading(true);
    setDebugLog('Initializing registration handshake...');

    try {
      let finalOrgId = organization_id;

      // 1. Create a new organization if the user wants to register one
      if (startupMode === 'new') {
        setDebugLog('Registering new organization in ORGANIZATIONS_MASTER...');
        const newOrg = await orgAPI.create({
          organization_name: new_organization_name,
          startup_type,
          team_size,
        });
        finalOrgId = newOrg.organization_id;
        setOrganization(finalOrgId, newOrg);
        setDebugLog(`Startup "${new_organization_name}" created successfully.`);
      }

      // 2. Register the user account
      setTimeout(() => setDebugLog('Recording user credentials to USERS_MASTER...'), 600);
      const userRes = await authAPI.signup({
        name,
        email,
        password,
        role,
        organization_id: finalOrgId || undefined,
      });

      // 3. Log them in automatically
      setTimeout(() => setDebugLog('handshake completed! Logged in as: ' + email), 1200);
      setAuth(userRes.user, userRes.access_token);
      if (finalOrgId) {
        setOrganization(finalOrgId);
      }

      setSuccess('Account created successfully!');
      
      setTimeout(() => {
        if (startupMode === 'new') {
          // New startups go to the 6-step assessment onboarding flow
          router.push('/onboarding');
        } else {
          // Existing startups go straight to dashboard
          router.push('/dashboard');
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setDebugLog('Handshake aborted: ' + (err.message || 'error'));
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6
  };

  return (
    <div className="grid-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* Background glow orb */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(60px)', top: '10%', left: '15%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', filter: 'blur(50px)', bottom: '15%', right: '15%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 10 }}>
        
        {/* Logo Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <motion.div 
            animate={{ rotate: [0, 360] }} 
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))', marginBottom: 12, boxShadow: 'var(--glow-primary)' }}
          >
            <Brain size={26} color="white" />
          </motion.div>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AdaptiveAI</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>The Intelligence Layer Above the AI Ecosystem</span>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-card" style={{ padding: 32, border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24 }}>
            {(['signin', 'signup'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab ? '1px solid var(--border-light)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* Errors & Success */}
              {error && (
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', display: 'flex', gap: 10, fontSize: 13, marginBottom: 20, alignItems: 'center' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--success)', display: 'flex', gap: 10, fontSize: 13, marginBottom: 20, alignItems: 'center' }}>
                  <CheckCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{success}</span>
                </div>
              )}

              {activeTab === 'signin' ? (
                /* ── SIGN IN FORM ── */
                <form onSubmit={handleSigninSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={labelStyle}><Mail size={14} /> Email Address</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="you@startup.com"
                      value={signinForm.email}
                      onChange={e => setSigninForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}><Lock size={14} /> Password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••"
                      value={signinForm.password}
                      onChange={e => setSigninForm(prev => ({ ...prev, password: e.target.value }))}
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ marginTop: 8, padding: '14px 0', fontSize: 14, width: '100%', gap: 8 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Authenticate Session <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              ) : (
                /* ── SIGN UP FORM ── */
                <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}><User size={14} /> Full Name</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Founder's Name"
                        value={signupForm.name}
                        onChange={e => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}><Briefcase size={14} /> Corporate Role</label>
                      <select
                        className="input-field"
                        value={signupForm.role}
                        onChange={e => setSignupForm(prev => ({ ...prev, role: e.target.value }))}
                        disabled={loading}
                        style={{ height: '100%', padding: '12px 14px' }}
                      >
                        <option value="admin">Founder / CEO</option>
                        <option value="member">CTO / Technical Leader</option>
                        <option value="viewer">Operations / Product Lead</option>
                        <option value="analyst">Financial Analyst</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}><Mail size={14} /> Corporate Email</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="name@startup.com"
                      value={signupForm.email}
                      onChange={e => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}><Lock size={14} /> Secure Password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Minimum 6 characters"
                      value={signupForm.password}
                      onChange={e => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                      disabled={loading}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: startupMode === 'existing' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="startupMode"
                          checked={startupMode === 'existing'}
                          onChange={() => setStartupMode('existing')}
                          disabled={loading}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        Link Existing Startup
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: startupMode === 'new' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="startupMode"
                          checked={startupMode === 'new'}
                          onChange={() => setStartupMode('new')}
                          disabled={loading}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        Register New Startup
                      </label>
                    </div>

                    {startupMode === 'existing' ? (
                      <div>
                        <label style={labelStyle}><Building2 size={14} /> Select Preloaded Startup</label>
                        <select
                          className="input-field"
                          value={signupForm.organization_id}
                          onChange={e => setSignupForm(prev => ({ ...prev, organization_id: e.target.value }))}
                          disabled={loading}
                        >
                          {existingStartups.map(org => (
                            <option key={org.organization_id} value={org.organization_id}>
                              {org.organization_name}
                            </option>
                          ))}
                        </select>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Linking your user profile to a pre-populated Excel database mock startup.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={labelStyle}><Building2 size={14} /> Startup Name</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., Acme Innovations"
                            value={signupForm.new_organization_name}
                            onChange={e => setSignupForm(prev => ({ ...prev, new_organization_name: e.target.value }))}
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}><Briefcase size={14} /> Team Size</label>
                          <input
                            type="number"
                            className="input-field"
                            value={signupForm.team_size}
                            onChange={e => setSignupForm(prev => ({ ...prev, team_size: parseInt(e.target.value) || 10 }))}
                            disabled={loading}
                            min={1}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={12} /> Automatically forwards to onboarding setup flow.
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ marginTop: 8, padding: '14px 0', fontSize: 14, width: '100%', gap: 8 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Provision Organization Profile <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Futuristic Terminal Debug Log */}
        <div style={{ marginTop: 20, padding: 14, borderRadius: 'var(--radius-lg)', background: 'rgba(9,9,11,0.95)', border: '1px solid var(--border)', fontFamily: 'Geist Mono, JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent)', display: 'flex', gap: 8, alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <Terminal size={14} style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>[sys_status]:</span>
            <span className="pulse-glow">{debugLog}</span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
