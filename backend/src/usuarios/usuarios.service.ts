import { Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { QueryUsuariosDto } from './dto/query-usuarios.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

const SALT_ROUNDS = 10;

/** Campos públicos do usuário — o hash da senha nunca é retornado pela API. */
const usuarioPublico = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryUsuariosDto) {
    return this.prisma.usuario.findMany({
      where: { perfil: query.perfil },
      select: usuarioPublico,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: usuarioPublico,
    });
    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }
    return usuario;
  }

  async create(dto: CreateUsuarioDto) {
    const { senha, ...dados } = dto;
    return this.prisma.usuario.create({
      data: {
        ...dados,
        email: dados.email.toLowerCase(),
        senhaHash: await bcrypt.hash(senha, SALT_ROUNDS),
      },
      select: usuarioPublico,
    });
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    await this.findOne(id);
    const { senha, ...dados } = dto;
    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...dados,
        email: dados.email?.toLowerCase(),
        senhaHash: senha ? await bcrypt.hash(senha, SALT_ROUNDS) : undefined,
      },
      select: usuarioPublico,
    });
  }
}
