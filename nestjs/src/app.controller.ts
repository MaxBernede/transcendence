import { Controller, Get, Post, Param } from '@nestjs/common';
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

  // Add a new endpoint to handle /api/users/:id
  @Get('api/users/:id')
  getUserData(@Param('id') id: string) {
    console.log("Requested User ID:", id); // Log to verify request handling
    if (id) {
      return {
        name: `User ${id}`,
        bio: `This is the profile for User ${id}`,
        avatar: null,
      };
    } else {
      return null; // If no user ID is provided, return null
    }
  }
}
