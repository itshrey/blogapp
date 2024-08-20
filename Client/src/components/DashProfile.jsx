import { Alert, Button, TextInput } from 'flowbite-react';
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux';
import {getDownloadURL, getStorage,ref, uploadBytesResumable} from 'firebase/storage'
import { app } from './../firebase';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
export default function DashProfile() {
    const {currentUser} = useSelector(state=>state.user);
    const [imageFile,setImageFile]= useState(null);
    const [imageFileUrl,setImageFileUrl]= useState(null);
    const [imageProgress, setImageProgress] = useState(null);
    const [imageError, setImageError] = useState(null);
    
    const filePickerRef=useRef();
    const handleImageChannge =(e)=>{
      const file=e.target.files[0];
      if(file){
        setImageFile(file);
        setImageFileUrl(URL.createObjectURL(file));
      }
      
    };

    const uploadImage = async()=>{
      //change in firebase storage
      setImageError(null);
      const storage= getStorage(app);
      const fileName= new Date().getTime()+imageFile.name;
      const storageRef= ref(storage,fileName);

      const uploadTask= uploadBytesResumable(storageRef,imageFile);
      uploadTask.on(
        'state_changed',
        (snapshot)=>{
          const progress= (snapshot.bytesTransferred/snapshot.totalBytes)*100;
          setImageProgress(progress.toFixed(0));//remove decimal
        },
        (error)=>{
          setImageError('Could Not Upload Image(File must be less than 2MB)');
          setImageProgress(null);
          setImageFile(null);
          setImageFileUrl(null);
        },
        ()=>{
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
            setImageFileUrl(downloadURL);
          });
         
        }
      );
    };

    useEffect(()=>{
      if(imageFile){
        uploadImage();
      }
    },[imageFile])


  return (
    <div className='max-w-lg mx-auto p-3 w-full'>
        <h1 className='my-7 text-center font-semibold text-3xl'>Profile</h1>
        <form className='flex flex-col gap-4'>
            <input type="file" accept='image/*' onChange={handleImageChannge} ref={filePickerRef} hidden/>
            <div className='relative w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full' onClick={()=>filePickerRef.current.click()}>
              {imageProgress && (<CircularProgressbar value={imageProgress || 0} text={`${imageProgress}%`} 
              strokeWidth={5}
              styles={{
                root:{
                  width:'100%',
                  height:'100%',
                  position:'absolute',
                  top:0,
                  left:0,
                },
                path:{
                  stroke:`rgba(62,152,199,${imageProgress/100})`,
                }
              }}
              />)}
              <img src={imageFileUrl||currentUser.profilePicture} alt="user" className={`rounded-full w-full h-full border-8 border-[lightgray] object-cover ${imageProgress && imageProgress<100 && 'opacity-60'}`}/>
            </div>
            
            {imageError && <Alert color='failure'>{imageError}</Alert>}
            < TextInput type='text' id='username' placeholder='username' defaultValue={currentUser.username}/>
            < TextInput type='email' id='email' placeholder='Email' defaultValue={currentUser.email} />
            < TextInput type='password' id='password' placeholder='password' />
            <Button type='submit' gradientDuoTone='purpleToBlue' outline>
              Update
            </Button>
        </form> 
        <div className='text-red-500 flex justify-between mt-5'>
          <span className='cursor-pointer'>Delete Account</span>
          <span className='cursor-pointer'>Sign Out</span>

        </div>
    </div>
  )
}
