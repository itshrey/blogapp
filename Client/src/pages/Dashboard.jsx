import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import DashSidebar from '../components/DashSidebar';
import DashProfile from '../components/DashProfile';
import DashPosts from '../components/DashPosts';
import DashUsers from '../components/DashUsers';

export default function Dashboard() {
  const location = useLocation(); // Access the current location object, which includes the URL and its parts.
  const [tab, setTab] = useState(''); // State to store the current tab value, initially set to an empty string.

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
    <div className='min-h-screen flex flex-col md:flex-row'>
      <div className='md:w-56'>
        {/**sidebar */}
        <DashSidebar />
      </div>
      <div className='w-full'>
        {/**profile */} 
        {tab==='profile' && <DashProfile />}
        {/**posts*/}
        {tab==='posts' && <DashPosts />}
        {/**users*/}
        {tab==='users' && <DashUsers />}
      </div>

    </div> // Simple JSX to render the Dashboard component.
  )
}
