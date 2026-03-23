-- AlterTable
ALTER TABLE "Cnpj" ADD COLUMN "inscricaoEstadual" TEXT;

-- AlterTable
ALTER TABLE "Licitacao" ADD COLUMN "prazoEntregaDias" INTEGER;

-- AlterTable
ALTER TABLE "OrdemFornecimento" ADD COLUMN "dataAteste" DATETIME;
ALTER TABLE "OrdemFornecimento" ADD COLUMN "numeroNF" TEXT;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN "dataLimiteEntrega" DATETIME;

-- CreateTable
CREATE TABLE "Ata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licitacaoId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "dataAssinatura" DATETIME,
    "dataVigencia" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ata_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "Licitacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemOrdemFornecimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordemId" TEXT NOT NULL,
    "itemLicitacaoId" TEXT NOT NULL,
    "quantidadePedida" INTEGER NOT NULL,
    "valorUnitarioCobrado" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemOrdemFornecimento_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemFornecimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemOrdemFornecimento_itemLicitacaoId_fkey" FOREIGN KEY ("itemLicitacaoId") REFERENCES "ItemLicitacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrdemCompra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordemFornecimentoId" TEXT,
    "fornecedor" TEXT NOT NULL,
    "valorTotalCompra" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrdemCompra_ordemFornecimentoId_fkey" FOREIGN KEY ("ordemFornecimentoId") REFERENCES "OrdemFornecimento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContasPagar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "ordemCompraId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContasPagar_ordemCompraId_fkey" FOREIGN KEY ("ordemCompraId") REFERENCES "OrdemCompra" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContasPagar" ("createdAt", "dataPagamento", "dataVencimento", "descricao", "fornecedor", "id", "pago", "updatedAt", "valor") SELECT "createdAt", "dataPagamento", "dataVencimento", "descricao", "fornecedor", "id", "pago", "updatedAt", "valor" FROM "ContasPagar";
DROP TABLE "ContasPagar";
ALTER TABLE "new_ContasPagar" RENAME TO "ContasPagar";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Ata_licitacaoId_key" ON "Ata"("licitacaoId");
