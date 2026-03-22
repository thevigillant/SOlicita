-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cnpj" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Licitacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroProcesso" TEXT NOT NULL,
    "orgaoId" TEXT NOT NULL,
    "orgaoNome" TEXT,
    "modalidade" TEXT NOT NULL,
    "dataAbertura" DATETIME NOT NULL,
    "valorTotalEstimado" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ItemLicitacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licitacaoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" REAL NOT NULL,
    "ganhou" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemLicitacao_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "Licitacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrdemFornecimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licitacaoId" TEXT NOT NULL,
    "numeroOF" TEXT NOT NULL,
    "dataEmissao" DATETIME NOT NULL,
    "valorTotal" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrdemFornecimento_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "Licitacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordemId" TEXT NOT NULL,
    "dataEnvio" DATETIME,
    "codigoRastreio" TEXT,
    "transportadora" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREPARANDO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemFornecimento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContasReceber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordemId" TEXT,
    "valor" REAL NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContasReceber_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemFornecimento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContasPagar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cnpj_cnpj_key" ON "Cnpj"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Licitacao_numeroProcesso_key" ON "Licitacao"("numeroProcesso");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemFornecimento_numeroOF_key" ON "OrdemFornecimento"("numeroOF");
