import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  MessageSquare,
  Globe,
  ArrowLeft,
  Heart,
  Send,
  Pin,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

const communityData: Record<string, {
  title: string; description: string; category: string; members: number; posts: number; isPublic: boolean; tags: string[];
  about: string; rules: string[];
}> = {
  "ai-founders": {
    title: "AI Founders Circle", description: "Connect with founders building AI-first products.", category: "Technology",
    members: 1240, posts: 890, isPublic: true, tags: ["AI", "Machine Learning", "LLMs"],
    about: "A curated community for founders building AI-first companies. Share research, datasets, funding opportunities, and go-to-market strategies. Weekly AMAs with AI leaders.",
    rules: ["Be respectful and constructive", "No spam or self-promotion without value", "Share learnings openly", "Protect confidential information"],
  },
};

const defaultCommunity = {
  title: "Community", description: "A startup community on CoFounderBay.", category: "General",
  members: 500, posts: 200, isPublic: true, tags: ["Startups"],
  about: "Welcome to this community. Connect, share, and grow together.",
  rules: ["Be respectful", "No spam"],
};

const mockPosts = [
  {
    id: 1, author: "Sarah Kim", role: "Mentor", title: "Best practices for fine-tuning LLMs in production",
    body: "After deploying 3 LLM-based products, here are my top lessons learned on fine-tuning for production...",
    tags: ["LLM", "Production"], likes: 42, comments: 18, time: "2h ago", pinned: true,
  },
  {
    id: 2, author: "Alex Chen", role: "Founder", title: "Looking for technical co-founder - AI health startup",
    body: "We're building an AI diagnostic tool for rare diseases. Looking for a CTO with ML/computer vision experience...",
    tags: ["Co-founder", "Health AI"], likes: 28, comments: 12, time: "5h ago", pinned: false,
  },
  {
    id: 3, author: "Maria Santos", role: "Investor", title: "Q1 2026 AI startup funding landscape",
    body: "Just published our quarterly analysis of AI startup funding. Key trends: enterprise AI consolidation, vertical AI growth...",
    tags: ["Funding", "Analysis"], likes: 67, comments: 31, time: "1d ago", pinned: false,
  },
  {
    id: 4, author: "James Okafor", role: "Founder", title: "How we reached $1M ARR with AI-powered customer support",
    body: "Took us 14 months from launch to $1M ARR. Here's our playbook including pricing, distribution, and retention...",
    tags: ["Growth", "Case Study"], likes: 89, comments: 45, time: "2d ago", pinned: false,
  },
];

const mockMembers = [
  { name: "Sarah Kim", role: "Moderator" },
  { name: "Alex Chen", role: "Member" },
  { name: "Maria Santos", role: "Member" },
  { name: "James Okafor", role: "Member" },
  { name: "Priya Sharma", role: "Member" },
];

export default function CommunityDetailPage() {
  const { id } = useParams();
  const community = communityData[id || ""] || defaultCommunity;
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "members" | "about">("posts");

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => prev.includes(postId) ? prev.filter(p => p !== postId) : [...prev, postId]);
  };

  return (
    <AppLayout title={community.title}>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-card-gradient p-6">
          <Link to="/communities" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3 w-3" /> Back to Communities
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-xl font-bold text-foreground">{community.title}</h1>
                {community.isPublic ? <Globe className="h-4 w-4 text-muted-foreground" /> : null}
              </div>
              <p className="text-sm text-muted-foreground">{community.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{community.members.toLocaleString()} members</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{community.posts} posts</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {community.tags.map(t => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
            <Button variant="default" size="sm" className="shrink-0">Joined</Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["posts", "members", "about"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="space-y-4">
            {/* New post input */}
            <div className="rounded-xl border border-border/50 bg-card-gradient p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="text-xs font-semibold text-primary">JD</span>
                </div>
                <div className="flex-1">
                  <Input placeholder="Start a discussion..." value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} className="bg-secondary/50 mb-2" />
                  <div className="flex justify-end">
                    <Button size="sm" className="text-xs h-8 gap-1.5" disabled={!newPostTitle.trim()}>
                      <Send className="h-3 w-3" /> Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            {mockPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border/50 bg-card-gradient p-5 hover:border-primary/20 transition-colors"
              >
                {post.pinned && (
                  <div className="flex items-center gap-1 text-[10px] text-accent mb-2">
                    <Pin className="h-3 w-3" /> Pinned
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-[10px] font-semibold text-primary">{post.author.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{post.author}</span>
                    <Badge variant="secondary" className="ml-2 text-[9px]">{post.role}</Badge>
                  </div>
                  <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.time}</span>
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground mb-1">{post.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{post.body}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map(t => (
                    <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
                  <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1 text-xs transition-colors ${likedPosts.includes(post.id) ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                    <Heart className={`h-3.5 w-3.5 ${likedPosts.includes(post.id) ? "fill-accent" : ""}`} />
                    {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <MessageSquare className="h-3.5 w-3.5" /> {post.comments}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-2">
            {mockMembers.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card-gradient p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-xs font-semibold text-primary">{member.name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <Badge variant="secondary" className="text-[10px]">{member.role}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8">View Profile</Button>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "about" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="rounded-xl border border-border/50 bg-card-gradient p-6">
              <h3 className="font-display text-sm font-semibold text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{community.about}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card-gradient p-6">
              <h3 className="font-display text-sm font-semibold text-foreground mb-3">Community Rules</h3>
              <ul className="space-y-2">
                {community.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
