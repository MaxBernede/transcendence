// import { Outlet } from "react-router-dom";
// import ConversationList from "../ConversationList";
// import { CreateNewDm } from "../create-new-dm";
// import { CreateNewGroup } from "../create-new-groupp";
// import { UserPayload, useUserContext } from "../../../context";
// import { JoinGroup } from "../join-group";

// const ChatLayout = () => {
//   const user: UserPayload = useUserContext();
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

// export default ChatLayout;

import { Outlet } from "react-router-dom";
import ConversationList from "../ConversationList";
import { CreateNewDm } from "../create-new-dm";
import { CreateNewGroup } from "../create-new-groupp";
import { UserPayload, useUserContext } from "../../../context";
import { JoinGroup } from "../join-group";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";


const ChatLayout = () => {
  const user: UserPayload = useUserContext();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3000/chat", { withCredentials: true });
    setSocket(newSocket);

    return () => {
      newSocket.close(); // Clean up the socket connection on unmount
    };
  }, []); // Only run this effect once, when the component mounts

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-900 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Chat Application</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
          <CreateNewDm />
          <CreateNewGroup />
          <JoinGroup />
          <ConversationList />
        </div>

        <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
          {/* Pass the socket connection as a prop to the child components */}
          <Outlet context={{ socket }} />
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
