import React, { useState, useEffect, createContext, ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UserPage from "./pages/Userpage";
import "./styles/App.css";
import Navbar from "./components/Navbar";
import ProfileUpdate from "./pages/user/ProfileUpdate";
import { fetchUserData, UserData } from "./utils/UserLogic";
import TwoFactorAuth from "./components/2FA/2FA";
import ChatPage from "./pages/chat/[id]";
import ChatLayout from "./pages/chat/chat-page";
import { UserProvider } from "./context";
import Friends from "./pages/Friends";
import PongPage from "./game/PongPage";
import { Socket } from "socket.io-client";
import EventsHandler from "./events/EventsHandler";

import { Toaster } from "./components/ui/sonner";
import TwoFASetup from "./pages/login/2FASetup";

interface UserContextWrapperProps {
  children: ReactNode;
}

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
  const [matchHistory, setMatchHistory] = useState<any[]>([]); // Default as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!userData) {
      // Only fetch data if not already fetched
      fetchUserData(setUserData, setMatchHistory, setError, setLoading);
    }
  }, [userData]); // Runs only when `userData` is not availables

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();
	console.log("BACKEND URL", process.env.REACT_APP_BACKEND_IP);
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
          <Route path="/2FASetup" element={<TwoFASetup />} />
          {/* Public Pong and Private Pong Room */}
          {/* <Route path="/pong">
            <Route index element={<PongPage />} />
            <Route path="/pong/:roomId" element={<PongPage />} />
          </Route> */}
          <Route path="/pong">
            <Route
              index
              element={
                <UserContextWrapper>
                  <PongPage />
                </UserContextWrapper>
              }
            />
            <Route
              path="/pong/:roomId"
              element={
                <UserContextWrapper>
                  <PongPage />
                </UserContextWrapper>
              }
            />
          </Route>
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

const UserContextWrapper = ({ children }: UserContextWrapperProps) => {
	return (
	  <UserProvider>
		{children}
	  </UserProvider>
	);
  };