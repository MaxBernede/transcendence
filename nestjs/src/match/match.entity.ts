import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('match_history') // Ensure this matches your table name in the database
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  opponent: string;

  @Column()
  result: string;

  @Column()
  score: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @ManyToOne(() => User, (user) => user.matchHistory, { onDelete: 'CASCADE' })
  user: User; // Many-to-one relationship with user
}
