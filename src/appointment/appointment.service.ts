import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, LessThan } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentLock } from './entities/appointment-lock.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Cron } from '@nestjs/schedule';
import { AppointmentsGateway } from './appointment.gateway';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentLock)
    private lockRepository: Repository<AppointmentLock>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => AppointmentsGateway))
    private readonly appointmentGateway: AppointmentsGateway,
  ) { }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.appointmentRepository.create(createAppointmentDto);
    return this.appointmentRepository.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['appointmentLock', 'appointmentLock.user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: [
        'appointmentLock',
        'appointmentLock.user',
        'appointmentLock.requestControlByUser',
        'appointmentLock.requestForceReleaseByUser'
      ]
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, userId: string): Promise<Appointment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if the user has a lock on this appointment
      const lock = await this.lockRepository.findOne({
        where: { appointmentId: id, userId }
      });

      if (!lock) {
        throw new BadRequestException('You do not have a lock on this appointment');
      }

      // Check if lock is expired
      if (new Date() > lock.expiresAt) {
        await this.releaseLock(id, userId);
        throw new BadRequestException('Your lock has expired. Please acquire a new lock.');
      }

      // Get appointment with version for optimistic locking
      const appointment = await this.appointmentRepository.findOne({
        where: { id }
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      // Check version for optimistic locking
      if (appointment.version !== updateAppointmentDto.version) {
        throw new ConflictException('This appointment has been modified by another user. Please refresh and try again.');
      }

      // Update the appointment
      const updatedAppointment = {
        ...appointment,
        ...updateAppointmentDto,
        version: appointment.version + 1
      };

      // Update lock expiry time
      lock.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      await this.lockRepository.save(lock);

      const result = await this.appointmentRepository.save(updatedAppointment);

      await queryRunner.commitTransaction();

      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getLockStatus(id: string): Promise<AppointmentLock | null> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['lock', 'lock.user']
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment.appointmentLock || null;
  }

  async acquireLock(appointmentId: string, userId: string, userInfo: any, version: number): Promise<AppointmentLock> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if appointment exists
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['appointmentLock', 'appointmentLock.user']
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
      }
      // Check version for optimistic locking
      if (appointment.version !== version) {
        throw new ConflictException('This appointment has been modified by another user. Please refresh and try again.');
      }

      // Check if it's already locked
      if (appointment.appointmentLock) {
        // Check if lock is expired
        const now = new Date();

        if (now < appointment.appointmentLock.expiresAt) {
          // If the same user is trying to renew their lock
          if (appointment.appointmentLock.userId === userId) {
            appointment.appointmentLock.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
            const renewedLock = await this.lockRepository.save(appointment.appointmentLock);
            await queryRunner.commitTransaction();
            return renewedLock;
          }

          throw new ConflictException(`This appointment is currently being edited by ${appointment.appointmentLock.userInfo.name}`);
        }

        // Lock is expired, release it
        await this.lockRepository.delete(appointment.appointmentLock.id);
      }

      // Create a new lock
      const lock = this.lockRepository.create({
        appointmentId,
        userId,
        userInfo,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      });

      const savedLock = await this.lockRepository.save(lock);

      await queryRunner.commitTransaction();

      return savedLock;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async releaseLock(appointmentId: string, userId: string): Promise<void> {
    const lock = await this.lockRepository.findOne({
      where: { appointmentId, userId }
    });

    if (!lock) {
      throw new BadRequestException('You do not have a lock on this appointment');
    }

    await this.lockRepository.delete(lock.id);
  }



  async forceReleaseLockRequest(appointmentId: string, requestByUserId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lock = await this.lockRepository.findOne({
        where: { appointmentId }
      });

      if (!lock) {
        throw new NotFoundException(`No lock found for appointment with ID ${appointmentId}`);
      }

      lock.requestForceReleaseByUserId = requestByUserId;
      await this.lockRepository.save(lock);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }



  async updateCursorPosition(appointmentId: string, userId: string, position: { x: number, y: number }): Promise<void> {
    const lock = await this.lockRepository.findOne({
      where: { appointmentId, userId }
    });

    if (!lock) {
      throw new BadRequestException('You do not have a lock on this appointment');
    }

    // Update cursor position in userInfo
    lock.userInfo = {
      ...lock.userInfo,
      position
    };

    // Refresh lock expiry time as well
    lock.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    await this.lockRepository.save(lock);
  }

  async requestControl(appointmentId: string, userId: string): Promise<AppointmentLock> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Check if the user already has a lock
      const existingLock = await this.lockRepository.findOne({
        where: { appointmentId }
      });

      console.log('Existing lock:', existingLock);

      if (!existingLock) {
        throw new NotFoundException(`No lock found for appointment with ID ${appointmentId}`);
      }

      if (existingLock.userId === userId) {
        throw new ConflictException('You already have a lock on this appointment');
      }

      if (existingLock.requestControlByUserId === userId) {
        throw new ConflictException('You already requested control for this appointment');
      }

      // Check if there's an existing lock by another user
      if (existingLock.requestControlByUserId && existingLock.requestControlByUserId !== userId) {
        throw new ConflictException(`This appointment is requested for control by another user`);
      }

      existingLock.requestControlByUserId = userId;
      const savedLock = await this.lockRepository.save(existingLock);
      await queryRunner.commitTransaction();
      return savedLock;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async approveRequestControl(appointmentId: string, lockedByUserId: string): Promise<{ requestControlByUserId: string, lockedByUserId: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if the appointment exists
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['appointmentLock']
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
      }

      const lock = appointment.appointmentLock;

      if (!lock) {
        throw new NotFoundException(`No lock found for appointment with ID ${appointmentId}`);
      }

      if (!lock.requestControlByUserId) {
        throw new ConflictException('No request for control found for this appointment');
      }

      if (lock.userId !== lockedByUserId) {
        throw new BadRequestException('You are not the owner of this lock');
      }

      const requestControlByUserId = lock.requestControlByUserId;

      // Approve the request by setting the userId to the requestControlByUserId
      lock.userId = lock.requestControlByUserId;
      lock.requestControlByUserId = null; // Clear the request control user

      const updatedLock = await this.lockRepository.save(lock);
      await queryRunner.commitTransaction();

      return {
        requestControlByUserId: requestControlByUserId,
        lockedByUserId: updatedLock.userId
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  @Cron('*/10 * * * * *') // Run every 10 seconds
  async removeExpiredLocks() {
    const expiredLocks = await this.lockRepository.find({
      where: {
        expiresAt: LessThan(new Date())
      }
    });
    for (const lock of expiredLocks) {
      await this.lockRepository.remove(lock);
      const appointment = await this.findOne(lock.appointmentId);
      this.appointmentGateway.broadcastUpdateAppointment(appointment);
    }
  }
}