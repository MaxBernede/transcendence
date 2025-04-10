import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Chat } from './chat.entity';

@Entity()
export class ChatGameInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Who created the game invite
  @ManyToOne(() => User)
  @JoinColumn()
  createdUser: User;

  @ManyToOne(() => User)
  @JoinColumn()
  invitedUser: User;

  // Which conversation this invite belongs to
  @ManyToOne(() => Conversation)
  @JoinColumn()
  conversation: Conversation;

  // Status of the game invite
  @Column({
	type: 'enum',
	enum: ['PENDING', 'COMPLETED'],
	default: 'PENDING',
  })
  status: 'PENDING' | 'COMPLETED';

  // Timestamps for tracking the invite lifecycle
  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true }) //? temporary remove later
  creatorScore: number;

  @Column({ nullable: true }) //? temporary remove later
  recipientScore: number;

  @Column({ nullable: true }) //? temporary remove later
  winnerUsername: string;

  // One-to-one relationship with the chat message
  @OneToOne(() => Chat, (chat) => chat.gameInvite)
  @JoinColumn()
  chat: Chat;
}