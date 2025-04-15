// import { Outlet } from "react-router-dom";
// import ConversationList from "../ConversationList";
// import { CreateNewDm } from "../create-new-dm";
// import { CreateNewGroup } from "../create-new-groupp";
// import { UserPayload, useUserContext } from "../../../context";
// import { JoinGroup } from "../join-group";

// const ChatPage = () => {
//   const me: UserPayload = useUserContext();
//   return (
//     <div className="h-screen flex flex-col">
//       <div className="bg-gray-900 text-white p-4 shadow-md">
//         <h1 className="text-xl font-bold">Chat Application</h1>
//       </div>

//       <div className="flex flex-1 overflow-hidden">
//         <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
//           <CreateNewDm />
//           <CreateNewGroup />
//           <JoinGroup />
//           <ConversationList />
//         </div>

//         <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;

import { Outlet } from "react-router-dom";
import ConversationList from "../../components/chat/conversation-list";
import { CreateNewDm } from "../../components/chat/create-new-dm";
import { CreateNewGroup } from "../../components/chat/create-new-groupp";
import { UserPayload, useUserContext } from "../../context";
import { JoinGroup } from "../../components/chat/join-group";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface ChatContext {
  socket: Socket | null;
  me: UserPayload; // Adjust `UserPayload` type based on your user object
}

const ChatPage = () => {
  const me: UserPayload = useUserContext();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log("ChatPage init, me: ", me);

    const initializeSocket = () => {
      try {
        const newSocket = io("http://localhost:3000/chat", {
          withCredentials: true,
        });
        setSocket(newSocket);
        console.log("Socket connected successfully");
      } catch (error) {
        console.error("Error while initializing socket: ", error);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.close(); // Clean up the socket connection on unmount
        console.log("Socket connection closed");
      }
    };
  }, []); // Only run this effect once, when the component mounts

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-900 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Chat Application</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            <CreateNewDm />
            <CreateNewGroup />
            <JoinGroup />
          </div>
          <div>
            <ConversationList />
          </div>
        </div>

        <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
          {/* Pass the socket connection as a prop to the child components */}
          <Outlet context={{ socket }} />
          {/* <Outlet context={{ me }} /> */}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
