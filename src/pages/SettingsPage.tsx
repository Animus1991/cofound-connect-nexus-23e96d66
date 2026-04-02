import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Shield,
  Link2,
  Globe,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────
interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface ConnectedAccount {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  username?: string;
}

// ── Component ──────────────────────────────────────────────
export default function SettingsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch settings from API on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    api.settings.getMe().then((res) => {
      setAccountData({
        name: res.user?.name ?? user?.name ?? "",
        email: res.user?.email ?? user?.email ?? "",
        language: res.language ?? "en",
        timezone: res.timezone ?? "Europe/Athens",
      });
      if (res.privacy) {
        setPrivacy({
          profileVisibility: res.privacy.profileVisibility ?? "public",
          showEmail: res.privacy.showEmail ?? false,
          showLocation: res.privacy.showLocation ?? true,
          activityStatus: res.privacy.activityStatus ?? true,
          searchable: res.privacy.searchable ?? true,
          allowIntros: res.privacy.allowIntros ?? true,
        });
      }
    }).catch(() => { /* use defaults */ });
  }, [isAuthenticated, user]);

  // Account
  const [accountData, setAccountData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    language: "en",
    timezone: "Europe/Athens",
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: "n1", label: "New Messages", description: "When someone sends you a direct message.", email: true, push: true, inApp: true },
    { id: "n2", label: "Intro Requests", description: "When someone wants to connect with you.", email: true, push: true, inApp: true },
    { id: "n3", label: "Opportunity Matches", description: "When a new opportunity matches your profile.", email: true, push: false, inApp: true },
    { id: "n4", label: "Mentor Sessions", description: "Reminders for upcoming mentor sessions.", email: true, push: true, inApp: true },
    { id: "n5", label: "Weekly Digest", description: "A weekly summary of activity on your profile.", email: true, push: false, inApp: false },
    { id: "n6", label: "Product Updates", description: "News about CoFounder Connect features and improvements.", email: false, push: false, inApp: true },
  ]);

  // Privacy
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public" as "public" | "connections" | "private",
    showEmail: false,
    showLocation: true,
    activityStatus: true,
    searchable: true,
    allowIntros: true,
  });

  // Connected accounts
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    { id: "a1", name: "Google", icon: "🔵", connected: true, username: "jane@gmail.com" },
    { id: "a2", name: "LinkedIn", icon: "🔗", connected: true, username: "linkedin.com/in/janedoe" },
    { id: "a3", name: "GitHub", icon: "⚫", connected: false },
    { id: "a4", name: "Twitter / X", icon: "🐦", connected: false },
  ]);

  const toggleNotification = (id: string, channel: "email" | "push" | "inApp") => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [channel]: !n[channel] } : n))
    );
  };

  const toggleAccount = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, connected: !a.connected, username: a.connected ? undefined : `connected-${a.name.toLowerCase()}` }
          : a
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const notifMap: Record<string, { email: boolean; push: boolean; inApp: boolean }> = {};
      notifications.forEach((n) => { notifMap[n.id] = { email: n.email, push: n.push, inApp: n.inApp }; });
      await api.settings.updateMe({
        name: accountData.name,
        language: accountData.language as "en" | "el" | "es" | "fr",
        timezone: accountData.timezone,
        notifications: notifMap,
        privacy,
      });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const SETTINGS_NAV = [
    { id: "account",       icon: User,     label: "Account",       desc: "Profile & preferences" },
    { id: "notifications", icon: Bell,     label: "Notifications", desc: "Alerts & emails" },
    { id: "privacy",       icon: Shield,   label: "Privacy",       desc: "Visibility settings" },
    { id: "connections",   icon: Link2,    label: "Integrations",  desc: "Connected accounts" },
  ] as const;

  return (
    <AppLayout title="Settings">
      <div className="px-2 py-4">
        {/* Mobile: horizontal tabs */}
        <div className="flex gap-1 mb-4 lg:hidden flex-wrap">
          {SETTINGS_NAV.map((nav) => (
            <button key={nav.id} onClick={() => setActiveTab(nav.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === nav.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>
              <nav.icon className="h-3.5 w-3.5" />{nav.label}
            </button>
          ))}
        </div>

        {/* Desktop: 2-column layout */}
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] items-start">
          {/* Left nav */}
          <div className="hidden lg:block lg:sticky lg:top-12 rounded-xl border border-border bg-card overflow-hidden">
            {SETTINGS_NAV.map((nav) => (
              <button key={nav.id} onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 last:border-0 ${
                  activeTab === nav.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary/60"
                }`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === nav.id ? "bg-primary/15" : "bg-secondary"
                }`}>
                  <nav.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{nav.label}</p>
                  <p className="text-[10px] text-muted-foreground">{nav.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right: content */}
          <div>

          {/* Account */}
          {activeTab === "account" && (<>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
                <CardDescription>Manage your account details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={accountData.name} onChange={(e) => setAccountData({ ...accountData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={accountData.email} onChange={(e) => setAccountData({ ...accountData, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={accountData.language} onValueChange={(v) => setAccountData({ ...accountData, language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="el">Ελληνικά</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={accountData.timezone} onValueChange={(v) => setAccountData({ ...accountData, timezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Athens">Europe/Athens (GMT+2)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Password</p>
                    <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline" size="sm">Change Password</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Delete Account
                    </p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all data.</p>
                  </div>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button variant="hero" onClick={handleSave} disabled={isSaving}>Save Changes</Button>
            </div>
          </>)}

          {/* Notifications */}
          {activeTab === "notifications" && (<>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription>Choose how and when you want to be notified.</CardDescription>
              </CardHeader>
              <CardContent>
              {/* Header row */}
                <div className="hidden sm:grid grid-cols-[1fr_60px_60px_60px] gap-2 mb-3 px-1">
                  <span />
                  <span className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1"><Mail className="h-3 w-3" /> Email</span>
                  <span className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1"><Smartphone className="h-3 w-3" /> Push</span>
                  <span className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1"><Bell className="h-3 w-3" /> In-App</span>
                </div>
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_60px_60px_60px] gap-2 sm:items-center rounded-lg px-1 py-3 hover:bg-secondary/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.label}</p>
                        <p className="text-xs text-muted-foreground">{n.description}</p>
                      </div>
                      <div className="flex gap-4 sm:contents">
                        <label className="flex items-center gap-1.5 sm:justify-center text-[10px] text-muted-foreground sm:text-[0px]"><Switch checked={n.email} onCheckedChange={() => toggleNotification(n.id, "email")} /><span className="sm:hidden">Email</span></label>
                        <label className="flex items-center gap-1.5 sm:justify-center text-[10px] text-muted-foreground sm:text-[0px]"><Switch checked={n.push} onCheckedChange={() => toggleNotification(n.id, "push")} /><span className="sm:hidden">Push</span></label>
                        <label className="flex items-center gap-1.5 sm:justify-center text-[10px] text-muted-foreground sm:text-[0px]"><Switch checked={n.inApp} onCheckedChange={() => toggleNotification(n.id, "inApp")} /><span className="sm:hidden">In-App</span></label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button variant="hero" onClick={handleSave} disabled={isSaving}>Save Changes</Button>
            </div>
          </>)}

          {/* Privacy */}
          {activeTab === "privacy" && (<>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Privacy & Visibility</CardTitle>
                <CardDescription>Control who can see your profile and activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select value={privacy.profileVisibility} onValueChange={(v: "public" | "connections" | "private") => setPrivacy({ ...privacy, profileVisibility: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public"><span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Public — Anyone can view</span></SelectItem>
                      <SelectItem value="connections"><span className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Connections Only</span></SelectItem>
                      <SelectItem value="private"><span className="flex items-center gap-2"><EyeOff className="h-3.5 w-3.5" /> Private — Only you</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                {[
                  { key: "showEmail" as const, label: "Show Email Address", desc: "Display your email on your public profile.", icon: Mail },
                  { key: "showLocation" as const, label: "Show Location", desc: "Display your city/country on your profile.", icon: Globe },
                  { key: "activityStatus" as const, label: "Online Status", desc: "Show when you're active on the platform.", icon: Eye },
                  { key: "searchable" as const, label: "Searchable Profile", desc: "Allow your profile to appear in search results.", icon: Globe },
                  { key: "allowIntros" as const, label: "Allow Intro Requests", desc: "Let others request an introduction.", icon: User },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={privacy[item.key]} onCheckedChange={(v) => setPrivacy({ ...privacy, [item.key]: v })} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button variant="hero" onClick={handleSave} disabled={isSaving}>Save Changes</Button>
            </div>
          </>)}

          {/* Connected Accounts */}
          {activeTab === "connections" && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Connected Accounts</CardTitle>
                <CardDescription>Link your accounts for faster login and richer profile data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-secondary/20 hover:border-primary/20 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{acc.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{acc.name}</p>
                        {acc.connected && acc.username && (
                          <p className="text-xs text-muted-foreground">{acc.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {acc.connected && <Badge variant="secondary" className="gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>}
                      <Button
                        size="sm"
                        variant={acc.connected ? "outline" : "hero"}
                        className="h-8 text-xs"
                        onClick={() => toggleAccount(acc.id)}
                      >
                        {acc.connected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          </div>{/* /right column */}
        </div>{/* /grid */}
      </div>
    </AppLayout>
  );
}
