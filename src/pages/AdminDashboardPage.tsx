import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  MessageSquare,
  Shield,
  Search,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  BarChart3,
  Settings,
  Tag,
  Flag,
  Activity,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";

// Chart data
const userGrowthData = [
  { month: "Sep", users: 420, active: 210 },
  { month: "Oct", users: 680, active: 390 },
  { month: "Nov", users: 1020, active: 580 },
  { month: "Dec", users: 1340, active: 740 },
  { month: "Jan", users: 1890, active: 1050 },
  { month: "Feb", users: 2380, active: 1310 },
  { month: "Mar", users: 2847, active: 1523 },
];

const matchRatesData = [
  { week: "W1", sent: 62, accepted: 38, declined: 14 },
  { week: "W2", sent: 78, accepted: 51, declined: 18 },
  { week: "W3", sent: 55, accepted: 34, declined: 12 },
  { week: "W4", sent: 89, accepted: 58, declined: 21 },
  { week: "W5", sent: 94, accepted: 67, declined: 15 },
  { week: "W6", sent: 71, accepted: 49, declined: 13 },
  { week: "W7", sent: 86, accepted: 61, declined: 17 },
];

const communityEngagementData = [
  { month: "Sep", posts: 45, joins: 120, replies: 180 },
  { month: "Oct", posts: 78, joins: 210, replies: 320 },
  { month: "Nov", posts: 112, joins: 340, replies: 480 },
  { month: "Dec", posts: 140, joins: 420, replies: 560 },
  { month: "Jan", posts: 185, joins: 580, replies: 710 },
  { month: "Feb", posts: 210, joins: 720, replies: 830 },
  { month: "Mar", posts: 248, joins: 850, replies: 940 },
];

const roleDistributionData = [
  { name: "Founders", value: 1120, color: "hsl(var(--primary))" },
  { name: "Co-Founders", value: 780, color: "hsl(var(--accent))" },
  { name: "Mentors", value: 420, color: "hsl(142 71% 45%)" },
  { name: "Advisors", value: 310, color: "hsl(38 92% 50%)" },
  { name: "Other", value: 217, color: "hsl(var(--muted-foreground))" },
];

const userGrowthConfig = {
  users: { label: "Total Users", color: "hsl(var(--primary))" },
  active: { label: "Active Users", color: "hsl(var(--accent))" },
};

const matchRatesConfig = {
  sent: { label: "Sent", color: "hsl(var(--primary))" },
  accepted: { label: "Accepted", color: "hsl(142 71% 45%)" },
  declined: { label: "Declined", color: "hsl(var(--destructive))" },
};

const communityConfig = {
  posts: { label: "Posts", color: "hsl(var(--primary))" },
  joins: { label: "Joins", color: "hsl(var(--accent))" },
  replies: { label: "Replies", color: "hsl(142 71% 45%)" },
};

const platformStats = [
  { label: "Total Users", value: "2,847", change: "+127 this month", icon: Users, trend: "up" },
  { label: "Active Users (30d)", value: "1,523", change: "53.5% of total", icon: Activity, trend: "up" },
  { label: "Match Requests", value: "486", change: "+89 this week", icon: TrendingUp, trend: "up" },
  { label: "Conversations", value: "312", change: "+45 this week", icon: MessageSquare, trend: "up" },
];

const detailedMetrics = [
  { label: "Completed Profiles", value: 1842, total: 2847, pct: 64.7 },
  { label: "Matches Accepted", value: 312, total: 486, pct: 64.2 },
  { label: "Mentor Requests", value: 156, total: 210, pct: 74.3 },
  { label: "Community Joins", value: 3240, total: 4100, pct: 79.0 },
  { label: "Posts Created", value: 890, total: 1200, pct: 74.2 },
];

const mockUsers = [
  { id: 1, name: "Alex Chen", email: "alex@startup.com", role: "Founder", status: "active", profileCompletion: 92, joined: "Jan 15, 2026", verified: true },
  { id: 2, name: "Maria Santos", email: "maria@vc.com", role: "Investor", status: "active", profileCompletion: 88, joined: "Jan 20, 2026", verified: true },
  { id: 3, name: "James Okafor", email: "james@saas.io", role: "Mentor", status: "active", profileCompletion: 95, joined: "Feb 1, 2026", verified: true },
  { id: 4, name: "New User", email: "new@test.com", role: "Co-Founder", status: "pending", profileCompletion: 30, joined: "Mar 10, 2026", verified: false },
  { id: 5, name: "Flagged User", email: "flagged@test.com", role: "Founder", status: "flagged", profileCompletion: 65, joined: "Feb 15, 2026", verified: false },
];

const moderationQueue = [
  { id: 1, type: "Report", target: "Post: 'Looking for investment...'", reporter: "Maria Santos", reason: "Spam/Self-promotion", status: "pending", time: "2h ago" },
  { id: 2, type: "Report", target: "User: SpamAccount123", reporter: "Alex Chen", reason: "Fake profile", status: "pending", time: "5h ago" },
  { id: 3, type: "Verification", target: "User: Priya Sharma", reporter: "System", reason: "Identity verification request", status: "pending", time: "1d ago" },
];

const taxonomies = [
  { name: "Skills", count: 145, examples: "React, Python, AI/ML, Growth..." },
  { name: "Industries", count: 32, examples: "SaaS, Fintech, Health, Climate..." },
  { name: "Roles", count: 7, examples: "Founder, Co-Founder, Mentor, Advisor..." },
  { name: "Stages", count: 6, examples: "Idea, MVP, Traction, Seed, Series A..." },
  { name: "Community Topics", count: 18, examples: "AI, Growth, Design, Impact..." },
];

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  pending: "bg-accent/10 text-accent",
  flagged: "bg-destructive/10 text-destructive",
  suspended: "bg-muted text-muted-foreground",
};

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<"overview" | "users" | "moderation" | "taxonomies">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const filteredUsers = mockUsers.filter(u => {
    const matchesSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "all" || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const sections = [
    { key: "overview" as const, label: "Overview", icon: BarChart3 },
    { key: "users" as const, label: "Users", icon: Users },
    { key: "moderation" as const, label: "Moderation", icon: Shield },
    { key: "taxonomies" as const, label: "Taxonomies", icon: Tag },
  ];

  const stagger = (i: number) => ({ delay: i * 0.06 });

  return (
    <AppLayout title="Admin Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
        {/* Section Nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-border/50 pb-px">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
                activeSection === s.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" /> {s.label}
              {s.key === "moderation" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground tabular-nums">{moderationQueue.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeSection === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              {platformStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...stagger(i), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_2px_16px_hsl(var(--primary)/0.08)] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">{stat.change}</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...stagger(4), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-6"
              >
                <h3 className="font-display text-base font-semibold text-foreground mb-1">User Growth</h3>
                <p className="text-xs text-muted-foreground mb-4">Total vs active users over the last 7 months</p>
                <ChartContainer config={userGrowthConfig} className="h-[240px] w-full">
                  <AreaChart data={userGrowthData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#gradUsers)" strokeWidth={2} />
                    <Area type="monotone" dataKey="active" stroke="hsl(var(--accent))" fill="url(#gradActive)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...stagger(5), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <h3 className="font-display text-base font-semibold text-foreground mb-1">Role Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Users by primary role</p>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleDistributionData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                        {roleDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {roleDistributionData.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium text-foreground tabular-nums">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...stagger(6), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <h3 className="font-display text-base font-semibold text-foreground mb-1">Match Rates</h3>
                <p className="text-xs text-muted-foreground mb-4">Weekly match requests: sent, accepted, declined</p>
                <ChartContainer config={matchRatesConfig} className="h-[220px] w-full">
                  <BarChart data={matchRatesData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="accepted" fill="hsl(142 71% 45%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="declined" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...stagger(7), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <h3 className="font-display text-base font-semibold text-foreground mb-1">Community Engagement</h3>
                <p className="text-xs text-muted-foreground mb-4">Posts, joins, and replies over the last 7 months</p>
                <ChartContainer config={communityConfig} className="h-[220px] w-full">
                  <LineChart data={communityEngagementData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="posts" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="joins" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="replies" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </motion.div>
            </div>

            {/* Health Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...stagger(8), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-border/50 bg-card p-6"
            >
              <h3 className="font-display text-base font-semibold text-foreground mb-1">Platform Health Metrics</h3>
              <p className="text-xs text-muted-foreground mb-4">Key performance indicators across the platform</p>
              <div className="space-y-4">
                {detailedMetrics.map(metric => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{metric.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{metric.value.toLocaleString()} / {metric.total.toLocaleString()} ({metric.pct}%)</span>
                    </div>
                    <Progress value={metric.pct} className="h-2" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Users */}
        {activeSection === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 bg-secondary/50 border-border/50" />
              </div>
              <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                <SelectTrigger className="w-36 bg-secondary/50 border-border/50"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="co-founder">Co-Founder</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/20">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">User</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Role</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Profile</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                              <span className="text-[10px] font-semibold text-primary">{user.name.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                {user.name}
                                {user.verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[10px]">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress value={user.profileCompletion} className="h-1.5 w-16" />
                            <span className="text-[11px] text-muted-foreground tabular-nums">{user.profileCompletion}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] ${statusColors[user.status]}`}>{user.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Moderation */}
        {activeSection === "moderation" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">Moderation Queue</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{moderationQueue.length} items pending review</p>
            </div>
            {moderationQueue.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...stagger(i), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-primary/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                        <span className="text-[11px] text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1">{item.target}</p>
                      <p className="text-xs text-muted-foreground">Reported by: {item.reporter} · Reason: {item.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="default" size="sm" className="text-xs h-8 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Resolve
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                      <XCircle className="h-3 w-3" /> Dismiss
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Taxonomies */}
        {activeSection === "taxonomies" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">Taxonomy Management</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Manage platform categories and tags</p>
              </div>
              <Button variant="default" size="sm" className="text-xs gap-1.5"><Plus className="h-3 w-3" /> Add Category</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {taxonomies.map((tax, i) => (
                <motion.div
                  key={tax.name}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...stagger(i), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_2px_16px_hsl(var(--primary)/0.08)] active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display text-sm font-semibold text-foreground">{tax.name}</h4>
                    <Badge variant="secondary" className="text-[10px] tabular-nums">{tax.count} items</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{tax.examples}</p>
                  <Button variant="outline" size="sm" className="text-xs h-8 mt-3 w-full gap-1">
                    <Settings className="h-3 w-3" /> Manage
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
