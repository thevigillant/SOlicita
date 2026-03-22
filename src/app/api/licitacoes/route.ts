import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status") || "";
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (search) where.OR = [
            { numeroProcesso: { contains: search } },
            { orgaoNome: { contains: search } },
            { modalidade: { contains: search } },
        ];

        const [licitacoes, total] = await Promise.all([
            prisma.licitacao.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { 
                    itens: { select: { ganhou: true } }, 
                    _count: { select: { ordens: true, itens: true } } 
                },
            }),
            prisma.licitacao.count({ where }),
        ]);

        return NextResponse.json({ licitacoes, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar licitações" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { itens, ...licitacaoData } = body;
        const licitacao = await prisma.licitacao.create({
            data: {
                ...licitacaoData,
                dataAbertura: new Date(licitacaoData.dataAbertura),
                itens: itens ? { create: itens } : undefined,
            },
            include: { itens: true },
        });
        return NextResponse.json(licitacao, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro ao criar licitação" }, { status: 500 });
    }
}
