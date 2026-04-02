/**
 * useFeatureGating — React hook for accessing the current user's feature access.
 *
 * Usage:
 *   const { access, hasFeature, withinLimit, isLoading } = useFeatureGating();
 *   if (!hasFeature("premiumMatchFilters")) return <UpgradePrompt />;
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFeatures, type FeatureAccess, type FeatureFlags } from "@/lib/billing";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache: { access: FeatureAccess | null; loadedAt: number; userId: string } = {
  access: null,
  loadedAt: 0,
  userId: "",
};

const FREE_ACCESS: FeatureAccess = {
  planSlug: "free",
  planName: "Free",
  tier: "individual_free",
  status: "active",
  isTrialing: false,
  trialEnd: null,
  billingCycle: "monthly",
  seatLimit: 1,
  activeSeatCount: 0,
  flags: {
    basicMatching: true,
    premiumMatchFilters: false,
    communities: false,
    privateCommunities: false,
    mentorDiscovery: true,
    advancedMentorFilters: false,
    advancedAnalytics: false,
    whiteLabelBranding: false,
    sso: false,
    apiAccess: false,
    exportCsv: false,
    prioritySupport: false,
    orgDashboard: false,
    seatManagement: false,
    cohortManagement: false,
    customIntegrations: false,
    slaSupport: false,
  },
  limits: {
    matchesPerMonth: 10,
    savedProfiles: 20,
    communities: 0,
    messages: 50,
    seats: 1,
    exportRows: 0,
  },
  cancelAtPeriodEnd: false,
  renewalDate: null,
  currentPeriodEnd: null,
};

interface UseFeatureGatingResult {
  access: FeatureAccess;
  isLoading: boolean;
  error: string | null;
  /** Returns true if the feature is enabled for the current subscription. */
  hasFeature: (feature: keyof FeatureFlags) => boolean;
  /** Returns true if value is within the plan's limit (-1 = unlimited). */
  withinLimit: (limitKey: keyof FeatureAccess["limits"], currentUsage: number) => boolean;
  /** Returns the raw limit value (-1 = unlimited). */
  getLimit: (limitKey: keyof FeatureAccess["limits"]) => number;
  isPremiumOrAbove: boolean;
  isOrgPlan: boolean;
  isEnterprise: boolean;
  isOnFreePlan: boolean;
  isTrialing: boolean;
  /** Reload feature access from the API (call after subscription changes). */
  refetch: () => Promise<void>;
}

export function useFeatureGating(): UseFeatureGatingResult {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const userId = user?.id ?? "";

  const [access, setAccess] = useState<FeatureAccess>(FREE_ACCESS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!token) { setAccess(FREE_ACCESS); return; }

    const now = Date.now();
    if (!force && cache.userId === userId && cache.access && now - cache.loadedAt < CACHE_TTL) {
      setAccess(cache.access);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { access: fetched } = await getUserFeatures(token);
      cache.access = fetched;
      cache.loadedAt = now;
      cache.userId = userId;
      setAccess(fetched);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, userId]);

  useEffect(() => { void load(); }, [load]);

  const hasFeature = useCallback((feature: keyof FeatureFlags): boolean => {
    return access.flags[feature] === true;
  }, [access]);

  const withinLimit = useCallback((
    limitKey: keyof FeatureAccess["limits"],
    currentUsage: number,
  ): boolean => {
    const limit = access.limits[limitKey];
    if (limit === -1) return true;
    return currentUsage < limit;
  }, [access]);

  const getLimit = useCallback((limitKey: keyof FeatureAccess["limits"]): number => {
    return access.limits[limitKey];
  }, [access]);

  const tier = access.tier;

  return {
    access,
    isLoading,
    error,
    hasFeature,
    withinLimit,
    getLimit,
    isPremiumOrAbove: tier !== "individual_free",
    isOrgPlan: tier === "org_starter" || tier === "org_pro" || tier === "enterprise",
    isEnterprise: tier === "enterprise" || tier === "custom",
    isOnFreePlan: tier === "individual_free",
    isTrialing: access.isTrialing,
    refetch: () => load(true),
  };
}
