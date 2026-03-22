import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const pago = searchParams.get("pago");
        const skip = (page - 1) * limit;
        const where: any = {};
        if (pago !== null && pago !== "") where.pago = pago === "true";

        const [contas, total] = await Promise.all([
            prisma.contasReceber.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dataVencimento: "asc" },
                include: { ordem: { select: { numeroOF: true } } },
            }),
            prisma.contasReceber.count({ where }),
        ]);

        return NextResponse.json({ contas, total, pages: Math.ceil(total / limit) });
    } catch {
        return NextResponse.json({ error: "Erro ao buscar contas a receber" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (body.dataVencimento) body.dataVencimento = new Date(body.dataVencimento);
        if (body.dataPagamento) body.dataPagamento = new Date(body.dataPagamento);
        const conta = await prisma.contasReceber.create({ data: body });
        return NextResponse.json(conta, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Erro ao criar conta a receber" }, { status: 500 });
    }
}
