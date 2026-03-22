import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const licitacao = await prisma.licitacao.findUnique({
            where: { id },
            include: {
                itens: true,
                ordens: { include: { pedidos: true, contasReceber: true } },
            },
        });
        if (!licitacao) return NextResponse.json({ error: "Licitação não encontrada" }, { status: 404 });
        return NextResponse.json(licitacao);
    } catch {
        return NextResponse.json({ error: "Erro ao buscar licitação" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { itens, ...data } = body;
        
        if (data.dataAbertura) data.dataAbertura = new Date(data.dataAbertura);

        // Update items if provided
        if (itens && Array.isArray(itens)) {
            for (const item of itens) {
                if (item.id) {
                    await prisma.itemLicitacao.update({
                        where: { id: item.id },
                        data: { ganhou: !!item.ganhou }
                    });
                } else {
                    // Create new item
                    await prisma.itemLicitacao.create({
                        data: {
                            ...item,
                            licitacaoId: id,
                            ganhou: !!item.ganhou
                        }
                    });
                }
            }
        }


        const licitacao = await prisma.licitacao.update({ 
            where: { id }, 
            data, 
            include: { 
                itens: true,
                ordens: { include: { pedidos: true, contasReceber: true } }
            } 
        });
        return NextResponse.json(licitacao);
    } catch (error) {
        console.error("API LICITACAO PUT Error:", error);
        return NextResponse.json({ error: "Erro ao atualizar licitação" }, { status: 500 });
    }
}


export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.licitacao.delete({ where: { id } });
        return NextResponse.json({ message: "Licitação removida com sucesso" });
    } catch {
        return NextResponse.json({ error: "Erro ao deletar licitação" }, { status: 500 });
    }
}
