import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SelectSourceTourDto {
  @ApiProperty({ description: 'Existing Tour ID whose itinerary should be used by the quotation PDF' })
  @IsString()
  tourId: string;
}
