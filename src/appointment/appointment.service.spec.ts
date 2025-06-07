import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentLock } from './entities/appointment-lock.entity';
import { AppointmentsGateway } from './appointment.gateway';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';


jest.mock('src/users/entities/user.entity', () => {
  class User {}
  return { User };
}, { virtual: true });

describe('AppointmentService', () => {
    let service: AppointmentService;
    let appointmentRepository: Repository<Appointment>;
    let lockRepository: Repository<AppointmentLock>;
    let appointmentGateway: AppointmentsGateway;
    let dataSource: DataSource;
    let mockQueryRunner: any;

    beforeEach(async () => {
        mockQueryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppointmentService,
                {
                    provide: getRepositoryToken(Appointment),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(AppointmentLock),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                        remove: jest.fn(),
                    },
                },
                {
                    provide: AppointmentsGateway,
                    useValue: {
                        broadcastUpdateAppointment: jest.fn(),
                        sendForceReleaseLockRequest: jest.fn(),
                        sendForceReleaseLockApproved: jest.fn(),
                        sendRequestControlUpdate: jest.fn(),
                        sendRequestControlApproved: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
                    },
                },
            ],
        }).compile();

        service = module.get<AppointmentService>(AppointmentService);
        appointmentRepository = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
        lockRepository = module.get<Repository<AppointmentLock>>(getRepositoryToken(AppointmentLock));
        appointmentGateway = module.get<AppointmentsGateway>(AppointmentsGateway);
        dataSource = module.get<DataSource>(DataSource);
    });

    describe('acquireLock', () => {
        const appointmentId = 'test-appointment-id';
        const userId = 'test-user-id';
        const userInfo = { name: 'Test User', email: 'test@example.com' };
        const version = 1;

        it('should acquire a lock when the appointment is not locked', async () => {
            const appointment = { id: appointmentId, version, appointmentLock: null };
            const lock = {
                id: 'test-lock-id',
                appointmentId,
                userId,
                userInfo,
                expiresAt: new Date(Date.now() + 300000)
            };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);
            jest.spyOn(lockRepository, 'create').mockReturnValue(lock as any);
            jest.spyOn(lockRepository, 'save').mockResolvedValue(lock as any);

            const result = await service.acquireLock(appointmentId, userId, userInfo, version);

            expect(result).toEqual(lock);
            expect(appointmentRepository.findOne).toHaveBeenCalledWith({
                where: { id: appointmentId },
                relations: ['appointmentLock', 'appointmentLock.user']
            });
            expect(lockRepository.create).toHaveBeenCalled();
            expect(lockRepository.save).toHaveBeenCalled();
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException when appointment does not exist', async () => {
            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(null);

            await expect(service.acquireLock(appointmentId, userId, userInfo, version))
                .rejects.toThrow(NotFoundException);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });

        it('should throw ConflictException when version mismatch occurs', async () => {
            const appointment = { id: appointmentId, version: 2, appointmentLock: null };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);

            await expect(service.acquireLock(appointmentId, userId, userInfo, version))
                .rejects.toThrow(ConflictException);
        });

        it('should renew a lock when same user tries to acquire again', async () => {
            const originalExpiresAt = new Date(Date.now() + 300000);
            const existingLock = {
                id: 'test-lock-id',
                appointmentId,
                userId,
                userInfo,
                expiresAt: originalExpiresAt
            };

            const appointment = { id: appointmentId, version, appointmentLock: existingLock };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);
            jest.spyOn(lockRepository, 'save').mockImplementation(lock => Promise.resolve({
                ...lock
            } as any)); 

            // Simulate a delay to ensure the lock is renewed
            await new Promise(resolve => setTimeout(resolve, 1000));
            const result = await service.acquireLock(appointmentId, userId, userInfo, version);

            console.log('existingLock.expiresAt', existingLock.expiresAt);
            console.log('result.expiresAt', result.expiresAt);
            console.log('originalExpiresAt', originalExpiresAt);
            expect(result.expiresAt).toBeDefined();
            expect(result.expiresAt.getTime()).toBeGreaterThan(originalExpiresAt.getTime());
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw ConflictException when another user has a valid lock', async () => {
            const existingLock = {
                id: 'test-lock-id',
                appointmentId,
                userId: 'another-user-id',
                userInfo: { name: 'Another User', email: 'another@example.com' },
                expiresAt: new Date(Date.now() + 300000)
            };

            const appointment = { id: appointmentId, version, appointmentLock: existingLock };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);

            await expect(service.acquireLock(appointmentId, userId, userInfo, version))
                .rejects.toThrow(ConflictException);
        });

        it('should acquire new lock when existing lock is expired', async () => {
            const expiredLock = {
                id: 'expired-lock-id',
                appointmentId,
                userId: 'another-user-id',
                userInfo: { name: 'Another User', email: 'another@example.com' },
                expiresAt: new Date(Date.now() - 1000) // expired
            };

            const appointment = { id: appointmentId, version, appointmentLock: expiredLock };
            const newLock = {
                id: 'new-lock-id',
                appointmentId,
                userId,
                userInfo,
                expiresAt: new Date(Date.now() + 300000)
            };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);
            jest.spyOn(lockRepository, 'delete').mockResolvedValue(expiredLock as any);
            jest.spyOn(lockRepository, 'create').mockReturnValue(newLock as any);
            jest.spyOn(lockRepository, 'save').mockResolvedValue(newLock as any);

            const result = await service.acquireLock(appointmentId, userId, userInfo, version);

            expect(result).toEqual(newLock);
            expect(lockRepository.delete).toHaveBeenCalledWith(expiredLock.id);
        });
    });

    describe('releaseLock', () => {
        const appointmentId = 'test-appointment-id';
        const userId = 'test-user-id';

        it('should successfully release a lock', async () => {
            const lock = { id: 'test-lock-id', appointmentId, userId };

            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(lock as any);
            jest.spyOn(lockRepository, 'delete').mockResolvedValue({} as any);

            await service.releaseLock(appointmentId, userId);

            expect(lockRepository.findOne).toHaveBeenCalledWith({
                where: { appointmentId, userId }
            });
            expect(lockRepository.delete).toHaveBeenCalledWith(lock.id);
        });

        it('should throw BadRequestException when user does not have a lock', async () => {
            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(null);

            await expect(service.releaseLock(appointmentId, userId))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('requestControl', () => {
        const appointmentId = 'test-appointment-id';
        const userId = 'admin-user-id';
        const currentLockUserId = 'current-lock-user-id';

        it('should successfully request control', async () => {
            const existingLock = {
                appointmentId,
                userId: currentLockUserId,
                requestControlByUserId: null
            };

            const updatedLock = {
                ...existingLock,
                requestControlByUserId: userId
            };

            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(existingLock as any);
            jest.spyOn(lockRepository, 'save').mockResolvedValue(updatedLock as any);

            const result = await service.requestControl(appointmentId, userId);

            expect(result).toEqual(updatedLock);
            expect(lockRepository.save).toHaveBeenCalledWith({
                ...existingLock,
                requestControlByUserId: userId
            });
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException when no lock exists', async () => {
            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(null);

            await expect(service.requestControl(appointmentId, userId))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException when user already owns the lock', async () => {
            const existingLock = {
                appointmentId,
                userId, // Same as requesting user
                requestControlByUserId: null
            };

            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(existingLock as any);

            await expect(service.requestControl(appointmentId, userId))
                .rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException when user has already requested control', async () => {
            const existingLock = {
                appointmentId,
                userId: currentLockUserId,
                requestControlByUserId: userId // Already requested by this user
            };

            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(existingLock as any);

            await expect(service.requestControl(appointmentId, userId))
                .rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException when another user has already requested control', async () => {
            const existingLock = {
                appointmentId,
                userId: currentLockUserId,
                requestControlByUserId: 'another-user-id' // Someone else already requested
            };

            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(existingLock as any);

            await expect(service.requestControl(appointmentId, userId))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('approveRequestControl', () => {
        const appointmentId = 'test-appointment-id';
        const lockOwnerUserId = 'lock-owner-id';
        const requestingUserId = 'requesting-user-id';

        it('should successfully approve request control', async () => {
            const lock = {
                userId: lockOwnerUserId,
                requestControlByUserId: requestingUserId
            };

            const appointment = {
                id: appointmentId,
                appointmentLock: lock
            };

            const updatedLock = {
                ...lock,
                userId: requestingUserId,
                requestControlByUserId: null
            };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);
            jest.spyOn(lockRepository, 'save').mockResolvedValue(updatedLock as any);

            const result = await service.approveRequestControl(appointmentId, lockOwnerUserId);

            expect(result).toEqual({
                requestControlByUserId: requestingUserId,
                lockedByUserId: requestingUserId
            });
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException when appointment does not exist', async () => {
            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(null);

            await expect(service.approveRequestControl(appointmentId, lockOwnerUserId))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when no lock exists', async () => {
            const appointment = {
                id: appointmentId,
                appointmentLock: null
            };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);

            await expect(service.approveRequestControl(appointmentId, lockOwnerUserId))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException when no request for control exists', async () => {
            const lock = {
                userId: lockOwnerUserId,
                requestControlByUserId: null // No request exists
            };

            const appointment = {
                id: appointmentId,
                appointmentLock: lock
            };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);

            await expect(service.approveRequestControl(appointmentId, lockOwnerUserId))
                .rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException when approver is not lock owner', async () => {
            const lock = {
                userId: lockOwnerUserId,
                requestControlByUserId: requestingUserId
            };

            const appointment = {
                id: appointmentId,
                appointmentLock: lock
            };

            jest.spyOn(appointmentRepository, 'findOne').mockResolvedValue(appointment as any);

            await expect(service.approveRequestControl(appointmentId, 'wrong-user-id'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('forceReleaseLockRequest', () => {
        const appointmentId = 'test-appointment-id';
        const adminUserId = 'admin-user-id';

        it('should successfully request force release', async () => {
            const existingLock = {
                appointmentId,
                requestForceReleaseByUserId: null
            };

            const updatedLock = {
                ...existingLock,
                requestForceReleaseByUserId: adminUserId
            };

            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(existingLock as any);
            jest.spyOn(lockRepository, 'save').mockResolvedValue(updatedLock as any);

            await service.forceReleaseLockRequest(appointmentId, adminUserId);

            expect(lockRepository.save).toHaveBeenCalledWith({
                ...existingLock,
                requestForceReleaseByUserId: adminUserId
            });
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException when no lock exists', async () => {
            jest.spyOn(lockRepository, 'findOne').mockResolvedValue(null);

            await expect(service.forceReleaseLockRequest(appointmentId, adminUserId))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('removeExpiredLocks', () => {
        it('should remove all expired locks', async () => {
            const expiredLocks = [
                {
                    appointmentId: 'appointment-1',
                    expiresAt: new Date(Date.now() - 1000)
                },
                {
                    appointmentId: 'appointment-2',
                    expiresAt: new Date(Date.now() - 2000)
                }
            ];

            jest.spyOn(lockRepository, 'find').mockResolvedValue(expiredLocks as any);
            jest.spyOn(lockRepository, 'remove').mockResolvedValue(expiredLocks as any);
            jest.spyOn(service, 'findOne').mockResolvedValue({} as any);
            jest.spyOn(appointmentGateway, 'broadcastUpdateAppointment').mockImplementation();

            await service.removeExpiredLocks();

            expect(lockRepository.find).toHaveBeenCalledWith({
                where: {
                    expiresAt: expect.any(Object)
                }
            });
            expect(lockRepository.remove).toHaveBeenCalledTimes(2);
            expect(appointmentGateway.broadcastUpdateAppointment).toHaveBeenCalledTimes(2);
        });
    });
});