import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const onlyWon = searchParams.get("onlyWon") === "true";

        const where: any = {};
        if (onlyWon) {
            where.itens = { some: { ganhou: true } };
        }

        const licitacoes = await prisma.licitacao.findMany({
            where,
            include: {
                itens: true,
                ata: true,
            },
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json(licitacoes);
    } catch (error) {
        console.error("API ATAS GET Error:", error);
        return NextResponse.json({ error: "Erro ao buscar licitações/atas" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const licitacaoId = formData.get("licitacaoId") as string;

        if (!file || !licitacaoId) {
            return NextResponse.json({ error: "Arquivo ou ID da licitação ausentes" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const uploadDir = join(process.cwd(), "public/uploads/atas");
        
        await mkdir(uploadDir, { recursive: true });
        
        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        const pdfUrl = `/uploads/atas/${filename}`;

        const ata = await prisma.ata.upsert({
            where: { licitacaoId },
            update: { pdfUrl },
            create: { licitacaoId, pdfUrl },
        });

        // Update licitacao status to CONCLUIDA if it wasn't
        await prisma.licitacao.update({
            where: { id: licitacaoId },
            data: { status: "CONCLUIDA" }
        });

        return NextResponse.json(ata, { status: 201 });
    } catch (error) {
        console.error("API ATAS POST Error:", error);
        return NextResponse.json({ error: "Erro ao enviar arquivo" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, dataAssinatura, dataVigencia } = body;

        if (!id) return NextResponse.json({ error: "ID da ata obrigatorio" }, { status: 400 });

        const ata = await prisma.ata.update({
            where: { id },
            data: {
                dataAssinatura: dataAssinatura ? new Date(dataAssinatura) : null,
                dataVigencia: dataVigencia ? new Date(dataVigencia) : null,
            }
        });
        return NextResponse.json(ata);
    } catch (error) {
        console.error("API ATAS PUT Error:", error);
        return NextResponse.json({ error: "Erro ao atualizar ata" }, { status: 500 });
    }
}
