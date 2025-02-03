// import React from 'react';
// import { Link, Outlet } from 'react-router-dom'; // Use Link for navigation between chat routes

import { Outlet } from "react-router-dom";
import ConversationList from "../ConversationList";
import exp from "constants";
import { CreateNewDm } from "../create-new-dm";
import { CreateNewGroup } from "../create-new-groupp";
import { UserPayload, useUserContext } from "../../../context";
import { JoinGroup } from "../join-group";

// const ChatLayout = () => {
//   return (
//     <div className="flex h-screen">
//       {/* Left Sidebar */}
//       <div className="w-64 bg-gray-800 text-white p-4">
//         <h2 className="text-xl font-bold">Chats</h2>
//         <ul>
//           <li>
//             <Link to="/chat/1" className="block py-2 hover:bg-gray-700">Chat 1</Link>
//           </li>
//           <li>
//             <Link to="/chat/2" className="block py-2 hover:bg-gray-700">Chat 2</Link>
//           </li>
//           <li>
//             <Link to="/chat/3" className="block py-2 hover:bg-gray-700">Chat 3</Link>
//           </li>
//           {/* Add more chat links here */}
//         </ul>
//       </div>

//       {/* Main Content Area (where chat content will be displayed) */}
//       <div className="flex-1 bg-gray-900 text-white p-4">
//         <Outlet /> {/* This is where the selected chat will render */}
//       </div>
//     </div>
//   );
// };

// export default ChatLayout;

const ChatLayout = () => {
  const user: UserPayload = useUserContext();
  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <div className="bg-gray-900 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Chat Application</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
          <CreateNewDm />
          <CreateNewGroup />
		  <JoinGroup />
          <ConversationList />
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
