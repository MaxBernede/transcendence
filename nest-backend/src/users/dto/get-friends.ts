import { IsNotEmpty } from 'class-validator';

export class getFriends {
  @IsNotEmpty()
  userId: number;
}
