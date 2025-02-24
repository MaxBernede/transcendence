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
import TwoFA from "./pages/TwoFA";
import ChatPage from "./pages/chat/[id]";
import ChatLayout from "./pages/chat/chat-page";
import { UserProvider } from "./context";
import PongPage from "./game/PongPage";
import LoginPage from "./pages/login/page";
import { io, Socket } from "socket.io-client";
import EventsHandler from "./events/EventsHandler";

import { Toaster } from "./components/ui/sonner";

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
    fetchUserData(
      setUserData,
      setAchievements,
      setMatchHistory,
      setError,
      setLoading
    );
  }, []);

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // const newSocket = io("http://localhost:3000/events", {
    //   withCredentials: true,
    // });
    // setSocket(newSocket);
    // console.log("Connected to the socket");

    // newSocket.on("serverToClientEvents", (data: any) => {
    //   console.log("Received data from the server:", data);
    // });

    // return () => {
    //   console.log("Cleaning up socket connection");
    //   newSocket.disconnect();
    // };

    const eventsHandler = EventsHandler.getInstance();
    // const handleServerEvent = (data: any) => {
    //   console.log("Received data from the server:", data);
    // };

    // eventsHandler.on("serverToClientEvents", handleServerEvent);

    // return () => {
    //   // Clean up the listener (socket connection remains active in EventsHandler)
    //   eventsHandler.off("serverToClientEvents", handleServerEvent);
    // };
  }, []);

  return (
    // <UserContext.Provider
    //   value={{
    //     userData,
    //     setUserData,
    //     loading,
    //     error,
    //     achievements,
    //     setAchievements,
    //     matchHistory,
    //     setMatchHistory,
    //   }}
    // >
    <BrowserRouter>
      <Toaster position="bottom-right" richColors />

      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user/:id" element={<UserPage />} />
        <Route path="/user/ProfileUpdate" element={<ProfileUpdate />} />
        <Route path="/2FA" element={<TwoFactorAuth />} />
        <Route path="/TwoFA" element={<TwoFA />} />
        <Route path="/pong" element={<PongPage />} />
        <Route path="/login" element={<LoginPage />} />
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
    // </UserContext.Provider>
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
