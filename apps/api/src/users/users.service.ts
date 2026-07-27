import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdateProfileDto, UpdatePreferencesDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        emailVerified: true,
        currency: true,
        timezone: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: id,
        action: "updated_profile",
        entity: "user",
        entityId: id,
      },
    });

    return user;
  }

  async updatePreferences(id: string, dto: UpdatePreferencesDto) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        currency: true,
        timezone: true,
        theme: true,
        updatedAt: true,
      },
    });
  }

  async deleteAccount(id: string) {
    await this.findById(id);

    await this.prisma.user.delete({ where: { id } });

    return { message: "Account deleted successfully" };
  }

  async getActivityLog(id: string) {
    await this.findById(id);

    return this.prisma.activityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
