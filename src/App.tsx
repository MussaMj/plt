import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, initialAuthLinkType, AuthLinkType } from './utils/supabase';
import './App.css';

import { Pothole, ReportRow, mapReportRow, ManagerProfile, Technician, TechnicianRow, mapTechnicianRow, ReportStats, EMPTY_STATS } from './types';
import { CATEGORY_LABELS } from './categories';
import { provinceOrFilter } from './utils/province';
import { Session } from '@supabase/supabase-js';
import { ShieldAlert, LogOut, AlertCircle } from 'lucide-react';

import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import PotholeTable from './components/PotholeTable';
import PotholeDetails from './components/PotholeDetails';
import Login from './components/Login';
import SetPassword from './components/SetPassword';

// Heavy / role-specific screens are split out of the main bundle.
const PotholeMap = lazy(() => import('./components/PotholeMap'));
const TeamManager = lazy(() => import('./components/TeamManager'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const TechnicianDashboard = lazy(() => import('./components/TechnicianDashboard'));

const PAGE_SIZE = 200;

interface Filters {
    status: string;
    category: string;
    city: string;
    date: string;
    technicianId: string;
    search: string;
}

const DEFAULT_FILTERS: Filters = { status: 'all', category: 'all', city: 'all', date: 'all', technicianId: 'all', search: '' };

function dateFloor(date: string): string | null {
    const now = new Date();
    if (date === 'today') {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }
    if (date === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    if (date === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return null;
}

const Fallback: React.FC = () => <div className="loading-state">A carregar...</div>;

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<ManagerProfile | null>(null);
    const [technicianSelf, setTechnicianSelf] = useState<Technician | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [passwordSetup, setPasswordSetup] = useState<AuthLinkType>(initialAuthLinkType);

    const [potholes, setPotholes] = useState<Pothole[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [criticalList, setCriticalList] = useState<Pothole[]>([]);
    const [stats, setStats] = useState<ReportStats>(EMPTY_STATS);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'potholes' | 'team' | 'profile'>('dashboard');
    const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null);

    const CURRENT_USER_NAME = session?.user?.user_metadata?.full_name || profile?.name || session?.user?.email || 'Gestor';
    const managerProvince = profile?.province ?? null;

    const setFilter = (key: keyof Filters) => (value: string) => setFilters(f => ({ ...f, [key]: value }));

    // Debounce the free-text search so we don't hit the database per keystroke.
    useEffect(() => {
        const t = setTimeout(() => setFilters(f => (f.search === searchInput ? f : { ...f, search: searchInput })), 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    const buildQuery = useCallback((from: number, to: number) => {
        let q = supabase
            .from('reports')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (managerProvince) q = q.or(provinceOrFilter(managerProvince));
        if (filters.status !== 'all') q = q.eq('status', filters.status);
        if (filters.category !== 'all') q = q.eq('category', filters.category);
        if (filters.city !== 'all') q = q.eq('city', filters.city);
        if (filters.technicianId === 'unassigned') q = q.is('assigned_technician_id', null);
        else if (filters.technicianId !== 'all') q = q.eq('assigned_technician_id', filters.technicianId);
        const floor = dateFloor(filters.date);
        if (floor) q = q.gte('created_at', floor);
        const term = filters.search.trim().replace(/[%*,()]/g, '');
        if (term) q = q.ilike('address', `%${term}%`);
        return q;
    }, [managerProvince, filters]);

    const loadedCount = useRef(PAGE_SIZE);

    /** Loads the first `count` rows for the current filters (used on filter change and after realtime events). */
    const reloadReports = useCallback(async (count = PAGE_SIZE) => {
        const { data, error, count: total } = await buildQuery(0, count - 1);
        if (error) {
            console.error('Error loading reports:', error);
            setLoadError('Não foi possível carregar as ocorrências. Verifique a ligação ou contacte o suporte.');
            setLoading(false);
            return;
        }
        setLoadError(null);
        loadedCount.current = Math.max(count, PAGE_SIZE);
        setPotholes((data as ReportRow[]).map(mapReportRow));
        setTotalCount(total ?? 0);
        setLoading(false);
    }, [buildQuery]);

    const loadMore = async () => {
        setLoadingMore(true);
        const from = potholes.length;
        const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
        setLoadingMore(false);
        if (error) {
            console.error('Error loading more reports:', error);
            return;
        }
        loadedCount.current = from + (data?.length ?? 0);
        setPotholes(prev => [...prev, ...(data as ReportRow[]).map(mapReportRow)]);
    };

    const fetchStats = useCallback(async () => {
        const { data, error } = await supabase.rpc('report_stats', { p_province: managerProvince });
        if (error) {
            console.error('Error loading stats:', error);
            return;
        }
        setStats({ ...EMPTY_STATS, ...(data as ReportStats) });
    }, [managerProvince]);

    const fetchCritical = useCallback(async () => {
        let q = supabase
            .from('reports')
            .select('*')
            .eq('severity', 'high')
            .neq('status', 'repaired')
            .order('created_at', { ascending: false })
            .limit(6);
        if (managerProvince) q = q.or(provinceOrFilter(managerProvince));
        const { data, error } = await q;
        if (error) {
            console.error('Error loading critical reports:', error);
            return;
        }
        setCriticalList((data as ReportRow[]).map(mapReportRow));
    }, [managerProvince]);

    const fetchTechnicians = useCallback(async () => {
        let q = supabase.from('technicians').select('*').order('name', { ascending: true });
        if (managerProvince) q = q.or(provinceOrFilter(managerProvince));
        const { data, error } = await q;
        if (error) {
            console.error('Error loading technicians:', error);
            return;
        }
        setTechnicians((data as TechnicianRow[]).map(mapTechnicianRow));
    }, [managerProvince]);

    // Auth session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (event === 'PASSWORD_RECOVERY') setPasswordSetup('recovery');
        });

        return () => subscription.unsubscribe();
    }, []);

    // Access control — anyone can hold a Supabase Auth session (the mobile
    // app's citizens included). Only a `profiles` row with role='manager'
    // gets the full portal; failing that, an *active* row in the separate
    // `technicians` table gets the reduced technician view; otherwise the
    // account has no business here.
    useEffect(() => {
        if (!session) {
            setProfile(null);
            setTechnicianSelf(null);
            setProfileLoading(false);
            return;
        }

        setProfileLoading(true);
        supabase
            .from('profiles')
            .select('id, role, province, name')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(async ({ data, error }) => {
                if (error) console.error('Error loading profile:', error);
                const managerProfile = (data as ManagerProfile | null) ?? null;
                setProfile(managerProfile);

                if (managerProfile?.role === 'manager') {
                    setTechnicianSelf(null);
                    setProfileLoading(false);
                    return;
                }

                const { data: techData, error: techError } = await supabase
                    .from('technicians')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (techError) console.error('Error loading technician:', techError);
                setTechnicianSelf(techData ? mapTechnicianRow(techData as TechnicianRow) : null);
                setProfileLoading(false);
            });
    }, [session]);

    const isManager = profile?.role === 'manager';
    const isTechnician = !isManager && technicianSelf !== null && technicianSelf.active;
    const technicianDeactivated = !isManager && technicianSelf !== null && !technicianSelf.active;

    // Reload the list whenever the filters (or the manager's scope) change.
    useEffect(() => {
        if (!session || !isManager) return;
        setLoading(true);
        reloadReports(PAGE_SIZE);
    }, [session, isManager, reloadReports]);

    // Keep everything else fresh, and react to realtime changes (debounced —
    // an import or a burst of updates shouldn't trigger a refetch per row).
    const reloadReportsRef = useRef(reloadReports);
    reloadReportsRef.current = reloadReports;

    useEffect(() => {
        if (!session || !isManager) return;

        fetchStats();
        fetchCritical();
        fetchTechnicians();

        let timer: ReturnType<typeof setTimeout> | null = null;
        const refreshAll = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                reloadReportsRef.current(loadedCount.current);
                fetchStats();
                fetchCritical();
            }, 500);
        };

        const channel = supabase
            .channel('portal-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, refreshAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, fetchTechnicians)
            .subscribe();

        return () => {
            if (timer) clearTimeout(timer);
            supabase.removeChannel(channel);
        };
    }, [session, isManager, fetchStats, fetchCritical, fetchTechnicians]);

    const handleAddNote = async (reportId: string, note: string) => {
        const { error } = await supabase.from('report_notes').insert({
            report_id: reportId,
            author_id: session?.user.id,
            author_name: CURRENT_USER_NAME,
            note,
        });
        if (error) console.error('Error saving note:', error);
    };

    const handleUpdateStatus = async (
        id: string,
        newStatus: string,
        notes?: string,
        technicianId?: string,
        repairImageUrl?: string
    ) => {
        try {
            const updateData: Record<string, unknown> = {
                status: newStatus,
                updated_at: new Date().toISOString(),
            };

            if (technicianId !== undefined) {
                if (technicianId === '') {
                    updateData.assigned_technician_id = null;
                    updateData.assigned_technician = null;
                } else {
                    const tech = technicians.find(t => t.id === technicianId);
                    updateData.assigned_technician_id = technicianId;
                    updateData.assigned_technician = tech?.name ?? null;
                }
            }

            if (repairImageUrl !== undefined) {
                updateData.repair_image_url = repairImageUrl;
            }

            const { error } = await supabase
                .from('reports')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error updating status:', error);
                setLoadError('Não foi possível guardar a alteração: ' + error.message);
                return;
            }

            if (notes && notes.trim()) {
                await handleAddNote(id, notes.trim());
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

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

    if (passwordSetup) {
        return (
            <SetPassword
                mode={passwordSetup}
                onDone={() => {
                    setPasswordSetup(null);
                    window.history.replaceState(null, '', window.location.pathname);
                }}
            />
        );
    }

    if (isTechnician && technicianSelf) {
        return (
            <Suspense fallback={<Fallback />}>
                <TechnicianDashboard session={session} technicianName={technicianSelf.name} />
            </Suspense>
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
                        <p>
                            {technicianDeactivated
                                ? 'A sua conta de técnico foi desactivada. Contacte o gestor do seu conselho municipal.'
                                : 'Esta conta não tem permissão de gestor ou técnico para aceder ao Portal de Operações.'}
                        </p>
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
                            {activeTab === 'team' && 'Equipa de Técnicos'}
                            {activeTab === 'profile' && 'Configurações de Conta'}
                        </h2>
                        <p>
                            {activeTab === 'dashboard' && (managerProvince ? `Monitoramento de ${managerProvince}` : 'Monitoramento nacional de infraestrutura crítica')}
                            {activeTab === 'potholes' && 'Gestão e execução de ordens de serviço'}
                            {activeTab === 'map' && 'Localização geográfica de ocorrências'}
                            {activeTab === 'team' && 'Convide e acompanhe os técnicos responsáveis pelas reparações'}
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

                {loadError && (
                    <div className="login-error" style={{ marginBottom: '1rem' }}>
                        <AlertCircle size={18} />
                        <span>{loadError}</span>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <>
                        <DashboardStats stats={stats} />

                        <div className="dashboard-grid">
                            <div className="recent-activity">
                                <h3>Ocorrências Críticas Prioritárias</h3>
                                <div className="activity-list">
                                    {criticalList.map(p => (
                                        <div key={p.id} className="activity-item" onClick={() => setSelectedPothole(p)}>
                                            <div className="severity-dot high"></div>
                                            <div className="activity-info">
                                                <strong>{p.address || 'Localização Pendente'}</strong>
                                                <span>{p.status === 'reported' ? 'Aguardando Início' : 'Em Execução'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {criticalList.length === 0 && (
                                        <p className="empty-state">Sem ocorrências críticas pendentes.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'potholes' && (
                    <PotholeTable
                        potholes={potholes}
                        totalCount={totalCount}
                        loading={loading}
                        loadingMore={loadingMore}
                        onLoadMore={loadMore}
                        searchTerm={searchInput}
                        setSearchTerm={setSearchInput}
                        filterStatus={filters.status}
                        setFilterStatus={setFilter('status')}
                        filterCategory={filters.category}
                        setFilterCategory={setFilter('category')}
                        filterCity={filters.city}
                        setFilterCity={setFilter('city')}
                        filterDate={filters.date}
                        setFilterDate={setFilter('date')}
                        filterTechnicianId={filters.technicianId}
                        setFilterTechnicianId={setFilter('technicianId')}
                        categories={Object.keys(CATEGORY_LABELS)}
                        cities={stats.cities.map(c => c.name).filter(n => n !== 'Sem cidade').sort()}
                        technicians={technicians}
                        onUpdateStatus={handleUpdateStatus}
                        onShowDetails={setSelectedPothole}
                    />
                )}

                {activeTab === 'map' && (
                    <Suspense fallback={<Fallback />}>
                        <PotholeMap
                            potholes={potholes}
                            totalCount={totalCount}
                            province={managerProvince}
                            filterStatus={filters.status}
                            setFilterStatus={setFilter('status')}
                            filterCategory={filters.category}
                            setFilterCategory={setFilter('category')}
                            filterDate={filters.date}
                            setFilterDate={setFilter('date')}
                            categories={Object.keys(CATEGORY_LABELS)}
                        />
                    </Suspense>
                )}

                {activeTab === 'team' && (
                    <Suspense fallback={<Fallback />}>
                        <TeamManager
                            technicians={technicians}
                            managerProvince={managerProvince}
                            onChanged={fetchTechnicians}
                        />
                    </Suspense>
                )}

                {activeTab === 'profile' && (
                    <Suspense fallback={<Fallback />}>
                        <UserProfile session={session} />
                    </Suspense>
                )}

                {selectedPothole && (
                    <PotholeDetails
                        pothole={selectedPothole}
                        onClose={() => setSelectedPothole(null)}
                        onUpdateStatus={handleUpdateStatus}
                        technicians={technicians}
                        viewerRole="manager"
                    />
                )}
            </main>
        </div>
    );
};

export default App;
