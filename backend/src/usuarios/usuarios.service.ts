import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PerfilUsuario, Prisma } from '../generated/prisma/client.js';
import { gerarHashSenha } from '../common/utils/password.util.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { ListarUsuariosQuery } from './dto/listar-usuarios.query.js';

/** Campos públicos: o hash da senha nunca sai da API. */
export const usuarioPublicoSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
} satisfies Prisma.UsuarioSelect;

/** Resumo usado quando o usuário aparece dentro de outros recursos. */
export const usuarioResumoSelect = {
  id: true,
  nome: true,
  perfil: true,
} satisfies Prisma.UsuarioSelect;

type ClienteDb = PrismaService | Prisma.TransactionClient;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(query: ListarUsuariosQuery) {
    return this.prisma.usuario.findMany({
      where: {
        perfil: query.perfil,
        ativo: query.incluirInativos ? undefined : true,
      },
      select: usuarioPublicoSelect,
      orderBy: { nome: 'asc' },
    });
  }

  async buscar(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: usuarioPublicoSelect,
    });
    if (!usuario) throw new NotFoundException(`Usuário ${id} não encontrado.`);
    return usuario;
  }

  async criar(dto: CreateUsuarioDto) {
    const { senha, ...dados } = dto;
    return this.prisma.usuario.create({
      data: { ...dados, senhaHash: await gerarHashSenha(senha) },
      select: usuarioPublicoSelect,
    });
  }

  async atualizar(id: number, dto: UpdateUsuarioDto) {
    await this.buscar(id);
    const { senha, ...dados } = dto;
    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...dados,
        ...(senha ? { senhaHash: await gerarHashSenha(senha) } : {}),
      },
      select: usuarioPublicoSelect,
    });
  }

  /**
   * Garante que o usuário informado existe, está ativo e tem um dos perfis
   * permitidos. Usado enquanto o usuário ainda vem no corpo da requisição;
   * com JWT, o mesmo método validará o usuário extraído do token.
   */
  async validarResponsavel(
    id: number,
    perfisPermitidos: PerfilUsuario[],
    db: ClienteDb = this.prisma,
  ) {
    const usuario = await db.usuario.findUnique({
      where: { id },
      select: { ...usuarioResumoSelect, ativo: true },
    });
    if (!usuario) throw new NotFoundException(`Usuário ${id} não encontrado.`);
    if (!usuario.ativo) {
      throw new UnprocessableEntityException(`Usuário ${id} está inativo.`);
    }
    if (!perfisPermitidos.includes(usuario.perfil)) {
      throw new UnprocessableEntityException(
        `Usuário ${id} tem perfil ${usuario.perfil}; perfis permitidos: ${perfisPermitidos.join(', ')}.`,
      );
    }
    return { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
  }
}
