import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { ComandasController } from './comandas.controller.js';
import { ComandasService } from './comandas.service.js';

@Module({
  imports: [UsuariosModule],
  controllers: [ComandasController],
  providers: [ComandasService],
  exports: [ComandasService],
})
export class ComandasModule {}
