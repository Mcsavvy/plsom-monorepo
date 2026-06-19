import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import {
  useOne,
  useNavigation,
  useCustomMutation,
  useList,
  useNotification,
} from '@refinedev/core';
import { format } from 'date-fns';
import {
  Calendar,
  Loader2,
  Mail,
  Phone,
  User,
  MapPin,
  Globe,
  Briefcase,
  BookOpen,
  GraduationCap,
  FileText,
  Send,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import type { Application } from './list';

interface Cohort {
  id: number;
  name: string;
  program_type: 'CERTIFICATE' | 'DIPLOMA';
  is_active: boolean;
}

export const ApplicationsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { list } = useNavigation();
  const { open } = useNotification();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [inviting, setInviting] = useState(false);

  const {
    result: application,
    query: { isLoading, isError, error },
  } = useOne<Application>({ resource: 'applications', id });

  // Fetch active cohorts for invite dialog
  const { result: cohortsData } = useList<Cohort>({
    resource: 'cohorts',
    filters: [{ field: 'is_active', operator: 'eq', value: true }],
  });
  const cohorts = cohortsData?.data || [];

  const filteredCohorts = cohorts.filter(
    c => c.program_type === (application?.program_type || '')
  );

  const { mutate: sendInvite } = useCustomMutation();

  const handleInvite = async () => {
    if (!selectedCohort || !application) return;
    setInviting(true);
    try {
      await sendInvite({
        url: `/applications/${application.id}/invite/`,
        method: 'post',
        values: { cohort: parseInt(selectedCohort, 10) },
      });
      open?.({ type: 'success', message: 'Invitation sent successfully!' });
      setInviteDialogOpen(false);
    } catch (err: any) {
      open?.({
        type: 'error',
        message: err?.message || 'Failed to send invitation.',
      });
    } finally {
      setInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='flex items-center gap-2'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading application...</span>
        </div>
      </div>
    );
  }

  if (isError || !application) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {error?.message || 'Application not found.'}
        </AlertDescription>
      </Alert>
    );
  }

  const getProgramColor = (program: string) => {
    switch (program) {
      case 'CERTIFICATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DIPLOMA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmploymentColor = (status: string) => {
    switch (status) {
      case 'EMPLOYED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UNEMPLOYED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'STUDENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <Button variant='ghost' size='sm' onClick={() => list('applications')} className='gap-1'>
              <ArrowLeft className='h-4 w-4' />
              Back
            </Button>
          </div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('applications')}
            Application Details
          </h1>
          <p className='text-muted-foreground'>
            Review applicant information and invite as student
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2'>
              <Send className='h-4 w-4' />
              Invite as Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Applicant as Student</DialogTitle>
              <DialogDescription>
                Create a student invitation for {application.full_name}. An email will be sent
                to {application.email}.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Cohort</Label>
                <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a cohort' />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCohorts.length === 0 ? (
                      <SelectItem value='_' disabled>
                        No active cohorts for {application.program_type}
                      </SelectItem>
                    ) : (
                      filteredCohorts.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!selectedCohort || inviting}>
                {inviting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>Full Name</label>
                <p className='mt-1 font-medium'>{application.full_name}</p>
              </div>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>Gender</label>
                <p className='mt-1'>{application.gender}</p>
              </div>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>Father's Name</label>
                <p className='mt-1'>{application.father_name}</p>
              </div>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>Mother's Name</label>
                <p className='mt-1'>{application.mother_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Mail className='h-5 w-5' />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <span className='font-mono'>{application.email}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <span>{application.phone}</span>
            </div>
            <div className='flex items-start gap-2'>
              <MapPin className='h-4 w-4 text-muted-foreground mt-0.5' />
              <span>{application.full_residential_address}</span>
            </div>
          </CardContent>
        </Card>

        {/* Background */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Globe className='h-5 w-5' />
              Background
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Globe className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>Nationality:</span>
              <span>{application.nationality}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Briefcase className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>Employment:</span>
              <Badge variant='outline' className={getEmploymentColor(application.employment_status)}>
                {application.employment_status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Program Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <GraduationCap className='h-5 w-5' />
              Program Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>Program Type:</span>
              <Badge variant='outline' className={getProgramColor(application.program_type)}>
                {application.program_type}
              </Badge>
            </div>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>Submitted:</span>
              <span>{format(new Date(application.submitted_at), 'PPP')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Interest */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Program Interest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm leading-relaxed whitespace-pre-wrap'>
            {application.program_interest}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
