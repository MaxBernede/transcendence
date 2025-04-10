import {
  IsString,
  IsEmail,
  Length,
  IsOptional,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 20)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  wins?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  loose?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ladderLevel?: number;

  @IsOptional()
  @IsObject()
  image?: {
    link: string;
    versions?: {
      large?: string;
      medium?: string;
      small?: string;
      micro?: string;
    };
  };
}
