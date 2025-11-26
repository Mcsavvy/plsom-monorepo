import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreate, useList, useNotification } from '@refinedev/core';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

// Staff invitation form schema - only requires email
const staffFormSchema = z.object({
  email: z.email('Invalid email address'),
  role: z.enum(['admin', 'lecturer'], {
    message: 'Please select a staff role',
  }),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

interface InviteStaffFormProps {
  onSuccess?: () => void;
}

export const InviteStaffForm: React.FC<InviteStaffFormProps> = ({
  onSuccess,
}) => {
  const {
    mutate: createInvitation,
    mutation: { isPending },
  } = useCreate();
  const { open } = useNotification();
  const [error, setError] = useState<string>('');

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      email: '',
      role: 'lecturer',
    },
  });

  const onSubmit = async (data: StaffFormData) => {
    setError('');

    try {
      const payload = {
        email: data.email,
        role: data.role,
      };

      createInvitation(
        {
          resource: 'invitations',
          values: payload,
        },
        {
          onSuccess: () => {
            form.reset();
            onSuccess?.();
            open?.({
              type: 'success',
              message: 'Staff invitation sent successfully!',
            });
          },
          onError: (error: { message: string }) => {
            setError(error?.message || 'Failed to send invitation');
            open?.({
              type: 'error',
              message: error?.message || 'Failed to send invitation',
            });
          },
        }
      );
    } catch (err) {
      setError('An unexpected error occurred');
      open?.({
        type: 'error',
        message: 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className='space-y-6'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Staff Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder='staff@example.com'
                    type='email'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The email address where the invitation will be sent
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='role'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Staff Role</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select staff role' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='lecturer'>Lecturer</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the role for the staff member
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-4'>
            <Button type='submit' disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending Invitation...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  program_type: z.enum(['certificate', 'diploma'], {
    message: 'Please select a program type',
  }),
  cohort: z.number().int().positive({
    message: 'Please select a cohort',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface Cohort {
  id: number;
  name: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
}

interface InviteStudentFormProps {
  onSuccess?: () => void;
}

export const InviteStudentForm: React.FC<InviteStudentFormProps> = ({
  onSuccess,
}) => {
  const {
    mutate: createInvitation,
    mutation: { isPending },
  } = useCreate();
  const { open } = useNotification();
  const [error, setError] = useState<string>('');

  // Fetch active cohorts
  const { result: cohortsData } = useList<Cohort>({
    resource: 'cohorts',
    filters: [{ field: 'is_active', operator: 'eq', value: true }],
  });

  const cohorts = cohortsData?.data || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      program_type: 'certificate',
      cohort: undefined,
    },
  });

  const selectedProgramType = form.watch('program_type');

  // Filter cohorts based on selected program type
  const filteredCohorts = cohorts.filter(
    cohort => cohort.program_type === selectedProgramType
  );

  // Reset cohort selection when program type changes
  const handleProgramTypeChange = (value: 'certificate' | 'diploma') => {
    form.setValue('program_type', value);
    form.setValue('cohort', undefined as any); // Reset cohort selection
  };

  const onSubmit = async (data: FormData) => {
    setError('');

    try {
      const payload = {
        email: data.email,
        role: 'student',
        program_type: data.program_type,
        cohort: data.cohort,
      };

      createInvitation(
        {
          resource: 'invitations',
          values: payload,
        },
        {
          onSuccess: () => {
            form.reset();
            onSuccess?.();
            open?.({
              type: 'success',
              message: 'Invitation sent successfully!',
            });
          },
          onError: (error: { message: string }) => {
            setError(error?.message || 'Failed to send invitation');
            open?.({
              type: 'error',
              message: error?.message || 'Failed to send invitation',
            });
          },
        }
      );
    } catch (err) {
      setError('An unexpected error occurred');
      open?.({
        type: 'error',
        message: 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className='space-y-6'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder='student@example.com'
                    type='email'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The email address where the invitation will be sent
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='program_type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={handleProgramTypeChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select program type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='certificate'>
                      Certificate Program
                    </SelectItem>
                    <SelectItem value='diploma'>Diploma Program</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the type of program the student will be enrolled in
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='cohort'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cohort</FormLabel>
                <Select
                  value={field.value?.toString()}
                  onValueChange={value => field.onChange(parseInt(value, 10))}
                  disabled={
                    !selectedProgramType || filteredCohorts.length === 0
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a cohort' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCohorts.map(cohort => (
                      <SelectItem key={cohort.id} value={cohort.id.toString()}>
                        {cohort.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {filteredCohorts.length === 0 && selectedProgramType
                    ? `No active cohorts available for ${selectedProgramType} program`
                    : 'Select the cohort the student will be enrolled in'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-4'>
            <Button type='submit' disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending Invitation...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
