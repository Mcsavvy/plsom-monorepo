import { useOne, useNavigation } from '@refinedev/core';
import { useParams } from 'react-router';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  User,
  Database,
  Activity,
  Globe,
  Monitor,
  Info,
  FileText,
  Code,
} from 'lucide-react';
import { getResourceIcon } from '@/utils/resourceUtils';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLog } from '@/types/auditLog';

export const AuditLogsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { list } = useNavigation();

  const {
    result: auditLogData,
    query: { isLoading, isError, error },
  } = useOne<AuditLog>({
    resource: 'audit-logs',
    id: id,
  });

  const auditLog = auditLogData;

  const getActionColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'read':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource?.toLowerCase()) {
      case 'users':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cohorts':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'enrollments':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'invitations':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatJsonData = (data: Record<string, unknown>) => {
    if (!data || typeof data !== 'object') return 'N/A';

    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Invalid JSON data';
    }
  };

  const hasDataChanges =
    auditLog?.data && Object.keys(auditLog.data).length > 0;
  const hasPreviousData =
    auditLog?.previous_data && Object.keys(auditLog.previous_data).length > 0;

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-48' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !auditLog) {
    return (
      <div className='space-y-4'>
        <Button
          variant='outline'
          onClick={() => list('audit-logs')}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Audit Logs
        </Button>
        <Alert>
          <AlertDescription>
            {error?.message || 'Audit log not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            {getResourceIcon('audit-logs')}
            Audit Log Details
          </h1>
          <p className='text-muted-foreground'>
            #{auditLog.id} - {auditLog.resource} {auditLog.action}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant='outline'
            className={getResourceColor(auditLog.resource)}
          >
            {auditLog.resource}
          </Badge>
          <Badge variant='outline' className={getActionColor(auditLog.action)}>
            {auditLog.action}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Basic Information */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Info className='h-5 w-5' />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Calendar className='h-4 w-4' />
                    Timestamp
                  </div>
                  <div className='font-medium'>
                    {auditLog.timestamp
                      ? format(new Date(auditLog.timestamp), 'PPpp')
                      : 'N/A'}
                  </div>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Database className='h-4 w-4' />
                    Resource
                  </div>
                  <Badge
                    variant='outline'
                    className={getResourceColor(auditLog.resource)}
                  >
                    {auditLog.resource}
                  </Badge>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Activity className='h-4 w-4' />
                    Action
                  </div>
                  <Badge
                    variant='outline'
                    className={getActionColor(auditLog.action)}
                  >
                    {auditLog.action}
                  </Badge>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <FileText className='h-4 w-4' />
                    Object ID
                  </div>
                  <div className='font-medium'>
                    {`${auditLog.meta?.id || 'N/A'}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Changes */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Code className='h-5 w-5' />
                Data Changes
              </CardTitle>
              <CardDescription>
                View the data that was changed in this audit log
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='current' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='current'>Current Data</TabsTrigger>
                  <TabsTrigger value='previous' disabled={!hasPreviousData}>
                    Previous Data
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='current' className='mt-4'>
                  <div className='h-[400px] w-full rounded-md border p-4 overflow-auto'>
                    <pre className='text-sm'>
                      {hasDataChanges
                        ? formatJsonData(auditLog.data || {})
                        : 'No current data available'}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value='previous' className='mt-4'>
                  <div className='h-[400px] w-full rounded-md border p-4 overflow-auto'>
                    <pre className='text-sm'>
                      {hasPreviousData
                        ? formatJsonData(auditLog.previous_data || {})
                        : 'No previous data available'}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Author and System Information */}
        <div className='space-y-6'>
          {/* Author Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Author
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <Avatar className='h-12 w-12'>
                  <AvatarFallback className='text-lg'>
                    {auditLog.author?.name?.charAt(0) ||
                      auditLog.author_name?.charAt(0) ||
                      'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-medium'>
                    {auditLog.author?.name || auditLog.author_name || 'System'}
                  </div>
                  {auditLog.author?.email && (
                    <div className='text-sm text-muted-foreground'>
                      {auditLog.author.email}
                    </div>
                  )}
                  {auditLog.author?.username && (
                    <div className='text-sm text-muted-foreground'>
                      @{auditLog.author.username}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Monitor className='h-5 w-5' />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground mb-1'>
                    <Globe className='h-4 w-4' />
                    IP Address
                  </div>
                  <div className='font-mono text-sm'>
                    {auditLog.ip_address || 'N/A'}
                  </div>
                </div>
                <Separator />
                <div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground mb-1'>
                    <Monitor className='h-4 w-4' />
                    User Agent
                  </div>
                  <div className='text-sm break-all'>
                    {auditLog.user_agent || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {auditLog.meta && Object.keys(auditLog.meta).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Info className='h-5 w-5' />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-[200px] w-full rounded-md border p-4 overflow-auto'>
                  <pre className='text-sm'>{formatJsonData(auditLog.meta)}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
