"use client";

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { ClipboardList, Package, Truck, CircleDollarSign, Landmark, Upload, BarChart, Trophy, Download } from 'lucide-react';
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardData {
    totalLicitacoes: number;
    licitacoesGanhas: number;
    totalOrdens: number;
    totalPedidos: number;
    receitaMes: number;
    despesaMes: number;
    contasReceberPendentes: number;
    contasPagarPendentes: number;
    receitaTotal: number;
    despesaTotal: number;
    licitacoesPorStatus: { status: string; _count: { status: number } }[];
    monthlyData: { label: string; receitas: number; despesas: number }[];
}

const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard")
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-3 text-muted">Carregando dados...</p>
                </div>
            </AdminLayout>
        );
    }

    const d = data!;

    const statCards = [
        { label: "Total de Licitações", value: d?.totalLicitacoes || 0, icon: <ClipboardList />, color: "blue", suffix: " proc." },
        { label: "Licitações Ganhas", value: d?.licitacoesGanhas || 0, icon: <Trophy />, color: "green", suffix: " ganhas" },
        { label: "Ordens de Fornecimento", value: d?.totalOrdens || 0, icon: <Package />, color: "purple", suffix: " ordens" },
        { label: "Pedidos", value: d?.totalPedidos || 0, icon: <Truck />, color: "yellow", suffix: " pedidos" },
        { label: "Receita do Mês", value: fmt(d?.receitaMes || 0), icon: <CircleDollarSign />, color: "green", isText: true },
        { label: "Despesas do Mês", value: fmt(d?.despesaMes || 0), icon: <Landmark />, color: "red", isText: true },
        { label: "A Receber (Pendente)", value: fmt(d?.contasReceberPendentes || 0), icon: <Download />, color: "blue", isText: true },
        { label: "A Pagar (Pendente)", value: fmt(d?.contasPagarPendentes || 0), icon: <Upload />, color: "yellow", isText: true },
    ];

    const statusLabels: Record<string, string> = {
        EM_ANDAMENTO: "Em Andamento",
        CONCLUIDA: "Concluída",
        CANCELADA: "Cancelada",
    };

    const doughnutData = {
        labels: (d?.licitacoesPorStatus || []).map((s) => statusLabels[s.status] || s.status),
        datasets: [{
            data: (d?.licitacoesPorStatus || []).map((s) => s._count.status),
            backgroundColor: ["#00f0ff", "#39ff14", "#ff2a2a"],
            borderWidth: 2,
            borderColor: "#050508",
            hoverOffset: 6
        }],
    };

    const barData = {
        labels: (d?.monthlyData || []).map((m) => m.label),
        datasets: [
            {
                label: "Receitas",
                data: (d?.monthlyData || []).map((m) => m.receitas),
                backgroundColor: "rgba(0, 240, 255, 0.5)",
                borderColor: "#00f0ff",
                borderWidth: 2,
                borderRadius: 4,
            },
            {
                label: "Despesas",
                data: (d?.monthlyData || []).map((m) => m.despesas),
                backgroundColor: "rgba(255, 42, 42, 0.5)",
                borderColor: "#ff2a2a",
                borderWidth: 2,
                borderRadius: 4,
            },
        ],
    };

    const lucroPorMes = (d?.monthlyData || []).map((m) => m.receitas - m.despesas);
    const lineData = {
        labels: (d?.monthlyData || []).map((m) => m.label),
        datasets: [{
            label: "Resultado (R$)",
            data: lucroPorMes,
            borderColor: "#00f0ff",
            backgroundColor: "rgba(0, 240, 255, 0.15)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#050508",
            pointBorderColor: "#00f0ff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#00f0ff",
            pointHoverBorderColor: "#fff",
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false, labels: { color: "#e2f1f8", font: { family: "Orbitron" } } },
            tooltip: { backgroundColor: "rgba(5, 8, 15, 0.9)", titleColor: "#00f0ff", bodyColor: "#e2f1f8", borderColor: "#00f0ff", borderWidth: 1 }
        },
        scales: {
            y: { grid: { color: "rgba(0, 240, 255, 0.1)" }, ticks: { color: "#8babc2", font: { size: 11, family: "Orbitron" } } },
            x: { grid: { display: true, color: "rgba(0, 240, 255, 0.05)" }, ticks: { color: "#8babc2", font: { size: 11, family: "Orbitron" } } },
        },
    };

    return (
        <AdminLayout title="Dashboard" subtitle="Visão geral do sistema">
            {/* Stat cards */}
            <div className="row g-3 mb-4">
                {statCards.map((card, i) => (
                    <div className="col-12 col-sm-6 col-xl-3" key={i}>
                        <div className="stat-card">
                            <div className="d-flex align-items-start justify-content-between">
                                <div>
                                    <div className="stat-label">{card.label}</div>
                                    <div className="stat-value" style={{ fontSize: card.isText ? "18px" : "26px", marginTop: "6px" }}>
                                        {card.value}
                                    </div>
                                </div>
                                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-8">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>Receitas vs Despesas (Últimos 6 meses)</span>
                        </div>
                        <div className="card-body">
                            <div className="chart-container">
                                <Bar data={barData} options={{ ...chartOptions, plugins: { legend: { display: true, position: "top" as const } } }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card h-100">
                        <div className="card-header">Licitações por Status</div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            {(d?.licitacoesPorStatus?.length || 0) > 0 ? (
                                <div style={{ height: "220px", width: "220px" }}>
                                    <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: "bottom" as const, labels: { font: { size: 12 } } } } }} />
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon text-secondary"><BarChart size={48} /></div>
                                    <p>Sem dados de licitações</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Result line chart */}
            <div className="card">
                <div className="card-header">Resultado Financeiro Mensal</div>
                <div className="card-body">
                    <div className="chart-container">
                        <Line data={lineData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
