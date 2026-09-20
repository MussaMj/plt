import React, { useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Bell, LogOut, MapPin, Wrench } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { Pothole, ReportRow, mapReportRow } from '../types';
import { getCategoryLabel } from '../categories';
import PotholeDetails from './PotholeDetails';

interface TechnicianDashboardProps {
    session: Session;
    technicianName: string;
}

const statusLabel: Record<string, string> = {
    reported: 'Pendente',
    in_repair: 'Em Reparação',
    repaired: 'Resolvido',
};

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ session, technicianName }) => {
    const [assignments, setAssignments] = useState<Pothole[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selected, setSelected] = useState<Pothole | null>(null);

    const fetchAssignments = useCallback(async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('assigned_technician_id', session.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error loading assignments:', error);
            setLoading(false);
            return;
        }
        setAssignments((data as ReportRow[]).map(mapReportRow));
        setLoading(false);
    }, [session.user.id]);

    const fetchUnreadCount = useCallback(async () => {
        const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('read', false);
        setUnreadCount(count ?? 0);
    }, [session.user.id]);

    useEffect(() => {
        fetchAssignments();
        fetchUnreadCount();

        const channel = supabase
            .channel('technician-assignments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchAssignments)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchUnreadCount)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAssignments, fetchUnreadCount]);

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
                        {unreadCount > 0 && (
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                color: 'var(--accent-danger)', fontWeight: 600, fontSize: '0.85rem',
                            }}>
                                <Bell size={16} /> {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                            </span>
                        )}
                        <div className="user-avatar">{technicianName.substring(0, 2).toUpperCase()}</div>
                        <span>{technicianName}</span>
                    </div>
                </header>

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
                            if (repairImageUrl !== undefined) updateData.repair_image_url = repairImageUrl;
                            const { error } = await supabase.from('reports').update(updateData).eq('id', id);
                            if (error) console.error('Error updating repair:', error);
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
