import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Runs every day at 9:00 AM UTC.
   * Finds every active subscription renewing in exactly 7, 3, or 1 days
   * and sends the user a renewal reminder email.
   */
  @Cron('0 9 * * *', { name: 'renewal-reminders' })
  async sendRenewalReminders() {
    return this.runRenewalReminders();
  }

  /** Extracted so it can be called manually via the admin endpoint. */
  async runRenewalReminders() {
    this.logger.log('⏰ Running renewal reminder job…');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch active subs with next billing date within the next 7 days
    const upcoming = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          gte: today,
          lte: new Date(today.getTime() + 8 * 86400000),
        },
      },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    let sent = 0;
    let skipped = 0;
    const milestones = [7, 3, 1, 0];

    for (const sub of upcoming) {
      // Normalize billing date to midnight so time-of-day doesn't skew the diff
      const nextMidnight = new Date(sub.nextBillingDate);
      nextMidnight.setHours(0, 0, 0, 0);
      const daysUntil = Math.round(
        (nextMidnight.getTime() - today.getTime()) / 86400000,
      );

      if (!milestones.includes(daysUntil)) {
        skipped++;
        continue;
      }

      const email = sub.user?.email;
      if (!email) {
        skipped++;
        continue;
      }

      try {
        await this.emailService.sendRenewalReminder(email, sub, daysUntil);
        this.logger.log(
          `📧 Reminder sent → ${email} for "${sub.name}" (${daysUntil}d away)`,
        );
        sent++;
      } catch (err: any) {
        this.logger.error(
          `Failed to send reminder to ${email} for "${sub.name}": ${err.message}`,
        );
      }
    }

    this.logger.log(
      `✅ Renewal reminder job done — sent: ${sent}, skipped: ${skipped}`,
    );
  }
}
