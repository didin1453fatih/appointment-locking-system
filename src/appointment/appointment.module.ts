import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentLock } from './entities/appointment-lock.entity';
import { AppointmentsGateway } from './appointment.gateway';
import { UserModule } from '../users/user.module';
import { RateLimiterService } from 'src/shared-service/rate-limiter.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, AppointmentLock]),
        ScheduleModule.forRoot(),
        UserModule,
    ],
    controllers: [AppointmentController],
    providers: [
        AppointmentsGateway,
        AppointmentService,
        RateLimiterService
    ],
    exports: [AppointmentService]
})
export class AppointmentModule { }