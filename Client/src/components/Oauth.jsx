import React from 'react';
import { Button } from 'flowbite-react';
import { AiFillGoogleCircle } from 'react-icons/ai';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { app } from '../firebase.js';
import { signInSuccess } from '../redux/user/userSlice.js';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Oauth component definition
export default function Oauth() {
    // Initialize Firebase authentication object
    const auth = getAuth(app);
    
    // Initialize Redux dispatch function
    const dispatch = useDispatch();
    
    // Initialize navigation function for route redirection
    const navigate = useNavigate();
    
    // Function to handle Google sign-in when the button is clicked
    const handleClick = async () => {
        // Create a new GoogleAuthProvider instance for Google sign-in
        const provider = new GoogleAuthProvider();
        
        // Force the account selection prompt to appear
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        
        try {
            // Open a popup for Google sign-in and wait for the user to complete the process
            const results = await signInWithPopup(auth, provider);
            
            // Send a POST request to your backend with the user's Google account details
            const res = await fetch('/api/auth/google', {
                method: 'POST', // Specify the method as POST
                headers: { 'Content-Type': 'application/json' }, // Indicate that the body is in JSON format
                body: JSON.stringify({
                    name: results.user.displayName, // User's display name
                    email: results.user.email, // User's email address
                    googlePhotoUrl: results.user.photoURL, // User's Google profile picture URL
                }),
            });
            
            // Parse the JSON response from the backend
            const data = await res.json();
            
            // If the response is successful (status code 200), proceed
            if (res.ok) {
                // Dispatch the signInSuccess action to update the Redux store with the user's data
                dispatch(signInSuccess(data));
                
                // Navigate the user to the home page
                navigate('/');
            }
        } catch (error) {
            // If an error occurs during the process, log it to the console
            console.log(error);
        }
    };

    // Render the Google sign-in button with an icon
    return (
        <Button type='button' gradientDuoTone='pinkToOrange' outline onClick={handleClick}>
            <AiFillGoogleCircle className='w-5 h-6 mr-2' />
            Continue with Google
        </Button>
    );
}
