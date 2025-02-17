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
import { MenuList } from '@mui/material';
  
  export const players = new Map<string, { username: string; playerNumber: number }>();
  
  @WebSocketGateway({ namespace: 'pong', cors: { origin: '*' } })
  export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;
  
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
  
	/** Spawns a power-up randomly */
	private spawnPowerUp() { 
	  if (this.powerUpState.isActive) return;
	  const randomX = Math.floor(Math.random() * 600) + 100;
	  const randomY = Math.floor(Math.random() * 300) + 50;
	  const powerUpTypes = ["shrinkOpponent", "speedBoost", "enlargePaddle"];
	  const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  
	  this.powerUpState = { x: randomX, y: randomY, type: randomType as any, isActive: true };
	  this.server.emit("powerUpSpawned", this.powerUpState);
	}
  
	/** Resets the ball after scoring */
	private resetBall(direction: number) {
		this.gameState.ball.x = 390;
		this.gameState.ball.y = 294;
		this.gameState.ball.vx = direction;
		this.gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;
	
		this.server.emit("gameState", this.gameState);
		console.log("Ball reset and broadcasted to clients");
	  }
  
	/** Game loop */
	private startGameLoop() {
		if (!this.gameLoopInterval) {
		  console.log("Game loop started!");
		  this.gameLoopInterval = setInterval(() => {
			this.updateGameState();
	
			// Randomly spawn a power-up every 10 seconds
			if (Math.random() < 0.01) { 
			  this.spawnPowerUp();
			}
		  }, 1000 / 30);
		} else {
		  console.log("Game loop is already running.");
		}
	  }
  
	/** Updates ball movement and collisions */
	private updateGameState() {
		const ball = this.gameState.ball;

		// console.log("go into updategamestate");
		// Ball collision with walls

		console.log("ball.x: ", ball.x);
		if (ball.x <= 0) {
		  this.gameState.score.player2++;
		  console.log("Player 2 Scores!");
		  this.resetBall(-5);
		} else if (ball.x >= 800) {
		  this.gameState.score.player1++;
		  console.log("Player 1 Scores!");
		  this.resetBall(5);
		}

		// console.log("Emitting gameState:", this.gameState);
		this.server.emit("gameState", this.gameState);
	  }

	/** WebSocket connection */
	handleConnection(client: Socket) {
		console.log(` New player connected: ${client.id}`);
	
		client.on("registerUser", (username: string) => {
			if (!username || typeof username !== "string") {
				console.error("Invalid username received:", username);
				return;
			}

			console.log("checking backend");
	
			// Remove duplicate players with the same username
			for (const [socketId, player] of players.entries()) {
				if (player.username === username) {Game loop
				}
			}
	
			// Assign player numbers correctly
			const currentPlayers = Array.from(players.values());
			let playerNumber = 1;
			if (currentPlayers.some(p => p.playerNumber === 1)) {
				playerNumber = 2; // If Player 1 exists, new player is Player 2
			}
	
			players.set(client.id, { username, playerNumber });
	
			console.log(`Registered ${username} as Player ${playerNumber} (Socket: ${client.id})`);
			this.server.emit("playerInfo", Array.from(players.values())); 
		});
	
		client.on("requestPlayers", () => {
			client.emit("playerInfo", Array.from(players.values()));
		});

		
		players.set("ivan-mel", {username: "ivan-mel", playerNumber: 0});
		players.set("mbernede", {username: "mbernede", playerNumber: 1});
		console.log("players array: ", players);
		if (players.size === 2) {
			this.startGameLoop();
		}
	}
	
	
  
	/** WebSocket disconnection */
	handleDisconnect(client: Socket) {
		console.log(` Player disconnected: ${client.id}`);
	
		const removedPlayer = players.get(client.id);
		players.delete(client.id);
	
		if (removedPlayer) {
			console.log(`Removed player: ${removedPlayer.username}`);
		}
	
		// If there is only one player left, reset the game
		if (players.size < 2) {
			console.log(" Not enough players, resetting game.");
			this.server.emit("playerInfo", Array.from(players.values())); // Update clients
		}
	
		if (players.size === 0 && this.gameLoopInterval) {
			console.log("No players left, stopping game loop.");
			clearInterval(this.gameLoopInterval);
			this.gameLoopInterval = null;
		}
	}
	
	
  
	/** Handles player movement */
	@SubscribeMessage("playerMove")
	handlePlayerMove(@MessageBody() data: { player: number; y: number }, @ConnectedSocket() client: Socket) {
		const playerInfo = players.get(client.id);
		if (!playerInfo) {
			console.error(`Received move from unknown client: ${client.id}`);
			return;
		}
	
		if (data.player === 1) {
			this.gameState.paddle1.y = data.y;
			console.log(` Player 1 (${playerInfo.username}) moved to Y=${data.y}`);
		} 
		if (data.player === 2) {
			this.gameState.paddle2.y = data.y;
			console.log(` Player 2 (${playerInfo.username}) moved to Y=${data.y}`);
		}
	
		this.server.emit("gameState", this.gameState);
	}
	
	
  
	/** Handles power-up collection */
	@SubscribeMessage("powerUpCollected")
	handlePowerUpCollected(@MessageBody() data: { player: number }) {
	  if (!this.powerUpState.isActive) return;
	  if (this.powerUpState.type === "shrinkOpponent") this.server.emit("shrinkPaddle", { player: data.player === 1 ? 2 : 1 });
	  else if (this.powerUpState.type === "speedBoost") this.server.emit("increaseBallSpeed");
	  else if (this.powerUpState.type === "enlargePaddle") this.server.emit("enlargePaddle", { player: data.player });
  
	  this.powerUpState = { x: null, y: null, type: null, isActive: false };
	  this.server.emit("powerUpCleared");
	}
  
	/** Sends latest game state */
	@SubscribeMessage("requestGameState")
	handleRequestGameState(@ConnectedSocket() client: Socket) {
	  client.emit("gameState", this.gameState);
	}
  }
  