import { isNotEmpty, IsNumber, IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePongDto {
  @IsNumber()
  userId: number;

  @IsString()
  roomId: string;

}

export class createInviteDto {

	@IsString()
	@IsNotEmpty()
	username: string;
}

export class JoinPrivateRoomDto {

	@IsUUID()
	roomId: string;
}