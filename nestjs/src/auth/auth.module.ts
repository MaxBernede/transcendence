import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from 'src/ormconfig';
import { User } from 'src/user/user.entity';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';

@Module({
  imports: [
	TypeOrmModule.forRoot(typeOrmConfig),
	TypeOrmModule.forFeature([User]),
	UsersModule,
	AuthModule,
	TwoFactorAuthModule,
    ConfigModule,
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET') || 'fallbackSecret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
