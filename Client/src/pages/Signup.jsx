import { Alert, Button, Label, Spinner, TextInput, Badge } from 'flowbite-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Oauth from '../components/Oauth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const changeHandler = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value.trim() }));
    
    // Calculate password strength in real-time
    if (id === 'password') {
      let strength = 0;
      if (value.length >= 7) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[\W_]/.test(value)) strength += 1;
      if (/\d/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate all fields are filled
    if (!formData.username || !formData.email || !formData.password) {
      return setErrorMessage('All fields are required');
    }

    // Validate username
    if (formData.username.length < 3 || formData.username.length > 20) {
      return setErrorMessage('Username must be between 3-20 characters');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setErrorMessage('Please enter a valid email address');
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_])(?=.*\d).{7,15}$/;
    if (!passwordRegex.test(formData.password)) {
      return setErrorMessage('Password must be 7-15 characters with 1 uppercase, 1 number, and 1 special character');
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          activityScore: 10 // Initial score for signing up
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Redirect to sign-in with success message
      navigate('/sign-in', { 
        state: { 
          registrationSuccess: true,
          message: 'Account created successfully! Please sign in.' 
        } 
      });
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength) {
      case 1: return 'red';
      case 2: return 'yellow';
      case 3: return 'blue';
      case 4: return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='flex gap-5 p-3 max-w-5xl w-full mx-auto flex-col md:flex-row md:items-center'>
        {/* Left Section */}
        <div className='flex-1 text-center md:text-left'>
          <Link to='/' className='font-bold dark:text-white text-4xl flex items-center justify-center md:justify-start'>
            <span className='px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white mr-2'>
              Inspire
            </span>
            Hub
          </Link>
          <p className='text-sm mt-5 text-gray-600 dark:text-gray-300'>
            Join our community of creators and enthusiasts. Sign up to access exclusive content and features.
          </p>
          <div className='mt-6 hidden md:block'>
            <Badge color="indigo" className="w-fit mx-auto md:mx-0">
              New accounts get 10 activity points
            </Badge>
          </div>
        </div>

        {/* Right Section */}
        <div className='flex-1 max-w-md w-full'>
          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
            <h2 className='text-2xl font-bold mb-6 text-center'>Create Account</h2>
            
            <form className='flex flex-col gap-4' onSubmit={submitHandler}>
              <div>
                <Label htmlFor='username' value='Username' className='mb-1' />
                <TextInput
                  type='text'
                  placeholder='john_doe'
                  id='username'
                  onChange={changeHandler}
                  minLength="3"
                  maxLength="20"
                  required
                />
              </div>

              <div>
                <Label htmlFor='email' value='Email' className='mb-1' />
                <TextInput
                  type='email'
                  placeholder='name@example.com'
                  id='email'
                  onChange={changeHandler}
                  required
                />
              </div>

              <div>
                <Label htmlFor='password' value='Password' className='mb-1' />
                <div className='relative'>
                  <TextInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    id='password'
                    onChange={changeHandler}
                    minLength="7"
                    maxLength="15"
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-2.5 bottom-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className='mt-2'>
                  <div className='flex items-center gap-2'>
                    <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700`}>
                      <div 
                        className={`h-2.5 rounded-full bg-${getPasswordStrengthColor()}-500`} 
                        style={{ width: `${passwordStrength * 25}%` }}
                      ></div>
                    </div>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    Must contain uppercase, number, and special character
                  </p>
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
                    <span className='ml-2'>Creating account...</span>
                  </>
                ) : (
                  'Sign Up'
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
              <span className='text-gray-600 dark:text-gray-300'>Already have an account? </span>
              <Link to='/sign-in' className='text-blue-600 hover:underline dark:text-blue-400'>
                Sign in
              </Link>
            </div>

            {errorMessage && (
              <Alert color='failure' className='mt-4'>
                {errorMessage}
              </Alert>
            )}
          </div>

          <div className='mt-4 text-center text-xs text-gray-500 dark:text-gray-400'>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}