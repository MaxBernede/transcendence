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
} from 'typeorm';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Field to indicate whether the conversation is a DM or a Group chat
  @Column({ type: 'enum', enum: ['DM', 'GROUP'], default: 'DM' })
  type: 'DM' | 'GROUP';

  // Optional field for Group  name
  @Column({ type: 'text', default: 'Untitled Group', nullable: true })
  name: string;

  // Relationship with the UserConversation join table (many-to-one)
  @OneToMany(
    () => UserConversation,
    (userConversation) => userConversation.conversation,
  )
  userConversations: UserConversation[];

  // Relationship with the chats in the conversation (one-to-many)
  @OneToMany(() => Chat, (chat) => chat.conversationId)
  chats: Chat[];
}

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Use only the conversationId (id from Conversation entity)
  @ManyToOne(() => Conversation, (conversation) => conversation.chats)
  @JoinColumn({ name: 'conversationId' })
  conversationId: string; // Storing conversationId directly as a UUID

  // Use only the userId (id from User entity)
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  userId: string; // Storing userId directly as a UUID

  @Column('text')
  text: string;

  @Column({ type: 'boolean', default: false })
  edited: boolean; // Flag to indicate if the message was edited

  @CreateDateColumn()
  createdAt: Date; // Timestamp of when the message was sent
}

@Entity()
export class UserConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Store only the userId (linking to the User table)
  @Column('int')
  userId: number;

  // Store only the conversationId (linking to the Conversation table)
  @Column('uuid')
  conversationId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User; // Optional, if you need to join with the user

  @ManyToOne(() => Conversation, (conversation) => conversation.id)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation; // Optional, if you need to join with the conversation
}
