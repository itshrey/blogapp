import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert, Badge, Tooltip } from 'flowbite-react';
import PostCard from '../components/PostCard';
import CallToAction from '../components/CallToAction';
import CommentSection from '../components/CommentSection';
import { useSelector } from 'react-redux';
import { HiOutlineClock, HiOutlineCalendar, HiOutlineUser } from 'react-icons/hi';
import { FaRegHeart, FaHeart } from 'react-icons/fa';


export default function PostPage() {
    const [summary, setSummary] = useState('');
    const [summarizing, setSummarizing] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const { postSlug } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useSelector(state => state.user);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [post, setPost] = useState(null);
    const [recentPosts, setRecentPosts] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState(null);
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);

    const toggleLike = async () => {
        if (!currentUser) {
            navigate('/sign-in');
            return;
        }
    
        try {
            const res = await fetch('/api/post/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId: post._id }),
            });
    
            const data = await res.json();
    
            if (res.ok) {
                setLikes(data.likesCount);
                setLiked(data.isLiked);
                // Update the post object to keep UI in sync
                setPost(prev => ({
                    ...prev,
                    likesCount: data.likesCount,
                    likes: data.isLiked
                        ? [...(prev.likes || []), currentUser._id]
                        : (prev.likes || []).filter(id => id !== currentUser._id)
                }));
            }
            window.location.reload(); // Reload the page to reflect changes
        } catch (error) {
            console.error('Like toggle error:', error);
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/post/getposts?slug=${postSlug}`);
                const data = await res.json();
                
                if (!res.ok) throw new Error(data.message || 'Post not found');
                if (data.posts.length === 0) {
                    navigate('/404', { replace: true });
                    return;
                }
    
                const fetchedPost = data.posts[0];
                setPost(fetchedPost);
                setLikes(fetchedPost.likesCount || 0);
                
                // Set liked status based on whether current user is in likes array
                setLiked(
                    currentUser && 
                    fetchedPost.likes && 
                    fetchedPost.likes.includes(currentUser._id)
                );
            } catch (error) {
                setError(true);
                navigate('/404', { replace: true });
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postSlug, navigate, currentUser]);
    
    const fetchSummary = async () => {
        try {
            setSummarizing(true);
            const res = await fetch('/api/ai/summarize-blog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: post.content }),
            });
    
            const data = await res.json();
    
            if (res.ok) {
                setSummary(data.summary);
                setShowSummary(true);
            } else {
                console.error('Failed to summarize blog:', data.message);
            }
        } catch (err) {
            console.error('Error summarizing blog:', err);
        } finally {
            setSummarizing(false);
        }
    };
    

    useEffect(() => {
        const fetchRecentPosts = async () => {
            try {
                const res = await fetch('/api/post/getposts?limit=3');
                const data = await res.json();
                if (res.ok) {
                    setRecentPosts(data.posts);
                }
            } catch (error) {
                console.error('Fetch recent posts error:', error);
            }
        };

        const fetchRelatedPosts = async () => {
            if (!post) return;
            try {
                const res = await fetch(`/api/post/getposts?category=${post.category}&limit=3`);
                const data = await res.json();
                if (res.ok) {
                    setRelatedPosts(data.posts.filter(p => p._id !== post._id));
                }
            } catch (error) {
                console.error('Fetch related posts error:', error);
            }
        };

        fetchRecentPosts();
        fetchRelatedPosts();
    }, [post]);

    const calculateReadTime = (content) => {
        const text = content.replace(/<[^>]*>/g, ' ');
        const words = text.split(/\s+/).filter(word => word.length > 0);
        return Math.ceil(words.length / 200);
    };

    // Helper function to get author display name
    const getAuthorName = () => {
        if (!post) return 'Unknown Author';
        if (!post.userId) return 'Deleted User';
        return post.userId.username || 'Unknown Author';
    };

    // Helper function to check if author is deleted
    const isAuthorDeleted = () => {
        return !post?.userId;
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <Spinner size='xl' />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <Alert color='failure' className='max-w-md'>
                    Failed to load post. Please try again later.
                </Alert>
            </div>
        );
    }

    return (
        <main className='p-3 flex flex-col max-w-7xl mx-auto min-h-screen'>
            {/* Post Header */}
            <div className='mt-10 mb-6 text-center'>
                <div className='flex justify-center gap-2 mb-4'>
                    <Badge color='gray' className='w-fit'>
                        {post.category}
                    </Badge>
                    {post.isAdminPost && (
                        <Badge color='indigo' className='w-fit'>
                            Admin Post
                        </Badge>
                    )}
                </div>
                <div className="text-center my-8">
                    <Button
                        className="w-full max-w-md mx-auto"
                        gradientDuoTone="purpleToPink"
                        onClick={fetchSummary}
                        disabled={summarizing}
                    >
                        {summarizing ? 'Summarizing...' : 'AI Summary'}
                    </Button>

                    {showSummary && summary && (
                        <div className="bg-purple-100 dark:bg-gray-800 p-6 mt-6 rounded-xl max-w-4xl mx-auto text-gray-800 dark:text-gray-100 shadow-md">
                        <h3 className="text-xl font-semibold mb-3">Summary</h3>
                        <p className="text-base leading-relaxed">{summary}</p>
                        </div>
                    )}

                </div>
                <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>{post.title}</h1>
                
                <div className='flex flex-wrap justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
                    <div className='flex items-center gap-1'>
                        <HiOutlineUser className='text-sm' />
                        <span className={isAuthorDeleted() ? 'text-red-400 dark:text-red-500' : ''}>
                            {getAuthorName()}
                        </span>
                        {isAuthorDeleted() && (
                            <Badge color='failure' size='sm' className='ml-1'>
                                Deleted
                            </Badge>
                        )}
                    </div>
                    <div className='flex items-center gap-1'>
                        <HiOutlineCalendar className='text-sm' />
                        <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                        <HiOutlineClock className='text-sm' />
                        <span>{calculateReadTime(post.content)} min read</span>
                    </div>
                    <div className="flex items-center gap-1" data-testid="like-section">
                        <Tooltip content={liked ? 'Remove like' : 'Like this post'}>
                            <button 
                                onClick={toggleLike} 
                                className={`like-btn ${liked ? 'liked' : ''}`}
                                data-testid="like-button"
                                aria-label={liked ? 'Unlike post' : 'Like post'}
                            >
                                {liked ? (
                                    <FaHeart className="heart-icon" data-testid="heart-filled" />
                                ) : (
                                    <FaRegHeart className="heart-icon" data-testid="heart-outline" />
                                )}
                            </button>
                        </Tooltip>
                        <span className="like-count" data-testid="like-count">
                            {likes} {likes === 1 ? 'Like' : 'Likes'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Featured Image */}
            {post.image && (
                <div className='relative w-full h-64 md:h-80 lg:h-96 mb-8 rounded-xl overflow-hidden shadow-lg'>
                    <img 
                        src={post.image} 
                        alt={post.title} 
                        className='w-full h-full object-cover'
                    />
                </div>
            )}

            {/* Post Content */}
            <article 
                className='prose dark:prose-invert max-w-4xl mx-auto w-full px-4 lg:px-0'
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Call to Action */}
            <div className='my-12 max-w-4xl w-full mx-auto'>
                <CallToAction />
            </div>

            {/* Comments Section */}
            <div className='max-w-4xl w-full mx-auto mb-12'>
                <CommentSection postId={post._id} />
            </div>

            {/* Related Posts */}
            {relatedPosts && relatedPosts.length > 0 && (
                <section className='mb-12'>
                    <h2 className='text-2xl font-bold mb-6 text-center'>More in {post.category}</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {relatedPosts.map((post) => (
                            <PostCard key={post._id} post={post} />
                        ))}
                    </div>
                </section>
            )}

            {/* Recent Posts */}
            {recentPosts && recentPosts.length > 0 && (
                <section className='mb-12'>
                    <h2 className='text-2xl font-bold mb-6 text-center'>Recent Articles</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {recentPosts.map((post) => (
                            <PostCard key={post._id} post={post} />
                        ))}
                    </div>
                    <div className='text-center mt-6'>
                        <Link to='/search'>
                            <Button gradientDuoTone='purpleToBlue'>
                                View All Articles
                            </Button>
                        </Link>
                    </div>
                </section>
            )}
        </main>
    );
}