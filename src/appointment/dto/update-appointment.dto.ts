import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDate, IsISO8601, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The title of the appointment',
    type: String,
  })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The description of the appointment',
    type: String,
  })
  description?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: 'The start time of the appointment',
    type: Date,
  })
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: 'The end time of the appointment',
    type: Date,
  })
  endTime?: string;

  @IsNumber()
 @IsNotEmpty()
  @ApiProperty({
    description: 'The version of the appointment being updated',
    type: 'number',
  })
  version: number;
}