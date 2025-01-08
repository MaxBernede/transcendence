import React from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/Userpage';
import Creation from './components/Creation';
import './styles/App.css'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar';

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  return (
		<BrowserRouter>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/user/:id" element={<UserPage />} />
				<Route
					path="/creation"
					element={<Creation setLoggedIn={setLoggedIn} setEmail={setEmail} />}
				/>
				<Route
					path="*"
					element={<p style={{ padding: '20px', color: 'red' }}>404 - Page Not Found</p>}
				/>
			</Routes>
		</BrowserRouter>
  );
}

export default App;
