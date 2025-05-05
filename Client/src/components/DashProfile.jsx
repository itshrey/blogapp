import { Alert, Button, Modal, TextInput, Progress } from 'flowbite-react';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from './../firebase';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { 
  updateFailure, 
  signoutSuccess, 
  updateStart, 
  updateSuccess, 
  deleteUserError, 
  deleteUserStart, 
  deleteUserSuccess,
  updateActivityScore
} from '../redux/user/userSlice';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function DashProfile() {
  const { currentUser, error, loading, verificationStatus } = useSelector(state => state.user);
  
  console.log('Redux currentUser:', currentUser); // Add this line
  if (!currentUser) {
  return (
    <div className="flex justify-center items-center h-screen">
      <Alert color="failure">User data not available. Please sign in.</Alert>
    </div>
  );
}
  const [imageFile, setImageFile] = useState(null);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const [imageProgress, setImageProgress] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [formData, setFormData] = useState({});
  const [imageUpload, setImageUpload] = useState(false);
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const dispatch = useDispatch();
  const filePickerRef = useRef();

  // Verification thresholds from environment variables
  const requiredActivityScore = import.meta.env.VITE_VERIFY_ACTIVITY_SCORE || 50;
  const requiredLoginCount = import.meta.env.VITE_VERIFY_LOGIN_COUNT || 5;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImageError('File size must be less than 2MB');
        return;
      }
      setImageFile(file);
      setImageFileUrl(URL.createObjectURL(file));
      // Award activity points for uploading profile picture
      dispatch(updateActivityScore(5));
    }
  };

  const uploadImage = async () => {
    setImageUpload(true);
    setImageError(null);
    const storage = getStorage(app);
    const fileName = new Date().getTime() + imageFile.name;
    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(storageRef, imageFile);
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageProgress(progress.toFixed(0));
      },
      (error) => {
        setImageError('Could not upload image');
        setImageProgress(null);
        setImageFile(null);
        setImageFileUrl(null);
        setImageUpload(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageFileUrl(downloadURL);
          setImageUpload(false);
          setFormData({ ...formData, profilePicture: downloadURL });
        });
      }
    );
  };

  useEffect(() => {
    if (imageFile) {
      uploadImage();
    }
  }, [imageFile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);

    try {
      dispatch(updateStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('access_token')}`, // Include JWT token
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      dispatch(updateSuccess(data));
      setUpdateUserSuccess("Profile updated!");
    } catch (error) {
      dispatch(updateFailure(error.message));
      setUpdateUserError(error.message);
    }
  };

  const handleDeleteUser = async () => {
    setShowModal(false);
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Include JWT token for delete request
        }
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(deleteUserError(data.message));
      } else {
        dispatch(deleteUserSuccess(data));
      }
    } catch (error) {
      dispatch(deleteUserError(error.message));
    }
  };


  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/user/signout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // Calculate verification progress
  const activityProgress = Math.min(
    ((verificationStatus?.activityScore || 0) / requiredActivityScore) * 100,
    100
  );
  
  const loginProgress = Math.min(
    ((verificationStatus?.loginCount || 0) / requiredLoginCount) * 100,
    100
  );

  return (
    <div className='max-w-lg mx-auto p-3 w-full'>
      <h1 className='my-7 text-center font-semibold text-3xl'>Profile</h1>
      
      {/* Verification Status Panel */}
      <div className="mb-6">
        {currentUser.isAdmin ? (
          <Alert color="info" className="mb-4">
            <span className="font-bold">Admin Account</span> - You have full privileges
          </Alert>
        ) : verificationStatus?.isVerified ? (
          <Alert color="success" className="mb-4">
            <span className="font-bold">Verified Account</span> - You can create and manage content
          </Alert>
        ) : (
          <div className="space-y-2">
            <Alert color="warning">
              <span className="font-bold">Account Not Verified</span>
            </Alert>
            <div className="text-sm text-gray-600 dark:text-gray-300 p-2 border rounded-lg border-gray-200 dark:border-gray-700">
              <p className="mb-3">Complete these requirements to unlock content creation:</p>
              
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span>Activity Score</span>
                  <span>{verificationStatus?.activityScore || 0}/{requiredActivityScore}</span>
                </div>
                <Progress 
                  progress={activityProgress}
                  color="purple" 
                  size="sm"
                />
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  Earn points by being active (updating profile, posting, commenting)
                </p>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span>Login Count</span>
                  <span>{verificationStatus?.loginCount || 0}/{requiredLoginCount}</span>
                </div>
                <Progress 
                  progress={loginProgress}
                  color="purple" 
                  size="sm"
                />
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  Sign in regularly to increase your count
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-xs">
                <p className="font-semibold">Verified users can:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Create posts and comments</li>
                  <li>Edit and delete their content</li>
                  <li>Access exclusive features</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Update Form */}
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept='image/*' 
          onChange={handleImageChange} 
          ref={filePickerRef} 
          hidden
        />
        
        <div 
          className='relative w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full' 
          onClick={() => filePickerRef.current.click()}
        >
          {imageProgress && (
            <CircularProgressbar 
              value={imageProgress || 0} 
              text={`${imageProgress}%`} 
              strokeWidth={5}
              styles={{
                root: {
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                },
                path: {
                  stroke: `rgba(62,152,199,${imageProgress / 100})`,
                }
              }}
            />
          )}
          <img 
            src={imageFileUrl || currentUser.profilePicture} 
            alt="user" 
            className={`rounded-full w-full h-full border-8 border-[lightgray] object-cover ${
              imageProgress && imageProgress < 100 && 'opacity-60'
            }`}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
        </div>
        
        {imageError && <Alert color='failure'>{imageError}</Alert>}
        
        <TextInput 
          type='text' 
          id='username' 
          placeholder='username' 
          defaultValue={currentUser.username}  
          onChange={handleChange}
        />
        
        <TextInput 
          type='email' 
          id='email' 
          placeholder='Email' 
          defaultValue={currentUser.email}  
          onChange={handleChange}
        />
        
        <TextInput 
          type='password' 
          id='password' 
          placeholder='password' 
          onChange={handleChange} 
        />
        
        <Button 
          type='submit' 
          gradientDuoTone='purpleToBlue' 
          outline 
          disabled={loading || imageUpload}
        >
          {loading ? 'Loading...' : 'Update'}
        </Button>
        
        {/* Show Create Post button only for verified users or admins */}
        {(currentUser.isAdmin || verificationStatus?.isVerified) && (
          <Link to={'/create-post'}>
            <Button type='button' gradientDuoTone='purpleToPink' className='w-full'>
              Create Post
            </Button>
          </Link>
        )}
      </form>
      
      {/* Account Actions */}
      <div className='text-red-500 flex justify-between mt-5'>
        <span 
          className='cursor-pointer hover:underline' 
          onClick={() => setShowModal(true)}
        >
          Delete Account
        </span>
        <span 
          className='cursor-pointer hover:underline' 
          onClick={handleSignOut}
        >
          Sign Out
        </span>
      </div>
      
      {/* Success/Error Messages */}
      {updateUserSuccess && (
        <Alert color='success' className='mt-5'>
          {updateUserSuccess}
        </Alert>
      )}
      
      {updateUserError && (
        <Alert color='failure' className='mt-5'>
          {updateUserError}
        </Alert>
      )}
      
      {error && (
        <Alert color='failure' className='mt-5'>
          {error}
        </Alert>
      )}
      
      {/* Delete Account Confirmation Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mx-auto'/>
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this account?
            </h3>
            <div className='flex items-center justify-center gap-5'>
              <Button color='failure' onClick={handleDeleteUser}>
                Yes, I'm sure
              </Button>
              <Button color='gray' onClick={() => setShowModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}