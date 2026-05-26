'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Brain, TrendingUp, Shield, Layers, ArrowRight,
  Activity, Network, Sparkles, ChevronRight, Globe,
  Cpu, BarChart3, Zap, Eye
} from 'lucide-react';

// ── Lazy load the 3D scene (heavy) to avoid SSR issues ──
const HeroScene3D = dynamic(() => import('@/components/HeroScene3D'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
  ),
});

/* ═══════════════════════════════════════════════════════
   GSAP TEXT ANIMATION COMPONENT
   ═══════════════════════════════════════════════════════ */
function GSAPTextReveal({ text, tag = 'h2', className, style }: {
  text: string; tag?: string; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let ctx: any;
    const initGSAP = async () => {
      try {
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default;

        if (!ref.current) return;
        const target = ref.current.querySelector('.gsap-target');
        if (!target) return;

        const chars = target.querySelectorAll('.reveal-char');

        ctx = gsap.context(() => {
          gsap.from(chars, {
            opacity: 0,
            y: 50,
            rotateX: -90,
            stagger: 0.015,
            duration: 0.6,
            ease: 'back.out(1.5)',
          });
        }, ref);
      } catch (e) {
        console.error("GSAP text reveal failed:", e);
      }
    };
    initGSAP();
    return () => ctx?.revert();
  }, [isInView, text]);

  const Tag = tag as any;
  const words = text.split(' ');

  return (
    <div ref={ref} style={{ perspective: '1000px' }}>
      <Tag className={`gsap-target ${className || ''}`} style={style}>
        {words.filter(Boolean).map((word, i) => (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.25em' }}>
            {Array.from(word).map((char, j) => (
              <span
                key={j}
                className="reveal-char"
                style={{ display: 'inline-block', transformOrigin: '50% 50% -40px', transformStyle: 'preserve-3d' }}
              >
                {char}
              </span>
            ))}
          </span>
        ))}
      </Tag>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GSAP KEYWORD REVEAL — Words animate with rotations,
   scale changes, and directional slides. Key words get
   special gradient emphasis and attention effects.
   ═══════════════════════════════════════════════════════ */
const KEY_WORDS = new Set([
  'ai', 'agents', 'intelligence', 'evolution', 'infrastructure',
  'reasoning', 'transformation', 'platform', 'organizational',
  'multi-agent', 'workflow', 'strategy', 'future', 'adaptive',
  'market', 'design', 'organization', 'recommend', 'evolves',
  'specialized', 'continuously', 'architecture', 'optimize',
]);

function GSAPKeywordReveal({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let ctx: any;
    const init = async () => {
      try {
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default;

        if (!ref.current) return;

        ctx = gsap.context(() => {
          // Select only regular word containers
          const regularWords = ref.current!.querySelectorAll('.kw-regular');
          
          // Animate words from left to right (staggered)
          gsap.from(regularWords, {
            opacity: 0,
            x: -25,
            scale: 0.8,
            duration: 0.6,
            stagger: 0.015,
            ease: 'power2.out',
          });

          // For each key word, animate its letters with rotations and size changes
          const keyWords = ref.current!.querySelectorAll('.kw-key');
          keyWords.forEach((wordEl, i) => {
            const letters = wordEl.querySelectorAll('.kw-letter');
            
            // Letter entry animation: rotations and scale
            gsap.from(letters, {
              opacity: 0,
              scale: 0.4,
              rotateY: 180,
              rotateX: 90,
              y: 15,
              stagger: 0.03,
              duration: 0.5,
              ease: 'back.out(1.8)',
              delay: i * 0.08,
            });

            // Attention getter: handled via CSS class scale-pulse to avoid JS ticker overhead
          });

        }, ref);
      } catch (e) {
        console.error("GSAP keyword reveal failed:", e);
      }
    };
    init();
    return () => ctx?.revert();
  }, [isInView, text]);

  const words = text.split(' ');

  return (
    <div style={{ perspective: '1000px', display: 'flex', justifyContent: 'center' }}>
      <p
        ref={ref}
        style={{
          fontSize: 'clamp(1.1rem, 1.5vw, 1.35rem)',
          color: 'var(--text-secondary)',
          lineHeight: 2.0,
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {words.filter(Boolean).map((word, i) => {
          const cleanWord = word.replace(/[.,!?—;:'"()]/g, '').toLowerCase();
          const isKey = KEY_WORDS.has(cleanWord);

          if (isKey) {
            const letters = Array.from(word);
            return (
              <span
                key={i}
                className="kw-key scale-pulse"
                style={{
                  display: 'inline-block',
                  marginRight: '0.35em',
                  transformStyle: 'preserve-3d',
                  fontWeight: 700,
                  fontSize: '1.15em',
                  animationDelay: `-${((i * 0.23) % 2.0).toFixed(2)}s`,
                }}
              >
                {letters.map((char, j) => (
                  <span
                    key={j}
                    className="kw-letter"
                    style={{
                      display: 'inline-block',
                      transformStyle: 'preserve-3d',
                      background: 'linear-gradient(135deg, var(--primary-light), var(--accent))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            );
          }

          return (
            <span
              key={i}
              className="kw-regular"
              style={{
                display: 'inline-block',
                marginRight: '0.35em',
              }}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GRID FEATURE SECTION
   ═══════════════════════════════════════════════════════ */
function HorizontalScrollFeatures({ features }: { features: any[] }) {
  return (
    <div style={{ position: 'relative', zIndex: 20, background: 'var(--bg-primary)', padding: '100px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Title Block */}
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Six Intelligence Systems. One Platform.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 620, margin: '0 auto' }}>
            AdaptiveAI doesn&apos;t just recommend tools — it designs the future operational structure of your organization using AI.
          </p>
        </div>

        {/* Responsive Grid Wrapper */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {features.map((f, i) => (
            <FeatureCard3D key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D TILT FEATURE CARD
   ═══════════════════════════════════════════════════════ */
function FeatureCard3D({ icon: Icon, title, description, color, index }: {
  icon: any; title: string; description: string; color: string; index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 250, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 250, damping: 25 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    rotateY.set(x * 20);
    rotateX.set(y * -20);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={() => { rotateX.set(0); rotateY.set(0); }}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformPerspective: 800,
        transformStyle: 'preserve-3d',
        minWidth: 340,
        maxWidth: 340,
        flexShrink: 0,
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow gradient at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }} />

        {/* Hover glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 160, height: 160,
          borderRadius: '50%', background: `${color}10`,
          filter: 'blur(40px)', transform: 'translateZ(-10px)',
        }} />

        <div style={{
          width: 52, height: 52, borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, background: `${color}15`, border: `1px solid ${color}30`,
        }}>
          <Icon size={24} style={{ color }} />
        </div>

        <h3 style={{
          fontSize: 19, fontWeight: 700, marginBottom: 10,
          color: 'var(--text-primary)',
        }}>{title}</h3>

        <p style={{
          fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7,
        }}>{description}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAGNETIC BUTTON
   ═══════════════════════════════════════════════════════ */
function MagneticButton({ children, href, className, style }: {
  children: React.ReactNode; href: string; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };

  return (
    <motion.a ref={ref} href={href} className={className}
      style={{ ...style, x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileTap={{ scale: 0.95 }}
    >{children}</motion.a>
  );
}

/* ═══════════════════════════════════════════════════════
   SCROLL COUNTER
   ═══════════════════════════════════════════════════════ */
function ScrollCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] }}
      style={{ textAlign: 'center' }}
    >
      <div className="gradient-text" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1 }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP CARD
   ═══════════════════════════════════════════════════════ */
function StepCard({ step, title, desc, index }: { step: string; title: string; desc: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 60, rotateY: -25, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, rotateY: 0, scale: 1 } : {}}
      transition={{ delay: index * 0.15, duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
      style={{ padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-card)', transformPerspective: 800 }}
    >
      <div className="gradient-text" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, marginBottom: 16 }}>{step}</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 3,
      background: 'linear-gradient(90deg, var(--primary), var(--accent))',
      transformOrigin: '0%', scaleX, zIndex: 100,
    }} />
  );
}

/* ═══════════════════════════════════════════════════════
   MARKET PULSE TICKER
   ═══════════════════════════════════════════════════════ */
function MarketPulse() {
  const tools = [
    { name: 'Cursor', trend: '+42%' }, { name: 'Claude', trend: '+38%' },
    { name: 'v0.dev', trend: '+55%' }, { name: 'Bolt.new', trend: '+48%' },
    { name: 'Perplexity', trend: '+35%' }, { name: 'Linear', trend: '+18%' },
    { name: 'Notion AI', trend: '+22%' }, { name: 'n8n', trend: '+31%' },
  ];
  return (
    <div style={{ overflow: 'hidden', flex: 1 }}>
      <div className="animate-marquee" style={{ display: 'flex', gap: 12, width: 'max-content' }}>
        {[...tools, ...tools].map((tool, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{tool.name}</span>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{tool.trend}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════ */
function CTASection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [15, 0]);

  return (
    <motion.div ref={ref} style={{ scale, opacity, rotateX, transformPerspective: 1200 }} className="glass-card">
      <div style={{ padding: '64px 48px', textAlign: 'center' }}>
        <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
          <Globe size={44} style={{ color: 'var(--primary-light)', margin: '0 auto 24px' }} />
        </motion.div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 14 }}>
          Ready to evolve your AI infrastructure?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Stop guessing which AI tools to adopt. Let AdaptiveAI design your organization&apos;s AI future.
        </p>
        <MagneticButton href="/onboarding" className="btn-primary" style={{ padding: '18px 44px', fontSize: 17 }}>
          Begin Your AI Transformation <ArrowRight size={20} />
        </MagneticButton>
      </div>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════
   ANTI-GRAVITY INTERACTIVE CURSOR DISTRACTION
   ═══════════════════════════════════════════════════════ */
function AntiGravityCursorDistraction() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      homeX: number;
      homeY: number;
      radius: number;
      color: string;
    }

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const spacing = 45;
      const pad = 20;

      for (let x = pad; x < width; x += spacing) {
        for (let y = pad; y < height; y += spacing) {
          const isPrimary = Math.random() > 0.5;
          const color = isPrimary 
            ? 'rgba(139, 92, 246, 0.15)'
            : 'rgba(0, 229, 168, 0.12)';
            
          particles.push({
            x,
            y,
            homeX: x,
            homeY: y,
            radius: Math.random() * 1.5 + 1.0,
            color,
          });
        }
      }
    };

    initParticles();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const repelRadius = 180; // Large, immersive radius of effect
      const maxRepelDist = 140; // Heavily pushes dots far away
      const ease = 0.12; // Fluid and snappy anti-gravity movement

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = p.homeX;
        let targetY = p.homeY;

        if (dist < repelRadius && dist > 0) {
          // Non-linear power scaling makes repulsion aggressively strong near the cursor center
          const force = Math.pow((repelRadius - dist) / repelRadius, 1.3);
          const repelX = (dx / dist) * force * maxRepelDist;
          const repelY = (dy / dist) * force * maxRepelDist;

          targetX = p.homeX + repelX;
          targetY = p.homeY + repelY;
        }

        p.x += (targetX - p.x) * ease;
        p.y += (targetY - p.y) * ease;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        if (dist < repelRadius + 20) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = p.color.includes('139') ? '#8B5CF6' : '#00E5A8';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.85,
      }}
    />
  );
}


/* ═══════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const features = [
    { icon: Brain, title: 'Multi-Agent Reasoning', color: '#8B5CF6', description: 'Six specialized AI agents analyze your workflows, research tools, assess sentiment, track trends, estimate ROI, and synthesize strategic recommendations.' },
    { icon: Activity, title: 'AI Market Intelligence', color: '#00E5A8', description: 'Real-time monitoring of Reddit, GitHub, ProductHunt, and news to track AI ecosystem velocity, sentiment, and emerging tools.' },
    { icon: Layers, title: 'AI Stack Architecture', color: '#3B82F6', description: 'Generates optimized AI tool stacks with compatibility scoring, workflow alignment, and organizational AI roadmaps.' },
    { icon: TrendingUp, title: 'AI Evolution Engine', color: '#F59E0B', description: 'Predicts future AI needs, detects obsolete tools, and recommends infrastructure evolution before your stack falls behind.' },
    { icon: Network, title: 'Digital Twin', color: '#22C55E', description: 'Creates a virtual intelligence model of your organization\'s AI infrastructure, mapping workflows, bottlenecks, and optimization potential.' },
    { icon: Shield, title: 'Trust & Security Index', color: '#EF4444', description: 'Composite trust scoring factoring community sentiment, development activity, security posture, and market momentum.' },
  ];

  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(heroScroll, [0, 1], [0, -150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <ScrollProgress />
      <AntiGravityCursorDistraction />

      {/* ── Navbar ─────────────────────────────── */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(20px)' }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
            ><Brain size={20} color="white" /></motion.div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>AdaptiveAI</span>
            <span className="glow-badge primary" style={{ fontSize: 10 }}>BETA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard" className="btn-secondary" style={{ padding: '8px 20px', fontSize: 13 }}>Dashboard</Link>
            <MagneticButton href="/onboarding" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
              Get Started <ArrowRight size={14} />
            </MagneticButton>
          </div>
        </div>
      </motion.nav>

      {/* ── Market Ticker ─────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: 61, borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, height: 40 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            Live AI Market
          </span>
          <MarketPulse />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          3D HERO SECTION
          ═══════════════════════════════════════════ */}
      <motion.section ref={heroRef} style={{ position: 'relative', zIndex: 10, y: heroY, opacity: heroOpacity, willChange: 'transform, opacity' }}>
        <div style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

          {/* 3D Background Scene */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <Suspense fallback={null}>
              <HeroScene3D />
            </Suspense>
          </div>

          {/* Hero Content — Clean: just badge + counters over the 3D scene */}
          <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center', width: '100%' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 24px', borderRadius: 100, border: '1px solid var(--border)', background: 'rgba(17,17,20,0.6)', backdropFilter: 'blur(10px)', marginBottom: 40 }}
            >
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>The Intelligence Layer Above the AI Ecosystem</span>
            </motion.div>

            <div style={{ height: 240 }} />{/* Spacer to let the 3D scene breathe */}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, maxWidth: 750, margin: '0 auto' }}>
              <ScrollCounter value={150} suffix="+" label="AI Tools Tracked" />
              <ScrollCounter value={6} label="Reasoning Agents" />
              <ScrollCounter value={8} label="Intelligence Sources" />
              <ScrollCounter value={340} suffix="%" label="Avg. ROI Gain" />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════
          GSAP TEXT REVEAL SECTION
          ═══════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
        <GSAPTextReveal text="Built for organizational AI evolution" tag="h2" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 24 }} />
        <GSAPKeywordReveal text="AdaptiveAI doesn't just recommend tools. It designs the future operational structure of your organization using six specialized AI agents, real-time market intelligence, and continuous workflow analysis. Each word you're reading right now reveals as you scroll — just like how your AI strategy should unfold: progressively, intelligently, and with purpose." />
      </section>

      {/* ═══════════════════════════════════════════
          HORIZONTAL SCROLL FEATURES (GSAP Pinned)
          ═══════════════════════════════════════════ */}
      <HorizontalScrollFeatures features={features} />

      {/* ═══════════════════════════════════════════
          HOW IT WORKS (3D Perspective Cards)
          ═══════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <GSAPTextReveal text="From Assessment to Transformation" tag="h2" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { step: '01', title: 'AI Assessment', desc: 'Tell us about your org, workflows, and pain points through our intelligent 6-step onboarding.' },
            { step: '02', title: 'Agent Analysis', desc: 'Six specialized agents analyze your data: workflows, tools, sentiment, trends, ROI, and strategy.' },
            { step: '03', title: 'Intelligence Dashboard', desc: 'View your organizational AI maturity, recommended stacks, market intelligence, and alerts.' },
            { step: '04', title: 'Continuous Evolution', desc: 'Receive ongoing alerts as AI markets shift. Your recommendations adapt as your org evolves.' },
          ].map((item, i) => (
            <StepCard key={item.step} {...item} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FINAL CTA — Hero text moved here
          ═══════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 24px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <GSAPTextReveal text="What should your organization become using AI?" tag="h2" style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 28,
          }} />

          <GSAPKeywordReveal text="AdaptiveAI continuously evolves your AI infrastructure through multi-agent reasoning, market intelligence, and workflow analysis. Not a tool finder — an organizational AI transformation platform. Stop guessing which AI tools to adopt. Let AdaptiveAI design your organization's AI future." />

          <div style={{ marginTop: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <MagneticButton href="/onboarding" className="btn-primary" style={{ padding: '20px 48px', fontSize: 18 }}>
              Start AI Assessment <ArrowRight size={20} />
            </MagneticButton>
            <MagneticButton href="/dashboard" className="btn-secondary" style={{ padding: '20px 48px', fontSize: 18 }}>
              View Demo Dashboard <ChevronRight size={20} />
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ── Footer ─── */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid var(--border)', padding: '24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} style={{ color: 'var(--primary-light)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>AdaptiveAI &copy; 2025</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>The Intelligence Layer Above the AI Ecosystem</span>
        </div>
      </footer>
    </div>
  );
}
