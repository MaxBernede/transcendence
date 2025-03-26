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
import { UserService } from "../user/user.service";
import { CreatePongDto } from './dto/create_pong.dto';

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

const waitingQueue: WaitingPlayer[] = [];

const activeRooms = new Map<string, { player1: WaitingPlayer, player2: WaitingPlayer }>();
const userIdToSocketId = new Map<string, string>();  // Optional: reverse lookup
const connectedUsers = new Map<number, Socket>();


@WebSocketGateway({ namespace: 'pong', cors: { origin: '*' } })
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly pongService: PongService,
    private readonly userService: UserService
  ) {}

  private socketToUser: Map<string, number> = new Map();


  afterInit(server: Server) {
    this.server = server;
    console.log("webSocket Server initialized");
  }
  
  private getSocket(clientId: string): Socket | null {
    const socketsMap = this.server?.sockets?.sockets;
    return socketsMap?.get(clientId) ?? null;
  }

  private async waitForSocketsMap(maxRetries = 20, delay = 200): Promise<Map<string, Socket> | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const socketsMap = this.server?.sockets?.sockets;
      if (socketsMap && socketsMap.size > 0) return socketsMap;
  
      console.warn(`⏳ Waiting for socketsMap... attempt ${attempt}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return null;
  }
  
  private emitPlayerInfo() {
    const players = waitingQueue.map(p => ({
      username: p.username,
      playerNumber: p.playerNumber,
    }));
  
    this.server?.emit("playerInfo", players);
  }
  
  private async tryMatchPlayers() {
    if (waitingQueue.length < 2) return;
  
    const player1 = waitingQueue.shift()!;
    const player2 = waitingQueue.shift()!;
  
    const socket1 = connectedUsers.get(player1.userId);
    const socket2 = connectedUsers.get(player2.userId);
  
    if (!socket1 || !socket2) {
      console.warn("⚠️ Missing socket(s), requeueing players...");
      if (socket1) waitingQueue.unshift(player1);
      if (socket2) waitingQueue.unshift(player2);
      return;
    }
  
    const roomId = `room-${uuidv4()}`;
    activeRooms.set(roomId, { player1, player2 });
  
    console.log(`creating room: ${roomId}`);
    console.log(`players: ${player1.username} (${socket1.id}) vs ${player2.username} (${socket2.id})`);
  
    try {
      await socket1.join(roomId);
      await socket2.join(roomId);
    } catch (err) {
      console.error("error joining sockets to room:", err);
      return;
    }
  
    const playersPayload = [
      { userId: player1.userId, username: player1.username },
      { userId: player2.userId, username: player2.username },
    ];
  
    const roomPayload = { roomId, players: playersPayload };
  
    socket1.emit("gameRoomUpdate", roomPayload);
    socket2.emit("gameRoomUpdate", roomPayload);
  
    console.log("gameRoomUpdate emitted to both clients:", roomPayload);
  }
  

handleConnection(client: Socket) {
  console.log(`handleConnection: ${client.id}`);
  client.emit("waitingForOpponent", { waitingFor: client.id });

  client.on("register", (player: WaitingPlayer) => {
    console.log(`registered user: ${player.username} (ID: ${player.userId}) for socket ${client.id}`);

    connectedUsers.set(player.userId, client);
    this.socketToUser.set(client.id, player.userId);

    const entry: WaitingPlayer = {
      socketId: client.id,
      userId: player.userId,
      username: player.username,
      playerNumber: player.playerNumber,
    };

    const i = waitingQueue.findIndex(p => p.socketId === client.id);
    if (i !== -1) {
      waitingQueue[i] = entry;
    } else {
      waitingQueue.push(entry);
    }

    this.tryMatchPlayers();
  });

  client.on("disconnect", () => {
    const userId = this.socketToUser.get(client.id);
    console.log(`disconnected: ${client.id} (user ${userId ?? "unknown"})`);

    if (userId) {
      connectedUsers.delete(userId);
      this.socketToUser.delete(client.id);
    }

    const i = waitingQueue.findIndex(p => p.socketId === client.id);
    if (i !== -1) waitingQueue.splice(i, 1);
  });
}

  /** Handles player disconnect */
  handleDisconnect(client: Socket) {
    console.log(`Player disconnected: ${client.id}`);
  
    // find the userId from connectedUsers map
    const entry = [...connectedUsers.entries()].find(([_, socket]) => socket.id === client.id);
    if (entry) {
      const [userId] = entry;
      connectedUsers.delete(userId);
      console.log(`removed socket for userId ${userId} from connectedUsers`);
    }
  
    // remove from waitingQueue
    const index = waitingQueue.findIndex(p => p.socketId === client.id);
    if (index !== -1) {
      const player = waitingQueue.splice(index, 1)[0];
      console.log(`🧹 Removed ${player.username} from waiting queue`);
    }
  
    // mark as disconnected idk if necessary?
    const playerData = players.get(client.id);
    if (playerData) {
      players.delete(client.id);
      players.set(`DISCONNECTED-${playerData.username}`, { ...playerData });
    }
  
    this.emitPlayerInfo();
  }
  

  /** Handles player registration */
  @SubscribeMessage("registerUser")
  async handleRegisterUser(client: Socket, payload: any) {
    const { username } = typeof payload === "string" ? { username: payload } : payload;
    console.log("Looking for user:", username);
  
    const user = await this.userService.findByUsername(username);
    if (!user) {
      console.error("User not found for registration:", username);
      return;
    }
  
    // track user socket
    connectedUsers.set(user.id, client);
    this.socketToUser.set(client.id, user.id);
  
    // register in global players map (crucial fix)
    const playerNumber = waitingQueue.length === 0 ? 1 : 2;
    players.set(client.id, {
      username,
      playerNumber,
    });
  
    console.log(`registering player: ${username} (UUID: ${user.id}) with socket ${client.id}`);
  
    // Notify frontend
    client.emit("registered");
  
    // Cleanup duplicates in waitingQueue
    const existingIndex = waitingQueue.findIndex(p => p.userId === user.id);
    if (existingIndex !== -1) {
      waitingQueue.splice(existingIndex, 1);
    }
  
    const player = { userId: user.id, username, socketId: client.id, playerNumber };
    waitingQueue.push(player);
  
    this.emitPlayerInfo();
  
    if (!this.server?.sockets?.sockets) {
      console.warn("Server not ready, delaying match attempt...");
      setTimeout(() => this.tryMatchPlayers(), 1000);
    } else {
      this.tryMatchPlayers();
    }
  }
  
  

  /** Handles game state request */
  @SubscribeMessage('requestGameState')
  handleRequestGameState(@ConnectedSocket() client: Socket) {
    console.log('Sending fresh game state to: ${client.id}');
    client.emit('gameState', this.pongService.getGameState());
  }

  /** Handles players request */
  @SubscribeMessage('requestPlayers')
  handleRequestPlayers(@ConnectedSocket() client: Socket) {
    console.log('Sending player info:', Array.from(players.values()));
    client.emit('playerInfo', Array.from(players.values()));
  }

  /** Broadcasts players update */
  private broadcastPlayers() {
    this.server.emit('updatePlayers', Array.from(players.values()));
  }

  
@SubscribeMessage('playerReady')
handlePlayerReady(@ConnectedSocket() client: Socket) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
        console.error('Unknown player tried to reset the game.');
        return;
    }

    console.log(`Player ${playerInfo.playerNumber} is ready!`);
    this.pongService.incrementReadyPlayers();

    if (this.pongService.areBothPlayersReady()) {
        console.log("Both players confirmed! Resetting game...");
        this.pongService.resetGame(this.server);

        setTimeout(() => {
            this.server.emit("bothPlayersReady"); // Notify frontend
            this.pongService.startGameLoop(this.server); // Automatically start game
        }, 500);  // Small delay to ensure sync
    } else {
        console.log("Waiting for second player...");
        this.server.emit("waitingForOpponent", { waitingFor: playerInfo.username });
    }
}


  // Handles player movement
  @SubscribeMessage('playerMove')
  handlePlayerMove(
    @MessageBody() data: { player: number; y: number; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
      console.error(`Received move from unknown client: ${client.id}`);
      return;
    }
  
    const { roomId } = data;
    const room = activeRooms.get(roomId);
    const isClientInRoom =
      room?.player1.socketId === client.id || room?.player2.socketId === client.id;
  
    if (!room || !isClientInRoom) {
      console.warn(`Invalid room ${roomId} or client ${client.id} not in room.`);
      return;
    }
  
    const prevY =
      playerInfo.playerNumber === 1
        ? this.pongService.getGameState().paddle1.y
        : this.pongService.getGameState().paddle2.y;
  
    if (Math.abs(prevY - data.y) < 5) return;
  
    const updated = this.pongService.updatePaddlePosition(
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
  
    const updatedState = this.pongService.getGameState();
    this.server.to(roomId).emit('gameState', updatedState);
  }
  

  /** Handles power-up collection */
  @SubscribeMessage('powerUpCollected')
  handlePowerUpCollected(@MessageBody() data: { player: number }) {
    this.pongService.applyPowerUpEffect(data.player, this.server);
  }

  @SubscribeMessage('togglePowerUps')
  handleTogglePowerUps(
      @MessageBody() data: { enabled: boolean },
      @ConnectedSocket() client: Socket
  ) {
      let roomId = null;
  
      // Find the room where the player is
      for (const [id, room] of activeRooms.entries()) {
        if (
          room.player1.socketId === client.id ||
          room.player2.socketId === client.id
        ) {
          roomId = id;
          break;
        }
      }      
  
      if (!roomId) {
          console.warn(`⚠️ Player ${client.id} is not assigned to any room.`);
          return;
      }
  
      console.log(`Power-ups toggled in room ${roomId}: ${data.enabled}`);

      this.server.to(roomId).emit('powerUpsToggled', { enabled: data.enabled });

      console.log(`Starting cooldown for power-ups in room ${roomId}`);
       this.server.to(roomId).emit("powerUpCooldown", { cooldown: 5000 });
  }
}
