import React, { useEffect, useState } from 'react';
import { HiOutlineUserGroup, HiArrowNarrowUp, HiAnnotation, HiOutlineDocumentText } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import { Button, Table, Badge, Spinner } from 'flowbite-react';
import { Link } from 'react-router-dom';

export default function DashboardComp() {
    const { currentUser } = useSelector((state) => state.user);
    const [users, setUsers] = useState([]);
    const [comments, setComments] = useState([]);
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        lastMonthComments: 0,
        lastMonthPosts: 0,
        lastMonthUsers: 0
    });
    const [loading, setLoading] = useState({
        users: false,
        posts: false,
        comments: false
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentUser.isAdmin) {
            const fetchData = async () => {
                try {
                    setLoading(prev => ({ ...prev, users: true }));
                    const [usersRes, postsRes, commentsRes] = await Promise.all([
                        fetch('/api/getUsers?limit=5'),
                        fetch('/api/post/getposts?limit=5'),
                        fetch('/api/comment/?limit=5')
                    ]);

                    const usersData = await usersRes.json();
                    const postsData = await postsRes.json();
                    const commentsData = await commentsRes.json();

                    if (usersRes.ok && postsRes.ok && commentsRes.ok) {
                        setUsers(usersData.users);
                        setPosts(postsData.posts);
                        setComments(commentsData.comments);
                        setStats({
                            totalUsers: usersData.totalUsers,
                            totalPosts: postsData.totalPosts,
                            totalComments: commentsData.totalComments,
                            lastMonthUsers: usersData.lastMonthUsers,
                            lastMonthPosts: postsData.lastMonthPosts,
                            lastMonthComments: commentsData.lastMonthComments
                        });
                    } else {
                        setError('Failed to fetch dashboard data');
                    }
                } catch (error) {
                    setError(error.message);
                } finally {
                    setLoading({ users: false, posts: false, comments: false });
                }
            };
            fetchData();
        }
    }, [currentUser]);

    const StatCard = ({ title, value, icon: Icon, lastMonthValue, iconColor }) => (
        <div className='flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md'>
            <div className='flex justify-between'>
                <div>
                    <h3 className='text-gray-500 text-md uppercase'>{title}</h3>
                    <p className='text-2xl'>{value}</p>
                </div>
                <Icon className={`${iconColor} text-white rounded-full p-3 text-5xl shadow-lg`} />
            </div>
            <div className='flex gap-2 text-sm'>
                <span className='text-gray-500 flex items-center'>
                    <HiArrowNarrowUp />
                    {lastMonthValue}
                </span>
                <div className='text-gray-500'>Last Month</div>
            </div>
        </div>
    );

    const DataTable = ({ title, data, columns, seeAllLink, loading }) => (
        <div className='flex flex-col w-full md:w-auto shadow-md p-2 rounded-md dark:bg-gray-800'>
            <div className='flex justify-between p-3 font-semibold text-sm'>
                <h1 className='p-2 text-center'>{title}</h1>
                <Button outline gradientDuoTone='purpleToPink'>
                    <Link to={seeAllLink}>See all</Link>
                </Button>
            </div>
            {loading ? (
                <div className='flex justify-center p-4'>
                    <Spinner size='xl' />
                </div>
            ) : (
                <Table hoverable>
                    <Table.Head>
                        {columns.map((column) => (
                            <Table.HeadCell key={column}>{column}</Table.HeadCell>
                        ))}
                    </Table.Head>
                    <Table.Body className='divide-y'>
                        {data.map((item) => (
                            <Table.Row key={item._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                {columns.map((column) => {
                                    switch (column) {
                                        case 'User Image':
                                            return (
                                                <Table.Cell key={`${item._id}-image`}>
                                                    <img 
                                                        src={item.profilePicture || '/default-profile.png'} 
                                                        alt="user" 
                                                        className='w-10 h-10 rounded-full bg-gray-500 object-cover'
                                                        onError={(e) => {
                                                            e.target.src = '/default-profile.png';
                                                        }}
                                                    />
                                                </Table.Cell>
                                            );
                                        case 'Username':
                                            return (
                                                <Table.Cell key={`${item._id}-username`}>
                                                    <div className='flex items-center gap-2'>
                                                        {item.username}
                                                        {item.isAdmin && (
                                                            <Badge color='failure'>Admin</Badge>
                                                        )}
                                                        {item.isVerified &&
                                                         !item.isAdmin && (
                                                            <Badge color='success'>Verified</Badge>
                                                        )}
                                                    </div>
                                                </Table.Cell>
                                            );
                                        case 'Comment Content':
                                            return (
                                                <Table.Cell key={`${item._id}-content`} className='w-96'>
                                                    <p className='line-clamp-2'>{item.content}</p>
                                                </Table.Cell>
                                            );
                                        case 'Likes':
                                            return (
                                                <Table.Cell key={`${item._id}-likes`}>
                                                    {item.numberOfLikes || 0}
                                                </Table.Cell>
                                            );
                                        case 'Post Image':
                                            return (
                                                <Table.Cell key={`${item._id}-post-image`}>
                                                    <img 
                                                        src={item.image || '/default-post.png'} 
                                                        alt="post" 
                                                        className='w-14 h-10 rounded-md bg-gray-500 object-cover'
                                                        onError={(e) => {
                                                            e.target.src = '/default-post.png';
                                                        }}
                                                    />
                                                </Table.Cell>
                                            );
                                        case 'Post Title':
                                            return (
                                                <Table.Cell key={`${item._id}-title`} className='w-96'>
                                                    {item.title}
                                                </Table.Cell>
                                            );
                                        case 'Category':
                                            return (
                                                <Table.Cell key={`${item._id}-category`} className='w-5'>
                                                    {item.category}
                                                </Table.Cell>
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}
        </div>
    );

    if (!currentUser.isAdmin) {
        return (
            <div className='flex justify-center items-center h-screen'>
                <h1 className='text-2xl font-semibold text-gray-700 dark:text-gray-300'>
                    Admin access required
                </h1>
            </div>
        );
    }

    return (
        <div className='p-3 md:mx-auto'>
            {error && (
                <div className='mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg'>
                    {error}
                </div>
            )}

            <div className='flex-wrap flex gap-4 justify-center'>
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    icon={HiOutlineUserGroup} 
                    lastMonthValue={stats.lastMonthUsers} 
                    iconColor="bg-teal-600" 
                />
                <StatCard 
                    title="Total Comments" 
                    value={stats.totalComments} 
                    icon={HiAnnotation} 
                    lastMonthValue={stats.lastMonthComments} 
                    iconColor="bg-indigo-600" 
                />
                <StatCard 
                    title="Total Posts" 
                    value={stats.totalPosts} 
                    icon={HiOutlineDocumentText} 
                    lastMonthValue={stats.lastMonthPosts} 
                    iconColor="bg-blue-600" 
                />
            </div>

            <div className='flex flex-wrap gap-4 py-3 mx-auto justify-center'>
                <DataTable
                    title="Recent Users"
                    data={users}
                    columns={['User Image', 'Username']}
                    seeAllLink="/dashboard?tab=users"
                    loading={loading.users}
                />
                <DataTable
                    title="Recent Comments"
                    data={comments}
                    columns={['Comment Content', 'Likes']}
                    seeAllLink="/dashboard?tab=comments"
                    loading={loading.comments}
                />
                <DataTable
                    title="Recent Posts"
                    data={posts}
                    columns={['Post Image', 'Post Title', 'Category']}
                    seeAllLink="/dashboard?tab=posts"
                    loading={loading.posts}
                />
            </div>
        </div>
    );
}