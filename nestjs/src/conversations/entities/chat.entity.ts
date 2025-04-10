import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { ChatGameInvite } from './chat-game-invite.entity';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Use only the conversationId (id from Conversation entity)
  @ManyToOne(() => Conversation, (conversation) => conversation.chats)
  @JoinColumn()
  conversation: Conversation;

  // Use only the userId (id from User entity)
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column('text', { nullable: true })
  text: string;

  // Add message type to distinguish regular messages from game invites
  @Column({ type: 'enum', enum: ['TEXT', 'GAME_INVITE'], default: 'TEXT' })
  type: 'TEXT' | 'GAME_INVITE';

  @Column({ type: 'boolean', default: false })
  edited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => ChatGameInvite, (gameInvite) => gameInvite.chat, {
    nullable: true,
  })
  gameInvite: ChatGameInvite;
}