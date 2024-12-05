import React from 'react';
import {BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/Userpage';
import { useEffect, useState } from 'react'
import Login from './components/Login';
import Creation from './components/Creation';
import LoginSave from './components/LoginSave';
import './App.css'
import Loginbackend from './components/Loginbackend';

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <BrowserRouter>
      <nav>
        {/* Basically here its what we see in the bar above */}
        <Link to="/">Home </Link>
        <Link to="/user/ivan-mel">Ivan Mel </Link>
        <Link to="/login">Login </Link>
        <Link to="/creation">Creation </Link>
        <Link to="/loginIntra">Intra-Login </Link> 
      </nav>

      <Routes>
        {/* Here is the routes that exist in the project */}
        <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>} />
        <Route path="/user/:id" element={<UserPage />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/loginbackend" element={<Loginbackend/>} />
        <Route path="/loginSave" element={<LoginSave setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
        <Route path="/creation" element={<Creation setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;