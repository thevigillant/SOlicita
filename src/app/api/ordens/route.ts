import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status") || "";
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [ordens, total] = await Promise.all([
            prisma.ordemFornecimento.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { licitacao: { select: { numeroProcesso: true, orgaoNome: true } }, _count: { select: { pedidos: true } } },
            }),
            prisma.ordemFornecimento.count({ where }),
        ]);

        return NextResponse.json({ ordens, total, pages: Math.ceil(total / limit) });
    } catch {
        return NextResponse.json({ error: "Erro ao buscar ordens" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (body.dataEmissao) body.dataEmissao = new Date(body.dataEmissao);
        const ordem = await prisma.ordemFornecimento.create({ data: body, include: { licitacao: true } });
        return NextResponse.json(ordem, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") return NextResponse.json({ error: "Número de OF já cadastrado" }, { status: 409 });
        return NextResponse.json({ error: "Erro ao criar ordem" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, numeroNF, dataAteste, status } = body;
        
        const updateData: any = {};
        if (numeroNF !== undefined) updateData.numeroNF = numeroNF;
        if (dataAteste !== undefined) updateData.dataAteste = dataAteste ? new Date(dataAteste) : null;
        if (status) updateData.status = status;

        const ordem = await prisma.ordemFornecimento.update({
            where: { id },
            data: updateData,
        });
        return NextResponse.json(ordem);
    } catch {
        return NextResponse.json({ error: "Erro ao atualizar ordem" }, { status: 500 });
    }
}
