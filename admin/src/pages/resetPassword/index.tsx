import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
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
import axiosInstance from '../../axios';
import { HttpError } from '@refinedev/core';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Get uid and token from URL parameters
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    // Validate that we have the required parameters
    if (!uid || !token) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsCheckingToken(false);
      return;
    }

    // For now, we'll assume the token is valid if we have both uid and token
    // In a real implementation, you might want to validate the token with the backend
    setIsValidToken(true);
    setIsCheckingToken(false);
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(`/auth/reset-password/`, {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.status === 200) {
        setSuccess(true);
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.log(error);
      setIsLoading(false);
      setError(
        (error as HttpError)?.response?.data?.message ||
          (error as HttpError)?.message ||
          'Failed to reset password. Please try again.'
      );
    }
  };

  if (isCheckingToken) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
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

          <Card className='w-full shadow-xl border-0'>
            <CardContent className='p-6'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                <p className='text-gray-600'>Validating reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
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

          <Card className='w-full shadow-xl border-0'>
            <CardHeader className='space-y-1 text-center'>
              <CardTitle className='text-2xl font-semibold text-red-600'>
                Invalid Reset Link
              </CardTitle>
              <CardDescription className='text-gray-600'>
                The password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Alert className='border-red-200 bg-red-50'>
                <AlertDescription className='text-red-700'>
                  {error}
                </AlertDescription>
              </Alert>

              <div className='text-center space-y-4'>
                <Button
                  onClick={() => navigate('/forgot-password')}
                  className='w-full bg-primary hover:bg-primary/80 text-white font-medium'
                >
                  Request New Reset Link
                </Button>

                <Link
                  to='/login'
                  className='text-sm text-primary hover:text-primary/80 hover:underline'
                >
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

        {/* Reset Password Card */}
        <Card className='w-full shadow-xl border-0'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='text-2xl font-semibold'>
              Set New Password
            </CardTitle>
            <CardDescription className='text-gray-600'>
              Enter your new password below
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
                  Password has been reset successfully! You can now sign in with
                  your new password.
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='newPassword'
                    className='text-sm font-medium text-gray-700'
                  >
                    New Password
                  </Label>
                  <PasswordInput
                    id='newPassword'
                    placeholder='Enter your new password'
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className='h-11 focus:ring-2 focus:ring-primary focus:border-transparent'
                    required
                    minLength={8}
                  />
                  <p className='text-xs text-gray-500'>
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='confirmPassword'
                    className='text-sm font-medium text-gray-700'
                  >
                    Confirm New Password
                  </Label>
                  <PasswordInput
                    id='confirmPassword'
                    placeholder='Confirm your new password'
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className='h-11 focus:ring-2 focus:ring-primary focus:border-transparent'
                    required
                  />
                </div>

                <Button
                  type='submit'
                  className='w-full h-11 bg-primary hover:bg-primary/80 text-white font-medium transition-colors'
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

            {success && (
              <div className='text-center'>
                <Button
                  onClick={() => navigate('/login')}
                  className='w-full bg-primary hover:bg-primary/80 text-white font-medium'
                >
                  Go to Sign In
                </Button>
              </div>
            )}

            {!success && (
              <div className='text-center'>
                <Link
                  to='/login'
                  className='text-sm text-primary hover:text-primary/80 hover:underline'
                >
                  Back to Sign In
                </Link>
              </div>
            )}
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
