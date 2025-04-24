import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Message } from "@/common/types/chat-type";
import { Crown, Skull } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameInviteMessageProps {
  messageObject: Message;
  currentUserId: number;
}

const GameInviteMessage: React.FC<GameInviteMessageProps> = ({
  messageObject,
  currentUserId,
}) => {
  // Destructure the gameInviteData
  const gameInvite = messageObject.gameInviteData;
  const navigate = useNavigate();

  if (!gameInvite) {
    return null; // Return nothing if no game invite data
  }

  const isCreator: boolean = gameInvite.creatorUserId === currentUserId;
  const isRecipient: boolean = gameInvite.recipientUserId === currentUserId;
  const isParticipant: boolean = isCreator || isRecipient;

  const isGameCompleted: boolean = gameInvite.status === "COMPLETED";
  const isGamePending: boolean = gameInvite.status === "PENDING";
  // const isCreatorWinner: boolean =
  //   gameInvite.creatorScore > gameInvite.recipientScore;

  const { creatorUsername, recipientUsername, creatorUserId, recipientUserId } = gameInvite;

  const leftUserId = currentUserId;
  const rightUserId = currentUserId === creatorUserId ? recipientUserId : creatorUserId;
  
  const leftUsername = currentUserId === creatorUserId ? creatorUsername : recipientUsername;
  const rightUsername = currentUserId === creatorUserId ? recipientUsername : creatorUsername;
  
  const leftIsWinner = gameInvite.winnerUsername === leftUsername;
  const rightIsWinner = gameInvite.winnerUsername === rightUsername;
  
  const leftIsCurrentUser = true;
  const rightIsCurrentUser = false;
  
  // Fix the scores regardless of who created the invite
  const winnerScore = Math.max(gameInvite.creatorScore, gameInvite.recipientScore);
  const loserScore = Math.min(gameInvite.creatorScore, gameInvite.recipientScore);
  
  const leftScore = leftIsWinner ? winnerScore : loserScore;
  const rightScore = rightIsWinner ? winnerScore : loserScore;
  

  const handleJoinGame = () => {
    // console.log("Join game with ID:", gameInvite.gameId);
    //TODO: redirect to game page with dynamic id and validate that the user is part of the gameId else redirect to somewhere idk

    // redirect to the game page
    navigate(`/pong/${gameInvite.gameId}`);
  };

  return (
    <Card className="w-full p-3 py-1 rounded-lg border-none bg-gray-900 shadow-none flex flex-col justify-start">
      <div className="text-center p-2">
        {/* Game Title */}
        <div className="text-yellow-400 text-sm mb-2">PONG CHALLENGE</div>

        {/* Player names with CENTERED VS and fixed spacing */}
        <div className="relative flex justify-center mb-2">
          {/* Center VS absolutely */}
          <div className="absolute left-1/2 transform -translate-x-1/2 bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs z-10">
            VS
          </div>

          {/* Player names with fixed spacing */}
          <div className="flex justify-center w-full items-center">
            <div
              className={`flex items-center justify-end flex-1 max-w-[45%] pr-5 ${
                isGameCompleted
                  ? leftIsWinner
                    ? "text-green-500"
                    : "text-red-500"
                  : "text-blue-400"}
                `}
            >
              {/* {leftUsername === gameInvite.creatorUsername && isCreator
                ? "You"
                : leftUsername} */}
              {leftIsCurrentUser ? "You" : leftUsername}
              {isGameCompleted &&
                (leftIsWinner ? (
                  <Crown className="w-4 h-4 ml-1 text-yellow-400" />
                ) : (
                  <Skull className="w-4 h-4 ml-1" />
                ))}
            </div>
            <div className="invisible px-2">VS</div>{" "}
            {/* Invisible placeholder */}
            <div
              className={`flex items-center justify-start flex-1 max-w-[45%] pl-5 ${
                isGameCompleted
                  ? rightIsWinner
                    ? "text-green-500"
                    : "text-red-500"
                  : "text-blue-400"}
                `}
            >
              {rightIsCurrentUser ? "You" : rightUsername}
              {isGameCompleted &&
                (rightIsWinner ? (
                  <Crown className="w-4 h-4 ml-1 text-yellow-400" />
                ) : (
                  <Skull className="w-4 h-4 ml-1" />
                ))}
            </div>
          </div>
        </div>

        {/* Game Status */}
        {/* {isGameCompleted && (
          <div>
            <div className="flex justify-center items-center gap-2 mb-1">
              <span
                className={isCreatorWinner ? "text-green-500" : "text-red-500"}
              >
                {gameInvite.creatorScore}
              </span>
              <span className="text-gray-500">-</span>
              <span
                className={!isCreatorWinner ? "text-green-500" : "text-red-500"}
              >
                {gameInvite.recipientScore}
              </span>
            </div>
          </div>
        )} */}


        {isGameCompleted && (
          <div>
            <div className="flex justify-center items-center gap-2 mb-1">
              <span className={leftIsWinner ? "text-green-500" : "text-red-500"}>
                {leftScore}
              </span>
              <span className="text-gray-500">-</span>
              <span className={rightIsWinner ? "text-green-500" : "text-red-500"}>
                {rightScore}
              </span>
            </div>
          </div>
        )}


        {isGamePending && isParticipant && (
          <div className="mt-2">
            <Button
              onClick={handleJoinGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1"
            >
              Join Game
            </Button>
          </div>
        )}

        {!isGameCompleted && !isGamePending && (
          <div className="text-gray-400 text-sm">Game in progress</div>
        )}
      </div>
    </Card>
  );
};

export default GameInviteMessage;
