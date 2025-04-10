import { IsNumber, IsString } from 'class-validator';

export class CreatePongDto {
  @IsNumber()
  userId: number;

  @IsString()
  roomId: string;
}
