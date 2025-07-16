import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import './index.css';


import Header from './components/Header';
import FooterCom from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import OnlyAdminPrivateRoute from './components/OnlyAdminPrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
// Pages
import Home from './pages/Home';
import SignIn from './pages/Signin';
import SignUp from './pages/Signup';
import AdminSignUp from './pages/AdminSignup';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import UpdatePost from './pages/UpdatePost';
import PostPage from './pages/Postpage';
import Project from './pages/Project';
import About from './pages/About';
import Search from './pages/Search';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <BrowserRouter>
          <Top />
          <Header />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/admin/sign-up" element={<AdminSignUp />} />
            <Route path="/search" element={<Search />} />
            <Route path="/projects" element={<Project />} />
            <Route path="/post/:postSlug" element={<PostPage />} />
            <Route path="/about" element={<About />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Admin-only Routes */}
            <Route element={<OnlyAdminPrivateRoute />}>
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/update-post/:postId" element={<UpdatePost />} />
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <FooterCom />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}