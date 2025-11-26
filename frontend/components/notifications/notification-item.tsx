"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BookOpen,
  FileText,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Video,
} from "lucide-react";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "class_starting":
      return Video;
    case "test_created":
    case "test_published":
    case "test_updated":
    case "test_deadline_reminder":
      return FileText;
    case "test_deleted":
      return AlertCircle;
    case "submission_created":
    case "submission_graded":
      return CheckCircle;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "class_starting":
      return "text-blue-500 bg-blue-50 dark:bg-blue-950/20";
    case "test_created":
    case "test_published":
      return "text-green-500 bg-green-50 dark:bg-green-950/20";
    case "test_updated":
      return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    case "test_deadline_reminder":
      return "text-orange-500 bg-orange-50 dark:bg-orange-950/20";
    case "test_deleted":
      return "text-red-500 bg-red-50 dark:bg-red-950/20";
    case "submission_created":
    case "submission_graded":
      return "text-purple-500 bg-purple-50 dark:bg-purple-950/20";
    default:
      return "text-gray-500 bg-gray-50 dark:bg-gray-950/20";
  }
};

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  return (
    <div
      onClick={onClick}
      className={cn(
        "hover:bg-accent/50 flex cursor-pointer gap-3 border-b p-4 transition-colors last:border-b-0",
        !notification.read && "bg-accent/20"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
          iconColor
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              !notification.read && "font-semibold"
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
          )}
        </div>

        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {notification.message}
        </p>

        <p className="text-muted-foreground mt-2 text-xs">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
