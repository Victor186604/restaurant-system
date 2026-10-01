import { Injectable } from '@nestjs/common';

export interface StatusApi {
  nome: string;
  status: 'ok';
  timestamp: string;
}

@Injectable()
export class AppService {
  getStatus(): StatusApi {
    return {
      nome: 'API Restaurante — comandas e pedidos',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
