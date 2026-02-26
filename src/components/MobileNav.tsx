import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  MessageSquare,
  Briefcase,
  Users,
  Rocket,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Users, label: "My Network", path: "/network" },
  { icon: GraduationCap, label: "Learning", path: "/learning" },
];

const bottomTabs = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
  { icon: Briefcase, label: "Jobs", path: "/opportunities" },
  { icon: Users, label: "Network", path: "/network" },
];

export function MobileHeader() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Top hamburger header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur-xl px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold text-foreground">
            CoFounderBay
          </span>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-display text-base font-bold text-sidebar-foreground">
                CoFounderBay
              </span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-4 space-y-1">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
      {bottomTabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
            {tab.badge && (
              <span className="absolute -top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
