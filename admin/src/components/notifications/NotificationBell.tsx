import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { NotificationList } from './NotificationList';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router';
import type { Notification } from './NotificationItem';

export function NotificationBell() {
  const navigate = useNavigate();
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
      case 'class_starting':
        if (data.class_id) {
          navigate(`/classes/show/${data.class_id}`);
        }
        break;
      case 'test_created':
      case 'test_published':
      case 'test_updated':
      case 'test_deadline_reminder':
        if (data.test_id) {
          navigate(`/tests/show/${data.test_id}`);
        }
        break;
      case 'submission_created':
      case 'submission_graded':
      case 'submission_returned':
        if (data.submission_id) {
          navigate(`/submissions/show/${data.submission_id}`);
        } else if (data.test_id) {
          navigate(`/tests/show/${data.test_id}`);
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
          variant='ghost'
          size='icon'
          className='relative'
          aria-label='Notifications'
        >
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[380px] p-0 ml-4' align='end' sideOffset={8}>
        <div className='flex items-center justify-between p-4 border-b'>
          <h3 className='font-semibold'>Notifications</h3>
        </div>
        <div className='h-[400px]'>
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
