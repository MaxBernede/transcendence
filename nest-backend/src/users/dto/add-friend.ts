import { IsNotEmpty } from 'class-validator';

export class addFriend {
  @IsNotEmpty()
  userId1: number;
  @IsNotEmpty()
  userId2: number;
}
