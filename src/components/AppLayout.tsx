import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileHeader, MobileBottomNav } from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  Rocket,
  Home,
  Search,
  MessageSquare,
  Briefcase,
  Users,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  Target,
  Shield,
  Zap,
  X,
  Building2,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: GraduationCap, label: "Mentors", path: "/mentors" },
  { icon: Users, label: "Communities", path: "/communities" },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Target, label: "Milestones", path: "/milestones" },
];

interface AppLayoutProps {
  title: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

const DEMO_EMAIL = "demo@cofound.io";

function getUserInitials(name?: string, email?: string): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

type NotificationItem = {
  id: string;
  type: "connection_request" | "connection_accepted" | "new_message";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  metadata: Record<string, unknown>;
};

export default function AppLayout({ title, children, headerActions }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isDemo = user?.email === DEMO_EMAIL;
  const initials = getUserInitials(user?.name, user?.email);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { notifications: items, unreadCount: count } = await api.notifications.list();
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      /* backend may be offline */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Demo mode banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 bg-amber-500 px-4 py-1.5 text-amber-950 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span>You are in Demo Mode — data is read-only and not saved.</span>
            <Link to="/signup" className="underline font-semibold hover:text-amber-800 transition-colors">
              Create a free account
            </Link>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="shrink-0 rounded p-0.5 hover:bg-amber-600/30 transition-colors"
            aria-label="Exit demo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <MobileHeader />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display text-sm font-semibold text-sidebar-foreground">
            CoFounder Connect
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3 space-y-0.5">
          <Link
            to="/profile"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              location.pathname === "/profile"
                ? "bg-primary/10 text-primary font-medium"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent"
            }`}
          >
            <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-[9px] font-semibold text-primary">{initials}</span>
            </div>
            Profile
          </Link>
          <Link
            to="/startup"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              location.pathname === "/startup"
                ? "bg-primary/10 text-primary font-medium"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Startup
          </Link>
          <Link
            to="/admin"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              location.pathname === "/admin"
                ? "bg-primary/10 text-primary font-medium"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-56 pt-14 pb-16 lg:pt-0 lg:pb-0">
        <header className="sticky top-14 lg:top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex h-12 items-center justify-between px-4 sm:px-6">
            <h1 className="font-display text-base font-semibold text-foreground">
              {title}
            </h1>
            <div className="flex items-center gap-1.5">
              <GlobalSearch />
              {headerActions}
              <ThemeToggle />
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8"
                  onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) fetchNotifications(); }}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>

                {notifOpen && (
                  <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                      <span className="text-sm font-semibold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 cursor-pointer ${
                              !n.read ? "bg-primary/5" : ""
                            }`}
                            onClick={() => {
                              setNotifOpen(false);
                              if (n.type === "connection_request" || n.type === "connection_accepted") navigate("/network");
                              else if (n.type === "new_message") navigate("/messages");
                            }}
                          >
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                              n.type === "connection_request" ? "bg-primary/10 text-primary" :
                              n.type === "connection_accepted" ? "bg-primary/20 text-primary" :
                              "bg-accent/15 text-accent"
                            }`}>
                              {n.type === "new_message" ? "💬" : n.type === "connection_accepted" ? "🤝" : "👋"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                            </div>
                            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-border px-4 py-2">
                      <Link
                        to="/network"
                        className="block text-center text-xs text-primary hover:underline"
                        onClick={() => setNotifOpen(false)}
                      >
                        View all activity
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link to="/profile">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center transition-colors hover:bg-primary/20">
                  <span className="text-[10px] font-medium text-primary">{initials}</span>
                </div>
              </Link>
            </div>
          </div>
        </header>
        {children}
      </main>

      <MobileBottomNav />
    </div>
  );
}
