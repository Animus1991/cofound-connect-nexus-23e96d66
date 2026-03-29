import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  X,
  Minus,
  ChevronLeft,
  Sparkles,
  Bot,
  User,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AI_AGENTS,
  getAIResponse,
  getAgent,
  type AIAgent,
  type ChatMessage,
} from "@/services/aiService";

// ── Types ──────────────────────────────────────────────────
interface UserConversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

type ChatView = "list" | "thread";

const mockUserConversations: UserConversation[] = [
  { id: "u1", name: "Alex Chen", initials: "AC", lastMessage: "Let's schedule a call!", time: "10m", unread: 2, online: true },
  { id: "u2", name: "Maria Santos", initials: "MS", lastMessage: "Deck looks great 🚀", time: "1h", unread: 0, online: true },
  { id: "u3", name: "Dimitris P.", initials: "DP", lastMessage: "MVP is ready for testing", time: "3h", unread: 0, online: false },
];

// ── Component ──────────────────────────────────────────────
export default function ChatWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<ChatView>("list");
  const [activeTab, setActiveTab] = useState<"chats" | "agents">("chats");

  // Thread state
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hiddenPaths = ["/", "/login", "/signup", "/onboarding"];
  const isHidden = hiddenPaths.includes(location.pathname);

  const totalUnread = mockUserConversations.reduce((sum, c) => sum + c.unread, 0);

  const currentMessages = activeAgent
    ? messages[`agent-${activeAgent.id}`] || []
    : messages[`user-${activeConvoId}`] || [];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, isTyping]);

  useEffect(() => {
    if (view === "thread") inputRef.current?.focus();
  }, [view]);

  if (isHidden) return null;

  const openAgentChat = useCallback((agent: AIAgent) => {
    setActiveAgent(agent);
    setActiveConvoId(null);
    setView("thread");
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const openUserChat = useCallback((convo: UserConversation) => {
    setActiveConvoId(convo.id);
    setActiveAgent(null);
    setView("thread");
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const key = activeAgent ? `agent-${activeAgent.id}` : `user-${activeConvoId}`;

    setMessages((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), userMsg],
    }));

    if (activeAgent) {
      setIsTyping(true);
      try {
        const response = await getAIResponse(activeAgent.id, text);
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: response,
          timestamp: new Date(),
          agentId: activeAgent.id,
        };
        setMessages((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), aiMsg],
        }));
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => handleSend(), 50);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30"
          >
            <MessageSquare className="h-6 w-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {totalUnread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "auto" : undefined,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/60 bg-background shadow-2xl shadow-black/15 overflow-hidden flex flex-col"
            style={{ maxHeight: isMinimized ? undefined : "min(580px, calc(100vh - 120px))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/60 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2">
                {view === "thread" && (
                  <button
                    onClick={() => { setView("list"); setActiveAgent(null); setActiveConvoId(null); }}
                    className="p-1 rounded-md hover:bg-secondary/60 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                {view === "thread" && activeAgent ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{activeAgent.avatar}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-none">{activeAgent.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-primary" /> AI Agent
                      </p>
                    </div>
                  </div>
                ) : view === "thread" && activeConvoId ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                        {mockUserConversations.find((c) => c.id === activeConvoId)?.initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-semibold text-foreground">
                      {mockUserConversations.find((c) => c.id === activeConvoId)?.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                      <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Messages</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {view === "thread" && (
                  <button
                    onClick={() => navigate("/messages")}
                    className="p-1.5 rounded-md hover:bg-secondary/60 transition-colors"
                    title="Open full view"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-md hover:bg-secondary/60 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setView("list"); }}
                  className="p-1.5 rounded-md hover:bg-secondary/60 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* List View */}
                {view === "list" && (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Tabs */}
                    <div className="flex border-b border-border/30 shrink-0">
                      <button
                        onClick={() => setActiveTab("chats")}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                          activeTab === "chats"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Chats
                        {totalUnread > 0 && (
                          <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                            {totalUnread}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("agents")}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                          activeTab === "agents"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" /> AI Agents
                      </button>
                    </div>

                    <ScrollArea className="flex-1">
                      {activeTab === "chats" ? (
                        <div className="p-2 space-y-0.5">
                          {mockUserConversations.map((convo) => (
                            <button
                              key={convo.id}
                              onClick={() => openUserChat(convo)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/40 active:scale-[0.99]"
                            >
                              <div className="relative">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                                    {convo.initials}
                                  </AvatarFallback>
                                </Avatar>
                                {convo.online && (
                                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground truncate">{convo.name}</span>
                                  <span className="text-[10px] text-muted-foreground ml-2">{convo.time}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{convo.lastMessage}</p>
                              </div>
                              {convo.unread > 0 && (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                  {convo.unread}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 space-y-2">
                          {AI_AGENTS.map((agent) => (
                            <button
                              key={agent.id}
                              onClick={() => openAgentChat(agent)}
                              className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all hover:bg-secondary/40 active:scale-[0.99] group"
                            >
                              <span className="text-2xl shrink-0 mt-0.5">{agent.avatar}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{agent.name}</span>
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                    AI
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{agent.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}

                {/* Thread View */}
                {view === "thread" && (
                  <div className="flex flex-col flex-1 min-h-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {/* Welcome / suggested prompts if empty */}
                        {currentMessages.length === 0 && activeAgent && (
                          <div className="text-center py-6">
                            <span className="text-4xl block mb-3">{activeAgent.avatar}</span>
                            <p className="text-sm font-medium text-foreground">{activeAgent.name}</p>
                            <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[240px] mx-auto">
                              {activeAgent.description}
                            </p>
                            <div className="space-y-1.5">
                              {activeAgent.suggestedPrompts.map((prompt) => (
                                <button
                                  key={prompt}
                                  onClick={() => { setInput(prompt); }}
                                  className="block w-full text-left rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-xs text-foreground/80 transition-all hover:bg-secondary/60 hover:border-primary/20"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {currentMessages.length === 0 && !activeAgent && (
                          <div className="text-center py-8">
                            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Start a conversation
                            </p>
                          </div>
                        )}

                        {/* Messages */}
                        {currentMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                              {msg.role === "assistant" && (
                                <span className="text-sm shrink-0 mb-1">{activeAgent?.avatar || "🤖"}</span>
                              )}
                              <div
                                className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-secondary/60 text-secondary-foreground rounded-bl-md"
                                }`}
                              >
                                {/* Basic markdown-like rendering */}
                                {msg.content.split("\n").map((line, i) => {
                                  const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                  return (
                                    <p
                                      key={i}
                                      className={line.trim() === "" ? "h-2" : ""}
                                      dangerouslySetInnerHTML={{ __html: boldLine }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                          <div className="flex items-end gap-2">
                            <span className="text-sm">{activeAgent?.avatar || "🤖"}</span>
                            <div className="bg-secondary/60 rounded-2xl rounded-bl-md px-4 py-3">
                              <div className="flex gap-1">
                                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={scrollRef} />
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="border-t border-border/30 px-3 py-2.5 shrink-0 bg-card/30">
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={activeAgent ? `Ask ${activeAgent.name}...` : "Type a message..."}
                          className="flex-1 h-9 text-sm bg-secondary/30 border-border/40"
                          disabled={isTyping}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          disabled={!input.trim() || isTyping}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
