import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { PublicUserInfo } from "./types";

import { Crown, ShieldCheck } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { UserPayload, useUserContext } from "../../context";
import axios from "axios";
import EventsHandler from "@/events/EventsHandler";

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
  // Find the current user's role from participants
  const currentUser = participants.find((p) => p.id === user.id);
  const currentUserRole = currentUser ? currentUser.groupRole : "MEMBER"; // Default to MEMBER

  return (
    <div className="space-y-2 text-left min-w-[300px]">
      <h2 className="text-lg font-bold text-gray-300">
        MEMBERS - {participants.length}
      </h2>

      {participants.map((participant) => (
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

                <div className="ml-3 flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {participant.username}
                  </span>
                  {participant.groupRole === "OWNER" && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                  {participant.groupRole === "ADMIN" && (
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            </Card>
          </ContextMenuTrigger>

          <ContextMenuContent className="bg-slate-900 border-none">
            <ContextMenuItem className="hover:bg-slate-600">
              Profile
            </ContextMenuItem>
            <ContextMenuItem className="hover:bg-slate-600">
              Settings
            </ContextMenuItem>

            {/* Role-based options */}
            {currentUserRole === "OWNER" &&
              participant.groupRole === "MEMBER" && (
                <ContextMenuItem
                  onClick={() => promoteToAdmin(participant.id)}
                  className="hover:bg-slate-600"
                >
                  Promote to Admin
                </ContextMenuItem>
              )}

            {currentUserRole === "OWNER" &&
              participant.groupRole === "ADMIN" && (
                <>
                  <ContextMenuItem
                    onClick={() => promoteToOwner(participant.id)}
                    className="hover:bg-slate-600"
                  >
                    Promote to Owner
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => demoteToMember(participant.id)}
                    className="hover:bg-slate-600"
                  >
                    Demote to Member
                  </ContextMenuItem>
                </>
              )}

            {currentUserRole === "ADMIN" &&
              participant.groupRole === "MEMBER" && (
                <ContextMenuItem
                  onClick={() => promoteToAdmin(participant.id)}
                  className="hover:bg-slate-600"
                >
                  Promote to Admin
                </ContextMenuItem>
              )}

            {/* Owner cannot be changed */}
            {currentUserRole !== "OWNER" ||
            participant.groupRole !== "OWNER" ? (
              <ContextMenuItem
                onClick={() =>
                  removeUserFromGroup(participant.id, conversationId)
                }
                className="text-red-500 hover:bg-slate-600"
              >
                Remove from group
              </ContextMenuItem>
            ) : null}
          </ContextMenuContent>
        </ContextMenu>
      ))}
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

// Placeholder functions for role changes
const promoteToAdmin = (userId: number) => {
  console.log(`Promoting user ${userId} to ADMIN`);
};

const promoteToOwner = (userId: number) => {
  console.log(`Promoting user ${userId} to OWNER`);
};

const demoteToMember = (userId: number) => {
  console.log(`Demoting user ${userId} to MEMBER`);
};
