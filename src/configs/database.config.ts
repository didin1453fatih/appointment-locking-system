import * as dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
dotenv.config({
    path: `.env.${process.env.NODE_ENV || 'development'}`,
});



import { DataSource, DataSourceOptions } from "typeorm"

export const dataSourceOptions: DataSourceOptions =
{
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'appointments_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.DATABASE_LOGGING === 'true',

}

const MysqlDataSource = new DataSource(dataSourceOptions)

export default MysqlDataSource;


