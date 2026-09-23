import React, { useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Bell, CheckCheck, LogOut, MapPin, Wrench } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { Pothole, ReportRow, mapReportRow } from '../types';
import { getCategoryLabel } from '../categories';
import PotholeDetails from './PotholeDetails';

interface TechnicianDashboardProps {
    session: Session;
    technicianName: string;
}

interface InboxItem {
    id: string;
    title: string;
    body: string;
    read: boolean;
    reportId: string | null;
    createdAt: Date;
}

const statusLabel: Record<string, string> = {
    reported: 'Pendente',
    in_repair: 'Em Reparação',
    repaired: 'Resolvido',
};

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ session, technicianName }) => {
    const [assignments, setAssignments] = useState<Pothole[]>([]);
    const [inbox, setInbox] = useState<InboxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Pothole | null>(null);

    const unreadCount = inbox.filter(i => !i.read).length;

    const fetchAssignments = useCallback(async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('assigned_technician_id', session.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error loading assignments:', error);
            setLoadError('Não foi possível carregar as suas reparações.');
            setLoading(false);
            return;
        }
        setLoadError(null);
        setAssignments((data as ReportRow[]).map(mapReportRow));
        setLoading(false);
    }, [session.user.id]);

    const fetchInbox = useCallback(async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, title, body, read, pothole_id, created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) {
            console.error('Error loading inbox:', error);
            return;
        }
        setInbox((data ?? []).map((n: any) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            read: n.read,
            reportId: n.pothole_id,
            createdAt: new Date(n.created_at),
        })));
    }, [session.user.id]);

    useEffect(() => {
        fetchAssignments();
        fetchInbox();

        const channel = supabase
            .channel('technician-portal')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchAssignments)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchInbox)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAssignments, fetchInbox]);

    const markRead = async (ids: string[]) => {
        if (ids.length === 0) return;
        setInbox(prev => prev.map(i => (ids.includes(i.id) ? { ...i, read: true } : i)));
        const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids);
        if (error) {
            console.error('Error marking notifications as read:', error);
            fetchInbox();
        }
    };

    const openFromInbox = (item: InboxItem) => {
        markRead(item.read ? [] : [item.id]);
        const report = assignments.find(a => a.id === item.reportId);
        if (report) setSelected(report);
    };

    return (
        <div className="admin-container">
            <aside className="sidebar">
                <div className="logo">
                    <div className="logo-icon">OP</div>
                    <h1>Portal <span>do Técnico</span></h1>
                </div>
                <nav>
                    <div className="nav-item active" style={{ cursor: 'default' }}>
                        <Wrench size={20} /> As Minhas Reparações
                    </div>
                    <div className="sidebar-footer">
                        <button
                            className="nav-item utility"
                            onClick={() => supabase.auth.signOut()}
                            style={{ color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                            <LogOut size={18} /> Sair
                        </button>
                    </div>
                </nav>
            </aside>

            <main className="content">
                <header>
                    <div className="header-info">
                        <h2>As Minhas Reparações</h2>
                        <p>Reparações que lhe foram atribuídas pelo gestor</p>
                    </div>
                    <div className="user-profile">
                        <div className="user-avatar">{technicianName.substring(0, 2).toUpperCase()}</div>
                        <span>{technicianName}</span>
                    </div>
                </header>

                {loadError && (
                    <div className="login-error" style={{ marginBottom: '1rem' }}>
                        <span>{loadError}</span>
                    </div>
                )}

                <section className="table-section" style={{ marginBottom: '1.5rem' }}>
                    <div className="table-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={18} /> Caixa de Entrada
                            {unreadCount > 0 && (
                                <span style={{
                                    background: 'var(--accent-danger)', color: 'white', borderRadius: '999px',
                                    fontSize: '0.75rem', padding: '0.1rem 0.5rem', fontWeight: 700,
                                }}>
                                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button className="toggle-btn" onClick={() => markRead(inbox.filter(i => !i.read).map(i => i.id))}>
                                <CheckCheck size={14} style={{ marginRight: '0.35rem' }} /> Marcar todas como lidas
                            </button>
                        )}
                    </div>
                    <div className="pothole-list">
                        {inbox.length === 0 ? (
                            <div className="empty-state">Sem notificações.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {inbox.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => openFromInbox(item)}
                                        style={{
                                            textAlign: 'left', cursor: 'pointer', border: 'none',
                                            borderBottom: '1px solid var(--border-color)',
                                            padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                            background: item.read ? 'transparent' : 'rgba(37, 99, 235, 0.06)',
                                        }}
                                    >
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                                            background: item.read ? 'transparent' : 'var(--accent-primary)',
                                        }} />
                                        <span style={{ flex: 1 }}>
                                            <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.title}</strong>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.body}</span>
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                            {item.createdAt.toLocaleString('pt-MZ')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="table-section">
                    <div className="pothole-list">
                        {loading ? (
                            <div className="loading-state">A carregar...</div>
                        ) : assignments.length === 0 ? (
                            <div className="empty-state">Ainda não lhe foi atribuída nenhuma reparação.</div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Localização</th>
                                        <th>Categoria</th>
                                        <th>Estado</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="loc-cell">
                                                    <span className="addressText">{p.address || 'Coord. Geográficas'}</span>
                                                    <span className="descText">{[p.city, p.province].filter(Boolean).join(', ')}</span>
                                                </div>
                                            </td>
                                            <td>{getCategoryLabel(p.category)}</td>
                                            <td>
                                                <span className={`status-badge ${p.status}`}>{statusLabel[p.status]}</span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-view" onClick={() => setSelected(p)} title="Abrir">
                                                        <Wrench size={18} />
                                                    </button>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${p.location.latitude},${p.location.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-view"
                                                        title="Abrir no Google Maps"
                                                    >
                                                        <MapPin size={18} />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                {selected && (
                    <PotholeDetails
                        pothole={selected}
                        onClose={() => setSelected(null)}
                        onUpdateStatus={async (id, status, notes, _technicianId, repairImageUrl) => {
                            const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
                            if (repairImageUrl !== undefined && repairImageUrl !== '') updateData.repair_image_url = repairImageUrl;
                            const { error } = await supabase.from('reports').update(updateData).eq('id', id);
                            if (error) {
                                console.error('Error updating repair:', error);
                                setLoadError('Não foi possível guardar a alteração: ' + error.message);
                                return;
                            }
                            if (notes && notes.trim()) {
                                const { error: noteError } = await supabase.from('report_notes').insert({
                                    report_id: id,
                                    author_id: session.user.id,
                                    author_name: technicianName,
                                    note: notes.trim(),
                                });
                                if (noteError) console.error('Error saving note:', noteError);
                            }
                            fetchAssignments();
                        }}
                        technicians={[]}
                        viewerRole="technician"
                    />
                )}
            </main>
        </div>
    );
};

export default TechnicianDashboard;
