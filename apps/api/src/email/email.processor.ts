import { Processor, Process } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bull";
import { Resend } from "resend";

@Processor("email")
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private resend: Resend;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get("RESEND_API_KEY"));
    // Use Resend's verified test sender for development.
    // Replace with your verified domain sender in production.
    this.fromAddress =
      this.configService.get("EMAIL_FROM") || "onboarding@resend.dev";
  }

  @Process("welcome")
  async handleWelcome(job: Job<{ to: string; subject: string; html: string }>) {
    await this.send(job.data);
  }

  @Process("subscription-added")
  async handleSubscriptionAdded(
    job: Job<{ to: string; subject: string; html: string }>,
  ) {
    await this.send(job.data);
  }

  @Process("renewal-reminder")
  async handleRenewalReminder(
    job: Job<{ to: string; subject: string; html: string }>,
  ) {
    await this.send(job.data);
  }

  @Process("verification")
  async handleVerification(
    job: Job<{ to: string; subject: string; html: string }>,
  ) {
    await this.send(job.data);
  }

  @Process("password-reset")
  async handlePasswordReset(
    job: Job<{ to: string; subject: string; html: string }>,
  ) {
    await this.send(job.data);
  }

  @Process("payment-success")
  async handlePaymentSuccess(
    job: Job<{ to: string; subject: string; html: string }>,
  ) {
    await this.send(job.data);
  }

  @Process("payment-failed")
  async handlePaymentFailed(
    job: Job<{ to: string; subject: string; html: string }>,
  ) {
    await this.send(job.data);
  }

  @Process("monthly-report")
  async handleMonthlyReport(
    job: Job<{ to: string; subject: string; html: string }>,
  ) {
    await this.send(job.data);
  }

  private async send(data: { to: string; subject: string; html: string }) {
    try {
      const { data: result, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      if (error) {
        this.logger.error(
          `Resend error for ${data.to}: ${JSON.stringify(error)}`,
        );
        throw new Error(error.message ?? "Resend send failed");
      }
      this.logger.log(`Email sent to ${data.to} — id: ${result?.id ?? "n/a"}`);
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${data.to}: ${err.message}`);
      throw err; // re-throw so Bull can retry
    }
  }
}
