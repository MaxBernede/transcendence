import { Inject, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_CONENCTION } from './database-connection';
import {
  conversations,
  friends,
  messages,
  users,
  usersConversations,
} from '../../schema/schema';

@Module({
  providers: [
    {
      provide: DATABASE_CONENCTION,
      useFactory: async (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL'),
        });
        return drizzle(pool, {
          schema: {
            users,
            friends,
            conversations,
            usersConversations,
            messages,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONENCTION],
})
export class DatabaseModule {}
