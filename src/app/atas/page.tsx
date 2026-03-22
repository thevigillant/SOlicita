"use client";

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState, useRef } from "react";
import { FileText, RefreshCw, BookOpen, Upload, Folder, FileArchive } from "lucide-react";

interface Item {
    id: string;
    descricao: string;
    ganhou: boolean;
}

interface Ata {
    id: string;
    pdfUrl: string;
    dataAssinatura?: string;
    dataVigencia?: string;
    updatedAt: string;
}

interface Licitacao {
    id: string;
    numeroProcesso: string;
    orgaoNome?: string;
    modalidade: string;
    dataAbertura: string;
    status: string;
    itens: Item[];
    ata?: Ata;
}

export default function AtasPage() {
    const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [filterWon, setFilterWon] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterWon) params.append("onlyWon", "true");
            
            const res = await fetch(`/api/atas?${params.toString()}`);
            const data = await res.json();
            setLicitacoes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading atas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filterWon]);

    const handleUploadClick = (id: string) => {
        setSelectedId(id);
        fileInputRef.current?.click();
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedId) return;

        setUploading(selectedId);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("licitacaoId", selectedId);

        try {
            const res = await fetch("/api/atas", { method: "POST", body: formData });
            if (res.ok) {
                alert("Ata enviada com sucesso!");
                load();
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao enviar ata");
            }
        } catch (err) {
            alert("Erro na conexão");
        } finally {
            setUploading(null);
            setSelectedId(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSaveDates = async (ataId: string, dataAssinatura: string, dataVigencia: string) => {
        try {
            const res = await fetch("/api/atas", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: ataId, dataAssinatura, dataVigencia })
            });
            if(res.ok) {
                alert("Datas atualizadas!");
                load();
            }
        } catch(e) {
            alert("Erro ao salvar");
        }
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

    return (
        <AdminLayout title="Atas / Itens Ganhos" subtitle="Gerenciamento de atas de licitações ganhas">
            <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: "none" }} accept="application/pdf" />
            
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check form-switch">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="filterWon" 
                        checked={filterWon} 
                        onChange={(e) => setFilterWon(e.target.checked)} 
                    />
                    <label className="form-check-label" htmlFor="filterWon">
                        Mostrar apenas licitações com itens ganhos
                    </label>
                </div>
                <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={load}><RefreshCw size={14} /> Atualizado</button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Processo</th>
                                <th>Órgão</th>
                                <th>Abertura</th>
                                <th>Status</th>
                                <th className="text-center">Itens Ganhos</th>
                                <th>PDF da Ata</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
                            ) : licitacoes.length === 0 ? (
                                <tr><td colSpan={7}><div className="empty-state py-5"><div className="empty-state-icon text-secondary mb-3"><FileText size={48} /></div><p className="mt-2 text-muted">Nenhuma licitação encontrada neste filtro</p></div></td></tr>
                            ) : licitacoes.map((l) => {
                                const wonItems = l.itens.filter(i => i.ganhou).length;
                                return (
                                    <tr key={l.id} className={l.ata ? "table-success-light" : ""}>
                                        <td><strong className="text-primary">{l.numeroProcesso}</strong></td>
                                        <td>{l.orgaoNome || "—"}</td>
                                        <td>{fmtDate(l.dataAbertura)}</td>
                                        <td>
                                            <span className={`badge rounded-pill bg-${l.status === 'CONCLUIDA' ? 'success' : 'primary'}`}>
                                                {l.status === 'EM_ANDAMENTO' ? 'Em Andamento' : l.status}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`badge ${wonItems > 0 ? "bg-success text-dark" : "bg-dark text-secondary border border-secondary"}`}>
                                                {wonItems}
                                            </span>
                                        </td>
                                        <td>
                                            {l.ata ? (
                                                <div className="d-flex flex-column gap-2">
                                                    <a href={l.ata.pdfUrl} target="_blank" className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center gap-2">
                                                        <BookOpen size={14} /> Ver Ata
                                                    </a>
                                                    <div style={{fontSize: "12px", background: "rgba(0,0,0,0.1)", padding: "4px", borderRadius: "4px"}}>
                                                        <label className="text-muted d-block" style={{fontSize: "10px"}}>Assinatura / Vigência</label>
                                                        <input type="date" className="form-control form-control-sm mb-1 bg-dark text-light border-secondary" defaultValue={l.ata.dataAssinatura?.split("T")[0]} onBlur={(e) => handleSaveDates(l.ata!.id, e.target.value, l.ata!.dataVigencia || "")} />
                                                        <input type="date" className="form-control form-control-sm bg-dark text-light border-secondary" defaultValue={l.ata.dataVigencia?.split("T")[0]} onBlur={(e) => handleSaveDates(l.ata!.id, l.ata!.dataAssinatura || "", e.target.value)} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted small">Nenhum PDF</span>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            <button 
                                                className={`btn btn-sm ${l.ata ? 'btn-outline-primary' : 'btn-primary'}`}
                                                onClick={() => handleUploadClick(l.id)}
                                                disabled={uploading === l.id}
                                            >
                                                {uploading === l.id ? "Enviando..." : (l.ata ? <span className="d-flex align-items-center gap-2"><RefreshCw size={14} /> Atualizar</span> : <span className="d-flex align-items-center gap-2"><Upload size={14} /> Enviar PDF</span>)}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="mt-5 p-4 card shadow-sm">
                <h5 className="text-primary d-flex align-items-center gap-2" style={{fontFamily: "Orbitron"}}><Folder size={20} /> Importação Manual (Pasta src/app/ATAS)</h5>
                <hr className="border-secondary" />
                <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                        <div className="bg-dark p-3 rounded-circle shadow-sm border border-info text-info">
                            <FileArchive size={32} />
                        </div>
                    </div>
                    <div className="flex-grow-1 ms-4">
                        <p className="mb-1 text-info">Existem arquivos legados na pasta externa do projeto que ainda não estão vinculados a processos:</p>
                        <ul className="list-unstyled mb-2 text-light">
                             <li>• <strong className="text-primary">atadedelta.pdf</strong> (Ata de Itens Ganhos)</li>
                        </ul>
                        <a href="/ATAS/atadedelta.pdf" target="_blank" className="btn btn-sm btn-outline-info">
                            Visualizar Ata Importada
                        </a>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .table-success-light {
                    background-color: rgba(0, 240, 255, 0.05) !important;
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #6c757d;
                }
            `}</style>
        </AdminLayout>
    );
}
