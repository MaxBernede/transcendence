import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from './pong.service';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../user/user.service';
import { CreatePongDto } from './dto/create_pong.dto';
import { MatchService } from '../match/match.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt/ws-jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat, ChatGameInvite } from '@/conversations/entities';
import { Repository } from 'typeorm';

export const players = new Map<
  string,
  { username: string; playerNumber: number }
>();
interface WaitingPlayer {
  userId: number;
  username: string;
  socketId: string;
  playerNumber: number;
}

type Room = {
  player1: WaitingPlayer;
  player2: WaitingPlayer;
};

const waitingQueue: WaitingPlayer[] = [];

const activeRooms = new Map<
  string,
  { player1: WaitingPlayer; player2: WaitingPlayer }
>();
const userIdToSocketId = new Map<string, string>();
const connectedUsers = new Map<number, Socket>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();
// const privateRooms = new Map<string, WaitingPlayer[]>(); // roomId → players[]
const privateRooms = new Map<string, number[]>(); // roomId , allowedUserIds
// Add a new map to track user roles in games
const roomUserRoles = new Map<string, { creator: number; invited: number }>();

// @WebSocketGateway({ namespace: 'pong', cors: { origin: '*' } })
@WebSocketGateway({ namespace: 'pong', cors: { origin: true } })
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly pongService: PongService,
    private readonly userService: UserService,
    private readonly matchService: MatchService,

    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatGameInvite)
    private readonly chatGameInviteRepository: Repository<ChatGameInvite>,
  ) {}

  private socketToUser: Map<string, number> = new Map();
  private userToRoom: Map<number, string> = new Map();
  private userInGame: Set<number> = new Set();
  private roomToUsers: Map<string, { id: number; username: string }[]> =
    new Map();

  afterInit(server: Server) {
    this.server = server;
    console.log('webSocket Server initialized');
  }

  private getSocket(clientId: string): Socket | null {
    const socketsMap = this.server?.sockets?.sockets;
    return socketsMap?.get(clientId) ?? null;
  }

  private async waitForSocketsMap(
    maxRetries = 20,
    delay = 200,
  ): Promise<Map<string, Socket> | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const socketsMap = this.server?.sockets?.sockets;
      if (socketsMap && socketsMap.size > 0) return socketsMap;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return null;
  }

  private emitPlayerInfoForRoom(roomId: string) {
    const room = activeRooms.get(roomId);
    if (!room) {
      console.warn(
        `emitPlayerInfoForRoom called for non-existent room ${roomId}`,
      );
      return;
    }

    const socket1 = connectedUsers.get(room.player1.userId);
    const socket2 = connectedUsers.get(room.player2.userId);

    const playerInfo = [
      { username: room.player1.username, playerNumber: 1 },
      { username: room.player2.username, playerNumber: 2 },
    ];

    socket1?.emit('playerInfo', playerInfo);
    socket2?.emit('playerInfo', playerInfo);
  }



  private async tryMatchPlayers() {
    while (waitingQueue.length >= 2) {
		console.log("waitingqueue: ", waitingQueue);
      const player1 = waitingQueue.shift()!;
      const player2 = waitingQueue.shift()!;

	  player1.playerNumber = 1;
	  player1.playerNumber = 2;

	  console.log("waitingqueue after: ", waitingQueue);

      const socket1 = connectedUsers.get(player1.userId);
      const socket2 = connectedUsers.get(player2.userId);

      if (!socket1 || !socket2) {
        if (socket1 && !waitingQueue.some((p) => p.userId === player1.userId)) {
          waitingQueue.unshift(player1);
		  console.log("unshift:" ,player1.username);
        }
        if (socket2 && !waitingQueue.some((p) => p.userId === player2.userId)) {
          waitingQueue.unshift(player2);
		  console.log("unshift:" ,player2.username);

        }
        continue;
      }

      const roomId = `room-${uuidv4()}`;
      activeRooms.set(roomId, { player1, player2 });
     
      this.pongService.addPlayersToRoom(roomId, player1, player2);

      this.pongService['rooms'].set(roomId, {
        player1: player1.userId,
        player2: player2.userId,
      });

      await socket1.join(roomId);
      await socket2.join(roomId);

      players.set(socket1.id, { username: player1.username, playerNumber: 1 });
      players.set(socket2.id, { username: player2.username, playerNumber: 2 });

      const playersPayload = [
        { userId: player1.userId, username: player1.username },
        { userId: player2.userId, username: player2.username },
      ];
      const roomPayload = { roomId, players: playersPayload };
      const playerInfo = [
        { username: player1.username, playerNumber: 1 },
        { username: player2.username, playerNumber: 2 },
      ];

      socket1.emit('playerInfo', playerInfo);
      socket2.emit('playerInfo', playerInfo);
      socket1.emit('gameRoomUpdate', roomPayload);
      socket2.emit('gameRoomUpdate', roomPayload);

      console.log('gameRoomUpdate emitted to both clients:', roomPayload);

      this.pongService.resetGame(this.server, roomId);
    }

    console.log(
      'current waiting queue:',
      waitingQueue.map((p) => p.username),
    );
  }

  handleConnection(client: Socket) {
    // console.log(`handleConnection: ${client.id}`);
    client.emit('waitingForOpponent', { waitingFor: client.id });

    client.on('register', (player: WaitingPlayer & { roomId?: string }) => {
      // console.log(`Registered: ${player.username} (ID: ${player.userId}) ↔ Socket ${client.id}`);

      connectedUsers.set(player.userId, client);
      this.socketToUser.set(client.id, player.userId);

      // clear disconnect timer
      for (const [roomId, timeout] of disconnectTimers.entries()) {
        const room = activeRooms.get(roomId);
        if (!room) continue;

        const isPlayer =
          room.player1.userId === player.userId ||
          room.player2.userId === player.userId;
        if (isPlayer) {
          clearTimeout(timeout);
          disconnectTimers.delete(roomId);
          console.log(
            `🧹 Cleared stale disconnect timer for room ${roomId} (user ${player.username})`,
          );
        }
      }

      // reconnecting to known room
      if (this.handleRoomReconnection(client, player)) return;

      // fallback — not in room, queue player
      const entry: WaitingPlayer = {
        socketId: client.id,
        userId: player.userId,
        username: player.username,
        playerNumber: player.playerNumber,
      };

      const i = waitingQueue.findIndex((p) => p.socketId === client.id);
      if (i !== -1) waitingQueue[i] = entry;
      else waitingQueue.push(entry);

      this.tryMatchPlayers();
    });

    // disconnect logic
    client.on('disconnect', () => {
      const userId = this.socketToUser.get(client.id);
      // console.log(`disconnected: ${client.id} (user ${userId ?? "unknown"})`);

      if (userId) {
        connectedUsers.delete(userId);
        this.socketToUser.delete(client.id);
      }

      const index = waitingQueue.findIndex((p) => p.socketId === client.id);
      if (index !== -1) waitingQueue.splice(index, 1);

      const roomEntry = [...activeRooms.entries()].find(
        ([, room]) =>
          room.player1.socketId === client.id ||
          room.player2.socketId === client.id,
      );

      if (roomEntry) {
        const [roomId, room] = roomEntry;
        console.log(`starting disconnect timer for room ${roomId}`);

        const timer = setTimeout(() => {
          const stillRoom = activeRooms.get(roomId);
          if (!stillRoom) return;

          if (
            stillRoom.player1.socketId !== client.id &&
            stillRoom.player2.socketId !== client.id
          ) {
            console.log(
              'player reconnected with a new socket. Skip timeout cleanup.',
            );
            return;
          }

          console.log(
            `player ${client.id} did not reconnect in time. Cleaning up room ${roomId}`,
          );
          activeRooms.delete(roomId);
          this.emitPlayerInfoForRoom(roomId);

          const opponent =
            stillRoom.player1.socketId === client.id
              ? stillRoom.player2
              : stillRoom.player1;

          if (!opponent?.socketId) {
            console.warn(
              `no valid opponent socket for room ${roomId}, skipping emit`,
            );
            disconnectTimers.delete(roomId);
            return;
          }

          if (!waitingQueue.some((p) => p.userId === opponent.userId)) {
            waitingQueue.push({
              username: opponent.username,
              socketId: opponent.socketId,
              userId: opponent.userId,
              playerNumber: opponent.playerNumber,
            });
          }

          this.emitPlayerInfoForRoom(roomId);
          this.tryMatchPlayers();

          disconnectTimers.delete(roomId);
        }, 5000);

        disconnectTimers.set(roomId, timer);
      }
    });
  }

  handleRoomReconnection(
    client: Socket,
    player: WaitingPlayer & { roomId?: string },
  ): boolean {
    if (!player.roomId) return false;

    const room = activeRooms.get(player.roomId);
    const isPlayer =
      room &&
      (room.player1.userId === player.userId ||
        room.player2.userId === player.userId);

    if (!room || !isPlayer) return false;

    console.log(
      `reconnecting ${player.username} to existing room ${player.roomId}`,
    );

    if (room.player1.userId === player.userId) {
      room.player1.socketId = client.id;
    } else {
      room.player2.socketId = client.id;
    }

    const socket1 = connectedUsers.get(room.player1.userId);
    const socket2 = connectedUsers.get(room.player2.userId);

    const playerInfo = [
      { username: room.player1.username, playerNumber: 1 },
      { username: room.player2.username, playerNumber: 2 },
    ];

    client.emit('resumeGame');
    socket1?.emit('playerInfo', playerInfo);
    socket2?.emit('playerInfo', playerInfo);

    const opponent =
      room.player1.userId === player.userId ? room.player2 : room.player1;
    const opponentSocket = connectedUsers.get(opponent.userId);
    opponentSocket?.emit('opponentReconnected');

    return true;
  }

  private cleanupRoomBySocket(client: Socket) {
    for (const [roomId, room] of activeRooms.entries()) {
      const { player1, player2 } = room;
      const isInRoom =
        player1.socketId === client.id || player2.socketId === client.id;

      if (isInRoom) {
        const opponent = player1.socketId === client.id ? player2 : player1;
        const opponentSocket = connectedUsers.get(opponent.userId);

        if (opponentSocket) {
          opponentSocket.emit('opponentDisconnected');
        }

        if (opponentSocket) {
          opponentSocket.emit('opponentLeft');
          opponentSocket.emit('playerInfo', []);
        }

        this.emitPlayerInfoForRoom(roomId);
        activeRooms.delete(roomId);
        // Also clean up the user roles mapping
        roomUserRoles.delete(roomId);
        console.log(
          `cleaned up room ${roomId} due to disconnect of ${client.id}`,
        );
        break;
      }
    }
  }

  private findRoomBySocketId(socketId: string): [string, Room] | undefined {
    return [...activeRooms.entries()].find(
      ([, room]) =>
        room.player1.socketId === socketId ||
        room.player2.socketId === socketId,
    );
  }

  /** Handles player disconnect */
  private pendingReconnections = new Map<string, NodeJS.Timeout>();
  handleDisconnect(client: Socket) {
	  const userId = this.socketToUser.get(client.id);
	  console.log("disconnected from room: ", userId);
	  if (!userId) return;
	  
    const roomEntry = this.findRoomBySocketId(client.id);

    // Remove socket from connection maps
    connectedUsers.delete(userId);
    this.socketToUser.delete(client.id);
    this.userToRoom.delete(userId);
    this.userInGame.delete(userId);

	if (!roomEntry) {
		// If not in activeRooms, clean up private room state if any
		const userId = this.socketToUser.get(client.id);
		if (userId) {
		  for (const [roomId, allowed] of privateRooms.entries()) {
			if (allowed.includes(userId)) {
			  privateRooms.set(roomId, allowed.filter((id) => id !== userId));
			  console.log(`User ${userId} removed from private room ${roomId}`);
			}
		  }
	  
		  // Also clean up roomUserRoles if needed
		  for (const [roomId, roles] of roomUserRoles.entries()) {
			if (roles.creator === userId || roles.invited === userId) {
			  roomUserRoles.delete(roomId);
			  console.log(`Removed roomUserRoles for ${roomId}`);
			}
		  }
	  
		  // Remove stale playerInfo
		  players.delete(client.id);
		}
	  
		return;
	  }
	  

    const [roomId, room] = roomEntry;

    const isPlayer1 = room.player1.socketId === client.id;
    const opponent = isPlayer1 ? room.player2 : room.player1;

    const opponentSocket = connectedUsers.get(opponent.userId);
    if (opponentSocket) {
      opponentSocket.emit('opponentDisconnected');
    }

    // Optional: update `roomToUsers` mapping
    const users = this.roomToUsers.get(roomId) ?? [];
    const updatedUsers = users.filter((u) => u.id !== userId);
    if (updatedUsers.length > 0) {
      this.roomToUsers.set(roomId, updatedUsers);
    } else {
      this.roomToUsers.delete(roomId);
    }

    // Start reconnection timer
    const timeout = setTimeout(() => {
      const stillInRoom = this.findRoomBySocketId(client.id);
      if (!stillInRoom) return;

      const [roomId, room] = stillInRoom;
      const opponent = isPlayer1 ? room.player2 : room.player1;
      const opponentSocket = connectedUsers.get(opponent.userId);

      if (opponentSocket) {
        console.log(
          `Player ${client.id} did not reconnect, opponent still here keeping room ${roomId}`,
        );
        return;
      }

      console.log(`🧹 Cleaning up room ${roomId} due to timeout`);
      this.pongService.cleanupRoom(roomId);
      this.cleanupRoomBySocket(client); // Your existing logic
      this.emitPlayerInfoForRoom(roomId);
      this.tryMatchPlayers();

      this.pendingReconnections.delete(roomId);
    }, 5000);

    this.pendingReconnections.set(roomId, timeout);
  }

  private async createPrivateRoom(
    roomId: string,
    player1: WaitingPlayer,
    player2: WaitingPlayer,
  ) {
    // Set up the rooms Map in PongService
    this.pongService['rooms'].set(roomId, {
      player1: player1.userId,
      player2: player2.userId,
    });

    // activeRooms.set(roomId, { player1, player2 });
    // await Promise.all([
    //   connectedUsers.get(player1.userId)?.join(roomId),
    //   connectedUsers.get(player2.userId)?.join(roomId),
    // ]);
    // players.set(player1.socketId, {
    //   username: player1.username,
    //   playerNumber: 1,
    // });
    // players.set(player2.socketId, {
    //   username: player2.username,
    //   playerNumber: 2,
    // });
    // const playerInfo = [
    //   { username: player1.username, playerNumber: 1 },
    //   { username: player2.username, playerNumber: 2 },
    // ];
    // const roomPayload = {
    //   roomId,
    //   players: [
    //     { userId: player1.userId, username: player1.username },
    //     { userId: player2.userId, username: player2.username },
    //   ],
    // };
    // connectedUsers.get(player1.userId)?.emit('playerInfo', playerInfo);
    // connectedUsers.get(player2.userId)?.emit('playerInfo', playerInfo);
    // connectedUsers.get(player1.userId)?.emit('gameRoomUpdate', roomPayload);
    // connectedUsers.get(player2.userId)?.emit('gameRoomUpdate', roomPayload);
    // console.log(
    //   `Private room ${roomId} created for ${player1.username} and ${player2.username}`,
    // );
    // this.pongService.resetGame(this.server, roomId);

    activeRooms.set(roomId, { player1, player2 });

    await Promise.all([
      connectedUsers.get(player1.userId)?.join(roomId),
      connectedUsers.get(player2.userId)?.join(roomId),
    ]);

    players.set(player1.socketId, {
      username: player1.username,
      playerNumber: 1,
    });
    players.set(player2.socketId, {
      username: player2.username,
      playerNumber: 2,
    });

    const playerInfo = [
      { username: player1.username, playerNumber: 1 },
      { username: player2.username, playerNumber: 2 },
    ];

    const roomPayload = {
      roomId,
      players: [
        { userId: player1.userId, username: player1.username },
        { userId: player2.userId, username: player2.username },
      ],
    };

    connectedUsers.get(player1.userId)?.emit('playerInfo', playerInfo);
    connectedUsers.get(player2.userId)?.emit('playerInfo', playerInfo);

    connectedUsers.get(player1.userId)?.emit('gameRoomUpdate', roomPayload);
    connectedUsers.get(player2.userId)?.emit('gameRoomUpdate', roomPayload);

    console.log(
      `Private room ${roomId} created for ${player1.username} and ${player2.username}`,
    );

    // Store the user roles to track who is creator and who is invited
    const gameInvite = this.chatGameInviteRepository
      .findOne({
        where: { id: roomId },
        relations: ['invitedUser', 'createdUser'],
      })
      .then((invite) => {
        if (invite) {
          roomUserRoles.set(roomId, {
            creator: invite.createdUser.id,
            invited: invite.invitedUser.id,
          });
          console.log(
            `Room ${roomId}: mapped creator=${invite.createdUser.id}, invited=${invite.invitedUser.id}`,
          );
        }
      });

    this.pongService.resetGame(this.server, roomId);
  }

  /** Handles player registration */
  @SubscribeMessage('registerUser')
  async handleRegisterUser(client: Socket, payload: any) {
    const { username, userId, roomId } = payload;
    console.log(
      `Registering ${username} ${roomId ? `(Room: ${roomId})` : '(Public Matchmaking)'}`,
    );

    const user = await this.userService.findByUsername(username);
    if (!user) {
      console.error('User not found for registration:', username);
      return;
    }

	
    // Cleanup stale rooms
    for (const [rId, room] of activeRooms.entries()) {
		const isPlayer =
        room.player1.userId === user.id || room.player2.userId === user.id;
		console.log("users: ", room);
      const stillConnected =
        connectedUsers.has(room.player1.userId) &&
        connectedUsers.has(room.player2.userId);

      if (isPlayer && !stillConnected) {
        console.log(`Removing stale room ${rId} on reconnect`);
        activeRooms.delete(rId);
        this.pongService.cleanupRoom(rId);
      }
    }

    // Reject if already in a game
    const existingRoom = this.pongService.getRoomByUserId(user.id);
    if (!('error' in existingRoom)) {
      console.warn(
        `User ${username} is already in a game. Skipping registration.`,
      );
      client.emit('alreadyInGame');
      return;
    }

    // Remove from old queue if reconnecting
    const existingIndex = waitingQueue.findIndex((p) => p.userId === user.id);
    if (existingIndex !== -1) {
      waitingQueue.splice(existingIndex, 1);
    }

    // Disconnect previous session
    if (connectedUsers.has(user.id)) {
      const oldSocket = connectedUsers.get(user.id);
      if (oldSocket && oldSocket.id !== client.id) {
        oldSocket.disconnect(true);
      }
    }

    connectedUsers.set(user.id, client);
    this.socketToUser.set(client.id, user.id);

    const player: WaitingPlayer = {
      userId: user.id,
      username,
      socketId: client.id,
      playerNumber: 1,
    };

    // private room handling
    if (roomId) {
      let allowedUsers = privateRooms.get(roomId);

      // Auto-authorize the room creator
      if (!allowedUsers) {
        allowedUsers = [user.id];
        privateRooms.set(roomId, allowedUsers);
        console.log(`Private room ${roomId} initialized by ${username}`);
      }

      // access control
      if (!allowedUsers.includes(user.id)) {
        console.warn(`access denied for ${username} to room ${roomId}`);
        client.emit('accessDenied');
        return;
      }

      // Get all connected allowed users in the room
      const playersInRoom: WaitingPlayer[] = [];

      // First add existing players
      for (const id of allowedUsers) {
        const socket = connectedUsers.get(id);
        if (socket && socket.id !== client.id) {
          const existingPlayer = players.get(socket.id);
          if (existingPlayer) {
            playersInRoom.push({
              userId: this.socketToUser.get(socket.id)!,
              username: existingPlayer.username,
              socketId: socket.id,
              playerNumber: existingPlayer.playerNumber,
            });
          }
        }
      }

      // Add current player
      playersInRoom.push({
        userId: user.id,
        username,
        socketId: client.id,
        playerNumber: playersInRoom.length + 1,
      });

      // Set player info in the players Map
      players.set(client.id, { username, playerNumber: playersInRoom.length });

      client.emit('registered');

      // start game if both invited players are here
      if (playersInRoom.length === 2) {
        await this.createPrivateRoom(
          roomId,
          playersInRoom[0],
          playersInRoom[1],
        );
      }

      return;
    }

    // public matchmaking:
    waitingQueue.push(player);
    console.log('Matchmaking player:', username);
    client.emit('registered');
    this.tryMatchPlayers();
  }

  private inviteUserToRoom(roomId: string, userId: number) {
    if (!privateRooms.has(roomId)) {
      privateRooms.set(roomId, []);
    }

    const allowed = privateRooms.get(roomId)!;
    if (!allowed.includes(userId)) {
      allowed.push(userId);
    }

    console.log(`invited user ${userId} to private room ${roomId}`);
  }

  /** Handles game state request */
  @SubscribeMessage('requestGameState')
  handleRequestGameState(@ConnectedSocket() client: Socket) {
    console.log('Sending fresh game state to: ${client.id}');
    const roomId = this.findRoomBySocketId(client.id)?.[0];
    if (roomId) {
      const gameState = this.pongService.getGameState(roomId);
      if (gameState) {
        client.emit('gameState', gameState);
      }
    }
  }

  /** Handles players request */
  @SubscribeMessage('requestPlayers')
  handleRequestPlayers(@ConnectedSocket() client: Socket) {
    let roomId: string | undefined;

    for (const [id, room] of activeRooms.entries()) {
      if (
        room.player1.socketId === client.id ||
        room.player2.socketId === client.id
      ) {
        roomId = id;
        break;
      }
    }

    if (roomId) {
      const room = activeRooms.get(roomId);
      const playerInfo = [
        { username: room!.player1.username, playerNumber: 1 },
        { username: room!.player2.username, playerNumber: 2 },
      ];
      console.log(`Sending player info for room ${roomId}:`, playerInfo);
      client.emit('playerInfo', playerInfo);
    } else {
      console.warn(`No active room found for socket ${client.id}`);
      client.emit('playerInfo', []);
    }
  }

  @SubscribeMessage('joinPrivateRoom')
  async handleInviteToRoom(
    @MessageBody() data: { roomId: string; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Data:', data);
    //? check if user has acces to the room

    console.log('Inviting user to room', data.roomId);
    const rawRoomId = data.roomId.replace(/^room-/, '');
    const gameInvite = await this.chatGameInviteRepository.findOne({
      where: { id: rawRoomId },
      relations: ['invitedUser', 'createdUser'],
    });
    

    // console.log("Game invite:", gameInvite);

    if (!gameInvite) {
      console.warn('Game invite not found for room', data.roomId);
      client.emit('accessDenied');
      return;
    }

    if (
      gameInvite.invitedUser.id !== data.userId &&
      gameInvite.createdUser.id !== data.userId
    ) {
      console.warn(
        `User ${data.userId} is not authorized to join room ${data.roomId}`,
      );
      client.emit('accessDenied');
      return;
    }

    console.log('Successfully invited user to room', data.roomId);

    this.socketToUser.set(client.id, data.userId);
    this.userToRoom.set(data.userId, data.roomId);

    // Store user roles mapping for this room if not already stored
    if (!roomUserRoles.has(data.roomId)) {
      roomUserRoles.set(data.roomId, {
        creator: gameInvite.createdUser.id,
        invited: gameInvite.invitedUser.id,
      });
      console.log(
        `Room ${data.roomId}: mapped creator=${gameInvite.createdUser.id}, invited=${gameInvite.invitedUser.id}`,
      );
    }

    const inviterId = this.socketToUser.get(client.id);

    if (!inviterId) {
      console.warn('Unauthorized: No user mapped to this socket');
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Optionally: log who invited whom
    console.log(
      `User ${inviterId} invited ${data.userId} to room ${data.roomId}`,
    );

    this.inviteUserToRoom(data.roomId, data.userId);

    this.pongService.resetGame(this.server, data.roomId);
    this.server.to(data.roomId).emit('bothplayersready');
  }

  /**
   * Gets the correct user ID by player number and room ID
   * This helps ensure the right player gets credit for wins/losses
   */
  getUserByPlayerNumber(
    roomId: string,
    playerNumber: number,
  ): number | undefined {
    const roles = roomUserRoles.get(roomId);
    if (!roles) return undefined;

    // Find the room to check which player joined in which position
    const room = activeRooms.get(roomId);
    if (!room) return undefined;

    // If player1's userId matches the creator, return accordingly
    if (playerNumber === 1) {
      return room.player1.userId === roles.creator
        ? roles.creator
        : roles.invited;
    } else if (playerNumber === 2) {
      return room.player2.userId === roles.creator
        ? roles.creator
        : roles.invited;
    }

    return undefined;
  }

  /**
   * Gets the user role (creator or invited) for a given user ID in a room
   */
  getUserRoleInRoom(
    roomId: string,
    userId: number,
  ): 'creator' | 'invited' | undefined {
    const roles = roomUserRoles.get(roomId);
    if (!roles) return undefined;

    if (roles.creator === userId) return 'creator';
    if (roles.invited === userId) return 'invited';
    return undefined;
  }

  @SubscribeMessage('playerReady')
  handlePlayerReady(@ConnectedSocket() client: Socket) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) return;

    const roomId = this.findRoomBySocketId(client.id)?.[0];
    if (!roomId) return;
    this.pongService.incrementReadyPlayers(roomId);

    if (this.pongService.areBothPlayersReady(roomId)) {
      this.server.emit('bothPlayersReady');
      this.pongService.resetGame(this.server, roomId);
    } else {
      client.emit('waitingForOpponent', { waitingFor: playerInfo.username });
    }

    this.tryMatchPlayers();
  }

  // Handles player movement
  @SubscribeMessage('playerMove')
  handlePlayerMove(
    @MessageBody() data: { player: number; y: number; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
      // console.error(`Received move from unknown client: ${client.id}`);
      return;
    }

    const { roomId } = data;
    const room = activeRooms.get(roomId);
    const isClientInRoom =
      room?.player1.socketId === client.id ||
      room?.player2.socketId === client.id;

    if (!room || !isClientInRoom) {
      console.warn(
        `Invalid room ${roomId} or client ${client.id} not in room.`,
      );
      return;
    }

    const gameState = this.pongService.getGameState(roomId);
    if (!gameState) return;

    const prevY =
      playerInfo.playerNumber === 1 ? gameState.paddle1.y : gameState.paddle2.y;

    if (Math.abs(prevY - data.y) < 5) return;

    const updated = this.pongService.updatePaddlePosition(
      data.roomId,
      playerInfo.playerNumber,
      data.y,
      this.server,
    );

    if (!updated) {
      console.warn(
        `Invalid move! Player ${playerInfo.playerNumber} attempted unauthorized movement.`,
      );
      return;
    }

    // emit the paddle move to opponent only
    client.to(roomId).emit('updatePaddle', {
      player: playerInfo.playerNumber,
      y: data.y,
    });

    const updatedState = this.pongService.getGameState(roomId);
    if (updatedState) {
      this.server.to(roomId).emit('gameState', updatedState);
    }
  }

  /** Handles power-up collection */
  @SubscribeMessage('powerUpCollected')
  handlePowerUpCollected(
    @MessageBody() data: { player: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomEntry = [...activeRooms.entries()].find(
      ([, room]) =>
        room.player1.socketId === client.id ||
        room.player2.socketId === client.id,
    );

    if (!roomEntry) return;
    const [roomId] = roomEntry;

    this.pongService.applyPowerUpEffect(roomId, data.player, this.server);
  }

  @SubscribeMessage('togglePowerUps')
  handleTogglePowerUps(
    @MessageBody() data: { enabled: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const roomEntry = [...activeRooms.entries()].find(
      ([, room]) =>
        room.player1.socketId === client.id ||
        room.player2.socketId === client.id,
    );

    if (!roomEntry) {
      console.warn(`player ${client.id} is not assigned to any room.`);
      return;
    }

    const [roomId] = roomEntry;

    console.log(`Power-ups toggled in room ${roomId}: ${data.enabled}`);

    // emit new power-up state to both players
    this.server.to(roomId).emit('powerUpsToggled', { enabled: data.enabled });

    // emit synced cooldown trigger (e.g. 3s)
    const cooldownMs = 3000;
    this.server.to(roomId).emit('powerUpsCooldown', { duration: cooldownMs });

    console.log(`cooldown of ${cooldownMs}ms emitted to room ${roomId}`);
  }

  @SubscribeMessage('leaveGame')
  handleLeaveGame(@ConnectedSocket() client: Socket) {
    console.log(`${client.id} manually left the game`);

    const roomEntry = this.findRoomBySocketId(client.id);
    if (!roomEntry) {
		const index = waitingQueue.findIndex((player) => player.socketId === client.id);
        if (index !== -1) {
            waitingQueue.splice(index, 1);
        }

		for (const [roomId, userIds] of privateRooms.entries()) {
			if (userIds.includes(this.socketToUser.get(client.id)!)) {
			  privateRooms.set(roomId, userIds.filter((id) => id !== this.socketToUser.get(client.id)!));
			  console.log(`Removed user from private room ${roomId}`);
			}
		  }

      console.log('No active room found for socket', client.id);
      return;
    }

    const [roomId, room] = roomEntry;

    // Cleanly stop game loop
    this.pongService.cleanupRoom(roomId);

    // Notify opponent
    const opponent =
      room.player1.socketId === client.id ? room.player2 : room.player1;

    const opponentSocket = connectedUsers.get(opponent.userId);
    opponentSocket?.emit('opponentLeft');

    // Notify opponent BEFORE deleting room
    if (opponentSocket) {
      opponentSocket.emit('opponentLeft');
      opponentSocket.emit('playerInfo', []);
    }

    activeRooms.delete(roomId);
    this.emitPlayerInfoForRoom(roomId); // still okay here

    // Remove room & socket references
    activeRooms.delete(roomId);
    this.emitPlayerInfoForRoom(roomId);

    players.delete(client.id);
    this.socketToUser.delete(client.id);
    connectedUsers.delete(this.socketToUser.get(client.id)!);

    console.log(`cleaned up room ${roomId} after ${client.id} left`);

    // Add opponent back to queue (if not already)
    if (!waitingQueue.some((p) => p.userId === opponent.userId)) {
      waitingQueue.push(opponent);
    }

    this.tryMatchPlayers();
  }
}
