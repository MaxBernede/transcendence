import React from 'react';
import {BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/Userpage';
import { useEffect, useState } from 'react'
import Login from './components/Login';
import Creation from './components/Creation';
import LoginSave from './components/LoginSave';
import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home </Link>
        <Link to="/user/ivan-mel">Ivan Mel </Link>
        <Link to="/login">Login </Link>
        <Link to="/creation">Creation </Link>
        <Link to="/loginIntra">Intra-Login </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>} />
        <Route path="/user/:id" element={<UserPage />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/loginSave" element={<LoginSave setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
        <Route path="/creation" element={<Creation setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;