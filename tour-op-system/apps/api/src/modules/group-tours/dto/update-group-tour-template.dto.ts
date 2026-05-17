import { PartialType } from '@nestjs/swagger';
import { CreateGroupTourTemplateDto } from './create-group-tour-template.dto';

export class UpdateGroupTourTemplateDto extends PartialType(CreateGroupTourTemplateDto) {}
