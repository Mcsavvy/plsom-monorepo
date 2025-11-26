import { NotificationItem, type Notification } from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCheck, BellOff } from 'lucide-react';

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
  // Ensure notifications is always an array
  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
      </div>
    );
  }

  if (safeNotifications.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
        <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
          <BellOff className='w-8 h-8 text-muted-foreground' />
        </div>
        <p className='text-sm font-medium'>No notifications</p>
        <p className='text-xs text-muted-foreground mt-1'>
          You're all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {showMarkAllRead && unreadCount > 0 && (
        <div className='flex items-center justify-between p-3 border-b'>
          <p className='text-sm text-muted-foreground'>
            {unreadCount} unread notification{unreadCount !== 1 && 's'}
          </p>
          <Button
            variant='ghost'
            size='sm'
            onClick={onMarkAllRead}
            className='h-8 text-xs'
          >
            <CheckCheck className='w-4 h-4 mr-1' />
            Mark all read
          </Button>
        </div>
      )}

      <ScrollArea className='flex-1'>
        <div className='divide-y'>
          {safeNotifications.map(notification => (
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
