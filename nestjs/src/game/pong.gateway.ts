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
		vx: 0, // Ensure velocity is always set
		vy: 0,
		type: null as "shrinkOpponent" | "speedBoost" | "enlargePaddle" | null,
		isActive: false,
	};

	// ends game and resets when a player has 3 points and notifies the server clients
	private checkGameOver() {
		if (this.gameState.score.player1 >= 3) {
			console.log("🎉 Player 1 WINS!");
			this.server.emit("gameOver", { winner: "Player 1" });
			setTimeout(() => this.resetGame(), 3000); // Reset after 3 seconds
		} else if (this.gameState.score.player2 >= 3) {
			console.log("🎉 Player 2 WINS!");
			this.server.emit("gameOver", { winner: "Player 2" });
			setTimeout(() => this.resetGame(), 3000); // Reset after 3 seconds
		}
	}

// Resets the entire game (after win or manual reset)
private resetGame() {
    console.log("Resetting entire game...");

	
	// Stop the previous game loop if running
	if (this.gameLoopInterval) {
		console.log("Stopping existing game loop to prevent multiple instances.");
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
    }
	
    // Reset game state
    this.gameState = {
		ball: { x: 390, y: 294, vx: 0, vy: 0 }, // Ensure velocity is zero
        paddle1: { y: 250 },
        paddle2: { y: 250 },
        score: { player1: 0, player2: 0 }
    };
	
	this.ballMoving = false; // Stop the ball movement completely

    if (this.powerUpState.isActive) {
        console.log("Keeping power-up active after reset.");
    } else {
        this.powerUpState = {
            x: null,
            y: null,
            vx: 0, 
            vy: 0,
            type: null,
            isActive: false
        };
    }

	console.log("Game has been fully reset.");

    this.server.emit("gameState", this.gameState); // Broadcast the reset game state
	this.server.emit("gameReset");
}

	private ballMoving: boolean = false; 

	private gameLoopInterval: NodeJS.Timeout | null = null;
  
	constructor(private readonly databaseService: DatabasesService) {
		if (PongGateway.instance) {
			console.warn(" PongGateway already initialized! Preventing duplicate instances.");
			return PongGateway.instance;
		}
		PongGateway.instance = this;
	}
	private static instance: PongGateway | null = null;
	
  
	// Spawns a power-up randomly
	private spawnPowerUp() { 
		if (this.powerUpState.isActive) return;

		console.log("⚡ Spawning power-up at:", this.powerUpState);

		
		const randomX = Math.floor(Math.random() * 600) + 100;
		const randomY = Math.floor(Math.random() * 300) + 50;
		const powerUpTypes: Array<"shrinkOpponent" | "speedBoost" | "enlargePaddle"> = [
		  "shrinkOpponent", 
		  "speedBoost", 
		  "enlargePaddle"
		];
		const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] as "shrinkOpponent" | "speedBoost" | "enlargePaddle";
	  
		console.log("Spawning Power-up at", { randomX, randomY, randomType });
	  
		this.powerUpState = { 
			x: randomX, 
			y: randomY, 
			vx: Math.random() > 0.5 ? 3 : -3,
			vy: Math.random() > 0.5 ? 2 : -2,
			type: randomType, 
			isActive: true 
		};

		console.log("📡 Emitting powerUpSpawned:", this.powerUpState);

		this.server.emit("powerUpSpawned", this.powerUpState);
	  }
	  
	  

@SubscribeMessage('registerUser')
handleRegisterUser(client: Socket, username: string) {
    console.log(` Registering player: ${username}`);

    // Check if the player was previously assigned a number
    let existingPlayer = Array.from(players.entries()).find(([_, player]) => player.username === username);

    if (existingPlayer) {
        //  Preserve the same player number even after refresh
        console.log(` ${username} reconnected as Player ${existingPlayer[1].playerNumber}`);

        // Remove old socket ID reference
        players.delete(existingPlayer[0]);

        // Assign the new socket ID while keeping the same player number
        players.set(client.id, existingPlayer[1]);
    } else {
        //  Check if Player 1 is available
        const playerNumbers = new Set(Array.from(players.values()).map(player => player.playerNumber));
        let assignedPlayerNumber = playerNumbers.has(1) ? 2 : 1; // Keep Player 1 if possible

        console.log(` New player: ${username} assigned as Player ${assignedPlayerNumber}`);
        players.set(client.id, { username, playerNumber: assignedPlayerNumber });
    }

    this.server.emit("playerInfo", Array.from(players.values())); // Notify all clients
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
		
		this.ballMoving = false;
	
		if (this.gameLoopInterval) {
			console.log("Stopping game loop before resetting ball.");
			clearInterval(this.gameLoopInterval);
			this.gameLoopInterval = null;
		}
	
		this.gameState.ball = { 
			x: 390, 
			y: 294, 
			vx: direction,
			vy: Math.random() > 0.5 ? 5 : -5
		};
	
		this.gameState.paddle1.y = 250;
		this.gameState.paddle2.y = 250;
	
		// Dont reset the power-up state!
		this.server.emit("gameState", { ...this.gameState, powerUp: this.powerUpState });
	
		this.startGameLoop();
		console.log(" Ball reset. Power-ups remain active.");
	}

	private updatePowerUpState() {
        if (!this.powerUpState.isActive)
			return;

		if (this.powerUpState.vx === 0) this.powerUpState.vx = Math.random() > 0.5 ? 3 : -3;
		if (this.powerUpState.vy === 0) this.powerUpState.vy = Math.random() > 0.5 ? 2 : -2;

        this.powerUpState.x += this.powerUpState.vx;
        this.powerUpState.y += this.powerUpState.vy;

        // Bounce power-ups off the walls
        if (this.powerUpState.x <= 0 || this.powerUpState.x >= 770) {
            console.log(" Power-Up bounced off X wall!");
            this.powerUpState.vx *= -1; 
        }
        if (this.powerUpState.y <= 0 || this.powerUpState.y >= 600) {
            console.log(" Power-Up bounced off Y wall!");
            this.powerUpState.vy *= -1;
        }

        this.checkPowerUpCollision();
        this.server.emit("updatePowerUp", this.powerUpState);
    }
	

	// runs the game loop every 60ms (60FPS)
	private startGameLoop() {
    if (this.gameLoopInterval) {
        console.log(" Game loop already running. Skipping restart.");
        return;
    }

    console.log("Starting game loop...");
    this.gameLoopInterval = setInterval(() => {
		
			// stops updating if ball is not moving
        if (!this.ballMoving && !this.powerUpState.isActive) {
            // console.log("Ball is NOT moving, skipping update.");
            return;
        }

        // console.log(" Ball is moving, updating game state...");
        this.updateGameState();

		if (this.powerUpState.isActive) {
            this.updatePowerUpState(); // Ensure power-up keeps moving!
        }

		if (Math.random() < 0.05) { // 0.5% chance per frame (~every 10-15 seconds)
			this.spawnPowerUp();
		}
    }, 1000 / 60);
}	

/** Handles power-up collection */
@SubscribeMessage("powerUpCollected")
handlePowerUpCollected(@MessageBody() data: { player: number }) {
    if (!this.powerUpState.isActive) return; // Ignore if no active power-up

    console.log(`🔥 Player ${data.player} collected ${this.powerUpState.type}`);

    if (this.powerUpState.type === "shrinkOpponent") {
        this.server.emit("shrinkPaddle", { player: data.player === 1 ? 2 : 1 });
    } else if (this.powerUpState.type === "speedBoost") {
        this.server.emit("increaseBallSpeed");
    } else if (this.powerUpState.type === "enlargePaddle") {
        this.server.emit("enlargePaddle", { player: data.player });
    }

    // Reset power-up state
    this.powerUpState = { x: null, y: null, vx: 0, vy: 0, type: null, isActive: false };
    this.server.emit("powerUpCleared");
}

private applyPowerUpEffect(player: number, type: "shrinkOpponent" | "speedBoost" | "enlargePaddle") {
    if (!type) return;

    console.log(`🔥 Applying ${type} to Player ${player}`);

    if (type === "shrinkOpponent") {
        const opponent = player === 1 ? 2 : 1;
        console.log(`🔹 Shrinking Player ${opponent}'s paddle!`);
        this.server.emit("shrinkPaddle", { player: opponent });
    } 
    else if (type === "speedBoost") {
        console.log("🚀 Speed Boost! Increasing ball speed.");
        this.gameState.ball.vx *= 1.5; // Increase ball speed by 50%
        this.gameState.ball.vy *= 1.5;
        this.server.emit("increaseBallSpeed", this.gameState.ball);
    } 
    else if (type === "enlargePaddle") {
        console.log(`🛠 Enlarging Player ${player}'s paddle!`);
        this.server.emit("enlargePaddle", { player });
    }

    // **🔥 Remove power-up after collection**
    this.powerUpState = { x: null, y: null, vx: 0, vy: 0, type: null, isActive: false };
    this.server.emit("powerUpCleared");
}



private checkPowerUpCollision() {
    if (!this.powerUpState.isActive) return;

    const { x, y, type } = this.powerUpState;
    const paddle1 = this.gameState.paddle1;
    const paddle2 = this.gameState.paddle2;

    if (x <= 30 && y >= paddle1.y && y <= paddle1.y + 100) {
        console.log(` Player 1 collected power-up: ${type}`);
        this.applyPowerUpEffect(1, type);
        this.server.emit("powerUpCollected", { player: 1, type });
        return;
    }

    if (x >= 770 && y >= paddle2.y && y <= paddle2.y + 100) {
        console.log(` Player 2 collected power-up: ${type}`);
        this.applyPowerUpEffect(2, type);
        this.server.emit("powerUpCollected", { player: 2, type });
        return;
    }
}



// updates ball and paddles (gamestate)
	private updateGameState() {
		if (!this.ballMoving) return; //  Prevents ghost ball from moving
	
		const ball = this.gameState.ball;
		ball.x += ball.vx;
		ball.y += ball.vy;
	
		// Wall bounce logic
		if (ball.y <= 0 || ball.y >= 600) ball.vy = -ball.vy;

		// Update Power-Up Movement
		if (this.powerUpState.isActive) {
			this.powerUpState.x += this.powerUpState.vx;
			this.powerUpState.y += this.powerUpState.vy;
		
			// Make power-up bounce inside the play area
			if (this.powerUpState.x <= 0 || this.powerUpState.x >= 770) {
				console.log("🔄 Power-Up bounced off X wall!");
				this.powerUpState.vx *= -1; // Reverse X direction
			}
			if (this.powerUpState.y <= 0 || this.powerUpState.y >= 600) {
				console.log("🔄 Power-Up bounced off Y wall!");
				this.powerUpState.vy *= -1; // Reverse Y direction
			}

			this.checkPowerUpCollision();

			this.server.emit("updatePowerUp", this.powerUpState);
		}
		
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
		this.server.emit("gameState", { ...this.gameState, powerUp: this.powerUpState });
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
			console.log(`Marking ${playerData.username} as disconnected (Player ${playerData.playerNumber})`);
			players.delete(client.id); // Remove the socket reference
	
			// 🔹 Store the disconnected player to maintain their player number
			players.set(`DISCONNECTED-${playerData.username}`, { ...playerData });
		}
	
		// Notify remaining players
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
	
		if (data.player === 1 && playerInfo.playerNumber === 1) {
			this.gameState.paddle1.y = data.y;
		} else if (data.player === 2 && playerInfo.playerNumber === 2) {
			this.gameState.paddle2.y = data.y;
		} else {
			console.warn(`Invalid move detected! Player ${playerInfo.playerNumber} tried to move Player ${data.player}'s paddle.`);
			return; 
		}
	
		// ✅ Ensure ball starts moving when a paddle moves
		if (!this.ballMoving) {
			console.log("First paddle move detected, starting ball movement...");
			this.ballMoving = true;
			this.gameState.ball.vx = Math.random() > 0.5 ? 5 : -5;
			this.gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;
			this.startGameLoop(); // ✅ Restart game loop
		}
	
		this.server.emit("gameState", { ...this.gameState });
	}
	
  }
