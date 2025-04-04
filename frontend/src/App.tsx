import React, { useState, useEffect, createContext, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import UserPage from "./pages/Userpage";
import Creation from "./components/Creation";
import "./styles/App.css";
import Navbar from "./components/Navbar";
import ProfileUpdate from "./pages/user/ProfileUpdate";
import { fetchUserData, UserData } from "./utils/UserLogic";
import TwoFactorAuth from "./components/2FA/2FA";
// import TwoFASetup from "./pages/login/2FASetup";
import ChatPage from "./pages/chat/[id]";
import ChatLayout from "./pages/chat/chat-page";
import { UserProvider } from "./context";
// import TwoFASetup from './pages/login/2FASetup';
import Friends from './pages/Friends';
import UserProfile from './pages/UserProfile';
import PongPage from "./game/PongPage";
import LoginPage from "./pages/login/page";
import { io, Socket } from "socket.io-client";
import EventsHandler from "./events/EventsHandler";

import { Toaster } from "./components/ui/sonner";
import TwoFASetup from "./pages/login/2FASetup";

export const UserContext = createContext<{
	userData: UserData | null;
	setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
	loading: boolean;
	error: string | null;
	matchHistory: any[];
	setMatchHistory: React.Dispatch<React.SetStateAction<any[]>>;
  }>({
	userData: null,
	setUserData: () => {},
	loading: true,
	error: null,
	matchHistory: [],
	setMatchHistory: () => {},
  });

function App() {
	const [userData, setUserData] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [matchHistory, setMatchHistory] = useState<any[]>([]); // Default as empty array  
	useEffect(() => {
		// Fetch user data when the component mounts
		//user, achi, match, error, loading
		fetchUserData(setUserData, setMatchHistory, setError, setLoading);
	  },[]);

	  const [socket, setSocket] = useState<Socket | null>(null);

	  useEffect(() => {

	
		const eventsHandler = EventsHandler.getInstance();

	  }, []);
  return (
    <UserContext.Provider
      value={{
        userData,
        setUserData,
        loading,
        error,
        matchHistory,
        setMatchHistory,
      }}
    >  
	  <BrowserRouter>
	  <Toaster position="bottom-right" richColors />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user/:id" element={<UserPage />} />
          <Route path="/user/ProfileUpdate" element={<ProfileUpdate />} />
          <Route path="/2FA" element={<TwoFactorAuth />} />
		      <Route path="/friends" element={<Friends />} />
          <Route path="/2FASetup" element={<TwoFASetup/>} />
		      <Route path="/pong" element={<PongPage />} /> 
		          {/* Only wrap /chat route with UserProvider */}
				  <Route path="/chat/*" element={<UserProviderWrapper />}>
          <Route path=":channelId" element={<ChatPage />} />
        </Route>
        <Route
          path="*"
          element={
            <p style={{ padding: "20px", color: "red" }}>
              404 - Page Not Found
            </p>
          }
        />
      </Routes>
    </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;

const UserProviderWrapper = () => {
  return (
    <UserProvider>
      <ChatLayout />
      {/* <Outlet /> */}
    </UserProvider>
  );
};
