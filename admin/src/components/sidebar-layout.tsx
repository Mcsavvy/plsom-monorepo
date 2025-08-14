import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { Breadcrumb } from './breadcrumb';
import { Separator } from '@/components/ui/separator';
import { ErrorBoundary, PageErrorBoundary } from './ErrorBoundary';
import type { PropsWithChildren } from 'react';
import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { PageLoader } from './LoadingSpinner';

// Header error fallback
const HeaderErrorFallback = () => (
  <header className='flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-muted/10'>
    <AlertCircle className='h-4 w-4 text-muted-foreground' />
    <span className='text-sm text-muted-foreground'>
      Navigation unavailable
    </span>
  </header>
);

export const SidebarLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <ErrorBoundary fallback={<HeaderErrorFallback />}>
            <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
              <div className='flex items-center gap-2 px-4'>
                <SidebarTrigger className='-ml-1' />
                <Separator orientation='vertical' className='mr-2 h-4' />
                <Suspense
                  fallback={
                    <div className='h-4 w-32 bg-muted rounded animate-pulse' />
                  }
                >
                  <Breadcrumb />
                </Suspense>
              </div>
            </header>
          </ErrorBoundary>

          <main className='flex flex-1 flex-col gap-4 p-4 pt-0'>
            <PageErrorBoundary>
              <Suspense fallback={<PageLoader />}>{children}</Suspense>
            </PageErrorBoundary>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
};
