import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UserPage from "./pages/Userpage";
import Creation from "./components/Creation";
import "./styles/App.css";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import ChatPage from "./pages/chat/chat-page";
import ChatLayout from "./components/chat/layout/chatList";
import LoginPage from "./pages/login/page";
import { UserProvider } from "./context";

// import "./styles/globals.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user/:id" element={<UserPage />} />
        {/* <Route path="/chat/" element={<Chat />} /> */}
        {/* <Route path="/chat/:conversationId" element={<ChatLayout />}>
          <Route path=":channelId" element={<Chat />} />
        </Route> */}

        <Route path="/login" element={<LoginPage />} />

        {/* <UserContext.Provider value={} */}

        {/* Only wrap /chat route with UserProvider */}
        <Route path="/chat/*" element={<UserProviderWrapper />}>
          <Route path=":channelId" element={<ChatPage />} />
        </Route>

        <Route
          path="/creation"
          element={<Creation setLoggedIn={setLoggedIn} setEmail={setEmail} />}
        />
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
  );
}

export default App;

const UserProviderWrapper = () => {
  return (
    <UserProvider>
      <ChatLayout />
    </UserProvider>
  );
};
