import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class PongService {
    private gameState = {
        ball: { x: 390, y: 294, vx: 0, vy: 0 },
        paddle1: { y: 250 },
        paddle2: { y: 250 },
        score: { player1: 0, player2: 0 },
		isActive: false,
    };

	private powerUpState = {
		x: null as number | null,
		y: null as number | null,
		vx: 0,
		vy: 0,
		type: null as "shrinkOpponent" | "speedBoost" | "enlargePaddle" | null,
		isActive: false,
	};
	

    private playersReady: number = 0;
    private ballMoving: boolean = false;
    private gameLoopInterval: NodeJS.Timeout | null = null;
	private winnerDeclared: boolean = false;

    constructor() {}

    // Returns the current game state
    public getGameState() {
        return this.gameState;
    }

	// Checks if the ball is currently moving
	public isBallMoving(): boolean {
		return this.ballMoving;
	}

    // Increments the number of players ready
    public incrementReadyPlayers() {
        this.playersReady++;
    }

    // Checks if both players are ready
    public areBothPlayersReady(): boolean {
        return this.playersReady >= 2;
    }
	

    // Updates paddle position
	public updatePaddlePosition(playerNumber: number, y: number, server: Server): boolean {
		if (playerNumber === 1) {
			this.gameState.paddle1.y = y;
		} else if (playerNumber === 2) {
			this.gameState.paddle2.y = y;
		} else {
			return false;
		}
	
		// Don't move the ball until the game is active!
		// if (!this.isGameActive()) {
		// 	console.warn("Game is not active, ignoring paddle move.");
		// 	return false;
		// }
	
		// Start the ball movement only on the first paddle move
		if (!this.ballMoving) {
			console.log("First paddle move detected, starting ball movement...");
			this.ballMoving = true;
			this.gameState.ball.vx = Math.random() > 0.5 ? 5 : -5;
			this.gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;
			this.startGameLoop(server);
		}
	
		return true;
	}
	

    // Starts the game loop
	public startGameLoop(server: Server) {
		if (this.gameLoopInterval) return;
	
		console.log("Starting game loop...");
		this.gameLoopInterval = setInterval(() => {
			server.emit("gameState", this.gameState);
	
			if (!this.ballMoving && !this.powerUpState.isActive) {
				return; // Skip update if ball is not moving and no power-up is active
			}
	
			if (this.ballMoving) {
				this.updateGameState(server);
			}
	
			if (this.powerUpState.isActive) {
				this.updatePowerUpState(server); // Update power-up movement
				this.checkPowerUpCollision(server); // Check for power-up collection

			}
	
			// Spawn power-up randomly (5% chance per frame)
			if (Math.random() < 0.05 && !this.powerUpState.isActive) {
				this.spawnPowerUp(server);
			}
		}, 1000 / 60);
	}
	
	private checkPowerUpCollision(server: Server) {
		if (!this.powerUpState.isActive) return;
	
		const { x, y, type } = this.powerUpState;
		const paddle1 = this.gameState.paddle1;
		const paddle2 = this.gameState.paddle2;
	
		// Check if Player 1 collects the power-up
		if (x <= 30 && y >= paddle1.y && y <= paddle1.y + 100) {
			console.log('Player 1 collected power-up: ${type}');
			this.applyPowerUpEffect(1, server);
			server.emit("powerUpCollected", { player: 1, type });
			return;
		}
	
		// Check if Player 2 collects the power-up
		if (x >= 770 && y >= paddle2.y && y <= paddle2.y + 100) {
			console.log('Player 2 collected power-up: ${type}');
			this.applyPowerUpEffect(2, server);
			server.emit("powerUpCollected", { player: 2, type });
			return;
		}
	}
	

	private updatePowerUpState(server: Server) {
		if (!this.powerUpState.isActive) return; // Do nothing if no active power-up

		if (this.powerUpState.vx === 0) this.powerUpState.vx = Math.random() > 0.5 ? 3 : -3;
    	if (this.powerUpState.vy === 0) this.powerUpState.vy = Math.random() > 0.5 ? 2 : -2;

		// Update position
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

		this.checkPowerUpCollision(server);

	
		// Send updated position to clients
		server.emit("updatePowerUp", this.powerUpState);
	}	
	
	

    // Updates game state every frame 
    private updateGameState(server: Server) {
        if (!this.ballMoving) return;

        const ball = this.gameState.ball;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball bounces off top/bottom walls
        if (ball.y <= 0 || ball.y >= 600) ball.vy *= -1;

        // Check collisions and score updates
        this.checkCollisions(server);
        server.emit("gameState", this.gameState);
    }

	public stopGame(server: Server) {
		console.log("Stopping game - Winner declared!");
	
		this.ballMoving = false;
		if (this.gameLoopInterval) {
			clearInterval(this.gameLoopInterval);
			this.gameLoopInterval = null;
		}
	
		// Ensure ball stops in place
		this.gameState.ball.vx = 0;
		this.gameState.ball.vy = 0;
	
		server.emit("gameState", this.gameState); // Send final state to clients
	}
	

	private checkGameOver(server: Server) {
		if (this.gameState.score.player1 >= 3) {
			console.log("Player 1 Wins!");
			this.winnerDeclared = true;
			this.stopGame(server); // Freeze game state!
			server.emit("gameOver", { winner: "Player 1" });
		} else if (this.gameState.score.player2 >= 3) {
			console.log("Player 2 Wins!");
			this.winnerDeclared = true;
			this.stopGame(server); // Freeze game state!
			server.emit("gameOver", { winner: "Player 2" });
		}
	}
	

    // Checks for ball collisions
	private checkCollisions(server: Server) {
    const ball = this.gameState.ball;
    const paddle1 = this.gameState.paddle1;
    const paddle2 = this.gameState.paddle2;

    // Paddle collision logic
    if (ball.x <= 30 && ball.y >= paddle1.y && ball.y <= paddle1.y + 100) {
        ball.vx = Math.abs(ball.vx);
    } else if (ball.x >= 770 && ball.y >= paddle2.y && ball.y <= paddle2.y + 100) {
        ball.vx = -Math.abs(ball.vx);
    }

    // Scoring logic
    if (ball.x <= 0) {
        this.gameState.score.player2++;
        this.checkGameOver(server);
        this.resetBall(server);
    } else if (ball.x >= 800) {
        this.gameState.score.player1++;
        this.checkGameOver(server);
        this.resetBall(server);
    }
}


	// Applies power-up effect to the given player
	public applyPowerUpEffect(player: number, server: Server) {
		if (!this.powerUpState.isActive) return;
	
		console.log('Applying power-up: ${this.powerUpState.type} to Player ${player}');
	
		if (this.powerUpState.type === "shrinkOpponent") {
			const opponent = player === 1 ? 2 : 1;
			// console.log('Shrinking Player' ${opponent}'s paddle!');
			server.emit("shrinkPaddle", { player: opponent });
		} 
		else if (this.powerUpState.type === "speedBoost") {
			console.log("Speed Boost! Increasing ball speed.");
			this.gameState.ball.vx *= 1.5;
			this.gameState.ball.vy *= 1.5;
			server.emit("increaseBallSpeed", this.gameState.ball);
		} 
		else if (this.powerUpState.type === "enlargePaddle") {
			// console.log('Enlarging Player ${player}'s paddle!'');
			server.emit("enlargePaddle", { player });
		}
	
		// Clear power-up state
		this.powerUpState = { x: null, y: null, vx: 0, vy: 0, type: null, isActive: false };
		server.emit("powerUpCleared");
	}
	

	// Resets the ball and paddles after a goal but does NOT start the ball automatically
private resetBall(server: Server) {
    console.log("Resetting ball and paddles after goal...");

    this.ballMoving = false; // Stop ball movement

    // Reset ball position
    this.gameState.ball = { x: 390, y: 294, vx: 0, vy: 0 };

    // Reset paddles to middle
    this.gameState.paddle1.y = 250;
    this.gameState.paddle2.y = 250;

    server.emit("gameState", this.gameState); // Send updated state to clients
}


// Resets the entire game
public resetGame(server: Server) {
    console.log("Resetting game...");

    this.playersReady = 0;
    this.winnerDeclared = false;
    this.ballMoving = false;

    if (this.gameLoopInterval) {
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
    }

    //  Make sure game is inactive and doesn't start automatically!
    this.gameState = {
        ball: { x: 390, y: 294, vx: 0, vy: 0 },
        paddle1: { y: 250 },
        paddle2: { y: 250 },
        score: { player1: 0, player2: 0 },
        isActive: false,  // Prevents auto-start
    };

    this.powerUpState = { x: null, y: null, vx: 0, vy: 0, type: null, isActive: false };

    server.emit("gameReset");  // Notify frontend to close popup
    server.emit("gameState", this.gameState);
}


spawnPowerUp(server: Server) { 
    if (this.powerUpState.isActive) return;

    console.log("⚡ Spawning power-up...");

    const randomX = Math.floor(Math.random() * 600) + 100;
    const randomY = Math.floor(Math.random() * 300) + 50;
    const powerUpTypes: Array<"shrinkOpponent" | "speedBoost" | "enlargePaddle"> = [
        "shrinkOpponent", "speedBoost", "enlargePaddle"
    ];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

    this.powerUpState = { 
        x: randomX, 
        y: randomY, 
        vx: Math.random() > 0.5 ? 3 : -3,
        vy: Math.random() > 0.5 ? 2 : -2,
        type: randomType, 
        isActive: true 
    };

    console.log("Emitting power-up:", this.powerUpState);
    server.emit("powerUpSpawned", this.powerUpState);
}

}