import { useState, useRef, useEffect } from 'react';
import { useCustomMutation, useGetIdentity, useUpdate } from '@refinedev/core';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Loader2, Mail, Camera, Trash2, Phone } from 'lucide-react';
import { HttpError } from '@refinedev/core';
import { UserIdentity } from '@/types/user';
import { USER_TITLE_OPTIONS } from '@/constants';

// Profile update form schema
const profileFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  whatsapp_number: z.string().optional(),
});

// Password change form schema
const passwordFormSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

export const Profile = () => {
  const { data: user, isLoading: isLoadingUser } =
    useGetIdentity<UserIdentity>();
  const { mutate: updateUser, mutation: {
    isPending: isUpdatingProfile
  } } = useUpdate();
  const { mutate: updatePassword, mutation: {
    isPending: isUpdatingPassword
  } } =
    useCustomMutation();
  const { mutate: uploadProfilePicture, mutation: {
    isPending: isUploadingPicture
  } } =
    useCustomMutation();
  const { mutate: deleteProfilePicture, mutation: {
    isPending: isDeletingPicture
  } } =
    useCustomMutation();

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Profile picture states
  const [pictureError, setPictureError] = useState('');
  const [pictureSuccess, setPictureSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      title: user?.title || '',
      whatsapp_number: user?.whatsappNumber || '',
    },
  });

  // Refresh form values when user data is loaded/refreshed
  useEffect(() => {
    if (user) {
      profileForm.reset({
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        title: user.title || '',
        whatsapp_number: user.whatsappNumber || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'destructive' as const;
      case 'lecturer':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setProfileError('');
    setProfileSuccess('');

    try {
      updateUser(
        {
          resource: 'users',
          id: user.id,
          values: data,
        },
        {
          onSuccess: () => {
            setProfileSuccess('Profile updated successfully!');
            // Reset form to show updated values
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          },
          onError: (error: unknown) => {
            setProfileError(
              (error as HttpError)?.message || 'Failed to update profile'
            );
          },
        }
      );
    } catch (error) {
      setProfileError('An unexpected error occurred');
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordError('');
    setPasswordSuccess('');

    updatePassword(
      {
        url: '/auth/change-password/',
        method: 'post',
        values: data,
      },
      {
        onSuccess: () => {
          setPasswordSuccess('Password changed successfully!');
          passwordForm.reset();
        },
        onError: (error: unknown) => {
          setPasswordError(
            (error as HttpError)?.response?.data?.message ||
              (error as HttpError)?.message ||
              'Failed to change password. Please try again.'
          );
        },
      }
    );
  };

  // Profile picture functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadProfilePicture(file);
    }
  };

  const handleUploadProfilePicture = async (file: File) => {
    setPictureError('');
    setPictureSuccess('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPictureError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPictureError('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('profile_picture', file);

    uploadProfilePicture(
      {
        url: '/users/me/profile-picture/',
        method: 'post',
        values: formData,
        config: {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      },
      {
        onSuccess: () => {
          setPictureSuccess('Profile picture updated successfully!');
          // Refresh the page to show the new picture
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        onError: (error: unknown) => {
          setPictureError(
            (error as HttpError)?.response?.data?.message ||
              (error as HttpError)?.message ||
              'Failed to upload profile picture. Please try again.'
          );
        },
      }
    );
  };

  const handleDeleteProfilePicture = async () => {
    setPictureError('');
    setPictureSuccess('');

    deleteProfilePicture(
      {
        url: '/users/me/profile-picture/',
        method: 'delete',
        values: {},
      },
      {
        onSuccess: () => {
          setPictureSuccess('Profile picture deleted successfully!');
          // Refresh the page to show the updated state
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        onError: (error: unknown) => {
          setPictureError(
            (error as HttpError)?.response?.data?.message ||
              (error as HttpError)?.message ||
              'Failed to delete profile picture. Please try again.'
          );
        },
      }
    );
  };

  if (isLoadingUser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>User not found</h2>
          <p className='text-muted-foreground'>Unable to load user profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Profile Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-auto'>
        {/* Profile Overview Card */}
        <div className='lg:col-span-1 h-full'>
          <Card className='overflow-hidden h-full'>
            {/* Cover/Background Section */}
            <div className='relative h-24 bg-gradient-to-b from-foreground to-background'>
              <div className='absolute inset-0 bg-black/10'></div>
            </div>

            {/* Profile Section */}
            <div className='relative px-6 pb-4'>
              {/* Avatar positioned to overlap cover */}
              <div className='flex justify-center -mt-12 mb-4'>
                <div className='relative group'>
                  <Avatar className='h-24 w-24 border-4 border-white shadow-lg'>
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      className='object-cover'
                    />
                    <AvatarFallback className='text-2xl font-semibold bg-white'>
                      {user.initials ? user.initials : 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Profile Picture Actions */}
                  <div className='absolute -bottom-1 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <div className='flex gap-1 justify-between w-full'>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-7 w-7 p-0 rounded-full shadow-md border border-white bg-foreground text-background'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPicture}
                        title='Upload new picture'
                      >
                        {isUploadingPicture ? (
                          <Loader2 className='h-3 w-3 animate-spin' />
                        ) : (
                          <Camera className='h-3 w-3' />
                        )}
                      </Button>

                      {user.avatar && (
                        <Button
                          size='sm'
                          variant='destructive'
                          className='h-7 w-7 p-0 rounded-full shadow-md border border-white'
                          onClick={handleDeleteProfilePicture}
                          disabled={isDeletingPicture}
                          title='Remove picture'
                        >
                          {isDeletingPicture ? (
                            <Loader2 className='h-3 w-3 animate-spin' />
                          ) : (
                            <Trash2 className='h-3 w-3' />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    className='hidden'
                  />
                </div>
              </div>

              {/* Profile Picture Messages */}
              {pictureError && (
                <Alert className='border-red-200 bg-red-50 mb-4'>
                  <AlertDescription className='text-red-700 text-sm'>
                    {pictureError}
                  </AlertDescription>
                </Alert>
              )}

              {pictureSuccess && (
                <Alert className='border-green-200 bg-green-50 mb-4'>
                  <AlertDescription className='text-green-700 text-sm'>
                    {pictureSuccess}
                  </AlertDescription>
                </Alert>
              )}

              {/* User Info */}
              <div className='text-center mb-6'>
                <h2 className='text-xl font-bold text-gray-900 mb-1'>
                  {user.name}
                </h2>
                <p className='text-sm text-gray-600 mb-3'>{user.email}</p>

                <div className='flex justify-center mb-4'>
                  <Badge
                    variant={getRoleBadgeVariant(user.role)}
                    className='text-sm px-3 py-1'
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* User Details */}
              <div className='space-y-4'>
                <div className='grid grid-cols-1 gap-3'>
                  {/* Account Information */}
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <h4 className='font-medium text-gray-900 mb-3 text-sm'>
                      Account Information
                    </h4>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>User ID</span>
                        <span className='font-medium'>#{user.id}</span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Setup Complete</span>
                        <span className='font-medium'>
                          {user.isSetupComplete ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className='bg-green-50 rounded-lg p-3'>
                    <h4 className='font-medium text-gray-900 mb-3 text-sm'>
                      Contact Information
                    </h4>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-sm'>
                        <Mail className='h-4 w-4 text-gray-500' />
                        <span className='text-gray-600 truncate'>
                          {user.email}
                        </span>
                      </div>
                      {user.whatsappNumber && (
                        <div className='flex items-center gap-2 text-sm'>
                          <Phone className='h-4 w-4 text-gray-500' />
                          <span className='text-gray-600'>
                            {user.whatsappNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Tabs */}
        <div className='lg:col-span-2 h-full'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your profile information and change your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='profile' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='profile'>Profile</TabsTrigger>
                  <TabsTrigger value='password'>Password</TabsTrigger>
                </TabsList>

                <TabsContent value='profile' className='space-y-4'>
                  {profileError && (
                    <Alert className='border-red-200 bg-red-50'>
                      <AlertDescription className='text-red-700'>
                        {profileError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {profileSuccess && (
                    <Alert className='border-green-200 bg-green-50'>
                      <AlertDescription className='text-green-700'>
                        {profileSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className='space-y-4'
                    >
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                          control={profileForm.control}
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
                                    <SelectValue placeholder='Select title' />
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
                              <FormDescription>
                                Optional title for your profile
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className='md:col-span-2' />

                        <FormField
                          control={profileForm.control}
                          name='first_name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Enter your first name'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name='last_name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Enter your last name'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name='whatsapp_number'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Enter your WhatsApp number'
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Optional: Add your WhatsApp number for direct
                                communication
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type='submit'
                        disabled={isUpdatingProfile}
                        className='w-full md:w-auto'
                      >
                        {isUpdatingProfile && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        Update Profile
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value='password' className='space-y-4'>
                  {passwordError && (
                    <Alert className='border-red-200 bg-red-50'>
                      <AlertDescription className='text-red-700'>
                        {passwordError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert className='border-green-200 bg-green-50'>
                      <AlertDescription className='text-green-700'>
                        {passwordSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className='space-y-4'
                    >
                      <FormField
                        control={passwordForm.control}
                        name='current_password'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <PasswordInput
                                placeholder='Enter your current password'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name='new_password'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <PasswordInput
                                placeholder='Enter your new password'
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 8 characters long
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name='confirm_password'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <PasswordInput
                                placeholder='Confirm your new password'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type='submit'
                        disabled={isUpdatingPassword}
                        className='w-full md:w-auto'
                      >
                        {isUpdatingPassword && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        Change Password
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
