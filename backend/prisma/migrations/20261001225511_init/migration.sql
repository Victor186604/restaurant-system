-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('GARCOM', 'COZINHA', 'GERENTE');

-- CreateEnum
CREATE TYPE "StatusMesa" AS ENUM ('LIVRE', 'OCUPADA');

-- CreateEnum
CREATE TYPE "StatusComanda" AS ENUM ('ABERTA', 'FECHAMENTO_SOLICITADO', 'FECHADA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 4,
    "status" "StatusMesa" NOT NULL DEFAULT 'LIVRE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" VARCHAR(500),
    "preco" DECIMAL(10,2) NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "categoria_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comandas" (
    "id" SERIAL NOT NULL,
    "mesa_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "nome_cliente" VARCHAR(120),
    "status" "StatusComanda" NOT NULL DEFAULT 'ABERTA',
    "total" DECIMAL(10,2),
    "aberta_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechamento_solicitado_em" TIMESTAMP(3),
    "fechada_em" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "comanda_id" INTEGER NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'PENDENTE',
    "observacao" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "observacao" VARCHAR(255),

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_numero_key" ON "mesas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE INDEX "produtos_categoria_id_idx" ON "produtos"("categoria_id");

-- CreateIndex
CREATE INDEX "comandas_mesa_id_idx" ON "comandas"("mesa_id");

-- CreateIndex
CREATE INDEX "comandas_status_idx" ON "comandas"("status");

-- CreateIndex
CREATE INDEX "pedidos_comanda_id_idx" ON "pedidos"("comanda_id");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "itens_pedido_produto_id_idx" ON "itens_pedido"("produto_id");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
