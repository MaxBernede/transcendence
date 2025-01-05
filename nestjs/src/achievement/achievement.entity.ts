import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('achievement') 
export class AchievementEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'achievement_name' })
  achievementName: string;
  

  @Column()
  description: string;

  @Column({ default: null })
  filename: string;

  @ManyToMany(() => User, (user) => user.achievements)
  users: User[];
}

@Entity()
export class UserAchievementEntity {
	@PrimaryGeneratedColumn()
	id: number;
  
	@Column()	
	userId: number;
  
	@Column()
	achievementId: number;
}
