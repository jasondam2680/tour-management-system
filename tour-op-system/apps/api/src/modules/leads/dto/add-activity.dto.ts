import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddActivityDto {
  @ApiProperty({ example: 'call', description: 'call | email | whatsapp | meeting | note | status_change' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 'Follow-up call' })
  @IsOptional() @IsString()
  subject?: string;

  @ApiProperty({ example: 'Spoke with client, they are interested in 7D6N package.' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'positive' })
  @IsOptional() @IsString()
  outcome?: string;
}
