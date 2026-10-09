import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LinksModule } from './links/links.module';
import { CheckinsModule } from './checkins/checkins.module';
import { AlertsModule } from './alerts/alerts.module';
import { FamilyModule } from './family/family.module';
import { RealtimeModule } from './realtime/realtime.module';

/**
 * Module racine : connexion PostgreSQL + assemblage des modules métier.
 * Pour ajouter une fonctionnalité : créer un module dédié et l'importer ici.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'seniorcare'),
        autoLoadEntities: true, // chaque module déclare ses entités via forFeature
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    LinksModule,
    RealtimeModule,
    CheckinsModule,
    AlertsModule,
    FamilyModule,
  ],
})
export class AppModule {}
