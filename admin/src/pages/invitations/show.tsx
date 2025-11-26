import {
  useCustomMutation,
  useDelete,
  useNavigation,
  useOne,
} from '@refinedev/core';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { getResourceIcon } from '@/utils/resourceUtils';
import { useState } from 'react';
import { useParams } from 'react-router';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Invitation {
  id: number;
  email: string;
  role: string;
  program_type: string | null;
  cohort: number | null;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_by: number;
  is_expired: boolean;
  is_used: boolean;
}

export const InvitationsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { list, edit } = useNavigation();
  const { mutate: deleteInvitation } = useDelete();
  const { mutate: resendInvitation } = useCustomMutation();
  const [loading, setLoading] = useState(false);

  const {
    result: invitationData,
    query: { isLoading },
  } = useOne<Invitation>({
    resource: 'invitations',
    id: id,
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      deleteInvitation(
        {
          resource: 'invitations',
          id: id,
        },
        {
          onSuccess: () => {
            list('invitations');
          },
        }
      );
    }
  };

  const handleResend = async (id: number) => {
    setLoading(true);
    try {
      await resendInvitation({
        url: `/invitations/${id}/resend/`,
        method: 'post',
        values: {},
      });
      alert('Invitation resent successfully!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'lecturer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (invitation: Invitation) => {
    if (invitation.is_used) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (invitation.is_expired) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatus = (invitation: Invitation) => {
    if (invitation.is_used) return 'Used';
    if (invitation.is_expired) return 'Expired';
    return 'Pending';
  };

  const getStatusIcon = (invitation: Invitation) => {
    if (invitation.is_used) return <CheckCircle className='h-4 w-4' />;
    if (invitation.is_expired) return <XCircle className='h-4 w-4' />;
    return <Clock className='h-4 w-4' />;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='flex items-center gap-2'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (!invitationData) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Invitation not found or could not be loaded.
        </AlertDescription>
      </Alert>
    );
  }

  const invitation = invitationData;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('invitations')}
            Invitation Details
          </h1>
          <p className='text-muted-foreground'>
            View invitation information and take actions
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => edit('invitations', invitation.id)}
            className='gap-2'
          >
            <Edit className='h-4 w-4' />
            Edit
          </Button>
          {!invitation.is_used && (
            <Button
              onClick={() => handleResend(invitation.id)}
              disabled={loading}
              className='gap-2'
            >
              {loading ? (
                <RefreshCw className='h-4 w-4 animate-spin' />
              ) : (
                <Send className='h-4 w-4' />
              )}
              Resend
            </Button>
          )}
          <Button
            variant='destructive'
            onClick={() => handleDelete(invitation.id)}
            className='gap-2'
          >
            <Trash2 className='h-4 w-4' />
            Delete
          </Button>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Email Address
                </label>
                <div className='flex items-center gap-2 mt-1'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <span className='font-mono'>{invitation.email}</span>
                </div>
              </div>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Role
                </label>
                <div className='mt-1'>
                  <Badge
                    variant='outline'
                    className={getRoleColor(invitation.role)}
                  >
                    {invitation.role}
                  </Badge>
                </div>
              </div>
            </div>

            {invitation.program_type && (
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Program Type
                </label>
                <div className='mt-1'>
                  <Badge variant='outline'>{invitation.program_type}</Badge>
                </div>
              </div>
            )}

            {invitation.cohort && (
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Cohort
                </label>
                <div className='mt-1'>
                  <Badge variant='outline'>Cohort {invitation.cohort}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Invitation Status
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-muted-foreground'>
                Current Status
              </label>
              <div className='flex items-center gap-2 mt-1'>
                <Badge variant='outline' className={getStatusColor(invitation)}>
                  {getStatusIcon(invitation)}
                  {getStatus(invitation)}
                </Badge>
              </div>
            </div>

            <div>
              <label className='text-sm font-medium text-muted-foreground'>
                Expires At
              </label>
              <div className='flex items-center gap-2 mt-1'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span>{format(new Date(invitation.expires_at), 'PPP')}</span>
              </div>
            </div>

            {invitation.used_at && (
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Used At
                </label>
                <div className='flex items-center gap-2 mt-1'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span>{format(new Date(invitation.used_at), 'PPP')}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
