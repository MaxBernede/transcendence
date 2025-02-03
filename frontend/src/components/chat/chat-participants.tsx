// // ChannelParticipants.tsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { PublicUserInfo } from "./types";
// import { DmParticipants } from "./chat-participants-dm"; // We'll create this next
// import { GroupParticipants } from "./chat-participants-group";

// interface ChannelParticipantsProps {
//   channelId: string;
//   currentUserId: number;
// }

// const ChannelParticipants: React.FC<ChannelParticipantsProps> = ({
//   channelId,
//   currentUserId,
// }) => {
//   const [participants, setParticipants] = useState<PublicUserInfo[]>([]);
//   const [conversationType, setConversationType] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(true);

//   // Fetch participants from the backend
//   useEffect(() => {
//     const fetchParticipants = async () => {
//       try {
//         const response = await axios.get(
//           `http://localhost:3000/conversations/${channelId}/participants`,
//           {
//             withCredentials: true,
//           }
//         );
//         const data = response.data;

// 		console.log(data);
//         // Assuming the response has the same shape as the data provided
//         const formattedParticipants: PublicUserInfo[] = data.participants.map(
//           (participant: any) => ({
//             id: participant.id,
//             username: participant.username,
//             avatar: participant.avatar,
//             createdAt: participant.created_at,
//             wins: participant.wins,
//             losses: participant.loose,
//             ladderLevel: participant.ladder_level,
// 			groupRole: participant.group_role,
//           })
//         );

//         setParticipants(formattedParticipants);
//         setConversationType(data.conversationType);
//       } catch (error) {
//         console.error("Error fetching participants:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchParticipants();
//   }, [channelId]);

//   if (loading) return <div>Loading...</div>;

//   return (
//     <div>
//       {conversationType === "DM" ? (
//         <DmParticipants
//           participants={participants}
//           currentUserId={currentUserId}
//         />
//       ) : (
//         // <div>Group component will go here (for later).</div>
// 		<GroupParticipants
//           participants={participants}
//           currentUserId={currentUserId}
// 		  conversationId={channelId}
//         />
//       )}
//     </div>
//   );
// };

// export default ChannelParticipants;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { PublicUserInfo } from "./types";
import { DmParticipants } from "./chat-participants-dm";
import { GroupParticipants } from "./chat-participants-group";
import EventsHandler from "../../events/EventsHandler"; // Import the event handler singleton

interface ChannelParticipantsProps {
  channelId: string;
  currentUserId: number;
}

const ChannelParticipants: React.FC<ChannelParticipantsProps> = ({
  channelId,
  currentUserId,
}) => {
  const [participants, setParticipants] = useState<PublicUserInfo[]>([]);
  const [conversationType, setConversationType] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch participants from the backend
  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/conversations/${channelId}/participants`,
        {
          withCredentials: true,
        }
      );
      const data = response.data;

      console.log(data);
      const formattedParticipants: PublicUserInfo[] = data.participants.map(
        (participant: any) => ({
          id: participant.id,
          username: participant.username,
          avatar: participant.avatar,
          createdAt: participant.created_at,
          wins: participant.wins,
          losses: participant.loose,
          ladderLevel: participant.ladder_level,
          groupRole: participant.group_role,
        })
      );

      setParticipants(formattedParticipants);
      setConversationType(data.conversationType);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchParticipants();
  }, [channelId]);

  // Listen for participant removal event
  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();

    const handleUserRemoved = (data: any) => {
      console.log("USER_REMOVED_FROM_CHAT received:", data);

      if (data.id === channelId) {
        // Remove the user from participants list if they exist
        setParticipants((prev) =>
          prev.filter((participant) => participant.id !== data.userId)
        );
      }
    };

    eventsHandler.on("USER_REMOVED_FROM_CHAT", handleUserRemoved);

    return () => {
      eventsHandler.off("USER_REMOVED_FROM_CHAT", handleUserRemoved);
    };
  }, [channelId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {conversationType === "DM" ? (
        <DmParticipants
          participants={participants}
          currentUserId={currentUserId}
        />
      ) : (
        <GroupParticipants
          participants={participants}
          currentUserId={currentUserId}
          conversationId={channelId}
        />
      )}
    </div>
  );
};

export default ChannelParticipants;
