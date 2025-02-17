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
	
	private checkGameOver() {
		if (this.gameState.score.player1 >= 3) {
			this.server.emit("gameOver", { winner: "Player 1" });
			this.resetGame(); // ✅ Reset game once someone wins
		} else if (this.gameState.score.player2 >= 3) {
			this.server.emit("gameOver", { winner: "Player 2" });
			this.resetGame();
		}
	}

	private resetGame() {
		console.log("Resetting game...");
		
		this.gameState = {
			ball: { x: 390, y: 294, vx: 5, vy: 5 },
			paddle1: { y: 250 },
			paddle2: { y: 250 },
			score: { player1: 0, player2: 0 },
		};
	
		this.server.emit("gameState", this.gameState); // Send new game state to clients
	}
	
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
			}, 1000 / 30); // Run at 30 FPS
		} else {
			console.log("Game loop is already running.");
		}
	}
	
  
	/** Updates ball movement and collisions */
	// private updateGameState() {
	// 	const ball = this.gameState.ball;

	// 	// console.log("go into updategamestate");
	// 	// Ball collision with walls

	// 	console.log("ball.x: ", ball.x);
	// 	if (ball.x <= 0) {
	// 	  this.gameState.score.player2++;
	// 	  console.log("Player 2 Scores!");
	// 	  this.resetBall(-5);
	// 	} else if (ball.x >= 800) {
	// 	  this.gameState.score.player1++;
	// 	  console.log("Player 1 Scores!");
	// 	  this.resetBall(5);
	// 	}

	// 	// console.log("Emitting gameState:", this.gameState);
	// 	this.server.emit("gameState", this.gameState);
	//   }

	// private updateGameState() {
	// 	const ball = this.gameState.ball;
	  
	// 	ball.x += ball.vx;
	// 	ball.y += ball.vy;
	  
	// 	if (ball.y <= 0 || ball.y >= 600) {
	// 	  ball.vy = -ball.vy;
	// 	}
	  
	// 	const paddle1 = this.gameState.paddle1;
	// 	const paddle2 = this.gameState.paddle2;
	  
	// 	if (ball.x <= 30 && ball.y >= paddle1.y && ball.y <= paddle1.y + 100) {
	// 	  ball.vx = Math.abs(ball.vx);
	// 	} else if (ball.x >= 770 && ball.y >= paddle2.y && ball.y <= paddle2.y + 100) {
	// 	  ball.vx = -Math.abs(ball.vx);
	// 	}
	  
	// 	if (ball.x <= 0) {
	// 	  this.gameState.score.player2++;
	// 	  this.resetBall(5);
	// 	  return;
	// 	} else if (ball.x >= 800) {
	// 	  this.gameState.score.player1++;
	// 	  this.resetBall(-5);
	// 	  return;
	// 	}
	  
	// 	// Continuously send ball updates
	// 	this.server.emit("gameState", this.gameState);
	//   }
	
	private updateGameState() {
		const ball = this.gameState.ball;
	
		// Move the ball
		ball.x += ball.vx;
		ball.y += ball.vy;
	
		// Bounce off top and bottom walls
		if (ball.y <= 0 || ball.y >= 600) {
			ball.vy = -ball.vy;
		}
	
		const paddle1 = this.gameState.paddle1;
		const paddle2 = this.gameState.paddle2;
	
		// Ball collision with paddles
		if (ball.x <= 30 && ball.y >= paddle1.y && ball.y <= paddle1.y + 100) {
			ball.vx = Math.abs(ball.vx); // Bounce right
		} else if (ball.x >= 770 && ball.y >= paddle2.y && ball.y <= paddle2.y + 100) {
			ball.vx = -Math.abs(ball.vx); // Bounce left
		}
	
		// Handle scoring
		if (ball.x <= 0) {
			this.gameState.score.player2++;
			console.log("Player 2 Scores!");
			this.resetBall(5);
			this.checkGameOver(); // Check if someone won
			return;
		} else if (ball.x >= 800) {
			this.gameState.score.player1++;
			console.log("Player 1 Scores!");
			this.resetBall(-5);
			this.checkGameOver();
			return;
		}
	
		// **Emit updated game state to all clients**
		this.server.emit("gameState", this.gameState);
	}
	
	
	

	/** WebSocket connection */
	handleConnection(client: Socket) {
		console.log(`New player connected: ${client.id}`);
	
		client.on("registerUser", (username: string) => {
			if (!username || typeof username !== "string") {
				console.error("Invalid username received:", username);
				return;
			}
	
			// Remove duplicate usernames
			for (const [socketId, player] of players.entries()) {
				if (player.username === username) {
					players.delete(socketId);
					break;
				}
			}
	
			// Assign player number
			const currentPlayers = Array.from(players.values());
			let playerNumber = 1;
			if (currentPlayers.some(p => p.playerNumber === 1)) {
				playerNumber = 2;
			}
	
			players.set(client.id, { username, playerNumber });
	
			console.log(`Registered ${username} as Player ${playerNumber}`);
	
			// Notify clients about players
			this.server.emit("playerInfo", Array.from(players.values()));
	
			// ✅ Start game loop when 2 players are connected
			if (players.size === 2) {
				this.startGameLoop();
			}
		});
	
		client.on("requestPlayers", () => {
			client.emit("playerInfo", Array.from(players.values()));
		});
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
	
	@SubscribeMessage("playerMove")
	handlePlayerMove(
	  @MessageBody() data: { player: number; y: number },
	  @ConnectedSocket() client: Socket
	) {
	  const playerInfo = players.get(client.id);
	  if (!playerInfo) {
		console.error(`Received move from unknown client: ${client.id}`);
		return;
	  }
	
	  // Correctly update paddles in gameState
	  if (data.player === 1) {
		this.gameState.paddle1.y = data.y;
		console.log(`Player 1 moved to Y=${data.y}`);
	  } else if (data.player === 2) {
		this.gameState.paddle2.y = data.y;
		console.log(`Player 2 moved to Y=${data.y}`);
	  }
	
	  //  Send updated game state to ALL players
	  this.server.emit("gameState", this.gameState);
	}
	
	@SubscribeMessage("startBall")
	handleStartBall() {
	if (!this.gameLoopInterval) {
		console.log("Starting game loop...");
		this.startGameLoop();
	}
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
  