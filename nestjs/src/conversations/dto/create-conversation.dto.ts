import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
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

export class CreateConversationGroupDto {
  @IsString()
  @IsOptional()
  name: string; // Name of the group

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true }) // Ensures that all items in the array are valid UUIDs
  participants: string[]; // List of participant IDs
}
