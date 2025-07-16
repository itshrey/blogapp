import { Modal, Table, Button, Badge, Spinner, Tooltip } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaEye, FaEdit, FaTrash, FaChartLine, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import moment from 'moment';

export default function DashPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const postsPerPage = 9;

  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUser.isAdmin) return;
      
      setLoading(prev => ({ ...prev, posts: true }));
      setError(null);
      try {
        const startIndex = (currentPage - 1) * postsPerPage;
        const res = await fetch(`/api/post/getposts?startIndex=${startIndex}&limit=${postsPerPage}`);
        const data = await res.json();

        if (res.ok) {
          setPosts(data.posts);
          setTotalPosts(data.totalPosts || 0);
          setTotalPages(Math.ceil((data.totalPosts || 0) / postsPerPage));
          
          // Calculate stats for current page
          const calculatedStats = data.posts.reduce((acc, post) => {
            return {
              totalViews: acc.totalViews + (post.views || 0),
              totalComments: acc.totalComments + (post.commentCount || 0),
              totalLikes: acc.totalLikes + (post.likesCount || 0)
            };
          }, { totalViews: 0, totalComments: 0, totalLikes: 0 });

          setStats(calculatedStats);
        } else {
          setError(data.message || 'Failed to fetch posts');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(prev => ({ ...prev, posts: false }));
      }
    };

    fetchPosts();
  }, [currentUser._id, currentPage]);

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
        setTotalPosts(prev => prev - 1);
        setTotalPages(Math.ceil((totalPosts - 1) / postsPerPage));
        setShowModal(false);
        
        // If current page becomes empty and it's not the first page, go to previous page
        if (posts.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setError(data.message || 'Failed to delete post');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <span>
            Showing {((currentPage - 1) * postsPerPage) + 1} to {Math.min(currentPage * postsPerPage, totalPosts)} of {totalPosts} posts
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
              currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <FaChevronLeft className="w-3 h-3 mr-1" />
            Previous
          </button>

          <div className="flex space-x-1">
            {generatePageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...'}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  page === currentPage
                    ? 'text-blue-600 bg-blue-50 border border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                    : page === '...'
                    ? 'text-gray-500 cursor-default'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
              currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            Next
            <FaChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  if (!currentUser.isAdmin) {
    return (
      <div className='flex justify-center items-center h-full'>
        <p className='text-gray-600 dark:text-gray-400'>
          Admin privileges required to view posts
        </p>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      {error && (
        <div className='mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg'>
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 dark:text-gray-400'>Total Posts</p>
              <p className='text-2xl font-semibold'>{totalPosts}</p>
            </div>
            <FaChartLine className='text-indigo-500 text-2xl' />
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 dark:text-gray-400'>Page Views</p>
              <p className='text-2xl font-semibold'>{stats.totalViews}</p>
            </div>
            <FaEye className='text-blue-500 text-2xl' />
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 dark:text-gray-400'>Page Comments</p>
              <p className='text-2xl font-semibold'>{stats.totalComments}</p>
            </div>
            <FaChartLine className='text-green-500 text-2xl' />
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 dark:text-gray-400'>Page Likes</p>
              <p className='text-2xl font-semibold'>{stats.totalLikes}</p>
            </div>
            <FaChartLine className='text-purple-500 text-2xl' />
          </div>
        </div>
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
                          data-testid="delete-post"
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

          <PaginationComponent />

          {loading.posts && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          )}
        </>
      ) : (
        <p className='text-center text-gray-600 dark:text-gray-400 py-10'>
          No posts found
        </p>
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
                data-testid="confirm-delete"
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