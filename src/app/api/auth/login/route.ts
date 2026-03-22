import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email e senha são obrigatórios" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            );
        }

        const valid = await comparePassword(password, user.password);
        if (!valid) {
            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            );
        }

        const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

        const response = NextResponse.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            message: "Login realizado com sucesso",
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
