import { Controller, Get, Post, Param, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user/user.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('api/click')
  handleClick(): { message: string } {
    return this.appService.handleButtonClick();
  }

  @Get('api/users/:id')
  async getUser(@Param('id') id: string) {
	console.log("Requested User ID or Username:", id); // Log to verify request handling
  
	// Validate input
	if (!id) {
	  throw new BadRequestException('Invalid User ID: Must not be empty.');
	}
  
	const isNumericId = !isNaN(Number(id)); // Determine if the input is numeric
	let user;
  
	try {
	  // Try fetching the user from the database
	  user = await this.userService.findOne(isNumericId ? +id : id);
	} catch (error) {
	  console.error("Error fetching user:", error.message);
	  user = null; // Set user to null if an error occurs
	}
  
	// If user exists in the database, return it
	if (user) {
	  return user;
	}
  
	// If no user found, return a mock response
	console.warn(`User with ID or username "${id}" not found. Returning mock data.`);
	return {
	  username: `${id}`, // Use the input as the username
	  bio: `This is the profile for User ${id}`,
	  avatar: null,
	  wins: 0, // Default stats for mock users
	  losses: 0,
	  ladderLevel: 1,
	};
  }  

  @Post('api/users/:id/update-username')
  async updateUsername(@Param('id') id: string, @Body('username') newUsername: string) {
	console.log(`Updating username for user ID ${id} to:`, newUsername);
	if (!newUsername || newUsername.trim().length === 0) {
	  throw new BadRequestException('Username cannot be empty');
	}
	return { id, username: newUsername }; // Mock response
  }
  
}
