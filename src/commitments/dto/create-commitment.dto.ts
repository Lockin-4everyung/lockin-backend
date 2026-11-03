import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateCommitmentDto {
  @ApiProperty({ example: 'Study NestJS for one hour' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'title must contain non-whitespace characters' })
  title!: string;

  @ApiPropertyOptional({ example: 'Review controllers, services and DTO validation.' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  description?: string;

  @ApiProperty({ example: 'user-1', description: 'Demo user identifier; no authentication is required.' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'creatorId must contain non-whitespace characters' })
  creatorId!: string;

  @ApiProperty({ example: '2026-11-10T09:00:00+07:00', format: 'date-time', description: 'ISO 8601 timestamp with Z or an explicit UTC offset.' })
  @IsDateString({ strict: true, strictSeparator: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/, { message: 'startTime must include a timezone (Z or +/-HH:mm)' })
  startTime!: string;

  @ApiProperty({ example: '2026-11-10T10:00:00+07:00', format: 'date-time', description: 'Must be strictly after startTime.' })
  @IsDateString({ strict: true, strictSeparator: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/, { message: 'endTime must include a timezone (Z or +/-HH:mm)' })
  endTime!: string;
}
