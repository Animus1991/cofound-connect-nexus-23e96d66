import { ReactNode, useState, useEffect, useCallback } from "react";
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
  Sparkles,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Bookmark,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Sparkles, label: "Matches", path: "/matches" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: Network, label: "Network", path: "/network" },
  { icon: Bookmark, label: "Saved", path: "/saved" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: GraduationCap, label: "Mentors", path: "/mentors" },
  { icon: Users, label: "Communities", path: "/communities" },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Target, label: "Milestones", path: "/milestones" },
  { icon: Building2, label: "Organizations", path: "/organizations" },
];

interface AppLayoutProps {
  title: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

const DEMO_EMAIL = "demo@cofound.io";
const SIDEBAR_STORAGE_KEY = "cfb:sidebar-collapsed";

function getUserInitials(name?: string, email?: string): string {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function AppLayout({ title, children, headerActions }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isDemo = user?.email === DEMO_EMAIL;
  const initials = getUserInitials(user?.name, user?.email);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ── Sidebar collapse state (persisted) ── */
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"; } catch { return false; }
  });
  /* Hover-to-peek overlay (only active when collapsed) */
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  /* When route changes, close hover state */
  useEffect(() => { setHovered(false); }, [location.pathname]);

  const showLabels = !collapsed || hovered;
  const isOverlay   = collapsed && hovered;   /* sidebar visible wide but content NOT shifted */

  /* ── Notifications polling ── */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { unreadCount: count } = await api.notifications.list();
      setUnreadCount(count);
    } catch { /* backend may be offline */ }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  /* ── Shared sidebar nav link helper ── */
  function NavLink({
    to, icon: Icon, label, badge, extraContent,
  }: {
    to: string; icon: React.ElementType; label: string; badge?: number; extraContent?: ReactNode;
  }) {
    const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
    const iconOnly = !showLabels;
    return (
      <Link
        to={to}
        title={iconOnly ? label : undefined}
        className={`group flex items-center rounded-lg transition-colors duration-150 ${
          iconOnly ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 py-2 w-full"
        } ${
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        }`}
      >
        <span className="relative shrink-0">
          <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
          {badge && badge > 0 && iconOnly && (
            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
        {showLabels && (
          <>
            <span className="flex-1 whitespace-nowrap text-sm">{label}</span>
            {extraContent}
            {badge && badge > 0 && (
              <span className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Demo banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-between gap-3 bg-amber-500 px-4 py-1.5 text-amber-950 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span>You are in Demo Mode — data is read-only and not saved.</span>
            <Link to="/signup" className="underline font-semibold hover:text-amber-800 transition-colors">Create a free account</Link>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="shrink-0 rounded p-0.5 hover:bg-amber-600/30" aria-label="Exit demo">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <MobileHeader />

      {/* ══ Desktop Sidebar ══ */}
      <aside
        style={{ width: showLabels ? "14rem" : "3.5rem" }}  /* 224px | 56px */
        className={[
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-sidebar-border bg-sidebar",
          "lg:flex lg:flex-col overflow-hidden",
          "transition-[width] duration-200 ease-out",
          isOverlay ? "shadow-[2px_0_20px_rgba(0,0,0,0.15)] z-50" : "",
        ].join(" ")}
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => collapsed && setHovered(false)}
      >
        {/* Logo / brand row */}
        <div
          className={`flex h-14 shrink-0 items-center border-b border-sidebar-border ${
            showLabels ? "px-4 gap-2.5" : "justify-center"
          }`}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          {showLabels && (
            <>
              <span className="flex-1 font-display text-sm font-semibold text-sidebar-foreground whitespace-nowrap overflow-hidden">
                CoFounder Connect
              </span>
              {/* Collapse button – only show when sidebar is pinned open */}
              {!collapsed && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              )}
              {/* "Pin open" button – shown while hovering over collapsed sidebar */}
              {collapsed && (
                <button
                  onClick={() => { setCollapsed(false); setHovered(false); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  title="Pin sidebar open"
                >
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Primary navigation */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 ${showLabels ? "px-2" : "px-1.5"}`}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className={`shrink-0 border-t border-sidebar-border py-2 space-y-0.5 ${showLabels ? "px-2" : "px-1.5"}`}>
          {/* Profile */}
          <Link
            to="/profile"
            title={!showLabels ? "Profile" : undefined}
            className={`group flex items-center rounded-lg transition-colors duration-150 ${
              !showLabels ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 py-2 w-full"
            } ${
              location.pathname === "/profile"
                ? "bg-primary/10 text-primary font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <div className="h-5 w-5 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[9px] font-semibold text-primary">{initials}</span>
            </div>
            {showLabels && <span className="flex-1 whitespace-nowrap text-sm">Profile</span>}
          </Link>

          <NavLink to="/startup"       icon={Rocket}  label="Startup" />
          <NavLink to="/notifications" icon={Bell}    label="Notifications" badge={unreadCount} />
          <NavLink to="/admin"         icon={Shield}  label="Admin" />
          <NavLink to="/settings"      icon={Settings} label="Settings" />

          {/* Log out */}
          <button
            onClick={() => { logout(); navigate("/"); }}
            title={!showLabels ? "Log out" : undefined}
            className={`group flex items-center rounded-lg transition-colors duration-150 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full ${
              !showLabels ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 py-2"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showLabels && <span className="whitespace-nowrap text-sm">Log out</span>}
          </button>
        </div>
      </aside>

      {/* ══ Main content area ══
          Margin tracks the PINNED sidebar width only.
          When collapsed+hovered the sidebar overlays (overlay doesn't shift content). */}
      <main
        style={{ marginLeft: collapsed ? "3.5rem" : "14rem" }}
        className="flex-1 min-w-0 pt-14 pb-16 lg:pt-0 lg:pb-0 transition-[margin] duration-200 ease-out"
      >
        {/* Page header */}
        <header className="sticky top-14 lg:top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex h-12 items-center gap-2 px-3">
            {/* Expand button visible in header when sidebar is collapsed */}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
            <h1 className="flex-1 font-display text-sm font-semibold text-foreground truncate">
              {title}
            </h1>
            <div className="flex items-center gap-1 shrink-0">
              <GlobalSearch />
              {headerActions}
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={() => navigate("/notifications")}
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              <Link to="/profile">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors">
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
