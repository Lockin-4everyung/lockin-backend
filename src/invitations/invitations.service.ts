import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CommitmentsService } from '../commitments/commitments.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationDto, InvitationStatus } from './dto/invitation.dto';

@Injectable()
export class InvitationsService {
  private readonly invitations = new Map<string, InvitationDto>();

  constructor(private readonly commitments: CommitmentsService) {}

  create(commitmentId: string, input: CreateInvitationDto): InvitationDto {
    this.commitments.findOne(commitmentId);
    const duplicate = this.findAll().some((invitation) =>
      invitation.commitmentId === commitmentId && invitation.inviteeId === input.inviteeId,
    );
    if (duplicate) throw new ConflictException('This user already has an invitation for this commitment');
    const invitation: InvitationDto = {
      id: randomUUID(),
      commitmentId,
      inviteeId: input.inviteeId,
      status: InvitationStatus.Pending,
      createdAt: new Date().toISOString(),
    };
    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  findAll(): InvitationDto[] {
    return [...this.invitations.values()];
  }

  transition(id: string, status: InvitationStatus.Accepted | InvitationStatus.Declined): InvitationDto {
    const invitation = this.invitations.get(id);
    if (!invitation) throw new NotFoundException(`Invitation ${id} not found`);
    if (invitation.status !== InvitationStatus.Pending) {
      throw new ConflictException(`Invitation is already ${invitation.status}; only pending invitations can be accepted or declined`);
    }
    const updated = { ...invitation, status };
    this.invitations.set(id, updated);
    return updated;
  }
}
