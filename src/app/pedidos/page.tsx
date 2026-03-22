"use client";

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { Truck, Pencil, Trash2 } from "lucide-react";

interface Pedido {
    id: string;
    dataEnvio?: string;
    codigoRastreio?: string;
    transportadora?: string;
    status: string;
    ordem?: { numeroOF: string; licitacao?: { orgaoNome?: string } };
}

interface Ordem { id: string; numeroOF: string; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PREPARANDO: { label: "Preparando", color: "warning" },
    ENVIADO: { label: "Enviado", color: "info" },
    ENTREGUE: { label: "Entregue", color: "success" },
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const empty = { ordemId: "", dataEnvio: "", codigoRastreio: "", transportadora: "", status: "PREPARANDO" };

export default function PedidosPage() {
    const [items, setItems] = useState<Pedido[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Pedido | null>(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [ordens, setOrdens] = useState<Ordem[]>([]);

    const load = async (p = 1, st = statusFilter) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p), status: st });
        const res = await fetch(`/api/pedidos?${params}`);
        const data = await res.json();
        setItems(data.pedidos || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setLoading(false);
    };

    const loadOrdens = async () => {
        const res = await fetch("/api/ordens?limit=100");
        const data = await res.json();
        setOrdens(data.ordens || []);
    };

    useEffect(() => { load(); loadOrdens(); }, []);

    const openCreate = () => { setEditing(null); setForm(empty); setError(""); setShowModal(true); };

    const openEdit = (item: Pedido) => {
        setEditing(item);
        setForm({ ordemId: "", dataEnvio: item.dataEnvio?.split("T")[0] || "", codigoRastreio: item.codigoRastreio || "", transportadora: item.transportadora || "", status: item.status });
        setError("");
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        const method = editing ? "PUT" : "POST";
        const url = editing ? `/api/pedidos/${editing.id}` : "/api/pedidos";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) setError(data.error || "Erro ao salvar");
        else { setShowModal(false); load(page); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir este pedido?")) return;
        await fetch(`/api/pedidos/${id}`, { method: "DELETE" });
        load(page);
    };

    return (
        <AdminLayout title="Pedidos" subtitle={`${total} pedidos encontrados`}>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                <select className="form-select" style={{ width: 200 }} value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value); }}>
                    <option value="">Todos os status</option>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button id="btn-novo-pedido" className="btn btn-primary" onClick={openCreate}>+ Novo Pedido</button>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Ordem (OF)</th>
                                <th>Órgão</th>
                                <th>Data Envio</th>
                                <th>Transportadora</th>
                                <th>Cód. Rastreio</th>
                                <th>Status</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><Truck size={48} className="text-secondary" /></div><p>Nenhum pedido encontrado</p></div></td></tr>
                            ) : items.map((item) => {
                                const st = STATUS_MAP[item.status] || { label: item.status, color: "secondary" };
                                return (
                                    <tr key={item.id}>
                                        <td><strong>{item.ordem?.numeroOF || "—"}</strong></td>
                                        <td>{item.ordem?.licitacao?.orgaoNome || "—"}</td>
                                        <td>{fmtDate(item.dataEnvio)}</td>
                                        <td>{item.transportadora || "—"}</td>
                                        <td><code>{item.codigoRastreio || "—"}</code></td>
                                        <td><span className={`badge bg-${st.color}`}>{st.label}</span></td>
                                        <td className="text-end">
                                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {pages > 1 && (
                    <div className="card-footer d-flex justify-content-end">
                        <ul className="pagination pagination-sm mb-0">
                            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                                    <button className="page-link" onClick={() => { setPage(p); load(p); }}>{p}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editing ? "Editar Pedido" : "Novo Pedido"}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">{error}</div>}
                                <div className="row g-3">
                                    {!editing && (
                                        <div className="col-12">
                                            <label className="form-label">Ordem de Fornecimento *</label>
                                            <select className="form-select" value={form.ordemId} onChange={(e) => setForm({ ...form, ordemId: e.target.value })} required>
                                                <option value="">Selecione uma ordem...</option>
                                                {ordens.map((o) => <option key={o.id} value={o.id}>OF {o.numeroOF}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="col-md-6">
                                        <label className="form-label">Data de Envio</label>
                                        <input type="date" className="form-control" value={form.dataEnvio} onChange={(e) => setForm({ ...form, dataEnvio: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Transportadora</label>
                                        <input className="form-control" value={form.transportadora} onChange={(e) => setForm({ ...form, transportadora: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Código de Rastreio</label>
                                        <input className="form-control" value={form.codigoRastreio} onChange={(e) => setForm({ ...form, codigoRastreio: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
