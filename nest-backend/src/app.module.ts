import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
// import { GatewayModule } from './gateway/gateway.module';
// import { SocketModule } from './socket/socket.module';
import { EventsModule } from './events/events.module';
import { ConversationsModule } from './conversations/conversations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    // GatewayModule,
    // SocketModule,
    EventsModule,
	ConversationsModule,
  ],
  controllers: [],
})
export class AppModule {}
