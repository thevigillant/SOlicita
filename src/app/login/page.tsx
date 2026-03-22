"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Erro ao fazer login");
            } else {
                // Hard redirect so cookie is sent with the next request before proxy runs
                window.location.href = "/dashboard";
            }
        } catch {
            setError("Erro de conexão com o servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo"><Zap size={48} className="text-primary" /></div>
                <h1 className="login-title">SOlicita</h1>
                <p className="login-subtitle">Gestão de Licitações Empresariais</p>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-control"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="form-label">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading}
                        style={{ padding: "12px", fontSize: "15px" }}
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <div
                    style={{
                        marginTop: "24px",
                        padding: "16px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#64748b",
                    }}
                >
                    <strong>Credenciais de acesso:</strong>
                    <br />
                    E-mail: admin@solicita.com
                    <br />
                    Senha: admin123
                </div>
            </div>
        </div>
    );
}
