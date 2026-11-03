import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/api-error.dto';
import { CommitmentsService } from './commitments.service';
import { CommitmentDto } from './dto/commitment.dto';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@ApiTags('Commitments')
@Controller('commitments')
export class CommitmentsController {
  constructor(private readonly commitments: CommitmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a study commitment', description: 'New commitments have scheduled status. Data is stored in memory and resets on restart.' })
  @ApiBody({ type: CreateCommitmentDto })
  @ApiCreatedResponse({ type: CommitmentDto, description: 'Commitment created.' })
  @ApiBadRequestResponse({ type: ApiErrorDto, description: 'Invalid fields, unknown properties, or endTime is not after startTime.' })
  create(@Body() input: CreateCommitmentDto): CommitmentDto {
    return this.commitments.create(input);
  }

  @Get()
  @ApiOperation({ summary: 'List all commitments' })
  @ApiOkResponse({ type: [CommitmentDto], description: 'All commitments, or an empty array.' })
  findAll(): CommitmentDto[] {
    return this.commitments.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a commitment by ID' })
  @ApiParam({ name: 'id', description: 'Commitment ID returned by POST /commitments.' })
  @ApiOkResponse({ type: CommitmentDto })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Commitment does not exist.' })
  findOne(@Param('id') id: string): CommitmentDto {
    return this.commitments.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a commitment', description: 'Send only fields to change. The resulting endTime must be after startTime, including when only one timestamp is changed.' })
  @ApiParam({ name: 'id', description: 'Existing commitment ID.' })
  @ApiBody({ type: UpdateCommitmentDto })
  @ApiOkResponse({ type: CommitmentDto })
  @ApiBadRequestResponse({ type: ApiErrorDto, description: 'Invalid fields, null values, status or time range.' })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Commitment does not exist.' })
  update(@Param('id') id: string, @Body() input: UpdateCommitmentDto): CommitmentDto {
    return this.commitments.update(id, input);
  }
}
