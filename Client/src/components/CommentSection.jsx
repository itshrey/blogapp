import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Modal, Button, Textarea, Spinner } from 'flowbite-react';
import Comment from './Comment';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { updateActivityScore } from '../redux/user/userSlice';

export default function CommentSection({ postId }) {
    const { currentUser } = useSelector(state => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState({
        comments: true,
        submission: false,
        deletion: false
    });
    const [modal, setModal] = useState({
        show: false,
        commentId: null
    });

    // Fetch comments with error handling
    const fetchComments = async () => {
        try {
            setLoading(prev => ({ ...prev, comments: true }));
            setError(null);
            
            const res = await fetch(`/api/comment/post/${postId}`);
            if (!res.ok) throw new Error('Failed to fetch comments');
            
            const data = await res.json();
            setComments(Array.isArray(data) ? data : data.comments || []);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(prev => ({ ...prev, comments: false }));
        }
    };
    useEffect(() => {
        fetchComments();
    }, [postId]);

    // Comment submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        try {
            setLoading(prev => ({ ...prev, submission: true }));
            
            const res = await fetch('/api/comment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    postId,
                    content: comment,
                    userId: currentUser._id
                }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create comment');
            
            setComment('');
            setComments(prev => [data, ...prev]);
            fetchComments();
            dispatch(updateActivityScore(3));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(prev => ({ ...prev, submission: false }));
        }
    };


    // Like handler
    const handleLike = async (commentId) => {
        if (!currentUser) {
            navigate('/sign-in');
            return;
        }

        try {
            const res = await fetch(`/api/comment/like/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                credentials: 'include'
            });
            
            if (!res.ok) throw new Error('Failed to like comment');
            
            const data = await res.json();
            setComments(prev => prev.map(c =>
                c._id === commentId ? {
                    ...c,
                    likes: data.likes,
                    numberOfLikes: data.numberOfLikes
                } : c
            ));
            dispatch(updateActivityScore(1));
            window.location.reload();
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    // Edit handler
    const handleEdit = (commentId, editedContent) => {
        setComments(prev => prev.map(c =>
            c._id === commentId ? { ...c, content: editedContent } : c
        ));
    };

    // Delete handlers
    const confirmDelete = (commentId) => {
        setModal({ show: true, commentId });
    };

    const handleDelete = async () => {
        try {
            setLoading(prev => ({ ...prev, deletion: true }));
            setError(null);
            
            const res = await fetch(`/api/comment/${modal.commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                credentials: 'include'
            });
            
            if (!res.ok) throw new Error('Failed to delete comment');
            
            setComments(prev => prev.filter(c => c._id !== modal.commentId));
            setModal({ show: false, commentId: null });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(prev => ({ ...prev, deletion: false }));
        }
    };

    return (
        <div className='max-w-2xl mx-auto w-full p-3' data-testid="comment-section">
            {/* User info */}
            {currentUser ? (
                <div className='flex items-center gap-1 my-5 text-gray-500 text-sm'>
                    <p>Signed in as: </p>
                    <img 
                        className='h-5 w-5 object-cover rounded-full' 
                        src={currentUser.profilePicture} 
                        alt={currentUser.username}
                        onError={(e) => e.target.src = '/default-profile.png'}
                    />
                    <Link 
                        to='/dashboard?tab=profile' 
                        className='text-xs text-cyan-600 hover:underline' data-testid="comment-user"
                    >
                        @{currentUser.username}
                        {currentUser.isAdmin && ' (Admin)'}
                        {currentUser.isVerified && !currentUser.isAdmin && ' (Verified)'}
                    </Link>
                </div>
            ) : (
                <div className='text-sm text-teal-500 my-5 flex gap-1'>
                    You must be signed in to comment.
                    <Link to='/sign-in' className='text-blue-500 hover:underline'>
                        Sign In
                    </Link>
                </div>
            )}

            {/* Comment form */}
            {currentUser && (
                <form className='border border-teal-400 rounded-md p-3' onSubmit={handleSubmit} data-testid="comment-form">
                    <Textarea 
                        placeholder='Add a comment...'
                        rows='3'
                        maxLength='200'
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={loading.submission}
                        data-testid="comment-input"
                    />
                    <div className='flex justify-between items-center mt-5'>
                        <p className='text-gray-500 text-sm'>
                            {200 - comment.length} characters remaining
                        </p>
                        <Button 
                            gradientDuoTone='purpleToBlue'
                            type='submit'
                            outline
                            disabled={loading.submission || !comment.trim()}
                            data-testid="comment-submit"
                        >
                            {loading.submission ? (
                                <>
                                    <Spinner size='sm' className='mr-2' />
                                    Posting...
                                </>
                            ) : 'Submit'}
                        </Button>
                    </div>
                </form>
            )}

            {/* Error display */}
            {error && (
                <Alert color='failure' className='mt-5'  data-testid="comment-error">
                    {error}
                </Alert>
            )}

            {/* Comments list */}
            {loading.comments ? (
                <div className='flex justify-center my-8'>
                    <Spinner size='xl' />
                </div>
            ) : comments.length === 0 ? (
                <p className='text-sm my-5'>No comments yet!</p>
            ) : (
                <>
                    <div className='text-sm my-5 flex gap-1 items-center'>
                        <p>Comments</p>
                        <div className='border border-gray-400 py-1 px-2 rounded-sm'>
                            {comments.length}
                        </div>
                    </div>
                    
                    {comments.map(comment => (
                        <Comment 
                            key={comment._id}
                            comment={comment}
                            currentUser={currentUser}
                            onLike={handleLike}
                            onEdit={handleEdit}
                            onDelete={confirmDelete}
                        />
                    ))}
                </>
            )}

            {/* Delete confirmation modal */}
            <Modal 
                show={modal.show} 
                onClose={() => setModal({ show: false, commentId: null })}
                popup
                size='md'
                data-testid="delete-modal"
            >
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
                            Are you sure you want to delete this comment?
                        </h3>
                        <div className='flex items-center justify-center gap-5'>
                            <Button 
                                color='failure' 
                                onClick={handleDelete}
                                disabled={loading.deletion}
                            >
                                {loading.deletion ? (
                                    <>
                                        <Spinner size='sm' className='mr-2' />
                                        Deleting...
                                    </>
                                ) : "Yes, I'm sure"}
                            </Button>
                            <Button 
                                color='gray' 
                                onClick={() => setModal({ show: false, commentId: null })}
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