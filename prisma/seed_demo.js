const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando seed de demonstração...");

    // 1. Órgãos / CNPJs
    const cnpj1 = await prisma.cnpj.upsert({
        where: { cnpj: "12345678000199" },
        update: {},
        create: {
            cnpj: "12345678000199",
            razaoSocial: "Prefeitura de São Paulo",
            nomeFantasia: "PMSP",
            endereco: "Viaduto do Chá, 15 - Centro",
            email: "contato@prefeitura.sp.gov.br",
        }
    });

    // 2. Licitações
    const l1 = await prisma.licitacao.create({
        data: {
            numeroProcesso: "001/2024",
            orgaoNome: "Prefeitura de São Paulo",
            orgaoId: cnpj1.id,
            modalidade: "Pregão Eletrônico",
            dataAbertura: new Date("2024-03-20"),
            valorTotalEstimado: 150000.00,
            status: "EM_ANDAMENTO",
            itens: {
                create: [
                    { descricao: "Mesa de Escritório", quantidade: 10, valorUnitario: 800, ganhou: true },
                    { descricao: "Cadeira Ergonômica", quantidade: 20, valorUnitario: 450, ganhou: true },
                    { descricao: "Computador i7 16GB", quantidade: 5, valorUnitario: 4500, ganhou: false },
                ]
            }
        }
    });

    const l2 = await prisma.licitacao.create({
        data: {
            numeroProcesso: "045/2023",
            orgaoNome: "Câmara Municipal",
            orgaoId: cnpj1.id, // Reuse SP for simple seed
            modalidade: "Concorrência",
            dataAbertura: new Date("2023-11-15"),
            valorTotalEstimado: 50000.00,
            status: "CONCLUIDA",
            itens: {
                create: [
                    { descricao: "Ar Condicionado 12k", quantidade: 2, valorUnitario: 2500, ganhou: true },
                ]
            }
        }
    });

    // 3. Ordens de Fornecimento
    const of1 = await prisma.ordemFornecimento.create({
        data: {
            numeroOF: "OF-2024/001",
            dataEmissao: new Date(),
            valorTotal: 17000.00, // Mesas + Cadeiras
            status: "PENDENTE",
            licitacaoId: l1.id,
        }
    });

    // 4. Pedidos
    await prisma.pedido.create({
        data: {
            ordemId: of1.id,
            status: "PREPARANDO",
            transportadora: "Transporte Express",
        }
    });

    // 5. Financeiro
    await prisma.contasReceber.create({
        data: {
            ordemId: of1.id,
            valor: 17000.00,
            dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            pago: false,
        }
    });

    console.log("Seed finalizado com sucesso!");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
