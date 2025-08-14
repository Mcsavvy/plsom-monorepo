import { useState } from 'react';
import { useForgotPassword } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutate: forgotPassword } = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    forgotPassword(
      { email },
      {
        onSuccess: () => {
          setIsLoading(false);
          setSuccess(true);
        },
        onError: (error: any) => {
          setIsLoading(false);
          setError(
            error?.message || 'Failed to send reset email. Please try again.'
          );
        },
      }
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='flex justify-center mb-4'>
            <img
              src='/logo.png'
              alt='PLSOM Logo'
              className='h-20 w-auto object-contain'
            />
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Perfect Love School of Ministry
          </h1>
          <p className='text-sm text-gray-500'>
            Administrator & Lecturer Portal
          </p>
        </div>

        {/* Forgot Password Card */}
        <Card className='w-full shadow-xl border-0'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='text-2xl font-semibold'>
              Reset Password
            </CardTitle>
            <CardDescription className='text-gray-600'>
              Enter your email address and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <Alert className='border-red-200 bg-red-50'>
                <AlertDescription className='text-red-700'>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className='border-green-200 bg-green-50'>
                <AlertDescription className='text-green-700'>
                  Password reset link has been sent to your email address.
                  Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='email'
                    className='text-sm font-medium text-gray-700'
                  >
                    Email Address
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='h-11 focus:ring-2 focus:ring-primary focus:border-transparent'
                    required
                  />
                </div>

                <Button
                  type='submit'
                  className='w-full h-11 bg-primary hover:bg-primary/80 text-white font-medium transition-colors'
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            <div className='text-center'>
              <Link
                to='/login'
                className='text-sm text-primary hover:text-primary/80 hover:underline'
              >
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center mt-8 text-sm text-gray-500'>
          <p>© 2024 Perfect Love School of Ministry. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
