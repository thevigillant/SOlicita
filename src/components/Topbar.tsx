"use client";

interface TopbarProps {
    title: string;
    subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
    return (
        <header className="topbar">
            <div className="topbar-left">
                <div>
                    <div className="topbar-title">{title}</div>
                    {subtitle && (
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{subtitle}</div>
                    )}
                </div>
            </div>
            <div className="topbar-right">
                <div
                    style={{
                        fontSize: "12px",
                        color: "#64748b",
                        background: "#f1f5f9",
                        padding: "6px 12px",
                        borderRadius: "20px",
                    }}
                >
                    🏛️ SOlicita
                </div>
            </div>
        </header>
    );
}
