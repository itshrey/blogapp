import { Button, Select, TextInput, Badge, Spinner, Alert } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { HiSearch, HiSortAscending, HiSortDescending, HiFilter } from 'react-icons/hi';
import { useSelector } from 'react-redux';

export default function Search() {
  const { currentUser } = useSelector(state => state.user);
  const [sidebarData, setSidebarData] = useState({
    searchTerm: '',
    sort: 'desc',
    category: 'all',
    verifiedOnly: currentUser?.isVerified ? false : true
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/post/categories');
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch posts based on search query
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add verification filter for non-admin users
        if (!currentUser?.isAdmin) {
          urlParams.set('verifiedOnly', sidebarData.verifiedOnly);
        }

        const res = await fetch(`/api/post/getposts?${urlParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch posts');
        
        const data = await res.json();
        setPosts(data.posts);
        setShowMore(data.posts.length === 9);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Update state from URL params
    const searchTermFromUrl = urlParams.get('searchTerm');
    const sortFromUrl = urlParams.get('sort');
    const categoryFromUrl = urlParams.get('category');
    
    setSidebarData(prev => ({
      ...prev,
      searchTerm: searchTermFromUrl || '',
      sort: sortFromUrl || 'desc',
      category: categoryFromUrl || 'all'
    }));

    fetchPosts();
  }, [location.search, currentUser, sidebarData.verifiedOnly]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSidebarData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    
    if (sidebarData.searchTerm) urlParams.set('searchTerm', sidebarData.searchTerm);
    if (sidebarData.sort) urlParams.set('sort', sidebarData.sort);
    if (sidebarData.category && sidebarData.category !== 'all') {
      urlParams.set('category', sidebarData.category);
    }
    if (sidebarData.verifiedOnly) urlParams.set('verifiedOnly', 'true');

    navigate(`/search?${urlParams.toString()}`);
  };

  const handleShowMore = async () => {
    const startIndex = posts.length;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    
    try {
      const res = await fetch(`/api/post/getposts?${urlParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch more posts');
      
      const data = await res.json();
      setPosts(prev => [...prev, ...data.posts]);
      setShowMore(data.posts.length === 9);
    } catch (err) {
      console.error('Error loading more posts:', err);
    }
  };

  const resetFilters = () => {
    setSidebarData({
      searchTerm: '',
      sort: 'desc',
      category: 'all',
      verifiedOnly: currentUser?.isVerified ? false : true
    });
    navigate('/search');
  };

  return (
    <div className='flex flex-col md:flex-row min-h-screen'>
      {/* Filters Sidebar */}
      <div className='p-4 md:p-6 border-b md:border-r border-gray-200 dark:border-gray-700 md:w-80 md:min-h-screen bg-gray-50 dark:bg-gray-800'>
        <h2 className='text-xl font-bold mb-6 flex items-center gap-2'>
          <HiFilter className='text-gray-600 dark:text-gray-300' />
          Search Filters
        </h2>
        
        <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
          {/* Search Term */}
          <div>
            <label htmlFor='searchTerm' className='block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Search Posts
            </label>
            <TextInput
              id='searchTerm'
              type='text'
              placeholder='Enter keywords...'
              value={sidebarData.searchTerm}
              onChange={handleChange}
              icon={HiSearch}
              data-testid="search-input"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor='sort' className='block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Sort By
            </label>
            <Select
              id='sort'
              value={sidebarData.sort}
              onChange={handleChange}
              icon={sidebarData.sort === 'asc' ? HiSortAscending : HiSortDescending}
            >
              <option value='desc'>Newest First</option>
              <option value='asc'>Oldest First</option>
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor='category' className='block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Category
            </label>
            <Select
              id='category'
              value={sidebarData.category}
              onChange={handleChange}
            >
              <option value='all'>All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Verified Posts Filter */}
          {currentUser?.isVerified && !currentUser?.isAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={sidebarData.verifiedOnly}
                onChange={(e) => setSidebarData(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="verifiedOnly" className="text-sm text-gray-700 dark:text-gray-300">
                Show verified posts only
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button type='submit' gradientDuoTone='purpleToBlue' className='flex-1' data-testid="search-submit">
              Apply Filters
            </Button>
            <Button type='button' color='gray' outline onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className='flex-1 p-4 md:p-6'>
        <div className="flex justify-between items-center mb-6">
          <h1 className='text-2xl md:text-3xl font-bold text-gray-800 dark:text-white'>
            {posts.length > 0 ? 'Search Results' : 'No Posts Found'}
          </h1>
          {posts.length > 0 && (
            <Badge color="gray" className="px-3 py-1">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </Badge>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert color="failure" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Results Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {!loading && posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {/* Empty State */}
        {!loading && posts.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No posts match your search criteria. Try adjusting your filters.
            </p>
            <Button 
              color="light" 
              onClick={resetFilters}
              className="mt-4"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Show More Button */}
        {showMore && !loading && (
          <div className="text-center mt-8">
            <Button 
              onClick={handleShowMore} 
              gradientDuoTone="greenToBlue"
              className="mx-auto"
            >
              Load More Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}