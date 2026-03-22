"use client";

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler
} from 'chart.js';
import { CircleDollarSign, Landmark, TrendingUp, TrendingDown, BarChart, Trophy } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function RelatoriosPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard")
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); });
    }, []);

    if (loading) return (
        <AdminLayout title="Relatórios">
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        </AdminLayout>
    );

    const d = data || {};

    const statusLabels: Record<string, string> = {
        EM_ANDAMENTO: "Em Andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada",
    };

    const barData = {
        labels: (d.monthlyData || []).map((m: any) => m.label),
        datasets: [
            { label: "Receitas (R$)", data: (d.monthlyData || []).map((m: any) => m.receitas), backgroundColor: "rgba(0, 240, 255, 0.5)", borderColor: "#00f0ff", borderWidth: 2, borderRadius: 4 },
            { label: "Despesas (R$)", data: (d.monthlyData || []).map((m: any) => m.despesas), backgroundColor: "rgba(255, 42, 42, 0.5)", borderColor: "#ff2a2a", borderWidth: 2, borderRadius: 4 },
        ],
    };

    const doughnutData = {
        labels: (d.licitacoesPorStatus || []).map((s: any) => statusLabels[s.status] || s.status),
        datasets: [{ data: (d.licitacoesPorStatus || []).map((s: any) => s._count.status), backgroundColor: ["#00f0ff", "#39ff14", "#ff2a2a"], borderWidth: 2, borderColor: "#050508", hoverOffset: 6 }],
    };

    const saldo = (d.receitaTotal || 0) - (d.despesaTotal || 0);

    return (
        <AdminLayout title="Relatórios" subtitle="Visão consolidada do desempenho">

            {/* Summary */}
            <div className="row g-3 mb-4">
                {[
                    { label: "Receita Total Acumulada", value: fmt(d.receitaTotal || 0), icon: <CircleDollarSign size={24} />, color: "green" },
                    { label: "Despesa Total Acumulada", value: fmt(d.despesaTotal || 0), icon: <Landmark size={24} />, color: "red" },
                    { label: "Saldo Acumulado", value: fmt(saldo), icon: saldo >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />, color: saldo >= 0 ? "green" : "red" },
                    { label: "Taxa de Sucesso", value: d.totalLicitacoes ? `${Math.round((d.licitacoesGanhas / d.totalLicitacoes) * 100)}%` : "—", icon: <Trophy size={24} />, color: "blue" },
                ].map((c, i) => (
                    <div key={i} className="col-sm-6 col-xl-3">
                        <div className="stat-card">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div className="stat-label">{c.label}</div>
                                    <div className="stat-value" style={{ fontSize: "16px", marginTop: 6 }}>{c.value}</div>
                                </div>
                                <div className={`stat-icon ${c.color}`}>{c.icon}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-3 mb-3">
                <div className="col-12 col-lg-8">
                    <div className="card">
                        <div className="card-header">Receitas vs Despesas por Mês</div>
                        <div className="card-body">
                            <div className="chart-container">
                                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: "top" as const, labels: { color: "#e2f1f8", font: { family: "Orbitron" } } }, tooltip: { backgroundColor: "rgba(5, 8, 15, 0.9)", titleColor: "#00f0ff", bodyColor: "#e2f1f8", borderColor: "#00f0ff", borderWidth: 1 } }, scales: { y: { grid: { color: "rgba(0, 240, 255, 0.1)" }, ticks: { color: "#8babc2", font: { family: "Orbitron" } } }, x: { grid: { color: "rgba(0, 240, 255, 0.05)" }, ticks: { color: "#8babc2", font: { family: "Orbitron" } } } } }} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card h-100">
                        <div className="card-header">Distribuição de Licitações</div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            {(d.licitacoesPorStatus?.length || 0) > 0 ? (
                                <div style={{ width: 220, height: 220 }}>
                                    <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: "bottom" as const, labels: { color: "#e2f1f8", font: { size: 12, family: "Orbitron" } } }, tooltip: { backgroundColor: "rgba(5, 8, 15, 0.9)", titleColor: "#00f0ff", bodyColor: "#e2f1f8", borderColor: "#00f0ff", borderWidth: 1 } } }} />
                                </div>
                            ) : (
                                <div className="empty-state"><div className="empty-state-icon text-secondary mb-3"><BarChart size={48} /></div><p className="text-muted">Sem dados</p></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Consolidated table */}
            <div className="card">
                <div className="card-header">Resumo Consolidado</div>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr><th>Indicador</th><th className="text-end">Valor</th></tr>
                        </thead>
                        <tbody>
                            {[
                                ["Total de Licitações", d.totalLicitacoes || 0],
                                ["Licitações Ganhas", d.licitacoesGanhas || 0],
                                ["Ordens de Fornecimento Emitidas", d.totalOrdens || 0],
                                ["Pedidos Realizados", d.totalPedidos || 0],
                                ["Receita do Mês Atual", fmt(d.receitaMes || 0)],
                                ["Despesas do Mês Atual", fmt(d.despesaMes || 0)],
                                ["A Receber (Pendente)", fmt(d.contasReceberPendentes || 0)],
                                ["A Pagar (Pendente)", fmt(d.contasPagarPendentes || 0)],
                            ].map(([label, value], i) => (
                                <tr key={i}>
                                    <td>{label}</td>
                                    <td className="text-end"><strong>{value}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
