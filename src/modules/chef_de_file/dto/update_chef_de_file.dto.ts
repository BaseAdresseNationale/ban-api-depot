import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEmail,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { Perimeter } from '../chef_de_file.schema';

export class UpdateChefDeFileDTO {
  @IsString()
  @Length(3, 200)
  @ApiProperty({ type: String, required: false })
  nom?: string;

  @IsEmail()
  @ApiProperty({ type: String, required: false })
  email?: string;

  @IsBoolean()
  @ApiProperty({ type: Boolean, required: false })
  isEmailPublic?: boolean;

  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => Perimeter)
  @ApiProperty({
    type: () => Perimeter,
    isArray: true,
    required: true,
    nullable: false,
  })
  perimetre?: Perimeter[];
}
