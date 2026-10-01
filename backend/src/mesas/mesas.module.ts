import { Module } from '@nestjs/common';
import { MesasController } from './mesas.controller.js';
import { MesasService } from './mesas.service.js';

@Module({
  controllers: [MesasController],
  providers: [MesasService],
})
export class MesasModule {}
