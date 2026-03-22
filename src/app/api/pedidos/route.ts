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

        const [pedidos, total] = await Promise.all([
            prisma.pedido.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { ordem: { select: { numeroOF: true, licitacao: { select: { orgaoNome: true } } } } },
            }),
            prisma.pedido.count({ where }),
        ]);

        return NextResponse.json({ pedidos, total, pages: Math.ceil(total / limit) });
    } catch {
        return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (body.dataEnvio) body.dataEnvio = new Date(body.dataEnvio);
        const pedido = await prisma.pedido.create({ data: body, include: { ordem: true } });
        return NextResponse.json(pedido, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
    }
}
