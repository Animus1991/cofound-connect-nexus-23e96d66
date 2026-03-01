import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Search,
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  X,
  UserPlus,
  Paperclip,
  Smile,
  Image,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────
interface IntroRequest {
  id: string;
  from: { name: string; initials: string; role: string };
  message: string;
  date: string;
  status: "pending" | "accepted" | "declined";
}

interface Conversation {
  id: string;
  name: string;
  initials: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  typing: boolean;
}

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Attachment {
  name: string;
  type: "image" | "file";
  size: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  reactions: Reaction[];
  attachment?: Attachment;
}

// ── Mock data ──────────────────────────────────────────────
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "🚀", "💡"];

const mockIntroRequests: IntroRequest[] = [
  { id: "ir1", from: { name: "Elena V.", initials: "EV", role: "Growth Lead" }, message: "Hi Jane! I'm building a fintech startup and I think your product skills would be a perfect match. Would love to connect!", date: "2h ago", status: "pending" },
  { id: "ir2", from: { name: "Nikos M.", initials: "NM", role: "Angel Investor" }, message: "Impressed by your startup's traction. I'd like to discuss potential investment opportunities.", date: "5h ago", status: "pending" },
  { id: "ir3", from: { name: "Sara K.", initials: "SK", role: "UX Designer" }, message: "Saw your post about looking for a design co-founder. I have 8 years of product design experience.", date: "1d ago", status: "accepted" },
];

const mockConversations: Conversation[] = [
  { id: "c1", name: "Alex Chen", initials: "AC", role: "Founder", lastMessage: "That sounds great! Let's schedule a call.", time: "10m", unread: 2, online: true, typing: true },
  { id: "c2", name: "Maria Santos", initials: "MS", role: "Investor", lastMessage: "I've reviewed the deck, very impressive metrics.", time: "1h", unread: 1, online: true, typing: false },
  { id: "c3", name: "Sara K.", initials: "SK", role: "UX Designer", lastMessage: "Here's the wireframe I mentioned.", time: "3h", unread: 0, online: false, typing: false },
  { id: "c4", name: "Dimitris P.", initials: "DP", role: "Developer", lastMessage: "The MVP is coming along nicely!", time: "1d", unread: 0, online: false, typing: false },
];

const mockMessages: Record<string, Message[]> = {
  c1: [
    { id: "m1", senderId: "other", text: "Hey Jane! Thanks for accepting my intro request.", time: "9:30 AM", isOwn: false, reactions: [] },
    { id: "m2", senderId: "me", text: "Hi Alex! Your profile really stood out. Tell me more about your AI startup idea.", time: "9:32 AM", isOwn: true, status: "read", reactions: [{ emoji: "👍", count: 1, reacted: false }] },
    { id: "m3", senderId: "other", text: "Sure! We're building an AI-powered tool for early-stage founders to validate ideas faster.", time: "9:35 AM", isOwn: false, reactions: [{ emoji: "🚀", count: 1, reacted: true }] },
    { id: "m4", senderId: "me", text: "That's exactly the kind of problem I love solving. I've been working on similar validation frameworks.", time: "9:38 AM", isOwn: true, status: "read", reactions: [] },
    { id: "m5", senderId: "other", text: "That sounds great! Let's schedule a call.", time: "9:40 AM", isOwn: false, reactions: [] },
  ],
  c2: [
    { id: "m1", senderId: "other", text: "Hi Jane, I came across your startup through CoFounderBay.", time: "Yesterday", isOwn: false, reactions: [] },
    { id: "m2", senderId: "me", text: "Hi Maria! Thanks for reaching out. Happy to share more details.", time: "Yesterday", isOwn: true, status: "delivered", reactions: [] },
    { id: "m3", senderId: "other", text: "I've reviewed the deck, very impressive metrics.", time: "1h ago", isOwn: false, reactions: [], attachment: { name: "pitch_deck_review.pdf", type: "file", size: "2.3 MB" } },
  ],
};

// ── Component ──────────────────────────────────────────────
export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("chats");
  const [selectedConvo, setSelectedConvo] = useState<string>("c1");
  const [introRequests, setIntroRequests] = useState(mockIntroRequests);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentConvo = mockConversations.find((c) => c.id === selectedConvo);
  const currentMessages = messages[selectedConvo] || [];
  const filteredConversations = mockConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pendingIntros = introRequests.filter((r) => r.status === "pending");

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length]);

  const handleAcceptIntro = (id: string) => {
    setIntroRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "accepted" as const } : r)));
  };
  const handleDeclineIntro = (id: string) => {
    setIntroRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "declined" as const } : r)));
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      senderId: "me",
      text: messageInput,
      time: "Just now",
      isOwn: true,
      status: "sent",
      reactions: [],
    };
    setMessages((prev) => ({
      ...prev,
      [selectedConvo]: [...(prev[selectedConvo] || []), newMsg],
    }));
    setMessageInput("");
  };

  const handleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) => {
      const convoMsgs = [...(prev[selectedConvo] || [])];
      const idx = convoMsgs.findIndex((m) => m.id === msgId);
      if (idx === -1) return prev;
      const msg = { ...convoMsgs[idx] };
      const existingIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
      if (existingIdx >= 0) {
        const r = { ...msg.reactions[existingIdx] };
        if (r.reacted) {
          r.count -= 1;
          r.reacted = false;
        } else {
          r.count += 1;
          r.reacted = true;
        }
        msg.reactions = [...msg.reactions];
        msg.reactions[existingIdx] = r;
        if (r.count <= 0) msg.reactions.splice(existingIdx, 1);
      } else {
        msg.reactions = [...msg.reactions, { emoji, count: 1, reacted: true }];
      }
      convoMsgs[idx] = msg;
      return { ...prev, [selectedConvo]: convoMsgs };
    });
  };

  const ReadReceipt = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === "read") return <CheckCheck className="h-3 w-3 text-primary" />;
    if (status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    return <Check className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <AppLayout title="Messages">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left panel */}
        <div className="w-full max-w-sm border-r border-border flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="p-4 pb-0">
              <TabsList className="w-full">
                <TabsTrigger value="chats" className="flex-1 gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Chats
                </TabsTrigger>
                <TabsTrigger value="intros" className="flex-1 gap-1.5 relative">
                  <UserPlus className="h-3.5 w-3.5" /> Intros
                  {pendingIntros.length > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                      {pendingIntros.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chats" className="flex-1 flex flex-col mt-0">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search conversations…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50 border-border/50" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-0.5 px-2">
                  {filteredConversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => setSelectedConvo(convo.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                        selectedConvo === convo.id ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50 border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{convo.initials}</AvatarFallback>
                        </Avatar>
                        {convo.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate">{convo.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{convo.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          {convo.typing ? (
                            <span className="text-xs text-primary italic flex items-center gap-1">
                              typing
                              <span className="flex gap-0.5">
                                <span className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                              </span>
                            </span>
                          ) : (
                            <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                          )}
                          {convo.unread > 0 && (
                            <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{convo.unread}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="intros" className="flex-1 flex flex-col mt-0">
              <ScrollArea className="flex-1">
                <div className="space-y-3 p-4">
                  {introRequests.map((req) => (
                    <motion.div key={req.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 bg-card p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{req.from.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{req.from.name}</span>
                            <span className="text-[10px] text-muted-foreground">{req.date}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{req.from.role}</span>
                          <p className="mt-2 text-xs text-foreground/80 leading-relaxed">{req.message}</p>
                          {req.status === "pending" ? (
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" variant="hero" className="h-8 gap-1.5 text-xs" onClick={() => handleAcceptIntro(req.id)}>
                                <Check className="h-3 w-3" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => handleDeclineIntro(req.id)}>
                                <X className="h-3 w-3" /> Decline
                              </Button>
                            </div>
                          ) : (
                            <Badge variant={req.status === "accepted" ? "default" : "secondary"} className="mt-3">
                              {req.status === "accepted" ? "Accepted — Chat unlocked" : "Declined"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel — chat */}
        <div className="flex-1 flex flex-col">
          {currentConvo ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{currentConvo.initials}</AvatarFallback>
                  </Avatar>
                  {currentConvo.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{currentConvo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentConvo.typing ? (
                      <span className="text-primary">typing…</span>
                    ) : (
                      <>{currentConvo.online ? "Online" : "Offline"} · {currentConvo.role}</>
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {currentMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} group`}>
                      <div className="relative">
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          msg.isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}>
                          {/* Attachment */}
                          {msg.attachment && (
                            <div className={`flex items-center gap-2 mb-2 rounded-lg p-2 ${msg.isOwn ? "bg-primary-foreground/10" : "bg-background/50"}`}>
                              {msg.attachment.type === "image" ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{msg.attachment.name}</p>
                                <p className="text-[10px] opacity-60">{msg.attachment.size}</p>
                              </div>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <div className={`mt-1 flex items-center gap-1 ${msg.isOwn ? "justify-end" : ""}`}>
                            <span className={`text-[10px] ${msg.isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</span>
                            {msg.isOwn && <ReadReceipt status={msg.status} />}
                          </div>
                        </div>

                        {/* Reactions display */}
                        {msg.reactions.length > 0 && (
                          <div className={`flex gap-1 mt-1 ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                            {msg.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => handleReaction(msg.id, r.emoji)}
                                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                                  r.reacted ? "border-primary/30 bg-primary/10" : "border-border bg-card"
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="text-[10px] text-muted-foreground">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reaction picker (hover) */}
                        <div className={`absolute top-0 ${msg.isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 transition-opacity px-1`}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                                <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1.5" side="top">
                              <div className="flex gap-1">
                                {EMOJI_OPTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                    className="h-8 w-8 flex items-center justify-center rounded hover:bg-secondary transition-colors text-lg"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input bar */}
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message…"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-secondary/50"
                  />
                  <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
