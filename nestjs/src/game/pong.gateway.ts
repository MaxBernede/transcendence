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
			this.resetGame(); //  Reset game once someone wins
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

	@SubscribeMessage('registerUser')
	handleRegisterUser(client: Socket, username: string) {
		if (Array.from(players.values()).some(player => player.username === username)) {
			console.log(`${username} is already registered, ignoring duplicate request.`);
			return;
		}
		const playerNumber = players.size + 1;
		players.set(client.id, { username, playerNumber });
		this.broadcastPlayers();
	}
	

@SubscribeMessage("requestPlayers")
handleRequestPlayers(@ConnectedSocket() client: Socket) {
    console.log("📌 Sending player info:", Array.from(players.values()));
    client.emit("playerInfo", Array.from(players.values()));
}

private broadcastPlayers() {
	this.server.emit('updatePlayers', Array.from(players.values()));
}

  
	/** Resets the ball after scoring */
	private resetBall(direction: number) {
		console.log("Resetting ball...");
	
		this.gameState.ball = { x: 390, y: 294, vx: direction, vy: Math.random() > 0.5 ? 5 : -5 };
		this.server.emit("gameState", this.gameState); // Immediately send updated game state
	}
	
  
	/** Game loop */
	private startGameLoop() {
		if (!this.gameLoopInterval) {
			console.log("Game loop started!");

			const playerEntries = Array.from(players.entries());

			if (playerEntries.length === 2) {
				const [player1Entry, player2Entry] = playerEntries;
				const [id1, player1Data] = player1Entry;
				const [id2, player2Data] = player2Entry;

				// Check if Player 1 already exists
				const player1Exists = playerEntries.some(([_, player]) => player.playerNumber === 1);
				
				if (!player1Exists) {
					players.set(id1, { username: player1Data.username, playerNumber: 1 });
					players.set(id2, { username: player2Data.username, playerNumber: 2 });
				} else {
					players.set(id1, { username: player1Data.username, playerNumber: 2 });
				}

				console.log(` Assigned ${player1Data.username} as Player 1 and ${player2Data.username} as Player 2`);

				this.server.emit("playerInfo", Array.from(players.values()));
			}


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
		// console.log("Ball coordinates:", ball.x, ball.y); // Debugging
	
		// Ensure the ball is valid
		if (ball.x === undefined || ball.y === undefined) {
			console.warn("⚠️ Ball data is undefined!", this.gameState);
			return;
		}
	
		// Move the ball
		ball.x += ball.vx;
		ball.y += ball.vy;
	
		// Bounce off top and bottom walls
		if (ball.y <= 0 || ball.y >= 600) {
			ball.vy = -ball.vy;
		}
	
		const paddle1 = this.gameState.paddle1;
		const paddle2 = this.gameState.paddle2;
	
		// Fix ball getting stuck inside paddles
		if (ball.x <= 30 && ball.y >= paddle1.y && ball.y <= paddle1.y + 100) {
			ball.vx = Math.abs(ball.vx); // Bounce right
			ball.x = 31; // Prevent sticking inside the paddle
		} else if (ball.x >= 770 && ball.y >= paddle2.y && ball.y <= paddle2.y + 100) {
			ball.vx = -Math.abs(ball.vx); // Bounce left
			ball.x = 769; // Prevent sticking inside the paddle
		}
	
		// Handle scoring and ensure game state is updated immediately
		if (ball.x <= 0) {
			this.gameState.score.player2++;
			console.log("Player 2 Scores!");
			this.resetBall(5);
			this.checkGameOver();
			return;
		} else if (ball.x >= 800) {
			this.gameState.score.player1++;
			console.log("Player 1 Scores!");
			this.resetBall(-5);
			this.checkGameOver();
			return;
		}
	
		// Ensure fresh state is sent to prevent ghost ball issues
		this.server.emit("gameState", { ...this.gameState });
	}
	
	/** WebSocket connection */
	handleConnection(client: Socket) {
		console.log("New player connected: ${client.id}");
	
		client.on("registerUser", (username: string) => {
			if (!username || typeof username !== "string") {
				console.error("Invalid username received:", username);
				return;
			}
		
			// Check if the player is already registered
			const existingPlayer = Array.from(players.values()).find(p => p.username === username);
			if (existingPlayer) {
				console.log('${username} is already registered, ignoring duplicate request.');
				return;
			}

			let playerNumber = players.size === 0 ? 1 : 2; // Assign player numbers
			console.log("player number: ", playerNumber);

			players.set(client.id, { username, playerNumber });
		
			console.log('Registered ${username} as Player ${playerNumber}');
			this.server.emit("playerInfo", Array.from(players.values()));
		
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
		console.log(`Player disconnected: ${client.id}`);
		
		// Find the player by their socket ID
		for (const [id, playerData] of players.entries()) {
			if (id === client.id) {
				console.log(`Removing player: ${playerData.username}`);
				players.delete(id);
				break;
			}
		}
	
		// Check if only one player remains
		if (players.size < 2) {
			console.log("Not enough players, resetting game.");
			this.resetGame();
		}
	
		// Notify clients about updated player list
		this.server.emit("playerInfo", Array.from(players.values()));
	}
	
	
	
	@SubscribeMessage("playerMove")
handlePlayerMove(
    @MessageBody() data: { player: number; y: number },
    @ConnectedSocket() client: Socket
) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
        console.error("Received move from unknown client: ${client.id}");
        return;
    }

    // Ensure each player moves only their own paddle
    if (data.player === 1 && playerInfo.playerNumber === 1) {
        this.gameState.paddle1.y = data.y;
        console.log("Player 1 moved paddle to Y=${data.y}");
    } else if (data.player === 2 && playerInfo.playerNumber === 2) {
        this.gameState.paddle2.y = data.y;
        console.log("Player 2 moved paddle to Y=${data.y}");
    } else {
        console.warn("Invalid move detected! Player ${playerInfo.playerNumber} tried to move Player ${data.player}'s paddle.");
        return; // Prevent Player 1 from moving Player 2's paddle and vice versa
    }

    // Send paddle update to all clients
    // this.server.emit("playerMoveUpdate", {
        // paddle1Y: this.gameState.paddle1.y,
        // paddle2Y: this.gameState.paddle2.y
    // });
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