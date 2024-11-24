import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './user/user.module'; // Import UsersModule
import { typeOrmConfig } from './ormconfig'; // Assuming TypeORM config is defined in ormconfig.ts

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig), // Database connection
    UsersModule, // Import UsersModule to make UserService available
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
