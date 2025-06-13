import { Avatar, Button, Dropdown, Navbar, TextInput, Badge, Tooltip } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun, FaUserCheck, FaUserClock } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';
import { signoutSuccess } from '../redux/user/userSlice';
import { useEffect, useState } from 'react';

export default function Header() {
  const path = useLocation().pathname;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  const handleSignout = async () => {
    try {
      const res = await fetch('/api/user/signout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
        navigate('/sign-in');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  return (
    <Navbar className='border-b-2 sticky top-0 z-50'>
      <div className='w-full flex flex-wrap items-center justify-between'>
        {/* Brand Logo */}
        <Link
          to='/'
          className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white flex items-center'
        >
          <span className='px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white mr-1'>
            Inspire
          </span>
          Hub
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSubmit} className='hidden lg:block flex-1 mx-4'>
          <TextInput
            type='text'
            placeholder='Search posts...'
            data-testid="header-search-input"
            rightIcon={AiOutlineSearch}
            className='w-full max-w-md'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Mobile Search Toggle */}
        <Button
          className='w-12 h-10 lg:hidden mr-2'
          color='gray'
          pill
          onClick={toggleMobileSearch}
          data-testid="search-submit"
        >
          <AiOutlineSearch />
        </Button>

        {/* Mobile Search Input */}
        {showMobileSearch && (
          <form onSubmit={handleSubmit} className='lg:hidden w-full mt-2'>
            <TextInput
              type='text'
              placeholder='Search posts...'
              rightIcon={AiOutlineSearch}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        )}

        {/* Right Side Controls */}
        <div className='flex items-center gap-2 md:order-2'>
          {/* Theme Toggle */}
          <Tooltip content={theme === 'light' ? 'Dark mode' : 'Light mode'}>
            <Button
              className='w-12 h-10 hidden sm:inline'
              color='gray'
              pill
              onClick={() => dispatch(toggleTheme())}
            >
              {theme === 'light' ? <FaSun /> : <FaMoon />}
            </Button>
          </Tooltip>

          {/* User Dropdown */}
          {currentUser ? (
            <Dropdown
              arrowIcon={false}
              data-testid="user-dropdown"
              inline
              label={
                <div className='relative'>
                  <Avatar 
                    alt='user' 
                    img={currentUser.profilePicture} 
                    rounded 
                    status={
                      currentUser.isVerified ? 
                        { position: 'top-right', color: 'success' } : 
                        { position: 'top-right', color: 'warning' }
                    }
                  />
                </div>
              }
            >
              <Dropdown.Header>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>@{currentUser.username}</span>
                  {currentUser.isAdmin && (
                    <Badge color="indigo" size="xs">Admin</Badge>
                  )}
                  {currentUser.isVerified ? (
                    <Tooltip content="Verified user">
                      <FaUserCheck className='text-green-500 text-sm' />
                    </Tooltip>
                  ) : (
                    <Tooltip content="Not verified">
                      <FaUserClock className='text-yellow-500 text-sm' />
                    </Tooltip>
                  )}
                </div>
                <span className='block text-sm font-medium truncate mt-1'>
                  {currentUser.email}
                </span>
              </Dropdown.Header>
              <Link to={'/dashboard?tab=profile'}>
                <Dropdown.Item>Dashboard</Dropdown.Item>
              </Link>
              {currentUser.isAdmin && (
                <Link to={'/dashboard'}>
                  <Dropdown.Item>Admin Panel</Dropdown.Item>
                </Link>
              )}
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleSignout} data-testid="signout-button">Sign out</Dropdown.Item>
            </Dropdown>
          ) : (
            <Link to='/sign-in'>
              <Button gradientDuoTone='purpleToBlue' outline>
                Sign In
              </Button>
            </Link>
          )}

          <Navbar.Toggle />
        </div>

        {/* Navigation Links */}
        <Navbar.Collapse className='w-full md:w-auto'>
          <Navbar.Link active={path === '/'} as={'div'}>
            <Link to='/' className='w-full block'>
              Home
            </Link>
          </Navbar.Link>
          <Navbar.Link active={path === '/about'} as={'div'}>
            <Link to='/about' className='w-full block'>
              About
            </Link>
          </Navbar.Link>
          <Navbar.Link active={path === '/projects'} as={'div'}>
            <Link to='/projects' className='w-full block'>
              Projects
            </Link>
          </Navbar.Link>
          {currentUser?.isVerified && !currentUser?.isAdmin && (
            <Navbar.Link active={path === '/create-post'} as={'div'}>
              <Link to='/create-post' className='w-full block'>
                Create Post
              </Link>
            </Navbar.Link>
          )}
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
}