import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  async chat(
    @CurrentUser() user: any,
    @Body('message') message: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await this.aiService.chat(user.userId, message);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }

  @Get('suggestions')
  async getSuggestions(@CurrentUser() user: any) {
    return this.aiService.getSuggestedPrompts(user.userId);
  }

  @Get('savings')
  async getSavings(@CurrentUser() user: any) {
    return this.aiService.getSavingsRecommendations(user.userId);
  }

  @Get('report')
  async getReport(@CurrentUser() user: any) {
    const report = await this.aiService.generateMonthlyReport(user.userId);
    return { report };
  }
}
