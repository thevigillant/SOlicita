"use client";

import AdminLayout from "@/components/AdminLayout";
import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Pencil, ClipboardList, CircleDollarSign, Package, Trophy, Check } from "lucide-react";
import Link from "next/link";

interface Item {
    id: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    ganhou: boolean;
}

interface Ordem {
    id: string;
    numeroOF: string;
    status: string;
    valorTotal: number;
}

interface Licitacao {
    id: string;
    numeroProcesso: string;
    orgaoNome?: string;
    modalidade: string;
    dataAbertura: string;
    valorTotalEstimado: number;
    status: string;
    itens: Item[];
    ordens: Ordem[];
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

export default function LicitacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [licitacao, setLicitacao] = useState<Licitacao | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemForm, setItemForm] = useState({ descricao: "", quantidade: 1, valorUnitario: 0 });
    const [editForm, setEditForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);


    const toggleGanhou = async (itemId: string, currentStatus: boolean) => {
        try {
            await fetch(`/api/licitacoes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    itens: [{ id: itemId, ganhou: !currentStatus }] 
                }),
            });
            loadDetail();
        } catch (error) {
            console.error("Error toggling won state:", error);
        }
    };

    const loadDetail = () => {
        fetch(`/api/licitacoes/${id}`)
            .then((r) => r.json())
            .then((d) => { 
                setLicitacao(d); 
                setLoading(false); 
                setEditForm({
                    numeroProcesso: d.numeroProcesso,
                    orgaoNome: d.orgaoNome || "",
                    modalidade: d.modalidade,
                    dataAbertura: d.dataAbertura.split("T")[0],
                    valorTotalEstimado: d.valorTotalEstimado,
                    status: d.status
                });
            });
    };

    useEffect(() => { loadDetail(); }, [id]);

    const handleAddItem = async () => {
        setLoading(true);
        await fetch(`/api/licitacoes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                itens: [itemForm] 
            }),
        });
        loadDetail();
        setShowItemModal(false);
        setItemForm({ descricao: "", quantidade: 1, valorUnitario: 0 });
    };

    if (loading) return (
        <AdminLayout title="Licitação">
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        </AdminLayout>
    );

    if (!licitacao) return (
        <AdminLayout title="Licitação">
            <div className="alert alert-danger">Licitação não encontrada.</div>
        </AdminLayout>
    );

    const totalItens = licitacao.itens.reduce((sum, i) => sum + i.quantidade * i.valorUnitario, 0);
    const itensGanhos = licitacao.itens.filter((i) => i.ganhou);
    const totalGanho = itensGanhos.reduce((sum, i) => sum + i.quantidade * i.valorUnitario, 0);

    const statusMap: Record<string, string> = {
        EM_ANDAMENTO: "primary",
        CONCLUIDA: "success",
        CANCELADA: "danger",
    };

    return (
        <AdminLayout title={`Licitação ${licitacao.numeroProcesso}`} subtitle={licitacao.orgaoNome}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <Link href="/licitacoes" className="btn btn-sm btn-outline-secondary">← Voltar para Lista</Link>
                <div className="d-flex gap-2">
                    {itensGanhos.length > 0 && (
                        <Link href="/atas" className="btn btn-sm btn-outline-success d-flex align-items-center gap-2"><FileText size={14} /> Ver Atas</Link>
                    )}
                    <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2" onClick={() => setShowEditModal(true)}><Pencil size={14} /> Editar Licitação</button>
                </div>
            </div>

            {/* Info card */}
            <div className="card mb-4 shadow-sm border-0">
                <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">Informações Gerais</h5>
                    <span className={`badge bg-${statusMap[licitacao.status] || "secondary"} px-3 py-2`}>
                        {licitacao.status.replace("_", " ")}
                    </span>
                </div>
                <div className="card-body">
                    <div className="row g-4">
                        <div className="col-md-3">
                            <small className="text-muted d-block text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem'}}>Nº Processo</small>
                            <span className="fs-5 fw-bold text-dark">{licitacao.numeroProcesso}</span>
                        </div>
                        <div className="col-md-3">
                            <small className="text-muted d-block text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem'}}>Órgão</small>
                            <span className="fs-5 text-dark text-truncate d-block" title={licitacao.orgaoNome}>{licitacao.orgaoNome || "—"}</span>
                        </div>
                        <div className="col-md-3">
                            <small className="text-muted d-block text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem'}}>Modalidade</small>
                            <span className="fs-5 text-dark">{licitacao.modalidade}</span>
                        </div>
                        <div className="col-md-3">
                            <small className="text-muted d-block text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem'}}>Abertura</small>
                            <span className="fs-5 text-dark fw-bold">{fmtDate(licitacao.dataAbertura)}</span>
                        </div>
                    </div>
                    <hr className="my-4" />
                    <div className="row g-4">
                        <div className="col-md-4">
                            <small className="text-muted d-block text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem'}}>Valor Estimado</small>
                            <span className="fs-4 fw-bold text-primary">{fmt(licitacao.valorTotalEstimado)}</span>
                        </div>
                        <div className="col-md-4">
                            <small className="text-muted d-block text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem'}}>Total em Itens</small>
                            <span className="fs-4 fw-bold text-info">{fmt(totalItens)}</span>
                        </div>
                        <div className="col-md-4">
                            <small className="text-muted d-block text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem'}}>Status do Processo</small>
                            <div>
                                {licitacao.status === "EM_ANDAMENTO" && <span className="text-primary fw-bold">● Processo em fase de lances</span>}
                                {licitacao.status === "CONCLUIDA" && <span className="text-success fw-bold d-flex align-items-center gap-1"><Check size={16} /> Homologado / Concluído</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="stat-card">
                        <div className="stat-icon blue"><ClipboardList size={24} /></div>
                        <div className="stat-value">{licitacao.itens.length}</div>
                        <div className="stat-label">Total de Itens</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stat-card">
                        <div className="stat-icon green"><Trophy size={24} /></div>
                        <div className="stat-value">{itensGanhos.length}</div>
                        <div className="stat-label">Itens Ganhos</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stat-card">
                        <div className="stat-icon yellow"><CircleDollarSign size={24} /></div>
                        <div className="stat-value" style={{ fontSize: "16px" }}>{fmt(totalGanho)}</div>
                        <div className="stat-label">Valor Ganho</div>
                    </div>
                </div>
            </div>

            {/* Itens */}
            <div className="card mb-4 shadow-sm border-0">
                <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">Itens da Licitação</h5>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowItemModal(true)}>
                        + Adicionar Novo Item
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{width: '60px'}}>#</th>
                                <th>Descrição do Item</th>
                                <th className="text-center">Qtd</th>
                                <th className="text-end">Unitário</th>
                                <th className="text-end">Total</th>
                                <th className="text-center" style={{width: '180px'}}>Status</th>
                            </tr>
                        </thead>


                        <tbody>
                            {licitacao.itens.length === 0 ? (
                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon"><Package size={32} className="text-secondary" /></div><p>Sem itens cadastrados</p></div></td></tr>
                            ) : licitacao.itens.map((item, i) => (
                                <tr key={item.id}>
                                    <td>{i + 1}</td>
                                    <td>{item.descricao}</td>
                                    <td>{item.quantidade}</td>
                                    <td>{fmt(item.valorUnitario)}</td>
                                    <td>{fmt(item.quantidade * item.valorUnitario)}</td>
                                    <td>
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                checked={item.ganhou}
                                                onChange={() => toggleGanhou(item.id, item.ganhou)}
                                            />
                                            <span className={`badge bg-${item.ganhou ? "success" : "secondary"}`} style={{cursor: "pointer"}} onClick={() => toggleGanhou(item.id, item.ganhou)}>
                                                {item.ganhou ? "Ganhou" : "Perdeu / Pendente"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">Ordens de Fornecimento ({licitacao.ordens.length})</h5>
                    <Link href={`/ordens?licitacaoId=${licitacao.id}`} className="btn btn-sm btn-primary">+ Nova OF</Link>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Nº OF</th>
                                <th>Status</th>
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {licitacao.ordens.length === 0 ? (
                                <tr><td colSpan={3}><div className="empty-state"><div className="empty-state-icon"><Package size={32} className="text-secondary" /></div><p>Sem ordens de fornecimento</p></div></td></tr>
                            ) : licitacao.ordens.map((o) => (
                                <tr key={o.id}>
                                    <td><strong>{o.numeroOF}</strong></td>
                                    <td><span className="badge bg-info">{o.status}</span></td>
                                    <td>{fmt(o.valorTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Novo Item Modal */}
            {showItemModal && (
                <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Adicionar Item à Licitação</h5>
                                <button className="btn-close" onClick={() => setShowItemModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Descrição *</label>
                                    <input className="form-control" value={itemForm.descricao} onChange={e => setItemForm({...itemForm, descricao: e.target.value})} required placeholder="Ex: Cadeira de Escritório" />
                                </div>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <label className="form-label">Quantidade *</label>
                                        <input type="number" className="form-control" value={itemForm.quantidade} onChange={e => setItemForm({...itemForm, quantidade: parseInt(e.target.value) || 1})} required />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label">Valor Unitário (R$)</label>
                                        <input type="number" step="0.01" className="form-control" value={itemForm.valorUnitario} onChange={e => setItemForm({...itemForm, valorUnitario: parseFloat(e.target.value) || 0})} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleAddItem}>Adicionar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Licitação Modal */}
            {showEditModal && editForm && (
                <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Editar Licitação</h5>
                                <button className="btn-close" onClick={() => setShowEditModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nº Processo *</label>
                                        <input className="form-control" value={editForm.numeroProcesso} onChange={e => setEditForm({...editForm, numeroProcesso: e.target.value})} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Órgão</label>
                                        <input className="form-control" value={editForm.orgaoNome} onChange={e => setEditForm({...editForm, orgaoNome: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Modalidade</label>
                                        <select className="form-select" value={editForm.modalidade} onChange={e => setEditForm({...editForm, modalidade: e.target.value})}>
                                            <option>Pregão Eletrônico</option>
                                            <option>Pregão Presencial</option>
                                            <option>Concorrência</option>
                                            <option>Convite</option>
                                            <option>Dispensa</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Data Abertura</label>
                                        <input type="date" className="form-control" value={editForm.dataAbertura} onChange={e => setEditForm({...editForm, dataAbertura: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                            <option value="EM_ANDAMENTO">Em Andamento</option>
                                            <option value="CONCLUIDA">Concluída</option>
                                            <option value="CANCELADA">Cancelada</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={async () => {
                                    setSaving(true);
                                    await fetch(`/api/licitacoes/${id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(editForm)
                                    });
                                    setSaving(false);
                                    setShowEditModal(false);
                                    loadDetail();
                                }} disabled={saving}>Salvar Alterações</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

const statusMap: Record<string, string> = {
    EM_ANDAMENTO: "primary",
    CONCLUIDA: "success",
    CANCELADA: "danger",
};
