import { Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
	constructor(config: ConfigService) {
		super({
			datasources: {
				db: {
					// url: 'postgresql://user:postgres@localhost:5432/postgresdbb?schema=public'
					url: config.get('DATABASE_URL'),
				}
			}
		});
	}
}
