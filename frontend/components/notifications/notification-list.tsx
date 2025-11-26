"use client";

import { NotificationItem, type Notification } from "./notification-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCheck, BellOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead?: () => void;
  showMarkAllRead?: boolean;
}

export function NotificationList({
  notifications,
  isLoading,
  onNotificationClick,
  onMarkAllRead,
  showMarkAllRead = true,
}: NotificationListProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <BellOff className="text-muted-foreground h-8 w-8" />
        </div>
        <p className="text-sm font-medium">No notifications</p>
        <p className="text-muted-foreground mt-1 text-xs">
          You're all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {showMarkAllRead && unreadCount > 0 && (
        <div className="flex items-center justify-between border-b p-3">
          <p className="text-muted-foreground text-sm">
            {unreadCount} unread notification{unreadCount !== 1 && "s"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="h-8 text-xs"
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => onNotificationClick(notification)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
