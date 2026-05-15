import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity } from '@prisma/client';

export class AddIncidentDto {
  @ApiProperty({ example: 'medical', description: 'medical | complaint | delay | vehicle | weather | other' })
  @IsString()
  type: string;

  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedBy?: string;
}
