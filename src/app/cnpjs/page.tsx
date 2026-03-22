"use client";

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";

interface Cnpj {
    id: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    inscricaoEstadual?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
}

const empty: Omit<Cnpj, "id"> = {
    razaoSocial: "", nomeFantasia: "", cnpj: "", inscricaoEstadual: "", telefone: "", email: "", endereco: "",
};

export default function CnpjsPage() {
    const [items, setItems] = useState<Cnpj[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Cnpj | null>(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [fetchingCnpj, setFetchingCnpj] = useState(false);

    const load = async (p = 1, s = search) => {
        setLoading(true);
        const res = await fetch(`/api/cnpjs?page=${p}&search=${encodeURIComponent(s)}`);
        const data = await res.json();
        setItems(data.cnpjs || []);
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

    const openEdit = (item: Cnpj) => {
        setEditing(item);
        setForm({ razaoSocial: item.razaoSocial, nomeFantasia: item.nomeFantasia, cnpj: item.cnpj, inscricaoEstadual: item.inscricaoEstadual || "", telefone: item.telefone || "", email: item.email || "", endereco: item.endereco || "" });
        setError("");
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        const method = editing ? "PUT" : "POST";
        const url = editing ? `/api/cnpjs/${editing.id}` : "/api/cnpjs";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Erro ao salvar"); }
        else { setShowModal(false); load(page); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este CNPJ?")) return;
        await fetch(`/api/cnpjs/${id}`, { method: "DELETE" });
        load(page);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        load(1, search);
    };

    const formatCnpj = (v: string) => v.replace(/\D/g, "").replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

    const fetchCnpjData = async (cnpjStr: string) => {
        const numbers = cnpjStr.replace(/\D/g, "");
        if (numbers.length !== 14) return;
        setFetchingCnpj(true);
        try {
            const res = await fetch(`https://publica.cnpj.ws/cnpj/${numbers}`);
            if (!res.ok) throw new Error("CNPJ não encontrado");
            const data = await res.json();
            const est = data.estabelecimento || {};
            const sigla = est.estado?.sigla || "";
            const cidade = est.cidade?.nome || "";
            const num = est.numero || "";
            const end = `${est.tipo_logradouro || ""} ${est.logradouro || ""}, ${num} - ${cidade}/${sigla}`.trim();
            const ie = est.inscricoes_estaduais && est.inscricoes_estaduais.length > 0 ? est.inscricoes_estaduais[0].inscricao_estadual : "";

            setForm(prev => ({
                ...prev,
                razaoSocial: data.razao_social || prev.razaoSocial,
                nomeFantasia: est.nome_fantasia || prev.nomeFantasia,
                inscricaoEstadual: ie || prev.inscricaoEstadual,
                telefone: est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : prev.telefone,
                email: est.email || prev.email,
                endereco: end.length > 5 ? end : prev.endereco,
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingCnpj(false);
        }
    };

    return (
        <AdminLayout title="CNPJs / Fornecedores" subtitle={`${total} registros encontrados`}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <form className="d-flex gap-2" onSubmit={handleSearch} style={{ maxWidth: 380 }}>
                    <input className="form-control" placeholder="Buscar por razão social, CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button type="submit" className="btn btn-primary px-3">🔍</button>
                </form>
                <button id="btn-novo-cnpj" className="btn btn-primary" onClick={openCreate}>
                    + Novo CNPJ
                </button>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Razão Social</th>
                                <th>Nome Fantasia</th>
                                <th>CNPJ</th>
                                <th>Telefone</th>
                                <th>E-mail</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon"><Building2 size={48} className="text-secondary" /></div><p>Nenhum CNPJ cadastrado</p></div></td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.razaoSocial}</strong></td>
                                    <td>{item.nomeFantasia}</td>
                                    <td><code>{formatCnpj(item.cnpj)}</code></td>
                                    <td>{item.telefone || "—"}</td>
                                    <td>{item.email || "—"}</td>
                                    <td className="text-end">
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
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                                    <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                                        <button className="page-link" onClick={() => { setPage(p); load(p); }}>{p}</button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editing ? "Editar CNPJ" : "Novo CNPJ"}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">{error}</div>}
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">CNPJ *</label>
                                        <input
                                            className="form-control"
                                            value={form.cnpj}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setForm({ ...form, cnpj: val });
                                                if (val.replace(/\D/g, "").length === 14 && !editing) {
                                                    fetchCnpjData(val);
                                                }
                                            }}
                                            placeholder="Apenas números"
                                            required
                                        />
                                        {fetchingCnpj && <small className="text-primary mt-1 d-block">Buscando dados na Receita...</small>}
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Inscrição Estadual</label>
                                        <input className="form-control" value={form.inscricaoEstadual} onChange={(e) => setForm({ ...form, inscricaoEstadual: e.target.value })} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Telefone</label>
                                        <input className="form-control" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Razão Social *</label>
                                        <input className="form-control" value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Nome Fantasia</label>
                                        <input className="form-control" value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">E-mail</label>
                                        <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Endereço</label>
                                        <input className="form-control" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
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
