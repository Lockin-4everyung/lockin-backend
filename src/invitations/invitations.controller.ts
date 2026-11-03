import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/api-error.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationDto, InvitationStatus } from './dto/invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('commitments/:id/invitations')
  @ApiOperation({ summary: 'Invite a friend to a commitment', description: 'Creates a pending invitation. Each invitee can be invited once per commitment.' })
  @ApiParam({ name: 'id', description: 'Existing commitment ID returned by POST /commitments.' })
  @ApiBody({ type: CreateInvitationDto })
  @ApiCreatedResponse({ type: InvitationDto })
  @ApiBadRequestResponse({ type: ApiErrorDto, description: 'Missing or invalid inviteeId, or unknown properties.' })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Commitment does not exist.' })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'Duplicate invitation for the same commitment and invitee.' })
  create(@Param('id') id: string, @Body() input: CreateInvitationDto): InvitationDto {
    return this.invitations.create(id, input);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List all invitations', description: 'Use this endpoint to verify accepted or declined status.' })
  @ApiOkResponse({ type: [InvitationDto], description: 'All invitations, or an empty array.' })
  findAll(): InvitationDto[] {
    return this.invitations.findAll();
  }

  @Patch('invitations/:id/accept')
  @ApiOperation({ summary: 'Accept a pending invitation' })
  @ApiParam({ name: 'id', description: 'Invitation ID returned by the create invitation endpoint.' })
  @ApiOkResponse({ type: InvitationDto })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Invitation does not exist.' })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'Invitation has already been accepted or declined.' })
  accept(@Param('id') id: string): InvitationDto {
    return this.invitations.transition(id, InvitationStatus.Accepted);
  }

  @Patch('invitations/:id/decline')
  @ApiOperation({ summary: 'Decline a pending invitation' })
  @ApiParam({ name: 'id', description: 'Invitation ID returned by the create invitation endpoint.' })
  @ApiOkResponse({ type: InvitationDto })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Invitation does not exist.' })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'Invitation has already been accepted or declined.' })
  decline(@Param('id') id: string): InvitationDto {
    return this.invitations.transition(id, InvitationStatus.Declined);
  }
}
