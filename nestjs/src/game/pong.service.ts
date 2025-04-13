import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { MatchService } from '../match/match.service';
import { TokenPayload } from '@/auth/dto/token-payload';
import { createInviteDto, JoinPrivateRoomDto } from './dto/create_pong.dto';
import { v4 as uuidv4 } from 'uuid';
import { Chat, ChatGameInvite } from '@/conversations/entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PongGateway } from './pong.gateway';
import { ConversationsGateway } from '@/conversations/conversations.gateway';
import { Message } from 'common/types/chat-type';
import { UserService } from 'src/user/user.service';

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

interface PrivateRoom {
  roomId: string;
  hostUserId: number;
  invitedUserId: number;
  player1: {
    userId: number;
    username: string;
    socketId: string | null;
    playerNumber: 1;
  };
  player2?: {
    userId: number;
    username: string;
    socketId: string | null;
    playerNumber: 2;
  };
}

class UserInviteMapData {
  user: string;
  id: string;
}

class inviteIdUsersMapData {
  user1: string;
  user2: string;
}

@Injectable()
export class PongService {
  constructor(
    private readonly matchService: MatchService,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatGameInvite)
    private readonly chatGameInviteRepository: Repository<ChatGameInvite>,

    @Inject(forwardRef(() => PongGateway))
    private readonly pongGateway: PongGateway,

    @Inject(forwardRef(() => ConversationsGateway))
    private readonly conversationGatewat: ConversationsGateway,

    private readonly userService: UserService,
  ) {}

  private gameStates = new Map<string, GameState>();
  private powerUpStates = new Map<string, PowerUpState>();
  private playersReady = new Map<string, number>();
  private ballMoving = new Map<string, boolean>();
  private gameLoopIntervals = new Map<string, NodeJS.Timeout>();
  private winnerDeclared = new Map<string, boolean>();
  private rooms = new Map<string, { player1: number; player2?: number }>();
  private roomToUsers = new Map<string, { id: number; username: string }[]>();
  private userToRoom = new Map<number, string>();
  private userInGame = new Set<number>();

  // const inviteData = {
  // 	user: string, id: string
  // }

  private userInviteMap = new Map<string, UserInviteMapData>();
  private inviteIdUsersMap = new Map<string, inviteIdUsersMapData>();
  private privateRooms = new Map<string, PrivateRoom>();

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

  joinPrivateRoom(user: TokenPayload, data: JoinPrivateRoomDto) {
    if (!this.inviteIdUsersMap.has(data.roomId)) {
      throw new UnauthorizedException(
        "Room does not exist ot you don't have access",
      );
    }

    const users: inviteIdUsersMapData = this.inviteIdUsersMap.get(data.roomId);

    console.log('users: ', users);

    if (user.username === users.user1 || user.username === users.user2) {
      return { msg: 'You succesfully joined the room' };
    }
    throw new UnauthorizedException('???');
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
  public updatePaddlePosition(
    roomId: string,
    playerNumber: number,
    y: number,
    server: Server,
  ): boolean {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) return false;

    if (playerNumber === 1) gameState.paddle1.y = y;
    else if (playerNumber === 2) gameState.paddle2.y = y;
    else return false;

    if (!this.ballMoving.get(roomId)) {
      console.log('First paddle move detected, starting ball movement...');
      gameState.ball.vx = Math.random() > 0.5 ? 5 : -5;
      gameState.ball.vy = Math.random() > 0.5 ? 5 : -5;
      this.ballMoving.set(roomId, true);
      this.startGameLoop(roomId, server);
    }
    return true;
  }

  // Starts the game loop
  public startGameLoop(roomId: string, server: Server) {
    if (this.gameLoopIntervals.has(roomId)) return;

    console.log(`starting game loop for room ${roomId}...`);
    const interval = setInterval(() => {
      const gameState = this.gameStates.get(roomId);
      const powerUpState = this.powerUpStates.get(roomId);

      if (!gameState || !powerUpState) return;

      // Emit current game state to the room
      server.to(roomId).emit('gameState', gameState);

      if (!this.ballMoving.get(roomId) && !powerUpState.isActive) return;

      if (this.ballMoving.get(roomId)) {
        // await inside async fn doesn't work here, but we can handle errors safely
        this.updateGameState(roomId, server).catch((err) =>
          console.error(`updateGameState error in room ${roomId}:`, err),
        );
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
    server.to(roomId).emit('updatePowerUp', powerUp);
  }

  // Updates game state every frame
  private async updateGameState(roomId: string, server: Server) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) return;

    const ball = gameState.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y <= 0 || ball.y >= 570) ball.vy *= -1;

    this.checkCollisions(roomId, server);
    server.to(roomId).emit('gameState', gameState);
  }

  public stopGame(roomId: string, server: Server) {
    console.log('Stopping game - Winner declared!');

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

    server.emit('gameState', gameState);
  }

  // private async updateGameInviteChat(
  //   roomId: string,
  //   winnerId: number,
  //   winnerScore: number,
  //   loserScore: number,
  // ) {
  //   // const gameInvite = await this.chatGameInviteRepository.findOne({
  //   //   where: { id: roomId },
  //   //   relations: ['chat', 'createdUser', 'invitedUser'],
  //   // });

  //   const rawRoomId = roomId.replace(/^room-/, '');

  //   const gameInvite = await this.chatGameInviteRepository.findOne({
  //     where: { id: rawRoomId },
  //     relations: ['chat', 'createdUser', 'invitedUser'],
  //   });
    
  //   if (!gameInvite) {
  //     throw new NotFoundException('Game invite not found');
  //   }
    
  //   if (!gameInvite.chat || !gameInvite.chat.id) {
  //     throw new NotFoundException('Associated chat not found');
  //   }
    
  //   const chat = await this.chatRepository.findOne({
  //     where: { id: gameInvite.chat.id },
  //     relations: ['user', 'conversation']
  //   });
    
	// if (!chat) {
	//   throw new NotFoundException('Chat not found');
	// }
  //   console.log('gameInvite:', gameInvite);
	// console.log('chat:', chat);

  //   const winnerUser = await this.userService.findOneById(winnerId);

  //   gameInvite.winnerUsername = winnerUser.username;
  //   gameInvite.creatorScore = winnerScore;
  //   gameInvite.recipientScore = loserScore;
  //   gameInvite.status = 'COMPLETED';
  //   await this.chatGameInviteRepository.save(gameInvite);

  //   const inviterUser = await this.userService.findOneById(
  //     gameInvite.createdUser.id,
  //   );
  //   if (!inviterUser) {
  //     throw new NotFoundException('Inviter user not found');
  //   }

  //   console.log('gameInvite:', gameInvite);
  //   const message: Message = {
  //     id: gameInvite.chat.id,
  //     conversationId: chat.conversation.id,
  //     type: 'GAME_INVITE',
  //     text: null,
  //     edited: false,
  //     createdAt: gameInvite.chat.createdAt.toString(),
  //     senderUser: {
  //       userId: inviterUser.id,
  //       username: inviterUser.username,
  //       avatar: inviterUser.avatar,
  //     },
  //     gameInviteData: {
  //       // gameId: roomId,
  //       gameId: rawRoomId,
  //       status: 'COMPLETED',
  //       creatorUsername: inviterUser.username,
  //       creatorUserId: gameInvite.createdUser.id,
  //       recipientUserId: gameInvite.invitedUser.id,
  //       recipientUsername: winnerUser.username,
  //       creatorScore: winnerScore,
  //       recipientScore: loserScore,
  //       winnerUsername: winnerUser.username,
  //     },
  //   };

  //   this.conversationGatewat.SendChatToConversation(message);

  //   // const chat = this.chatRepository.findOne(gameInvite.chat);

  //   // const chat = gameInvite.chat;
  //   // if (!chat) {
  //   //   throw new NotFoundException('Chat not found');
  //   // }

  //   // chat.gameInviteData.status = 'COMPLETED';
  //   // await this.chatGameInviteRepository.save(gameInvite);
  // }

  private async updateGameInviteChat(
    roomId: string,
    winnerId: number,
    winnerScore: number,
    loserScore: number,
  ) {
    try {
      const rawRoomId = roomId.replace(/^room-/, '');
  
      const gameInvite = await this.chatGameInviteRepository.findOne({
        where: { id: rawRoomId },
        relations: ['chat', 'createdUser', 'invitedUser'],
      });
  
      if (!gameInvite) {
        console.warn(`[updateGameInviteChat] No game invite found for ID: ${rawRoomId}`);
        return;
      }
  
      if (!gameInvite.chat || !gameInvite.chat.id) {
        console.warn(`[updateGameInviteChat] Game invite has no chat attached: ID ${rawRoomId}`);
        return;
      }
  
      const chat = await this.chatRepository.findOne({
        where: { id: gameInvite.chat.id },
        relations: ['user', 'conversation'],
      });
  
      if (!chat) {
        console.warn(`[updateGameInviteChat] Chat not found for chat ID: ${gameInvite.chat.id}`);
        return;
      }
  
      const winnerUser = await this.userService.findOneById(winnerId);
      if (!winnerUser) {
        console.warn(`[updateGameInviteChat] Winner user not found: ${winnerId}`);
        return;
      }
  
      const inviterUser = await this.userService.findOneById(gameInvite.createdUser.id);
      if (!inviterUser) {
        console.warn(`[updateGameInviteChat] Inviter user not found: ${gameInvite.createdUser.id}`);
        return;
      }
  
      // Update game invite
      gameInvite.winnerUsername = winnerUser.username;
      gameInvite.creatorScore = winnerScore;
      gameInvite.recipientScore = loserScore;
      gameInvite.status = 'COMPLETED';
      await this.chatGameInviteRepository.save(gameInvite);
  
      // Compose and send message
      const message: Message = {
        id: gameInvite.chat.id,
        conversationId: chat.conversation.id,
        type: 'GAME_INVITE',
        text: null,
        edited: false,
        createdAt: gameInvite.chat.createdAt.toString(),
        senderUser: {
          userId: inviterUser.id,
          username: inviterUser.username,
          avatar: inviterUser.avatar,
        },
        gameInviteData: {
          gameId: rawRoomId,
          status: 'COMPLETED',
          creatorUsername: inviterUser.username,
          creatorUserId: gameInvite.createdUser.id,
          recipientUserId: gameInvite.invitedUser.id,
          recipientUsername: winnerUser.username,
          creatorScore: winnerScore,
          recipientScore: loserScore,
          winnerUsername: winnerUser.username,
        },
      };
  
      this.conversationGatewat.SendChatToConversation(message);
    } catch (error) {
      console.error(`[updateGameInviteChat] Error updating game invite for room ${roomId}:`, error);
      // don't throw here — we don't want to crash the whole server
    }
  }
  

  private async checkGameOver(roomId: string, server: Server) {
    if (this.winnerDeclared.get(roomId)) return;
    console.log('gets into checkgameover');

    const gameState = this.gameStates.get(roomId);
    if (!gameState) return;

    const room = this.rooms.get(roomId);
    if (!room || room.player1 == null || room.player2 == null) {
      console.warn(
        `Invalid room data. player1 or player2 is null for room: ${roomId}`,
      );
      return false;
    }

    let winnerId: number;
    let looserId: number;
    let looserScore: number;

    if (gameState.score.player1 >= 3) {
      this.winnerDeclared.set(roomId, true);
      console.log('Player 1 Wins!');

      winnerId = room.player1;
      looserId = room.player2;
      looserScore = gameState.score.player2;
      const winnerScore = gameState.score.player1;

      const winnerUser = await this.userService.findOneById(winnerId);
      const winnerUsername = winnerUser?.username || `Player ${winnerId}`;

      server.to(roomId).emit('gameOver', {
        winner: winnerUsername,
        finalScore: {
          player1: gameState.score.player1,
          player2: gameState.score.player2,
        },
      });

      this.updateGameInviteChat(roomId, winnerId, winnerScore, looserScore);
      this.stopGame(roomId, server);
    } else if (gameState.score.player2 >= 3) {
      this.winnerDeclared.set(roomId, true);
      console.log('Player 2 Wins!');

      winnerId = room.player2;
      looserId = room.player1;
      looserScore = gameState.score.player1;
      const winnerScore = gameState.score.player2;

      const winnerUser = await this.userService.findOneById(winnerId);
      const winnerUsername = winnerUser?.username || `Player ${winnerId}`;

      server.to(roomId).emit('gameOver', {
        winner: winnerUsername,
        finalScore: {
          player1: gameState.score.player1,
          player2: gameState.score.player2,
        },
      });

      this.updateGameInviteChat(roomId, winnerId, winnerScore, looserScore);
      this.stopGame(roomId, server);
    } else {
      return;
    }

    // now the vars are definitely defined
    try {
      await this.matchService.createMatch(winnerId, looserId, 3, looserScore);
      console.log('match successfully saved.');
    } catch (error) {
      console.error('failed to save match:', error);
    }
  }

  // Checks for ball collisions
  private async checkCollisions(roomId: string, server: Server) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) return;

    const ball = gameState.ball;
    const paddle1 = gameState.paddle1;
    const paddle2 = gameState.paddle2;

    // Paddle collision logic
    if (ball.x <= 20 && ball.y >= paddle1.y && ball.y <= paddle1.y + 100) {
      ball.vx = Math.abs(ball.vx);
    } else if (
      ball.x >= 750 &&
      ball.y >= paddle2.y &&
      ball.y <= paddle2.y + 100
    ) {
      ball.vx = -Math.abs(ball.vx);
    }

    // Scoring logic
    if (ball.x <= 0) {
      gameState.score.player2++;
      // console.log(`[SCORE] P1: ${gameState.score.player1}, P2: ${gameState.score.player2}`);
      await this.checkGameOver(roomId, server);
      if (this.winnerDeclared.get(roomId)) return;
      this.resetBall(roomId, server);
    } else if (ball.x >= 800) {
      gameState.score.player1++;
      // console.log(`[SCORE] P1: ${gameState.score.player1}, P2: ${gameState.score.player2}`);
      await this.checkGameOver(roomId, server);
      if (this.winnerDeclared.get(roomId)) return;
      this.resetBall(roomId, server);
    }
  }

  // Applies power-up effect to the given player
  public applyPowerUpEffect(roomId: string, player: number, server: Server) {
    const powerUp = this.powerUpStates.get(roomId);
    const gameState = this.gameStates.get(roomId);
    if (!powerUp || !powerUp.isActive || !gameState) return;

    console.log(`Applying power-up: ${powerUp.type} to Player ${player}`);

    if (powerUp.type === 'shrinkOpponent') {
      const opponent = player === 1 ? 2 : 1;
      server.emit('shrinkPaddle', { player: opponent });
    } else if (powerUp.type === 'speedBoost') {
      console.log('Speed Boost! Increasing ball speed.');
      gameState.ball.vx *= 1.5;
      gameState.ball.vy *= 1.5;
      server.emit('increaseBallSpeed', gameState.ball);
    } else if (powerUp.type === 'enlargePaddle') {
      server.emit('enlargePaddle', { player });
    }

    this.powerUpStates.set(roomId, {
      x: null,
      y: null,
      vx: 0,
      vy: 0,
      type: null,
      isActive: false,
    });
    server.emit('powerUpCleared');
  }

  // Resets the ball and paddles after a goal but does NOT start the ball automatically
  private resetBall(roomId: string, server: Server) {
    console.log('Resetting ball and paddles after goal...');

    this.ballMoving.set(roomId, false);
    const gameState = this.gameStates.get(roomId);
    if (!gameState) return;

    gameState.ball = { x: 386, y: 294, vx: 0, vy: 0 };
    gameState.paddle1.y = 250;
    gameState.paddle2.y = 250;

    server.emit('gameState', gameState);
  }

  public resetGame(server: Server, roomId: string) {
    console.log(`Resetting game for room: ${roomId}`);

    this.cleanupRoom(roomId);

    this.gameStates.set(roomId, {
      ball: { x: 386, y: 294, vx: 0, vy: 0 },
      paddle1: { y: 250 },
      paddle2: { y: 250 },
      score: { player1: 0, player2: 0 },
      isActive: false,
    });

    this.powerUpStates.set(roomId, {
      x: null,
      y: null,
      vx: 0,
      vy: 0,
      type: null,
      isActive: false,
    });

    this.playersReady.set(roomId, 0);
    this.winnerDeclared.set(roomId, false);
    this.ballMoving.set(roomId, false);

    server.to(roomId).emit('gameReset');
    server.to(roomId).emit('gameState', this.gameStates.get(roomId));
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
    const types = ['shrinkOpponent', 'speedBoost', 'enlargePaddle'] as const;
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
    server.to(roomId).emit('powerUpSpawned', newPowerUp);
  }

  createMatch(
    dto: { userId: number; roomId: string },
    client: Socket,
  ): { message: string; room: string } {
    const existingRoom = this.rooms.get(dto.roomId);

    if (existingRoom) {
      const { player1, player2 } = existingRoom;

      if (player1 && player2) {
        client.emit('roomFull');
        return { message: 'Room is full', room: dto.roomId };
      }

      if (player1 !== dto.userId && !player2) {
        existingRoom.player2 = dto.userId;
      }
    } else {
      this.rooms.set(dto.roomId, {
        player1: dto.userId,
        player2: null,
      });
    }

    this.userToRoom.set(dto.userId, dto.roomId);
    this.userInGame.add(dto.userId);

    const users = this.roomToUsers.get(dto.roomId) || [];
    if (!users.find((u) => u.id === dto.userId)) {
      users.push({
        id: dto.userId,
        username: 'TODO-FILL', // Ideally get from user service or client
        // socketId: client.id (optional if you're tracking that)
      });
      this.roomToUsers.set(dto.roomId, users);
    }

    return { message: 'Match created or joined', room: dto.roomId };
  }

  getRoomByUserId(userId: number) {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return { error: 'Not in a room' };

    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    return room;
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

  addPlayersToRoom(
    roomId: string,
    player1: { userId: number; username: string },
    player2: { userId: number; username: string },
  ) {
    this.roomToUsers.set(roomId, [
      { id: player1.userId, username: player1.username },
      { id: player2.userId, username: player2.username },
    ]);

    this.userToRoom.set(player1.userId, roomId);
    this.userToRoom.set(player2.userId, roomId);

    this.userInGame.add(player1.userId);
    this.userInGame.add(player2.userId);
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

    this.winnerDeclared.set(roomId, false);

    const players = this.roomToUsers.get(roomId);
    if (players) {
      for (const user of players) {
        this.userToRoom.delete(user.id); // or however you're tracking it
        this.userInGame.delete(user.id); // or set user.inGame = false
        console.log(`Removed user ${user.username} from room ${roomId}`);
      }
      this.roomToUsers.delete(roomId);
    }

    console.log(`cleaned up all data for room ${roomId}`);
  }

  getRoomInfo(roomId: string) {
    const users = this.roomToUsers.get(roomId);
    if (!users) return { error: 'Room not found' };
    return { roomId, players: users };
  }

  async joinInviteRoom(user: TokenPayload, roomId: string) {
    const room = this.privateRooms.get(roomId);

    const gameInvite = this.chatGameInviteRepository.create({
      createdUser: { id: user.sub },
      invitedUser: { id: room.invitedUserId },
    });

    if (!room) throw new NotFoundException('Room not found');

    const isUserInvited =
      room.invitedUserId === user.sub || room.hostUserId === user.sub;
    if (!isUserInvited)
      throw new ForbiddenException('You are not invited to this private match');

    if (!room.player2 && room.invitedUserId === user.sub) {
      room.player2 = {
        userId: user.sub,
        username: user.username,
        socketId: null,
        playerNumber: 2,
      };
    }

    // this.pongGateway.handleInviteToRoom({roomId: roomId, userId: user.sub});
    return { message: 'Joined private match', roomId };
  }

  async createInvite(user: TokenPayload, data: createInviteDto) {
    console.log('createInvite', user, data);
  
    // Create gameInvite first (without ID yet)
    const gameInvite = this.chatGameInviteRepository.create({
      createdUser: { id: user.sub },
      invitedUser: { id: data.userId },
      conversation: { id: data.conversationId },
      status: 'PENDING',
    });
  
    // Create the chat linked to the invite
    const chat = this.chatRepository.create({
      conversation: { id: data.conversationId },
      user: { id: user.sub },
      type: 'GAME_INVITE',
      gameInvite: gameInvite,
    });
  
    gameInvite.chat = chat;
  
    // Save both in correct order and capture the real saved invite
    let savedInvite: ChatGameInvite;
    try {
      await this.chatRepository.save(chat);
      savedInvite = await this.chatGameInviteRepository.save(gameInvite);
    } catch (error) {
      console.error('Error saving game invite:', error);
      throw new NotFoundException('Error saving game invite');
    }
  
    // Now use the actual generated ID from the DB
    const roomId = `room-${savedInvite.id}`;
  
    const room: PrivateRoom = {
      roomId,
      hostUserId: user.sub,
      invitedUserId: data.userId,
      player1: {
        userId: user.sub,
        username: user.username,
        socketId: null,
        playerNumber: 1,
      },
    };
  
    const dbUser = await this.userService.findOneById(user.sub);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }
  
    const mes: Message = {
      id: chat.id,
      conversationId: data.conversationId,
      type: 'GAME_INVITE',
      createdAt: chat.createdAt.toString(),
      edited: false,
      text: null,
      gameInviteData: {
        gameId: savedInvite.id,
        status: 'PENDING',
        creatorUsername: user.username,
        creatorUserId: user.sub,
        recipientUserId: data.userId,
        recipientUsername: data.username,
        creatorScore: 0,
        recipientScore: 0,
        winnerUsername: null,
      },
      senderUser: {
        userId: user.sub,
        username: user.username,
        avatar: dbUser.avatar,
      },
    };
  
    this.conversationGatewat.SendChatToConversation(mes);
    this.privateRooms.set(roomId, room);
  
    return roomId;
  }
  
}
