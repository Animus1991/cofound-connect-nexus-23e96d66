import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileHeader, MobileBottomNav } from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";
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
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
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

export default function AppLayout({ title, children, headerActions }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <MobileHeader />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display text-sm font-semibold text-sidebar-foreground">
            CoFounderBay
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
                {item.badge && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary tabular-nums">
                    {item.badge}
                  </span>
                )}
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
              <span className="text-[9px] font-semibold text-primary">JD</span>
            </div>
            Profile
          </Link>
          <Link
            to="/admin"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              location.pathname === "/admin"
                ? "bg-primary/10 text-primary font-medium"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent"
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
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors">
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
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  5
                </span>
              </Button>
              <Link to="/profile">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center transition-colors hover:bg-primary/20">
                  <span className="text-[10px] font-medium text-primary">JD</span>
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
