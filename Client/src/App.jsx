import React from 'react'
import { BrowserRouter,Route,Routes } from 'react-router-dom'
import Home from './pages/Home';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import About from './pages/About';
import Header from './components/Header';
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/sign-in' element={<Signin/>} />
        <Route path='/sign-up' element={<Signup/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path='/projects' element={<Project/>} />
        <Route path='/about' element={<About/>} />

      </Routes>
    </BrowserRouter>
  )
}
