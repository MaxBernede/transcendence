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

  @Column({ type: 'timestamp' })
  date: Date;

  @ManyToOne(() => User, (user) => user.matchHistory, { nullable: false })
  @JoinColumn({ name: 'user_id' }) // Explicitly map to the 'user_id' column in the database
  user: User; // This sets up the foreign key
}
