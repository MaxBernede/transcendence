import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Match } from '../match/match.entity';
import {
  Chat,
  UserConversation,
} from 'src/conversations/entities/conversation.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  intraId: number;

  @Column({ unique: true, nullable: true })
  username: string;

  // not needed ?
  @Column({ nullable: true, default: '' })
  firstName: string;

  // not needed ?
  @Column({ nullable: true, default: '' })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true, default: null })
  avatar: string;

  @Column({ nullable: true })
  password: string;

  // to store the jwt in case of a 2FA, then switch it back to null when logged in
  @Column({ nullable: true, default: null })
  tempJWT: string;

  @Column({ nullable: true, default: null })
  secret_2fa: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  loose: number;

  @Column({ default: true })
  newUser: boolean;

  @Column({ default: 0 })
  ladder_level: number;

  @Column({ default: null })
  activity_status: string;

  @Column({ type: 'json', nullable: true })
  image: {
    link: string;
    versions?: {
      large?: string;
      medium?: string;
      small?: string;
      micro?: string;
    };
  } | null;

  @ManyToMany(() => User, (user) => user.friends)
  @JoinTable()
  friends: User[];

  @OneToMany(() => Match, (match) => match.user)
  matchHistory: Match[];

  @OneToMany(
    () => UserConversation,
    (userConversation) => userConversation.user,
  )
  userConversations: UserConversation[];
}
