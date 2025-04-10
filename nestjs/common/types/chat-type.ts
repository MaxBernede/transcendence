



// type PublicUserInfoDto = { id: number; username: string; avatar: string };
// type GameInviteData = {
//   gameId: string;
//   status: 'PENDING' | 'COMPLETED';
//   inviterUsername: string;
//   invitedUserId: number;
//   invitedUsername: string;
//   inviteId: string;
//   scoreInviter: number;
//   scoreInvited: number;
// };

// interface Message {
//   id: string;
//   text: string;
//   timestamp: string;
//   type: 'TEXT' | 'GAME_INVITE';
//   gameInviteData: GameInviteData | null;
//   senderUser: PublicUserInfoDto;
// }

// User information that's safe to share publicly
export type PublicUserInfoDto = { 
	userId: number; 
	username: string; 
	avatar: string;
  };
  
  // Game invite specific data
  export type GameInviteData = {
	gameId: string;
	status: 'PENDING' | 'COMPLETED';
	
	// Clearer naming to avoid confusion
	creatorUsername: string;
	creatorUserId: number;

	recipientUserId: number;
	recipientUsername: string;
	
	creatorScore: number;
	recipientScore: number;
	winnerUsername: string;
  };
  
  // Message interface containing all message properties
  export interface Message {
	id: string;
	text: string;
	createdAt: string;
	type: 'TEXT' | 'GAME_INVITE';
	gameInviteData?: GameInviteData; // Optional game invite data
	senderUser: PublicUserInfoDto;
	edited: boolean; // Flag indicating if message was edited
  }