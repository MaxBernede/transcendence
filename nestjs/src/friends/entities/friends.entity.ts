import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('friends')
export class FriendsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mainUserId: number;

  @Column()
  secondUserId: number;

  @Column({default: null, nullable: true})
  status: string;
}
