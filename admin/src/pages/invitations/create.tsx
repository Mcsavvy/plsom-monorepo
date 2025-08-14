import { useState } from 'react';
import { useNavigation } from '@refinedev/core';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InviteStudentForm, InviteStaffForm } from '@/components/InviteForm';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Users, GraduationCap } from 'lucide-react';

type UserType = 'staff' | 'student' | null;

export const InvitationsCreate: React.FC = () => {
  const { list } = useNavigation();
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);

  const handleSuccess = () => {
    list('invitations');
  };

  const handleBack = () => {
    setSelectedUserType(null);
  };

  // Step 1: User type selection
  if (!selectedUserType) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('invitations')}
            Send Invitation
          </h1>
          <p className='text-muted-foreground'>
            Choose the type of user you want to invite
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2 max-w-4xl'>
          <Card
            className='cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20'
            onClick={() => setSelectedUserType('staff')}
          >
            <CardHeader className='text-center'>
              <div className='mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4'>
                <Users className='h-6 w-6 text-blue-600' />
              </div>
              <CardTitle>Invite Staff Member</CardTitle>
              <CardDescription>
                Send an invitation to a new admin or lecturer. Only requires an
                email address and role selection.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className='cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20'
            onClick={() => setSelectedUserType('student')}
          >
            <CardHeader className='text-center'>
              <div className='mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4'>
                <GraduationCap className='h-6 w-6 text-green-600' />
              </div>
              <CardTitle>Invite Student</CardTitle>
              <CardDescription>
                Send an invitation to a new student. Requires email, program
                type, and cohort selection.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className='flex justify-start'>
          <Button variant='outline' onClick={() => list('invitations')}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Show appropriate form based on selection
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('invitations')}
          Invite {selectedUserType === 'staff' ? 'Staff Member' : 'Student'}
        </h1>
        <p className='text-muted-foreground'>
          Fill in the details to send an invitation.{' '}
          <button
            onClick={handleBack}
            className='text-primary underline font-medium cursor-pointer'
          >
            Change user type
          </button>
        </p>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>
            {selectedUserType === 'staff' ? 'Staff' : 'Student'} Invitation
            Details
          </CardTitle>
          <CardDescription>
            {selectedUserType === 'staff'
              ? 'Enter the email address and select the role for the staff member.'
              : 'Enter the student details including program type and cohort assignment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedUserType === 'staff' ? (
            <InviteStaffForm onSuccess={handleSuccess} />
          ) : (
            <InviteStudentForm onSuccess={handleSuccess} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
