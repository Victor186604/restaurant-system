import { Controller, Get } from '@nestjs/common';
import { AppService, type StatusApi } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** GET /api — verificação rápida de que a API está no ar. */
  @Public()
  @Get()
  getStatus(): StatusApi {
    return this.appService.getStatus();
  }
}
