import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AchievementEntity, UserAchievementEntity } from './achievement/achievement.entity';
import { User } from './user/user.entity';
import { Match } from './match/match.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: +process.env.POSTGRES_PORT || 5432,
    username: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'postgresdbb',
    entities: [AchievementEntity, UserAchievementEntity, User, Match],
    synchronize: true,
    migrations: ['dist/migrations/*.js'], // Specify where migrations are located
    migrationsRun: true, // Automatically run migrations on startup
};
