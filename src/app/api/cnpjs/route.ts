import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { razaoSocial: { contains: search } },
                    { nomeFantasia: { contains: search } },
                    { cnpj: { contains: search } },
                ],
            }
            : {};

        const [cnpjs, total] = await Promise.all([
            prisma.cnpj.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
            prisma.cnpj.count({ where }),
        ]);

        return NextResponse.json({ cnpjs, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar CNPJs" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cnpj = await prisma.cnpj.create({ data: body });
        return NextResponse.json(cnpj, { status: 201 });
    } catch (error: any) {
        console.error("Erro completo ao criar CNPJ:", error);
        if (error.code === "P2002") {
            return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 });
        }
        return NextResponse.json({ error: "Erro ao criar CNPJ" }, { status: 500 });
    }
}
