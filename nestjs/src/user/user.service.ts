import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { users } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer'; // Import the class-transformer
import { UserPublicDto } from './dto';

@Injectable()
export class UserService {
  constructor(private drizzle: DrizzleService) {}

  async getUser(username: string) {
    const user = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || user.length === 0) {
      throw new NotFoundException('User not found');
    }

	// return user[0];
	return plainToClass(UserPublicDto, user[0], {
		excludeExtraneousValues: true, // Exclude fields that are not in the DTO (e.g., password)
	  });

  }
}
