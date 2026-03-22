"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ClipboardList, FileText, Package, Truck, Factory, Building2, Coins, Landmark, TrendingUp, Zap, LogOut, Loader2 } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { section: "Licitações" },
    { href: "/licitacoes", icon: <ClipboardList size={18} />, label: "Licitações" },
    { href: "/atas", icon: <FileText size={18} />, label: "Atas / Itens Ganhos" },
    { href: "/ordens", icon: <Package size={18} />, label: "Ordens de Fornecimento" },
    { href: "/pedidos", icon: <Truck size={18} />, label: "Pedidos" },
    { href: "/compras", icon: <Factory size={18} />, label: "Compras" },

    { section: "Cadastros" },
    { href: "/cnpjs", icon: <Building2 size={18} />, label: "Fornecedores" },
    { section: "Financeiro" },
    { href: "/financeiro/contas-receber", icon: <Coins size={18} />, label: "Contas a Receber" },
    { href: "/financeiro/contas-pagar", icon: <Landmark size={18} />, label: "Contas a Pagar" },
    { section: "Relatórios" },
    { href: "/relatorios", icon: <TrendingUp size={18} />, label: "Relatórios" },
];

interface SidebarProps {
    userName?: string;
    userRole?: string;
}

export default function Sidebar({ userName = "Administrador", userRole = "ADMIN" }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === href;
        return pathname.startsWith(href);
    };

    const initials = userName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <aside className="sidebar">
            <Link className="sidebar-brand" href="/dashboard">
                <div className="sidebar-brand-icon"><Zap size={24} className="text-primary" /></div>
                <span className="sidebar-brand-text">
                    SO<span>licita</span>
                </span>
            </Link>

            <nav className="sidebar-menu">
                {navItems.map((item, i) => {
                    if ("section" in item) {
                        return (
                            <div key={i} className="sidebar-section-title">
                                {item.section}
                            </div>
                        );
                    }
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
                        >
                            <span className="nav-icon" style={{ fontSize: "16px" }}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={handleLogout} title="Clique para sair">
                    <div className="user-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{userName}</div>
                        <div className="sidebar-user-role">{userRole === "ADMIN" ? "Administrador" : "Usuário"}</div>
                    </div>
                    <span style={{ color: "#475569", marginLeft: "auto" }}>{loading ? <Loader2 size={16} className="animate-spin text-info" /> : <LogOut size={16} />}</span>
                </div>
            </div>
        </aside>
    );
}
