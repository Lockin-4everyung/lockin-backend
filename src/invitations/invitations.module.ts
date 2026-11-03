import { Module } from '@nestjs/common';
import { CommitmentsModule } from '../commitments/commitments.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [CommitmentsModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
