import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Database {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}