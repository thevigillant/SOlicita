import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [
            totalLicitacoes,
            licitacoesGanhas,
            totalOrdens,
            totalPedidos,
            receitaMes,
            despesaMes,
            contasReceberPendentes,
            contasPagarPendentes,
            receitaTotal,
            despesaTotal,
            licitacoesPorStatus,
        ] = await Promise.all([
            prisma.licitacao.count(),
            prisma.licitacao.count({ where: { status: "CONCLUIDA" } }),
            prisma.ordemFornecimento.count(),
            prisma.pedido.count(),
            prisma.contasReceber.aggregate({
                where: { pago: true, dataPagamento: { gte: startOfMonth } },
                _sum: { valor: true },
            }),
            prisma.contasPagar.aggregate({
                where: { pago: true, dataPagamento: { gte: startOfMonth } },
                _sum: { valor: true },
            }),
            prisma.contasReceber.aggregate({
                where: { pago: false },
                _sum: { valor: true },
            }),
            prisma.contasPagar.aggregate({
                where: { pago: false },
                _sum: { valor: true },
            }),
            prisma.contasReceber.aggregate({ where: { pago: true }, _sum: { valor: true } }),
            prisma.contasPagar.aggregate({ where: { pago: true }, _sum: { valor: true } }),
            prisma.licitacao.groupBy({ by: ["status"], _count: { status: true } }),
        ]);

        // Monthly revenue chart data (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const label = start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
            const [rec, desp] = await Promise.all([
                prisma.contasReceber.aggregate({
                    where: { pago: true, dataPagamento: { gte: start, lte: end } },
                    _sum: { valor: true },
                }),
                prisma.contasPagar.aggregate({
                    where: { pago: true, dataPagamento: { gte: start, lte: end } },
                    _sum: { valor: true },
                }),
            ]);
            monthlyData.push({ label, receitas: rec._sum.valor || 0, despesas: desp._sum.valor || 0 });
        }

        return NextResponse.json({
            totalLicitacoes,
            licitacoesGanhas,
            totalOrdens,
            totalPedidos,
            receitaMes: receitaMes._sum.valor || 0,
            despesaMes: despesaMes._sum.valor || 0,
            contasReceberPendentes: contasReceberPendentes._sum.valor || 0,
            contasPagarPendentes: contasPagarPendentes._sum.valor || 0,
            receitaTotal: receitaTotal._sum.valor || 0,
            despesaTotal: despesaTotal._sum.valor || 0,
            licitacoesPorStatus,
            monthlyData,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro ao buscar dados do dashboard" }, { status: 500 });
    }
}
