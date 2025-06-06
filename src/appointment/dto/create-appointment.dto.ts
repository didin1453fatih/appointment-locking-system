import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDate, IsOptional, IsISO8601, IsIn, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        type: String,
        example: 'Doctor Appointment',
    })
    title: string;

    @IsString()
    @ApiProperty({
        type: String,
        example: 'patient name',
    })
    patientName: string

    @IsDateString()
    @ApiProperty({
        type: Date,
        example: '2023-03-15',
        description: 'The date of birth of the patient in YYYY-MM-DD format',
    })
    datebirth: Date;

    @IsNotEmpty()
    @IsIn(['male', 'female'])
    @ApiProperty({
        type: String,
        example: 'male|female',
    })
    gender: string;

    @IsString()    
    @ApiProperty({
        type: String,
        example: '123-456-7890',
    })
    phone: string;

    @IsString()
    @ApiProperty({
        type: String,
        example: '123 Main St, Anytown, USA',
    })
    address: string;

    @IsString()
    @ApiProperty({
        type: String,
        example: 'Dr. Smith',
    })
    doctorName: string;


    @IsOptional()
    @IsString()
    @ApiProperty({
        type: String,
        example: 'A brief note about the appointment',
    })
    note?: string;

    @IsNotEmpty()
    @IsISO8601()
    @ApiProperty({
        type: Date,
        example: '2023-03-15T10:00:00Z',
        description: 'The start time of the appointment in ISO 8601 format',
    })
    startTime: Date;

    @IsNotEmpty()
    @IsISO8601()
    @ApiProperty({
        type: Date,
        example: '2023-03-15T11:00:00Z',
        description: 'The end time of the appointment in ISO 8601 format',
    })
    endTime: Date;
}