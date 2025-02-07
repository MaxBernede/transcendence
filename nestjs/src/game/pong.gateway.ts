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
	private players = new Map<string, number>(); // ✅ Must be inside the class	  
	constructor(private readonly databaseService: DatabasesService) {} 	
	@WebSocketServer()
	server: Server;
  
	private gameState = {
	  ball: { x: 390, y: 294, vx: 5, vy: 5 },
	  paddle1: { y: 250 },
	  paddle2: { y: 250 },
	  score: { player1: 0, player2: 0 },
	};
  
	private gameLoopInterval: NodeJS.Timeout | null = null;
  
	// Handle WebSocket Connection
	handleConnection(client: Socket) {
		console.log(`New player connected: ${client.id}`);
	
		client.on("registerUser", (playerNumber: number) => {
		  this.players.set(client.id, playerNumber); // ✅ Store player number instead of username
		  console.log(`🔗 Registered player ${playerNumber} (Socket: ${client.id})`);
		});
	
		if (this.players.size === 1) {
		  console.log("Starting game loop...");
		  this.startGameLoop();
		}
	  }
	  
  
	// Handle WebSocket Disconnection
	handleDisconnect(client: Socket) {
	  console.log(`Player disconnected: ${client.id}`);
	  this.players.delete(client.id);
  
	  if (this.players.size === 0 && this.gameLoopInterval) {
		console.log("No players left, stopping game loop.");
		clearInterval(this.gameLoopInterval);
		this.gameLoopInterval = null;
	  }
	}
  
	// Handle Paddle Movement
	@SubscribeMessage('playerMove')
	handlePlayerMove(@MessageBody() data: { player: number; y: number }) {
	  console.log(`Player ${data.player} moved to Y=${data.y}`);
  
	  if (data.player === 1) this.gameState.paddle1.y = data.y;
	  if (data.player === 2) this.gameState.paddle2.y = data.y;
  
	  console.log("Updated GameState:", JSON.stringify(this.gameState, null, 2));
	}
  
	// Update Game State (Moves Ball, Handles Collisions)
	private updateGameState() {
		const { ball } = this.gameState;
	  
		if (ball.x <= 0) {
		  this.gameState.score.player2++; 
		  console.log("Player 2 Scores!");
	  
		  // ✅ Find Player 2's socket ID and update DB
		  const winnerSocketId = [...this.players.entries()]
			.find(([_, playerNumber]) => playerNumber === 2)?.[0];
	  
		  if (winnerSocketId) {
			this.updateDatabase(2, winnerSocketId); // ✅ Pass socketId
		  }
	  
		  this.resetBall(-5);
		} else if (ball.x >= 800) {
		  this.gameState.score.player1++;
		  console.log("Player 1 Scores!");
	  
		  // ✅ Find Player 1's socket ID and update DB
		  const winnerSocketId = [...this.players.entries()]
			.find(([_, playerNumber]) => playerNumber === 1)?.[0];
	  
		  if (winnerSocketId) {
			this.updateDatabase(1, winnerSocketId); // ✅ Pass socketId
		  }
	  
		  this.resetBall(5);
		}
	  
		this.server.emit("gameState", this.gameState);
	  }
	  
	  
	
	  private async updateDatabase(winner: number, socketId: string) {
		try {
		  const user = await this.databaseService.findUserBySocketId(socketId);
		  if (!user) {
			console.error(`❌ User with socket ID ${socketId} not found in DB!`);
			return;
		  }
	  
		  const winnerUsername = user.username;
		  const loserSocketId = [...this.players.entries()]
			.find(([_, playerNumber]) => playerNumber !== winner)?.[0];
	  
		  if (!loserSocketId) {
			console.error("❌ No opponent found to update losses!");
			return;
		  }
	  
		  const loserUser = await this.databaseService.findUserBySocketId(loserSocketId);
		  if (!loserUser) {
			console.error(`❌ Opponent with socket ID ${loserSocketId} not found in DB!`);
			return;
		  }
	  
		  const loserUsername = loserUser.username;
	  
		  console.log(`✅ Updating database: ${winnerUsername} won, ${loserUsername} lost`);
	  
		  await this.databaseService.incrementWins(winnerUsername);
		  await this.databaseService.incrementLosses(loserUsername);
	  
		  console.log("✅ Database updated successfully!");
		} catch (error) {
		  console.error("❌ Database update failed:", error);
		}
	  }
	  
	// Reset Ball After Scoring
	private resetBall(direction: number) {
	  console.log(`Resetting Ball! Direction: ${direction}`);
	  this.gameState.ball = { x: 390, y: 294, vx: direction, vy: 5 };
	}
	@SubscribeMessage("resetGame")
	handleResetGame() {
    console.log("Game reset requested!");
    this.gameState = {
    ball: { x: 600, y: 294, vx: 5, vy: 5 },
    paddle1: { y: 250 },
    paddle2: { y: 250 },
    score: { player1: 0, player2: 0 },
  };
  this.server.emit("gameState", this.gameState);
}

  
	// Start Game Loop
	private startGameLoop() {
	  if (!this.gameLoopInterval) {
		console.log("Game loop started!");
		this.gameLoopInterval = setInterval(() => {
		//   console.log("Running game loop iteration...");
		  this.updateGameState();
		}, 1000 / 30);
	  } else {
		console.log("Game loop is already running.");
	  }
	}

	@SubscribeMessage("updateScore")
	async handleUpdateScore(
	  @ConnectedSocket() client: Socket,
	  @MessageBody() data: { player: number }
	) {
	  console.log(`⚡ Received updateScore event for Player ${data.player} (Socket: ${client.id})`);
	  await this.updateDatabase(data.player, client.id);
	}
	

  }
  