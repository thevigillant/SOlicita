import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const ordem = await prisma.ordemFornecimento.findUnique({
            where: { id },
            include: { licitacao: true, pedidos: true, contasReceber: true },
        });
        if (!ordem) return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
        return NextResponse.json(ordem);
    } catch {
        return NextResponse.json({ error: "Erro ao buscar ordem" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        if (body.dataEmissao) body.dataEmissao = new Date(body.dataEmissao);
        const ordem = await prisma.ordemFornecimento.update({ where: { id }, data: body });
        return NextResponse.json(ordem);
    } catch {
        return NextResponse.json({ error: "Erro ao atualizar ordem" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.ordemFornecimento.delete({ where: { id } });
        return NextResponse.json({ message: "Ordem removida com sucesso" });
    } catch {
        return NextResponse.json({ error: "Erro ao deletar ordem" }, { status: 500 });
    }
}
