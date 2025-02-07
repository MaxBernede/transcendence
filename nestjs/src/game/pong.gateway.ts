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
  
	private players = new Map<string, number>();
	private gameLoopInterval: NodeJS.Timeout | null = null;
  
	handleConnection(client: Socket) {
	  console.log(`New player connected: ${client.id}`);
  
	  if (!this.server) {
		console.log("WebSocket server not initialized yet!");
		return;
	  }
  
	  if (this.players.size === 0) this.players.set(client.id, 1);
	  else if (this.players.size === 1) this.players.set(client.id, 2);
	  else {
		client.disconnect();
		return;
	  }
  
	  if (this.players.size === 1) {
		console.log("Starting game loop...");
		this.startGameLoop();
	  }
	}
  
	handleDisconnect(client: Socket) {
	  console.log(`Player disconnected: ${client.id}`);
	  this.players.delete(client.id);
  
	  if (this.players.size === 0 && this.gameLoopInterval) {
		console.log("No players left, stopping game loop.");
		clearInterval(this.gameLoopInterval);
		this.gameLoopInterval = null;
	  }
	}
  
	@SubscribeMessage('playerMove')
	handlePlayerMove(@MessageBody() data: { player: number; y: number }) {
	  console.log(`Player ${data.player} moved to Y=${data.y}`);
  
	  if (data.player === 1) this.gameState.paddle1.y = data.y;
	  if (data.player === 2) this.gameState.paddle2.y = data.y;
  
	  console.log("Updated GameState:", JSON.stringify(this.gameState, null, 2));
	}
  
	private updateGameState() {
		if (!this.server) {
		  console.log("WebSocket server is not initialized. Skipping gameState emit.");
		  return;
		}
	  
		console.log("Running updateGameState()... ");
	  
		const { ball, paddle1, paddle2 } = this.gameState;
		const ballRadius = 10; // Ball size
		const gameWidth = 800; // Game area width
		const gameHeight = 600; // Game area height
		const paddleWidth = 10; // Paddle width
		const paddleHeight = 100; // Paddle height
	  
		// Move the ball
		ball.x += ball.vx;
		ball.y += ball.vy;
	  
		// ✅ Ball collision with top and bottom walls (bouncing)
		if (ball.y - ballRadius <= 0 || ball.y + ballRadius >= gameHeight) {
		  ball.vy *= -1; // Reverse vertical direction
		  console.log("🚀 Ball bounced off the top/bottom wall!");
		}
	  
		// ✅ Ball collision with left paddle (Player 1)
		if (
		  ball.x - ballRadius <= paddleWidth + 20 && // Ball reaches left paddle
		  ball.y >= paddle1.y &&
		  ball.y <= paddle1.y + paddleHeight
		) {
		  console.log("🎾 Ball hit Paddle 1!");
		  ball.vx = Math.abs(ball.vx); // Ensure it moves right
		}
	  
		// ✅ Ball collision with right paddle (Player 2)
		if (
		  ball.x + ballRadius >= gameWidth - paddleWidth - 20 && // Ball reaches right paddle
		  ball.y >= paddle2.y &&
		  ball.y <= paddle2.y + paddleHeight
		) {
		  console.log("Ball hit Paddle 2!");
		  ball.vx = -Math.abs(ball.vx); // Ensure it moves left
		}
	  
		// Ball scoring logic (if ball goes past a paddle)
		if (ball.x - ballRadius <= 0) {
		  // Ball goes past left paddle → Player 2 scores
		  this.gameState.score.player2++;
		  console.log("Player 2 Scores!");
		  this.resetBall(5); // Reset ball moving toward Player 1
		  return;
		} else if (ball.x + ballRadius >= gameWidth) {
		  // Ball goes past right paddle → Player 1 scores
		  this.gameState.score.player1++;
		  console.log("Player 1 Scores!");
		  this.resetBall(-5); // Reset ball moving toward Player 2
		  return;
		}
	  
		// Emit updated game state
		this.server.emit("gameState", this.gameState);
		console.log("Emitting gameState:", JSON.stringify(this.gameState, null, 2));
	  }
	  
	  
  
	  private resetBall(direction: number) {
		console.log(`Resetting Ball! Direction: ${direction}`);
		this.gameState.ball = {
		  x: 390, // Reset to center
		  y: 294, // Reset to center
		  vx: direction, // Start moving towards the scoring player
		  vy: 5 * (Math.random() > 0.5 ? 1 : -1), // Random vertical direction
		};
	  }
	  
  
	private startGameLoop() {
	  if (!this.gameLoopInterval) {
		console.log(" Game loop started!");
		this.gameLoopInterval = setInterval(() => {
		  console.log("⏳ Running game loop iteration...");
		  this.updateGameState();
		}, 1000 / 30);
	  } else {
		console.log("Game loop is already running.");
	  }
	}
  }
  