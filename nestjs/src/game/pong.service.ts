import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';

interface GameState {
	ball: { x: number; y: number; vx: number; vy: number };
	paddle1: { y: number };
	paddle2: { y: number };
	score: { player1: number; player2: number };
	isActive: boolean;
  }
  
  interface PowerUpState {
	x: number | null;
	y: number | null;
	vx: number;
	vy: number;
	type: 'shrinkOpponent' | 'speedBoost' | 'enlargePaddle' | null;
	isActive: boolean;
  }

@Injectable()
export class PongService {
	
	private gameStates = new Map<string, GameState>();
	private powerUpStates = new Map<string, PowerUpState>();
	private playersReady = new Map<string, number>();
	private ballMoving = new Map<string, boolean>();
	private gameLoopIntervals = new Map<string, NodeJS.Timeout>();	
	private winnerDeclared: boolean = false;
	private rooms = new Map<string, { player1: number; player2?: number }>();


  // Set up per-room game state
  private createInitialGameState(): GameState {
    return {
      ball: { x: 386, y: 294, vx: 0, vy: 0 },
      paddle1: { y: 250 },
      paddle2: { y: 250 },
      score: { player1: 0, player2: 0 },
      isActive: false,
    };
  }

  private createInitialPowerUpState(): PowerUpState {
    return {
      x: null,
      y: null,
      vx: 0,
      vy: 0,
      type: null,
      isActive: false,
    };
  }

    // Returns the current game state
  public getGameState(roomId: string): GameState | undefined {
    return this.gameStates.get(roomId);
  }

	// Checks if the ball is currently moving
	public isBallMoving(roomId: string): boolean {
		return this.ballMoving.get(roomId) ?? false;
	  }

    // Increments the number of players ready
	public incrementReadyPlayers(roomId: string) {
		const count = this.playersReady.get(roomId) || 0;
		this.playersReady.set(roomId, count + 1);
	  }
	  
	  public areBothPlayersReady(roomId: string): boolean {
		return (this.playersReady.get(roomId) || 0) >= 2;
	  }	  
	

    // Updates paddle position
	public updatePaddlePosition(roomId: string, playerNumber: number, y: number, server: Server): boolean {
		const gameState = this.gameStates.get(roomId);
		if (!gameState) return false;
	  
		if (playerNumber === 1) gameState.paddle1.y = y;
		else if (playerNumber === 2) gameState.paddle2.y = y;
		else return false;
	  
		if (!this.ballMoving.get(roomId)) {
		  console.log("First paddle move detected, starting ball movement...");
		  gameState.ball.vx = Math.random() > 0.5 ? 5 : -5;
		  gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;
		  this.ballMoving.set(roomId, true);
		  this.startGameLoop(roomId, server);
		}
		return true;
	  }
	  
	

    // Starts the game loop
	// Starts the game loop for a specific room
public startGameLoop(roomId: string, server: Server) {
	if (this.gameLoopIntervals.has(roomId)) return;

	console.log(`🎮 Starting game loop for room ${roomId}...`);
	const interval = setInterval(() => {
		const gameState = this.gameStates.get(roomId);
		const powerUpState = this.powerUpStates.get(roomId);

		if (!gameState || !powerUpState) return;

		// Emit current game state to the room
		server.to(roomId).emit("gameState", gameState);

		if (!this.ballMoving.get(roomId) && !powerUpState.isActive) return;

		if (this.ballMoving.get(roomId)) {
			this.updateGameState(roomId, server);
		}

		if (powerUpState.isActive) {
			this.updatePowerUpState(roomId, server);
			this.checkPowerUpCollision(roomId, server);
		}

		if (Math.random() < 0.05 && !powerUpState.isActive) {
			this.spawnPowerUp(roomId, server);
		}
	}, 1000 / 60);

	this.gameLoopIntervals.set(roomId, interval);
}

	
private checkPowerUpCollision(roomId: string, server: Server) {
	const gameState = this.gameStates.get(roomId);
	const powerUp = this.powerUpStates.get(roomId);
	if (!gameState || !powerUp?.isActive) return;
  
	const { x, y, type } = powerUp;
	const paddle1 = gameState.paddle1;
	const paddle2 = gameState.paddle2;
  
	if (x! <= 30 && y! >= paddle1.y && y! <= paddle1.y + 100) {
	  this.applyPowerUpEffect(roomId, 1, server);
	  return;
	}
  
	if (x! >= 770 && y! >= paddle2.y && y! <= paddle2.y + 100) {
	  this.applyPowerUpEffect(roomId, 2, server);
	  return;
	}
  }
  
	

	private updatePowerUpState(roomId: string, server: Server) {
		const powerUp = this.powerUpStates.get(roomId);
		if (!powerUp || !powerUp.isActive) return;
	  
		if (powerUp.vx === 0) powerUp.vx = Math.random() > 0.5 ? 3 : -3;
		if (powerUp.vy === 0) powerUp.vy = Math.random() > 0.5 ? 2 : -2;
	  
		powerUp.x! += powerUp.vx;
		powerUp.y! += powerUp.vy;
	  
		if (powerUp.x! <= 0 || powerUp.x! >= 770) powerUp.vx *= -1;
		if (powerUp.y! <= 0 || powerUp.y! >= 550) powerUp.vy *= -1;
	  
		this.checkPowerUpCollision(roomId, server);
		server.to(roomId).emit("updatePowerUp", powerUp);
	  }
	  
	
	

    // Updates game state every frame 
	private updateGameState(roomId: string, server: Server) {
		const gameState = this.gameStates.get(roomId);
		if (!gameState) return;
	  
		const ball = gameState.ball;
		ball.x += ball.vx;
		ball.y += ball.vy;
	  
		if (ball.y <= 0 || ball.y >= 570) ball.vy *= -1;
	  
		this.checkCollisions(roomId, server);
		server.to(roomId).emit("gameState", gameState);
	  }
	  

	public stopGame(roomId: string, server: Server) {
		console.log("Stopping game - Winner declared!");
	
		this.ballMoving.set(roomId, false);
		const loop = this.gameLoopIntervals.get(roomId);
		if (loop) {
		  clearInterval(loop);
		  this.gameLoopIntervals.delete(roomId);
		}
		
	
		const gameState = this.gameStates.get(roomId);
		if (!gameState) return;
	
		gameState.ball.vx = 0;
		gameState.ball.vy = 0;
	
		server.emit("gameState", gameState);
	}
	

	private checkGameOver(roomId: string, server: Server) {
		const gameState = this.gameStates.get(roomId);
		if (!gameState) return;

		if (gameState.score.player1 >= 3) {
			console.log("Player 1 Wins!");
			this.winnerDeclared = true;
			this.stopGame(roomId, server); // Freeze game state!
			server.emit("gameOver", { winner: "Player 1" });
		} else if (gameState.score.player2 >= 3) {
			console.log("Player 2 Wins!");
			this.winnerDeclared = true;
			this.stopGame(roomId, server); // Freeze game state!
			server.emit("gameOver", { winner: "Player 2" });
		}
	}
	

    // Checks for ball collisions
	private checkCollisions(roomId: string, server: Server) {
		const gameState = this.gameStates.get(roomId);
		if (!gameState) return;
	
		const ball = gameState.ball;
		const paddle1 = gameState.paddle1;
		const paddle2 = gameState.paddle2;

    // Paddle collision logic
    if (ball.x <= 20 && ball.y >= paddle1.y && ball.y <= paddle1.y + 100) {
        ball.vx = Math.abs(ball.vx);
    } else if (ball.x >= 750 && ball.y >= paddle2.y && ball.y <= paddle2.y + 100) {
        ball.vx = -Math.abs(ball.vx);
    }

    // Scoring logic
    if (ball.x <= 0) {
        gameState.score.player2++;
        this.checkGameOver(roomId, server);
        this.resetBall(roomId, server);
    } else if (ball.x >= 800) {
        gameState.score.player1++;
        this.checkGameOver(roomId, server);
        this.resetBall(roomId, server);
    }
}


	// Applies power-up effect to the given player
public applyPowerUpEffect(roomId: string, player: number, server: Server) {
	const powerUp = this.powerUpStates.get(roomId);
	const gameState = this.gameStates.get(roomId);
	if (!powerUp || !powerUp.isActive || !gameState) return;

	console.log(`Applying power-up: ${powerUp.type} to Player ${player}`);

	if (powerUp.type === "shrinkOpponent") {
	const opponent = player === 1 ? 2 : 1;
	server.emit("shrinkPaddle", { player: opponent });
	} else if (powerUp.type === "speedBoost") {
	console.log("Speed Boost! Increasing ball speed.");
	gameState.ball.vx *= 1.5;
	gameState.ball.vy *= 1.5;
	server.emit("increaseBallSpeed", gameState.ball);
	} else if (powerUp.type === "enlargePaddle") {
	server.emit("enlargePaddle", { player });
	}

	this.powerUpStates.set(roomId, {
	x: null, y: null, vx: 0, vy: 0, type: null, isActive: false,
	});
	server.emit("powerUpCleared");
	}
	

	// Resets the ball and paddles after a goal but does NOT start the ball automatically
	private resetBall(roomId: string, server: Server) {
		console.log("Resetting ball and paddles after goal...");
	
		this.ballMoving.set(roomId, false);
		const gameState = this.gameStates.get(roomId);
		if (!gameState) return;
	
		gameState.ball = { x: 386, y: 294, vx: 0, vy: 0 };
		gameState.paddle1.y = 250;
		gameState.paddle2.y = 250;
	
		server.emit("gameState", gameState);
	}
	


	public resetGame(server: Server, roomId: string) {
		console.log(`Resetting game for room: ${roomId}`);
	
		this.cleanupRoom(roomId);
	
		this.gameStates.set(roomId, {
			ball: { x: 386, y: 294, vx: 0, vy: 0 },
			paddle1: { y: 250 },
			paddle2: { y: 250 },
			score: { player1: 0, player2: 0 },
			isActive: false
		});
	
		this.powerUpStates.set(roomId, {
			x: null,
			y: null,
			vx: 0,
			vy: 0,
			type: null,
			isActive: false
		});
	
		this.playersReady.set(roomId, 0);
		this.winnerDeclared = false;
		this.ballMoving.set(roomId, false);
	
		server.to(roomId).emit("gameReset");
		server.to(roomId).emit("gameState", this.gameStates.get(roomId));
	}
	

public startBall(server: Server, roomId: string) {
    if (this.ballMoving.get(roomId)) return;

    const gameState = this.gameStates.get(roomId);
    if (!gameState) return;

    gameState.ball.vx = Math.random() > 0.5 ? 5 : -5;
    gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;
    this.ballMoving.set(roomId, true);

	this.startGameLoop(roomId, server);
}


  private spawnPowerUp(roomId: string, server: Server) {
	const existing = this.powerUpStates.get(roomId);
	if (existing?.isActive) return;
  
	const randomX = Math.floor(Math.random() * 570) + 100;
	const randomY = Math.floor(Math.random() * 300) + 50;
	const types = ["shrinkOpponent", "speedBoost", "enlargePaddle"] as const;
	const randomType = types[Math.floor(Math.random() * types.length)];
  
	const newPowerUp: PowerUpState = {
	  x: randomX,
	  y: randomY,
	  vx: Math.random() > 0.5 ? 3 : -3,
	  vy: Math.random() > 0.5 ? 2 : -2,
	  type: randomType,
	  isActive: true,
	};
  
	this.powerUpStates.set(roomId, newPowerUp);
	server.to(roomId).emit("powerUpSpawned", newPowerUp);
  }
  


createMatch(dto: { userId: number; roomId: string }, client: Socket): { message: string; room: string } {
	const existingRoom = this.rooms.get(dto.roomId);
  
	if (existingRoom) {
	  const { player1, player2 } = existingRoom;
  
	  if (player1 && player2) {
		client.emit("roomFull");
		return { message: "Room is full", room: dto.roomId };
	  }
  
	  if (player1 !== dto.userId && player2 !== dto.userId) {
		existingRoom.player2 = dto.userId;
	  }
	} else {
	  this.rooms.set(dto.roomId, { player1: dto.userId });
	}
  
	return { message: 'Match created or joined', room: dto.roomId };
  }
  

  
  getRoomInfo(roomId: string) {
	return this.rooms.get(roomId) ?? { error: 'Room not found' };
  }
  
  getRoomByUserId(userId: number) {
	for (const [roomId, room] of this.rooms.entries()) {
	  if (room.player1 === userId || room.player2 === userId) {
		return { roomId, ...room };
	  }
	}
	return { error: 'User not found in any room' };
  }

  private gameLoops = new Map<string, NodeJS.Timeout>();

stopGameLoop(roomId: string) {
  const loop = this.gameLoops.get(roomId);
  if (loop) {
    clearInterval(loop);
    this.gameLoops.delete(roomId);
    console.log(`game loop stopped for room ${roomId}`);
  }
}

cleanupRoom(roomId: string) {
	// stop active interval
	const interval = this.gameLoopIntervals.get(roomId);
	if (interval) clearInterval(interval);
	this.gameLoopIntervals.delete(roomId);
  
	// clear game state
	this.gameStates.delete(roomId);
	this.powerUpStates.delete(roomId);
	this.playersReady.delete(roomId);
	this.ballMoving.delete(roomId);
  
	this.winnerDeclared = false;
  
	console.log(`cleaned up all data for room ${roomId}`);
  }
  

}