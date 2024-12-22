
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsUrl()
  avatarUrl: string;
}

export class UpdateUserDto {
  @IsString()
  username?: string;

  @IsString()
  password?: string;

  @IsUrl()
  avatarUrl?: string;
}