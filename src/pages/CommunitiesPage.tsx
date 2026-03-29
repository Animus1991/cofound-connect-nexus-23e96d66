import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { CardSkeleton } from "@/components/SkeletonLoaders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  MessageSquare,
  Globe,
  Lock,
  TrendingUp,
  Flame,
  ChevronRight,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mockCommunities = [
  { id: "ai-founders", title: "AI Founders Circle", description: "Connect with founders building AI-first products. Share insights, datasets, and go-to-market strategies.", category: "Technology", industry: "AI/ML", members: 1240, posts: 890, isPublic: true, trending: true, tags: ["AI", "Machine Learning", "LLMs"], recentActivity: "5 new posts today" },
  { id: "saas-growth", title: "SaaS Growth Lab", description: "Strategies for scaling SaaS products from $0 to $10M ARR. Metrics, pricing, and retention deep-dives.", category: "Business", industry: "SaaS", members: 980, posts: 654, isPublic: true, trending: true, tags: ["SaaS", "Growth", "Revenue"], recentActivity: "12 new members this week" },
  { id: "first-time-founders", title: "First-Time Founders", description: "Safe space for first-time founders to ask questions, share struggles, and celebrate wins.", category: "Community", industry: "General", members: 2100, posts: 1560, isPublic: true, trending: false, tags: ["Beginners", "Support", "Networking"], recentActivity: "3 new posts today" },
  { id: "climate-tech", title: "Climate Tech Builders", description: "Building solutions for climate change. Hardware, software, policy, and impact investing discussions.", category: "Impact", industry: "Climate Tech", members: 560, posts: 230, isPublic: true, trending: false, tags: ["Climate", "Sustainability", "Impact"], recentActivity: "Weekly meetup tomorrow" },
  { id: "fintech-eu", title: "Fintech Europe", description: "European fintech ecosystem. Regulation, open banking, and cross-border payments.", category: "Technology", industry: "Fintech", members: 720, posts: 410, isPublic: false, trending: false, tags: ["Fintech", "Europe", "Regulation"], recentActivity: "AMA with ECB advisor" },
  { id: "design-founders", title: "Design-Led Founders", description: "Product design, UX strategy, and design systems for startup founders and product teams.", category: "Design", industry: "Design", members: 430, posts: 198, isPublic: true, trending: true, tags: ["Design", "UX", "Product"], recentActivity: "Case study shared" },
];

const categories = ["Technology", "Business", "Community", "Impact", "Design"];

const fade = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
});

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(["ai-founders", "first-time-founders"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = mockCommunities.filter((c) => {
    const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()) || c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === "all" || c.category === categoryFilter;
    const matchesAccess = accessFilter === "all" || (accessFilter === "public" ? c.isPublic : !c.isPublic);
    return matchesSearch && matchesCat && matchesAccess;
  });

  const toggleJoin = (id: string) => setJoinedCommunities(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const featuredCommunities = mockCommunities.filter(c => c.trending);

  return (
    <AppLayout title="Communities" headerActions={<Button variant="default" size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Create</Button>}>
      <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
        {/* Trending */}
        {!isLoading && (
          <motion.div {...fade(0)}>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-4 w-4 text-accent" />
              <h2 className="font-display text-sm font-semibold text-foreground">Trending Communities</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {featuredCommunities.map((c, i) => (
                <motion.div key={c.id} {...fade(i + 1)}>
                  <Link to={`/communities/${c.id}`} className="group rounded-xl border border-border bg-card p-4 block transition-colors hover:border-primary/15">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-[10px]"><TrendingUp className="h-2.5 w-2.5 mr-1" /> Trending</Badge>
                      {c.isPublic ? <Globe className="h-3.5 w-3.5 text-muted-foreground" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.members.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{c.posts}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search communities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Access" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* All Communities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-foreground">
              All Communities <span className="font-normal text-muted-foreground ml-1">({filtered.length})</span>
            </h2>
          </div>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={categoryFilter + accessFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((community, i) => (
                  <motion.div key={community.id} {...fade(i)} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/15">
                    <div className="flex items-center justify-between mb-2.5">
                      <Badge variant="secondary" className="text-[10px]">{community.category}</Badge>
                      {community.isPublic ? <Globe className="h-3.5 w-3.5 text-muted-foreground" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <Link to={`/communities/${community.id}`}>
                      <h3 className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{community.title}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{community.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {community.tags.map(t => <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{t}</span>)}
                    </div>
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /><span className="tabular-nums">{community.members.toLocaleString()}</span></span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /><span className="tabular-nums">{community.posts}</span></span>
                    </div>
                    <p className="text-xs text-primary/70 mt-1">{community.recentActivity}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 text-xs h-8" variant={joinedCommunities.includes(community.id) ? "secondary" : "default"} onClick={() => toggleJoin(community.id)}>
                        {joinedCommunities.includes(community.id) ? "Joined" : "Join"}
                      </Button>
                      <Link to={`/communities/${community.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8">View <ChevronRight className="h-3 w-3 ml-0.5" /></Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-border bg-card">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-base font-semibold text-foreground mb-1">No communities found</h3>
            <p className="text-sm text-muted-foreground">Try different search terms or filters</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
