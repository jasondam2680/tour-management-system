import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QuotationWorkflowStage } from '@prisma/client';

export class UpdateWorkflowStageDto {
  @ApiProperty({ enum: QuotationWorkflowStage })
  @IsEnum(QuotationWorkflowStage)
  stage: QuotationWorkflowStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
