"use client";

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { Upload, CheckCircle, BarChart, Banknote, Pencil, Trash2, Check } from "lucide-react";

interface Conta {
    id: string;
    descricao: string;
    fornecedor: string;
    valor: number;
    dataVencimento: string;
    pago: boolean;
    dataPagamento?: string;
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const isVencida = (d: string, pago: boolean) => !pago && new Date(d) < new Date();

const empty = { descricao: "", fornecedor: "", valor: "", dataVencimento: "", pago: false, dataPagamento: "" };

export default function ContasPagarPage() {
    const [items, setItems] = useState<Conta[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [pagoFilter, setPagoFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Conta | null>(null);
    const [form, setForm] = useState<any>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async (p = 1, pf = pagoFilter) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p), pago: pf });
        const res = await fetch(`/api/financeiro/contas-pagar?${params}`);
        const data = await res.json();
        setItems(data.contas || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const totalPendente = items.filter(i => !i.pago).reduce((s, i) => s + i.valor, 0);
    const totalPago = items.filter(i => i.pago).reduce((s, i) => s + i.valor, 0);

    const openCreate = () => { setEditing(null); setForm(empty); setError(""); setShowModal(true); };
    const openEdit = (item: Conta) => {
        setEditing(item);
        setForm({ descricao: item.descricao, fornecedor: item.fornecedor, valor: String(item.valor), dataVencimento: item.dataVencimento.split("T")[0], pago: item.pago, dataPagamento: item.dataPagamento?.split("T")[0] || "" });
        setError(""); setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true); setError("");
        const payload = { ...form, valor: parseFloat(form.valor) || 0, pago: Boolean(form.pago) };
        const method = editing ? "PUT" : "POST";
        const url = editing ? `/api/financeiro/contas-pagar/${editing.id}` : "/api/financeiro/contas-pagar";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) setError(data.error || "Erro ao salvar");
        else { setShowModal(false); load(page); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir esta conta?")) return;
        await fetch(`/api/financeiro/contas-pagar/${id}`, { method: "DELETE" });
        load(page);
    };

    const markPaid = async (item: Conta) => {
        await fetch(`/api/financeiro/contas-pagar/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pago: true, dataPagamento: new Date().toISOString().split("T")[0] }),
        });
        load(page);
    };

    return (
        <AdminLayout title="Contas a Pagar" subtitle={`${total} registros`}>
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="stat-card">
                        <div className="d-flex justify-content-between align-items-start">
                            <div><div className="stat-label">A Pagar</div><div className="stat-value" style={{ fontSize: "18px", marginTop: 6 }}>{fmt(totalPendente)}</div></div>
                                <div className="stat-icon red"><Upload size={24} /></div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stat-card">
                        <div className="d-flex justify-content-between align-items-start">
                            <div><div className="stat-label">Pago</div><div className="stat-value" style={{ fontSize: "18px", marginTop: 6 }}>{fmt(totalPago)}</div></div>
                                <div className="stat-icon green"><CheckCircle size={24} /></div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stat-card">
                        <div className="d-flex justify-content-between align-items-start">
                            <div><div className="stat-label">Total de Registros</div><div className="stat-value" style={{ marginTop: 6 }}>{total}</div></div>
                                <div className="stat-icon blue"><BarChart size={24} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                <select className="form-select" style={{ width: 180 }} value={pagoFilter}
                    onChange={(e) => { setPagoFilter(e.target.value); load(1, e.target.value); }}>
                    <option value="">Todos</option>
                    <option value="false">Pendentes</option>
                    <option value="true">Pagos</option>
                </select>
                <button id="btn-nova-conta-pagar" className="btn btn-primary" onClick={openCreate}>+ Nova Conta</button>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Fornecedor</th>
                                <th>Valor</th>
                                <th>Vencimento</th>
                                <th>Status</th>
                                <th>Data Pagamento</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><Banknote size={48} className="text-secondary" /></div><p>Nenhuma conta encontrada</p></div></td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className={isVencida(item.dataVencimento, item.pago) ? "table-danger" : ""}>
                                    <td><strong>{item.descricao}</strong></td>
                                    <td>{item.fornecedor}</td>
                                    <td><strong className="text-danger">{fmt(item.valor)}</strong></td>
                                    <td>{fmtDate(item.dataVencimento)}{isVencida(item.dataVencimento, item.pago) && <span className="badge bg-danger ms-2">Vencida</span>}</td>
                                    <td>{item.pago ? <span className="badge bg-success">Pago</span> : <span className="badge bg-warning text-dark">Pendente</span>}</td>
                                    <td>{fmtDate(item.dataPagamento)}</td>
                                    <td className="text-end">
                                        {!item.pago && <button className="btn btn-sm btn-outline-success me-1 d-flex align-items-center d-inline-flex gap-1" onClick={() => markPaid(item)}><Check size={14} /> Pagar</button>}
                                                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
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
                                <h5 className="modal-title">{editing ? "Editar Conta" : "Nova Conta a Pagar"}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">{error}</div>}
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label">Descrição *</label>
                                        <input className="form-control" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Fornecedor *</label>
                                        <input className="form-control" value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Valor (R$) *</label>
                                        <input type="number" step="0.01" className="form-control" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Data de Vencimento *</label>
                                        <input type="date" className="form-control" value={form.dataVencimento} onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={form.pago ? "true" : "false"} onChange={(e) => setForm({ ...form, pago: e.target.value === "true" })}>
                                            <option value="false">Pendente</option>
                                            <option value="true">Pago</option>
                                        </select>
                                    </div>
                                    {form.pago && (
                                        <div className="col-12">
                                            <label className="form-label">Data de Pagamento</label>
                                            <input type="date" className="form-control" value={form.dataPagamento} onChange={(e) => setForm({ ...form, dataPagamento: e.target.value })} />
                                        </div>
                                    )}
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
