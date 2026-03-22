import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cnpj = await prisma.cnpj.findUnique({ where: { id } });
        if (!cnpj) return NextResponse.json({ error: "CNPJ não encontrado" }, { status: 404 });
        return NextResponse.json(cnpj);
    } catch {
        return NextResponse.json({ error: "Erro ao buscar CNPJ" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const cnpj = await prisma.cnpj.update({
            where: { id },
            data: {
                razaoSocial: body.razaoSocial,
                nomeFantasia: body.nomeFantasia,
                cnpj: body.cnpj,
                inscricaoEstadual: body.inscricaoEstadual,
                telefone: body.telefone,
                email: body.email,
                endereco: body.endereco,
            },
        });
        return NextResponse.json(cnpj);
    } catch {
        return NextResponse.json({ error: "Erro ao atualizar CNPJ" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.cnpj.delete({ where: { id } });
        return NextResponse.json({ message: "CNPJ removido com sucesso" });
    } catch {
        return NextResponse.json({ error: "Erro ao deletar CNPJ" }, { status: 500 });
    }
}
