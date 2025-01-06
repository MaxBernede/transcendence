import { IsNotEmpty, Max, MaxLength } from 'class-validator';

export class CreateConversationDmDto {
  @IsNotEmpty()
  username: string;
}

export class SendConversationMessageDto {
  @IsNotEmpty()
  @MaxLength(4048)
  message: string;
}
