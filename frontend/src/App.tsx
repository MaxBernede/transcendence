import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/Userpage';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
        <Link to="/user/ivan-mel">Ivan Mel</Link>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
