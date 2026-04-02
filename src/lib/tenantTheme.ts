/**
 * Tenant theming utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts hex colors to HSL for CSS variable injection, validates contrast
 * ratios, and builds the full set of CSS overrides for a tenant theme.
 */

// ── Color conversion ──────────────────────────────────────────────────────────

/** Parse a hex color string (#rrggbb or #rgb) into [r, g, b] 0-255. */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

/** Convert RGB (0-255) to HSL string "H S% L%" (no `hsl()` wrapper). */
export function rgbToHslString(r: number, g: number, b: number): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Convert a hex color to HSL string for CSS variable values. */
export function hexToHslString(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHslString(...rgb);
}

// ── Contrast checking (WCAG 2.1) ──────────────────────────────────────────────

function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Calculate WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const L1 = relativeLuminance(...rgb1);
  const L2 = relativeLuminance(...rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns true if text placed on background meets WCAG AA (4.5:1). */
export function meetsWcagAA(textHex: string, bgHex: string): boolean {
  return contrastRatio(textHex, bgHex) >= 4.5;
}

/**
 * Choose a text color (black or white) with best contrast against `bgHex`.
 * Returns "#000000" or "#ffffff".
 */
export function bestTextColor(bgHex: string): "#000000" | "#ffffff" {
  return contrastRatio("#000000", bgHex) >= contrastRatio("#ffffff", bgHex)
    ? "#000000"
    : "#ffffff";
}

// ── Font loading ──────────────────────────────────────────────────────────────

const SAFE_FONTS = new Set([
  "Inter", "Plus Jakarta Sans", "DM Sans", "Manrope",
  "Outfit", "Nunito", "Raleway", "Poppins",
  "Space Grotesk", "Sora", "Figtree", "Geist",
]);

/**
 * Inject a Google Fonts stylesheet for a given font family if it's on the
 * allowed list. Returns the loaded family name or null.
 */
export function loadGoogleFont(family: string): string | null {
  const clean = family.trim();
  if (!SAFE_FONTS.has(clean)) return null;
  const id = `cfb-font-${clean.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return clean;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
  return clean;
}

// ── CSS variable builder ──────────────────────────────────────────────────────

export interface TenantColorOverrides {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundStyle?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  cornerStyle?: string | null;
}

/**
 * Build a map of CSS variable names to values that should be applied to
 * document.documentElement when a tenant theme is active.
 * Only includes variables where the tenant actually provided a value.
 */
export function buildTenantCssVars(
  overrides: TenantColorOverrides,
  currentTheme: "dark" | "light",
): Record<string, string> {
  const vars: Record<string, string> = {};

  if (overrides.primaryColor) {
    const hsl = hexToHslString(overrides.primaryColor);
    if (hsl) {
      vars["--primary"] = hsl;
      vars["--ring"] = hsl;
      vars["--sidebar-primary"] = hsl;
    }
  }

  if (overrides.accentColor) {
    const hsl = hexToHslString(overrides.accentColor);
    if (hsl) {
      vars["--accent"] = hsl;
    }
  }

  if (overrides.secondaryColor) {
    const hsl = hexToHslString(overrides.secondaryColor);
    if (hsl) {
      vars["--secondary"] = hsl;
    }
  }

  // Override background based on backgroundStyle if it contradicts current theme
  if (overrides.backgroundStyle === "light" && currentTheme === "dark") {
    // Don't fight the theme system — the tenant specifies a preferred style
    // but the user's theme toggle wins. We only apply color overrides.
  }

  // Corner radius
  if (overrides.cornerStyle) {
    const radii: Record<string, string> = {
      sharp: "0.125rem",
      default: "0.5rem",
      rounded: "1rem",
    };
    const r = radii[overrides.cornerStyle];
    if (r) vars["--radius"] = r;
  }

  return vars;
}

/**
 * Apply CSS variables to document.documentElement.
 * Stores the keys so they can be cleanly removed later.
 */
const APPLIED_KEYS_ATTR = "data-tenant-vars";

export function applyTenantCssVars(vars: Record<string, string>): void {
  const root = document.documentElement;
  const keys = Object.keys(vars);
  keys.forEach((k) => root.style.setProperty(k, vars[k]));
  root.setAttribute(APPLIED_KEYS_ATTR, keys.join(","));
}

/** Remove all tenant CSS variable overrides from document.documentElement. */
export function removeTenantCssVars(): void {
  const root = document.documentElement;
  const stored = root.getAttribute(APPLIED_KEYS_ATTR);
  if (stored) {
    stored.split(",").forEach((k) => root.style.removeProperty(k.trim()));
    root.removeAttribute(APPLIED_KEYS_ATTR);
  }
}

/** Update the page favicon. Pass null to restore default. */
export function setFavicon(url: string | null): void {
  const existing = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (url) {
    if (existing) {
      existing.href = url;
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = url;
      document.head.appendChild(link);
    }
  } else if (existing) {
    existing.href = "/favicon.ico";
  }
}
