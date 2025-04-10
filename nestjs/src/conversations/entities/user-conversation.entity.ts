import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity()
export class UserConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The ManyToOne relationship will automatically create the userId column
  @ManyToOne(() => User)
  @JoinColumn() // This defines the column name
  user: User;

  @ManyToOne(() => Conversation)
  @JoinColumn()
  conversation: Conversation;

  @Column({ type: 'boolean', default: false })
  banned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  banEnd: Date | null;

  @Column({ type: 'boolean', default: false })
  muted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  mutedUntil: Date | null;

  @Column({
	type: 'enum',
	enum: ['MEMBER', 'ADMIN', 'OWNER'],
	default: 'MEMBER',
  })
  role: 'MEMBER' | 'ADMIN' | 'OWNER';

  @CreateDateColumn()
  joinedAt: Date;
}