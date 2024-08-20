import React from 'react';
import { Sidebar } from 'flowbite-react';
import { HiArrowSmRight, HiUser } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signoutSuccess } from '../redux/user/userSlice';


export default function DashSidebar() {
    const dispatch= useDispatch();
    const location = useLocation(); // Access the current location object, which includes the URL and its parts.
    const [tab, setTab] = useState(''); // State to store the current tab value, initially set to an empty string.
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
    useEffect(() => {
      // The useEffect hook runs when the component mounts or when location.search changes.
      const urlParams = new URLSearchParams(location.search);
      // Parse the query string from the URL (e.g., '?tab=settings') into an object for easy access to the parameters.
      
      const tabFromUrl = urlParams.get('tab');
      // Retrieve the value associated with the 'tab' parameter (e.g., 'settings').
      
      if(tabFromUrl){
        setTab(tabFromUrl);
      } // Log the retrieved tab value to the console for debugging purposes.
    }, [location.search]);
    // The effect will re-run whenever the query string (location.search) changes.
  
  return (
    <Sidebar className='w-full md:w-56'>
      <Sidebar.ItemGroup>
        <Link to='/dashboard?tab=profile'>
            <Sidebar.Item active={tab === 'profile'} icon={HiUser} label="User" labelColor="dark" as='div'>
            Profile
            </Sidebar.Item>
        </Link>
        <Sidebar.Item icon={HiArrowSmRight} className='cursor-pointer' onClick={handleSignOut}>
          Sign Out
        </Sidebar.Item>
      </Sidebar.ItemGroup>
    </Sidebar>
  );
}
