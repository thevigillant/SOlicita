"use client";

import AdminLayout from "@/components/AdminLayout";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Package, Pencil, Trash2 } from "lucide-react";

interface Ordem {
    id: string;
    numeroOF: string;
    dataEmissao: string;
    valorTotal: number;
    numeroNF?: string;
    dataAteste?: string;
    status: string;
    licitacao?: { numeroProcesso: string; orgaoNome?: string };
    _count?: { pedidos: number };
}

interface Licitacao { id: string; numeroProcesso: string; orgaoNome?: string; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDENTE: { label: "Pendente", color: "warning" },
    EM_PROCESSAMENTO: { label: "Em Processamento", color: "info" },
    ENTREGUE: { label: "Entregue", color: "success" },
    CANCELADA: { label: "Cancelada", color: "danger" },
};

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const empty = { licitacaoId: "", numeroOF: "", dataEmissao: "", valorTotal: "", numeroNF: "", dataAteste: "", status: "PENDENTE" };

export default function OrdensPage() {
    const [items, setItems] = useState<Ordem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Ordem | null>(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);

    const searchParams = useSearchParams();
    const prefilledLicitacaoId = searchParams.get("licitacaoId");

    const load = async (p = 1, st = statusFilter) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p), status: st });
        const res = await fetch(`/api/ordens?${params}`);
        const data = await res.json();
        setItems(data.ordens || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setLoading(false);
    };

    const loadLicitacoes = async () => {
        const res = await fetch("/api/licitacoes?limit=100");
        const data = await res.json();
        setLicitacoes(data.licitacoes || []);
    };

    useEffect(() => { 
        load(); 
        loadLicitacoes(); 
        if (prefilledLicitacaoId) {
            setForm({ ...empty, licitacaoId: prefilledLicitacaoId });
            setShowModal(true);
        }
    }, [prefilledLicitacaoId]);


    const openCreate = () => {
        setEditing(null);
        setForm(empty);
        setError("");
        setShowModal(true);
    };

    const openEdit = (item: Ordem) => {
        setEditing(item);
        setForm({ licitacaoId: "", numeroOF: item.numeroOF, dataEmissao: item.dataEmissao.split("T")[0], valorTotal: String(item.valorTotal), numeroNF: item.numeroNF || "", dataAteste: item.dataAteste ? item.dataAteste.split("T")[0] : "", status: item.status });
        setError("");
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        const payload = { ...form, valorTotal: parseFloat(form.valorTotal as string) || 0 };
        const method = editing ? "PUT" : "POST";
        const url = editing ? `/api/ordens/${editing.id}` : "/api/ordens";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) setError(data.error || "Erro ao salvar");
        else { setShowModal(false); load(page); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir esta ordem?")) return;
        await fetch(`/api/ordens/${id}`, { method: "DELETE" });
        load(page);
    };

    return (
        <AdminLayout title="Ordens de Fornecimento" subtitle={`${total} ordens encontradas`}>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                <select className="form-select" style={{ width: 200 }} value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value); }}>
                    <option value="">Todos os status</option>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button id="btn-nova-ordem" className="btn btn-primary" onClick={openCreate}>+ Nova Ordem</button>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Nº OF</th>
                                <th>Licitação</th>
                                <th>Data Emissão</th>
                                <th>Valor Total</th>
                                <th>NF-e</th>
                                <th>Ateste</th>
                                <th>Pedidos</th>
                                <th>Status</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><Package size={48} className="text-secondary" /></div><p>Nenhuma ordem encontrada</p></div></td></tr>
                            ) : items.map((item) => {
                                const st = STATUS_MAP[item.status] || { label: item.status, color: "secondary" };
                                return (
                                    <tr key={item.id}>
                                        <td><strong className="text-primary">{item.numeroOF}</strong></td>
                                        <td>{item.licitacao?.numeroProcesso || "—"}<br /><small className="text-muted">{item.licitacao?.orgaoNome}</small></td>
                                        <td>{fmtDate(item.dataEmissao)}</td>
                                        <td>{fmt(item.valorTotal)}</td>
                                        <td>{item.numeroNF ? <span className="badge border border-primary text-primary bg-transparent" style={{fontFamily:"Orbitron"}}>{item.numeroNF}</span> : <span className="text-muted small">—</span>}</td>
                                        <td>{item.dataAteste ? <span className="badge border border-success text-success bg-transparent" style={{fontFamily:"Orbitron"}}>{fmtDate(item.dataAteste)}</span> : <span className="text-muted small">—</span>}</td>
                                        <td><span className="badge bg-secondary">{item._count?.pedidos || 0}</span></td>
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
                                <h5 className="modal-title">{editing ? "Editar Ordem" : "Nova Ordem de Fornecimento"}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">{error}</div>}
                                <div className="row g-3">
                                    {!editing && (
                                        <div className="col-12">
                                            <label className="form-label">Licitação *</label>
                                            <select className="form-select" value={form.licitacaoId} onChange={(e) => setForm({ ...form, licitacaoId: e.target.value })} required>
                                                <option value="">Selecione uma licitação...</option>
                                                {licitacoes.map((l) => <option key={l.id} value={l.id}>{l.numeroProcesso} — {l.orgaoNome}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="col-md-6">
                                        <label className="form-label">Nº OF *</label>
                                        <input className="form-control" value={form.numeroOF} onChange={(e) => setForm({ ...form, numeroOF: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Data de Emissão *</label>
                                        <input type="date" className="form-control" value={form.dataEmissao} onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Valor Total (R$)</label>
                                        <input type="number" step="0.01" className="form-control" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-info">Número da NF-e (Opcional)</label>
                                        <input type="text" className="form-control border-info" value={form.numeroNF} onChange={(e) => setForm({ ...form, numeroNF: e.target.value })} placeholder="Ex: 1542" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-success">Data de Ateste (Opcional)</label>
                                        <input type="date" className="form-control border-success" value={form.dataAteste} onChange={(e) => setForm({ ...form, dataAteste: e.target.value })} />
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
