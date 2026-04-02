import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  UserPlus,
  UserCheck,
  MessageSquare,
  Check,
  CheckCheck,
  Loader2,
  BellOff,
  Rocket,
  Users,
  Star,
  Flame,
  ArrowUpRight,
  Target,
  BookOpen,
  Calendar,
  TrendingUp,
  Activity,
  Zap,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ───────────────────────────────────────────────────
type NotifType = "connection_request" | "connection_accepted" | "new_message";

interface NotifItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  metadata: Record<string, unknown>;
}

type ActivityItem = {
  id: string;
  action: string;
  label: string;
  context: Record<string, unknown>;
  createdAt: string;
};

// ── Helpers ─────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const NOTIF_META: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  connection_request: { icon: UserPlus, color: "text-primary", bg: "bg-primary/10" },
  connection_accepted: { icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
  new_message: { icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
};

const ACTION_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  connection_made: { icon: Users, color: "text-primary", bg: "bg-primary/10" },
  intro_sent: { icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
  opportunity_posted: { icon: Rocket, color: "text-orange-500", bg: "bg-orange-500/10" },
  application_sent: { icon: ArrowUpRight, color: "text-blue-400", bg: "bg-blue-400/10" },
  message_sent: { icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
  profile_updated: { icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  startup_created: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  startup_updated: { icon: Rocket, color: "text-orange-400", bg: "bg-orange-400/10" },
  community_created: { icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
  community_joined: { icon: UserPlus, color: "text-primary", bg: "bg-primary/10" },
  post_created: { icon: BookOpen, color: "text-blue-400", bg: "bg-blue-400/10" },
  mentorship_requested: { icon: Target, color: "text-green-400", bg: "bg-green-400/10" },
  match_accepted: { icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { icon: Calendar, color: "text-muted-foreground", bg: "bg-secondary" };
}

// ── Empty State ─────────────────────────────────────────────
function EmptyNotifs({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
        <BellOff className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-display text-base font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">You're all caught up — check back later.</p>
    </div>
  );
}

// ── Notification Row ────────────────────────────────────────
function NotifRow({
  notif,
  onMark,
  onClick,
}: {
  notif: NotifItem;
  onMark: (id: string) => void;
  onClick: (notif: NotifItem) => void;
}) {
  const meta = NOTIF_META[notif.type] ?? NOTIF_META.new_message;
  const Icon = meta.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`group flex items-start gap-4 rounded-xl px-5 py-4 transition-colors cursor-pointer hover:bg-secondary/40 ${
        !notif.read ? "bg-primary/[0.035]" : ""
      }`}
      onClick={() => onClick(notif)}
    >
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
        <Icon className={`h-4 w-4 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${!notif.read ? "text-foreground" : "text-foreground/80"}`}>
          {notif.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{notif.body}</p>
        <span className="mt-1.5 block text-[11px] text-muted-foreground/70">{relativeTime(notif.createdAt)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!notif.read && <span className="h-2 w-2 rounded-full bg-primary" />}
        {!notif.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Mark as read"
            onClick={(e) => { e.stopPropagation(); onMark(notif.id); }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ── Activity Row ────────────────────────────────────────────
function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = getActionMeta(item.action);
  const Icon = meta.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 rounded-xl px-5 py-3.5 hover:bg-secondary/30 transition-colors"
    >
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/90 leading-snug">{item.label}</p>
        <span className="mt-0.5 block text-[11px] text-muted-foreground/70">{relativeTime(item.createdAt)}</span>
      </div>
    </motion.div>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [tab, setTab] = useState("notifications");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, actRes] = await Promise.all([
        api.notifications.list().catch(() => ({ notifications: [], unreadCount: 0 })),
        api.activity.list(50).catch(() => ({ activity: [] })),
      ]);
      setNotifications(notifRes.notifications);
      setUnreadCount(notifRes.unreadCount);
      setActivity(actRes.activity);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    await api.notifications.markRead(id);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await api.notifications.markAllRead();
    setMarkingAll(false);
  }, []);

  const handleNotifClick = useCallback((notif: NotifItem) => {
    if (!notif.read) handleMarkRead(notif.id);
    if (notif.type === "new_message") navigate("/messages");
    else if (notif.type === "connection_request" || notif.type === "connection_accepted") navigate("/network");
  }, [handleMarkRead, navigate]);

  const filteredNotifs = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-0.5">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${
              filter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-7"
          disabled={markingAll}
          onClick={handleMarkAllRead}
        >
          {markingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
          Mark all read
        </Button>
      )}
    </div>
  );

  return (
    <AppLayout title="Notifications" headerActions={headerActions}>
      <div className="px-2 py-4">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px] items-start">
        {/* ── Left: notification feed ── */}
        <div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5 h-9 w-full sm:w-auto">
            <TabsTrigger value="notifications" className="gap-2 text-xs">
              <Bell className="h-3.5 w-3.5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-[1rem] px-1 text-[10px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 text-xs">
              <Star className="h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl px-5 py-4">
                    <div className="h-9 w-9 rounded-xl bg-secondary animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-48 rounded bg-secondary animate-pulse" />
                      <div className="h-3 w-72 rounded bg-secondary animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifs.length === 0 ? (
              <EmptyNotifs
                label={filter === "unread" ? "No unread notifications" : "No notifications yet"}
              />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-card/40">
                <AnimatePresence mode="popLayout">
                  {filteredNotifs.map((n) => (
                    <NotifRow
                      key={n.id}
                      notif={n}
                      onMark={handleMarkRead}
                      onClick={handleNotifClick}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl px-5 py-3.5">
                    <div className="h-8 w-8 rounded-lg bg-secondary animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-56 rounded bg-secondary animate-pulse" />
                      <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <EmptyNotifs label="No activity yet" />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-card/40">
                <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recent actions
                  </span>
                  <span className="text-xs text-muted-foreground">{activity.length} events</span>
                </div>
                <AnimatePresence mode="popLayout">
                  {activity.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>{/* /left column */}

        {/* ── Right: stats + quick preferences ── */}
        <div className="space-y-4 lg:sticky lg:top-12">

          {/* Stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Activity Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total", value: notifications.length, icon: Bell },
                { label: "Unread", value: unreadCount, icon: Activity },
                { label: "Activities", value: activity.length, icon: Zap },
                { label: "This week", value: notifications.filter(n => {
                  const d = Date.now() - new Date(n.createdAt).getTime();
                  return d < 7 * 86_400_000;
                }).length, icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-secondary/40 p-3 text-center">
                  <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick notification preferences */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Connection requests", defaultOn: true },
                { label: "New messages", defaultOn: true },
                { label: "Match suggestions", defaultOn: true },
                { label: "Community updates", defaultOn: false },
                { label: "Product updates", defaultOn: false },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground">{pref.label}</span>
                  <Switch defaultChecked={pref.defaultOn} />
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <span className="font-semibold text-primary">Tip:</span> Keep notifications on for
              connection requests to respond faster — quick responses increase your match rate.
            </p>
          </div>
        </div>{/* /right column */}

        </div>{/* /grid */}
      </div>
    </AppLayout>
  );
}
