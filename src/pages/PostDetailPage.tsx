import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Send,
  Loader2,
  BookOpen,
  Pin,
  Clock,
  User,
  CornerDownRight,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────
interface Post {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  authorName: string | null;
  isPinned: boolean;
  reactionsCount: number;
  commentsCount: number;
  createdAt: string;
}

interface Comment {
  id: string;
  body: string;
  authorId: string;
  authorName: string | null;
  parentId: string | null;
  reactionsCount: number;
  createdAt: string;
}

// ── Helpers ─────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string | null, fallback = "?") {
  if (!name) return fallback;
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Skeleton ─────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-5">
      <div className="h-7 w-32 rounded bg-secondary animate-pulse" />
      <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
        <div className="h-6 w-3/4 rounded bg-secondary animate-pulse" />
        <div className="h-4 w-full rounded bg-secondary animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-secondary animate-pulse" />
        <div className="h-4 w-4/6 rounded bg-secondary animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-border bg-card/50 p-4">
            <div className="h-8 w-8 rounded-full bg-secondary animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-28 rounded bg-secondary animate-pulse" />
              <div className="h-3 w-full rounded bg-secondary animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Comment component ────────────────────────────────────────
function CommentItem({
  comment,
  userId,
  onReply,
}: {
  comment: Comment;
  userId?: string;
  onReply?: (name: string | null) => void;
}) {
  const isOwn = comment.authorId === userId;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        isOwn ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
      }`}>
        {initials(comment.authorName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-secondary/50 px-4 py-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {comment.authorName ?? "Anonymous"}
            </span>
            {isOwn && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">You</Badge>
            )}
            <span className="text-[11px] text-muted-foreground ml-auto">{relativeTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
        </div>
        <div className="mt-1.5 ml-2 flex items-center gap-3">
          {comment.reactionsCount > 0 && (
            <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="h-3 w-3" />
              {comment.reactionsCount}
            </button>
          )}
          {onReply && (
            <button
              onClick={() => onReply(comment.authorName)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              <CornerDownRight className="h-3 w-3" /> Reply
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function PostDetailPage() {
  const { id: communityId, postId } = useParams<{ id: string; postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!communityId || !postId) { setError(true); setLoading(false); return; }
    setLoading(true);
    setError(false);
    try {
      const res = await api.communities.getPost(communityId, postId);
      setPost(res.post);
      setComments(res.comments ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [communityId, postId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentBody.trim() || !communityId || !postId) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    setSubmitting(true);
    try {
      await api.communities.createComment(communityId, postId, { body: commentBody.trim() });
      setCommentBody("");
      toast.success("Comment posted!");
      load();
    } catch {
      toast.error("Could not post comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [commentBody, communityId, postId, isAuthenticated, navigate, load]);

  const handleReply = useCallback((authorName: string | null) => {
    setCommentBody(`@${authorName ?? "user"} `);
    commentInputRef.current?.focus();
  }, []);

  if (loading) return <AppLayout title="Post"><PostSkeleton /></AppLayout>;

  if (error || !post) {
    return (
      <AppLayout title="Post">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Post not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">This post may have been removed.</p>
            <Link to={`/communities/${communityId}`}>
              <Button variant="outline" className="mt-5 gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to community
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={post.title.length > 40 ? post.title.slice(0, 40) + "…" : post.title}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Back */}
        <Link
          to={`/communities/${communityId}`}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to community
        </Link>

        {/* Post card */}
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card/60 p-6"
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-semibold text-muted-foreground">
                {initials(post.authorName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{post.authorName ?? "Anonymous"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{relativeTime(post.createdAt)}</span>
                </div>
              </div>
            </div>
            {post.isPinned && (
              <Badge className="bg-accent/10 text-accent border-accent/20 text-xs gap-1 shrink-0">
                <Pin className="h-3 w-3" /> Pinned
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-xl font-bold text-foreground mb-3 leading-tight">{post.title}</h1>

          {/* Body */}
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mb-4">{post.body}</div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 border-t border-border/50 pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5" /> {post.reactionsCount} reactions
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" /> {comments.length} comments
            </div>
          </div>
        </motion.article>

        {/* Comments section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold text-foreground">
              {comments.length > 0 ? `${comments.length} Comment${comments.length > 1 ? "s" : ""}` : "Be the first to comment"}
            </h2>
          </div>

          {/* Comment input */}
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {user ? initials(user.name) : <User className="h-4 w-4" />}
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  ref={commentInputRef}
                  placeholder={isAuthenticated ? "Write a comment…" : "Log in to comment"}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  disabled={!isAuthenticated}
                  rows={2}
                  className="resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment();
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Ctrl+Enter to submit</span>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    disabled={!commentBody.trim() || !isAuthenticated || submitting}
                    onClick={handleSubmitComment}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <BookOpen className="mb-2 h-8 w-8 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    userId={user?.id}
                    onReply={handleReply}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
