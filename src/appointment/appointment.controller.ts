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
import { UserService } from 'src/users/user.service';
import { User } from 'src/users/entities/user.entity';
import { RateLimiterService } from 'src/shared-service/rate-limiter.service';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

@Controller('appointments')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AppointmentController {

    private readonly store = new Map<string, RateLimitRecord>();

    constructor(
        private readonly rateLimiterService: RateLimiterService,
        private readonly appointmentService: AppointmentService,
        private readonly appointmentGateway: AppointmentsGateway,
        private readonly userService: UserService
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

    @Post(':id/acquire-lock/:version')
    async acquireLock(@Param('id') id: string, @Param('version',) version: string, @Request() req) {
        // Use the injected service to check rate limits
        this.rateLimiterService.checkRateLimit(req.user.id);
        const userInfo = {
            name: req.user.name,
            email: req.user.email
        };
        let versionNumber = -1
        try {
            versionNumber = parseInt(version, 10);
        } catch (error) {
            throw new ForbiddenException('Invalid version number');
        }
        const lockAcquired = await this.appointmentService.acquireLock(id, req.user.id, userInfo, versionNumber);
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

    @Post(':id/force-release-lock-request')
    async forceReleaseLockRequest(@Param('id') id: string, @Request() req) {
        if (!req.user.isAdmin) {
            throw new ForbiddenException('Only admins can force release locks');
        }

        await this.appointmentService.forceReleaseLockRequest(id, req.user.id);
        const appointment = await this.appointmentService.findOne(id);
        const appointmentLock = appointment.appointmentLock;
        this.appointmentGateway.sendForceReleaseLockRequest(appointment, appointmentLock.requestForceReleaseByUser, appointmentLock.user);
        return appointment;
    }

    @Post(':id/force-release-lock-approve')
    async forceReleaseLockApprove(@Param('id') id: string, @Request() req) {
        const appointment = await this.appointmentService.findOne(id);
        if (!appointment.appointmentLock || !appointment.appointmentLock.requestForceReleaseByUser) {
            throw new ForbiddenException('No force release request found for this appointment');
        }
        const requestForceReleaseByUser = appointment.appointmentLock.requestForceReleaseByUser;
        const lockedByUser = appointment.appointmentLock.user;
        await this.appointmentService.releaseLock(id, req.user.id);
        const newAppointment = await this.appointmentService.findOne(id);
        this.appointmentGateway.broadcastUpdateAppointment(newAppointment);
        this.appointmentGateway.sendForceReleaseLockApproved(
            appointment,
            lockedByUser as User,
            requestForceReleaseByUser as User,
        );
        return newAppointment;
    }

    @Post(':id/request-control')
    async requestControl(@Param('id') id: string, @Request() req) {
        if (!req.user.isAdmin) {
            throw new ForbiddenException('Only admins can request control');
        }

        await this.appointmentService.requestControl(id, req.user.id);
        const appointment = await this.appointmentService.findOne(id);
        const appointmentLock = appointment.appointmentLock;
        this.appointmentGateway.sendRequestControlUpdate(appointment, appointmentLock.requestControlByUser, appointmentLock.user);
        return appointment;
    }

    @Post(':id/approve-request-control')
    async approveRequestControl(@Param('id') id: string, @Request() req) {
        const { requestControlByUserId, lockedByUserId } = await this.appointmentService.approveRequestControl(id, req.user.id);
        const requestControlByUser = await this.userService.findOne(requestControlByUserId);
        const lockedByUser = await this.userService.findOne(lockedByUserId);
        const appointment = await this.appointmentService.findOne(id);
        this.appointmentGateway.broadcastUpdateAppointment(appointment);
        this.appointmentGateway.sendRequestControlApproved(
            appointment,
            lockedByUser as User,
            requestControlByUser as User,
        )
        return appointment;
    }
}