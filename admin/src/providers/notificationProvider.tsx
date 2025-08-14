import { NotificationProvider } from '@refinedev/core';
import { toast } from '@/hooks/use-toast';

export const notificationProvider: NotificationProvider = {
  open: ({
    key,
    message,
    type,
    description,
    undoableTimeout,
    cancelMutation,
  }) => {
    const getVariant = (type: string) => {
      switch (type) {
        case 'error':
          return 'destructive' as const;
        case 'success':
          return 'success' as const;
        case 'warning':
          return 'warning' as const;
        case 'info':
          return 'info' as const;
        default:
          return 'default' as const;
      }
    };

    // Show the toast
    const toastInstance = toast({
      id: key,
      title: message,
      description: description,
      variant: getVariant(type),
      duration: undoableTimeout ? undoableTimeout * 1000 : 5000,
      action:
        undoableTimeout && cancelMutation ? (
          <button
            onClick={() => {
              cancelMutation();
              toastInstance.dismiss();
            }}
            className='inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
          >
            Undo
          </button>
        ) : undefined,
    });

    return toastInstance;
  },
  close: key => {
    console.log('close', key);
    // toast.dismiss(key);
  },
};
