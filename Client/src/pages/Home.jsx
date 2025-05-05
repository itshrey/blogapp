import { Link } from 'react-router-dom';
import CallToAction from '../components/CallToAction';
import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import { useSelector } from 'react-redux';
import { Button, Spinner, Alert } from 'flowbite-react';
import { HiArrowRight, HiOutlineNewspaper } from 'react-icons/hi';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useSelector(state => state.user);
  const [visiblePosts, setVisiblePosts] = useState(3);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/post/getPosts?limit=9');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch posts');
        }

        setPosts(data.posts);
      } catch (err) {
        console.error('Fetch posts error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const loadMorePosts = () => {
    setVisiblePosts(prev => prev + 3);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className='flex flex-col gap-6 p-12 px-3 max-w-7xl mx-auto text-center'>
        <h1 className='text-4xl font-bold lg:text-6xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
          Welcome to InspireHub
        </h1>
        <p className='text-gray-500 text-sm sm:text-lg max-w-3xl mx-auto'>
          Discover insightful articles, tutorials, and stories about web development, 
          programming, and technology. Join our community of learners and creators.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Link to='/search'>
            <Button gradientDuoTone="purpleToBlue">
              Browse Articles <HiArrowRight className="ml-2" />
            </Button>
          </Link>
          {currentUser?.isVerified && (
            <Link to='/create-post'>
              <Button gradientDuoTone="pinkToOrange">
                Create Post <HiOutlineNewspaper className="ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className='p-3 bg-amber-100 dark:bg-slate-800'>
        <CallToAction />
      </section>

      {/* Recent Posts */}
      <section className='max-w-7xl mx-auto p-6'>
        <h2 className='text-3xl font-bold text-center mb-8'>Featured Articles</h2>
        
        {loading ? (
          <div className="flex justify-center">
            <Spinner size="xl" />
          </div>
        ) : error ? (
          <Alert color="failure" className="max-w-md mx-auto">
            {error}
          </Alert>
        ) : posts && posts.length > 0 ? (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {posts.slice(0, visiblePosts).map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            
            <div className="flex flex-col items-center mt-8 gap-4">
              {visiblePosts < posts.length && (
                <Button onClick={loadMorePosts} gradientMonochrome="info">
                  Load More Articles
                </Button>
              )}
              <Link 
                to={'/search'} 
                className='text-lg text-teal-500 hover:underline flex items-center'
              >
                View all articles <HiArrowRight className="ml-1" />
              </Link>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No articles found. Check back later!</p>
        )}
      </section>

      {/* Verified User Benefits */}
      {!currentUser?.isVerified && !currentUser?.isAdmin && (
        <section className="bg-gray-50 dark:bg-gray-800 py-12 mt-8">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h3 className="text-2xl font-bold mb-4">Become a Verified Contributor</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Verified users can create and share their own posts, comment on articles, 
              and participate in our community. Earn your verification by being an active member!
            </p>
            <Link to="/sign-up">
              <Button gradientDuoTone="tealToLime">
                Join Our Community
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}