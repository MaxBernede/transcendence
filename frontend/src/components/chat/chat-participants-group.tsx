import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { PublicUserInfo } from "./types";

import { Crown, ShieldCheck, Settings } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { useNavigate } from "react-router-dom";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { UserPayload, useUserContext } from "../../context";
import axios from "axios";
import EventsHandler from "../../events/EventsHandler";

import { toast } from "sonner";
import { set } from "zod";
import { MuteSelector } from "./chat-mute";
import { ChangePassword } from "./change-password";
import { BanSelector } from "./chat-ban";
interface DMComponentProps {
  participants: PublicUserInfo[];
  currentUserId: number;
  conversationId: string;
}

export const GroupParticipants: React.FC<DMComponentProps> = ({
  participants,
  currentUserId,
  conversationId,
}) => {
  const user: UserPayload = useUserContext();
  const navigate = useNavigate();
  console.log("user:", user);

  console.log("Participants:", participants);
  // Find the current user's role from participants
  const currentUser = participants.find((p) => p.id === user.id);
  console.log("Current user:", currentUser);
  const currentUserRole = currentUser ? currentUser.groupRole : "MEMBER"; // Default to MEMBER
  console.log("Current user role:", currentUserRole);

  const users = participants.filter((p) => !p.banned);
  const banned_users = participants.filter((p) => p.banned);

  const [renderMuteSelect, setRenderMuteSelect] = React.useState(false);
  const [renderBanSelect, setRenderBanSelect] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<PublicUserInfo | null>(
    null
  );
  const [showChangePassword, setShowChangePassword] = React.useState(false);

  const handleMute = (selectedUser: PublicUserInfo) => {
    console.log("Mute button clicked");
    setSelectedUser(selectedUser);
    setRenderMuteSelect(true);
  };

  const handleCloseMute = () => {
    setRenderMuteSelect(false);
  };

  const handleBan = (selectedUser: PublicUserInfo) => {
    console.log("Ban button clicked");
    setSelectedUser(selectedUser);
    setRenderBanSelect(true);
  };

  const handleCloseBan = () => {
    setRenderBanSelect(false);
  };
  

  const handleUnmute = async (userId: number) => {
    console.log("Unmuting user:", userId);
    try {
      const response = await axios.post(
        `http://localhost:3000/conversations/${conversationId}/users/${userId}/unmute`,
        {},
        { withCredentials: true }
      );

      console.log("User banned from group:", response.data);
    } catch (error) {
      console.error("Error banning user from group:", error);
    }
  };

  //   useEffect(() => {
  //     const eventsHandler = EventsHandler.getInstance();

  //     const handleRoleUpdate = async (data: any) => {
  //       console.log("GROUP_ROLE_UPDATED received in conversations-list:", data);

  //       //? data: { conversationId: "", memberId: 1, role: "ADMIN" }

  // 	  // Update the participants list

  //     };

  //     eventsHandler.on("GROUP_ROLE_UPDATED", handleRoleUpdate);

  //     return () => {
  //       eventsHandler.off("GROUP_ROLE_UPDATED", handleRoleUpdate);
  //     };
  //   }, []);

  const PromoteToModerator = async (userId: number) => {
    console.log(userId, "promoting to moderator");

    try {
      const response = await axios.post(
        `http://localhost:3000/conversations/update-role`,
        {
          conversationId: conversationId,
          memberId: userId,
          role: "ADMIN",
        },
        { withCredentials: true }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Failed to promote to moderator:", error.response?.data);
      } else {
        console.error("Failed to promote to moderator:", error);
      }
    }
  };

  const PromoteToOwner = async (userId: number) => {
    console.log(userId, "promoting to owner");

    try {
      const response = await axios.post(
        `http://localhost:3000/conversations/update-role`,
        {
          conversationId: conversationId,
          memberId: userId,
          role: "OWNER",
        },
        { withCredentials: true }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Failed to promote to moderator:", error.response?.data);
      } else {
        console.error("Failed to promote to moderator:", error);
      }
    }
  };

  const DemoteToMember = async (userId: number) => {
    console.log(userId, "demoting to member");

    try {
      const response = await axios.post(
        `http://localhost:3000/conversations/update-role`,
        {
          conversationId: conversationId,
          memberId: userId,
          role: "MEMBER",
        },
        { withCredentials: true }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Failed to promote to moderator:", error.response?.data);
      } else {
        console.error("Failed to promote to moderator:", error);
      }
    }
  };

  const NavigateToDM = async (username: string) => {
    console.log("Navigating to DM with user:", username);

    const newDmConversation = {
      type: "DM",
      participants: [username],
    };
    try {
      const { data } = await axios.post(
        "http://localhost:3000/conversations",
        newDmConversation,
        {
          withCredentials: true,
        }
      );
      navigate(`/chat/${data.id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Failed to navigate to DM:", error.response?.data);
      } else {
        console.error("Failed to navigate to DM:", error);
      }
    }
  };

  const handleInviteToPong = async (participant: PublicUserInfo) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/pong/createInvite",
        {
          username: participant.username,
          userId: participant.id,
          conversationId: conversationId,
        },
        { withCredentials: true }
      );
      console.log("Invite created:", response.data);
    } catch (error) {
      console.error("Failed to create invite:", error);
    }
  };

  const handleViewProfile = (username: string) => {
    navigate(`/user/${username}`);
  };

  return (
    <div className="space-y-2 text-left min-w-[300px]">
      <h2 className="text-lg font-bold text-gray-300 flex justify-between items-center">
        MEMBERS - {participants.length}
        {currentUserRole === "OWNER" && (
          <>
            <Settings 
              className="w-5 h-5 cursor-pointer hover:text-blue-500 transition-colors" 
              onClick={() => setShowChangePassword(true)}
            />
            {showChangePassword && (
              <ChangePassword 
                onClose={() => setShowChangePassword(false)} 
                conversationId={conversationId}
              />
            )}
          </>
        )}
      </h2>

      {users.map((participant) => (
        <ContextMenu key={participant.id}>
          <ContextMenuTrigger>
            <Card className="relative border-none shadow-none bg-transparent rounded-lg">
              <div className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-900 w-full">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={participant.avatar}
                    alt={`${participant.username}'s avatar`}
                  />
                </Avatar>

                {/* <div className="ml-3 flex items-center gap-2"> */}
                <div className="ml-3 flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {participant.username}
                  </span>
                  {participant.groupRole === "OWNER" && (
                    // <Crown className="w-5 h-5 text-yellow-500" />
                    <Badge
                      variant="outline"
                      className="text-yellow-400 border-yellow-400"
                    >
                      OWNER
                    </Badge>
                  )}
                  {participant.groupRole === "ADMIN" && (
                    // <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <Badge
                      variant="outline"
                      className="text-blue-400 border-blue-400"
                    >
                      MODERATOR
                    </Badge>
                  )}
                  {participant.groupRole === "MEMBER" && (
                    // <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <Badge variant="outline">MEMBER</Badge>
                  )}
                </div>
              </div>
            </Card>
          </ContextMenuTrigger>

          <ContextMenuContent className="bg-slate-900 border-none">
            <ContextMenuItem 
              onClick={() => handleViewProfile(participant.username)}
              className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md"
            >
              Profile
            </ContextMenuItem>
            {/* <ContextMenuItem
              onClick={() => NavigateToDM(participant.id)}
              className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md"
            >
              Message
            </ContextMenuItem> */}

            {user.id !== participant.id && (
              <>
                <ContextMenuItem
                  onClick={() => NavigateToDM(participant.username)}
                  className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md"
                >
                  Message
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleInviteToPong(participant)}
                  className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md"
                >
                  Invite to Pong
                </ContextMenuItem>
              </>
            )}

            {/* Role-based options */}
            {currentUserRole === "OWNER" &&
              participant.groupRole === "MEMBER" && (
                <ContextMenuItem
                  onClick={() => PromoteToModerator(participant.id)}
                  className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md"
                >
                  Promote to Moderator
                </ContextMenuItem>
              )}
            {currentUserRole === "OWNER" &&
              participant.groupRole === "ADMIN" && (
                <>
                  <ContextMenuItem
                    onClick={() => PromoteToOwner(participant.id)}
                    className="hover:bg-yellow-500 hover:text-white px-4 py-2 rounded-md"
                  >
                    Promote to Owner
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => DemoteToMember(participant.id)}
                    className="hover:bg-red-700 hover:text-white px-4 py-2 rounded-md"
                  >
                    Demote to Member
                  </ContextMenuItem>
                </>
              )}

            {currentUserRole === "ADMIN" &&
              participant.groupRole === "MEMBER" && (
                <>
                  <ContextMenuItem
                    onClick={() => handleMute(participant)}
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Mute
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() => handleUnmute(participant.id)}
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Unmute
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() =>
                      removeUserFromGroup(participant.id, conversationId)
                    }
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Kick
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() => handleBan(participant)}
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Ban
                  </ContextMenuItem>
                </>
              )}

            {currentUserRole === "OWNER" &&
              participant.groupRole !== "OWNER" && (
                <>
                  <ContextMenuItem
                    onClick={() => handleMute(participant)}
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Mute
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() => handleUnmute(participant.id)}
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Unmute
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() =>
                      removeUserFromGroup(participant.id, conversationId)
                    }
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Kick
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() => handleBan(participant)}
                    className="hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Ban
                  </ContextMenuItem>
                </>
              )}
          </ContextMenuContent>
        </ContextMenu>
      ))}
      {/* <h2 className="text-lg font-bold text-gray-300"> */}
      {banned_users.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-300">BANNED MEMBERS</h2>
          {banned_users.map((participant) => (
            <ContextMenu key={participant.id}>
              <ContextMenuTrigger>
                <Card
                  key={participant.id}
                  className="relative border-none shadow-none bg-transparent rounded-lg"
                >
                  <div className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-900 w-full opacity-60">
                    {/* Greyed-out Avatar */}
                    <Avatar className="w-12 h-12 grayscale opacity-50">
                      <AvatarImage
                        src={participant.avatar}
                        alt={`${participant.username}'s avatar`}
                      />
                    </Avatar>

                    <div className="ml-3 flex items-center gap-2">
                      {/* Greyed-out Username */}
                      <span className="font-semibold text-lg text-gray-500">
                        {participant.username}
                      </span>
                    </div>
                  </div>
                </Card>
              </ContextMenuTrigger>

              <ContextMenuContent className="bg-slate-900 border-none">
                <ContextMenuItem 
                  onClick={() => handleViewProfile(participant.username)}
                  className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md"
                >
                  Profile
                </ContextMenuItem>
                {user.id !== participant.id && (
                  <ContextMenuItem
                    onClick={() => NavigateToDM(participant.username)}
                    className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md"
                  >
                    Message
                  </ContextMenuItem>
                )}
                {(currentUserRole === "OWNER" ||
                  currentUserRole === "ADMIN") && (
                  <ContextMenuItem
                    className="hover:bg-red-700 hover:text-white px-4 py-2 rounded-md"
                    onClick={() =>
                      unbanUserFromGroup(participant.id, conversationId)
                    }
                  >
                    Unban
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}
      {renderMuteSelect && (
        <MuteSelector
          targetUser={selectedUser as PublicUserInfo}
          onClose={handleCloseMute}
          conversationId={conversationId}
        />
      )}
      {renderBanSelect && (
        <BanSelector
          targetUser={selectedUser as PublicUserInfo}
          onClose={handleCloseBan}
          conversationId={conversationId}
        />
      )}
    </div>
  );
};

const removeUserFromGroup = async (userId: number, conversationId: string) => {
  //   console.log(`Removing user ${userId} from group`);

  try {
    const response = await axios.delete(
      `http://localhost:3000/conversations/${conversationId}/users/${userId}`,
      { withCredentials: true } // Use an object for the second argument
    );

    console.log("User removed from group:", response.data);
  } catch (error) {
    console.error("Error removing user from group:", error);
  }
};

const banUserFromGroup = async (userId: number, conversationId: string) => {
  console.log(`Banning user ${userId} from group`);

  try {
    const response = await axios.post(
      `http://localhost:3000/conversations/${conversationId}/users/${userId}/ban`,
      {},
      { withCredentials: true }
    );

    console.log("User banned from group:", response.data);
  } catch (error) {
    console.error("Error banning user from group:", error);
  }
};

const unbanUserFromGroup = async (userId: number, conversationId: string) => {
  console.log(`Banning user ${userId} from group`);

  try {
    const response = await axios.post(
      `http://localhost:3000/conversations/${conversationId}/users/${userId}/unban`,
      {},
      { withCredentials: true }
    );

    console.log("User banned from group:", response.data);
  } catch (error) {
    console.error("Error banning user from group:", error);
  }
};

// Placeholder functions for role changes
// const promoteToAdmin = (userId: number) => {
//   console.log(`Promoting user ${userId} to ADMIN`);

//   try {
//     // const response = await axios.post(
//     //   `http://localhost:3000/conversations/${conversationId}/users/${userId}/promote`,
//     //   { withCredentials: true }
//     // );
//   } catch {}
// };

// const promoteToOwner = (userId: number) => {
//   console.log(`Promoting user ${userId} to OWNER`);
// };

// const demoteToMember = (userId: number) => {
//   console.log(`Demoting user ${userId} to MEMBER`);
// };
