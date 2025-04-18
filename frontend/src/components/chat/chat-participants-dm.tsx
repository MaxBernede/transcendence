import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { PublicUserInfo } from "./types";
// import { CardContent } from "@mui/material";
import OnlineStatus from "../OnlineStatus";
import WinLossStatus from "../WinLossStatus";

interface DMComponentProps {
  participants: PublicUserInfo[];
  currentUserId: number;
}

export const DmParticipants: React.FC<DMComponentProps> = ({
  participants,
  currentUserId,
}) => {
  return (
    <div className="space-y-4">
      {participants
        .filter((participant) => participant.id !== currentUserId)
        .map((participant) => (
          <Card
            key={participant.id}
            className="flex flex-col items-center space-x-4 p-4 shadow-none min-w-[480] max-w-[20vw]"
          >
            <CardHeader className="flex items-center space-x-4">
              <Avatar className="w-64 h-64">
                <AvatarImage
                  src={participant.avatar}
                  alt={`${participant.username}'s avatar`}
                />
                <AvatarFallback>{participant.username[0]}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-4xl font-semibold py-5">
                {participant.username}
              </CardTitle>
            </CardHeader>
            <OnlineStatus isOnline={participant?.activity_status === true} />
            <WinLossStatus wins={participant.wins} losses={participant.losses} />
            {/* <CardContent className="text-sm text-center">
              TODO: Add user details here and a pong game invite button TODO:
              Add user details here and a pong game invite buttonTODO: Add user
              details here and a pong game invite button
            </CardContent> */}
          </Card>
        ))}
    </div>
  );
};
