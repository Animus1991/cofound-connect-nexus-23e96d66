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
  User,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AI_AGENTS, type AIAgent } from "@/services/aiService";
import { useMessaging } from "@/stores/useMessaging";
import ReactMarkdown from "react-markdown";

type ChatView = "list" | "thread";

export default function ChatWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    conversations,
    aiConversations,
    totalUnread,
    getMessages,
    sendMessage,
    sendAIMessage,
    markAsRead,
  } = useMessaging();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<ChatView>("list");
  const [activeTab, setActiveTab] = useState<"chats" | "agents">("chats");
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hiddenPaths = ["/", "/login", "/signup", "/onboarding"];
  const isHidden = hiddenPaths.includes(location.pathname);

  const currentConvoId = activeAgent ? `agent-${activeAgent.id}` : activeConvoId;
  const currentMessages = currentConvoId ? getMessages(currentConvoId) : [];

  // Auto-scroll on new messages AND on streaming content changes
  const lastMsgContent = currentMessages[currentMessages.length - 1]?.content;
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, isTyping, lastMsgContent]);

  useEffect(() => {
    if (view === "thread") inputRef.current?.focus();
  }, [view]);

  const openAgentChat = useCallback((agent: AIAgent) => {
    setActiveAgent(agent);
    setActiveConvoId(null);
    setView("thread");
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const openUserChat = useCallback(
    (convoId: string) => {
      setActiveConvoId(convoId);
      setActiveAgent(null);
      setView("thread");
      markAsRead(convoId);
    },
    [markAsRead]
  );

  if (isHidden) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    if (activeAgent) {
      setIsTyping(true);
      try {
        await sendAIMessage(activeAgent.id, text);
      } finally {
        setIsTyping(false);
      }
    } else if (activeConvoId) {
      sendMessage(activeConvoId, text);
    }
  };

  // Show typing dots only during the brief initial thinking pause (before first token)
  const isStreamingActive = activeAgent
    ? currentMessages.length > 0 &&
      currentMessages[currentMessages.length - 1]?.role === "assistant" &&
      currentMessages[currentMessages.length - 1]?.content === ""
    : false;

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="fixed bottom-[5.5rem] right-4 lg:bottom-6 lg:right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated"
          >
            <MessageSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
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
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "auto" : undefined,
            }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
            className="fixed bottom-[5.5rem] right-4 lg:bottom-6 lg:right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background shadow-elevated overflow-hidden flex flex-col"
            style={{
              maxHeight: isMinimized
                ? undefined
                : "min(520px, calc(100vh - 120px))",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                {view === "thread" && (
                  <button
                    onClick={() => {
                      setView("list");
                      setActiveAgent(null);
                      setActiveConvoId(null);
                    }}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                {view === "thread" && activeAgent ? (
                  <div className="flex items-center gap-2">
                    <span className="text-base">{activeAgent.avatar}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-none">
                        {activeAgent.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-primary" /> AI
                        Agent
                      </p>
                    </div>
                  </div>
                ) : view === "thread" && activeConvoId ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-medium">
                        {
                          conversations.find((c) => c.id === activeConvoId)
                            ?.initials
                        }
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-foreground">
                      {
                        conversations.find((c) => c.id === activeConvoId)
                          ?.name
                      }
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    Messages
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {view === "thread" && (
                  <button
                    onClick={() => navigate("/messages")}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                    title="Open full view"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                >
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setView("list");
                  }}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors"
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
                    <div className="flex border-b border-border shrink-0">
                      <button
                        onClick={() => setActiveTab("chats")}
                        className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${
                          activeTab === "chats"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Chats
                        {totalUnread > 0 && (
                          <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/15 px-1 text-[9px] font-semibold text-primary">
                            {totalUnread}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("agents")}
                        className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1 ${
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
                        <div className="p-1.5 space-y-0.5">
                          {conversations.map((convo) => (
                            <button
                              key={convo.id}
                              onClick={() => openUserChat(convo.id)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
                            >
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                                    {convo.initials}
                                  </AvatarFallback>
                                </Avatar>
                                {convo.online && (
                                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-[1.5px] border-background bg-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {convo.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground ml-2">
                                    {convo.time}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {convo.lastMessage}
                                </p>
                              </div>
                              {convo.unread > 0 && (
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                  {convo.unread}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {AI_AGENTS.map((agent) => (
                            <button
                              key={agent.id}
                              onClick={() => openAgentChat(agent)}
                              className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-secondary"
                            >
                              <span className="text-xl shrink-0">
                                {agent.avatar}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-foreground">
                                    {agent.name}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] px-1.5 py-0 h-4"
                                  >
                                    AI
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {agent.description}
                                </p>
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
                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-2.5">
                        {currentMessages.length === 0 && activeAgent && (
                          <div className="text-center py-6">
                            <span className="text-3xl block mb-2">
                              {activeAgent.avatar}
                            </span>
                            <p className="text-sm font-medium text-foreground">
                              {activeAgent.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[220px] mx-auto">
                              {activeAgent.description}
                            </p>
                            <div className="space-y-1.5">
                              {activeAgent.suggestedPrompts.map((prompt) => (
                                <button
                                  key={prompt}
                                  onClick={() => setInput(prompt)}
                                  className="block w-full text-left rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground/80 transition-colors hover:bg-secondary"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {currentMessages.length === 0 && !activeAgent && (
                          <div className="text-center py-8">
                            <User className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Start a conversation
                            </p>
                          </div>
                        )}

                        {currentMessages.filter((m) => m.content !== "").map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.role === "user" && activeAgent
                                ? "justify-end"
                                : msg.role === "assistant" && !activeAgent
                                  ? "justify-end"
                                  : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex items-end gap-1.5 max-w-[85%] ${
                                (msg.role === "user" && activeAgent) ||
                                (msg.role === "assistant" && !activeAgent)
                                  ? "flex-row-reverse"
                                  : ""
                              }`}
                            >
                              {msg.role === "assistant" && activeAgent && (
                                <span className="text-sm shrink-0 mb-0.5">
                                  {activeAgent.avatar}
                                </span>
                              )}
                              <div
                                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                  (msg.role === "user" && activeAgent) ||
                                  (msg.role === "assistant" && !activeAgent)
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                                }`}
                              >
                                {activeAgent && msg.role === "assistant" ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1 [&_li]:my-0.5">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <p>{msg.content}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {(isTyping || isStreamingActive) && (
                          <div className="flex items-end gap-1.5">
                            <span className="text-sm">
                              {activeAgent?.avatar || "🤖"}
                            </span>
                            <div className="bg-secondary rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                              <div className="flex gap-1">
                                {[0, 150, 300].map((d) => (
                                  <span
                                    key={d}
                                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                                    style={{ animationDelay: `${d}ms` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={scrollRef} />
                      </div>
                    </ScrollArea>

                    <div className="border-t border-border px-3 py-2 shrink-0">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSend();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={
                            activeAgent
                              ? `Ask ${activeAgent.name}...`
                              : "Type a message..."
                          }
                          className="flex-1 h-8 text-sm border-border"
                          disabled={isTyping}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={!input.trim() || isTyping}
                        >
                          <Send className="h-3.5 w-3.5" />
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
