import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const pedido = await prisma.pedido.findUnique({ where: { id }, include: { ordem: { include: { licitacao: true } } } });
        if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
        return NextResponse.json(pedido);
    } catch {
        return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        if (body.dataEnvio) body.dataEnvio = new Date(body.dataEnvio);
        const pedido = await prisma.pedido.update({ where: { id }, data: body });
        return NextResponse.json(pedido);
    } catch {
        return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.pedido.delete({ where: { id } });
        return NextResponse.json({ message: "Pedido removido com sucesso" });
    } catch {
        return NextResponse.json({ error: "Erro ao deletar pedido" }, { status: 500 });
    }
}
