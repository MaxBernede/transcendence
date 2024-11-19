import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

//Filename for the picture ?
@Entity()
export class AchievementEntity {
	@PrimaryGeneratedColumn()
	id: number;
  
	@Column({ unique: true })
	achievementName: string;
  
	@Column()
	description: string;

	@Column( { default: null })
	filename: string;
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
