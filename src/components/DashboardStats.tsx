import React from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ReportStats } from '../types';

interface StatsProps {
    stats: ReportStats;
}

const DashboardStats: React.FC<StatsProps> = ({ stats }) => {
    const { total, resolved, pending, critical, cities, technicians } = stats;

    return (
        <>
            <section className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><TrendingUp size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Total de Ocorrências</span>
                        <span className="stat-value">{total}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Ocorrências Resolvidas</span>
                        <span className="stat-value">{resolved}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><Clock size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Ocorrências Pendentes</span>
                        <span className="stat-value">{pending}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><AlertTriangle size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Casos Críticos</span>
                        <span className="stat-value">{critical}</span>
                    </div>
                </div>
            </section>

            <section className="neighborhood-stats">
                <h3>Estatísticas por Cidade</h3>
                <div className="neighborhood-grid">
                    {cities.map((n) => (
                        <div key={n.name} className="neighborhood-card">
                            <div className="n-info">
                                <span className="n-name">{n.name}</span>
                                <span className="n-count">{n.count} reportes</span>
                            </div>
                            <div className="n-bar-bg">
                                <div
                                    className="n-bar-fill"
                                    style={{ width: `${Math.min((n.count / Math.max(total, 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {cities.length === 0 && <p className="empty-state">Nenhum dado por cidade disponível.</p>}
                </div>
            </section>

            <section className="neighborhood-stats">
                <h3>Progresso por Técnico</h3>
                <div className="neighborhood-grid">
                    {technicians.map((t) => (
                        <div key={t.id} className="neighborhood-card">
                            <div className="n-info">
                                <span className="n-name">{t.name || 'Técnico'}</span>
                                <span className="n-count">
                                    {t.assigned} atribuídos · {t.inRepair} em reparo · {t.resolved} resolvidos
                                </span>
                            </div>
                            <div className="n-bar-bg">
                                <div
                                    className="n-bar-fill"
                                    style={{ width: `${Math.min((t.resolved / Math.max(t.assigned, 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {technicians.length === 0 && <p className="empty-state">Nenhum técnico com reparações atribuídas.</p>}
                </div>
            </section>
        </>
    );
};

export default DashboardStats;
