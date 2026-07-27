import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getHistory(userId: string, limit: number = 50) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        subscription: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getById(userId: string, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        subscription: {
          select: { id: true, name: true, logo: true, billingCycle: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    if (payment.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return payment;
  }
}
