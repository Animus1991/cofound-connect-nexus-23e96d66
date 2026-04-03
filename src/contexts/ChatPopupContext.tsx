/**
 * ChatPopupContext — Global state for the floating chat popup
 * Controls open/close/minimize state and provides a trigger button component.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ChatPopupState {
  isOpen: boolean;
  isMinimized: boolean;
  openPopup: () => void;
  closePopup: () => void;
  toggleMinimize: () => void;
  openConversation: (conversationId: string) => void;
  pendingConversationId: string | null;
  clearPendingConversation: () => void;
}

const ChatPopupContext = createContext<ChatPopupState | null>(null);

export function ChatPopupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  const openPopup = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  }, [isMinimized]);

  const openConversation = useCallback((conversationId: string) => {
    setPendingConversationId(conversationId);
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const clearPendingConversation = useCallback(() => {
    setPendingConversationId(null);
  }, []);

  return (
    <ChatPopupContext.Provider
      value={{
        isOpen,
        isMinimized,
        openPopup,
        closePopup,
        toggleMinimize,
        openConversation,
        pendingConversationId,
        clearPendingConversation,
      }}
    >
      {children}
    </ChatPopupContext.Provider>
  );
}

export function useChatPopup() {
  const context = useContext(ChatPopupContext);
  if (!context) {
    throw new Error("useChatPopup must be used within ChatPopupProvider");
  }
  return context;
}
