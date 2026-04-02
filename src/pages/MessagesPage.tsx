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
  Sparkles,
  Square,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useMessaging, type Conversation, type UnifiedMessage } from "@/stores/useMessaging";
import { AI_AGENTS } from "@/services/aiService";

export default function MessagesPage() {
  const {
    conversations,
    introRequests,
    pendingIntros,
    isStreaming,
    getMessages,
    sendMessage,
    sendAIMessage,
    cancelStreaming,
    toggleReaction,
    acceptIntro,
    declineIntro,
    markAsRead,
    EMOJI_OPTIONS,
  } = useMessaging();

  const [activeTab, setActiveTab] = useState("chats");
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine human + AI conversations for the list
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

  const lastMsgContent = currentMessages[currentMessages.length - 1]?.content;
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, isTyping, lastMsgContent]);

  const handleSelectConvo = (id: string) => {
    setSelectedConvo(id);
    setShowChat(true);
    markAsRead(id);
  };

  const handleSendMessage = async () => {
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
  };

  // Show typing dots only during the brief initial pause before first token arrives
  const isStreamingEmpty =
    currentConvo?.type === "ai" &&
    currentMessages.length > 0 &&
    currentMessages[currentMessages.length - 1]?.role === "assistant" &&
    currentMessages[currentMessages.length - 1]?.content === "";

  const isOwnMessage = (msg: UnifiedMessage, convo: Conversation | undefined) => {
    if (!convo) return false;
    if (convo.type === "ai") return msg.role === "user";
    return msg.role === "assistant"; // In human convos, "assistant" role = current user's own msgs
  };

  const ReadReceipt = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === "read") return <CheckCheck className="h-3 w-3 text-primary" />;
    if (status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    return <Check className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <AppLayout title="Messages">
      <div className="flex h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-4rem)]">
        {/* Left panel */}
        <div
          className={`w-full lg:w-[320px] xl:w-[360px] shrink-0 border-r border-border/50 flex flex-col bg-card/30 ${
            showChat ? "hidden lg:flex" : "flex"
          }`}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="p-4 pb-0">
              <TabsList className="w-full">
                <TabsTrigger value="chats" className="flex-1 gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Chats
                </TabsTrigger>
                <TabsTrigger value="intros" className="flex-1 gap-1.5 relative">
                  <UserPlus className="h-3.5 w-3.5" /> Intros
                  {pendingIntros.length > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground tabular-nums">
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
                      onClick={() => handleSelectConvo(convo.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                        selectedConvo === convo.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-secondary/40 border border-transparent active:scale-[0.99]"
                      }`}
                    >
                      <div className="relative">
                        {convo.type === "ai" && convo.agentAvatar ? (
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-lg">
                            {convo.agentAvatar}
                          </div>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                              {convo.initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {convo.online && convo.type === "human" && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-foreground truncate">
                              {convo.name}
                            </span>
                            {convo.type === "ai" && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                            {convo.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                      </div>
                      {convo.unread > 0 && (
                        <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums">
                          {convo.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="intros" className="flex-1 flex flex-col mt-0">
              <ScrollArea className="flex-1">
                <div className="space-y-3 p-4">
                  {introRequests.map((req, i) => (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.06,
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                      }}
                      className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-primary/15"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                            {req.from.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {req.from.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{req.date}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{req.from.role}</span>
                          <p className="mt-2 text-xs text-foreground/80 leading-relaxed">
                            {req.message}
                          </p>
                          {req.status === "pending" ? (
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => acceptIntro(req.id)}
                              >
                                <Check className="h-3 w-3" /> Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => declineIntro(req.id)}
                              >
                                <X className="h-3 w-3" /> Decline
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
        <div className={`flex-1 flex flex-col ${showChat ? "flex" : "hidden lg:flex"}`}>
          {currentConvo ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/50 px-4 lg:px-6 py-4 shrink-0 bg-card/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden shrink-0"
                  onClick={() => setShowChat(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="relative">
                  {currentConvo.type === "ai" && currentConvo.agentAvatar ? (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-lg">
                      {currentConvo.agentAvatar}
                    </div>
                  ) : (
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {currentConvo.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {currentConvo.online && currentConvo.type === "human" && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">{currentConvo.name}</p>
                    {currentConvo.type === "ai" && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentConvo.type === "ai" ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-primary" /> AI Agent
                      </span>
                    ) : (
                      <>
                        {currentConvo.online ? "Online" : "Offline"} · {currentConvo.role}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 lg:p-6">
                <div className="space-y-4">
                  {/* AI empty state with suggested prompts */}
                  {currentMessages.length === 0 && currentConvo.type === "ai" && (
                    <div className="text-center py-8">
                      <span className="text-3xl block mb-2">{currentConvo.agentAvatar}</span>
                      <p className="text-sm font-medium text-foreground">{currentConvo.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[280px] mx-auto">
                        {currentConvo.role}
                      </p>
                      {currentConvo.agentId && (
                        <div className="space-y-1.5 max-w-sm mx-auto">
                          {AI_AGENTS.find((a) => a.id === currentConvo.agentId)?.suggestedPrompts.map(
                            (prompt) => (
                              <button
                                key={prompt}
                                onClick={() => setMessageInput(prompt)}
                                className="block w-full text-left rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground/80 transition-colors hover:bg-secondary"
                              >
                                {prompt}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentMessages.filter((m) => m.content !== "").map((msg) => {
                    const own = isOwnMessage(msg, currentConvo);
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${own ? "justify-end" : "justify-start"} group`}
                      >
                        <div className="relative">
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              own
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-secondary/60 text-secondary-foreground rounded-bl-md"
                            }`}
                          >
                            {/* Attachment */}
                            {msg.attachment && (
                              <div
                                className={`flex items-center gap-2 mb-2 rounded-lg p-2 ${
                                  own ? "bg-primary-foreground/10" : "bg-background/50"
                                }`}
                              >
                                {msg.attachment.type === "image" ? (
                                  <Image className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {msg.attachment.name}
                                  </p>
                                  <p className="text-[10px] opacity-60">{msg.attachment.size}</p>
                                </div>
                              </div>
                            )}

                            {/* Message content — markdown for AI, plain for human */}
                            {currentConvo.type === "ai" && msg.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1 [&_li]:my-0.5 text-sm leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            )}

                            <div
                              className={`mt-1 flex items-center gap-1 ${own ? "justify-end" : ""}`}
                            >
                              <span
                                className={`text-[10px] ${
                                  own ? "text-primary-foreground/60" : "text-muted-foreground"
                                }`}
                              >
                                {msg.timestamp instanceof Date
                                  ? msg.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                              {own && msg.status && <ReadReceipt status={msg.status} />}
                            </div>
                          </div>

                          {/* Reactions display */}
                          {msg.reactions.length > 0 && (
                            <div
                              className={`flex gap-1 mt-1 ${own ? "justify-end" : "justify-start"}`}
                            >
                              {msg.reactions.map((r) => (
                                <button
                                  key={r.emoji}
                                  onClick={() =>
                                    selectedConvo && toggleReaction(selectedConvo, msg.id, r.emoji)
                                  }
                                  className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-all duration-200 active:scale-95 ${
                                    r.reacted
                                      ? "border-primary/30 bg-primary/10"
                                      : "border-border/50 bg-card"
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {r.count}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Reaction picker (hover) */}
                          <div
                            className={`absolute top-0 ${
                              own ? "left-0 -translate-x-full" : "right-0 translate-x-full"
                            } opacity-0 group-hover:opacity-100 transition-opacity px-1`}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="h-7 w-7 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors">
                                  <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-1.5" side="top">
                                <div className="flex gap-1">
                                  {EMOJI_OPTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() =>
                                        selectedConvo &&
                                        toggleReaction(selectedConvo, msg.id, emoji)
                                      }
                                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-secondary transition-colors text-lg active:scale-90"
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

                  {/* AI typing indicator */}
                  {(isTyping || isStreamingEmpty) && (
                    <div className="flex items-end gap-1.5">
                      <span className="text-sm">{currentConvo.agentAvatar || "🤖"}</span>
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

              {/* Input bar */}
              <div className="border-t border-border/50 p-4 bg-card/30">
                <div className="flex items-center gap-2">
                  {currentConvo.type === "human" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  )}
                  <Input
                    placeholder={
                      currentConvo.type === "ai"
                        ? `Ask ${currentConvo.name}...`
                        : "Type a message…"
                    }
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-secondary/50 border-border/50"
                    disabled={isTyping}
                  />
                  {isStreaming && currentConvo?.type === "ai" ? (
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={cancelStreaming}
                      className="shrink-0"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isTyping}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-secondary/50 mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  Your messages
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select a conversation to start chatting
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
