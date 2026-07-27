import {
  Controller,
  Post,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { SchedulerService } from "./scheduler.service";

@ApiTags("scheduler")
@Controller("scheduler")
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
  @Post("run-renewal-reminders")
  async runRenewalReminders(@Headers("x-cron-secret") secret: string) {
    this.verifyCronSecret(secret);
    const result = await this.scheduler.runRenewalReminders();
    return {
      success: true,
      message: "Renewal reminder job executed.",
      ...result,
    };
  }

  /**
   * Manually trigger the auto-renewal job.
   * Same CRON_SECRET protection.
   * Header: x-cron-secret: <your CRON_SECRET env var>
   */
  @Post("run-auto-renewals")
  async runAutoRenewals(@Headers("x-cron-secret") secret: string) {
    this.verifyCronSecret(secret);
    const result = await this.scheduler.runAutoRenewals();
    return { success: true, message: "Auto-renewal job executed.", ...result };
  }

  /**
   * Combined endpoint — runs auto-renewals first (so overdue subs get
   * rolled forward), then sends reminders for the new billing cycle.
   * Best used as the single cron-job.org target URL.
   * Header: x-cron-secret: <your CRON_SECRET env var>
   */
  @Post("run-all")
  async runAll(@Headers("x-cron-secret") secret: string) {
    this.verifyCronSecret(secret);
    const renewals = await this.scheduler.runAutoRenewals();
    const reminders = await this.scheduler.runRenewalReminders();
    return {
      success: true,
      message: "All scheduler jobs executed.",
      renewals,
      reminders,
    };
  }

  /**
   * Lightweight keepalive endpoint for weekly DB wake-ups.
   * Can be called by an external cron provider with GET or POST.
   * Header: x-cron-secret: <your CRON_SECRET env var>
   * or query: ?secret=<your CRON_SECRET>
   */
  @Get("keepalive")
  async keepAliveGet(
    @Query("secret") querySecret: string,
    @Headers("x-cron-secret") headerSecret: string,
  ) {
    return this.runKeepalive(querySecret || headerSecret);
  }

  @Post("keepalive")
  async keepAlivePost(
    @Query("secret") querySecret: string,
    @Headers("x-cron-secret") headerSecret: string,
  ) {
    return this.runKeepalive(querySecret || headerSecret);
  }

  private async runKeepalive(secret: string) {
    this.verifyCronSecret(secret);
    const result = await this.scheduler.runDatabaseKeepalive();
    return {
      success: true,
      message: "Database keepalive job executed.",
      ...result,
    };
  }

  /** Shared secret validation */
  private verifyCronSecret(secret: string) {
    const expected = this.config.get<string>("CRON_SECRET");
    if (!expected || secret !== expected) {
      throw new UnauthorizedException("Invalid cron secret");
    }
  }
}
