import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { User } from '../user/user.entity';
import { OneToMany, ManyToOne } from 'typeorm';

@Entity()
export class AchievementEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  achievementName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  filename: string;

  @OneToMany(() => UserAchievementEntity, (userAchievement) => userAchievement.achievement)
  userAchievements: UserAchievementEntity[]; // List of users who have this achievement
}


@Entity()
export class UserAchievementEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userAchievements)
  user: User; // User relation

  @ManyToOne(() => AchievementEntity, (achievement) => achievement.userAchievements)
  achievement: AchievementEntity;

  @Column()
  userId: string; // User ID
}
