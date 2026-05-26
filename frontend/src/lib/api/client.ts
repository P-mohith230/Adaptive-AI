const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8caff.up.railway.app/api/v1';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('adaptiveai_token') : null;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    let errMsg = 'Request failed';
    if (error && error.detail) {
      if (typeof error.detail === 'string') {
        errMsg = error.detail;
      } else if (Array.isArray(error.detail)) {
        // Formats FastAPI validation error lists, e.g. "body.password: field required"
        errMsg = error.detail.map((err: any) => `${err.loc.slice(1).join('.')}: ${err.msg}`).join(', ');
      } else {
        errMsg = JSON.stringify(error.detail);
      }
    } else {
      errMsg = `HTTP ${res.status}`;
    }
    throw new Error(errMsg);
  }
  
  return res.json();
}

// ── Auth API ────────────────────────────────────────
export const authAPI = {
  signup: (data: { name: string; email: string; password: string; role?: string; organization_id?: string }) =>
    request<any>('/auth/signup', { method: 'POST', body: data }),
  
  login: (data: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: data }),
  
  getMe: () => request<any>('/auth/me'),
};

// ── Organization API ────────────────────────────────
export const orgAPI = {
  create: (data: any) =>
    request<any>('/organizations', { method: 'POST', body: data }),
  
  get: (orgId: string) =>
    request<any>(`/organizations/${orgId}`),
  
  list: () => request<any[]>('/organizations'),
  
  onboard: (orgId: string, data: any) =>
    request<any>(`/organizations/${orgId}/onboard`, { method: 'POST', body: data }),
  
  getDashboard: (orgId: string) =>
    request<any>(`/organizations/${orgId}/dashboard`),

  update: (orgId: string, data: any) =>
    request<any>(`/organizations/${orgId}`, { method: 'PUT', body: data }),
};

// ── Agent API ───────────────────────────────────────
export const agentAPI = {
  consult: (data: { message: string; organization_id: string; conversation_context?: string }) =>
    request<any>('/agents/consult', { method: 'POST', body: data }),
  
  fullAnalysis: (orgId: string) =>
    request<any>(`/agents/analyze/${orgId}`, { method: 'POST' }),
  
  getReasoningHistory: (orgId: string) =>
    request<any>(`/agents/reasoning/${orgId}`),
};

// ── Recommendation API ──────────────────────────────
export const recommendationAPI = {
  generate: (orgId: string) =>
    request<any>('/recommendations/generate', { method: 'POST', body: { organization_id: orgId } }),
  
  getAll: (orgId: string) =>
    request<any[]>(`/recommendations/${orgId}`),
  
  getLatest: (orgId: string) =>
    request<any>(`/recommendations/${orgId}/latest`),
};

// ── Alert API ───────────────────────────────────────
export const alertAPI = {
  getAll: (orgId: string) =>
    request<any[]>(`/alerts/${orgId}`),
  
  dismiss: (alertId: string) =>
    request<any>(`/alerts/${alertId}/dismiss`, { method: 'PUT' }),
  
  getSummary: (orgId: string) =>
    request<any>(`/alerts/${orgId}/summary`),

  newsCheck: (orgId: string) =>
    request<any[]>(`/alerts/${orgId}/news-check`, { method: 'POST' }),
};

// ── Market API ──────────────────────────────────────
export const marketAPI = {
  getTrends: () => request<any>('/market/trends'),
  getHeatmap: () => request<any>('/market/heatmap'),
  crawl: (orgId: string) => request<any>(`/market/crawl/${orgId}`, { method: 'POST' }),
  getTools: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<any[]>(`/market/tools${qs ? `?${qs}` : ''}`);
  },
  getTool: (toolId: string) => request<any>(`/market/tools/${toolId}`),
  getCategories: () => request<any[]>('/market/categories'),
  getToolTrust: (toolId: string) => request<any>(`/market/tools/${toolId}/trust`),
};

// ── Intelligence API ────────────────────────────────
export const intelligenceAPI = {
  getDigitalTwin: (orgId: string) =>
    request<any>(`/intelligence/twin/${orgId}`),
  
  getEvolution: (orgId: string) =>
    request<any>(`/intelligence/evolution/${orgId}`),
  
  getObsolescence: (orgId: string) =>
    request<any>(`/intelligence/obsolescence/${orgId}`),
};

// ── Health API ──────────────────────────────────────
export const healthAPI = {
  check: () => fetch(`${API_BASE.replace('/api/v1', '')}/health`).then(r => r.json()),
};
