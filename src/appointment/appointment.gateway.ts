
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { AppointmentService } from './appointment.service';
import { forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { Appointment } from './entities/appointment.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppointmentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server


  // Map to store connected users with their socket IDs and user information
  private connectedUsers: Map<string, { socketId: string, userId: string }> = new Map();


  constructor(
    @Inject(forwardRef(() => AppointmentService))
    private appointmentService: AppointmentService,
    private jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {

    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
    }

    try {
      const user = await this.jwtService.verifyAsync(
        token,
        {
          secret: process.env.JWT_SECRET,
        }
      );
      if (!user) {
        client.disconnect();
      }
      client['user'] = user;
      this.connectedUsers.set(user.id, { socketId: client.id, userId: user.id });
    } catch (error) {
      client.disconnect();
    }




    const appointments = await this.appointmentService.findAll();
    const updatedAppointments = appointments.map(appointment => {
      return {
        ...appointment
      };
    });
    client.emit('init-appointments', updatedAppointments);
    console.log('Client connected:', client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Client disconnected', client.id)

    // Remove the disconnected user from the map
    for (const [key, value] of this.connectedUsers.entries()) {
      if (value.socketId === client.id) {
        this.connectedUsers.delete(key);
        break;
      }
    }


    this.server.emit('user-left', {
      message: `User left the chat: ${client.id}`,
      clientId: client.id,
    });
  }

  @SubscribeMessage('newMessage')
  handleNewMessage(@MessageBody() message: any): void {
    console.log('New message:', message);
    this.server.emit('message', "message received:asdfasdfsd " + message);
  }

  broadcastUpdateAppointment(appointment: any): void {
    console.log('Broadcasting new appointment:', appointment);
    const appointmentToSend = {
      ...appointment,
    };
    this.server.emit('update-appointments', appointmentToSend);
  }

  broadcastLockRemoved(appointmentId: string): void {
    console.log('Broadcasting lock removed for appointment:', appointmentId);
    this.server.emit('lock-removed', { appointmentId });
  }
  broadcastLockAdded(appointmentId: string, lockAcquired: any): void {
    console.log('Broadcasting lock added for appointment:', appointmentId, 'by user:', lockAcquired.userInfo);
    this.server.emit('lock-added', { appointmentId, lockAcquired });
  }

  sendRequestControlUpdate(appointment: Appointment, fromUser: User, toUser: User): void {
    this.connectedUsers.forEach((user) => {
      if (user.userId === toUser.id) {
        this.server.to(user.socketId).emit('request-control', {
          appointment: {
            id: appointment.id,
            title: appointment.title,
            patientName: appointment.patientName,
            datebirth: appointment.datebirth,
            startTime: appointment.startTime,
          },
          fromUser: {
            id: fromUser.id,
            name: fromUser.name,
            email: fromUser.email,
          },
          expiresAt: appointment.appointmentLock.expiresAt,
        });
        return
      }
    });
  }

  sendRequestControlApproved(appointment: Appointment, fromUser: User, toUser: User): void {
    this.connectedUsers.forEach((user) => {
      if (user.userId === toUser.id) {
        this.server.to(user.socketId).emit('request-control-approved', {
          appointment: {
            id: appointment.id,
            title: appointment.title,
            patientName: appointment.patientName,
            datebirth: appointment.datebirth,
            startTime: appointment.startTime,
          },
          fromUser: {
            id: fromUser.id,
            name: fromUser.name,
            email: fromUser.email,
          }
        });
        return
      }
    });
  }

  sendForceReleaseLockRequest(appointment: Appointment, fromUser: User, toUser: User): void {
    this.connectedUsers.forEach((user) => {
      if (user.userId === toUser.id) {
        this.server.to(user.socketId).emit('force-release-lock-request', {
          appointment: {
            id: appointment.id,
            title: appointment.title,
            patientName: appointment.patientName,
            datebirth: appointment.datebirth,
            startTime: appointment.startTime,
          },
          fromUser: {
            id: fromUser.id,
            name: fromUser.name,
            email: fromUser.email,
          }
        });
        return
      }
    });
  }

  sendForceReleaseLockApproved(appointment: Appointment, fromUser: User, toUser: User): void {
    this.connectedUsers.forEach((user) => {
      if (user.userId === toUser.id) {
        this.server.to(user.socketId).emit('force-release-lock-approved', {
          appointment: {
            id: appointment.id,
            title: appointment.title,
            patientName: appointment.patientName,
            datebirth: appointment.datebirth,
            startTime: appointment.startTime,
          },
          fromUser: {
            id: fromUser.id,
            name: fromUser.name,
            email: fromUser.email,
          }
        });
        return
      }
    });
  }
}