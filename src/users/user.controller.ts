import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ConflictException,
    BadRequestException
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        try {
            return await this.userService.create(createUserDto);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Failed to create user');
        }
    }

    @Get()
    async findAll() {
        try {
            return await this.userService.findAll();
        } catch (error) {
            throw new BadRequestException('Failed to retrieve users');
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        try {
            return await this.userService.findOne(id);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve user');
        }
    }
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }
        if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
            throw new BadRequestException('Update data is required');
        }
        try {
            return await this.userService.update(id, updateUserDto);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to update user');
        }
    }
    @Delete(':id')
    async remove(@Param('id') id: string) {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }
        try {
            return await this.userService.remove(id);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to delete user');
        }
    }
}