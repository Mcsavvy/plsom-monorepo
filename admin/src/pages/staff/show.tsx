import { useState } from 'react';
import { useOne, useCustomMutation } from '@refinedev/core';
import { useParams, Link } from 'react-router';
import {
  User,
  Mail,
  Phone,
  Crown,
  Award,
  CheckCircle,
  XCircle,
  Edit,
  BookOpen,
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Staff } from '@/types/staff';
import { getResourceIcon } from '@/utils/resourceUtils';

export const StaffShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);

  const { mutate: promoteOrDemote, mutation: {
    isPending: isPromotingDemoting
  } } =
    useCustomMutation();

  const {
    result: staffData,
    query: {
      isLoading,
      isError,
      error,
      refetch
    }
  } = useOne<Staff>({
    resource: 'staff',
    id: id,
    meta: {
      transform: true,
    },
  });

  const staff = staffData;

  const handlePromoteDemote = async () => {
    if (!staff) return;

    promoteOrDemote(
      {
        url: `/staff/${staff.id}/promote-demote/`,
        method: 'post',
        values: {},
      },
      {
        onSuccess: () => {
          setPromoteDialogOpen(false);
          refetch();
        },
        onError: error => {
          console.error('Failed to promote/demote staff:', error);
        },
      }
    );
  };

  const getRoleColor = (role: 'admin' | 'lecturer') => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'lecturer':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIcon = (role: 'admin' | 'lecturer') => {
    switch (role) {
      case 'admin':
        return <Crown className='h-4 w-4' />;
      case 'lecturer':
        return <Award className='h-4 w-4' />;
      default:
        return <Users className='h-4 w-4' />;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className='h-4 w-4' />
    ) : (
      <XCircle className='h-4 w-4' />
    );
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-48' />
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-20' />
            <Skeleton className='h-10 w-24' />
          </div>
        </div>
        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-16 w-16 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-6 w-48' />
                  <Skeleton className='h-4 w-32' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !staff) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {error?.message || 'Staff member not found or could not be loaded.'}
        </AlertDescription>
      </Alert>
    );
  }

  const initials = staff.initials;
  const displayName = staff.displayName;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('staff')}
            {displayName}
          </h1>
          <p className='text-muted-foreground'>
            Staff member details and management
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Link to={`/staff/${staff.id}/edit`}>
            <Button variant='outline' className='gap-2'>
              <Edit className='h-4 w-4' />
              Edit
            </Button>
          </Link>
          <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={staff.role === 'admin' ? 'destructive' : 'default'}
                className='gap-2'
              >
                {staff.role === 'admin' ? (
                  <>
                    <TrendingDown className='h-4 w-4' />
                    Demote to Lecturer
                  </>
                ) : (
                  <>
                    <TrendingUp className='h-4 w-4' />
                    Promote to Admin
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {staff.role === 'admin'
                    ? 'Demote to Lecturer'
                    : 'Promote to Admin'}
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to{' '}
                  {staff.role === 'admin' ? 'demote' : 'promote'} {displayName}?
                  This will change their access permissions.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setPromoteDialogOpen(false)}
                  disabled={isPromotingDemoting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePromoteDemote}
                  disabled={isPromotingDemoting}
                  variant={staff.role === 'admin' ? 'destructive' : 'default'}
                >
                  {isPromotingDemoting && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {staff.role === 'admin' ? 'Demote' : 'Promote'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-start gap-4'>
              <Avatar className='h-16 w-16'>
                <AvatarImage
                  src={staff.profilePicture || undefined}
                  alt={displayName}
                />
                <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
              </Avatar>
              <div className='space-y-2'>
                <h3 className='text-xl font-semibold'>{displayName}</h3>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='outline' className={getRoleColor(staff.role)}>
                    {getRoleIcon(staff.role)}
                    <span className='ml-1 capitalize'>{staff.role}</span>
                  </Badge>
                  <Badge
                    variant='outline'
                    className={getStatusColor(staff.isActive)}
                  >
                    {getStatusIcon(staff.isActive)}
                    <span className='ml-1'>
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <div>
                  <div className='text-sm font-medium'>Email</div>
                  <div className='text-sm text-muted-foreground'>
                    {staff.email}
                  </div>
                </div>
              </div>

              {staff.whatsappNumber && (
                <div className='flex items-center gap-3'>
                  <Phone className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <div className='text-sm font-medium'>WhatsApp</div>
                    <div className='text-sm text-muted-foreground'>
                      {staff.whatsappNumber}
                    </div>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-3'>
                <CheckCircle className='h-4 w-4 text-muted-foreground' />
                <div>
                  <div className='text-sm font-medium'>Setup Complete</div>
                  <div className='text-sm text-muted-foreground'>
                    {staff.isSetupComplete ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Teaching Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-3'>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm font-medium'>Total Classes</div>
                <div className='text-lg font-semibold'>
                  {staff.totalClasses || 0}
                </div>
              </div>
            </div>

            {staff.coursesTaught &&
              Object.keys(staff.coursesTaught).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className='text-sm font-medium mb-3'>
                      Courses Taught
                    </div>
                    <div className='space-y-2'>
                      {/* This would be populated based on actual API structure */}
                      <div className='text-sm text-muted-foreground'>
                        Course information will be displayed here based on API
                        response structure
                      </div>
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
