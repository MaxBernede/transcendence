import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user/user.service';
import { GetUserPayload } from './test.decorator';
import { JwtAuthGuard } from './auth/jwt.guard';
import { TokenPayload } from './auth/dto/token-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppService } from './app.service';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    // private readonly userService: UserService,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
	// private readonly configService: ConfigService,
	// private usersService: UserService,
	// 	private jwtService: JwtService,


  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('api/click')
  handleClick(): { message: string } {
    return this.appService.handleButtonClick();
  }
}
