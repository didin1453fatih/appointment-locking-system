import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './users/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dataSourceOptions } from './configs/database.config';
import { AuthModule } from './auth/auth.module';
import { AppointmentModule } from './appointment/appointment.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          ...dataSourceOptions,
          migrationsRun: true
        };
      },
    }),
    UserModule,
    AuthModule,
    AppointmentModule,
  ],
})
export class AppModule { }