import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AIModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100,
    }]),

    // Bull queue for background jobs
    BullModule.forRootAsync({
      useFactory: () => {
        // Support full REDIS_URL (e.g. Upstash) or individual vars
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          const parsed = new URL(redisUrl);
          return {
            redis: {
              host: parsed.hostname,
              port: Number(parsed.port) || 6379,
              password: parsed.password || undefined,
              username: parsed.username || undefined,
              tls: parsed.protocol === 'rediss:' ? {} : undefined,
            },
          };
        }
        return {
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
          },
        };
      },
    }),

    // Scheduled jobs
    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,
    CacheModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    AnalyticsModule,
    AIModule,
    NotificationsModule,
    PaymentsModule,
    EmailModule,
  ],
})
export class AppModule {}
