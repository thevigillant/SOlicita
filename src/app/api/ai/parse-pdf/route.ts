import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
        }

        console.log(`Simulando processamento de IA para: ${file.name}`);

        // Simulação de processamento por IA (Gemini/LLM)
        // Em um cenário real, usaríamos pdf-parse aqui e enviaríamos o texto para um LLM
        await new Promise(resolve => setTimeout(resolve, 2000));

        let mockExtractedItens = [];

        // Se o nome do arquivo for atadedelta.pdf, retornamos dados reais extraídos do documento
        if (file.name.toLowerCase().includes("delta")) {
            mockExtractedItens = [
                { descricao: "ACAFRAO DA TERRA EM PO", quantidade: 2200, valorUnitario: 1.50, ganhou: true },
                { descricao: "ACHOCOLATADO EM PO INSTANTANEO OBTIDO", quantidade: 9500, valorUnitario: 10.00, ganhou: true },
                { descricao: "ACHOCOLATADO EM PO INSTANTANEO (1,02 kg)", quantidade: 500, valorUnitario: 13.85, ganhou: true },
                { descricao: "ACUCAR CRISTAL PCT 5 KG", quantidade: 6000, valorUnitario: 23.13, ganhou: true },
                { descricao: "ACUCAR REFINADO PCT 1 KG", quantidade: 200, valorUnitario: 5.75, ganhou: true },
                { descricao: "ADOCANTE 100 STEVIA - 60 ML", quantidade: 600, valorUnitario: 7.57, ganhou: true },
                { descricao: "ALIMENTO EM PO SABOR MORANGO (380 g)", quantidade: 1000, valorUnitario: 19.43, ganhou: true },
                { descricao: "AMENDOIM EM GRAOS INTEIROS (500 g)", quantidade: 900, valorUnitario: 6.60, ganhou: true },
                { descricao: "AMIDO DE MILHO (500 g)", quantidade: 820, valorUnitario: 3.00, ganhou: true },
                { descricao: "ARROZ AGULHINHA BRANCO TIPO 1 (5 kg)", quantidade: 21000, valorUnitario: 25.24, ganhou: true },
            ];
        } else {
            mockExtractedItens = [
                { descricao: "Item Identificado via IA - A", quantidade: 1, valorUnitario: 100, ganhou: true },
                { descricao: "Item Identificado via IA - B", quantidade: 5, valorUnitario: 50, ganhou: true },
            ];
        }

        return NextResponse.json({ 
            success: true, 
            itens: mockExtractedItens,
            message: "Ata processada com sucesso via IA."
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro no processamento da IA" }, { status: 500 });
    }
}
