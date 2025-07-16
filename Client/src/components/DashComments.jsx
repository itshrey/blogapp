import { Modal, Table, Button, Badge, Spinner, Tooltip } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { FaThumbsUp, FaUser, FaFileAlt } from 'react-icons/fa';
import moment from 'moment';

export default function DashComments() {
  const { currentUser } = useSelector((state) => state.user);
  const [comments, setComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState('');
  const [loading, setLoading] = useState({
    comments: false,
    delete: false
  });
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [commentsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchComments = async (page = 1) => {
    setLoading(prev => ({ ...prev, comments: true }));
    setError(null);
    try {
      const startIndex = (page - 1) * commentsPerPage;
      const res = await fetch(`/api/comment/?startIndex=${startIndex}&limit=${commentsPerPage}&populate=user,post`);
      const data = await res.json();
      
      if (res.ok) {
        setComments(data.comments);
        setTotalComments(data.totalComments || 0);
        setTotalPages(Math.ceil((data.totalComments || 0) / commentsPerPage));
        setCurrentPage(page);
      } else {
        setError(data.message || 'Failed to fetch comments');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, comments: false }));
    }
  };

  useEffect(() => {
    if (currentUser.isAdmin) {
      fetchComments(1);
    }
  }, [currentUser._id]);

  const handleDeleteComment = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const res = await fetch(`/api/comment/${commentIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setComments(prev => prev.filter(comment => comment._id !== commentIdToDelete));
        setShowModal(false);
        
        // Refresh current page or go to previous page if current page becomes empty
        const remainingComments = comments.length - 1;
        if (remainingComments === 0 && currentPage > 1) {
          fetchComments(currentPage - 1);
        } else {
          fetchComments(currentPage);
        }
      } else {
        setError(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchComments(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {((currentPage - 1) * commentsPerPage) + 1} to {Math.min(currentPage * commentsPerPage, totalComments)} of {totalComments} comments
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading.comments}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === 1 || loading.comments
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600'
            }`}
          >
            <HiChevronLeft className="w-4 h-4" />
          </button>

          {/* First page */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                disabled={loading.comments}
                className="px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-500">...</span>}
            </>
          )}

          {/* Page numbers */}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={loading.comments}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                page === currentPage
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Last page */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={loading.comments}
                className="px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading.comments}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === totalPages || loading.comments
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600'
            }`}
          >
            <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!currentUser.isAdmin) {
    return (
      <div className='flex justify-center items-center h-full'>
        <p className='text-gray-600 dark:text-gray-400'>
          Admin privileges required to view comments
        </p>
      </div>
    );
  }

  return (
    <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      {error && (
        <div className='mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg'>
          {error}
        </div>
      )}

      {loading.comments && comments.length === 0 ? (
        <div className='flex justify-center items-center h-64'>
          <Spinner size='xl' />
        </div>
      ) : comments.length > 0 ? (
        <>
          <Table hoverable className='shadow-md'>
            <Table.Head>
              <Table.HeadCell>Date</Table.HeadCell>
              <Table.HeadCell>Comment</Table.HeadCell>
              <Table.HeadCell>Likes</Table.HeadCell>
              <Table.HeadCell>User</Table.HeadCell>
              <Table.HeadCell>Post</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className='divide-y'>
              {comments.map((comment) => (
                <Table.Row key={comment._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                  <Table.Cell>
                    <Tooltip content={new Date(comment.updatedAt).toLocaleString()}>
                      <span>{moment(comment.updatedAt).fromNow()}</span>
                    </Tooltip>
                  </Table.Cell>
                  <Table.Cell className='max-w-xs'>
                    <p className='line-clamp-2'>{comment.content}</p>
                  </Table.Cell>
                  <Table.Cell className='text-center'>
                    <div className='flex items-center justify-center gap-1'>
                      <FaThumbsUp className='text-blue-500' />
                      <span>{comment.numberOfLikes}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className='flex items-center gap-2'>
                      {comment.userId?.profilePicture ? (
                        <img
                          src={comment.userId.profilePicture}
                          alt={comment.userId.username}
                          className='w-6 h-6 rounded-full'
                          onError={(e) => {
                            e.target.src = '/default-profile.png';
                          }}
                        />
                      ) : (
                        <div className='w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center'>
                          <FaUser className='text-gray-500 text-xs' />
                        </div>
                      )}
                      <Link
                        to={`/dashboard?tab=users&userId=${comment.userId?._id}`}
                        className={`hover:underline ${!comment.userId ? 'text-gray-400' : 'text-cyan-600'}`}
                      >
                        @{comment.userId?.username || 'Deleted User'}
                      </Link>
                      {comment.userId?.isAdmin && <Badge color='failure'>Admin</Badge>}
                      {comment.userId?.isVerified && !comment.userId?.isAdmin && <Badge color='success'>Verified</Badge>}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      to={`/post/${comment.postId?.slug || '#'}`}
                      className={`hover:underline flex items-center gap-1 ${!comment.postId ? 'text-gray-400' : 'text-cyan-600'}`}
                    >
                      <FaFileAlt />
                      {comment.postId?.title || 'Deleted Post'}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      color='failure'
                      size='xs'
                      onClick={() => {
                        setCommentIdToDelete(comment._id);
                        setShowModal(true);
                      }}
                    >
                      Delete
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {/* Pagination Component */}
          {renderPagination()}
        </>
      ) : (
        <p className='text-center text-gray-600 dark:text-gray-400 py-10'>
          No comments found
        </p>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mx-auto mb-4' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this comment?
            </h3>
            <div className='flex justify-center gap-5'>
              <Button
                color='failure'
                onClick={handleDeleteComment}
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