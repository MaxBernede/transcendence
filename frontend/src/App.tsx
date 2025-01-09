import React, { useState, useEffect, createContext, ReactNode } from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/Userpage';
import Creation from './components/Creation';
import './styles/App.css'
import Navbar from './components/Navbar';
import ProfileUpdate from './pages/user/ProfileUpdate';
import { fetchUserData, UserData } from './utils/UserLogic';

export const UserContext = createContext<{
	userData: UserData | null;
	setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
	loading: boolean;
	error: string | null;
	achievements: { id: number; achievementName: string; description: string }[];
	setAchievements: React.Dispatch<React.SetStateAction<any[]>>;
	matchHistory: any[];
	setMatchHistory: React.Dispatch<React.SetStateAction<any[]>>;
  }>({
	userData: null,
	setUserData: () => {},
	loading: true,
	error: null,
	achievements: [],
	setAchievements: () => {},
	matchHistory: [],
	setMatchHistory: () => {},
  });

function App() {
	const [userData, setUserData] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [achievements, setAchievements] = useState<any[]>([]); // Default as empty array
	const [matchHistory, setMatchHistory] = useState<any[]>([]); // Default as empty array  
	useEffect(() => {
		// Fetch user data when the component mounts
		//user, achi, match, error, loading
		fetchUserData(setUserData, setAchievements, setMatchHistory, setError, setLoading);
	  },[]);
  return (
    <UserContext.Provider
      value={{
        userData,
        setUserData,
        loading,
        error,
        achievements,
        setAchievements,
        matchHistory,
        setMatchHistory,
      }}
    >  
	  <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user/:id" element={<UserPage />} />
          <Route path="/user/ProfileUpdate" element={<ProfileUpdate />} />
          <Route
            path="*"
            element={<p style={{ padding: '20px', color: 'red' }}>404 - Page Not Found</p>}
          />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
