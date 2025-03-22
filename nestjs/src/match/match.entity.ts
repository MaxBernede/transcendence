import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/user.entity';

@Entity()
export class Match {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, { nullable: false })
	winner: User;

	@ManyToOne(() => User, { nullable: false })
	looser: User;

	@Column()
	winnerScore: number;

	@Column()
	looserScore: number;

	@CreateDateColumn()
	date: Date;
}
