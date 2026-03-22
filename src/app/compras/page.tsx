"use client";

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { Package, CheckCircle2 } from "lucide-react";

interface OrdemCompra {
    id: string;
    fornecedor: string;
    valorTotalCompra: number;
    status: string;
    createdAt: string;
    ordemFornecimento?: {
        numeroOF: string;
        licitacao: {
            numeroProcesso: string;
        }
    };
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function ComprasPage() {
    const [ordens, setOrdens] = useState<OrdemCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [formParams, setFormParams] = useState({ fornecedor: "", valorTotalCompra: "" });

    const load = () => {
        setLoading(true);
        fetch("/api/compras")
            .then(res => res.json())
            .then(data => { setOrdens(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load() }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formParams)
            });
            if (res.ok) {
                alert("Ordem de compra registrada com sucesso!");
                setFormParams({ fornecedor: "", valorTotalCompra: "" });
                load();
            } else {
                alert("Erro ao criar ordem.");
            }
        } catch {
            alert("Erro de conexao");
        }
    };

    const atualizarStatus = async (id: string, novoStatus: string) => {
        try {
            await fetch("/api/compras", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: novoStatus })
            });
            load();
        } catch {}
    };

    return (
        <AdminLayout title="Compras e Suprimentos" subtitle="Gestão de pedidos junto aos fornecedores">
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-4">
                    <div className="card shadow-sm border-0 h-100 p-3">
                        <h5 className="mb-3 text-primary" style={{fontFamily: "Orbitron"}}>Nova Solicitação ao Fornecedor</h5>
                        <form onSubmit={handleCreate}>
                            <div className="mb-3">
                                <label className="form-label text-muted">Nome do Fornecedor / Fábrica</label>
                                <input required type="text" className="form-control" value={formParams.fornecedor} onChange={(e) => setFormParams({...formParams, fornecedor: e.target.value})} placeholder="Ex: Dell Technologies" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-muted">Valor da Compra (Custo Real R$)</label>
                                <input required type="number" step="0.01" className="form-control" value={formParams.valorTotalCompra} onChange={(e) => setFormParams({...formParams, valorTotalCompra: e.target.value})} placeholder="3500.00" />
                            </div>
                            <button type="submit" className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2" style={{fontFamily: "Orbitron"}}>Enviar Ordem <Package size={18} /></button>
                        </form>
                    </div>
                </div>

                <div className="col-12 col-lg-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>Histórico de Suprimentos</span>
                            <button className="btn btn-sm btn-outline-secondary" onClick={load}>Recarregar</button>
                        </div>
                        <div className="table-responsive p-0">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Fornecedor</th>
                                        <th>Custo Compra</th>
                                        <th>Destino (OF Pública)</th>
                                        <th>Status do Fornecedor</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
                                    ) : ordens.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-5 text-muted">Ainda não há suprimentos comprados.</td></tr>
                                    ) : ordens.map(o => (
                                        <tr key={o.id}>
                                            <td><strong>{o.fornecedor}</strong><div style={{fontSize: "10px", color:"var(--primary)"}}>{new Date(o.createdAt).toLocaleDateString()}</div></td>
                                            <td className="text-danger fw-bold">{fmt(o.valorTotalCompra)}</td>
                                            <td>
                                                {o.ordemFornecimento ? (
                                                    <><span className="badge bg-secondary">{o.ordemFornecimento.numeroOF}</span> <br/><span style={{fontSize: "10px", opacity: 0.7}}>Processo: {o.ordemFornecimento.licitacao.numeroProcesso}</span></>
                                                ) : <span className="text-muted" style={{fontSize: "11px"}}>Avulsa (Estoque Central)</span>}
                                            </td>
                                            <td>
                                                <div className="dropdown">
                                                  <button className={`btn btn-sm ${o.status === 'SOLICITADA' ? 'btn-outline-warning' : o.status === 'ENTREGUE' ? 'btn-success' : 'btn-outline-primary'} dropdown-toggle`} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    {o.status}
                                                  </button>
                                                  <ul className="dropdown-menu">
                                                    <li><a className="dropdown-item" onClick={() => atualizarStatus(o.id, 'SOLICITADA')}>Solicitada</a></li>
                                                    <li><a className="dropdown-item" onClick={() => atualizarStatus(o.id, 'PAGA')}>Paga / Confirmada</a></li>
                                                    <li><a className="dropdown-item" onClick={() => atualizarStatus(o.id, 'EM_TRANSITO')}>Em Trânsito para Empresa</a></li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li><a className="dropdown-item text-success" onClick={() => atualizarStatus(o.id, 'ENTREGUE')}>Entregue no Almoxarifado</a></li>
                                                  </ul>
                                                </div>
                                            </td>
                                            <td>
                                                {o.status === 'ENTREGUE' && <span className="text-success"><CheckCircle2 size={20} /></span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
