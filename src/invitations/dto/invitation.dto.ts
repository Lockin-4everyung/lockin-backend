import { ApiProperty } from '@nestjs/swagger';

export enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
}

export class InvitationDto {
  @ApiProperty({ example: '1dc35c13-c05c-4d1d-9e57-a45909462140', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '721a0446-e510-47d3-9419-c39e26fa2b75', format: 'uuid' })
  commitmentId!: string;

  @ApiProperty({ example: 'user-2' })
  inviteeId!: string;

  @ApiProperty({ enum: InvitationStatus, enumName: 'InvitationStatus', example: InvitationStatus.Pending })
  status!: InvitationStatus;

  @ApiProperty({ example: '2026-11-03T09:00:00.000Z', format: 'date-time' })
  createdAt!: string;
}
