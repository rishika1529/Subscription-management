import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../database/prisma.service";
import { EmailService } from "../email/email.service";

// Map of "days until renewal" → reminder label stored in DB.
// Negative values are catch-up reminders for days the scheduler missed
// (e.g. Render free-tier dyno was asleep when the cron fired).
const REMINDER_MILESTONES: Record<number, string> = {
  7: "7_days",
  3: "3_days",
  1: "1_day",
  0: "due_today",
  [-1]: "overdue_catchup_1d",
  [-2]: "overdue_catchup_2d",
};

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-RENEWAL JOB
  // Runs every 6 hours.  For every ACTIVE subscription whose nextBillingDate
  // has already passed, the date is rolled forward by one billing cycle,
  // a RenewalHistory row is written, and a confirmation email is sent.
  // The subscription stays ACTIVE — it is "auto-renewed" until the user
  // explicitly deletes or edits it.
  // ─────────────────────────────────────────────────────────────────────────
  @Cron("30 */6 * * *", { name: "auto-renewals" })
  async processAutoRenewals() {
    return this.runAutoRenewals();
  }

  /** Public so the admin endpoint can trigger it manually. */
  async runAutoRenewals() {
    this.logger.log("🔄 Running auto-renewal job…");

    const now = new Date();

    // Find all ACTIVE subscriptions whose billing date is in the past.
    const overdue = await this.prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        autoRenew: true,
        nextBillingDate: { lt: now },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    this.logger.log(`Found ${overdue.length} subscription(s) to auto-renew.`);

    let renewed = 0;
    let failed = 0;

    for (const sub of overdue) {
      try {
        // Calculate the next billing date from the CURRENT nextBillingDate
        // (not from today) so we don't drift if the job was delayed.
        const newNextDate = this.advanceBillingDate(
          new Date(sub.nextBillingDate),
          sub.billingCycle,
        );

        // Roll the subscription forward.
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate: newNextDate,
            status: "ACTIVE", // ensure it stays ACTIVE
          },
        });

        // Record renewal history.
        await this.prisma.renewalHistory.create({
          data: {
            subscriptionId: sub.id,
            renewedAt: now,
            amount: sub.amount,
            currency: sub.currency,
            success: true,
            metadata: {
              previousDate: sub.nextBillingDate,
              newDate: newNextDate,
              autoRenewed: true,
            },
          },
        });

        // Clear old reminder dedup rows so fresh reminders fire for the
        // new billing cycle.
        await this.prisma.reminder.deleteMany({
          where: { subscriptionId: sub.id },
        });

        // Send a renewal confirmation email (fire-and-forget).
        const email = sub.user?.email;
        if (email) {
          this.emailService
            .sendSubscriptionRenewedEmail(email, sub, newNextDate)
            .catch((err) =>
              this.logger.error(
                `Failed to send renewal email for "${sub.name}": ${err.message}`,
              ),
            );
        }

        this.logger.log(
          `✅ Auto-renewed "${sub.name}" → next date: ${newNextDate.toISOString().slice(0, 10)}`,
        );
        renewed++;
      } catch (err: any) {
        this.logger.error(
          `❌ Failed to auto-renew "${sub.name}" (${sub.id}): ${err.message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `🔄 Auto-renewal job done — renewed: ${renewed}, failed: ${failed}`,
    );
    return { renewed, failed };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENEWAL REMINDER JOB
  // Runs every 6 hours so it catches up even after Render free-tier sleep.
  // Deduplication is done via the Reminder table — each (subscription, type)
  // pair is only emailed once per billing cycle.
  // ─────────────────────────────────────────────────────────────────────────
  @Cron("0 */6 * * *", { name: "renewal-reminders" })
  async sendRenewalReminders() {
    return this.runRenewalReminders();
  }

  /**
   * Weekly database keepalive job.
   * This is intentionally tiny so it can wake a sleeping Supabase/Postgres
   * instance without depending on email providers or business logic.
   */
  @Cron("0 8 * * 0", { name: "database-keepalive" })
  async keepDatabaseAlive() {
    return this.runDatabaseKeepalive();
  }

  /** Public so the admin endpoint can trigger it manually. */
  async runRenewalReminders() {
    this.logger.log("⏰ Running renewal reminder job…");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch active subscriptions renewing within a window that includes
    // a 2-day grace period for missed days (Render sleep, deploy gaps, etc.).
    // NOTE: We no longer look back further than 2 days because overdue subs
    // are handled by the auto-renewal job above.
    const upcoming = await this.prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        nextBillingDate: {
          gte: new Date(today.getTime() - 2 * 86_400_000),
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
        const result = await this.emailService.sendRenewalReminder(
          email,
          sub,
          daysUntil,
        );

        // CRITICAL: only record dedup row if the email actually went out.
        // EmailService returns { success: false, error } instead of throwing
        // on missing API key, Brevo rejection, etc. Recording dedup on those
        // failures would permanently silence this subscription's reminders.
        if (!result || result.success !== true) {
          this.logger.error(
            `❌ Reminder NOT sent to ${email} for "${sub.name}" — ${
              result?.error ?? "unknown error"
            }. Will retry on next cron run.`,
          );
          skipped++;
          continue;
        }

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

  async runDatabaseKeepalive() {
    this.logger.log("🛟 Running weekly database keepalive job…");

    const startedAt = new Date();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      this.logger.log(`✅ Database keepalive succeeded in ${durationMs}ms`);
      return {
        success: true,
        message: "Database keepalive succeeded",
        checkedAt: startedAt.toISOString(),
        durationMs,
      };
    } catch (err: any) {
      this.logger.error(`❌ Database keepalive failed: ${err.message}`);
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Advance a billing date by exactly one cycle.
   * We advance from the STORED date (not today) so the schedule never drifts
   * even if the cron fires late.
   */
  private advanceBillingDate(from: Date, billingCycle: string): Date {
    const d = new Date(from);
    switch (billingCycle) {
      case "WEEKLY":
        d.setDate(d.getDate() + 7);
        break;
      case "MONTHLY":
        d.setMonth(d.getMonth() + 1);
        break;
      case "QUARTERLY":
        d.setMonth(d.getMonth() + 3);
        break;
      case "YEARLY":
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        // ONE_TIME or unknown — push 1 month forward as a safe default
        d.setMonth(d.getMonth() + 1);
    }
    return d;
  }
}
