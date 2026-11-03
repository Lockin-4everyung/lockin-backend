import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CommitmentDto, CommitmentStatus } from './dto/commitment.dto';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@Injectable()
export class CommitmentsService {
  private readonly commitments = new Map<string, CommitmentDto>();

  create(input: CreateCommitmentDto): CommitmentDto {
    this.validateTimes(input.startTime, input.endTime);
    const commitment: CommitmentDto = {
      ...input,
      id: randomUUID(),
      status: CommitmentStatus.Scheduled,
      createdAt: new Date().toISOString(),
    };
    this.commitments.set(commitment.id, commitment);
    return commitment;
  }

  findAll(): CommitmentDto[] {
    return [...this.commitments.values()];
  }

  findOne(id: string): CommitmentDto {
    const commitment = this.commitments.get(id);
    if (!commitment) throw new NotFoundException(`Commitment ${id} not found`);
    return commitment;
  }

  update(id: string, input: UpdateCommitmentDto): CommitmentDto {
    const existing = this.findOne(id);
    const updated = { ...existing, ...input };
    this.validateTimes(updated.startTime, updated.endTime);
    this.commitments.set(id, updated);
    return updated;
  }

  private validateTimes(startTime: string, endTime: string): void {
    const start = Date.parse(startTime);
    const end = Date.parse(endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }
  }
}
