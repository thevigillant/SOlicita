"use client";

import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";
import { ClipboardList, Pencil, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";

interface Licitacao {
    id: string;
    numeroProcesso: string;
    orgaoNome?: string;
    modalidade: string;
    dataAbertura: string;
    valorTotalEstimado: number;
    status: string;
    _count?: { ordens: number; itens: number };
    itens?: { ganhou: boolean }[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    EM_ANDAMENTO: { label: "Em Andamento", color: "primary" },
    CONCLUIDA: { label: "Concluída", color: "success" },
    CANCELADA: { label: "Cancelada", color: "danger" },
};

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const empty = {
    numeroProcesso: "",
    orgaoNome: "",
    orgaoId: "",
    modalidade: "Pregão Eletrônico",
    dataAbertura: "",
    valorTotalEstimado: "",
    status: "EM_ANDAMENTO",
    itens: [] as { descricao: string; quantidade: number; valorUnitario: number }[],
};

export default function LicitacoesPage() {
    const [items, setItems] = useState<Licitacao[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Licitacao | null>(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async (p = 1, s = search, st = statusFilter) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p), search: s, status: st });
        const res = await fetch(`/api/licitacoes?${params}`);
        const data = await res.json();
        setItems(data.licitacoes || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(empty);
        setError("");
        setShowModal(true);
    };

    const openEdit = (item: Licitacao) => {
        setEditing(item);
        setForm({
            numeroProcesso: item.numeroProcesso,
            orgaoNome: item.orgaoNome || "",
            orgaoId: "",
            modalidade: item.modalidade,
            dataAbertura: item.dataAbertura.split("T")[0],
            valorTotalEstimado: String(item.valorTotalEstimado),
            status: item.status,
            itens: (item as any).itens || [],
        });
        setError("");
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        const payload = { ...form, valorTotalEstimado: parseFloat(form.valorTotalEstimado as string) || 0 };
        const method = editing ? "PUT" : "POST";
        const url = editing ? `/api/licitacoes/${editing.id}` : "/api/licitacoes";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) setError(data.error || "Erro ao salvar");
        else { setShowModal(false); load(page); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir esta licitação?")) return;
        await fetch(`/api/licitacoes/${id}`, { method: "DELETE" });
        load(page);
    };

    const [isProcessing, setIsProcessing] = useState(false);

    const handleAtaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsProcessing(true);
        const formData = new FormData();
        formData.append("file", file);
        
        try {
            const res = await fetch("/api/ai/parse-pdf", { method: "POST", body: formData });
            const data = await res.json();
            
            if (data.success && data.itens) {
                setForm({ ...form, itens: data.itens, status: "CONCLUIDA" });
                alert(`✓ Sucesso: ${data.itens.length} itens extraídos via IA e marcados como ganhos.`);
            } else {
                alert("Erro ao processar PDF: " + (data.error || "IA falhou ao extrair dados."));
            }
        } catch (err) {
            alert("Erro de conexão na IA.");
        } finally {
            setIsProcessing(false);
            if (e.target) e.target.value = "";
        }
    };

    return (

        <AdminLayout title="Licitações" subtitle={`${total} licitações encontradas`}>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                <div className="d-flex gap-2">
                    <input className="form-control" style={{ width: 260 }} placeholder="Buscar processo, órgão..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (setPage(1), load(1))}
                    />
                    <select className="form-select" style={{ width: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, search, e.target.value); }}>
                        <option value="">Todos os status</option>
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDA">Concluída</option>
                        <option value="CANCELADA">Cancelada</option>
                    </select>
                </div>
                <button id="btn-nova-licitacao" className="btn btn-primary" onClick={openCreate}>+ Nova Licitação</button>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Nº Processo</th>
                                <th>Órgão</th>
                                <th>Modalidade</th>
                                <th>Data Abertura</th>
                                <th>Valor Estimado</th>
                                <th>Status</th>
                                <th>Itens Ganhos</th>
                                <th>OFs</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon"><ClipboardList size={48} className="text-secondary" /></div><p>Nenhuma licitação encontrada</p></div></td></tr>
                            ) : items.map((item) => {
                                const st = STATUS_MAP[item.status] || { label: item.status, color: "secondary" };
                                return (
                                    <tr key={item.id}>
                                        <td><strong className="text-primary">{item.numeroProcesso}</strong></td>
                                        <td>{item.orgaoNome || "—"}</td>
                                        <td>{item.modalidade}</td>
                                        <td>{fmtDate(item.dataAbertura)}</td>
                                        <td>{fmt(item.valorTotalEstimado)}</td>
                                        <td><span className={`badge bg-${st.color}`}>{st.label}</span></td>
                                        <td>
                                            <span className={`badge bg-${(item.itens?.filter(i => i.ganhou).length || 0) > 0 ? "success" : "secondary"}`}>
                                                {item.itens?.filter(i => i.ganhou).length || 0} / {item._count?.itens || 0}
                                            </span>
                                        </td>
                                        <td><span className="badge bg-secondary">{item._count?.ordens || 0}</span></td>
                                        <td className="text-end">
                                            <Link href={`/licitacoes/${item.id}`} className="btn btn-sm btn-outline-info me-1"><Eye size={14} /></Link>
                                            <button className="btn btn-sm btn-outline-primary me-1" onClick={(e) => { e.preventDefault(); openEdit(item); }}><Pencil size={14} /></button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.preventDefault(); handleDelete(item.id); }}><Trash2 size={14} /></button>
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
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editing ? "Editar Licitação" : "Nova Licitação"}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">{error}</div>}
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nº Processo *</label>
                                        <input className="form-control" value={form.numeroProcesso} onChange={(e) => setForm({ ...form, numeroProcesso: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Órgão</label>
                                        <input className="form-control" value={form.orgaoNome} onChange={(e) => setForm({ ...form, orgaoNome: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Modalidade</label>
                                        <select className="form-select" value={form.modalidade} onChange={(e) => setForm({ ...form, modalidade: e.target.value })}>
                                            <option>Pregão Eletrônico</option>
                                            <option>Pregão Presencial</option>
                                            <option>Concorrência</option>
                                            <option>Tomada de Preços</option>
                                            <option>Convite</option>
                                            <option>Dispensa</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Data de Abertura *</label>
                                        <input type="date" className="form-control" value={form.dataAbertura} onChange={(e) => setForm({ ...form, dataAbertura: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Valor Total Estimado (R$)</label>
                                        <input type="number" step="0.01" className="form-control" value={form.valorTotalEstimado} onChange={(e) => setForm({ ...form, valorTotalEstimado: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            <option value="EM_ANDAMENTO">Em Andamento</option>
                                            <option value="CONCLUIDA">Concluída</option>
                                            <option value="CANCELADA">Cancelada</option>
                                        </select>
                                    </div>

                                    <div className="col-12">
                                        <hr />
                                        <div className="card bg-light border-dashed p-3 mb-3">
                                            <div className="text-center">
                                                <h6>📥 Importação por IA (Ata de Itens Ganhos)</h6>
                                                <p className="small text-muted mb-3">Selecione o PDF da ata para extração automática dos itens</p>
                                                <input 
                                                    type="file" 
                                                    className="form-control mb-2" 
                                                    accept=".pdf" 
                                                    onChange={handleAtaUpload}
                                                    disabled={isProcessing}
                                                />
                                                {isProcessing && (
                                                    <div className="d-flex align-items-center justify-content-center mt-2 text-primary">
                                                        <div className="spinner-border spinner-border-sm me-2" />
                                                        <span>IA processando documento...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6>Itens Identificados ({form.itens.length})</h6>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setForm({ ...form, itens: [...form.itens, { descricao: "", quantidade: 1, valorUnitario: 0 }] })}>+ Adicionar Manualmente</button>
                                        </div>
                                        <div className="table-responsive" style={{ maxHeight: '200px' }}>
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Descrição</th>
                                                        <th style={{ width: 80 }}>Qtd</th>
                                                        <th style={{ width: 120 }}>Unit. (R$)</th>
                                                        <th style={{ width: 40 }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.itens.map((it, idx) => (
                                                        <tr key={idx}>
                                                            <td><input className="form-control form-control-sm" value={it.descricao} onChange={(e) => {
                                                                const ni = [...form.itens]; ni[idx].descricao = e.target.value; setForm({ ...form, itens: ni });
                                                            }} required /></td>
                                                            <td><input type="number" className="form-control form-control-sm" value={it.quantidade} onChange={(e) => {
                                                                const ni = [...form.itens]; ni[idx].quantidade = parseInt(e.target.value) || 0; setForm({ ...form, itens: ni });
                                                            }} required /></td>
                                                            <td><input type="number" step="0.01" className="form-control form-control-sm" value={it.valorUnitario} onChange={(e) => {
                                                                const ni = [...form.itens]; ni[idx].valorUnitario = parseFloat(e.target.value) || 0; setForm({ ...form, itens: ni });
                                                            }} required /></td>
                                                            <td><button type="button" className="btn btn-sm btn-text text-danger" onClick={() => {
                                                                const ni = form.itens.filter((_, i) => i !== idx); setForm({ ...form, itens: ni });
                                                            }}>✕</button></td>
                                                        </tr>
                                                    ))}
                                                    {form.itens.length === 0 && <tr><td colSpan={4} className="text-center text-muted small">Nenhum item adicionado</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
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
