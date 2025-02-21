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

	// ends game and resets when a player has 3 points and notifies the server clients
	private checkGameOver() {
		if (this.gameState.score.player1 >= 3) {
			this.server.emit("gameOver", { winner: "Player 1" });
			this.resetGame(); //  Reset game once someone wins
		} else if (this.gameState.score.player2 >= 3) {
			this.server.emit("gameOver", { winner: "Player 2" });
			this.resetGame();
		}
	}

// Resets the entire game (after win or manual reset)
private resetGame() {
    console.log("Resetting entire game...");

    this.ballMoving = false; // Stop the ball movement completely

    // Reset game state
    this.gameState = {
        ball: { x: 390, y: 294, vx: 0, vy: 0 }, // Ensure velocity is zero
        paddle1: { y: 250 },
        paddle2: { y: 250 },
        score: { player1: 0, player2: 0 }
    };

    if (this.gameLoopInterval) {
        clearInterval(this.gameLoopInterval); // Stop game loop
        this.gameLoopInterval = null;
    }

    this.server.emit("gameState", { ...this.gameState }); // Broadcast the reset game state
}

	private ballMoving: boolean = false; 

	private gameLoopInterval: NodeJS.Timeout | null = null;
  
	constructor(private readonly databaseService: DatabasesService) {}
  
	// Spawns a power-up randomly
	private spawnPowerUp() { 
	  if (this.powerUpState.isActive) return;
	  const randomX = Math.floor(Math.random() * 600) + 100;
	  const randomY = Math.floor(Math.random() * 300) + 50;
	  const powerUpTypes = ["shrinkOpponent", "speedBoost", "enlargePaddle"];
	  const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  
	  this.powerUpState = { x: randomX, y: randomY, type: randomType as any, isActive: true };
	  this.server.emit("powerUpSpawned", this.powerUpState);
	}


	// registering a player
	@SubscribeMessage('registerUser')
	handleRegisterUser(client: Socket, username: string) {
    console.log(`Registering player: ${username}`);

    // Check if the player was previously assigned a number
    let existingPlayerEntry = Array.from(players.entries()).find(([_, player]) => player.username === username);

	// if disconnects and reconnects restore player number
    if (existingPlayerEntry) {
        console.log(` ${username} reconnected as Player ${existingPlayerEntry[1].playerNumber}`);
        players.set(client.id, existingPlayerEntry[1]); // Keep the same player number
    } else {
        // Assign a new player number only if they are truly new
        const playerNumber = players.size === 0 ? 1 : 2;
        console.log(`New player: ${username} assigned as Player ${playerNumber}`);
        players.set(client.id, { username, playerNumber });
    }

	// broadcast all players to the clients
    this.server.emit("playerInfo", Array.from(players.values())); 
}


@SubscribeMessage("requestPlayers")
handleRequestPlayers(@ConnectedSocket() client: Socket) {
    console.log(" Sending player info:", Array.from(players.values()));
    client.emit("playerInfo", Array.from(players.values()));
}

private broadcastPlayers() {
	this.server.emit('updatePlayers', Array.from(players.values()));
}

private stopBall() {
    console.log(" Stopping ball movement...");
    this.ballMoving = false;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;
}

  
	/** Resets the ball after scoring */
	private resetBall(direction: number) {
		console.log(" Resetting ball and stopping movement...");
	
		if (this.gameLoopInterval) {
			console.log("Stopping game loop before resetting ball.");
			clearInterval(this.gameLoopInterval);
			this.gameLoopInterval = null;
		}
	
		this.ballMoving = false;
	
		console.log(` Reset Ball after: X=${this.gameState.ball.x}, Y=${this.gameState.ball.y}, VX=${this.gameState.ball.vx}, VY=${this.gameState.ball.vy}, ballMoving=${this.ballMoving}`);
	
		this.gameState.ball = { 
			x: 390, 
			y: 294, 
			vx: 0, 
			vy: 0 
		};
	
		this.gameState.paddle1.y = 250;
		this.gameState.paddle2.y = 250;
	
		this.server.emit("gameState", { ...this.gameState });
	
		console.log(" Ball reset. Waiting for next movement...");
	
		//  Ensure the game loop starts after a short delay
		setTimeout(() => {
			console.log("🔄 Restarting game loop after ball reset...");
			this.startGameLoop();
		}, 2000);
	}

	// runs the game loop every 60ms (60FPS)
	private startGameLoop() {
    if (this.gameLoopInterval) {
        console.log("⚠️ Game loop already running. Skipping restart.");
        return;
    }

    console.log("Starting game loop...");
    this.gameLoopInterval = setInterval(() => {
		
			// stops updating if ball is not moving
        if (!this.ballMoving) {
            console.log("⏸ Ball is NOT moving, skipping update.");
            return;
        }

        console.log(" Ball is moving, updating game state...");
        this.updateGameState();
    }, 1000 / 60);
}	

// updates ball and paddles (gamestate)
	private updateGameState() {
		if (!this.ballMoving) return; //  Prevents ghost ball from moving
	
		const ball = this.gameState.ball;
		ball.x += ball.vx;
		ball.y += ball.vy;
	
		// Wall bounce logic
		if (ball.y <= 0 || ball.y >= 600) ball.vy = -ball.vy;
	
		// Paddle collision logic
		const paddle1 = this.gameState.paddle1;
		const paddle2 = this.gameState.paddle2;
	
		if (ball.x <= 30 && ball.y >= paddle1.y && ball.y <= paddle1.y + 100) {
			ball.vx = Math.abs(ball.vx);
		} else if (ball.x >= 770 && ball.y >= paddle2.y && ball.y <= paddle2.y + 100) {
			ball.vx = -Math.abs(ball.vx);
		}
	
		// Scoring logic
		if (ball.x <= 0) {
			this.gameState.score.player2++;
			console.log(" Player 2 Scores!");
			this.resetBall(5);
			return;
		} else if (ball.x >= 800) {
			this.gameState.score.player1++;
			console.log(" Player 1 Scores!");
			this.resetBall(-5);
			return;
		}
	
		// Broadcast updated game state
		this.server.emit("gameState", { ...this.gameState });
	}
	
	
	
	// WebSocket connection
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

	// handles disconnect
	handleDisconnect(client: Socket) {
		console.log(`Player disconnected: ${client.id}`);
	
		const playerData = players.get(client.id);
		if (playerData) {
			console.log(`⚠️ Marking ${playerData.username} as disconnected (Player ${playerData.playerNumber})`);
			players.set(client.id, { ...playerData }); // Keep their player number but remove active connection
		}
	
		// Notify remaining players that a player is disconnected
		this.server.emit("playerInfo", Array.from(players.values()));
	}	
	
	// updates paddle position
	@SubscribeMessage("playerMove")
	handlePlayerMove(@MessageBody() data: { player: number; y: number }, @ConnectedSocket() client: Socket) {
    const playerInfo = players.get(client.id);
    if (!playerInfo) {
        console.error(`Received move from unknown client: ${client.id}`);
        return;
    }

    // Ensure only the correct player moves their paddle
    if (data.player === 1 && playerInfo.playerNumber === 1) {
        this.gameState.paddle1.y = data.y;
        console.log(` Player 1 moved paddle to Y=${data.y}`);
    } else if (data.player === 2 && playerInfo.playerNumber === 2) {
        this.gameState.paddle2.y = data.y;
        console.log(` Player 2 moved paddle to Y=${data.y}`);
    } else {
        console.warn(`Invalid move detected! Player ${playerInfo.playerNumber} tried to move Player ${data.player}'s paddle.`);
        return; 
    }

    //  Ensure ball starts moving when a paddle moves
    if (!this.ballMoving) {
        console.log(" First paddle move detected, starting ball movement...");
        this.ballMoving = true;
        this.gameState.ball.vx = Math.random() > 0.5 ? 5 : -5;
        this.gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;

        // Ensure game loop restarts
        if (!this.gameLoopInterval) {
            console.log(" Restarting game loop...");
            this.startGameLoop();
        }
    }

    // Emit the updated game state to ALL players
    this.server.emit("gameState", { ...this.gameState });
}
  }