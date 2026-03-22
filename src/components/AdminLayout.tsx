"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="main-content">
                <Topbar title={title} subtitle={subtitle} />
                <div className="page-wrapper animate-fade-in">{children}</div>
            </main>
        </div>
    );
}
