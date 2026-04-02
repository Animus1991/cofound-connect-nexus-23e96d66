import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  buildTenantCssVars,
  applyTenantCssVars,
  removeTenantCssVars,
  loadGoogleFont,
  setFavicon,
} from "@/lib/tenantTheme";
import { useTheme } from "@/components/ThemeProvider";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TenantBrandingConfig {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundStyle?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  logoAltText?: string | null;
  heroImageUrl?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  cornerStyle?: string | null;
}

export interface TenantContentConfig {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroCtaLabel?: string | null;
  heroCtaSecondaryLabel?: string | null;
  platformDescription?: string | null;
  tagline?: string | null;
  onboardingIntroText?: string | null;
  onboardingStep1Text?: string | null;
  onboardingStep2Text?: string | null;
  dashboardWelcomeText?: string | null;
  communityLabel?: string | null;
  memberLabel?: string | null;
  mentorLabel?: string | null;
  matchLabel?: string | null;
  roleLabels?: Record<string, string>;
  applyCtaLabel?: string | null;
}

export interface TenantLegalConfig {
  privacyPolicyUrl?: string | null;
  termsOfServiceUrl?: string | null;
  cookiePolicyUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  supportUrl?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
}

export interface TenantEmailConfig {
  fromName?: string | null;
  fromEmail?: string | null;
  emailHeaderLogoUrl?: string | null;
  emailSignature?: string | null;
  emailFooterBranding?: string | null;
}

export interface TenantSocialConfig {
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  githubUrl?: string | null;
}

export interface TenantConfig {
  id: string;
  slug: string;
  displayName: string;
  description?: string | null;
  aboutText?: string | null;
  isBrandingActive: boolean;
  publishedAt?: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    type?: string;
    logoUrl?: string | null;
    websiteUrl?: string | null;
  } | null;
  branding: TenantBrandingConfig | null;
  content: TenantContentConfig | null;
  legal: TenantLegalConfig | null;
  email: TenantEmailConfig | null;
  social: TenantSocialConfig | null;
}

interface TenantContextValue {
  /** The currently active tenant config, or null if no tenant is selected. */
  tenant: TenantConfig | null;
  /** True while loading the tenant config from the API. */
  isLoading: boolean;
  /** True if the active tenant has branding published and active. */
  isBrandingActive: boolean;
  /** Programmatically activate a tenant by slug (e.g. from /t/:slug route). */
  activateTenant: (slug: string) => Promise<void>;
  /** Deactivate the current tenant branding and restore defaults. */
  deactivateTenant: () => void;
  /**
   * Retrieve a content label with fallback to platform default.
   * e.g. label("community") → "Cohort" | "Community"
   */
  label: (key: keyof TenantContentConfig, fallback: string) => string;
  /** Raw fetch to refresh the tenant config from the API. */
  refreshTenant: () => Promise<void>;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const TENANT_SLUG_KEY = "cfb:tenant-slug";
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const defaultValue: TenantContextValue = {
  tenant: null,
  isLoading: false,
  isBrandingActive: false,
  activateTenant: async () => {},
  deactivateTenant: () => {},
  label: (_key, fallback) => fallback,
  refreshTenant: async () => {},
};

// ── Context ───────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue>(defaultValue);

export function useTenant() {
  return useContext(TenantContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

async function fetchTenantBySlug(slug: string): Promise<TenantConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/tenants/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = await res.json() as {
      tenant: TenantConfig;
      organization: TenantConfig["organization"];
      branding: TenantBrandingConfig | null;
      content: TenantContentConfig | null;
      legal: TenantLegalConfig | null;
      email: TenantEmailConfig | null;
      social: TenantSocialConfig | null;
    };
    return {
      ...data.tenant,
      organization: data.organization,
      branding: data.branding,
      content: data.content,
      legal: data.legal,
      email: data.email,
      social: data.social,
    };
  } catch {
    return null;
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const activeSlugRef = useRef<string | null>(null);

  const applyBranding = useCallback((cfg: TenantConfig, currentTheme: "dark" | "light") => {
    if (!cfg.isBrandingActive || !cfg.branding) {
      removeTenantCssVars();
      return;
    }
    const vars = buildTenantCssVars(cfg.branding, currentTheme);
    applyTenantCssVars(vars);

    if (cfg.branding.headingFont) loadGoogleFont(cfg.branding.headingFont);
    if (cfg.branding.bodyFont) loadGoogleFont(cfg.branding.bodyFont);
    if (cfg.branding.faviconUrl) setFavicon(cfg.branding.faviconUrl);

    if (cfg.branding.headingFont) {
      document.documentElement.style.setProperty(
        "--font-display",
        `"${cfg.branding.headingFont}", sans-serif`,
      );
    }
    if (cfg.branding.bodyFont) {
      document.documentElement.style.setProperty(
        "--font-sans",
        `"${cfg.branding.bodyFont}", sans-serif`,
      );
    }
  }, []);

  const clearBranding = useCallback(() => {
    removeTenantCssVars();
    setFavicon(null);
    document.documentElement.style.removeProperty("--font-display");
    document.documentElement.style.removeProperty("--font-sans");
  }, []);

  const activateTenant = useCallback(async (slug: string) => {
    if (activeSlugRef.current === slug) return;
    setIsLoading(true);
    try {
      const cfg = await fetchTenantBySlug(slug);
      if (cfg) {
        activeSlugRef.current = slug;
        setTenant(cfg);
        applyBranding(cfg, theme);
        try { localStorage.setItem(TENANT_SLUG_KEY, slug); } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, [theme, applyBranding]);

  const deactivateTenant = useCallback(() => {
    activeSlugRef.current = null;
    setTenant(null);
    clearBranding();
    try { localStorage.removeItem(TENANT_SLUG_KEY); } catch {}
  }, [clearBranding]);

  const refreshTenant = useCallback(async () => {
    const slug = activeSlugRef.current;
    if (!slug) return;
    const cfg = await fetchTenantBySlug(slug);
    if (cfg) {
      setTenant(cfg);
      applyBranding(cfg, theme);
    }
  }, [theme, applyBranding]);

  // Re-apply CSS vars when the light/dark theme changes
  useEffect(() => {
    if (tenant) applyBranding(tenant, theme);
  }, [theme, tenant, applyBranding]);

  // Restore persisted tenant slug on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TENANT_SLUG_KEY);
      if (stored) activateTenant(stored);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = useCallback(
    (key: keyof TenantContentConfig, fallback: string): string => {
      if (!tenant?.content) return fallback;
      const val = tenant.content[key];
      return (typeof val === "string" && val.trim()) ? val : fallback;
    },
    [tenant],
  );

  const isBrandingActive = !!(tenant?.isBrandingActive && tenant?.branding);

  return (
    <TenantContext.Provider
      value={{ tenant, isLoading, isBrandingActive, activateTenant, deactivateTenant, label, refreshTenant }}
    >
      {children}
    </TenantContext.Provider>
  );
}
