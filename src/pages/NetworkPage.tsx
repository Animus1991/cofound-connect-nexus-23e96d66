import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Sparkles,
  MapPin,
  Clock,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Connection {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  location: string;
  connectedSince: string;
  mutualConnections: number;
  online: boolean;
  skills: string[];
}

interface PendingRequest {
  id: string;
  name: string;
  initials: string;
  role: string;
  message: string;
  date: string;
  mutualConnections: number;
  direction: "incoming" | "outgoing";
}

interface SuggestedConnection {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  matchScore: number;
  reason: string;
  mutualConnections: number;
  skills: string[];
}

const mockConnections: Connection[] = [
  { id: "cn1", name: "Alex Chen", initials: "AC", role: "Founder & CEO", company: "NovaTech AI", location: "San Francisco", connectedSince: "3 months ago", mutualConnections: 12, online: true, skills: ["AI/ML", "Product Strategy"] },
  { id: "cn2", name: "Maria Santos", initials: "MS", role: "Angel Investor", company: "Santos Capital", location: "London", connectedSince: "1 month ago", mutualConnections: 8, online: true, skills: ["Fintech", "SaaS"] },
  { id: "cn3", name: "Sara K.", initials: "SK", role: "UX Designer", company: "Freelance", location: "Berlin", connectedSince: "2 weeks ago", mutualConnections: 5, online: false, skills: ["Product Design", "Research"] },
  { id: "cn4", name: "Dimitris P.", initials: "DP", role: "Full-Stack Developer", company: "CodeCraft", location: "Athens", connectedSince: "2 months ago", mutualConnections: 3, online: false, skills: ["React", "Node.js"] },
  { id: "cn5", name: "Lena W.", initials: "LW", role: "Marketing Lead", company: "GrowthLab", location: "NYC", connectedSince: "6 months ago", mutualConnections: 15, online: true, skills: ["Growth", "Content"] },
];

const mockPendingRequests: PendingRequest[] = [
  { id: "pr1", name: "Elena V.", initials: "EV", role: "Growth Lead at ScaleUp", message: "I'm building a fintech startup and would love to connect!", date: "2h ago", mutualConnections: 4, direction: "incoming" },
  { id: "pr2", name: "Nikos M.", initials: "NM", role: "Angel Investor", message: "Impressed by your work — let's chat.", date: "1d ago", mutualConnections: 7, direction: "incoming" },
  { id: "pr3", name: "Tom H.", initials: "TH", role: "CTO at DataFlow", message: "", date: "3d ago", mutualConnections: 2, direction: "outgoing" },
];

const mockSuggested: SuggestedConnection[] = [
  { id: "sg1", name: "Yuki T.", initials: "YT", role: "Product Manager", company: "Rakuten", matchScore: 94, reason: "Shares your interest in AI + Product", mutualConnections: 6, skills: ["Product", "AI", "Strategy"] },
  { id: "sg2", name: "Raj P.", initials: "RP", role: "Backend Engineer", company: "Stripe", matchScore: 89, reason: "Complementary technical skills", mutualConnections: 3, skills: ["Go", "Payments", "APIs"] },
  { id: "sg3", name: "Clara F.", initials: "CF", role: "Venture Partner", company: "Sequoia Scout", matchScore: 87, reason: "Invests in your stage & sector", mutualConnections: 9, skills: ["Investing", "SaaS", "B2B"] },
  { id: "sg4", name: "Omar S.", initials: "OS", role: "Design Lead", company: "Figma", matchScore: 82, reason: "Strong design background for co-founding", mutualConnections: 2, skills: ["Design Systems", "UX", "Branding"] },
];

export default function NetworkPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("connections");
  const [searchQuery, setSearchQuery] = useState("");
  const [connections, setConnections] = useState(mockConnections);
  const [pendingRequests, setPendingRequests] = useState(mockPendingRequests);
  const [suggested, setSuggested] = useState(mockSuggested);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch real data from API (falls back to mock data on error)
  const fetchData = useCallback(async () => {
    try {
      const [connRes, reqRes, sugRes] = await Promise.allSettled([
        api.connections.list(),
        api.connections.getRequests(),
        api.connections.getSuggested(),
      ]);
      if (connRes.status === "fulfilled" && connRes.value.connections.length > 0) {
        setConnections(connRes.value.connections.map((c) => ({
          id: c.id,
          name: c.name,
          initials: c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
          role: c.headline ?? "",
          company: "",
          location: c.location ?? "",
          connectedSince: c.connectedSince,
          mutualConnections: 0,
          online: false,
          skills: c.skills ?? [],
        })));
      }
      if (reqRes.status === "fulfilled") {
        const mapped: PendingRequest[] = [
          ...reqRes.value.incoming.map((r) => ({
            id: r.id,
            name: r.name,
            initials: r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
            role: r.headline ?? "",
            message: r.message ?? "",
            date: new Date(r.createdAt).toLocaleDateString(),
            mutualConnections: 0,
            direction: "incoming" as const,
          })),
          ...reqRes.value.outgoing.map((r) => ({
            id: r.id,
            name: r.name,
            initials: r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
            role: r.headline ?? "",
            message: r.message ?? "",
            date: new Date(r.createdAt).toLocaleDateString(),
            mutualConnections: 0,
            direction: "outgoing" as const,
          })),
        ];
        if (mapped.length > 0) setPendingRequests(mapped);
      }
      if (sugRes.status === "fulfilled" && sugRes.value.suggested.length > 0) {
        setSuggested(sugRes.value.suggested.map((s) => ({
          id: s.id,
          name: s.name,
          initials: s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
          role: s.headline ?? "",
          company: "",
          matchScore: s.matchScore,
          reason: s.reason,
          mutualConnections: s.mutualConnections,
          skills: s.skills ?? [],
        })));
      }
    } catch { /* use mock data */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  const filteredConnections = connections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const incomingRequests = pendingRequests.filter((r) => r.direction === "incoming");
  const outgoingRequests = pendingRequests.filter((r) => r.direction === "outgoing");

  const handleAccept = async (id: string) => {
    try { await api.connections.acceptRequest(id); } catch { /* ignore */ }
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    fetchData();
  };

  const handleDecline = async (id: string) => {
    try { await api.connections.declineRequest(id); } catch { /* ignore */ }
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleConnect = async (id: string) => {
    try { await api.connections.requestConnection(id); } catch { /* ignore */ }
    setConnectedIds((prev) => [...prev, id]);
  };

  return (
    <AppLayout title="My Network">
      <div className="px-2 py-3 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Connections", value: connections.length, icon: UserCheck },
            { label: "Pending", value: incomingRequests.length, icon: Clock },
            { label: "Sent", value: outgoingRequests.length, icon: UserPlus },
            { label: "Suggested", value: suggested.length, icon: Sparkles },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/50 bg-card-gradient p-4 flex items-center gap-3 hover-lift">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              Pending
              {incomingRequests.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  {incomingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggested" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Suggested
            </TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search connections…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredConnections.map((conn) => (
                  <motion.div
                    key={conn.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-border/50 bg-card-gradient p-4 interactive-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                            {conn.initials}
                          </AvatarFallback>
                        </Avatar>
                        {conn.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{conn.name}</p>
                        <p className="text-xs text-muted-foreground">{conn.role} · {conn.company}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {conn.location}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conn.skills.map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{conn.mutualConnections} mutual connections</span>
                      <span>Connected {conn.connectedSince}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2 items-start">
            {incomingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Incoming Requests</h3>
                {incomingRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/50 bg-card-gradient p-4 interactive-card"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                          {req.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{req.name}</p>
                          <span className="text-[10px] text-muted-foreground">{req.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{req.role}</p>
                        {req.message && (
                          <p className="mt-2 text-xs text-foreground/80 leading-relaxed">{req.message}</p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">{req.mutualConnections} mutual connections</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="hero" className="h-8 gap-1.5 text-xs" onClick={() => handleAccept(req.id)}>
                            <Check className="h-3 w-3" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => handleDecline(req.id)}>
                            <X className="h-3 w-3" /> Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Sent Requests ({outgoingRequests.length})</h3>
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-border/50 bg-card-gradient p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                        {req.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      <span className="text-[10px] text-muted-foreground">{req.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No pending requests
              </div>
            )}
            </div>{/* /pending grid */}
          </TabsContent>

          {/* Suggested Tab */}
          <TabsContent value="suggested" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggested.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/50 bg-card-gradient p-4 interactive-card"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                        {s.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> {s.matchScore}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.role} · {s.company}</p>
                      <p className="mt-2 text-xs text-primary/80 italic">"{s.reason}"</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.skills.map((sk) => (
                          <Badge key={sk} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{s.mutualConnections} mutual</span>
                        <Button
                          size="sm"
                          variant={connectedIds.includes(s.id) ? "secondary" : "hero"}
                          className="h-8 gap-1.5 text-xs"
                          disabled={connectedIds.includes(s.id)}
                          onClick={() => handleConnect(s.id)}
                        >
                          {connectedIds.includes(s.id) ? (
                            <><Check className="h-3 w-3" /> Sent</>
                          ) : (
                            <><UserPlus className="h-3 w-3" /> Connect</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
