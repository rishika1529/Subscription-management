import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [activeSubscriptions, totalPayments, upcomingRenewals] =
      await Promise.all([
        this.prisma.subscription.findMany({
          where: { userId, status: "ACTIVE" },
          include: { category: true },
        }),
        this.prisma.payment.aggregate({
          where: { userId, status: "success" },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.subscription.count({
          where: {
            userId,
            status: "ACTIVE",
            nextBillingDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    const monthlyTotal = activeSubscriptions.reduce((sum, s) => {
      return sum + this.convertToMonthly(s.amount, s.billingCycle);
    }, 0);

    return {
      activeCount: activeSubscriptions.length,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
      totalPaid: totalPayments._sum.amount || 0,
      paymentCount: totalPayments._count,
      upcomingRenewals,
    };
  }

  async getCategoryBreakdown(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, status: "ACTIVE" },
      include: { category: true },
    });

    const breakdown: Record<
      string,
      { total: number; count: number; subscriptions: any[] }
    > = {};

    for (const sub of subscriptions) {
      const categoryName = sub.category?.name || "Uncategorized";
      const monthly = this.convertToMonthly(sub.amount, sub.billingCycle);

      if (!breakdown[categoryName]) {
        breakdown[categoryName] = { total: 0, count: 0, subscriptions: [] };
      }

      breakdown[categoryName].total += monthly;
      breakdown[categoryName].count += 1;
      breakdown[categoryName].subscriptions.push({
        id: sub.id,
        name: sub.name,
        amount: sub.amount,
        billingCycle: sub.billingCycle,
      });
    }

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      ...data,
    }));
  }

  async getSpendingTrend(userId: string, months: number = 6) {
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);

      const payments = await this.prisma.payment.aggregate({
        where: {
          userId,
          status: "success",
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      });

      results.push({
        year,
        month: month + 1,
        label: date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        total: payments._sum.amount || 0,
        transactionCount: payments._count,
      });
    }

    return results;
  }

  private convertToMonthly(amount: number, billingCycle: string): number {
    switch (billingCycle) {
      case "YEARLY":
        return amount / 12;
      case "QUARTERLY":
        return amount / 3;
      case "WEEKLY":
        return (amount * 52) / 12;
      case "MONTHLY":
      default:
        return amount;
    }
  }
}
