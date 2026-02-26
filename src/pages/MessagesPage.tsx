import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Send,
  Check,
  X,
  Clock,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Users, label: "My Network", path: "/network" },
  { icon: GraduationCap, label: "Learning", path: "/learning" },
];

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
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isOwn: boolean;
}

const mockIntroRequests: IntroRequest[] = [
  {
    id: "ir1",
    from: { name: "Elena V.", initials: "EV", role: "Growth Lead" },
    message: "Hi Jane! I'm building a fintech startup and I think your product skills would be a perfect match. Would love to connect!",
    date: "2h ago",
    status: "pending",
  },
  {
    id: "ir2",
    from: { name: "Nikos M.", initials: "NM", role: "Angel Investor" },
    message: "Impressed by your startup's traction. I'd like to discuss potential investment opportunities.",
    date: "5h ago",
    status: "pending",
  },
  {
    id: "ir3",
    from: { name: "Sara K.", initials: "SK", role: "UX Designer" },
    message: "Saw your post about looking for a design co-founder. I have 8 years of product design experience.",
    date: "1d ago",
    status: "accepted",
  },
];

const mockConversations: Conversation[] = [
  { id: "c1", name: "Alex Chen", initials: "AC", role: "Founder", lastMessage: "That sounds great! Let's schedule a call.", time: "10m", unread: 2, online: true },
  { id: "c2", name: "Maria Santos", initials: "MS", role: "Investor", lastMessage: "I've reviewed the deck, very impressive metrics.", time: "1h", unread: 1, online: true },
  { id: "c3", name: "Sara K.", initials: "SK", role: "UX Designer", lastMessage: "Here's the wireframe I mentioned.", time: "3h", unread: 0, online: false },
  { id: "c4", name: "Dimitris P.", initials: "DP", role: "Developer", lastMessage: "The MVP is coming along nicely!", time: "1d", unread: 0, online: false },
];

const mockMessages: Record<string, Message[]> = {
  c1: [
    { id: "m1", senderId: "other", text: "Hey Jane! Thanks for accepting my intro request.", time: "9:30 AM", isOwn: false },
    { id: "m2", senderId: "me", text: "Hi Alex! Your profile really stood out. Tell me more about your AI startup idea.", time: "9:32 AM", isOwn: true },
    { id: "m3", senderId: "other", text: "Sure! We're building an AI-powered tool for early-stage founders to validate ideas faster. Think of it as a co-pilot for product-market fit.", time: "9:35 AM", isOwn: false },
    { id: "m4", senderId: "me", text: "That's exactly the kind of problem I love solving. I've been working on similar validation frameworks.", time: "9:38 AM", isOwn: true },
    { id: "m5", senderId: "other", text: "That sounds great! Let's schedule a call.", time: "9:40 AM", isOwn: false },
  ],
  c2: [
    { id: "m1", senderId: "other", text: "Hi Jane, I came across your startup through CoFounderBay.", time: "Yesterday", isOwn: false },
    { id: "m2", senderId: "me", text: "Hi Maria! Thanks for reaching out. Happy to share more details.", time: "Yesterday", isOwn: true },
    { id: "m3", senderId: "other", text: "I've reviewed the deck, very impressive metrics.", time: "1h ago", isOwn: false },
  ],
};

export default function MessagesPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("chats");
  const [selectedConvo, setSelectedConvo] = useState<string>("c1");
  const [introRequests, setIntroRequests] = useState(mockIntroRequests);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState("");

  const currentConvo = mockConversations.find((c) => c.id === selectedConvo);
  const currentMessages = messages[selectedConvo] || [];

  const filteredConversations = mockConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingIntros = introRequests.filter((r) => r.status === "pending");

  const handleAcceptIntro = (id: string) => {
    setIntroRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "accepted" as const } : r))
    );
  };

  const handleDeclineIntro = (id: string) => {
    setIntroRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "declined" as const } : r))
    );
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      senderId: "me",
      text: messageInput,
      time: "Just now",
      isOwn: true,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedConvo]: [...(prev[selectedConvo] || []), newMsg],
    }));
    setMessageInput("");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">
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
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="font-display text-xl font-bold text-foreground">
              Messages
            </h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  5
                </span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">JD</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left panel — conversation list + intro requests */}
          <div className="w-full max-w-sm border-r border-border flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="p-4 pb-0">
                <TabsList className="w-full">
                  <TabsTrigger value="chats" className="flex-1 gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chats
                  </TabsTrigger>
                  <TabsTrigger value="intros" className="flex-1 gap-1.5 relative">
                    <UserPlus className="h-3.5 w-3.5" />
                    Intros
                    {pendingIntros.length > 0 && (
                      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                        {pendingIntros.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Chats tab */}
              <TabsContent value="chats" className="flex-1 flex flex-col mt-0">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-0.5 px-2">
                    {filteredConversations.map((convo) => (
                      <button
                        key={convo.id}
                        onClick={() => setSelectedConvo(convo.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                          selectedConvo === convo.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-secondary/50 border border-transparent"
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                              {convo.initials}
                            </AvatarFallback>
                          </Avatar>
                          {convo.online && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground truncate">
                              {convo.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                              {convo.time}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {convo.lastMessage}
                            </p>
                            {convo.unread > 0 && (
                              <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {convo.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Intro Requests tab */}
              <TabsContent value="intros" className="flex-1 flex flex-col mt-0">
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4">
                    {introRequests.map((req) => (
                      <motion.div
                        key={req.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border/50 bg-card-gradient p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                              {req.from.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                {req.from.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {req.date}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {req.from.role}
                            </span>
                            <p className="mt-2 text-xs text-foreground/80 leading-relaxed">
                              {req.message}
                            </p>
                            {req.status === "pending" ? (
                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="hero"
                                  className="h-8 gap-1.5 text-xs"
                                  onClick={() => handleAcceptIntro(req.id)}
                                >
                                  <Check className="h-3 w-3" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1.5 text-xs"
                                  onClick={() => handleDeclineIntro(req.id)}
                                >
                                  <X className="h-3 w-3" />
                                  Decline
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant={req.status === "accepted" ? "default" : "secondary"}
                                className="mt-3"
                              >
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
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {currentConvo.initials}
                      </AvatarFallback>
                    </Avatar>
                    {currentConvo.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {currentConvo.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {currentConvo.online ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Online
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Last seen recently
                        </>
                      )}
                      <span className="mx-1">·</span>
                      {currentConvo.role}
                    </p>
                  </div>
                </div>

                {/* Messages area */}
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <AnimatePresence initial={false}>
                      {currentMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              msg.isOwn
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-secondary text-secondary-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p
                              className={`mt-1 text-[10px] ${
                                msg.isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                              }`}
                            >
                              {msg.time}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t border-border p-4">
                  <div className="flex items-center gap-2 max-w-2xl mx-auto">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message…"
                      className="flex-1 bg-secondary/50 border-border/50"
                    />
                    <Button
                      size="icon"
                      variant="hero"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Select a conversation to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
