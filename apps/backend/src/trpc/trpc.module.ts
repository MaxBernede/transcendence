import { Module } from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { TrpcPanelController } from './trpc-panel.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { AppContext } from './context/app.context';
import { LocalAuthMiddleware } from './middleware/localAuth.middleware';
import { LocalStrategy } from 'src/auth/strategies/local.strategy';
import { AuthModule } from 'src/auth/auth.module';
import { JwtStrategyMiddleware } from './middleware/jwt-strategy.middleware';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    TRPCModule.forRoot({
      autoSchemaFile: '../../packages/trpc/src',
      context: AppContext,
    }),
    AuthModule,
	UsersModule,
	DatabaseModule,
  ],
  controllers: [TrpcPanelController],
  providers: [
    LoggerMiddleware,
    AppContext,
    LocalAuthMiddleware,
    JwtStrategyMiddleware,
    JwtService,
    UsersService,
  ],
})
export class TrpcModule {}
