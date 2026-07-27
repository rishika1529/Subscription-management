import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

/**
 * Lightweight liveness endpoint for keep-alive pings (cron-job.org, UptimeRobot, etc.)
 * No auth, no DB, no I/O — just confirms the dyno is awake.
 * Path: GET /api/v1/health
 */
@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  ping() {
    return { ok: true, ts: Date.now() };
  }
}
