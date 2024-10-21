import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasesService } from './database.service';
import { DatabasesController } from './database.controller';
import { Database } from './database.entity';
import { typeOrmConfig } from 'src/ormconfig';

@Module({
	imports: [
		TypeOrmModule.forRoot(typeOrmConfig),
		TypeOrmModule.forFeature([Database]),
	],
	providers: [DatabasesService],
	controllers: [DatabasesController],
})
export class DatabasesModule {}
