import { IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class ChatDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  @MaxLength(4048)
  text: string;

  @IsNotEmpty()
  edited: boolean;

  @IsOptional()
  createdAt: Date;
}
