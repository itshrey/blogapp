import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInFailure, signInStart, signInSuccess } from '../redux/user/userSlice';
import Oauth from '../components/Oauth';

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error: errorMessage } = useSelector(state => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return dispatch(signInFailure('All fields are required'));
    }
  
    try {
      dispatch(signInStart());
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.message || 'Sign in failed');
      }
  
      // Dispatch success with normalized payload
      dispatch(signInSuccess({
        user: {
          _id: data._id,
          username: data.username,
          email: data.email,
          profilePicture: data.profilePicture,
          isAdmin: data.isAdmin,
          isVerified: data.isVerified
        },
        activityScore: data.activityScore,
        loginCount: data.loginCount,
        isVerified: data.isVerified
      }));
  
      // Use the data from the response directly for navigation
      if (!data.isVerified && !data.isAdmin) {
        navigate('/dashboard?tab=profile', { 
          state: { 
            showVerificationMessage: true,
            activityScore: data.activityScore,
            loginCount: data.loginCount
          } 
        });
      } else {
        navigate('/');
      }
    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='flex gap-5 p-3 max-w-4xl w-full mx-auto flex-col md:flex-row md:items-center'>
        {/* Left Section */}
        <div className='flex-1 text-center md:text-left'>
          <Link to='/' className='font-bold dark:text-white text-4xl flex items-center justify-center md:justify-start'>
            <span className='px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white mr-2'>
              Inspire
            </span>
            Hub
          </Link>
          <p className='text-sm mt-5 text-gray-600 dark:text-gray-300'>
            Join our community of creators and enthusiasts. Sign in to access exclusive content and features.
          </p>
        </div>

        {/* Right Section */}
        <div className='flex-1 max-w-md mx-auto w-full'>
          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
            <h2 className='text-2xl font-bold mb-6 text-center'>Sign In</h2>
            
            <form className='flex flex-col gap-4' onSubmit={submitHandler}>
              <div>
                <Label htmlFor='email' value='Your email' className='mb-2 block' />
                <TextInput
                  type='email'
                  placeholder='name@example.com'
                  id='email'
                  onChange={changeHandler}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor='password' value='Your password' className='mb-2 block' />
                <div className='relative'>
                  <TextInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    id='password'
                    onChange={changeHandler}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-2.5 bottom-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <Button
                gradientDuoTone='purpleToPink'
                type='submit'
                disabled={loading}
                className='mt-2'
              >
                {loading ? (
                  <>
                    <Spinner size='sm' />
                    <span className='ml-2'>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className='flex items-center my-4'>
                <div className='flex-1 border-t border-gray-300 dark:border-gray-600'></div>
                <span className='px-3 text-gray-500 dark:text-gray-400'>or</span>
                <div className='flex-1 border-t border-gray-300 dark:border-gray-600'></div>
              </div>

              <Oauth />
            </form>

            <div className='mt-6 text-center text-sm'>
              <span className='text-gray-600 dark:text-gray-300'>Don't have an account? </span>
              <div className='flex flex-wrap justify-center gap-2 mt-2'>
                <Link to='/sign-up' className='text-blue-600 hover:underline dark:text-blue-400'>
                  Sign Up as User
                </Link>
                <span className='text-gray-400'>|</span>
                <Link to='/admin/sign-up' className='text-blue-600 hover:underline dark:text-blue-400'>
                  Sign Up as Admin
                </Link>
              </div>
            </div>

            {errorMessage && (
              <Alert color='failure' className='mt-4'>
                {errorMessage}
              </Alert>
            )}
          </div>

          <div className='mt-4 text-center text-xs text-gray-500 dark:text-gray-400'>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}