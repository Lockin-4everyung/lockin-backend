import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CommitmentStatus {
  Scheduled = 'scheduled',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export class CommitmentDto {
  @ApiProperty({ example: '721a0446-e510-47d3-9419-c39e26fa2b75', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Study NestJS for one hour' })
  title!: string;

  @ApiPropertyOptional({ example: 'Review controllers, services and DTO validation.' })
  description?: string;

  @ApiProperty({ example: 'user-1' })
  creatorId!: string;

  @ApiProperty({ example: '2026-11-10T09:00:00+07:00', format: 'date-time' })
  startTime!: string;

  @ApiProperty({ example: '2026-11-10T10:00:00+07:00', format: 'date-time' })
  endTime!: string;

  @ApiProperty({ enum: CommitmentStatus, enumName: 'CommitmentStatus', example: CommitmentStatus.Scheduled })
  status!: CommitmentStatus;

  @ApiProperty({ example: '2026-11-03T09:00:00.000Z', format: 'date-time' })
  createdAt!: string;
}
