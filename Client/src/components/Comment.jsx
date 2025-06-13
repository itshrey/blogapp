import React, { useState } from 'react';
import moment from 'moment';
import { FaThumbsUp } from 'react-icons/fa';
import { Button, Textarea, Tooltip } from 'flowbite-react';

export default function Comment({ comment, currentUser, onLike, onEdit, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check if current user is author or admin
    const isAuthor = currentUser && (
        currentUser._id === comment.userId || 
        currentUser._id === comment.userId?._id ||
        currentUser.isAdmin
    );

    const handleSave = async () => {
        if (!editedContent.trim()) {
            setError('Comment cannot be empty');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`/api/comment/${comment._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                credentials: 'include',
                body: JSON.stringify({ content: editedContent }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update comment');
            
            setIsEditing(false);
            onEdit(comment._id, editedContent);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex p-4 border-b dark:border-gray-600 text-sm relative group' data-testid="comment" >
            {error && (
                <div className='absolute top-2 right-2 text-red-500 text-xs'>
                    {error}
                </div>
            )}
            
            <div className='flex-shrink-0 mr-3'>
                <img 
                    src={comment.userId?.profilePicture || '/default-profile.png'} 
                    alt={comment.userId?.username} 
                    className='w-10 h-10 rounded-full bg-gray-200 object-cover'
                    onError={(e) => e.target.src = '/default-profile.png'}
                />
                <div className='text-center mt-1'>
                    {comment.userId?.isVerified && (
                        <span className='text-xs text-blue-500 block'>✓ Verified</span>
                    )}
                    {comment.userId?.isAdmin && (
                        <span className='text-xs text-red-500 block'>Admin</span>
                    )}
                </div>
            </div>
            
            <div className='flex-1'>
                <div className='flex items-center mb-1'>
                    <span className='font-bold mr-1 text-xs truncate'>
                        {comment.userId ? `@${comment.userId.username}` : 'anonymous user'}
                    </span>
                    <span className='text-gray-500 text-xs'>
                        {moment(comment.createdAt).fromNow()}
                        {comment.editedAt && ` (edited ${moment(comment.editedAt).fromNow()})`}
                    </span>
                </div>

                {isEditing ? (
                    <>
                        <Textarea 
                            className='mb-2' 
                            value={editedContent} 
                            onChange={(e) => setEditedContent(e.target.value)}
                            disabled={isLoading}
                        />
                        <div className='flex items-center justify-end gap-2 text-xs'>
                            <Button 
                                type='button' 
                                size='sm' 
                                gradientDuoTone='purpleToBlue' 
                                onClick={handleSave}
                                disabled={isLoading || !editedContent.trim()}
                            >
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                            <Button 
                                type='button' 
                                size='sm' 
                                gradientDuoTone='purpleToBlue' 
                                outline 
                                onClick={() => {
                                    setIsEditing(false);
                                    setError(null);
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className='text-gray-500 pb-2 dark:text-gray-300'>{comment.content}</p>
                        <div className='flex items-center pt-2 text-xs border-t dark:border-gray-700 max-w-fit gap-2'>
                            <Tooltip content={currentUser ? '' : 'Sign in to like'} placement='top'>
                                <button 
                                    type='button' 
                                    className={`text-gray-400 hover:text-blue-500 ${
                                        currentUser && comment.likes?.includes(currentUser._id) && '!text-blue-500'
                                    }`}
                                    onClick={() => onLike(comment._id)}
                                    disabled={!currentUser}
                                    data-testid="comment-like-button"
                                >
                                    <FaThumbsUp className='text-sm'/>
                                </button>
                            </Tooltip>
                            <p className='text-gray-400 dark:text-gray-500' data-testid="comment-like-count">
                                {comment.numberOfLikes > 0 && 
                                    `${comment.numberOfLikes} ${comment.numberOfLikes === 1 ? 'like' : 'likes'}`
                                }
                            </p>
                            
                            {isAuthor && (
                                <>
                                    <button 
                                        className='text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                                        onClick={() => setIsEditing(true)}
                                        disabled={isLoading}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className='text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                                        onClick={() => onDelete(comment._id)}
                                        disabled={isLoading}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </>  
                )}
            </div>
        </div>
    );
}