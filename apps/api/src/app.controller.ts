import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('ping')
  ping() {
    return {
      status: 'ok',
      service: 'subtrack-api',
      timestamp: new Date().toISOString(),
    };
  }
}
