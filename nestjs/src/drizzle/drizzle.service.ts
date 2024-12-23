import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres'; // Drizzle ORM initialization
import { Pool } from 'pg'; // PostgreSQL client
import { users } from '../db/schema'; // Assuming this is where your schema is defined

import * as schema from '../db/schema';

@Injectable()
export class DrizzleService {
  private db;
  private db2;


  constructor(private configService: ConfigService) {
    const pool = new Pool({
      connectionString: this.configService.get('DATABASE_URL'), // Fetch DATABASE_URL from environment
    });

    // Correctly initialize Drizzle with the schema passed as a record
    // this.db = drizzle(pool, {
    //   schema: {
    //     users: users, // Define the users table in the schema object
    //   },
    // });
    this.db = drizzle(pool, {
      schema: { users },
    });

	this.db2 = drizzle({ client: pool});

    // this.testQuery();
  }

  async testQuery() {
    try {
      const user = await this.db
        .insert(users)
        .values({
          username: 'test1',
          password: 'test',
        })
        .returning();
      console.log('User created:', user);
    } catch (error) {
      console.error('Failed to create user:', error);
    }

    try {
      const testQuery = await this.db.select().from(users).limit(1);
      console.log('Test query result:', testQuery);
    } catch (error) {
      console.error('Database connection test failed:', error);
    }
  }

  // Expose the initialized db instance to be used in other parts of the app
  getDb() {
    return this.db;
  }

  getDb2() {
	return this.db2;
  }
}
