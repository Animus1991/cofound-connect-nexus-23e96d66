import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface NotificationEvent {
  title: string;
  description: string;
  variant?: "default" | "destructive";
  delay: number;
}

const notificationQueue: NotificationEvent[] = [
  {
    title: "🎯 New Match!",
    description: "You matched with Alex Chen (92% compatibility)",
    delay: 8000,
  },
  {
    title: "👀 Profile Viewed",
    description: "Maria Santos viewed your profile",
    delay: 18000,
  },
  {
    title: "🤝 Intro Request",
    description: "Elena V. wants to connect with you",
    delay: 30000,
  },
  {
    title: "⭐ Profile Saved",
    description: "James Okafor saved your profile to favorites",
    delay: 45000,
  },
  {
    title: "🔥 Milestone!",
    description: "You've reached 150 profile views this week!",
    delay: 60000,
  },
];

export function useNotifications() {
  const { toast } = useToast();
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Disable mock notifications in production - only show in development demo mode
    const isDemoMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_NOTIFICATIONS === "true";
    if (!isDemoMode) return;

    timersRef.current = notificationQueue.map((notification) =>
      setTimeout(() => {
        toast({
          title: notification.title,
          description: notification.description,
          variant: notification.variant,
        });
      }, notification.delay)
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [toast]);
}
