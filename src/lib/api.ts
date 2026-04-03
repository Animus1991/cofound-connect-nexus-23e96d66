/**
 * API client for CoFounder Connect backend
 * Uses VITE_API_URL from env (default: http://localhost:3002)
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3002";

let getToken: (() => string | null | undefined) | null = null;
let getRefreshToken: (() => string | null | undefined) | null = null;
let onTokenRefreshed: ((token: string, refreshToken?: string) => void) | null = null;
let onUnauthorized: (() => void) | null = null;

export function configureApi(config: {
  getToken?: () => string | null | undefined;
  getRefreshToken?: () => string | null | undefined;
  onTokenRefreshed?: (token: string, refreshToken?: string) => void;
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
    // For unauthenticated requests (login, register, etc.) return the real error
    if (skipAuth) {
      throw {
        error: (data as ApiError).error ?? "Invalid credentials",
        details: (data as ApiError).details,
      } as ApiError;
    }

    // For authenticated requests, attempt token refresh
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
          const newAccessToken = (refreshData as { token: string; refreshToken?: string }).token;
          const newRefreshToken = (refreshData as { token: string; refreshToken?: string }).refreshToken;
          onTokenRefreshed(newAccessToken, newRefreshToken);
          return request(path, { ...options, token: newAccessToken });
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
    getById: (userId: string) =>
      request<{ profile: { id: string; userId: string; name: string | null; email: string; headline: string | null; bio: string | null; location: string | null; availability: string | null; stage: string | null; commitment: string | null; skills: string[]; interests: string[]; linkedin: string | null; github: string | null; website: string | null } }>(`/api/profiles/${userId}`),
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
  notifications: {
    list: () =>
      request<{
        notifications: Array<{
          id: string;
          type: "connection_request" | "connection_accepted" | "new_message";
          title: string;
          body: string;
          createdAt: string;
          read: boolean;
          metadata: Record<string, unknown>;
        }>;
        unreadCount: number;
      }>("/api/notifications"),
    markRead: (id: string) =>
      request<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => ({ ok: true })),
    markAllRead: () =>
      request<{ ok: boolean }>("/api/notifications/read-all", { method: "PATCH" }).catch(() => ({ ok: true })),
  },
  activity: {
    list: (limit = 20) =>
      request<{
        activity: Array<{
          id: string;
          action: string;
          label: string;
          context: Record<string, unknown>;
          createdAt: string;
        }>;
      }>(`/api/activity?limit=${limit}`),
  },
  startups: {
    getMine: () =>
      request<{
        startup: {
          id: string;
          ownerId: string;
          name: string;
          tagline: string | null;
          description: string | null;
          logoUrl: string | null;
          websiteUrl: string | null;
          industry: string | null;
          stage: string | null;
          teamSize: number;
          fundingStatus: string | null;
          techStack: string[];
          tags: string[];
          isPublic: boolean;
          createdAt: string;
          updatedAt: string;
          members: Array<{ userId: string; role: string; title: string | null; user: { id: string; name: string | null; email: string } | null }>;
        } | null;
      }>("/api/startups/mine"),
    create: (data: {
      name: string;
      tagline?: string;
      description?: string;
      industry?: string;
      stage?: string;
      techStack?: string[];
      tags?: string[];
      isPublic?: boolean;
    }) =>
      request<{ startup: { id: string; name: string } }>("/api/startups", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ startup: { id: string; name: string } }>(`/api/startups/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getById: (id: string) =>
      request<{ startup: { id: string; name: string; tagline: string | null; description: string | null; stage: string | null; techStack: string[]; tags: string[]; members: Array<{ userId: string; role: string }> } }>(`/api/startups/${id}`),
  },
  search: {
    query: (q: string, type: "all" | "users" | "opportunities" = "all", limit = 20) =>
      request<{
        users: Array<{ id: string; name: string; headline: string; skills: string; location: string; stage: string; score: number }>;
        opportunities: Array<{ id: string; title: string; description: string; skills: string; type: string; stage: string; location: string; orgName: string; score: number }>;
      }>(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),
  },
  milestones: {
    list: (status?: string) => {
      const q = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
      return request<{ milestones: Array<{ id: string; userId: string; title: string; category: string; status: string; targetDate: string | null; notes: string | null; progress: number; sortOrder: number; createdAt: string; updatedAt: string }> }>(`/api/milestones${q}`);
    },
    create: (body: { title: string; category?: string; status?: string; targetDate?: string; notes?: string; progress?: number }) =>
      request<{ milestone: { id: string; title: string; status: string; category: string } }>("/api/milestones", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { title?: string; category?: string; status?: string; targetDate?: string | null; notes?: string | null; progress?: number; sortOrder?: number }) =>
      request<{ milestone: { id: string; title: string; status: string; progress: number } }>(`/api/milestones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/milestones/${id}`, { method: "DELETE" }),
  },
  matches: {
    list: (params?: { page?: number; limit?: number; role?: string; industry?: string; stage?: string; commitment?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.role) q.set("role", params.role);
      if (params?.industry) q.set("industry", params.industry);
      if (params?.stage) q.set("stage", params.stage);
      if (params?.commitment) q.set("commitment", params.commitment);
      const qs = q.toString();
      return request<{ matches: Array<{ userId: string; name: string; headline: string | null; location: string | null; skills: string[]; role: string | null; stage: string | null; commitment: string | null; score: number; sharedStrengths: string[]; complementaryStrengths: string[]; mismatches: string[]; dimensions: Record<string, number> }>; total: number; page: number; limit: number }>(`/api/matches${qs ? `?${qs}` : ""}`);
    },
    getPreferences: () =>
      request<{ preferences: { lookingForRoles: string[]; preferredIndustries: string[]; preferredStages: string[]; preferredCommitment: string[]; desiredSkills: string[]; remoteOnly: boolean; locationRadius: number } | null }>("/api/matches/preferences"),
    updatePreferences: (body: { lookingForRoles?: string[]; preferredIndustries?: string[]; preferredStages?: string[]; preferredCommitment?: string[]; desiredSkills?: string[]; remoteOnly?: boolean; locationRadius?: number }) =>
      request<{ preferences: Record<string, unknown> }>("/api/matches/preferences", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },

  matching: {
    getRecommendations: (params?: { limit?: number; matchType?: string }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.matchType) q.set("matchType", params.matchType);
      const qs = q.toString();
      return request<{
        model: { version: string; stage: string; weights: { explicitWeight: number; semanticWeight: number; behavioralWeight: number; outcomeWeight: number; explorationRate: number } };
        recommendations: Array<{
          userId: string;
          name: string;
          headline: string | null;
          location: string | null;
          stage: string | null;
          commitment: string | null;
          skills: string[];
          score: number;
          breakdown: {
            explicitScore: number;
            semanticScore: number;
            behavioralScore: number;
            outcomePriorScore: number;
            finalScore: number;
            confidenceScore: number;
            sharedDimensions: string[];
            complementaryDimensions: string[];
            frictionDimensions: string[];
            recommendationReason: string;
            isNewUserBoost: boolean;
            isExplorationMatch: boolean;
          };
        }>;
      }>(`/api/matching/recommendations${qs ? `?${qs}` : ""}`);
    },

    sendFeedback: (body: { targetUserId: string; feedbackType: "not_relevant" | "not_now" | "better_fit" | "relevant" | "hidden" | "reported"; feedbackReason?: string; matchType?: string }) =>
      request<{ ok: boolean }>("/api/matching/feedback", { method: "POST", body: JSON.stringify(body) }),

    markShown: (body: { targetUserId: string; matchScoreId?: string; modelVersion?: string }) =>
      request<{ ok: boolean }>("/api/matching/events/shown", { method: "POST", body: JSON.stringify(body) }),

    markClicked: (body: { targetUserId: string; matchScoreId?: string; modelVersion?: string }) =>
      request<{ ok: boolean }>("/api/matching/events/clicked", { method: "POST", body: JSON.stringify(body) }),

    recordOutcome: (body: {
      targetUserId: string;
      outcomeType: "accepted" | "rejected" | "conversation_started" | "conversation_sustained" | "requested";
      matchScoreId?: string;
      modelVersion?: string;
      qualityFlag?: string;
    }) =>
      request<{ ok: boolean }>("/api/matching/events/outcome", { method: "POST", body: JSON.stringify(body) }),

    admin: {
      listModelVersions: () =>
        request<{ versions: Array<{ id: string; version: string; stage: string; description: string | null; weights: string; isActive: boolean; isFallback: boolean; createdAt: string }>; active: { version: string; stage: string; weights: { explicitWeight: number; semanticWeight: number; behavioralWeight: number; outcomeWeight: number; explorationRate: number } } }>("/api/matching/admin/model-versions"),
      setActiveModelVersion: (body: { version: string }) =>
        request<{ ok: boolean; active: { version: string; stage: string; weights: { explicitWeight: number; semanticWeight: number; behavioralWeight: number; outcomeWeight: number; explorationRate: number } } }>("/api/matching/admin/model-versions/active", { method: "PUT", body: JSON.stringify(body) }),
      updateModelWeights: (version: string, body: { weights: { explicitWeight: number; semanticWeight: number; behavioralWeight: number; outcomeWeight: number; explorationRate: number }; description?: string }) =>
        request<{ modelVersion: Record<string, unknown> }>(`/api/matching/admin/model-versions/${encodeURIComponent(version)}/weights`, { method: "PUT", body: JSON.stringify(body) }),
      getMetrics: () =>
        request<{ since7d: string; byModel: Array<Record<string, unknown>>; feedback: Array<Record<string, unknown>>; lastInference: Array<Record<string, unknown>> }>("/api/matching/admin/metrics"),
      getFairness: () =>
        request<{ since7d: string; since30d: string; explorationRate: number; newUserBoostRate: number; negativeFeedbackRate: number; totalShown: number; totalScores: number; totalFeedback: number }>("/api/matching/admin/fairness"),
      listExperiments: () =>
        request<{ experiments: Array<{ id: string; name: string; description: string | null; strategyA: string; strategyB: string; trafficSplit: number; isActive: boolean; startedAt: string | null; endedAt: string | null; createdAt: string }> }>("/api/matching/admin/experiments"),
      createExperiment: (body: { name: string; description?: string; strategyA: string; strategyB: string; trafficSplit?: number }) =>
        request<{ experiment: Record<string, unknown> }>("/api/matching/admin/experiments", { method: "POST", body: JSON.stringify(body) }),
      toggleExperiment: (id: string) =>
        request<{ experiment: Record<string, unknown> }>(`/api/matching/admin/experiments/${id}/toggle`, { method: "PUT", body: "{}" }),
      deleteExperiment: (id: string) =>
        request<{ ok: boolean }>(`/api/matching/admin/experiments/${id}`, { method: "DELETE" }),
    },
  },
  communities: {
    list: (params?: { search?: string; category?: string; access?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.category) q.set("category", params.category);
      if (params?.access) q.set("access", params.access);
      const qs = q.toString();
      return request<{ communities: Array<{ id: string; title: string; description: string | null; category: string; tags: string[]; isPublic: boolean; memberCount: number; postCount: number; isMember: boolean; createdAt: string }> }>(`/api/communities${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) =>
      request<{ community: { id: string; title: string; description: string | null; category: string; tags: string[]; isPublic: boolean; memberCount: number; postCount: number; isMember: boolean; createdAt: string } }>(`/api/communities/${id}`),
    create: (body: { title: string; description?: string; category?: string; tags?: string[]; isPublic?: boolean }) =>
      request<{ community: { id: string; title: string } }>("/api/communities", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    join: (id: string) =>
      request<{ ok: boolean }>(`/api/communities/${id}/join`, { method: "POST" }),
    leave: (id: string) =>
      request<{ ok: boolean }>(`/api/communities/${id}/leave`, { method: "POST" }),
    getPosts: (id: string, page = 1) =>
      request<{ posts: Array<{ id: string; title: string; body: string; tags: string[]; authorId: string; authorName: string | null; isPinned: boolean; reactionsCount: number; commentsCount: number; createdAt: string }>; total: number }>(`/api/communities/${id}/posts?page=${page}`),
    createPost: (communityId: string, body: { title: string; body: string; tags?: string[] }) =>
      request<{ post: { id: string; title: string } }>(`/api/communities/${communityId}/posts`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getPost: (communityId: string, postId: string) =>
      request<{ post: { id: string; title: string; body: string; tags: string[]; authorId: string; authorName: string | null; isPinned: boolean; reactionsCount: number; commentsCount: number; createdAt: string }; comments: Array<{ id: string; body: string; authorId: string; authorName: string | null; parentId: string | null; reactionsCount: number; createdAt: string }> }>(`/api/communities/${communityId}/posts/${postId}`),
    createComment: (communityId: string, postId: string, body: { body: string; parentId?: string }) =>
      request<{ comment: { id: string; body: string } }>(`/api/communities/${communityId}/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  mentorship: {
    list: (params?: { expertise?: string; stage?: string; available?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.expertise) q.set("expertise", params.expertise);
      if (params?.stage) q.set("stage", params.stage);
      if (params?.available) q.set("available", "true");
      const qs = q.toString();
      return request<{ mentors: Array<{ userId: string; name: string | null; headline: string | null; location: string | null; skills: string[]; expertise: string[]; startupStages: string[]; availability: string; sessionFormat: string[]; sessionFrequency: string; maxMentees: number; currentMentees: number; bio: string | null }> }>(`/api/mentorship${qs ? `?${qs}` : ""}`);
    },
    getMine: () =>
      request<{ availability: { expertise: string[]; startupStages: string[]; availability: string; sessionFormat: string[]; sessionFrequency: string; maxMentees: number; bio: string | null } | null }>("/api/mentorship/mine"),
    updateMine: (body: { expertise?: string[]; startupStages?: string[]; availability?: string; sessionFormat?: string[]; sessionFrequency?: string; maxMentees?: number; bio?: string }) =>
      request<{ ok: boolean }>("/api/mentorship/mine", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    sendRequest: (body: { mentorId: string; note?: string; goals?: string }) =>
      request<{ request: { id: string } }>("/api/mentorship/requests", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getRequests: () =>
      request<{ sent: Array<{ id: string; mentorId: string; mentorName: string | null; note: string | null; goals: string | null; status: string; createdAt: string }>; received: Array<{ id: string; menteeId: string; menteeName: string | null; note: string | null; goals: string | null; status: string; createdAt: string }> }>("/api/mentorship/requests"),
    updateRequest: (id: string, status: "accepted" | "declined") =>
      request<{ ok: boolean }>(`/api/mentorship/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  admin: {
    getStats: () =>
      request<{ stats: { totalUsers: number; activeUsers: number; completedProfiles: number; totalConnections: number; totalMessages: number; totalOpportunities: number; totalCommunities: number; totalMentorshipRequests: number; totalOrganizations: number } }>("/api/admin/stats"),
    getUsers: (params?: { search?: string; role?: string; status?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.role) q.set("role", params.role);
      if (params?.status) q.set("status", params.status);
      if (params?.page) q.set("page", String(params.page));
      const qs = q.toString();
      return request<{ users: Array<{ id: string; email: string; name: string | null; role: string; status: string; createdAt: string; profileComplete: boolean }>; total: number }>(`/api/admin/users${qs ? `?${qs}` : ""}`);
    },
    getActivity: (limit?: number) =>
      request<{ activity: Array<{ id: string; userId: string; userName: string | null; action: string; createdAt: string }> }>(`/api/admin/activity${limit ? `?limit=${limit}` : ""}`),
    getCommunities: () =>
      request<{ communities: Array<{ id: string; title: string; category: string; memberCount: number; postCount: number; isPublic: boolean; createdAt: string }> }>("/api/admin/communities"),
    getOrganizations: () =>
      request<{ organizations: Array<{ id: string; name: string; type: string; status: string; country: string | null; createdAt: string }> }>("/api/admin/organizations"),
    createOrganization: (body: { name: string; type?: string; description?: string; country?: string; websiteUrl?: string }) =>
      request<{ organization: { id: string; name: string } }>("/api/admin/organizations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getTenants: () =>
      request<{ tenants: Array<{ id: string; name: string; slug: string; status: string; createdAt: string }> }>("/api/admin/tenants"),
    createTenant: (body: { name: string; slug: string; organizationId?: string }) =>
      request<{ tenant: { id: string; name: string; slug: string } }>("/api/admin/tenants", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
