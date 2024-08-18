import React from 'react'
import { Button } from 'flowbite-react'
import {AiFillGoogleCircle} from 'react-icons/ai'
import {GoogleAuthProvider, signInWithPopup,getAuth} from 'firebase/auth'
import {app} from '../firebase.js'
import {signInSuccess} from '../redux/user/userSlice.js'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
export default function Oauth() {
    const auth=getAuth(app);
    const dispatch=useDispatch()
    const navigate=useNavigate();
    const handleClick = async()=>{
      const provider= new GoogleAuthProvider();
      provider.setCustomParameters({prompt:'select_account'})
      try{
        const results= await signInWithPopup(auth,provider);
        const res = await fetch('/api/auth/google',{
          method: 'POST',
          headers: {'Content-Type': 'application/json' },
          body: JSON.stringify({
            name : results.user.displayName,
            email: results.user.email,
            googlePhotoUrl: results.user.photoURL,
          }),
        });
        const data=await res.json()
        if(res.ok){
          dispatch(signInSuccess(data))
          navigate('/')
        }
      }catch(error){
        console.log(error);
      }
      
    }
  return (
    <Button type='button' gradientDuoTone='pinkToOrange' outline onClick={handleClick}>
        <AiFillGoogleCircle className='w-5 h-6 mr-2'/>
        Continue with Google
    </Button>
  )
}
