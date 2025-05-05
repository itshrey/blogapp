import React from 'react';
import { Sidebar, Tooltip } from 'flowbite-react';
import { 
  HiArrowSmRight, 
  HiChartPie, 
  HiDocumentText, 
  HiOutlineAnnotation, 
  HiOutlineUserGroup, 
  HiUser,
  HiOutlineExclamation 
} from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signoutSuccess } from '../redux/user/userSlice';

export default function DashSidebar() {
    const { currentUser } = useSelector(state => state.user);
    const dispatch = useDispatch();
    const location = useLocation();
    const [tab, setTab] = useState('');
    const verificationStatus = useSelector(state => state.user.verificationStatus);

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

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tabFromUrl = urlParams.get('tab');
        if (tabFromUrl) {
            setTab(tabFromUrl);
        }
    }, [location.search]);

    // Check if user can create posts (admin or verified)
    const canCreatePosts = currentUser?.isAdmin || verificationStatus?.isVerified;

    return (
        <Sidebar className='w-full md:w-56'>
            <Sidebar.Items>
                <Sidebar.ItemGroup className='flex flex-col gap-1'>
                    {/* Dashboard Link (Admin only) */}
                    {currentUser?.isAdmin && (
                        <Link to='/dashboard?tab=dash'>
                            <Sidebar.Item active={tab === 'dash' || !tab} icon={HiChartPie} as='div'>
                                Dashboard
                            </Sidebar.Item>
                        </Link>
                    )}

                    {/* Profile Link */}
                    <Link to='/dashboard?tab=profile'>
                        <Sidebar.Item 
                            active={tab === 'profile'} 
                            icon={HiUser} 
                            label={currentUser?.isAdmin ? 'Admin' : 'User'} 
                            labelColor="dark" 
                            as='div'
                        >
                            Profile
                        </Sidebar.Item>
                    </Link>

                    {/* Posts Link */}
                    {canCreatePosts ? (
                        <Link to='/dashboard?tab=posts'>
                            <Sidebar.Item active={tab === 'posts'} icon={HiDocumentText} as='div'>
                                Posts
                            </Sidebar.Item>
                        </Link>
                    ) : (
                        <Tooltip 
                            content="Verify your account to create posts" 
                            placement="right"
                            style="light"
                        >
                            <div className="opacity-50 cursor-not-allowed">
                                <Sidebar.Item 
                                    icon={HiDocumentText} 
                                    as='div'
                                >
                                    <div className="flex items-center gap-2">
                                        Posts
                                        <HiOutlineExclamation className="text-yellow-500" />
                                    </div>
                                </Sidebar.Item>
                            </div>
                        </Tooltip>
                    )}

                    {/* Users Link (Admin only) */}
                    {currentUser?.isAdmin && (
                        <Link to='/dashboard?tab=users'>
                            <Sidebar.Item active={tab === 'users'} icon={HiOutlineUserGroup} as='div'>
                                Users
                            </Sidebar.Item>
                        </Link>
                    )}

                    {/* Comments Link (Admin only) */}
                    {currentUser?.isAdmin && (
                        <Link to='/dashboard?tab=comments'>
                            <Sidebar.Item active={tab === 'comments'} icon={HiOutlineAnnotation} as='div'>
                                Comments
                            </Sidebar.Item>
                        </Link>
                    )}

                    {/* Sign Out */}
                    <Sidebar.Item 
                        icon={HiArrowSmRight} 
                        className='cursor-pointer' 
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </Sidebar.Item>
                </Sidebar.ItemGroup>
            </Sidebar.Items>

            {/* Verification Status Indicator */}
            {!currentUser?.isAdmin && !verificationStatus?.isVerified && (
                <div className="p-4 mt-auto text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                    <p className="font-medium">Verification Progress</p>
                    <div className="mt-2 space-y-1">
                        <div>
                            <span>Activity: {verificationStatus?.activityScore || 0}/50</span>
                        </div>
                        <div>
                            <span>Logins: {verificationStatus?.loginCount || 0}/5</span>
                        </div>
                    </div>
                </div>
            )}
        </Sidebar>
    );
}