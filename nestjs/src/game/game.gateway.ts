import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({ cors: { origin: "*" } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private gameState = {
    paddle1Y: 250,
    paddle2Y: 250,
    ballX: 390,
    ballY: 294,
    score1: 0,
    score2: 0,
    winner: null,
  };

  private players = new Map<string, { id: string; playerNumber: 1 | 2 }>();
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.getOrThrow<string>("JWT_SECRET");
  }

  handleConnection(client: Socket) {
    if (this.players.size >= 2) {
      client.emit("errorMessage", "Game is full");
      client.disconnect();
      return;
    }

    const playerNumber = this.players.size === 0 ? 1 : 2;
    this.players.set(client.id, { id: client.id, playerNumber });

    console.log(`🎮 Player ${playerNumber} connected: ${client.id}`);
    client.emit("playerAssigned", { playerNumber });

    this.broadcastGameState();
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Player disconnected: ${client.id}`);
    this.players.delete(client.id);
  }

  @SubscribeMessage("playerInput")
  handlePlayerMove(@MessageBody() data: { direction: string; jwt: string }) {
	console.log("📥 Received player input:", data);
  
	const player = this.getPlayerFromJwt(data.jwt);
	if (!player) {
	  console.warn("🚨 Invalid or expired JWT. Rejecting input.");
	  return;
	}
  
	console.log(`🎮 Player ${player.playerNumber} moved: ${data.direction}`);
  
	if (player.playerNumber === 1) {
	  if (data.direction === "up") this.gameState.paddle1Y = Math.max(0, this.gameState.paddle1Y - 20);
	  if (data.direction === "down") this.gameState.paddle1Y = Math.min(600, this.gameState.paddle1Y + 20);
	} else if (player.playerNumber === 2) {
	  if (data.direction === "up") this.gameState.paddle2Y = Math.max(0, this.gameState.paddle2Y - 20);
	  if (data.direction === "down") this.gameState.paddle2Y = Math.min(600, this.gameState.paddle2Y + 20);
	}
  
	console.log("📡 Updated game state:", this.gameState);
	this.server.emit("gameState", this.gameState);
  }
  

  getPlayerFromJwt(token: string) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return { playerNumber: decoded.sub === 1 ? 1 : 2 };
    } catch (err) {
      console.warn("🚨 Invalid JWT:", err.message);
      return null;
    }
  }

  broadcastGameState() {
    this.server.emit("gameState", this.gameState);
    console.log("📡 Sent updated game state:", this.gameState);
  }
}
