import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/Userpage';
import Login from './components/Login';
import Creation from './components/Creation';
import LoginSave from './components/LoginSave';
import './App.css'
import Loginbackend from './components/Loginbackend';
import { useEffect, useState } from 'react'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  return (
    <BrowserRouter>
      <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
        {/* <Link to="/user/ivan-mel">Ivan Mel</Link> */}
        <Link to="/user/me">Me  </Link>
        <Link to="/login">Login </Link>
        <Link to="/creation">Creation </Link>
        <Link to="/loginIntra">Intra-Login </Link> 
      </nav>

      <Routes>
        {/* Home Page Route */}
        <Route path="/" element={<Home />} />
        
        {/* User Page Route */}
        <Route path="/user/:id" element={<UserPage />} />
        
        {/* Catch-all Route for 404 */}
        <Route
          path="*"
          element={<p style={{ padding: '20px', color: 'red' }}>404 - Page Not Found</p>}
        />
        <Route path="/login" element={<Login/>} />
        <Route path="/loginbackend" element={<Loginbackend/>} />
        <Route path="/loginSave" element={<LoginSave setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
        <Route path="/creation" element={<Creation setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;
