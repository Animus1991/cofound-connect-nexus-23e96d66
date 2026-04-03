/**
 * FloatingChatBubble — Persistent chat access button
 * Shows unread count and opens the ChatPopup when clicked.
 */

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMessaging } from "@/stores/useMessaging";

interface FloatingChatBubbleProps {
  onClick: () => void;
  isPopupOpen: boolean;
}

export default function FloatingChatBubble({ onClick, isPopupOpen }: FloatingChatBubbleProps) {
  const { totalUnread } = useMessaging();

  // Don't show bubble when popup is open (popup handles its own minimized state)
  if (isPopupOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow relative group"
          onClick={onClick}
        >
          <MessageSquare className="h-6 w-6 transition-transform group-hover:scale-110" />
          {totalUnread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground shadow-sm"
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </motion.span>
          )}
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}` : "Messages"}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
