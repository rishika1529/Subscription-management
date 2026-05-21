import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getHistory(user.userId, limit);
  }

  @Get(':id')
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.paymentsService.getById(user.userId, id);
  }
}
