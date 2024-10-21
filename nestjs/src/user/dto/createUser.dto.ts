import { IsString, IsEmail, Length } from "class-validator";

export class CreateUserDto {
	@IsString()
	@Length(3, 20)
	username: string;

	@IsEmail()
	email: string;

	@IsString()
	@Length(6, 20)
	password: string;
}