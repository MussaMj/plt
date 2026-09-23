import React, { useState } from 'react';
import { UserPlus, Mail, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Technician } from '../types';
import { supabase } from '../utils/supabase';
import './UserProfile.css';

interface TeamManagerProps {
    technicians: Technician[];
    managerProvince: string | null;
    /** Called after a change so the parent can refresh its technician list. */
    onChanged: () => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ technicians, managerProvince, onChanged }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke('invite-technician', {
            body: { name: name.trim(), email: email.trim(), province: managerProvince },
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });

        setLoading(false);

        if (error || data?.error) {
            setMessage({ type: 'error', text: data?.error || error?.message || 'Não foi possível convidar o técnico.' });
            return;
        }

        setMessage({ type: 'success', text: `Convite enviado para ${email}.` });
        setName('');
        setEmail('');
        onChanged();
    };

    const updateTechnician = async (id: string, patch: { active?: boolean; name?: string }) => {
        setBusyId(id);
        setMessage(null);
        const { error } = await supabase.from('technicians').update(patch).eq('id', id);
        setBusyId(null);
        if (error) {
            setMessage({ type: 'error', text: 'Não foi possível actualizar o técnico: ' + error.message });
            return;
        }
        if (patch.name) {
            // Reports keep a denormalised copy of the technician's name (the
            // mobile app reads it) — keep it in step with the rename.
            await supabase.from('reports').update({ assigned_technician: patch.name }).eq('assigned_technician_id', id);
        }
        setEditingId(null);
        onChanged();
    };

    return (
        <div className="profile-container">
            <div className="profile-grid">
                <div className="profile-card">
                    <h3>Convidar Técnico</h3>
                    <p className="card-desc">
                        {managerProvince
                            ? `O técnico fica associado à província ${managerProvince}.`
                            : 'Como gestor nacional, o técnico fica sem província fixa (pode receber reparações de qualquer uma).'}
                        {' '}Recebe um e-mail para definir a própria password.
                    </p>

                    {message && (
                        <div className={`profile-alert ${message.type}`}>
                            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleInvite} className="profile-form">
                        <div className="input-group">
                            <label htmlFor="tech-name"><User size={14} /> Nome</label>
                            <input
                                id="tech-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome completo do técnico"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="tech-email"><Mail size={14} /> E-mail institucional</label>
                            <input
                                id="tech-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tecnico@conselhomunicipal.gov.mz"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? <Loader2 className="spinner" size={18} /> : (
                                <><UserPlus size={16} style={{ marginRight: '0.5rem' }} /> Convidar Técnico</>
                            )}
                        </button>
                    </form>
                </div>

                <div className="profile-card">
                    <h3>Técnicos ({technicians.length})</h3>
                    <p className="card-desc">Equipa disponível para atribuição de reparações.</p>
                    {technicians.length === 0 ? (
                        <p className="empty-state">Ainda não convidou nenhum técnico.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {technicians.map(t => (
                                <div
                                    key={t.id}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.85rem 1rem', borderRadius: '10px',
                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                        opacity: t.active ? 1 : 0.7,
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {editingId === t.id ? (
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                                autoFocus
                                            />
                                        ) : (
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                                        )}
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {t.email}{t.province ? ` · ${t.province}` : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        {editingId === t.id ? (
                                            <>
                                                <button
                                                    className="toggle-btn"
                                                    disabled={busyId === t.id || !editName.trim()}
                                                    onClick={() => updateTechnician(t.id, { name: editName.trim() })}
                                                >
                                                    Guardar
                                                </button>
                                                <button className="toggle-btn" onClick={() => setEditingId(null)}>Cancelar</button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="toggle-btn"
                                                    onClick={() => { setEditingId(t.id); setEditName(t.name); }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="toggle-btn"
                                                    disabled={busyId === t.id}
                                                    onClick={() => updateTechnician(t.id, { active: !t.active })}
                                                    title={t.active ? 'Impede o técnico de aceder ao portal' : 'Volta a dar acesso ao técnico'}
                                                >
                                                    {t.active ? 'Desactivar' : 'Reactivar'}
                                                </button>
                                            </>
                                        )}
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '999px',
                                            color: t.active ? 'var(--accent-success)' : 'var(--text-secondary)',
                                            background: t.active ? 'rgba(22, 163, 74, 0.12)' : 'var(--bg-primary)',
                                        }}>
                                            {t.active ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManager;
