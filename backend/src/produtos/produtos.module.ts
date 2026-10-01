import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller.js';
import { ProdutosService } from './produtos.service.js';

@Module({
  controllers: [ProdutosController],
  providers: [ProdutosService],
})
export class ProdutosModule {}
