import { IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class UserPublicDto {
  @Expose() // Expose all properties of the class
  @IsNotEmpty()
  username: string;
}
