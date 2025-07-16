import React, { useState } from 'react';
import { Button, Alert } from 'flowbite-react';
import { AiFillGoogleCircle } from 'react-icons/ai';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { app } from '../firebase';
import { signInSuccess } from '../redux/user/userSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function Oauth() {
  // All hooks properly called at the top level
  const auth = getAuth(app);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const results = await signInWithPopup(auth, provider);
      
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Activity-Type': 'social-login'
        },
        body: JSON.stringify({
          name: results.user.displayName,
          email: results.user.email || results.user.providerData?.[0]?.email,
          googlePhotoUrl: results.user.photoURL,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Could not authenticate with Google');
      }
      console.log('Google Sign-In Data:', data);
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
      console.error('Google Sign-In Error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        type="button" 
        gradientDuoTone="pinkToOrange" 
        outline 
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          </>
        ) : (
          <span className="flex items-center justify-center">
            <AiFillGoogleCircle className="w-5 h-5 mr-2" />
            Continue with Google
          </span>
        )}
      </Button>
      
      {error && (
        <Alert color="failure" className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}