import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // Base controller for general and user-related routes
export class AppController {
  constructor(private readonly appService: AppService) {}
  
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('api/click')
  handleClick(): { message: string } {
    return this.appService.handleButtonClick();
  }

  // Endpoint to handle fetching user data by ID
// Endpoint to handle fetching user data by ID
@Get('api/users/:id')
getUserData(@Param('id') id: string) {
  console.log("Requested User ID:", id); // Log to verify request handling
  if (id) {
    return {
      username: `${id}`, // Replace 'name' with 'username'
      bio: `This is the profile for User ${id}`,
      avatar: null,
    };
  } else {
    return null; // If no user ID is provided, return null
  }
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
