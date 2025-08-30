import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNotification, useCustomMutation } from '@refinedev/core';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { USER_TITLE_OPTIONS } from '@/constants';

// Onboarding form schema based on OpenAPI
const onboardingSchema = z
  .object({
    token: z.string().uuid('Invalid token format'),
    first_name: z.string().min(1, 'First name is required').max(150),
    last_name: z.string().min(1, 'Last name is required').max(150),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string().min(8, 'Password confirmation is required'),
    title: z.string().max(20).optional(),
    whatsapp_number: z.string().max(20).optional(),
  })
  .refine(data => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ['password_confirm'],
  });

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface InvitationDetails {
  email: string;
  role: string;
  cohort_name: string;
}

type OnboardingStep = 'verifying' | 'form' | 'success' | 'error';

export const Onboard: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { open } = useNotification();

  const [step, setStep] = useState<OnboardingStep>('verifying');
  const [invitationDetails, setInvitationDetails] =
    useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string>('');

  // Refine hooks for API calls
  const { mutateAsync: verifyToken } = useCustomMutation();
  const { mutateAsync: completeOnboarding, isPending: isSubmitting } =
    useCustomMutation();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      token: token || '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      title: '',
      whatsapp_number: '',
    },
  });

  const handleVerifyToken = useCallback(
    async (invitationToken: string) => {
      try {
        const response = await verifyToken({
          url: 'invitations/verify/',
          method: 'post',
          values: { token: invitationToken },
          successNotification: false,
          errorNotification: false,
        });

        const invitationData = response.data as unknown as InvitationDetails;

        // Check if the role is staff (admin or lecturer)
        if (
          invitationData.role !== 'admin' &&
          invitationData.role !== 'lecturer'
        ) {
          setStep('error');
          setError(
            'This onboarding page is only available for staff members (admins and lecturers). Students have a different onboarding process.'
          );
          return;
        }

        setInvitationDetails(invitationData);
        setStep('form');
      } catch (err: any) {
        setStep('error');
        setError(
          err.response?.data?.message ||
            err.response?.data?.detail ||
            'Invalid or expired invitation link.'
        );
      }
    },
    [verifyToken]
  );

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setStep('error');
      setError('Invalid invitation link. No token provided.');
      return;
    }

    handleVerifyToken(token);
  }, [token, handleVerifyToken]);

  const onSubmit = async (data: OnboardingFormData) => {
    setError('');

    try {
      await completeOnboarding({
        url: 'invitations/onboard/',
        method: 'post',
        values: data,
        successNotification: false,
        errorNotification: false,
      });

      setStep('success');
      open?.({
        type: 'success',
        message: 'Account created successfully! You can now sign in.',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Failed to complete onboarding. Please try again.'
      );
      open?.({
        type: 'error',
        message: 'Failed to complete onboarding',
      });
    }
  };

  // Verifying step
  if (step === 'verifying') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center space-y-4'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>
                Verifying your invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error step
  if (step === 'error') {
    const isStudentError = error.includes('staff members');

    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <AlertCircle className='h-12 w-12 text-destructive mx-auto mb-4' />
            <CardTitle>
              {isStudentError ? 'Access Restricted' : 'Invalid Invitation'}
            </CardTitle>
            <CardDescription>
              {isStudentError
                ? 'This page is for staff onboarding only.'
                : "We couldn't verify your invitation link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className='mt-6 text-center space-y-2'>
              <Button onClick={() => navigate('/login')} variant='outline'>
                Go to Sign In
              </Button>
              {isStudentError && (
                <p className='text-xs text-muted-foreground mt-2'>
                  If you're a student, please check your email for the correct
                  onboarding link.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CheckCircle className='h-12 w-12 text-green-600 mx-auto mb-4' />
            <CardTitle>Welcome to the PLSOM Team!</CardTitle>
            <CardDescription>
              Your staff account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-sm text-muted-foreground mb-4'>
              You will be redirected to the sign-in page in a few seconds.
            </p>
            <Button onClick={() => navigate('/login')}>Sign In Now</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main onboarding form
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-2xl'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold text-center'>
            Complete Your Staff Account Setup
          </CardTitle>
          <CardDescription className='text-center'>
            Welcome to PLSOM! Please fill in your details to complete your staff
            account setup.
          </CardDescription>
          {invitationDetails && (
            <div className='mt-4 p-4 bg-muted rounded-lg'>
              <p className='text-sm'>
                <strong>Email:</strong> {invitationDetails.email}
              </p>
              <p className='text-sm'>
                <strong>Role:</strong> {invitationDetails.role}
              </p>
              {invitationDetails.cohort_name && (
                <p className='text-sm'>
                  <strong>Cohort:</strong> {invitationDetails.cohort_name}
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <input type='hidden' {...form.register('token')} />
              <input type='hidden' value={invitationDetails?.role} />
              <input type='hidden' value={invitationDetails?.cohort_name} />
              <input type='hidden' value={invitationDetails?.email} />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='first_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='John' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='last_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Doe' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={value => {
                        if (value === 'none') {
                          field.onChange('');
                        } else {
                          field.onChange(value);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a title' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>No title</SelectItem>
                        {USER_TITLE_OPTIONS.map(title => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='whatsapp_number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='+1234567890' type='tel' {...field} />
                    </FormControl>
                    <FormDescription>
                      Include country code (e.g., +1234567890)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder='••••••••' {...field} />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='password_confirm'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder='••••••••' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end gap-4 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => navigate('/login')}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Creating Account...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
