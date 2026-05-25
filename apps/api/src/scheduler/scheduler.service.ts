import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';

// Map of "days until renewal" → reminder label stored in DB
const REMINDER_MILESTONES: Record<number, string> = {
  7: '7_days',
  3: '3_days',
  1: '1_day',
  0: 'due_today',
};

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Runs every 6 hours so it catches up even after Render free-tier sleep.
   * Deduplication is done via the Reminder table — each (subscription, type)
   * pair is only emailed once.
   */
  @Cron('0 */6 * * *', { name: 'renewal-reminders' })
  async sendRenewalReminders() {
    return this.runRenewalReminders();
  }

  /** Public so the admin endpoint can trigger it manually. */
  async runRenewalReminders() {
    this.logger.log('⏰ Running renewal reminder job…');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all active subscriptions renewing within the next 8 days
    const upcoming = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          gte: today,
          lte: new Date(today.getTime() + 8 * 86_400_000),
        },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const sub of upcoming) {
      const nextMidnight = new Date(sub.nextBillingDate);
      nextMidnight.setHours(0, 0, 0, 0);
      const daysUntil = Math.round(
        (nextMidnight.getTime() - today.getTime()) / 86_400_000,
      );

      const reminderType = REMINDER_MILESTONES[daysUntil];
      if (!reminderType) {
        skipped++;
        continue;
      }

      const email = sub.user?.email;
      const userId = sub.user?.id;
      if (!email || !userId) {
        skipped++;
        continue;
      }

      // ── Deduplication: skip if already sent for this (sub, type) ──────────
      const alreadySent = await this.prisma.reminder.findFirst({
        where: {
          subscriptionId: sub.id,
          type: reminderType,
          sent: true,
        },
      });

      if (alreadySent) {
        this.logger.debug(
          `Skipping ${reminderType} for "${sub.name}" — already sent`,
        );
        skipped++;
        continue;
      }

      try {
        await this.emailService.sendRenewalReminder(email, sub, daysUntil);

        // Record in Reminder table so we don't send again
        await this.prisma.reminder.create({
          data: {
            userId,
            subscriptionId: sub.id,
            type: reminderType,
            scheduledFor: nextMidnight,
            sent: true,
            sentAt: new Date(),
            emailSent: true,
          },
        });

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
    return { sent, skipped };
  }
}
