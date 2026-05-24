import {
  Controller, Get, Post, Delete, Query, Body, Req, Res,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { GmailService } from './gmail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('gmail')
@Controller('gmail')
export class GmailController {
  constructor(
    private readonly gmail: GmailService,
    private readonly config: ConfigService,
  ) {}

  /** Returns the Google OAuth URL the frontend should redirect the user to. */
  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getAuthUrl(@CurrentUser() user: any) {
    const url = this.gmail.getAuthUrl(user.userId);
    return { url };
  }

  /** Google redirects here after consent. Stores tokens and redirects to frontend. */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    if (error) {
      return res.redirect(`${frontendUrl}/dashboard?gmailError=${encodeURIComponent(error)}`);
    }
    if (!code || !userId) {
      return res.redirect(`${frontendUrl}/dashboard?gmailError=missing_params`);
    }

    try {
      await this.gmail.handleCallback(code, userId);
      return res.redirect(`${frontendUrl}/dashboard?gmailConnected=1`);
    } catch (err: any) {
      return res.redirect(`${frontendUrl}/dashboard?gmailError=${encodeURIComponent(err.message)}`);
    }
  }

  /** Check if the current user has Gmail connected. */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getStatus(@CurrentUser() user: any) {
    return this.gmail.getStatus(user.userId);
  }

  /** Scan Gmail for subscriptions and return detected list. */
  @Post('scan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async scan(@CurrentUser() user: any) {
    const detected = await this.gmail.scanGmail(user.userId);
    return { detected, count: detected.length };
  }

  /** Search Gmail for a specific service name and extract subscription details. */
  @Post('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async search(@CurrentUser() user: any, @Body('query') query: string) {
    if (!query?.trim()) throw new BadRequestException('query is required');
    const detected = await this.gmail.searchGmail(user.userId, query.trim());
    return { detected, count: detected.length };
  }

  /** Upload a CSV or bank statement and extract subscriptions. */
  @Post('import-csv')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importCsv(
    @CurrentUser() user: any,
    @UploadedFile() file: any,
    @Body('text') text?: string,
  ) {
    const content = file
      ? file.buffer.toString('utf-8')
      : text || '';

    if (!content.trim()) throw new BadRequestException('No content provided.');

    const detected = await this.gmail.parseCSV(user.userId, content);
    return { detected, count: detected.length };
  }

  /** Disconnect one Gmail account (by connectionId) or all if no id given. */
  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async disconnect(@CurrentUser() user: any, @Query('id') id?: string) {
    await this.gmail.disconnect(user.userId, id);
    return { success: true };
  }
}
