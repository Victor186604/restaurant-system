import { Controller, Get } from '@nestjs/common';
import { AppService, type StatusApi } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** GET /api — verificação rápida de que a API está no ar. */
  @Get()
  getStatus(): StatusApi {
    return this.appService.getStatus();
  }
}
