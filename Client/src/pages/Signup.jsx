import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import React, { useState } from 'react'
import {Link, useNavigate} from 'react-router-dom'
export default function Signup() {
  const [formData,setFormData]=useState({});
  const [errorMessage,setErrorMessage]=useState(null);
  const [loading,setLoading]=useState(false);
  const navigate= useNavigate();
  const changeHandler=(e)=>{
    setFormData({...formData, [e.target.id]:e.target.value.trim()
    });
  };
  {/**{ ...formData, [e.target.id]: e.target.value }:
    ...formData: This spreads out the current formData state, creating a shallow copy of the current state.
    [e.target.id]: e.target.value: This updates the state by adding a new key-value pair (or updating an existing one) where the key is the id of the form field, and the value is what the user typed.
    Example: If formData is { username: 'John' } and the user types "Doe" into an input field with id="lastName", the state will update to { username: 'John', lastName: 'Doe' }. */}



  {/**Purpose: The submitHandler function is responsible for handling form submissions. When the form is submitted, it prevents the default page refresh, gathers the form data (formData), and sends it to the server using a POST request to the /api/auth/sign-up endpoint. Inside the fetch call:
    '/api/auth/sign-up': This is the URL to which the request is being sent. In this case, it's a relative URL to the server's /api/auth/sign-up endpoint, which is likely responsible for handling user sign-ups.
    method: 'POST': This indicates that the HTTP method used for the request is POST, meaning that the request is intended to submit data to the server (as opposed to GET, which would retrieve data).
    headers: { 'Content-Type': 'application/json' }: This sets the request headers. The Content-Type header is set to application/json, indicating that the body of the request contains JSON data.
    body: JSON.stringify(formData): This is the data being sent to the server. formData is converted to a JSON string using JSON.stringify(), making it suitable for transmission as the body of the POST request.*/}


    const submitHandler = async (e) => {
      e.preventDefault();
      if(!formData.username||!formData.email||!formData.password){
        return setErrorMessage('Please fill all the fields.')
      }
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
    
        // Check if the response is not empty and is in JSON format
        
        const data = await res.json(); // Attempt to parse JSON
        if(data.success===false){
          return setErrorMessage(data.message);
        }
        setLoading(false);
        if(res.ok){
          navigate('/sign-in');
        }
        
      } catch (error) {
        setErrorMessage(error.message);
        setLoading(false);
      }
    };
    
  return (
    <div className='min-h-screen mt-20'>
      <div className='flex gap-5 p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center'>{/** mx-auto
                Description: This class centers the div horizontally within its parent container.
                Effect: The div will have equal margins on the left and right (auto), centering it horizontally on the page. */}

        {/* left */}
        <div className='flex-1'>
        <Link to='/' className='font-bold dark:text-white text-4xl'>
        <span className='px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>Inspire</span>
        Hub
        </Link>
        <p className='text-sm mt-5'> Join our community and start your journey with us. Sign up to explore and share inspiring content.</p>
      
        </div>
        {/* right */}
        <div className='flex-1'>
          <form className='flex flex-col gap-4' onSubmit={submitHandler}>
            <div >
              <Label value='Your username' />
              <TextInput type='text' placeholder='Username' id='username' onChange={changeHandler}/>
            </div>
            <div >  
              <Label value='Your email' />
              <TextInput type='email' placeholder='Email' id='email' onChange={changeHandler}/>
            </div>
            <div >
              <Label value='Your password' />
              <TextInput type='password' placeholder='Password' id='password' onChange={changeHandler}/>
            </div>
            <Button gradientDuoTone='purpleToPink' type='submit' disabled={loading}>{
              loading ? (
                <>
                <Spinner size='sm'/>
                <span className='pl-3'>Loading..</span>
                </>
              ) : 'Sign Up'
            }
            </Button>
          </form>
          <div className='flex gap-2 text-sm mt-5'>
            <span>Have an account?</span>
            <Link to='/sign-in' className='text-blue-500'>Sign In</Link>
          </div>
          {
            errorMessage &&(
            <Alert className='mt-5' color='failure'>
            {errorMessage}
            </Alert>
            )
          
          }
        </div>
    </div>
  </div>
  )
}
