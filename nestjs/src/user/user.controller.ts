import { Controller, Get, Post, Patch, Param, Body, UploadedFile, UseInterceptors, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get user by ID or username
  @Get(':id')
  async getUser(@Param('id') id: string) {
	  console.log(`Requested User ID: ${id}`);
	  const user = await this.userService.findOne(id);
	  console.log('Returning user data:', user);
	  return user; // Ensure `username` is included in the returned user object
  }
  

@Patch(':id/update-username')
async updateUsername(
  @Param('id') id: string, // Accept both numeric and string IDs
  @Body('username') newUsername: string,
) {
  console.log(`Received PATCH request for ID: ${id} with new username: ${newUsername}`);

  if (!newUsername || newUsername.trim().length === 0) {
    throw new BadRequestException('Username cannot be empty');
  }

  const updatedUser = await this.userService.updateUsername(id, newUsername.trim());
  return { username: updatedUser.username }; // Return the updated username
}

  // Upload avatar
// Inside your UserController
@Post(':id/upload-avatar')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return callback(new BadRequestException('Only image files are allowed'), false);
      }
      callback(null, true);
    },
  }),
)
async uploadAvatar(
  @Param('id') id: string, // Accept `id` as a string
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  const avatarPath = `http://localhost:3000/uploads/avatars/${file.filename}`;
  console.log('Saving avatarPath:', avatarPath);

  // Update the avatar in the database
  const updatedUser = await this.userService.updateAvatar(id, avatarPath);
  console.log('Updated user with avatar:', updatedUser);

  return { avatar: avatarPath };
}


  // Add a friend
  @Post(':userId/add-friend/:friendId')
  async addFriend(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    return this.userService.addFriend(userId, friendId);
  }
}
