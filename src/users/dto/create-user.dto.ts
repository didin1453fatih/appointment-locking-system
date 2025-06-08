import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @ApiProperty({
        type: String,
        example: 'Budi'
    })
    name: string;

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({
        type: String,
        example: 'admin@example.com'
    })
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @ApiProperty({
        type: String,
        example: '123123'
    })
    password: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({
        type: Boolean,
        example: false
    })
    isAdmin?: boolean;
}