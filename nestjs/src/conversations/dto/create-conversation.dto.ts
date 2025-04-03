import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description:
      'The name of the conversation. This is only required for group chats.',
    example: 'Project Discussion',
    required: false, // Optional field, only needed for GROUP type
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    description:
      'password',
    required: false, // Optional field, only needed for GROUP type
  })
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({
    description: 'Whether the conversation is private.',
    example: false,
    required: false, // Optional field, only needed for GROUP type
  })
  @IsBoolean()
  @IsOptional()
  isPrivate: boolean;

  @ApiProperty({
    description:
      'The type of conversation. Choose either DM (Direct Message) or GROUP (Group Chat). For DM, only the first participant will be considered.',
    example: 'DM',
    enum: ['DM', 'GROUP'],
    required: true, // Required field
  })
  @IsNotEmpty()
  @IsEnum(['DM', 'GROUP'])
  type: 'DM' | 'GROUP';

  @ApiProperty({
    description:
      'The list of participant IDs. For DM, only the first participant (index 0) will be used.',
    example: ['user1', 'user2'],
    type: [String],
    required: true, // Required field
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  participants: string[];
}

export class CreateConversationDmDto {
  @IsUUID() // Ensures that the receiverId is a valid UUID
  @IsNotEmpty()
  receiverId: string; // ID of the receiver for the DM conversation
}

export class UpdateMemberRoleDto {
  @IsUUID() // Ensures that the conversationId is a valid UUID
  @IsNotEmpty()
  conversationId: string; // ID of the conversation to update

  @IsNotEmpty()
  memberId: number; // ID of the member to update

  @IsEnum(['OWNER', 'ADMIN', 'MEMBER'])
  @IsNotEmpty()
  role: 'OWNER' | 'ADMIN' | 'MEMBER'; // Role to assign to the member
}

export class JoinConversationDto {
  @IsUUID() // Ensures that the receiverId is a valid UUID
  @IsNotEmpty()
  id: string; // ID of the receiver for the DM conversation

  @IsString()
  @IsOptional()
  password: string;
}

export class LeaveConversationDto {
  @IsUUID() // Ensures that the conversationId is a valid UUID
  @IsNotEmpty()
  id: string; // ID of the conversation to leave
}

export class CreateConversationGroupDto {
  @IsString()
  @IsOptional()
  name: string; // Name of the group

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true }) // Ensures that all items in the array are valid UUIDs
  participants: string[]; // List of participant IDs
}

export class ChangePasswordDto {
  @IsUUID() // Ensures that the conversationId is a valid UUID
  @IsNotEmpty()
  id: string; // ID of the conversation to change the password

  @IsString()
  password: string; // New password for the conversation
}
