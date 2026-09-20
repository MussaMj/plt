import React from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatsProps {
    total: number;
    resolved: number;
    pending: number;
    critical: number;
    cities: { name: string; count: number }[];
}

const DashboardStats: React.FC<StatsProps> = ({ total, resolved, pending, critical, cities }) => {
    return (
        <>
            <section className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><TrendingUp size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Total Reportes</span>
                        <span className="stat-value">{total}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Buracos Resolvidos</span>
                        <span className="stat-value">{resolved}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><Clock size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Buracos Pendentes</span>
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
        </>
    );
};

export default DashboardStats;
