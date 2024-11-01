import React from 'react';
import {BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/Userpage';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/user/ivan-mel">Ivan Mel</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user/:id" element={<UserPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;