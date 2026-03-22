import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const ordens = await prisma.ordemCompra.findMany({
            include: {
                ordemFornecimento: {
                    include: {
                        licitacao: true
                    }
                },
                contasPagar: true
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(ordens);
    } catch (e) {
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const ordem = await prisma.ordemCompra.create({
            data: {
                fornecedor: data.fornecedor,
                valorTotalCompra: Number(data.valorTotalCompra),
                status: "SOLICITADA",
                ordemFornecimentoId: data.ordemFornecimentoId || null,
            }
        });

        // Creates a Payable Account automatically
        await prisma.contasPagar.create({
            data: {
                descricao: `Compra Fornecedor - ${data.fornecedor}`,
                fornecedor: data.fornecedor,
                valor: Number(data.valorTotalCompra),
                dataVencimento: new Date(new Date().setDate(new Date().getDate() + 15)), // +15 days
                ordemCompraId: ordem.id
            }
        });

        return NextResponse.json(ordem);
    } catch (e) {
        return NextResponse.json({ error: "Erro ao criar ordem de compra" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();
        const ordem = await prisma.ordemCompra.update({
            where: { id: data.id },
            data: { status: data.status }
        });
        return NextResponse.json(ordem);
    } catch(e) {
        return NextResponse.json({ error: "Erro" }, { status: 500 });
    }
}
