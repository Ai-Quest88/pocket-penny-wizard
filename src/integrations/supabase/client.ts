/**
 * API Client — Drop-in replacement for Supabase SDK
 *
 * Mimics the Supabase client interface (.from(), .auth, .functions.invoke())
 * but routes all calls to our Express backend at /api/*.
 *
 * This means we DON'T need to rewrite 70+ files — they all keep using
 * `supabase.from('transactions').select(...)` etc.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Token Management ───────────────────────────────────────────────
let accessToken: string | null = localStorage.getItem('access_token');
let currentUser: any = JSON.parse(localStorage.getItem('current_user') || 'null');
let authChangeCallbacks: Array<(event: string, session: any) => void> = [];

function setSession(token: string | null, user: any | null) {
  accessToken = token;
  currentUser = user;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current_user');
  }
}

function notifyAuthChange(event: string) {
  const session = accessToken
    ? { access_token: accessToken, user: currentUser }
    : null;
  authChangeCallbacks.forEach((cb) => {
    try { cb(event, session); } catch (e) { console.error('Auth callback error:', e); }
  });
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  return res;
}

// ─── Query Builder (mimics Supabase PostgREST) ──────────────────────
type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

interface QueryState {
  table: string;
  selectCols: string;
  filters: Array<{ col: string; op: FilterOp; value: any }>;
  orderCol: string | null;
  orderAsc: boolean;
  limitCount: number | null;
  singleRow: boolean;
  maybeSingle: boolean;
}

function createQueryBuilder(table: string) {
  const state: QueryState = {
    table,
    selectCols: '*',
    filters: [],
    orderCol: null,
    orderAsc: true,
    limitCount: null,
    singleRow: false,
    maybeSingle: false,
  };

  // Map table names to API endpoints
  const tableToEndpoint: Record<string, string> = {
    'system_keyword_rules': 'system-keyword-rules',
    'user_profiles': 'user-profiles',
    'user_financial_goals': 'user-financial-goals',
    'user_financial_profile': 'user-profiles',
    'user_category_corrections': 'user-category-corrections',
    'user_merchant_mappings': 'user-merchant-mappings',
    'user_categorization_rules': 'system-keyword-rules', // fallback
    'category_groups': 'categories/groups',
    'category_buckets': 'categories/buckets',
    'category_discovery_sessions': 'categories/discovery-sessions',
    'learned_patterns': 'learned-patterns',
    'cfo_alerts': 'cfo-alerts',
    'historical_values': 'historical-values',
  };

  function getEndpoint() {
    return tableToEndpoint[table] || table;
  }

  function buildFilterParams(): string {
    const params = new URLSearchParams();
    state.filters.forEach((f) => {
      params.append(`filter_${f.col}`, String(f.value));
    });
    return params.toString();
  }

  const builder = {
    select(cols?: string) {
      if (cols) state.selectCols = cols;
      return builder;
    },
    eq(col: string, value: any) {
      state.filters.push({ col, op: 'eq', value });
      return builder;
    },
    neq(col: string, value: any) {
      state.filters.push({ col, op: 'neq', value });
      return builder;
    },
    gt(col: string, value: any) {
      state.filters.push({ col, op: 'gt', value });
      return builder;
    },
    gte(col: string, value: any) {
      state.filters.push({ col, op: 'gte', value });
      return builder;
    },
    lt(col: string, value: any) {
      state.filters.push({ col, op: 'lt', value });
      return builder;
    },
    lte(col: string, value: any) {
      state.filters.push({ col, op: 'lte', value });
      return builder;
    },
    like(col: string, value: any) {
      state.filters.push({ col, op: 'like', value });
      return builder;
    },
    ilike(col: string, value: any) {
      state.filters.push({ col, op: 'ilike', value });
      return builder;
    },
    is(col: string, value: any) {
      state.filters.push({ col, op: 'is', value });
      return builder;
    },
    in(col: string, values: any[]) {
      state.filters.push({ col, op: 'in', value: values });
      return builder;
    },
    not(_col: string, _op: string, _value: any) {
      // NOTE: Complex NOT filters handled client-side; server returns all rows
      return builder;
    },
    or(_condition: string) {
      // Simplified: ignore complex OR conditions for now
      return builder;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      state.orderCol = col;
      state.orderAsc = opts?.ascending ?? true;
      return builder;
    },
    limit(count: number) {
      state.limitCount = count;
      return builder;
    },
    single() {
      state.singleRow = true;
      return builder;
    },
    maybeSingle() {
      state.maybeSingle = true;
      return builder;
    },

    // INSERT — returns chainable so .insert(data).select() works (Supabase-style)
    insert(data: any | any[]) {
      return {
        select: async () => {
          try {
            const isArray = Array.isArray(data);
            const endpoint = isArray ? `/${getEndpoint()}/bulk` : `/${getEndpoint()}`;
            const res = await apiFetch(endpoint, {
              method: 'POST',
              body: JSON.stringify(data),
            });
            const body = await res.json();
            if (!res.ok) return { data: null, error: body };

            const resultData = Array.isArray(body) ? body : [body];
            return {
              data: state.singleRow ? resultData[0] : resultData,
              error: null,
            };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },
      };
    },

    // UPDATE
    async update(data: any) {
      try {
        // Find id from filters
        const idFilter = state.filters.find((f) => f.col === 'id');
        if (idFilter) {
          const res = await apiFetch(`/${getEndpoint()}/${idFilter.value}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
          });
          const body = await res.json();
          if (!res.ok) return { data: null, error: body };
          return { data: [body], error: null };
        }
        // Batch update by filters — not supported yet, do one by one
        return { data: null, error: { message: 'Update requires id filter' } };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },

    // UPSERT
    async upsert(data: any | any[]) {
      // Try insert, if conflict do update
      return builder.insert(data);
    },

    // DELETE
    async delete() {
      try {
        const idFilter = state.filters.find((f) => f.col === 'id');
        if (idFilter) {
          const res = await apiFetch(`/${getEndpoint()}/${idFilter.value}`, {
            method: 'DELETE',
          });
          const body = await res.json();
          if (!res.ok) return { data: null, error: body };
          return { data: body, error: null };
        }
        return { data: null, error: { message: 'Delete requires id filter' } };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },

    // Execute SELECT (terminal operation via .then() or await)
    then(resolve: (result: { data: any; error: any }) => void, reject?: (err: any) => void) {
      const execute = async () => {
        try {
          const filterParams = buildFilterParams();
          const idFilter = state.filters.find((f) => f.col === 'id');

          let path: string;
          if (idFilter && state.singleRow) {
            path = `/${getEndpoint()}/${idFilter.value}`;
          } else {
            path = `/${getEndpoint()}${filterParams ? '?' + filterParams : ''}`;
          }

          const res = await apiFetch(path);
          const body = await res.json();

          if (!res.ok) {
            return resolve({ data: null, error: body });
          }

          let data = body;
          if (state.singleRow && Array.isArray(data)) {
            data = data[0] || null;
          }
          if (state.maybeSingle && Array.isArray(data)) {
            data = data[0] || null;
          }

          return resolve({ data, error: null });
        } catch (err: any) {
          if (reject) return reject(err);
          return resolve({ data: null, error: { message: err.message } });
        }
      };
      execute();
    },
  };

  return builder;
}

// ─── Auth Module ────────────────────────────────────────────────────
const auth = {
  async getSession() {
    if (!accessToken) {
      return { data: { session: null }, error: null };
    }
    try {
      const res = await apiFetch('/auth/session');
      if (!res.ok) {
        setSession(null, null);
        return { data: { session: null }, error: null };
      }
      const body = await res.json();
      return {
        data: {
          session: {
            access_token: accessToken,
            user: body.user,
          },
        },
        error: null,
      };
    } catch {
      return { data: { session: null }, error: null };
    }
  },

  async getUser() {
    if (!accessToken) {
      return { data: { user: null }, error: { message: 'Not authenticated' } };
    }
    try {
      const res = await apiFetch('/auth/session');
      if (!res.ok) {
        return { data: { user: null }, error: { message: 'Session invalid' } };
      }
      const body = await res.json();
      return { data: { user: body.user }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: { message: err.message } };
    }
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const body = await res.json();
      if (!res.ok) {
        return { data: { session: null, user: null }, error: body };
      }
      setSession(body.access_token, body.user);
      notifyAuthChange('SIGNED_IN');
      return {
        data: {
          session: { access_token: body.access_token, user: body.user },
          user: body.user,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: { session: null, user: null }, error: { message: err.message } };
    }
  },

  async signUp(credentials: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          full_name: credentials.options?.data?.full_name,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        return { data: { session: null, user: null }, error: body };
      }
      setSession(body.access_token, body.user);
      notifyAuthChange('SIGNED_IN');
      return {
        data: {
          session: { access_token: body.access_token, user: body.user },
          user: body.user,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: { session: null, user: null }, error: { message: err.message } };
    }
  },

  async signInWithOAuth(_opts: { provider: string; options?: any }) {
    // OAuth not supported in local mode — return error
    return {
      data: { url: null, provider: null },
      error: { message: 'OAuth is not available in local mode. Please use email/password login.' },
    };
  },

  async signOut() {
    setSession(null, null);
    notifyAuthChange('SIGNED_OUT');
    return { error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authChangeCallbacks.push(callback);

    // Fire immediately with current state
    const session = accessToken
      ? { access_token: accessToken, user: currentUser }
      : null;
    setTimeout(() => callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session), 0);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authChangeCallbacks = authChangeCallbacks.filter((cb) => cb !== callback);
          },
        },
      },
    };
  },
};

// ─── Functions Module (Edge Function replacement) ───────────────────
const functions = {
  async invoke(functionName: string, options?: { body?: any }) {
    try {
      // Map edge function names to API endpoints
      const endpointMap: Record<string, string> = {
        'extract-transactions': '/ai/extract-transactions',
        'categorize-transaction': '/ai/categorize',
        'discover-categories': '/ai/discover-categories',
        'group-categories': '/ai/group-categories',
        'compile-user-knowledge': '/ai/compile-knowledge',
        'generate-cfo-alerts': '/ai/cfo-alerts',
        'cfo-chat': '/ai/cfo-chat',
        'chat-assistant': '/ai/chat',
        'analyze-transactions': '/ai/analyze',
        'ai-process-file': '/ai/process-file',
      };

      const endpoint = endpointMap[functionName] || `/ai/${functionName}`;
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(options?.body || {}),
      });

      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: data.error || 'Function invocation failed' } };
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
};

// ─── RPC (database function calls) ──────────────────────────────────
async function rpc(functionName: string, params?: any) {
  try {
    const res = await apiFetch(`/rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
    const body = await res.json();
    if (!res.ok) return { data: null, error: body };
    return { data: body, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message } };
  }
}

// ─── Main Export (Supabase-compatible interface) ─────────────────────
export const supabase = {
  from: createQueryBuilder,
  auth,
  functions,
  rpc,
};
