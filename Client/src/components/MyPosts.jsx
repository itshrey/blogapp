import { Modal, Table, Button, Badge, Spinner, Tooltip } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaEye, FaEdit, FaTrash, FaChartLine } from 'react-icons/fa';
import moment from 'moment';

export default function MyPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [postIdToDelete, setPostIdToDelete] = useState('');
  const [loading, setLoading] = useState({
    posts: false,
    delete: false
  });
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalComments: 0,
    totalLikes: 0
  });

  useEffect(() => {
    const fetchUserPosts = async () => {
      setLoading(prev => ({ ...prev, posts: true }));
      setError(null);
      try {
        const res = await fetch(`/api/post/user/${currentUser._id}?limit=9`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        const data = await res.json();

        if (res.ok) {
          setPosts(data.posts);
          if (data.posts.length < 9) {
            setShowMore(false);
          }
          // Calculate total stats
          const calculatedStats = data.posts.reduce((acc, post) => {
            return {
              totalViews: acc.totalViews + (post.views || 0),
              totalComments: acc.totalComments + (post.commentCount || 0),
              totalLikes: acc.totalLikes + (post.likesCount || 0)
            };
          }, { totalViews: 0, totalComments: 0, totalLikes: 0 });

          setStats(calculatedStats);
        } else {
          setError(data.message || 'Failed to fetch your posts');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(prev => ({ ...prev, posts: false }));
      }
    };

    if (currentUser?.isVerified) {
      fetchUserPosts();
    }
  }, [currentUser._id, currentUser?.isVerified]);

  const handleDeletePost = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const res = await fetch(`/api/post/deletepost/${postIdToDelete}/${currentUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setPosts(prev => prev.filter(post => post._id !== postIdToDelete));
        setShowModal(false);
      } else {
        setError(data.message || 'Failed to delete post');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleShowMore = async () => {
    const startIndex = posts.length;
    setLoading(prev => ({ ...prev, posts: true }));
    try {
      const res = await fetch(`/api/post/user/${currentUser._id}?startIndex=${startIndex}&limit=9`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setPosts(prev => [...prev, ...data.posts]);
        if (data.posts.length < 9) {
          setShowMore(false);
        }
      } else {
        setError(data.message || 'Failed to load more posts');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  if (!currentUser?.isVerified) {
    return (
      <div className='flex flex-col justify-center items-center h-96'>
        <p className='text-gray-600 dark:text-gray-400 text-xl mb-4'>
          You need to be a verified user to view your posts
        </p>
        <Button onClick={() => navigate('/verify-account')} gradientDuoTone='purpleToPink'>
          Verify Account
        </Button>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      <h1 className='text-2xl font-bold text-center my-6 text-gray-800 dark:text-white'>My Posts</h1>
      
      {error && (
        <div className='mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg'>
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 dark:text-gray-400'>Total Views</p>
              <p className='text-2xl font-semibold'>{stats.totalViews}</p>
            </div>
            <FaEye className='text-blue-500 text-2xl' />
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 dark:text-gray-400'>Total Comments</p>
              <p className='text-2xl font-semibold'>{stats.totalComments}</p>
            </div>
            <FaChartLine className='text-green-500 text-2xl' />
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 dark:text-gray-400'>Total Likes</p>
              <p className='text-2xl font-semibold'>{stats.totalLikes}</p>
            </div>
            <FaChartLine className='text-purple-500 text-2xl' />
          </div>
        </div>
      </div>

      <div className='flex justify-end mb-4'>
        <Button onClick={() => navigate('/create-post')} gradientDuoTone='purpleToBlue'>
          Create New Post
        </Button>
      </div>

      {loading.posts && posts.length === 0 ? (
        <div className='flex justify-center items-center h-64'>
          <Spinner size='xl' />
        </div>
      ) : posts.length > 0 ? (
        <>
          <Table hoverable className='shadow-md'>
            <Table.Head>
              <Table.HeadCell>Date</Table.HeadCell>
              <Table.HeadCell>Post</Table.HeadCell>
              <Table.HeadCell>Category</Table.HeadCell>
              <Table.HeadCell>Stats</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className='divide-y'>
              {posts.map((post) => (
                <Table.Row key={post._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                  <Table.Cell>
                    <Tooltip content={new Date(post.updatedAt).toLocaleString()}>
                      <span>{moment(post.updatedAt).fromNow()}</span>
                    </Tooltip>
                  </Table.Cell>
                  <Table.Cell>
                    <div className='flex items-center gap-3'>
                      <img
                        src={post.image}
                        alt={post.title}
                        className='w-16 h-10 object-cover rounded'
                        onError={(e) => {
                          e.target.src = '';
                        }}
                      />
                      <Link
                        to={`/post/${post.slug}`}
                        className='font-medium text-gray-900 dark:text-white hover:underline'
                      >
                        {post.title}
                      </Link>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color='info' className='w-fit'>
                      {post.category}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className='flex gap-2 text-xs'>
                      <span className='flex items-center gap-1'>
                        <FaEye className='text-blue-500' /> {post.views || 0}
                      </span>
                      <span className='flex items-center gap-1'>
                        <FaChartLine className='text-green-500' /> {post.commentCount || 0}
                      </span>
                      <span className='flex items-center gap-1'>
                        <FaChartLine className='text-purple-500' /> {post.likesCount || 0}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className='flex gap-2'>
                      <Tooltip content='Edit post'>
                        <Button
                          size='xs'
                          gradientDuoTone='purpleToBlue'
                          onClick={() => navigate(`/update-post/${post._id}`)}
                        >
                          <FaEdit />
                        </Button>
                      </Tooltip>
                      <Tooltip content='Delete post'>
                        <Button
                          size='xs'
                          gradientDuoTone='pinkToOrange'
                          onClick={() => {
                            setPostIdToDelete(post._id);
                            setShowModal(true);
                          }}
                        >
                          <FaTrash />
                        </Button>
                      </Tooltip>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {showMore && (
            <button
              onClick={handleShowMore}
              disabled={loading.posts}
              className='w-full text-teal-500 self-center text-sm py-7 flex items-center justify-center gap-2'
            >
              {loading.posts ? (
                <>
                  <Spinner size='sm' />
                  Loading...
                </>
              ) : (
                'Show More'
              )}
            </button>
          )}
        </>
      ) : (
        <div className='flex flex-col items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow'>
          <p className='text-center text-gray-600 dark:text-gray-400 mb-4'>
            You haven't created any posts yet
          </p>
          <Button onClick={() => navigate('/create-post')} gradientDuoTone='purpleToBlue'>
            Create Your First Post
          </Button>
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mx-auto mb-4' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this post?
            </h3>
            <div className='flex justify-center gap-5'>
              <Button
                color='failure'
                onClick={handleDeletePost}
                disabled={loading.delete}
              >
                {loading.delete ? (
                  <>
                    <Spinner size='sm' className='mr-2' />
                    Deleting...
                  </>
                ) : (
                  'Yes, delete it'
                )}
              </Button>
              <Button
                color='gray'
                onClick={() => setShowModal(false)}
                disabled={loading.delete}
              >
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}