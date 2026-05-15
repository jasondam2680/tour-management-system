import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  lostReason?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  wonAt?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  lostAt?: string;
}
