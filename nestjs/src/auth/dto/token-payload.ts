import { IsEmail, IsNotEmpty } from 'class-validator';

export class TokenPayload {
  @IsNotEmpty() // Correct decorator
  sub: number;

  @IsEmail() // Correct decorator
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  username: string;
}
