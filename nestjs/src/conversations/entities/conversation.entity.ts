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
import { UserConversation } from './user-conversation.entity';
import { Chat } from './chat.entity';
// import { ChatGameInvite } from './chat-game-invite.entity';
// import { ChatGameInvite } from './chat-game-invite.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Field to indicate whether the conversation is a DM or a Group chat
  @Column({ type: 'enum', enum: ['DM', 'GROUP'], default: 'DM' })
  type: 'DM' | 'GROUP';

  // Optional field for Group  name
  @Column({ type: 'text', default: 'Untitled Group' })
  name: string;

  @Column({ type: 'text', default: null })
  password: string;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  // Relationship with the UserConversation join table (many-to-one)
  @OneToMany(
    () => UserConversation,
    (userConversation) => userConversation.conversation,
  )
  userConversations: UserConversation[];

  // Relationship with the chats in the conversation (one-to-many)
  @OneToMany(() => Chat, (chat) => chat.conversation)
  chats: Chat[];

  // Last activity timestamp (defaults to now)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivity: Date;

  @CreateDateColumn()
  createdAt: Date;
}
// @Entity()
// export class Chat {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   // Use only the conversationId (id from Conversation entity)
//   @ManyToOne(() => Conversation, (conversation) => conversation.chats)
//   @JoinColumn()
//   conversation: Conversation;

//   // Use only the userId (id from User entity)
//   @ManyToOne(() => User)
//   @JoinColumn()
//   user: User;

//   @Column('text')
//   text: string;

//   // Add message type to distinguish regular messages from game invites
//   @Column({ type: 'enum', enum: ['TEXT', 'GAME_INVITE'], default: 'TEXT' })
//   type: 'TEXT' | 'GAME_INVITE';

//   @Column({ type: 'boolean', default: false })
//   edited: boolean;

//   @CreateDateColumn()
//   createdAt: Date;

//   @OneToOne(() => ChatGameInvite, (gameInvite) => gameInvite.chat, {
//     nullable: true,
//   })
//   gameInvite: ChatGameInvite;
// }

// @Entity()
// export class ChatGameInvite {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   // Who created the game invite
//   @ManyToOne(() => User)
//   @JoinColumn()
//   createdBy: User;

//   @ManyToOne(() => User)
//   @JoinColumn()
//   invitedUser: User;

//   // Which conversation this invite belongs to
//   @ManyToOne(() => Conversation)
//   @JoinColumn()
//   conversation: Conversation;

//   // Status of the game invite
//   @Column({
//     type: 'enum',
//     enum: ['PENDING', 'COMPLETED'],
//     default: 'PENDING',
//   })
//   status: 'PENDING' | 'COMPLETED';

//   // Timestamps for tracking the invite lifecycle
//   @CreateDateColumn()
//   createdAt: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   completedAt: Date | null;

//   // Game result (stored as JSON)
//   @Column('json', { nullable: true })
//   gameResult: {
//     score?: { [userId: string]: number };
//     winnerId?: string;
//     gameData?: any; // For any additional game-specific data
//   } | null;

//   // One-to-one relationship with the chat message
//   @OneToOne(() => Chat, (chat) => chat.gameInvite)
//   @JoinColumn()
//   chat: Chat;
// }


// @Entity()
// export class UserConversation {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   // The ManyToOne relationship will automatically create the userId column
//   @ManyToOne(() => User)
//   @JoinColumn() // This defines the column name
//   user: User;

//   @ManyToOne(() => Conversation)
//   @JoinColumn()
//   conversation: Conversation;

//   @Column({ type: 'boolean', default: false })
//   banned: boolean;

//   @Column({ type: 'timestamp', nullable: true })
//   banEnd: Date | null;

//   @Column({ type: 'boolean', default: false })
//   muted: boolean;

//   @Column({ type: 'timestamp', nullable: true })
//   mutedUntil: Date | null;

//   @Column({
//     type: 'enum',
//     enum: ['MEMBER', 'ADMIN', 'OWNER'],
//     default: 'MEMBER',
//   })
//   role: 'MEMBER' | 'ADMIN' | 'OWNER';

//   @CreateDateColumn()
//   joinedAt: Date;
// }

























// @Entity()
// export class UserConversation {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   // Store only the userId (linking to the User table)
//   @Column('int')
//   userId: number;

//   // Store only the conversationId (linking to the Conversation table)
//   @Column('uuid')
//   conversationId: string;

//   @ManyToOne(() => User, (user) => user.id)
//   @JoinColumn({ name: 'userId' })
//   user: User; // Optional, if you need to join with the user

//   @ManyToOne(() => Conversation, (conversation) => conversation.id)
//   @JoinColumn({ name: 'conversationId' })
//   conversation: Conversation; // Optional, if you need to join with the conversation

//   @Column({ type: 'boolean', default: false })
//   banned: boolean;

//   @Column({ type: 'timestamp', nullable: true })
//   banEnd: Date | null; // for permanent bans set date to +999 years?

//   @Column({ type: 'boolean', default: false })
//   muted: boolean;

//   @Column({ type: 'timestamp', nullable: true })
//   mutedUntil: Date | null;

//   @Column({
//     type: 'enum',
//     enum: ['MEMBER', 'ADMIN', 'OWNER'],
//     default: 'MEMBER',
//   })
//   role: 'MEMBER' | 'ADMIN' | 'OWNER';

//   @CreateDateColumn()
//   joinedAt: Date;
// }

