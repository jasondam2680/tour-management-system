import { Module } from '@nestjs/common';
import { GroupToursService } from './group-tours.service';
import { GroupToursController } from './group-tours.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [GroupToursController],
  providers: [GroupToursService, PrismaService],
  exports: [GroupToursService],
})
export class GroupToursModule {}
