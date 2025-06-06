import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Request,
    UseGuards,
    ForbiddenException
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsGateway } from './appointment.gateway';

@Controller('appointments')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AppointmentController {
    constructor(
        private readonly appointmentService: AppointmentService,
        private readonly appointmentGateway: AppointmentsGateway,

    ) { }

    @Post()
    async create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req) {
        const appointment = await this.appointmentService.create(createAppointmentDto);
        this.appointmentGateway.broadcastUpdateAppointment(appointment);
        return appointment;
    }

    @Get()
    async findAll() {
        return this.appointmentService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.appointmentService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateAppointmentDto: UpdateAppointmentDto,
        @Request() req
    ) {
        const updatedAppointment = await this.appointmentService.update(id, updateAppointmentDto, req.user.id);
        const appointment = await this.appointmentService.findOne(updatedAppointment.id);
        this.appointmentGateway.broadcastUpdateAppointment(appointment);
        return appointment;
    }

    @Get(':id/lock-status')
    async getLockStatus(@Param('id') id: string) {
        return this.appointmentService.getLockStatus(id);
    }

    @Post(':id/acquire-lock')
    async acquireLock(@Param('id') id: string, @Request() req) {
        const userInfo = {
            name: req.user.name,
            email: req.user.email
        };
        const lockAcquired = await this.appointmentService.acquireLock(id, req.user.id, userInfo);
        const appointment = await this.appointmentService.findOne(id);
        this.appointmentGateway.broadcastUpdateAppointment(appointment);
        return lockAcquired;
    }

    @Delete(':id/release-lock')
    async releaseLock(@Param('id') id: string, @Request() req) {
        await this.appointmentService.releaseLock(id, req.user.id);
        const appointment = await this.appointmentService.findOne(id);
        this.appointmentGateway.broadcastUpdateAppointment(appointment);
        return appointment;
    }

    @Post(':id/force-release-lock')
    async forceReleaseLock(@Param('id') id: string, @Request() req) {
        if (!req.user.isAdmin) {
            throw new ForbiddenException('Only admins can force release locks');
        }

        return this.appointmentService.forceReleaseLock(id, req.user.id);
    }
}