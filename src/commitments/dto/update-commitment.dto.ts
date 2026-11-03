import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';
import { CreateCommitmentDto } from './create-commitment.dto';
import { CommitmentStatus } from './commitment.dto';

export class UpdateCommitmentDto extends PartialType(CreateCommitmentDto, { skipNullProperties: false }) {
  @ApiPropertyOptional({ enum: CommitmentStatus, enumName: 'CommitmentStatus', example: CommitmentStatus.Completed })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(CommitmentStatus)
  status?: CommitmentStatus;
}
