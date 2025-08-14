import { useState, useCallback } from 'react';
import { useOne, useList, useNavigation } from '@refinedev/core';
import { useParams, Link } from 'react-router';
import { format } from 'date-fns';
import {
  Calendar,
  User,
  Mail,
  Phone,
  GraduationCap,
  CheckCircle,
  XCircle,
  UserPlus,
  Plus,
  Minus,
  Loader2,
  Settings,
  Edit,
} from 'lucide-react';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InviteStudentForm } from '../../components/InviteForm';
import { Student } from '@/types/student';
import { getResourceIcon } from '@/utils/resourceUtils';
import { useStudentEnrollment } from '@/hooks/useStudentEnrollment';

interface Cohort {
  id: number;
  name: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  start_date: string;
  end_date?: string | null;
}

export const StudentsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { show } = useNavigation();
  const { enrollStudent, unenrollStudent, isEnrolling, isUnenrolling } =
    useStudentEnrollment();

  const {
    data: studentData,
    isLoading,
    isError,
    error,
  } = useOne<Student>({
    resource: 'students',
    id: id,
    meta: {
      transform: true,
    },
  });

  const { data: cohortsData } = useList<Cohort>({
    resource: 'cohorts',
    filters: [{ field: 'is_active', operator: 'eq', value: true }],
  });

  const student = studentData?.data;
  const cohorts = cohortsData?.data || [];

  // Get cohorts the student is not enrolled in
  const availableCohorts = cohorts.filter(
    cohort =>
      !student?.enrollments.some(
        enrollment => enrollment.cohort.id === cohort.id
      )
  );

  const handleEnroll = useCallback(async () => {
    if (!selectedCohortId || !student) return;

    try {
      await enrollStudent(student.id, parseInt(selectedCohortId), {
        onSuccess: () => {
          setEnrollDialogOpen(false);
          setSelectedCohortId('');
          // Data will be automatically refreshed by the hook
        },
        onError: error => {
          console.error('Enrollment error:', error);
        },
      });
    } catch (error) {
      // Error is handled by the hook
    }
  }, [enrollStudent, selectedCohortId, student]);

  const handleUnenroll = useCallback(
    async (cohortId: number, cohortName: string) => {
      if (!student) return;

      if (
        window.confirm(
          `Are you sure you want to unenroll ${student.firstName} ${student.lastName} from ${cohortName}?`
        )
      ) {
        try {
          await unenrollStudent(student.id, cohortId, {
            onSuccess: () => {
              // Data will be automatically refreshed by the hook
            },
            onError: error => {
              console.error('Unenrollment error:', error);
            },
          });
        } catch (error) {
          // Error is handled by the hook
        }
      }
    },
    [unenrollStudent, student]
  );

  const getProgramTypeColor = (programType: string) => {
    switch (programType) {
      case 'certificate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'diploma':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: 'active' | 'inactive' | 'pending') => {
    switch (status) {
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: 'active' | 'inactive' | 'pending') => {
    switch (status) {
      case 'inactive':
        return <XCircle className='h-4 w-4' />;
      case 'pending':
        return <Settings className='h-4 w-4' />;
      case 'active':
        return <CheckCircle className='h-4 w-4' />;
      default:
        return <CheckCircle className='h-4 w-4' />;
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-8 w-[200px]' />
            <Skeleton className='h-4 w-[150px]' />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Skeleton className='h-[300px]' />
          <Skeleton className='h-[300px]' />
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {error?.message || 'Student not found or could not be loaded.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('students')}
            {student.displayName}
          </h1>
          <p className='text-muted-foreground'>{student.email}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Link to={`/students/${student.id}/edit`}>
            <Button variant='outline' className='gap-2'>
              <Edit className='h-4 w-4' />
              Edit Student
            </Button>
          </Link>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' className='gap-2'>
                <UserPlus className='h-4 w-4' />
                Invite Another Student
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Invite New Student</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new student to join a program
                </DialogDescription>
              </DialogHeader>
              <InviteStudentForm onSuccess={() => setInviteDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          {availableCohorts.length > 0 && (
            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button className='gap-2'>
                  <Plus className='h-4 w-4' />
                  Enroll in Cohort
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll in Cohort</DialogTitle>
                  <DialogDescription>
                    Select a cohort to enroll {student.displayName}
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <Select
                    value={selectedCohortId}
                    onValueChange={setSelectedCohortId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select a cohort' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCohorts.map(cohort => (
                        <SelectItem
                          key={cohort.id}
                          value={cohort.id.toString()}
                        >
                          {cohort.name} ({cohort.program_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setEnrollDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEnroll}
                      disabled={!selectedCohortId || isEnrolling}
                    >
                      {isEnrolling ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Plus className='mr-2 h-4 w-4' />
                      )}
                      Enroll
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className='md:col-span-1'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-20 w-20'>
                <AvatarImage
                  src={student.profilePicture || ''}
                  alt={student.firstName}
                />
                <AvatarFallback className='text-xl'>
                  {student.firstName.charAt(0)}
                  {student.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>{student.displayName}</h3>
                <Badge
                  variant='outline'
                  className={getStatusColor(student.status)}
                >
                  {getStatusIcon(student.status)}
                  <span className='ml-1'>{student.statusText}</span>
                </Badge>
              </div>
            </div>

            <Separator />

            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Email</p>
                  <p className='text-sm text-muted-foreground'>
                    {student.email}
                  </p>
                </div>
              </div>

              {student.whatsappNumber && (
                <div className='flex items-center gap-3'>
                  <Phone className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>WhatsApp Number</p>
                    <p className='text-sm text-muted-foreground'>
                      {student.whatsappNumber}
                    </p>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-3'>
                <CheckCircle className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Active</p>
                  <p className='text-sm text-muted-foreground'>
                    {student.isActive ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <GraduationCap className='h-5 w-5' />
              Enrollments ({student.enrollments.length})
            </CardTitle>
            <CardDescription>
              Current cohort enrollments for this student
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.enrollments.length === 0 ? (
              <div className='text-center py-8'>
                <GraduationCap className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                <h3 className='text-lg font-medium mb-2'>No Enrollments</h3>
                <p className='text-muted-foreground mb-4'>
                  This student is not enrolled in any cohorts yet.
                </p>
                {availableCohorts.length > 0 && (
                  <Button
                    onClick={() => setEnrollDialogOpen(true)}
                    className='gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    Enroll in Cohort
                  </Button>
                )}
              </div>
            ) : (
              <div className='space-y-4'>
                {student.enrollments.map(enrollment => (
                  <div
                    key={enrollment.id}
                    className='flex items-center justify-between p-4 border rounded-lg'
                  >
                    <div className='space-y-2'>
                      <div className='flex items-center gap-3'>
                        <h4
                          className='font-medium cursor-pointer hover:text-primary/80 hover:underline'
                          onClick={() => show('enrollments', enrollment.id)}
                        >
                          {enrollment.cohort.name}
                        </h4>
                        <div className='flex gap-2'>
                          <Badge
                            variant='outline'
                            className={getProgramTypeColor(
                              enrollment.cohort.programType
                            )}
                          >
                            {enrollment.cohort.programType}
                          </Badge>
                          <Badge
                            variant='outline'
                            className={
                              enrollment.cohort.isActive
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                            }
                          >
                            {enrollment.cohort.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          Enrolled:{' '}
                          {format(
                            new Date(enrollment.enrolledAt),
                            'MMM d, yyyy'
                          )}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          Started:{' '}
                          {format(
                            new Date(enrollment.cohort.startDate),
                            'MMM d, yyyy'
                          )}
                        </div>
                        {enrollment.cohort.endDate && (
                          <div className='flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />
                            Ends:{' '}
                            {format(
                              new Date(enrollment.cohort.endDate),
                              'MMM d, yyyy'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        handleUnenroll(
                          enrollment.cohort.id,
                          enrollment.cohort.name
                        )
                      }
                      disabled={isUnenrolling}
                      className='gap-2 text-red-600 hover:text-red-700'
                    >
                      {isUnenrolling ? (
                        <Loader2 className='h-3 w-3 animate-spin' />
                      ) : (
                        <Minus className='h-3 w-3' />
                      )}
                      Unenroll
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {student.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-muted/50 rounded-lg'>
                <h3 className='text-2xl font-bold'>
                  {student.enrollments.length}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Total Enrollments
                </p>
              </div>
              <div className='text-center p-4 bg-muted/50 rounded-lg'>
                <h3 className='text-2xl font-bold'>
                  {student.enrollments.filter(e => e.cohort.isActive).length}
                </h3>
                <p className='text-sm text-muted-foreground'>Active Cohorts</p>
              </div>
              <div className='text-center p-4 bg-muted/50 rounded-lg'>
                <h3 className='text-2xl font-bold'>
                  {
                    new Set(student.enrollments.map(e => e.cohort.programType))
                      .size
                  }
                </h3>
                <p className='text-sm text-muted-foreground'>Program Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
