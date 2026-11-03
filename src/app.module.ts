import { Module } from '@nestjs/common';
import { CommitmentsModule } from './commitments/commitments.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({ imports: [CommitmentsModule, InvitationsModule] })
export class AppModule {}
