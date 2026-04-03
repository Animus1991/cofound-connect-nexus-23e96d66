/**
 * ChatPopup — Floating chat window that shares state with MessagesPage
 * Uses the unified useMessaging store for consistent data across popup and full-page.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  X,
  Minimize2,
  Maximize2,
  ChevronLeft,
  Sparkles,
  Square,
  Smile,
  ExternalLink,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useMessaging, type Conversation, type UnifiedMessage } from "@/stores/useMessaging";
import { AI_AGENTS } from "@/services/aiService";

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

export default function ChatPopup({ isOpen, onClose, onMinimize, isMinimized }: ChatPopupProps) {
  const navigate = useNavigate();
  const {
    conversations,
    totalUnread,
    isStreaming,
    getMessages,
    sendMessage,
    sendAIMessage,
    cancelStreaming,
    toggleReaction,
    markAsRead,
    EMOJI_OPTIONS,
  } = useMessaging();

  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showConvoList, setShowConvoList] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine human + AI conversations
  const aiConvos: Conversation[] = AI_AGENTS.map((agent) => ({
    id: `agent-${agent.id}`,
    type: "ai" as const,
    name: agent.name,
    initials: agent.name.slice(0, 2).toUpperCase(),
    role: agent.specialization,
    lastMessage: agent.description,
    time: "",
    unread: 0,
    online: true,
    typing: false,
    agentId: agent.id,
    agentAvatar: agent.avatar,
  }));

  const allConversations = [...conversations, ...aiConvos];
  const currentConvo = allConversations.find((c) => c.id === selectedConvo);
  const currentMessages = getMessages(selectedConvo || "");

  const filteredConversations = allConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to latest message
  const lastMsgContent = currentMessages[currentMessages.length - 1]?.content;
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, isTyping, lastMsgContent]);

  const handleSelectConvo = useCallback((id: string) => {
    setSelectedConvo(id);
    setShowConvoList(false);
    markAsRead(id);
  }, [markAsRead]);

  const handleBack = useCallback(() => {
    setShowConvoList(true);
    setSelectedConvo(null);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConvo) return;
    const text = messageInput.trim();
    setMessageInput("");

    if (currentConvo?.type === "ai" && currentConvo.agentId) {
      setIsTyping(true);
      try {
        await sendAIMessage(currentConvo.agentId, text);
      } finally {
        setIsTyping(false);
      }
    } else {
      sendMessage(selectedConvo, text);
    }
  }, [messageInput, selectedConvo, currentConvo, sendAIMessage, sendMessage]);

  const handleOpenFullPage = useCallback(() => {
    onClose();
    navigate("/messages", { state: { conversationId: selectedConvo } });
  }, [navigate, onClose, selectedConvo]);

  // Detect streaming empty state for typing indicator
  const isStreamingEmpty =
    currentConvo?.type === "ai" &&
    currentMessages.length > 0 &&
    currentMessages[currentMessages.length - 1]?.role === "assistant" &&
    currentMessages[currentMessages.length - 1]?.content === "";

  const isOwnMessage = (msg: UnifiedMessage, convo: Conversation | undefined) => {
    if (!convo) return false;
    if (convo.type === "ai") return msg.role === "user";
    return msg.role === "assistant";
  };

  const ReadReceipt = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === "read") return <CheckCheck className="h-2.5 w-2.5 text-primary" />;
    if (status === "delivered") return <CheckCheck className="h-2.5 w-2.5 text-muted-foreground" />;
    return <Check className="h-2.5 w-2.5 text-muted-foreground" />;
  };

  if (!isOpen) return null;

  // Minimized state - just show badge
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg relative"
          onClick={onMinimize}
        >
          <MessageSquare className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 right-4 z-50 w-[380px] h-[624px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 shrink-0">
          <div className="flex items-center gap-2">
            {!showConvoList && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {showConvoList ? (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Messages</span>
                {totalUnread > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {totalUnread}
                  </Badge>
                )}
              </div>
            ) : currentConvo ? (
              <div className="flex items-center gap-2">
                {currentConvo.type === "ai" && currentConvo.agentAvatar ? (
                  <div className="h-7 w-7 flex items-center justify-center rounded-full bg-secondary text-sm">
                    {currentConvo.agentAvatar}
                  </div>
                ) : (
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                      {currentConvo.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">{currentConvo.name}</span>
                    {currentConvo.type === "ai" && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentConvo.type === "ai" ? "AI Agent" : currentConvo.role}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleOpenFullPage}
              title="Open full page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onMinimize}
              title="Minimize"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {showConvoList ? (
          /* Conversation List */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search */}
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-secondary/50"
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No conversations found
                  </div>
                ) : (
                  filteredConversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => handleSelectConvo(convo.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        selectedConvo === convo.id
                          ? "bg-primary/10"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {convo.type === "ai" && convo.agentAvatar ? (
                          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-secondary text-base">
                            {convo.agentAvatar}
                          </div>
                        ) : (
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                              {convo.initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {convo.online && convo.type === "human" && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-sm font-medium truncate">{convo.name}</span>
                            {convo.type === "ai" && (
                              <Sparkles className="h-3 w-3 text-primary shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {convo.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                      </div>
                      {convo.unread > 0 && (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                          {convo.unread}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : currentConvo ? (
          /* Chat Thread */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {/* Empty state for AI */}
                {currentMessages.length === 0 && currentConvo.type === "ai" && (
                  <div className="text-center py-6">
                    <span className="text-2xl block mb-2">{currentConvo.agentAvatar}</span>
                    <p className="text-sm font-medium">{currentConvo.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 max-w-[240px] mx-auto">
                      {currentConvo.role}
                    </p>
                    {currentConvo.agentId && (
                      <div className="space-y-1 max-w-[280px] mx-auto">
                        {AI_AGENTS.find((a) => a.id === currentConvo.agentId)?.suggestedPrompts
                          .slice(0, 2)
                          .map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => setMessageInput(prompt)}
                              className="block w-full text-left rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-[11px] text-foreground/80 transition-colors hover:bg-secondary"
                            >
                              {prompt}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                {currentMessages
                  .filter((m) => m.content !== "")
                  .map((msg) => {
                    const own = isOwnMessage(msg, currentConvo);
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${own ? "justify-end" : "justify-start"} group`}
                      >
                        <div className="relative max-w-[85%]">
                          <div
                            className={`rounded-2xl px-3 py-2 ${
                              own
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-secondary/60 text-secondary-foreground rounded-bl-sm"
                            }`}
                          >
                            {/* Content */}
                            {currentConvo.type === "ai" && msg.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 [&_p:last-child]:mb-0 text-xs leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-xs leading-relaxed">{msg.content}</p>
                            )}

                            {/* Timestamp */}
                            <div className={`mt-0.5 flex items-center gap-0.5 ${own ? "justify-end" : ""}`}>
                              <span className={`text-[9px] ${own ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {msg.timestamp instanceof Date
                                  ? msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : ""}
                              </span>
                              {own && msg.status && <ReadReceipt status={msg.status} />}
                            </div>
                          </div>

                          {/* Reactions */}
                          {msg.reactions.length > 0 && (
                            <div className={`flex gap-0.5 mt-0.5 ${own ? "justify-end" : "justify-start"}`}>
                              {msg.reactions.map((r) => (
                                <button
                                  key={r.emoji}
                                  onClick={() => selectedConvo && toggleReaction(selectedConvo, msg.id, r.emoji)}
                                  className={`flex items-center gap-0.5 rounded-full border px-1 py-0.5 text-[10px] ${
                                    r.reacted ? "border-primary/30 bg-primary/10" : "border-border/50 bg-card"
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-[8px] text-muted-foreground">{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Reaction picker */}
                          <div
                            className={`absolute top-0 ${
                              own ? "left-0 -translate-x-full" : "right-0 translate-x-full"
                            } opacity-0 group-hover:opacity-100 transition-opacity px-0.5`}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="h-5 w-5 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary">
                                  <Smile className="h-2.5 w-2.5 text-muted-foreground" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-1" side="top">
                                <div className="flex gap-0.5">
                                  {EMOJI_OPTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => selectedConvo && toggleReaction(selectedConvo, msg.id, emoji)}
                                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary text-sm"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                {/* Typing indicator */}
                {(isTyping || isStreamingEmpty) && (
                  <div className="flex items-end gap-1">
                    <span className="text-sm">{currentConvo.agentAvatar || "🤖"}</span>
                    <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
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

            {/* Input */}
            <div className="border-t border-border p-3 bg-card/30 shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={currentConvo.type === "ai" ? `Ask ${currentConvo.name}...` : "Type a message..."}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="h-9 text-sm bg-secondary/50"
                  disabled={isTyping}
                />
                {isStreaming && currentConvo?.type === "ai" ? (
                  <Button size="icon" variant="destructive" onClick={cancelStreaming} className="h-9 w-9 shrink-0">
                    <Square className="h-3 w-3 fill-current" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isTyping}
                    className="h-9 w-9 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Select a conversation</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
