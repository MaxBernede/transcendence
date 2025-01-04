import { IsString, IsEmail, Length, IsOptional, IsObject } from "class-validator";

export class CreateUserDto {
  @IsString()
  @Length(3, 20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 20)
  password: string;

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


export class authDto {
	@IsString()
	@Length(3, 20)
	username: string;

	@IsEmail()
	email: string;

	@IsString()
	@Length(6, 20)
	password: string;
}