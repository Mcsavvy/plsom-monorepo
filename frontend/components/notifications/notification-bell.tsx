"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/notifications";
import { useRouter } from "next/navigation";
import type { Notification } from "./notification-item";

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    const { type, data } = notification;

    switch (type) {
      case "class_starting":
        if (data.class_id) {
          router.push(`/classes/${data.class_id}`);
        }
        break;
      case "test_created":
      case "test_published":
      case "test_updated":
      case "test_deadline_reminder":
        if (data.test_id) {
          router.push(`/tests/${data.test_id}`);
        }
        break;
      case "submission_created":
      case "submission_graded":
      case "submission_returned":
        if (data.submission_id) {
          router.push(
            `/tests/${data.test_id}/submissions/${data.submission_id}`
          );
        }
        break;
      default:
        break;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex max-h-[70vh] w-[380px] flex-col p-0 sm:h-[400px]"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="min-h-0 flex-1">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            onNotificationClick={handleNotificationClick}
            onMarkAllRead={markAllAsRead}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
