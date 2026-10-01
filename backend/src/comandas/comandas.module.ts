import { Module } from '@nestjs/common';
import { ComandasController } from './comandas.controller.js';
import { ComandasService } from './comandas.service.js';

@Module({
  controllers: [ComandasController],
  providers: [ComandasService],
})
export class ComandasModule {}
