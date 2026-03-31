import type { LucideIcon } from "lucide-react";
import {
  Home,
  Search,
  MessageSquare,
  Briefcase,
  Users,
  GraduationCap,
} from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

export const navItems: NavItem[] = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Users, label: "My Network", path: "/network" },
  { icon: GraduationCap, label: "Learning", path: "/learning" },
];

/** Mobile bottom nav: subset for space (Learning in hamburger menu) */
export const mobileBottomNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Users, label: "Network", path: "/network" },
];
