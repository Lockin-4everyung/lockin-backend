import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'user-2', description: 'Identifier of the friend to invite.' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'inviteeId must contain non-whitespace characters' })
  inviteeId!: string;
}
