import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AIService } from '../ai/ai.service';
import { EmailService } from '../email/email.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto, SubscriptionFiltersDto } from './dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private aiService: AIService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    // Check for duplicates
    const existing = await this.prisma.subscription.findFirst({
      where: {
        userId,
        name: { equals: dto.name, mode: 'insensitive' },
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'You already have an active subscription with this name. Consider updating it instead.',
      );
    }

    // Use provided nextBillingDate or calculate from startDate + billingCycle
    const nextBillingDate = dto.nextBillingDate
      ? new Date(dto.nextBillingDate)
      : this.calculateNextBillingDate(new Date(dto.startDate), dto.billingCycle);

    // Strip nextBillingDate from dto so it doesn't conflict with our computed value
    const { nextBillingDate: _nbd, ...dtoRest } = dto as any;

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        ...dtoRest,
        nextBillingDate,
      },
      include: {
        category: true,
      },
    });

    // Create initial reminders
    await this.createReminders(subscription);

    // Calculate AI insights asynchronously
    this.calculateAIInsights(subscription.id).catch(console.error);

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'created_subscription',
        entity: 'subscription',
        entityId: subscription.id,
        metadata: { subscriptionName: dto.name },
      },
    });

    // Send real-time WebSocket notification
    this.notificationsGateway.sendToUser(userId, 'subscription:created', { subscription });

    // Email: subscription added confirmation + renewal alert if within 7 days
    // Skipped if caller explicitly set emailReminders: false
    const emailReminders = dto.emailReminders !== false;
    if (emailReminders) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
      if (user?.email) {
        this.emailService.sendSubscriptionAddedEmail(user.email, subscription).catch(() => {});

        // If renewal falls within 7 days, send immediate reminder
        if (subscription.nextBillingDate) {
          const daysUntilRenewal = Math.ceil(
            (new Date(subscription.nextBillingDate).getTime() - Date.now()) / 86400000,
          );
          if (daysUntilRenewal >= 0 && daysUntilRenewal <= 7) {
            this.emailService.sendRenewalReminder(user.email, subscription, daysUntilRenewal).catch(() => {});
          }
        }
      }
    }

    return subscription;
  }

  async findAll(userId: string, filters?: SubscriptionFiltersDto) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          category: true,
          usageLogs: {
            take: 5,
            orderBy: { date: 'desc' },
          },
        },
        orderBy: filters?.sortBy
          ? { [filters.sortBy]: filters.sortOrder || 'desc' }
          : { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    // Calculate total spending
    const monthlyTotal = subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + this.convertToMonthly(s.amount, s.billingCycle), 0);

    return {
      subscriptions,
      total,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
    };
  }

  async findOne(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        category: true,
        usageLogs: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        renewalHistory: {
          orderBy: { renewedAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return subscription;
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto & { emailReminders?: boolean }) {
    const subscription = await this.findOne(userId, id);

    // Recalculate next billing date if billing cycle changed
    let nextBillingDate = subscription.nextBillingDate;
    if (dto.billingCycle && dto.billingCycle !== subscription.billingCycle) {
      nextBillingDate = this.calculateNextBillingDate(
        subscription.startDate,
        dto.billingCycle,
      );
    }

    // Strip emailReminders — not a DB column
    const { emailReminders, ...updateData } = dto as any;

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...updateData,
        nextBillingDate,
      },
      include: {
        category: true,
      },
    });

    // Recalculate AI insights if amount or cycle changed
    if (dto.amount || dto.billingCycle) {
      this.calculateAIInsights(id).catch(console.error);
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'updated_subscription',
        entity: 'subscription',
        entityId: id,
        metadata: { changes: updateData },
      },
    });

    // Real-time WebSocket push notification
    this.notificationsGateway.sendToUser(userId, 'subscription:updated', {
      subscription: updated,
    });

    // Email confirmation (only when caller opts in)
    if (emailReminders !== false) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });
      if (user?.email) {
        this.emailService.sendSubscriptionUpdatedEmail(user.email, updated).catch(() => {});
      }
    }

    return updated;
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.subscription.delete({
      where: { id },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'deleted_subscription',
        entity: 'subscription',
        entityId: id,
      },
    });

    // Real-time notification
    this.notificationsGateway.sendToUser(userId, 'subscription:deleted', {
      subscriptionId: id,
    });

    return { message: 'Subscription deleted successfully' };
  }

  async toggleAutoRenew(userId: string, id: string) {
    const subscription = await this.findOne(userId, id);

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        autoRenew: !subscription.autoRenew,
      },
    });

    // Real-time update
    this.notificationsGateway.sendToUser(userId, 'subscription:updated', {
      subscription: updated,
    });

    return updated;
  }

  async addUsageLog(userId: string, subscriptionId: string, usage: {
    hoursUsed?: number;
    sessionsCount?: number;
    featuresUsed?: string[];
  }) {
    await this.findOne(userId, subscriptionId);

    const usageLog = await this.prisma.usageLog.create({
      data: {
        userId,
        subscriptionId,
        ...usage,
      },
    });

    // Recalculate cost per use
    await this.updateCostMetrics(subscriptionId);

    return usageLog;
  }

  async getUpcomingRenewals(userId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        nextBillingDate: {
          lte: futureDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        nextBillingDate: 'asc',
      },
    });
  }

  async getDashboardStats(userId: string) {
    const [subscriptions, thisMonthPayments, lastMonthPayments] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { category: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          userId,
          status: 'success',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          userId,
          status: 'success',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    // Calculate monthly total
    const monthlyTotal = subscriptions.reduce(
      (sum, s) => sum + this.convertToMonthly(s.amount, s.billingCycle),
      0,
    );

    // Category breakdown
    const categoryBreakdown = subscriptions.reduce((acc, sub) => {
      const category = sub.category?.name || 'Uncategorized';
      const monthly = this.convertToMonthly(sub.amount, sub.billingCycle);
      acc[category] = (acc[category] || 0) + monthly;
      return acc;
    }, {} as Record<string, number>);

    // Most expensive
    const topExpensive = subscriptions
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        currency: s.currency,
        billingCycle: s.billingCycle,
      }));

    // Health score (based on usage, value, etc.)
    const avgHealthScore =
      subscriptions.reduce((sum, s) => sum + (s.healthScore || 50), 0) /
      (subscriptions.length || 1);

    return {
      totalMonthly: monthlyTotal,
      totalYearly: monthlyTotal * 12,
      activeCount: subscriptions.length,
      thisMonthSpent: thisMonthPayments._sum.amount || 0,
      lastMonthSpent: lastMonthPayments._sum.amount || 0,
      categoryBreakdown,
      topExpensive,
      avgHealthScore,
      upcomingRenewals: await this.getUpcomingRenewals(userId, 7),
    };
  }

  // Private helper methods

  private calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
    const date = new Date(startDate);

    switch (billingCycle) {
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'YEARLY':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'WEEKLY':
        date.setDate(date.getDate() + 7);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date;
  }

  private convertToMonthly(amount: number, billingCycle: string): number {
    switch (billingCycle) {
      case 'YEARLY':
        return amount / 12;
      case 'QUARTERLY':
        return amount / 3;
      case 'WEEKLY':
        return (amount * 52) / 12;
      case 'MONTHLY':
      default:
        return amount;
    }
  }

  private async createReminders(subscription: any) {
    const reminderDays = [14, 7, 1];

    for (const days of reminderDays) {
      const scheduledFor = new Date(subscription.nextBillingDate);
      scheduledFor.setDate(scheduledFor.getDate() - days);

      if (scheduledFor > new Date()) {
        await this.prisma.reminder.create({
          data: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            type: `${days}_days`,
            scheduledFor,
          },
        });
      }
    }
  }

  private async calculateAIInsights(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        usageLogs: {
          take: 30,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!subscription) return;

    // Calculate value score using AI
    const valueScore = await this.aiService.calculateSubscriptionValue(subscription);

    // Calculate health score
    const healthScore = this.calculateHealthScore(subscription);

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        valueScore,
        healthScore,
      },
    });
  }

  private calculateHealthScore(subscription: any): number {
    let score = 100;

    // Deduct if expensive
    if (subscription.amount > 50) score -= 10;
    if (subscription.amount > 100) score -= 10;

    // Deduct if low usage
    const recentUsage = subscription.usageLogs?.length || 0;
    if (recentUsage < 5) score -= 20;
    if (recentUsage === 0) score -= 30;

    // Deduct if no auto-renew (might be planning to cancel)
    if (!subscription.autoRenew) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private async updateCostMetrics(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        usageLogs: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
      },
    });

    if (!subscription) return;

    const totalSessions = subscription.usageLogs.reduce(
      (sum, log) => sum + (log.sessionsCount || 0),
      0,
    );

    const monthlyAmount = this.convertToMonthly(
      subscription.amount,
      subscription.billingCycle,
    );

    const costPerUse = totalSessions > 0 ? monthlyAmount / totalSessions : null;

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { costPerUse },
    });
  }
}
