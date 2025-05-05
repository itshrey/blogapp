import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert, Spinner } from 'flowbite-react';
import DashSidebar from '../components/DashSidebar';
import DashProfile from '../components/DashProfile';
import DashPosts from '../components/DashPosts';
import DashUsers from '../components/DashUsers';
import DashComments from '../components/DashComments';
import DashboardComp from '../components/DashboardComp';
import MyPosts from '../components/MyPosts'; // Import MyPosts component

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.user);
  const [tab, setTab] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');

    // Set default tab to profile if none specified
    if (!tabFromUrl) {
      navigate('/dashboard?tab=profile', { replace: true });
      return;
    }

    // Redirect unauthorized users trying to access admin tabs
    if (['users', 'comments', 'dash'].includes(tabFromUrl)) {
      if (!currentUser?.isAdmin) {
        navigate('/dashboard?tab=profile', { replace: true });
        return;
      }
    }

    // Redirect unverified users trying to access posts
    if (tabFromUrl === 'posts' && !currentUser?.isVerified && !currentUser?.isAdmin) {
      navigate('/dashboard?tab=profile', { replace: true });
      return;
    }

    setTab(tabFromUrl);
    setLoading(false);
  }, [location.search, currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="md:w-56">
        <DashSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {!currentUser?.isAdmin && ['users', 'comments', 'dash'].includes(tab) ? (
          <Alert color="failure">
            Admin privileges required to access this section
          </Alert>
        ) : tab === 'posts' && !currentUser?.isVerified && !currentUser?.isAdmin ? (
          <Alert color="failure">
            Account verification required to manage posts
          </Alert>
        ) : (
          <>
            {tab === 'profile' && <DashProfile />}
            {tab === 'posts' && (currentUser?.isVerified && !currentUser?.isAdmin) && <MyPosts />}
            {tab === 'posts' && (currentUser?.isVerified && currentUser?.isAdmin) && <DashPosts />}
            {tab === 'users' && currentUser?.isAdmin && <DashUsers />}
            {tab === 'comments' && currentUser?.isAdmin && <DashComments />}
            {tab === 'dash' && currentUser?.isAdmin && <DashboardComp />}
          </>
        )}
      </div>
    </div>
  );
}