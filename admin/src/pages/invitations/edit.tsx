import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdate, useOne, useList, useNavigation } from '@refinedev/core';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { getResourceIcon } from '@/utils/resourceUtils';

const formSchema = z
  .object({
    email: z.email('Invalid email address'),
    role: z.enum(['admin', 'lecturer', 'student'], 'Please select a role'),
    program_type: z.enum(['certificate', 'diploma']).optional(),
    cohort: z.number().int().positive().optional(),
  })
  .refine(
    data => {
      // If role is student, program_type is required
      if (data.role === 'student' && !data.program_type) {
        return false;
      }
      return true;
    },
    {
      message: 'Program type is required for students',
      path: ['program_type'],
    }
  )
  .refine(
    data => {
      // If role is student, cohort is required
      if (data.role === 'student' && !data.cohort) {
        return false;
      }
      return true;
    },
    {
      message: 'Cohort is required for students',
      path: ['cohort'],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface Invitation {
  id: number;
  email: string;
  role: string;
  cohort: number | null;
  cohort_name: string | null;
  cohort_program_type: string | null;
  expires_at: string;
  is_used: boolean;
  is_expired: boolean;
}

interface CohortOption {
  id: number;
  name: string;
  program_type: 'certificate' | 'diploma';
}

/**
 * Active cohorts of the chosen program, plus the invitation's current
 * cohort even if it has since been deactivated, so the field never shows
 * blank for a saved value.
 */
const cohortOptionsFor = (
  active: CohortOption[],
  invitation: Invitation | undefined,
  program: string | undefined
): { id: number; label: string }[] => {
  if (!program) return [];
  const options = active
    .filter(c => c.program_type === program)
    .map(c => ({ id: c.id, label: c.name }));
  if (
    invitation?.cohort &&
    invitation.cohort_program_type === program &&
    !options.some(o => o.id === invitation.cohort)
  ) {
    options.unshift({
      id: invitation.cohort,
      label: `${invitation.cohort_name ?? `Cohort ${invitation.cohort}`} (inactive)`,
    });
  }
  return options;
};

export const InvitationsEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { list } = useNavigation();
  const {
    mutate: updateInvitation,
    mutation: { isPending: isUpdating },
  } = useUpdate();
  const [error, setError] = useState<string>('');

  const {
    result: invitationData,
    query: { isLoading },
  } = useOne<Invitation>({
    resource: 'invitations',
    id: id,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: undefined,
      program_type: undefined,
      cohort: undefined,
    },
  });

  const selectedRole = form.watch('role');
  const selectedProgram = form.watch('program_type');

  // Several cohorts of a program can be active at once, so pick by name.
  const { result: cohortsData } = useList<CohortOption>({
    resource: 'cohorts',
    filters: [{ field: 'is_active', operator: 'eq', value: true }],
    pagination: { mode: 'off' },
  });
  const cohortOptions = cohortOptionsFor(
    cohortsData?.data ?? [],
    invitationData,
    selectedProgram
  );

  // Update form when data loads
  useEffect(() => {
    if (invitationData) {
      const invitation = invitationData;
      form.reset({
        email: invitation.email,
        role: invitation.role as 'admin' | 'lecturer' | 'student',
        program_type: (invitation.cohort_program_type ?? undefined) as
          | 'certificate'
          | 'diploma'
          | undefined,
        cohort: invitation.cohort || undefined,
      });
    }
  }, [invitationData, form]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    setError('');

    try {
      const payload = {
        email: data.email,
        role: data.role,
        ...(data.program_type && { program_type: data.program_type }),
        ...(data.cohort && { cohort: data.cohort }),
      };

      updateInvitation(
        {
          resource: 'invitations',
          id: id,
          values: payload,
        },
        {
          onSuccess: () => {
            list('invitations');
          },
          onError: (error: { message: string }) => {
            setError(error?.message || 'Failed to update invitation');
          },
        }
      );
    } catch (err) {
      setError('An unexpected error occurred');
    }
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
      <div>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('invitations')}
          Edit Invitation
        </h1>
        <p className='text-muted-foreground'>
          Update the invitation details for {invitation.email}
        </p>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Invitation Details</CardTitle>
          <CardDescription>
            Edit the invitation details. The expiry date is managed
            automatically by the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation.is_used && (
            <Alert className='mb-6'>
              <AlertDescription>
                This invitation has already been used and cannot be modified.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant='destructive' className='mb-6'>
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='user@example.com'
                        type='email'
                        disabled={invitation.is_used}
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
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={invitation.is_used}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='admin'>Admin</SelectItem>
                        <SelectItem value='lecturer'>Lecturer</SelectItem>
                        <SelectItem value='student'>Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The role determines the user's permissions in the system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === 'student' && (
                <>
                  <FormField
                    control={form.control}
                    name='program_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Type</FormLabel>
                        <Select
                          onValueChange={value => {
                            field.onChange(value);
                            // The chosen cohort belongs to one program.
                            form.setValue('cohort', undefined);
                          }}
                          value={field.value}
                          disabled={invitation.is_used}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select program type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='certificate'>
                              Certificate
                            </SelectItem>
                            <SelectItem value='diploma'>Diploma</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Required for student accounts
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
                          onValueChange={value =>
                            field.onChange(parseInt(value, 10))
                          }
                          value={field.value ? String(field.value) : ''}
                          disabled={invitation.is_used || !selectedProgram}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  selectedProgram
                                    ? 'Select a cohort'
                                    : 'Select a program type first'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cohortOptions.map(option => (
                              <SelectItem
                                key={option.id}
                                value={String(option.id)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {selectedProgram && cohortOptions.length === 0
                            ? `No active ${selectedProgram} cohorts`
                            : 'The cohort the student will join'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className='flex justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => list('invitations')}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isUpdating || invitation.is_used}
                >
                  {isUpdating ? 'Updating...' : 'Update Invitation'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
