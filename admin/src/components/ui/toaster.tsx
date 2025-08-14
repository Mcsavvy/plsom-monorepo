import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant: string) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'destructive':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'warning':
        return <AlertCircle className='h-4 w-4 text-yellow-600' />;
      case 'info':
        return <Info className='h-4 w-4 text-blue-600' />;
      default:
        return <Info className='h-4 w-4 text-blue-600' />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className='flex items-center gap-2'>
              {getIcon(variant || 'default')}
              <div className='grid gap-1 flex-1'>
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>
                    {typeof description === 'string'
                      ? description
                      : description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
