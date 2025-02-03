// import React, { useEffect, useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate for redirection
// import { Avatar, AvatarImage } from "../ui/avatar";
// import { Card, CardContent, CardTitle } from "../ui/card";
// import axios from "axios";
// import LoginButton from "../Loginbutton";
// import { CreateNewDm } from "./create-new-dm";
// import { CreateNewGroup } from "./create-new-groupp";

// import { Users } from "lucide-react";

// const ConversationList = () => {
//   const location = useLocation(); // Get the current location (URL)
//   const history = useNavigate(); // Used for redirection
//   const [conversations, setConversations] = useState<any[]>([]);
//   const [isUnauthorized, setIsUnauthorized] = useState(false); // State to handle unauthorized

//   useEffect(() => {
//     const fetchConversations = async () => {
//       try {
//         const response = await axios.get(
//           "http://localhost:3000/conversations",
//           {
//             withCredentials: true,
//           }
//         );
//         console.log("Response data:", response.data);

//         // Directly set the response data
//         setConversations(response.data);
//       } catch (error: any) {
//         if (error.response && error.response.status === 401) {
//           // If 401 Unauthorized, update the state to show login prompt
//           // redirect to /chat

//           setIsUnauthorized(true);
//         } else {
//           console.error("Error fetching conversations:", error);
//         }
//       }
//     };

//     fetchConversations();
//   }, []);

//   const handleLogin = async () => {
//     const currentPath = window.location.pathname; // Get the path after localhost
//     const redirectUrl = encodeURIComponent(currentPath); // Ensure the path is URL encoded
//     console.log("Redirect URL:", redirectUrl);
//     try {
//       //TODO: add api query param for custom redirect
//       const response = await axios.get("http://localhost:3000/auth/", {
//         //Auth will call the getAuth
//         withCredentials: true, // Include cookies (not necessary)
//       });
//       console.log("Response:", response.data);
//       window.location.href = response.data.url; // Redirect toward the login page if necessary
//     } catch (error) {
//       console.error("Error in the connection:", error);
//       alert("Error in the connection process");
//     }
//   };

//   if (isUnauthorized) {
//     // If unauthorized, render a login page or redirect
//     return (
//       //TODO: replace 128 with a variable representing the height of the navbar
//       <div className="h-[calc(100vh-128px)] flex flex-col items-center justify-center bg-transparent text-white">
//         <div className="text-center mb-8">
//           <h2 className="text-3xl font-bold mb-4">
//             You must be logged in to access the chat
//           </h2>
//           <p className="text-lg mb-4">
//             Please{" "}
//             <span
//               onClick={handleLogin}
//               className="cursor-pointer text-blue-500 underline"
//             >
//               log in
//             </span>{" "}
//             to continue.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {conversations.map((conversation) => {
//         let participant = conversation.participants[0];
//         //   const participant = conversation.participants[0]; // Assume the first participant is relevant
//         const isSelected =
//           location.pathname === `/chat/${conversation.conversationId}`;

//         return (
//           <Link
//             to={`/chat/${conversation.conversationId}`}
//             key={conversation.conversationId}
//             className={`block rounded-lg p-2 ${
//               isSelected ? "bg-gray-900" : "hover:bg-gray-900"
//             }`}
//           >
//             <Card
//               className={`flex items-center space-x-2 border-none shadow-none bg-transparent ${
//                 isSelected ? "bg-gray-900" : "bg-transparent"
//               }`}
//             >
//               {/* Avatar */}
//               <Avatar className="w-12 h-12">
//                 {conversation.type === "GROUP" ? (
//                   <Users className="w-12 h-12 text-gray-500" />
//                 ) : (
//                   <AvatarImage
//                     src={participant.avatar}
//                     alt={`${participant.username}'s avatar`}
//                   />
//                 )}
//               </Avatar>
//               <div className="flex flex-col">
//                 <span className="font-semibold text-xl ml-4">
//                   {conversation.type === "DM"
//                     ? participant.username || "Unknown User"
//                     : conversation.name || "Group Name"}
//                 </span>
//               </div>
//             </Card>
//           </Link>
//         );
//       })}
//     </div>
//   );
// };

// export default ConversationList;

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate for redirection
import { Avatar, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardTitle } from "../ui/card";
import axios from "axios";
import LoginButton from "../Loginbutton";
import { CreateNewDm } from "./create-new-dm";
import { CreateNewGroup } from "./create-new-groupp";
import { Users } from "lucide-react";
import EventsHandler from "../../events/EventsHandler";
// import EventsHandler from "../utils/eventsHandler"; // Import the EventsHandler class
enum EventType {
  USER_ADDED_TO_CHAT = "USER_ADDED_TO_CHAT",
}

const ConversationList = () => {
  const location = useLocation(); // Get the current location (URL)
  const history = useNavigate(); // Used for redirection
  const [conversations, setConversations] = useState<any[]>([]);
  const [isUnauthorized, setIsUnauthorized] = useState(false); // State to handle unauthorized

  const fetchConversations = async () => {
    try {
      const response = await axios.get("http://localhost:3000/conversations", {
        withCredentials: true,
      });
      console.log("Response data:", response.data);
      // Directly set the response data
      setConversations(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // If 401 Unauthorized, update the state to show login prompt
        setIsUnauthorized(true);
      } else {
        console.error("Error fetching conversations:", error);
      }
    }
  };

  useEffect(() => {
    // Fetch conversations when component mounts
    fetchConversations();

    // Listen for the USER_ADDED_TO_CHAT event
    const eventsHandler = EventsHandler.getInstance(); // Get the singleton instance

    // Set up listener for the custom event
    eventsHandler.on("USER_ADDED_TO_CHAT", (data: any) => {
      console.log("USER_ADDED_TO_CHAT received:", data);
      // Trigger a re-fetch of conversations after a new user is added to a chat
      fetchConversations();
    });

    // Cleanup the listener when the component unmounts
    return () => {
      eventsHandler.off("USER_ADDED_TO_CHAT"); // Remove the listener
    };
  }, []); // Empty dependency array ensures this only runs once when the component mounts

  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();

    eventsHandler.on("USER_REMOVED_FROM_CHAT", (data: any) => {
      console.log("USER_REMOVED_FROM_CHAT received: ", data);

      fetchConversations();
    });

    return () => {
      eventsHandler.off("USER_REMOVED_FROM_CHAT");
    };
  });

  const handleLogin = async () => {
    const currentPath = window.location.pathname; // Get the path after localhost
    const redirectUrl = encodeURIComponent(currentPath); // Ensure the path is URL encoded
    console.log("Redirect URL:", redirectUrl);
    try {
      //TODO: add api query param for custom redirect
      const response = await axios.get("http://localhost:3000/auth/", {
        withCredentials: true, // Include cookies (not necessary)
      });
      console.log("Response:", response.data);
      window.location.href = response.data.url; // Redirect toward the login page if necessary
    } catch (error) {
      console.error("Error in the connection:", error);
      alert("Error in the connection process");
    }
  };

  if (isUnauthorized) {
    // If unauthorized, render a login page or redirect
    return (
      <div className="h-[calc(100vh-128px)] flex flex-col items-center justify-center bg-transparent text-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            You must be logged in to access the chat
          </h2>
          <p className="text-lg mb-4">
            Please{" "}
            <span
              onClick={handleLogin}
              className="cursor-pointer text-blue-500 underline"
            >
              log in
            </span>{" "}
            to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        let participant = conversation.participants[0];
        const isSelected =
          location.pathname === `/chat/${conversation.conversationId}`;

        return (
          <Link
            to={`/chat/${conversation.conversationId}`}
            key={conversation.conversationId}
            className={`block rounded-lg p-2 ${
              isSelected ? "bg-gray-900" : "hover:bg-gray-900"
            }`}
          >
            <Card
              className={`flex items-center space-x-2 border-none shadow-none bg-transparent ${
                isSelected ? "bg-gray-900" : "bg-transparent"
              }`}
            >
              {/* Avatar */}
              <Avatar className="w-12 h-12">
                {conversation.type === "GROUP" ? (
                  <Users className="w-12 h-12 text-gray-500" />
                ) : (
                  <AvatarImage
                    src={participant.avatar}
                    alt={`${participant.username}'s avatar`}
                  />
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-xl ml-4">
                  {conversation.type === "DM"
                    ? participant.username || "Unknown User"
                    : conversation.name || "Group Name"}
                </span>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default ConversationList;
