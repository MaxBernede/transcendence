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

export const players = new Map<
  string,
  { username: string; playerNumber: number }
>();
const activeRooms = new Map<string, string[]>(); // { roomId: [player1Id, player2Id] }

@WebSocketGateway({ namespace: 'pong', cors: { origin: '*' } })
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly pongService: PongService,
  ) {}

  /** WebSocket connection */
  handleConnection(client: Socket) {
    console.log('New player connected: ${client.id}');

    // Check if player is already in a room (prevents duplicate joins)
    for (const [roomId, players] of activeRooms.entries()) {
      if (players.includes(client.id)) {
        console.warn(
          `Player ${client.id} is already in room ${roomId}, skipping duplicate join.`,
        );
        return;
      }
    }

    let assignedRoom = null;

    // Look for a room that has only 1 player
    for (const [roomId, players] of activeRooms.entries()) {
      if (players.length === 1) {
        players.push(client.id);
        assignedRoom = roomId;
        break;
      }
    }

    // If no room is available, create a new one
    if (!assignedRoom) {
      assignedRoom = `room-${Math.random().toString(36).substring(2, 10)}`;
      activeRooms.set(assignedRoom, [client.id]);
    }

    // Assign player to the room
    client.join(assignedRoom);
    console.log(`Player ${client.id} joined room ${assignedRoom}`);

    // Send room info to the client
    this.server
      .to(assignedRoom)
      .emit('gameRoomUpdate', {
        roomId: assignedRoom,
        players: activeRooms.get(assignedRoom),
      });
  }

  /** Handles player disconnect */
  handleDisconnect(client: Socket) {
    console.log('Player disconnected: ${client.id}');

    const playerData = players.get(client.id);
    if (playerData) {
      // console.log('Marking ${playerData.username} as disconnected (Player ${playerData.playerNumber})');
      players.delete(client.id);

      // Store disconnected player to maintain their player number
      players.set(`DISCONNECTED-${playerData.username}`, { ...playerData });
    }

    this.server.emit('playerInfo', Array.from(players.values()));
  }

  /** Handles player registration */
  @SubscribeMessage('registerUser')
  handleRegisterUser(client: Socket, username: string) {
    console.log('Registering player: ${username}');

    let existingPlayer = Array.from(players.entries()).find(
      ([_, player]) => player.username === username,
    );

    if (existingPlayer) {
      console.log(
        '${username} reconnected as Player ${existingPlayer[1].playerNumber}',
      );
      players.delete(existingPlayer[0]);
      players.set(client.id, existingPlayer[1]);
    } else {
      const playerNumbers = new Set(
        Array.from(players.values()).map((player) => player.playerNumber),
      );
      let assignedPlayerNumber = playerNumbers.has(1) ? 2 : 1;

      console.log(
        'New player: ${username} assigned as Player ${assignedPlayerNumber}',
      );
      players.set(client.id, { username, playerNumber: assignedPlayerNumber });
    }

    this.server.emit('playerInfo', Array.from(players.values()));
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
    @MessageBody() data: { player: number; y: number },
    @ConnectedSocket() client: Socket,
  ) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
      console.error(`Received move from unknown client: ${client.id}`);
      return;
    }

    // Find the player's room
    let roomId = null;
    for (const [id, players] of activeRooms.entries()) {
      if (players.includes(client.id)) {
        roomId = id;
        break;
      }
    }

    if (!roomId) {
      console.warn(`Player ${client.id} is not assigned to any room.`);
      return;
    }

    const prevY =
      playerInfo.playerNumber === 1
        ? this.pongService.getGameState().paddle1.y
        : this.pongService.getGameState().paddle2.y;

    if (Math.abs(prevY - data.y) < 5) return; // Ignore tiny movements

    // Start ball movement only if it's the first movement
    if (
      !this.pongService.updatePaddlePosition(
        playerInfo.playerNumber,
        data.y,
        this.server,
      )
    ) {
      console.warn(
        `Invalid move! Player ${playerInfo.playerNumber} attempted unauthorized movement.`,
      );
      return;
    }

    const updatedState = this.pongService.getGameState();

    // Emit only to the specific room
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
      for (const [id, players] of activeRooms.entries()) {
          if (players.includes(client.id)) {
              roomId = id;
              break;
          }
      }
  
      if (!roomId) {
          console.warn(`⚠️ Player ${client.id} is not assigned to any room.`);
          return;
      }
  
      console.log(`🔁 Power-ups toggled in room ${roomId}: ${data.enabled}`);
  
      // Broadcast the change to ALL players in the room
      this.server.to(roomId).emit('powerUpsToggled', { enabled: data.enabled });
  }
  
}
