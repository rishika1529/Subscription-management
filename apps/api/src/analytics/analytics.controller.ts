import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  async getOverview(@CurrentUser() user: any) {
    return this.analyticsService.getOverview(user.userId);
  }

  @Get("categories")
  async getCategoryBreakdown(@CurrentUser() user: any) {
    return this.analyticsService.getCategoryBreakdown(user.userId);
  }

  @Get("trend")
  async getSpendingTrend(
    @CurrentUser() user: any,
    @Query("months") months?: number,
  ) {
    return this.analyticsService.getSpendingTrend(user.userId, months);
  }
}
