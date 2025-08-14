import { toast } from './use-toast';

export const useNotification = () => {
  const showSuccess = (message: string, description?: string) => {
    return toast({
      title: message,
      description: description,
      variant: 'success',
      duration: 5000,
    });
  };

  const showError = (message: string, description?: string) => {
    return toast({
      title: message,
      description: description,
      variant: 'destructive',
      duration: 7000,
    });
  };

  const showWarning = (message: string, description?: string) => {
    return toast({
      title: message,
      description: description,
      variant: 'warning',
      duration: 6000,
    });
  };

  const showInfo = (message: string, description?: string) => {
    return toast({
      title: message,
      description: description,
      variant: 'info',
      duration: 5000,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
