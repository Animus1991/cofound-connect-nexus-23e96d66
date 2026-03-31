/**
 * API client for CoFounderBay backend
 * Uses VITE_API_URL from env (default: http://localhost:3001)
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

let getToken: (() => string | null | undefined) | null = null;
let getRefreshToken: (() => string | null | undefined) | null = null;
let onTokenRefreshed: ((token: string) => void) | null = null;
let onUnauthorized: (() => void) | null = null;

export function configureApi(config: {
  getToken?: () => string | null | undefined;
  getRefreshToken?: () => string | null | undefined;
  onTokenRefreshed?: (token: string) => void;
  onUnauthorized?: () => void;
}) {
  getToken = config.getToken ?? null;
  getRefreshToken = config.getRefreshToken ?? null;
  onTokenRefreshed = config.onTokenRefreshed ?? null;
  onUnauthorized = config.onUnauthorized ?? null;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; skipAuth?: boolean } = {}
): Promise<T> {
  const { token: explicitToken, skipAuth, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  const token = explicitToken ?? (skipAuth ? undefined : getToken?.());
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    throw {
      error:
        msg.includes("fetch") || msg.includes("Failed") || msg.includes("Network")
          ? "Cannot connect to server. Make sure the backend is running (cd backend && npm run dev)."
          : "Connection error. Please try again.",
    } as ApiError;
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const refreshToken = getRefreshToken?.();
    if (refreshToken && onTokenRefreshed) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshData = await refreshRes.json().catch(() => ({}));
        if (refreshRes.ok && (refreshData as { token?: string }).token) {
          onTokenRefreshed((refreshData as { token: string }).token);
          return request(path, { ...options, token: (refreshData as { token: string }).token });
        }
      } catch {
        /* fall through to onUnauthorized */
      }
    }
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw { error: "Session expired. Please log in again." } as ApiError;
  }

  if (!res.ok) {
    const err: ApiError = {
      error: (data as ApiError).error ?? `Request failed: ${res.status}`,
      details: (data as ApiError).details,
    };
    throw err;
  }

  return data as T;
}

// ── Auth API ──────────────────────────────────────────────────

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: { id: string; email: string; name?: string };
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface ProfileData {
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  availability?: string | null;
  stage?: string | null;
  commitment?: string | null;
  compensation?: string | null;
  lookingFor?: string | null;
  skills?: string[];
  interests?: string[];
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
}

export interface SettingsData {
  user: { id: string; email: string; name?: string };
  language: string;
  timezone: string;
  notifications: Record<string, { email: boolean; push: boolean; inApp: boolean }>;
  privacy: {
    profileVisibility: "public" | "connections" | "private";
    showEmail: boolean;
    showLocation: boolean;
    activityStatus: boolean;
    searchable: boolean;
    allowIntros: boolean;
  };
}

export interface SettingsUpdateBody {
  name?: string;
  language?: "en" | "el" | "es" | "fr";
  timezone?: string;
  notifications?: Record<string, { email?: boolean; push?: boolean; inApp?: boolean }>;
  privacy?: Partial<SettingsData["privacy"]>;
}

export const api = {
  auth: {
    register: (body: RegisterBody) =>
      request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
        skipAuth: true,
      }),
    login: (body: LoginBody) =>
      request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
        skipAuth: true,
      }),
    forgotPassword: (email: string) =>
      request<{ ok: boolean }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      }),
    resetPassword: (token: string, password: string) =>
      request<{ ok: boolean }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        skipAuth: true,
      }),
  },
  profiles: {
    getMe: () => request<{ user: { id: string; email: string; name?: string }; profile: ProfileData }>("/api/profiles/me"),
    updateMe: (body: Partial<ProfileData> & { name?: string }) =>
      request<ProfileData>("/api/profiles/me", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },
  settings: {
    getMe: () => request<SettingsData>("/api/settings/me"),
    updateMe: (body: SettingsUpdateBody) =>
      request<{ ok: boolean }>("/api/settings/me", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },
  connections: {
    list: () => request<{ connections: Array<{ id: string; userId: string; name: string; headline: string | null; location: string | null; skills: string[]; connectedSince: string }> }>("/api/connections"),
    getSuggested: () =>
      request<{ suggested: Array<{ id: string; name: string; headline: string | null; skills: string[]; matchScore: number; reason: string; mutualConnections: number }> }>("/api/connections/suggested"),
    getRequests: () =>
      request<{
        incoming: Array<{ id: string; fromId: string; name: string; headline: string | null; message: string | null; createdAt: string }>;
        outgoing: Array<{ id: string; toId: string; name: string; headline: string | null; message: string | null; createdAt: string }>;
      }>("/api/connections/requests"),
    requestConnection: (toId: string, message?: string) =>
      request<{ id: string; ok: boolean }>("/api/connections/request", {
        method: "POST",
        body: JSON.stringify({ toId, message }),
      }),
    acceptRequest: (id: string) =>
      request<{ ok: boolean }>(`/api/connections/requests/${id}/accept`, { method: "POST" }),
    declineRequest: (id: string) =>
      request<{ ok: boolean }>(`/api/connections/requests/${id}/decline`, { method: "POST" }),
  },
  opportunities: {
    list: (params?: { search?: string; type?: string; stage?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.type) q.set("type", params.type);
      if (params?.stage) q.set("stage", params.stage);
      const query = q.toString();
      return request<{ opportunities: Array<{ id: string; title: string; description: string | null; type: string; skills: string[]; location: string | null; compensation: string | null; stage: string | null; orgName: string; applicants: number; createdAt: string }> }>(
        `/api/opportunities${query ? `?${query}` : ""}`
      );
    },
    my: () =>
      request<{ opportunities: Array<{ id: string; title: string; description: string | null; type: string; skills: string[]; location: string | null; compensation: string | null; stage: string | null; applicants: number; createdAt: string }> }>("/api/opportunities/my"),
    create: (body: { title: string; description?: string; type?: string; skills?: string[]; location?: string; compensation?: string; stage?: string }) =>
      request<{ id: string; title: string; type: string; createdAt: string }>("/api/opportunities", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    apply: (id: string, message?: string) =>
      request<{ ok: boolean }>(`/api/opportunities/${id}/apply`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    getApplications: () =>
      request<{ applications: Array<{ id: string; opportunityId: string; opportunityTitle: string; orgName: string; message: string | null; status: string; createdAt: string }> }>("/api/opportunities/applications"),
    getReceivedApplications: () =>
      request<{ proposals: Array<{ id: string; fromId: string; fromName: string; fromInitials: string; fromRole: string; scope: string; timeframe: string; compensation: string; message: string | null; status: string; createdAt: string }> }>("/api/opportunities/received-applications"),
    updateApplicationStatus: (id: string, status: "accepted" | "rejected") =>
      request<{ ok: boolean }>(`/api/opportunities/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  messages: {
    getConversations: () =>
      request<{ conversations: Array<{ id: string; otherUser: { id: string; name: string | null } | null; lastMessage: { content: string; createdAt: string; fromMe: boolean } | null }> }>("/api/messages/conversations"),
    createConversation: (participantId: string) =>
      request<{ id: string; existing: boolean }>("/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ participantId }),
      }),
    getConversation: (id: string) =>
      request<{ id: string; otherUser: { id: string; name: string | null } | null; messages: Array<{ id: string; content: string; senderId: string; senderName: string | null; createdAt: string; fromMe: boolean }> }>("/api/messages/conversations/" + id),
    sendMessage: (conversationId: string, content: string) =>
      request<{ id: string; content: string; senderId: string; senderName: string | null; createdAt: string; fromMe: boolean }>(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },
};
