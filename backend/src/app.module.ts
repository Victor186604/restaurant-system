import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { ComandasModule } from './comandas/comandas.module.js';
import { DecimalInterceptor } from './common/interceptors/decimal.interceptor.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { MesasModule } from './mesas/mesas.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProdutosModule } from './produtos/produtos.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsuariosModule,
    MesasModule,
    CategoriasModule,
    ProdutosModule,
    ComandasModule,
    PedidosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: DecimalInterceptor },
  ],
})
export class AppModule {}
