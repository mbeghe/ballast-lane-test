import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabelsModule } from './labels/labels.module';
import { IndicationsModule } from './indications/indications.module';
import { ProgramsModule } from './programs/programs.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // FYI: set to true only in development
    }),
    LabelsModule,
    IndicationsModule,
    ProgramsModule,
    AuthModule,
  ],
})
export class AppModule {}
