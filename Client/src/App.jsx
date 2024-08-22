import React from 'react'
import { BrowserRouter,Route,Routes } from 'react-router-dom'
import OnlyAdminPrivateRoute from './components/OnlyAdminPrivateRoute'
import Home from './pages/Home';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import About from './pages/About';
import Header from './components/Header';
import FooterCom from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import CreatePost from './pages/CreatePost';
import UpdatePost from './pages/UpdatePost';
import Postpage from './pages/Postpage';
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/sign-in' element={<Signin/>} />
        
        <Route path='/sign-up' element={<Signup/>} />
        <Route element={<PrivateRoute/>}>
          <Route path='/dashboard' element={<Dashboard/>} />
        </Route>
        <Route element={<OnlyAdminPrivateRoute/>}>
          <Route path='/create-post' element={<CreatePost/>} />
          <Route path='/update-post/:postId' element={<UpdatePost/>} />
        </Route>
        <Route path='/projects' element={<Project/>} />
        <Route path='/post/:postSlug' element={<Postpage/>} />
        <Route path='/about' element={<About/>} />

      </Routes>
      <FooterCom/>
    </BrowserRouter>
  )
}
