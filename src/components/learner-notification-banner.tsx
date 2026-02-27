import { useState, useEffect } from "react";
import { notificationService } from "../application/services/notificationService";
import type { Notification } from "../domain/types/notification";
import { Button } from "./ui/button";
import { X, ChevronLeft, ChevronRight, ExternalLink, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearnerNotificationBannerProps {
  className?: string;
}

export function LearnerNotificationBanner({ className }: LearnerNotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getActiveNotifications();
      console.log("Notifications response:", response);
      const notificationsArray = Array.isArray(response) ? response : [];
      const unreadNotifications = notificationsArray.filter((n) => !n.is_read);
      setNotifications(unreadNotifications);
      if (unreadNotifications.length > 0) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (currentIndex >= notifications.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(notifications.length - 1, prev + 1));
  };

  const handleClose = () => {
    if (notifications[currentIndex]) {
      handleMarkAsRead(notifications[currentIndex].id);
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 border-red-500/50 text-red-500 dark:bg-red-500/20";
      case "important":
        return "bg-amber-500/10 border-amber-500/50 text-amber-500 dark:bg-amber-500/20";
      default:
        return "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20";
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "important":
        return "bg-amber-500";
      default:
        return "bg-primary";
    }
  };

  if (isLoading || notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];
  const unreadCount = notifications.length;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "border rounded-lg p-4 transition-all duration-300",
          getPriorityStyles(currentNotification.priority),
          isMinimized ? "py-2" : "py-4"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", getPriorityDot(currentNotification.priority))} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 flex-shrink-0" />
              <h4 className="font-semibold text-sm">{currentNotification.title}</h4>
            </div>
            
            {!isMinimized && (
              <>
                <p className="text-sm opacity-90 mb-2">{currentNotification.message}</p>
                
                {currentNotification.link && (
                  <a
                    href={currentNotification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    {currentNotification.link_text || "Learn more"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {unreadCount > 1 && !isMinimized && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2">
                  {currentIndex + 1} / {unreadCount}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleNext}
                  disabled={currentIndex === unreadCount - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", isMinimized ? "rotate-180" : "")} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {unreadCount > 1 && !isMinimized && (
          <div className="flex justify-center gap-1 mt-3">
            {notifications.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx === currentIndex ? "bg-current opacity-100" : "opacity-40 hover:opacity-70"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LearnerNotificationBanner;
