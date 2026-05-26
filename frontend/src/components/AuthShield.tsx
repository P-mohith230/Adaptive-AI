'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';
import { authAPI } from '@/lib/api/client';

const PROTECTED_ROUTES = ['/dashboard', '/onboarding', '/consultant', '/market', '/agents'];
const PUBLIC_ONLY_ROUTES = ['/login'];

export default function AuthShield({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, setAuth, logout } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('adaptiveai_token');
      const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
      const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route));

      // 1. If we have a local token but store is not authenticated, sync session first
      if (token && !isAuthenticated) {
        try {
          const profile = await authAPI.getMe();
          setAuth(profile, token);
        } catch (err) {
          console.error('Session sync failed:', err);
          logout();
          if (isProtectedRoute) {
            router.push('/login');
          }
        }
      }

      // Re-read authenticated state after sync check
      const authed = !!token || isAuthenticated;

      // 2. Perform path security routing
      if (isProtectedRoute && !authed) {
        router.push('/login');
      } else if (isPublicOnlyRoute && authed) {
        router.push('/dashboard');
      } else {
        setChecking(false);
      }
    };

    verifySession();
  }, [pathname, isAuthenticated, router, setAuth, logout]);

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            boxShadow: 'var(--glow-primary)'
          }}
        >
          <Brain size={28} color="white" />
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Synchronizing security credentials...</span>
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

  return <>{children}</>;
}
