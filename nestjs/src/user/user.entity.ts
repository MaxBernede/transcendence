import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @Column({nullable: true, default: null }) 
  avatar: string;

  @Column()
  password: string;

  @Column({nullable: true, default: null })
  hash_key: string;

  @Column({nullable: true, default: null })
  phone_number_2fa: number;

  @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  loose: number;

  @Column({ default: 0 })
  ladder_level: number;

  @Column({ default: null})
  activity_status: string;
}