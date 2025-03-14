import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { Match } from './match/match.entity';
import { Chat, Conversation, UserConversation } from './conversations/entities/conversation.entity';
import { FriendsEntity } from './friends/entities/friends.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: +process.env.POSTGRES_PORT || 5432,
  username: process.env.POSTGRES_USER || 'user',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  entities: [User, Match, Chat, Conversation, UserConversation, FriendsEntity],
  synchronize: true, // For development only
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
};
