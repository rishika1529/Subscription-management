import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionFiltersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query() filters: SubscriptionFiltersDto) {
    return this.subscriptionsService.findAll(user.userId, filters);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(user.userId, dto);
  }

  @Get('upcoming')
  async getUpcoming(@CurrentUser() user: any, @Query('days') days?: number) {
    return this.subscriptionsService.getUpcomingRenewals(user.userId, days);
  }

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: any) {
    return this.subscriptionsService.getDashboardStats(user.userId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subscriptionsService.findOne(user.userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subscriptionsService.delete(user.userId, id);
  }

  @Patch(':id/toggle-auto-renew')
  async toggleAutoRenew(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subscriptionsService.toggleAutoRenew(user.userId, id);
  }

  @Post(':id/usage')
  async addUsage(
    @CurrentUser() user: any,
    @Param('id') subscriptionId: string,
    @Body() usage: { hoursUsed?: number; sessionsCount?: number; featuresUsed?: string[] },
  ) {
    return this.subscriptionsService.addUsageLog(user.userId, subscriptionId, usage);
  }
}
