/* eslint-disable react-refresh/only-export-components */
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    Sentry.captureException(error, {
      extra: {
        errorInfo,
      },
    });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen flex items-center justify-center p-4 bg-background'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4'>
                <AlertTriangle className='h-6 w-6 text-destructive' />
              </div>
              <CardTitle className='text-xl'>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-sm text-muted-foreground text-center'>
                We encountered an unexpected error. Please try refreshing the
                page or go back to the homepage.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mt-4 p-3 bg-muted rounded-md'>
                  <summary className='cursor-pointer text-sm font-medium'>
                    Error Details (Development)
                  </summary>
                  <pre className='mt-2 text-xs overflow-auto max-h-32'>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className='flex gap-2 pt-2'>
                <Button
                  onClick={this.handleRetry}
                  variant='outline'
                  size='sm'
                  className='flex-1'
                >
                  <RefreshCcw className='h-4 w-4 mr-2' />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  size='sm'
                  className='flex-1'
                >
                  <Home className='h-4 w-4 mr-2' />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries for different parts of the app
export const SidebarErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    fallback={
      <div className='p-4 text-center'>
        <AlertTriangle className='h-6 w-6 mx-auto text-muted-foreground mb-2' />
        <p className='text-sm text-muted-foreground'>
          Unable to load navigation
        </p>
        <Button
          variant='outline'
          size='sm'
          className='mt-2'
          onClick={() => window.location.reload()}
        >
          <RefreshCcw className='h-4 w-4 mr-2' />
          Reload
        </Button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    fallback={
      <div className='flex-1 flex items-center justify-center p-8'>
        <Card className='w-full max-w-sm'>
          <CardContent className='pt-6 text-center'>
            <AlertTriangle className='h-8 w-8 mx-auto text-muted-foreground mb-4' />
            <h3 className='font-semibold mb-2'>Page Error</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              This page encountered an error and couldn't load properly.
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.location.reload()}
                className='flex-1'
              >
                <RefreshCcw className='h-4 w-4 mr-2' />
                Retry
              </Button>
              <Button
                size='sm'
                onClick={() => window.history.back()}
                className='flex-1'
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);
