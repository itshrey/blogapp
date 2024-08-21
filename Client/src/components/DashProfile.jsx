import { Alert, Button, Modal, TextInput } from 'flowbite-react';
import React, { useEffect, useRef, useState } from 'react'
import { useSelector,useDispatch } from 'react-redux';
import {getDownloadURL, getStorage,ref, uploadBytesResumable} from 'firebase/storage'
import { app } from './../firebase';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { updateFailure,signoutSuccess,updateStart,updateSuccess,deleteUserError,deleteUserStart,deleteUserSuccess } from '../redux/user/userSlice';
import {HiOutlineExclamationCircle} from 'react-icons/hi';
import {Link} from 'react-router-dom'
export default function DashProfile() {
    const {currentUser,error,loading} = useSelector(state=>state.user);
    const [imageFile,setImageFile]= useState(null);
    const [imageFileUrl,setImageFileUrl]= useState(null);
    const [imageProgress, setImageProgress] = useState(null);
    const [imageError, setImageError] = useState(null);
    const [formData,setFormData]=useState({});
    const [imageUpload,setImageUpload] = useState(false)
    const [updateUserSuccess,setUpdateUserSuccess] = useState(null)
    const [updateUserError,setUpdateUserError] = useState(null)
    const [showModal,setShowModal] = useState(false);
    const dispatch=useDispatch();
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
      setImageUpload(true);
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
          setImageUpload(false);
          
        },
        ()=>{
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
            setImageFileUrl(downloadURL);
            setImageUpload(false);
            setFormData({...formData, profilePicture:downloadURL})
          });
         
        }
      );
    };

    useEffect(()=>{
      if(imageFile){
        uploadImage();
      }
    },[imageFile])

  const handleChange= (e)=>{
    setFormData({...formData,[e.target.id]:e.target.value})
  }

  const handleSubmit= async (e)=>{
   e.preventDefault() ;
   setUpdateUserError(null);
   setUpdateUserSuccess(null);
   if(Object.keys(formData).length === 0 ){
    setUpdateUserError('No changes made');
    return;
   }
   if(imageUpload){
    setUpdateUserError('Please wait for image to upload');
    return;
   }
   try{
    dispatch(updateStart());
    console.log(JSON.stringify(formData));
    const res=await fetch(`/api/user/update/${currentUser._id}`,{
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
      },
      body: JSON.stringify(formData)
    });
    const data= await res.json();
    if(!res.ok){
      dispatch(updateFailure(data.message));
      setUpdateUserError(data.message);
    }else{
      dispatch(updateSuccess(data));
      setUpdateUserSuccess('User Profile Updated Successfully !!');
    }
   }catch(error){
      dispatch(updateFailure(error.message));
      setUpdateUserError(error.message);
   }

  }

  const handleDeleteUser = async (e)=>{
    setShowModal(false);
    try {
      dispatch(deleteUserStart());
      const res= await fetch(`/api/user/delete/${currentUser._id}`,{
        method:'DELETE',
      });
      const data =await res.json();
      if(!res.ok){
        dispatch(deleteUserError(data.message))
      }else{
        dispatch(deleteUserSuccess(data));
      }
    } catch (error) {
      dispatch(deleteUserError(error.message));
    }
  } 

  const handleSignOut = async(e)=>{
    try {
      const res= await fetch('/api/user/signout',{
        method:'POST',
      });
      const data = await res.json();
      if(!res.ok){
        console.log(data.message);
      }else{
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <div className='max-w-lg mx-auto p-3 w-full'>
        <h1 className='my-7 text-center font-semibold text-3xl'>Profile</h1>
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
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
            < TextInput type='text' id='username' placeholder='username' defaultValue={currentUser.username}  onChange={handleChange}/>
            < TextInput type='email' id='email' placeholder='Email' defaultValue={currentUser.email}  onChange={handleChange}/>
            < TextInput type='password' id='password' placeholder='password' onChange={handleChange} />
            <Button type='submit' gradientDuoTone='purpleToBlue' outline disabled={loading || imageUpload}>
              {loading? 'Loading...' :'Update'}
            </Button>
            {
              currentUser.isAdmin && (
                <Link to={'/create-post'}>
                  <Button type='button' gradientDuoTone='purpleToPink' className='w-full'>
                    Create Post
                  </Button>
                </Link>
              )
            }
        </form> 
        <div className='text-red-500 flex justify-between mt-5'>
          <span className='cursor-pointer' onClick={()=>{setShowModal(true)}}>Delete Account</span>
          <span className='cursor-pointer' onClick={handleSignOut}>Sign Out</span>

        </div>
        {updateUserSuccess && (
          <Alert color='success' className='mt-5'>{updateUserSuccess}</Alert>
        )}
        {updateUserError && (
          <Alert color='failure' className='mt-5'>{updateUserError}</Alert>
        )}
        <Modal show={showModal} onClose={()=>setShowModal(false)} popup size='md' >
          <Modal.Header />
          <Modal.Body>
            <div className='text-center'>
              <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mx-auto'/>
              <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this account ?</h3>
              <div className='flex items-center justify-center gap-5'>
                <Button color='failure' onClick={handleDeleteUser}>
                  Yes, I'm sure
                </Button>
                <Button color='gray' onClick={()=>setShowModal(false)}>
                  No,cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
        {error && (
          <Alert color='failure' className='mt-5'>{error}</Alert>
        )}
    </div>
  )
}
