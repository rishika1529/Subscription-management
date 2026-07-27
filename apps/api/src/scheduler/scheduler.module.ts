import { Module } from "@nestjs/common";
import { SchedulerService } from "./scheduler.service";
import { SchedulerController } from "./scheduler.controller";
import { DatabaseModule } from "../database/database.module";
import { EmailModule } from "../email/email.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [DatabaseModule, EmailModule, ConfigModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
