import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        if (body.dataVencimento) body.dataVencimento = new Date(body.dataVencimento);
        if (body.dataPagamento) body.dataPagamento = new Date(body.dataPagamento);
        const conta = await prisma.contasPagar.update({ where: { id }, data: body });
        return NextResponse.json(conta);
    } catch {
        return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.contasPagar.delete({ where: { id } });
        return NextResponse.json({ message: "Conta removida com sucesso" });
    } catch {
        return NextResponse.json({ error: "Erro ao deletar conta" }, { status: 500 });
    }
}
