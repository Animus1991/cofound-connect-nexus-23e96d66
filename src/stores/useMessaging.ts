/**
 * Unified Messaging Store
 * Single source of truth for conversations and messages across popup + full-page.
 * Shared types, state, and actions — no duplication.
 */

import { useState, useCallback, useMemo } from "react";
import { AI_AGENTS, streamAIResponse, type AIAgent } from "@/services/aiService";

// ── Shared Types ───────────────────────────────────────────

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface Attachment {
  name: string;
  type: "image" | "file";
  size: string;
}

export interface UnifiedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  /** For human convos — read receipts */
  status?: "sent" | "delivered" | "read";
  reactions: Reaction[];
  attachment?: Attachment;
  /** For AI messages */
  agentId?: string;
}

export interface Conversation {
  id: string;
  type: "human" | "ai";
  name: string;
  initials: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  typing: boolean;
  /** For AI convos */
  agentId?: string;
  agentAvatar?: string;
}

export interface IntroRequest {
  id: string;
  from: { name: string; initials: string; role: string };
  message: string;
  date: string;
  status: "pending" | "accepted" | "declined";
}

// ── Mock Data ──────────────────────────────────────────────

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "🚀", "💡"];

const initialConversations: Conversation[] = [
  { id: "c1", type: "human", name: "Alex Chen", initials: "AC", role: "Founder", lastMessage: "That sounds great! Let's schedule a call.", time: "10m", unread: 2, online: true, typing: false },
  { id: "c2", type: "human", name: "Maria Santos", initials: "MS", role: "Investor", lastMessage: "I've reviewed the deck, very impressive metrics.", time: "1h", unread: 1, online: true, typing: false },
  { id: "c3", type: "human", name: "Sara K.", initials: "SK", role: "UX Designer", lastMessage: "Here's the wireframe I mentioned.", time: "3h", unread: 0, online: false, typing: false },
  { id: "c4", type: "human", name: "Dimitris P.", initials: "DP", role: "Developer", lastMessage: "The MVP is coming along nicely!", time: "1d", unread: 0, online: false, typing: false },
];

const initialMessages: Record<string, UnifiedMessage[]> = {
  c1: [
    { id: "m1", role: "user", content: "Hey Jane! Thanks for accepting my intro request.", timestamp: new Date("2025-01-15T09:30:00"), reactions: [] },
    { id: "m2", role: "assistant", content: "Hi Alex! Your profile really stood out. Tell me more about your AI startup idea.", timestamp: new Date("2025-01-15T09:32:00"), status: "read", reactions: [{ emoji: "👍", count: 1, reacted: false }] },
    { id: "m3", role: "user", content: "Sure! We're building an AI-powered tool for early-stage founders to validate ideas faster.", timestamp: new Date("2025-01-15T09:35:00"), reactions: [{ emoji: "🚀", count: 1, reacted: true }] },
    { id: "m4", role: "assistant", content: "That's exactly the kind of problem I love solving. I've been working on similar validation frameworks.", timestamp: new Date("2025-01-15T09:38:00"), status: "read", reactions: [] },
    { id: "m5", role: "user", content: "That sounds great! Let's schedule a call.", timestamp: new Date("2025-01-15T09:40:00"), reactions: [] },
  ],
  c2: [
    { id: "m1", role: "user", content: "Hi Jane, I came across your startup through CoFounderBay.", timestamp: new Date("2025-01-14T10:00:00"), reactions: [] },
    { id: "m2", role: "assistant", content: "Hi Maria! Thanks for reaching out. Happy to share more details.", timestamp: new Date("2025-01-14T10:05:00"), status: "delivered", reactions: [] },
    { id: "m3", role: "user", content: "I've reviewed the deck, very impressive metrics.", timestamp: new Date("2025-01-15T08:00:00"), reactions: [], attachment: { name: "pitch_deck_review.pdf", type: "file", size: "2.3 MB" } },
  ],
};

const initialIntroRequests: IntroRequest[] = [
  { id: "ir1", from: { name: "Elena V.", initials: "EV", role: "Growth Lead" }, message: "Hi Jane! I'm building a fintech startup and I think your product skills would be a perfect match. Would love to connect!", date: "2h ago", status: "pending" },
  { id: "ir2", from: { name: "Nikos M.", initials: "NM", role: "Angel Investor" }, message: "Impressed by your startup's traction. I'd like to discuss potential investment opportunities.", date: "5h ago", status: "pending" },
  { id: "ir3", from: { name: "Sara K.", initials: "SK", role: "UX Designer" }, message: "Saw your post about looking for a design co-founder. I have 8 years of product design experience.", date: "1d ago", status: "accepted" },
];

// ── Singleton state (shared across all consumers) ──────────

let _conversations = initialConversations;
let _messages = initialMessages;
let _introRequests = initialIntroRequests;
let _listeners: Array<() => void> = [];

function notify() {
  _listeners.forEach((l) => l());
}

// ── Hook ───────────────────────────────────────────────────

export function useMessaging() {
  const [, forceUpdate] = useState(0);

  // Subscribe to changes
  const subscribe = useCallback(() => {
    const listener = () => forceUpdate((n) => n + 1);
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  // Register on mount
  useState(() => {
    const unsub = subscribe();
    // Cleanup via effect would be ideal but useState initializer works for singleton
    return unsub;
  });

  const conversations = _conversations;
  const messages = _messages;
  const introRequests = _introRequests;

  const aiConversations: Conversation[] = useMemo(
    () =>
      AI_AGENTS.map((agent) => ({
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
      })),
    []
  );

  const totalUnread = useMemo(
    () => _conversations.reduce((sum, c) => sum + c.unread, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversations]
  );

  const pendingIntros = useMemo(
    () => _introRequests.filter((r) => r.status === "pending"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [introRequests]
  );

  const getMessages = useCallback(
    (convoId: string): UnifiedMessage[] => _messages[convoId] || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages]
  );

  const sendMessage = useCallback(
    (convoId: string, content: string, attachment?: Attachment) => {
      const msg: UnifiedMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant", // "assistant" = current user in human convos (own messages)
        content,
        timestamp: new Date(),
        status: "sent",
        reactions: [],
        attachment,
      };
      _messages = { ..._messages, [convoId]: [...(_messages[convoId] || []), msg] };

      // Update lastMessage on conversation
      _conversations = _conversations.map((c) =>
        c.id === convoId ? { ...c, lastMessage: content, time: "Just now" } : c
      );

      notify();
      return msg;
    },
    []
  );

  const sendAIMessage = useCallback(
    async (agentId: string, content: string) => {
      const convoId = `agent-${agentId}`;

      // Add user message
      const userMsg: UnifiedMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
        reactions: [],
      };
      _messages = { ..._messages, [convoId]: [...(_messages[convoId] || []), userMsg] };
      notify();

      // Create a placeholder assistant message for streaming
      const aiMsgId = `msg-${Date.now()}-ai`;
      const aiMsg: UnifiedMessage = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        agentId,
        reactions: [],
      };
      _messages = { ..._messages, [convoId]: [...(_messages[convoId] || []), aiMsg] };
      notify();

      // Stream tokens into the placeholder message
      try {
        await streamAIResponse(
          agentId,
          content,
          (token) => {
            const convoMsgs = [...(_messages[convoId] || [])];
            const idx = convoMsgs.findIndex((m) => m.id === aiMsgId);
            if (idx !== -1) {
              convoMsgs[idx] = { ...convoMsgs[idx], content: convoMsgs[idx].content + token };
              _messages = { ..._messages, [convoId]: convoMsgs };
              notify();
            }
          },
          () => {
            // Update lastMessage on conversation
            const convoMsgs = _messages[convoId] || [];
            const finalMsg = convoMsgs.find((m) => m.id === aiMsgId);
            if (finalMsg) {
              _conversations = _conversations.map((c) =>
                c.id === convoId ? { ...c, lastMessage: finalMsg.content.slice(0, 60), time: "Just now" } : c
              );
              notify();
            }
          },
        );
      } catch {
        // Silently handle — could add error state later
      }
    },
    []
  );

  const toggleReaction = useCallback((convoId: string, msgId: string, emoji: string) => {
    const convoMsgs = [...(_messages[convoId] || [])];
    const idx = convoMsgs.findIndex((m) => m.id === msgId);
    if (idx === -1) return;

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
    _messages = { ..._messages, [convoId]: convoMsgs };
    notify();
  }, []);

  const acceptIntro = useCallback((id: string) => {
    _introRequests = _introRequests.map((r) =>
      r.id === id ? { ...r, status: "accepted" as const } : r
    );
    notify();
  }, []);

  const declineIntro = useCallback((id: string) => {
    _introRequests = _introRequests.map((r) =>
      r.id === id ? { ...r, status: "declined" as const } : r
    );
    notify();
  }, []);

  const markAsRead = useCallback((convoId: string) => {
    _conversations = _conversations.map((c) =>
      c.id === convoId ? { ...c, unread: 0 } : c
    );
    notify();
  }, []);

  return {
    conversations,
    aiConversations,
    messages,
    introRequests,
    totalUnread,
    pendingIntros,
    getMessages,
    sendMessage,
    sendAIMessage,
    toggleReaction,
    acceptIntro,
    declineIntro,
    markAsRead,
    EMOJI_OPTIONS,
  };
}
