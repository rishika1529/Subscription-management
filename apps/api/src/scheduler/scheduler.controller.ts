import { Controller, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';

@ApiTags('scheduler')
@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly scheduler: SchedulerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Manually trigger the renewal-reminder job.
   * Protected by a static CRON_SECRET header — safe for external cron services
   * (no expiring JWT needed).
   * Header: x-cron-secret: <your CRON_SECRET env var>
   */
  @Post('run-renewal-reminders')
  async runRenewalReminders(@Headers('x-cron-secret') secret: string) {
    const expected = this.config.get<string>('CRON_SECRET');
    if (!expected || secret !== expected) throw new UnauthorizedException('Invalid cron secret');
    await this.scheduler.runRenewalReminders();
    return { success: true, message: 'Renewal reminder job executed.' };
  }
}
