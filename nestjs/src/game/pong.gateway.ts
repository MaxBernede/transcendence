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
  import { DatabasesService } from "../database/database.service";
  
  @WebSocketGateway({ namespace: 'pong', cors: { origin: '*' } })
  export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;
  
	private players = new Map<string, { username: string; playerNumber: number }>();
	
	private gameState = {
	  ball: { x: 390, y: 294, vx: 5, vy: 5 },
	  paddle1: { y: 250 },
	  paddle2: { y: 250 },
	  score: { player1: 0, player2: 0 },
	};
  
	private powerUpState = {
	  x: null as number | null,
	  y: null as number | null,
	  type: null as "shrinkOpponent" | "speedBoost" | "enlargePaddle" | null,
	  isActive: false,
	};
  
	private gameLoopInterval: NodeJS.Timeout | null = null;
  
	constructor(private readonly databaseService: DatabasesService) {}
  
	/** ✅ FUNCTION: Spawns a power-up randomly on the field */
	private spawnPowerUp() {
	  if (this.powerUpState.isActive) return; // Prevent multiple active power-ups
  
	  const randomX = Math.floor(Math.random() * 600) + 100; // Adjust range as needed
	  const randomY = Math.floor(Math.random() * 300) + 50;
	  const powerUpTypes = ["shrinkOpponent", "speedBoost", "enlargePaddle"];
	  const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  
	  this.powerUpState = {
		x: randomX,
		y: randomY,
		type: randomType as "shrinkOpponent" | "speedBoost" | "enlargePaddle",
		isActive: true,
	  };
  
	  console.log(`🟢 Power-up spawned: ${randomType} at (${randomX}, ${randomY})`);
  
	  // Send power-up data to all clients
	  this.server.emit("powerUpSpawned", this.powerUpState);
	}
  
	/** ✅ FUNCTION: Resets the ball position after scoring */
	private resetBall(direction: number) {
	  this.gameState.ball.x = 390;
	  this.gameState.ball.y = 294;
	  this.gameState.ball.vx = direction;
	  this.gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;
  
	  this.server.emit("gameState", this.gameState);
	  console.log("🔄 Ball reset and broadcasted to clients");
	}
  
	/** ✅ FUNCTION: Game loop that updates ball movement and spawns power-ups */
	private startGameLoop() {
	  if (!this.gameLoopInterval) {
		console.log("Game loop started!");
		this.gameLoopInterval = setInterval(() => {
		  this.updateGameState();
  
		  // 🔥 Randomly spawn a power-up every 10 seconds (adjust frequency as needed)
		  if (Math.random() < 0.01) { // 1% chance every frame (~30FPS)
			this.spawnPowerUp();
		  }
		}, 1000 / 30);
	  } else {
		console.log("Game loop is already running.");
	  }
	}
  
	/** ✅ FUNCTION: Updates ball and collision detection */
	private updateGameState() {
	  const { ball } = this.gameState;
  
	  // Ball collision with walls
	  if (ball.x <= 0) {
		this.gameState.score.player2++;
		console.log("Player 2 Scores!");
		this.resetBall(-5);
	  } else if (ball.x >= 800) {
		this.gameState.score.player1++;
		console.log("Player 1 Scores!");
		this.resetBall(5);
	  }
  
	  this.server.emit("gameState", this.gameState);
	}
  
	// Handles WebSocket connection
	handleConnection(client: Socket) {
		console.log(`New player connected: ${client.id}`);
	  
		client.on("registerUser", (username: string) => {
		  if (!username || typeof username !== "string") {
			console.error("Received invalid username:", username);
			return;
		  }
	  
		  const playerNumber = this.players.size === 0 ? 1 : 2;
		  this.players.set(client.id, { username, playerNumber });
	  
		  console.log(`🔗 Registered ${username} as Player ${playerNumber} (Socket: ${client.id})`);
		  this.server.emit("playerInfo", Array.from(this.players.values())); // Broadcast all players
		});
	  
		client.on("requestPlayers", () => {
		  console.log("📢 Sending current players to new connection.");
		  client.emit("playerInfo", Array.from(this.players.values())); //  Send to requesting client
		});
	  
		if (this.players.size === 2) {
		  console.log("Starting game loop...");
		  this.startGameLoop();
		}
	  }
	  
  
	/** Handles WebSocket disconnection */
	handleDisconnect(client: Socket) {
	  console.log(`Player disconnected: ${client.id}`);
	  this.players.delete(client.id);
  
	  if (this.players.size === 0 && this.gameLoopInterval) {
		console.log("No players left, stopping game loop.");
		clearInterval(this.gameLoopInterval);
		this.gameLoopInterval = null;
	  }
	}
  
	/** ✅ FUNCTION: Handles player movement */
	@SubscribeMessage('playerMove')
	handlePlayerMove(@MessageBody() data: { player: number; y: number }) {
	  console.log(`Player ${data.player} moved to Y=${data.y}`);
  
	  if (data.player === 1) this.gameState.paddle1.y = data.y;
	  if (data.player === 2) this.gameState.paddle2.y = data.y;
  
	  // 🔥 Broadcast updated state to all players
	  this.server.emit("gameState", this.gameState);
	}
  
	/** ✅ FUNCTION: Handles when a power-up is collected */
	@SubscribeMessage("powerUpCollected")
	handlePowerUpCollected(@MessageBody() data: { player: number }) {
	  console.log(`⚡ Player ${data.player} collected power-up: ${this.powerUpState.type}`);
  
	  if (!this.powerUpState.isActive) return;
  
	  // Apply power-up effect
	  if (this.powerUpState.type === "shrinkOpponent") {
		this.server.emit("shrinkPaddle", { player: data.player === 1 ? 2 : 1 });
	  } else if (this.powerUpState.type === "speedBoost") {
		this.server.emit("increaseBallSpeed");
	  } else if (this.powerUpState.type === "enlargePaddle") {
		this.server.emit("enlargePaddle", { player: data.player });
	  }
  
	  // Reset power-up state
	  this.powerUpState = { x: null, y: null, type: null, isActive: false };
	  this.server.emit("powerUpCleared"); // Notify clients to remove power-up from screen
	}
  }
  