/**
 * NotificationPreferencesPanel — user-facing notification preference editor.
 * Loads per-category preferences from the automation API and allows saving.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotificationPreferences, saveNotificationPreferences,
  CATEGORY_LABELS,
  type NotificationPreference,
} from "@/lib/automation";
import {
  Bell, Mail, Smartphone, Sparkles, Users, GraduationCap,
  Building2, CreditCard, Shield, Globe, Loader2, CheckCircle2, XCircle,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  matches:     Sparkles,
  connections: Users,
  mentorship:  GraduationCap,
  community:   Building2,
  billing:     CreditCard,
  admin_alerts:Shield,
  platform:    Globe,
  digest:      Bell,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  matches:     "When new co-founder matches are found or accepted.",
  connections: "Connection requests, acceptances, and pending reminders.",
  mentorship:  "Mentor request updates, session reminders, and inactivity nudges.",
  community:   "Community joins, new posts, and activity highlights.",
  billing:     "Trial reminders, payment notices, and subscription changes.",
  admin_alerts:"Platform moderation and admin action notifications (admin only).",
  platform:    "Onboarding tips, profile completion nudges, and re-engagement.",
  digest:      "Weekly and daily activity digest summaries.",
};

const FREQ_OPTIONS = [
  { value: "realtime", label: "Real-time" },
  { value: "daily",    label: "Daily digest" },
  { value: "weekly",   label: "Weekly digest" },
  { value: "none",     label: "Never" },
];

type PrefMap = Record<string, NotificationPreference>;

export default function NotificationPreferencesPanel() {
  const { user } = useAuth();
  const [prefMap, setPrefMap]   = useState<PrefMap>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState<"idle" | "success" | "error">("idle");

  const categories = Object.keys(CATEGORY_LABELS);

  const load = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const { preferences } = await getNotificationPreferences(user.token);
      const map: PrefMap = {};
      for (const p of preferences) { map[p.category] = p; }
      setPrefMap(map);
    } catch { /* use defaults */ } finally { setLoading(false); }
  }, [user?.token]);

  useEffect(() => { void load(); }, [load]);

  const getPref = (cat: string): NotificationPreference => prefMap[cat] ?? {
    id: null, userId: user?.id ?? "", category: cat,
    inAppEnabled: true, emailEnabled: true, pushEnabled: false,
    emailDigestFrequency: "realtime",
  };

  const setPref = (cat: string, field: keyof NotificationPreference, value: unknown) => {
    setPrefMap(prev => ({
      ...prev,
      [cat]: { ...getPref(cat), [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!user?.token) return;
    setSaving(true);
    try {
      const prefs = categories.map(cat => {
        const p = getPref(cat);
        return {
          category:             p.category,
          inAppEnabled:         p.inAppEnabled,
          emailEnabled:         p.emailEnabled,
          pushEnabled:          p.pushEnabled,
          emailDigestFrequency: p.emailDigestFrequency as "realtime" | "daily" | "weekly" | "none",
        };
      });
      await saveNotificationPreferences(user.token, prefs);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control when and how you receive notifications from CoFounderBay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "success" && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </motion.span>
          )}
          {status === "error" && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5" /> Save failed
            </motion.span>
          )}
          <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Save preferences
          </Button>
        </div>
      </div>

      {/* Column headers */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_80px_80px_140px] gap-2 items-center px-4 py-2 bg-secondary/40 border-b border-border/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Category</span>
          <div className="flex items-center gap-1.5 justify-center">
            <Bell className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">In-app</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Email</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <Smartphone className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Push</span>
          </div>
          <span className="text-[10px] text-muted-foreground text-center">Email frequency</span>
        </div>

        {/* Preference rows */}
        {categories.map((cat, i) => {
          const pref = getPref(cat);
          const Icon = CATEGORY_ICONS[cat] ?? Bell;
          const isLast = i === categories.length - 1;
          return (
            <div key={cat}
              className={`grid grid-cols-[1fr_80px_80px_80px_140px] gap-2 items-center px-4 py-3
                ${!isLast ? "border-b border-border/40" : ""} hover:bg-secondary/20 transition-colors`}>
              {/* Category label */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{CATEGORY_LABELS[cat]}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{CATEGORY_DESCRIPTIONS[cat]}</p>
                </div>
              </div>

              {/* In-app */}
              <div className="flex justify-center">
                <Switch
                  checked={pref.inAppEnabled}
                  onCheckedChange={v => setPref(cat, "inAppEnabled", v)}
                  aria-label={`${CATEGORY_LABELS[cat]} in-app`}
                />
              </div>

              {/* Email */}
              <div className="flex justify-center">
                <Switch
                  checked={pref.emailEnabled}
                  onCheckedChange={v => setPref(cat, "emailEnabled", v)}
                  aria-label={`${CATEGORY_LABELS[cat]} email`}
                />
              </div>

              {/* Push */}
              <div className="flex justify-center">
                <Switch
                  checked={pref.pushEnabled}
                  onCheckedChange={v => setPref(cat, "pushEnabled", v)}
                  aria-label={`${CATEGORY_LABELS[cat]} push`}
                />
              </div>

              {/* Email frequency */}
              <div>
                <Select
                  value={pref.emailDigestFrequency}
                  onValueChange={v => setPref(cat, "emailDigestFrequency", v)}
                  disabled={!pref.emailEnabled}
                >
                  <SelectTrigger className="h-7 text-xs border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQ_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-muted-foreground">
        Push notifications require browser permission. Email delivery respects your chosen frequency per category.
        Changes take effect immediately after saving.
      </p>
    </div>
  );
}
