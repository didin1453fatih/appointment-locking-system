import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @ApiProperty({
        type: String,
        example: 'Budi'
    })
    name?: string;

    @IsOptional()
    @IsEmail()
    @ApiProperty({
        type: String,
        example: 'budi@example.com'
    })
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    @ApiProperty({
        type: String,
        example: 'password123'
    })
    password?: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({
        type: Boolean,
        example: false
    })
    isAdmin?: boolean;
}