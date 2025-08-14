import { useState } from 'react';
import { useLogin } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { mutate: login } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    login(
      { email, password },
      {
        onSuccess: () => {
          setIsLoading(false);
        },
        onError: (error: any) => {
          setIsLoading(false);
          setError(error?.message || 'Login failed. Please try again.');
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

        {/* Login Card */}
        <Card className='w-full shadow-xl border-0'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='text-2xl font-semibold'>
              Welcome Back
            </CardTitle>
            <CardDescription className='text-gray-600'>
              Sign in to your account to continue
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

              <div className='space-y-2'>
                <Label
                  htmlFor='password'
                  className='text-sm font-medium text-gray-700'
                >
                  Password
                </Label>
                <PasswordInput
                  id='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='h-11 focus:ring-2 focus:ring-primary focus:border-transparent'
                  required
                />
              </div>

              <Button
                type='submit'
                className='w-full h-11 bg-primary hover:bg-primary/80 text-white font-medium transition-colors'
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className='text-center'>
              <Link
                to='/forgot-password'
                className='text-sm text-primary hover:text-primary/80 hover:underline'
              >
                Forgot your password?
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
