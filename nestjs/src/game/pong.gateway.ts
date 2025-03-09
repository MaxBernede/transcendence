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
import { DatabasesService } from '../database/database.service';
import { PongService } from './pong.service';

export const players = new Map<string, { username: string; playerNumber: number }>();

@WebSocketGateway({ namespace: 'pong', cors: { origin: '*' } })
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly databaseService: DatabasesService,
        private readonly pongService: PongService
    ) {}

    /** WebSocket connection */
    handleConnection(client: Socket) {
        console.log('New player connected: ${client.id}');
    }

    /** Handles player disconnect */
    handleDisconnect(client: Socket) {
        console.log('Player disconnected: ${client.id}');

        const playerData = players.get(client.id);
        if (playerData) {
            console.log('Marking ${playerData.username} as disconnected (Player ${playerData.playerNumber})');
            players.delete(client.id);

            // Store disconnected player to maintain their player number
			players.set(`DISCONNECTED-${playerData.username}`, { ...playerData });
        }

        this.server.emit("playerInfo", Array.from(players.values()));
    }

    /** Handles player registration */
    @SubscribeMessage('registerUser')
    handleRegisterUser(client: Socket, username: string) {
        console.log('Registering player: ${username}');

        let existingPlayer = Array.from(players.entries()).find(([_, player]) => player.username === username);

        if (existingPlayer) {
            console.log('${username} reconnected as Player ${existingPlayer[1].playerNumber}');
            players.delete(existingPlayer[0]);
            players.set(client.id, existingPlayer[1]);
        } else {
            const playerNumbers = new Set(Array.from(players.values()).map(player => player.playerNumber));
            let assignedPlayerNumber = playerNumbers.has(1) ? 2 : 1;

            console.log('New player: ${username} assigned as Player ${assignedPlayerNumber}');
            players.set(client.id, { username, playerNumber: assignedPlayerNumber });
        }

        this.server.emit("playerInfo", Array.from(players.values()));
    }

    /** Handles game state request */
    @SubscribeMessage("requestGameState")
    handleRequestGameState(@ConnectedSocket() client: Socket) {
        console.log('Sending fresh game state to: ${client.id}');
        client.emit("gameState", this.pongService.getGameState());
    }

    /** Handles players request */
    @SubscribeMessage("requestPlayers")
    handleRequestPlayers(@ConnectedSocket() client: Socket) {
        console.log("Sending player info:", Array.from(players.values()));
        client.emit("playerInfo", Array.from(players.values()));
    }

    /** Broadcasts players update */
    private broadcastPlayers() {
        this.server.emit('updatePlayers', Array.from(players.values()));
    }

	


/** Handles player ready event */
@SubscribeMessage("playerReady")
handlePlayerReady(@ConnectedSocket() client: Socket) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
        console.error("Unknown player tried to reset the game.");
        return;
    }

    console.log('Player ${playerInfo.playerNumber} is ready!');
    this.pongService.incrementReadyPlayers();

    if (this.pongService.areBothPlayersReady()) {
        console.log("Both players confirmed! Resetting game...");
        this.pongService.resetGame(this.server);
        this.server.emit("bothPlayersReady"); // Notify front-end
    } else {
        console.log("Waiting for second player...");
        this.server.emit("waitingForOpponent", { waitingFor: playerInfo.username });
    }
}

// Handles player movement
@SubscribeMessage("playerMove")
handlePlayerMove(@MessageBody() data: { player: number; y: number }, @ConnectedSocket() client: Socket) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
        console.error('Received move from unknown client: ${client.id}');
        return;
    }

    const prevY = playerInfo.playerNumber === 1 
        ? this.pongService.getGameState().paddle1.y 
        : this.pongService.getGameState().paddle2.y;

    if (Math.abs(prevY - data.y) < 5) return; // Ignore tiny movements

    // Start ball movement only if it's the first movement
    if (!this.pongService.updatePaddlePosition(playerInfo.playerNumber, data.y, this.server)) {
        console.warn('Invalid move! Player ${playerInfo.playerNumber} attempted unauthorized movement.');
        return;
    }

    const updatedState = this.pongService.getGameState();
    this.server.emit("gameState", updatedState);
}

	/** Handles game start */
	@SubscribeMessage("startGame")
	handleStartGame() {
    console.log("Starting the game loop...");
    
    // Ensure game starts only when the button is clicked!
    // this.pongService.setGameActive(true);
    this.pongService.startGameLoop(this.server);
}


    /** Handles power-up collection */
    @SubscribeMessage("powerUpCollected")
    handlePowerUpCollected(@MessageBody() data: { player: number }) {
        this.pongService.applyPowerUpEffect(data.player, this.server);
    }
}
