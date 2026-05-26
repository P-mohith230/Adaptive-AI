import { create } from 'zustand';

interface User {
  user_id: string;
  name: string;
  email: string;
  role: string;
  organization_id?: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Organization
  organizationId: string | null;
  organizationData: any | null;
  
  // Dashboard
  dashboardData: any | null;
  recommendations: any[];
  alerts: any[];
  marketTrends: any | null;
  
  // UI
  sidebarOpen: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setOrganization: (orgId: string, data?: any) => void;
  setDashboardData: (data: any) => void;
  setRecommendations: (recs: any[]) => void;
  setAlerts: (alerts: any[]) => void;
  setMarketTrends: (trends: any) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  hydrateFromStorage: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state — always starts empty to prevent SSR hydration mismatches.
  // Call hydrateFromStorage() in a client-side useEffect to load persisted state.
  user: null,
  token: null,
  isAuthenticated: false,
  organizationId: null,
  organizationData: null,
  dashboardData: null,
  recommendations: [],
  alerts: [],
  marketTrends: null,
  sidebarOpen: true,
  isLoading: false,
  
  // Actions
  setAuth: (user, token) => {
    localStorage.setItem('adaptiveai_token', token);
    if (user.organization_id) {
      localStorage.setItem('adaptiveai_org_id', user.organization_id);
    }
    set({ user, token, isAuthenticated: true, organizationId: user.organization_id || null });
  },
  
  logout: () => {
    localStorage.removeItem('adaptiveai_token');
    localStorage.removeItem('adaptiveai_org_id');
    set({ user: null, token: null, isAuthenticated: false, organizationId: null, organizationData: null });
  },
  
  setOrganization: (orgId, data) => {
    localStorage.setItem('adaptiveai_org_id', orgId);
    set({ organizationId: orgId, organizationData: data || null });
  },
  
  setDashboardData: (data) => set({ dashboardData: data }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  setAlerts: (alerts) => set({ alerts }),
  setMarketTrends: (trends) => set({ marketTrends: trends }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adaptiveai_token');
    const orgId = localStorage.getItem('adaptiveai_org_id');
    if (token) {
      set({ token, isAuthenticated: true, organizationId: orgId || null });
    }
  },
}));
