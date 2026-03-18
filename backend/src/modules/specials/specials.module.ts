import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpecialsController } from './specials.controller';
import { SpecialsService } from './specials.service';

@Module({
  imports: [PrismaModule],
  controllers: [SpecialsController],
  providers: [SpecialsService],
  exports: [SpecialsService],
})
export class SpecialsModule {}
