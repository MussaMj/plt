import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './utils/supabase';
import './App.css';

import { Pothole, ReportRow, mapReportRow, ManagerProfile } from './types';
import { Session } from '@supabase/supabase-js';
import { ShieldAlert, LogOut } from 'lucide-react';

import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import PotholeTable from './components/PotholeTable';
import PotholeMap from './components/PotholeMap';
import PotholeDetails from './components/PotholeDetails';
import Login from './components/Login';
import UserProfile from './components/UserProfile';

const PAGE_SIZE = 200;

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<ManagerProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [potholes, setPotholes] = useState<Pothole[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterCity, setFilterCity] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'potholes' | 'profile'>('dashboard');
    const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null);
    const [myTasksOnly, setMyTasksOnly] = useState(false);

    const CURRENT_USER_NAME = session?.user?.user_metadata?.full_name || session?.user?.email || "Admin Central";
    const managerProvince = profile?.province ?? null;

    const fetchReports = useCallback(async (province: string | null) => {
        let query = supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
            .range(0, PAGE_SIZE - 1);

        if (province) query = query.eq('province', province);

        const { data, error } = await query;

        if (error) {
            console.error('Error loading reports:', error);
            setLoading(false);
            return;
        }

        setPotholes((data as ReportRow[]).map(mapReportRow));
        setLoading(false);
    }, []);

    // Auth session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Manager profile / access control — anyone can hold a Supabase Auth
    // session (the mobile app's citizens included), only a profiles row with
    // role='manager' may use this portal.
    useEffect(() => {
        if (!session) {
            setProfile(null);
            setProfileLoading(false);
            return;
        }

        setProfileLoading(true);
        supabase
            .from('profiles')
            .select('id, role, province, name')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error loading profile:', error);
                    setProfile(null);
                } else {
                    setProfile(data as ManagerProfile | null);
                }
                setProfileLoading(false);
            });
    }, [session]);

    const isManager = profile?.role === 'manager';

    useEffect(() => {
        if (!session || !isManager) return;

        fetchReports(managerProvince);

        const channel = supabase
            .channel('reports-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                () => {
                    fetchReports(managerProvince);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchReports, session, isManager, managerProvince]);

    const handleUpdateStatus = async (
        id: string,
        newStatus: string,
        notes?: string,
        technicianName?: string
    ) => {
        try {
            const pothole = potholes.find(p => p.id === id);
            if (!pothole) return;

            const updateData: Record<string, unknown> = {
                status: newStatus,
                updated_at: new Date().toISOString(),
            };

            if (technicianName !== undefined) {
                updateData.assigned_technician = technicianName === "" ? null : technicianName;
            } else if (newStatus === 'in_repair' && !pothole.assignedTechnician) {
                updateData.assigned_technician = CURRENT_USER_NAME;
            }

            const { error } = await supabase
                .from('reports')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error updating status:', error);
                return;
            }

            if (notes && notes.trim()) {
                await handleAddNote(id, notes.trim());
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAddNote = async (reportId: string, note: string) => {
        const { error } = await supabase.from('report_notes').insert({
            report_id: reportId,
            author_id: session?.user.id,
            author_name: CURRENT_USER_NAME,
            note,
        });
        if (error) console.error('Error saving note:', error);
    };

    const stats = useMemo(() => {
        const resolved = potholes.filter(p => p.status === 'repaired').length;
        const pending = potholes.filter(p => p.status === 'reported').length;

        const byCity: Record<string, number> = {};
        potholes.forEach(p => {
            const c = p.city || 'Sem cidade';
            byCity[c] = (byCity[c] || 0) + 1;
        });

        return {
            total: potholes.length,
            resolved,
            pending,
            critical: potholes.filter(p => p.severity === 'high' && p.status !== 'repaired').length,
            cities: Object.entries(byCity).map(([name, count]) => ({ name, count })),
        };
    }, [potholes]);

    const filteredPotholes = useMemo(() => {
        return potholes.filter(p => {
            const matchesSearch = (p.address?.toLowerCase() || p.description.toLowerCase()).includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesMyTasks = !myTasksOnly || p.assignedTechnician === CURRENT_USER_NAME;
            const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
            const matchesCity = filterCity === 'all' || p.city === filterCity;

            let matchesDate = true;
            if (filterDate !== 'all') {
                const now = new Date();
                const createdAt = p.createdAt;
                if (filterDate === 'today') {
                    matchesDate = createdAt.toDateString() === now.toDateString();
                } else if (filterDate === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = createdAt >= weekAgo;
                } else if (filterDate === 'month') {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    matchesDate = createdAt >= monthAgo;
                }
            }

            return matchesSearch && matchesStatus && matchesMyTasks && matchesCategory && matchesCity && matchesDate;
        });
    }, [potholes, searchTerm, filterStatus, filterCategory, filterCity, filterDate, myTasksOnly]);

    const allCategories = useMemo(() => {
        const categories = new Set<string>();
        potholes.forEach(p => { if (p.category) categories.add(p.category); });
        return Array.from(categories).sort();
    }, [potholes]);

    const allCities = useMemo(() => {
        const cities = new Set<string>();
        potholes.forEach(p => { if (p.city) cities.add(p.city); });
        return Array.from(cities).sort();
    }, [potholes]);

    if (!session) {
        return <Login />;
    }

    if (profileLoading) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <p>A verificar acesso...</p>
                </div>
            </div>
        );
    }

    if (!isManager) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo-icon" style={{ background: 'var(--accent-danger)' }}>
                            <ShieldAlert size={22} color="white" />
                        </div>
                        <h2>Acesso Restrito</h2>
                        <p>Esta conta não tem permissão de gestor para aceder ao Portal de Operações.</p>
                    </div>
                    <button
                        className="login-button"
                        onClick={() => supabase.auth.signOut()}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className="content">
                <header>
                    <div className="header-info">
                        <h2>
                            {activeTab === 'dashboard' && 'Visão Geral das Operações'}
                            {activeTab === 'potholes' && 'Painel de Intervenções'}
                            {activeTab === 'map' && 'Mapeamento de Campo'}
                            {activeTab === 'profile' && 'Configurações de Conta'}
                        </h2>
                        <p>
                            {activeTab === 'dashboard' && (managerProvince ? `Monitoramento de ${managerProvince}` : 'Monitoramento nacional de infraestrutura crítica')}
                            {activeTab === 'potholes' && 'Gestão e execução de ordens de serviço'}
                            {activeTab === 'map' && 'Localização geográfica de ocorrências'}
                            {activeTab === 'profile' && 'Gerencie seus dados pessoais e de acesso'}
                        </p>
                    </div>
                    <div
                        className="user-profile clickable"
                        onClick={() => setActiveTab('profile')}
                        title="Ir para o Perfil"
                    >
                        <div className="user-avatar">
                            {CURRENT_USER_NAME.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{CURRENT_USER_NAME}</span>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        <DashboardStats
                            total={stats.total}
                            resolved={stats.resolved}
                            pending={stats.pending}
                            critical={stats.critical}
                            cities={stats.cities}
                        />

                        <div className="dashboard-grid">
                            <div className="recent-activity">
                                <h3>Ocorrências Críticas Prioritárias</h3>
                                <div className="activity-list">
                                    {potholes.filter(p => p.severity === 'high' && p.status !== 'repaired').slice(0, 6).map(p => (
                                        <div key={p.id} className="activity-item" onClick={() => setSelectedPothole(p)}>
                                            <div className="severity-dot high"></div>
                                            <div className="activity-info">
                                                <strong>{p.address || 'Localização Pendente'}</strong>
                                                <span>{p.status === 'reported' ? 'Aguardando Início' : 'Em Execução'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {potholes.filter(p => p.severity === 'high' && p.status !== 'repaired').length === 0 && (
                                        <p className="empty-state">Sem ocorrências críticas pendentes.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'potholes' && (
                    <PotholeTable
                        potholes={filteredPotholes}
                        loading={loading}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filterCity={filterCity}
                        setFilterCity={setFilterCity}
                        filterDate={filterDate}
                        setFilterDate={setFilterDate}
                        categories={allCategories}
                        cities={allCities}
                        onUpdateStatus={handleUpdateStatus}
                        onShowDetails={setSelectedPothole}
                        myTasksOnly={myTasksOnly}
                        setMyTasksOnly={setMyTasksOnly}
                    />
                )}

                {activeTab === 'map' && (
                    <PotholeMap
                        potholes={filteredPotholes}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filterDate={filterDate}
                        setFilterDate={setFilterDate}
                        categories={allCategories}
                    />
                )}

                {activeTab === 'profile' && (
                    <UserProfile session={session} />
                )}

                {selectedPothole && (
                    <PotholeDetails
                        pothole={selectedPothole}
                        onClose={() => setSelectedPothole(null)}
                        onUpdateStatus={handleUpdateStatus}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
