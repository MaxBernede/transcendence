import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Match } from '../match/match.entity';
import { AchievementEntity } from '../achievement/achievement.entity';

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true, default: null })
    avatar: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true, default: null })
    hash_key: string;

    @Column({ nullable: true, default: null })
    phone_number_2fa: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ default: 0 })
    wins: number;

    @Column({ default: 0 })
    loose: number;

    @Column({ default: 0 })
    ladder_level: number;

    @Column({ default: null })
    activity_status: string;

    @ManyToMany(() => User, (user) => user.friends)
    @JoinTable()
    friends: User[];

	@OneToMany(() => Match, (match) => match.user)
  	matchHistory: Match[]; // One-to-many relationship with matches

	  @ManyToMany(() => AchievementEntity, (achievement) => achievement.users, { cascade: true })
	  @JoinTable({
		  name: 'user_achievements',
		  joinColumn: { name: 'user_id', referencedColumnName: 'id' },
		  inverseJoinColumn: { name: 'achievement_id', referencedColumnName: 'id' },
	  })
	  achievements: AchievementEntity[];
	  
}
