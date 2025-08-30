import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOne, useUpdate, useNotification } from '@refinedev/core';
import { useParams, Link } from 'react-router';
import { User, Save, Loader2 } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Staff } from '@/types/staff';
import { USER_TITLE_OPTIONS } from '@/constants';

const TITLE_OPTIONS = USER_TITLE_OPTIONS;

const formSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(150),
  last_name: z.string().min(1, 'Last name is required').max(150),
  email: z.email('Invalid email address').max(254),
  title: z
    .enum([...TITLE_OPTIONS] as [string, ...string[]])
    .optional()
    .or(z.literal('')),
  whatsapp_number: z.string().max(20).optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export const StaffEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { open } = useNotification();
  const [error, setError] = useState<string>('');

  const { mutate: updateStaff, isPending: isUpdating } = useUpdate();

  const {
    data: staffData,
    isLoading,
    isError,
    error: fetchError,
  } = useOne<Staff>({
    resource: 'staff',
    id: id,
    meta: {
      transform: true,
    },
  });

  const staff = staffData?.data;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      title: '',
      whatsapp_number: '',
    },
  });

  // Update form when staff data loads
  useEffect(() => {
    if (staff) {
      form.reset({
        first_name: staff.firstName,
        last_name: staff.lastName,
        email: staff.email,
        title: (staff.title as string) || '',
        whatsapp_number: staff.whatsappNumber || '',
      });
    }
  }, [staff, form]);

  const onSubmit = (values: FormData) => {
    if (!staff) return;

    setError('');

    updateStaff(
      {
        resource: 'staff',
        id: staff.id,
        values: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          title: values.title || null,
          whatsapp_number: values.whatsapp_number || null,
        },
        meta: {
          transform: true,
        },
      },
      {
        onSuccess: () => {
          open?.({
            type: 'success',
            message: 'Staff member updated successfully',
          });
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            'Failed to update staff member';
          setError(message);
          open?.({
            type: 'error',
            message: 'Failed to update staff member',
            description: message,
          });
        },
      }
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
            <Skeleton className='h-10 w-16' />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
            <Skeleton className='h-4 w-48' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-full' />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !staff) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {fetchError?.message ||
            'Staff member not found or could not be loaded.'}
        </AlertDescription>
      </Alert>
    );
  }

  const displayName = staff.displayName;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('staff')}
            Edit Staff Member
          </h1>
          <p className='text-muted-foreground'>
            Update information for {displayName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Staff Information
          </CardTitle>
          <CardDescription>
            Update the staff member's basic information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='first_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter first name' {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter last name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Enter email address'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be used for login and communication
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <Select
                        onValueChange={value => {
                          if (value === 'none') {
                            field.onChange('');
                          } else {
                            field.onChange(value);
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a title' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>No title</SelectItem>
                          {TITLE_OPTIONS.map(title => (
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
                        <Input placeholder='Enter WhatsApp number' {...field} />
                      </FormControl>
                      <FormDescription>
                        Include country code (e.g., +1234567890)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end gap-4 pt-6'>
                <Link to={`/staff/${staff.id}`}>
                  <Button type='button' variant='outline'>
                    Cancel
                  </Button>
                </Link>
                <Button type='submit' disabled={isUpdating}>
                  {isUpdating && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  <Save className='mr-2 h-4 w-4' />
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
