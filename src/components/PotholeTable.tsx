import React from 'react';
import { Search, Filter, ExternalLink, MapPin, CheckCircle, Play } from 'lucide-react';
import { Pothole } from '../types';
import { getCategoryLabel } from '../categories';

interface PotholeTableProps {
    potholes: Pothole[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    filterStatus: string;
    setFilterStatus: (s: string) => void;
    filterCategory: string;
    setFilterCategory: (s: string) => void;
    filterCity: string;
    setFilterCity: (s: string) => void;
    filterDate: string;
    setFilterDate: (s: string) => void;
    categories: string[];
    cities: string[];
    onUpdateStatus: (id: string, s: string, notes?: string, tech?: string) => void;
    onShowDetails: (pothole: Pothole) => void;
    myTasksOnly: boolean;
    setMyTasksOnly: (b: boolean) => void;
}

const PotholeTable: React.FC<PotholeTableProps> = ({
    potholes,
    loading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterCity,
    setFilterCity,
    filterDate,
    setFilterDate,
    categories,
    cities,
    onUpdateStatus,
    onShowDetails,
    myTasksOnly,
    setMyTasksOnly
}) => {

    return (
        <section className="table-section">
            <div className="table-header">
                <h3>Monitoramento de Operações</h3>
                <div className="table-actions">
                    <button
                        className={`toggle-btn ${myTasksOnly ? 'active' : ''}`}
                        onClick={() => setMyTasksOnly(!myTasksOnly)}
                    >
                        Minhas Tarefas
                    </button>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por morada..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-select">
                        <Filter size={18} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">Todos Estados</option>
                            <option value="reported">Pendente</option>
                            <option value="in_repair">Em Reparo</option>
                            <option value="repaired">Resolvido</option>
                        </select>
                    </div>
                    <div className="filter-select">
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="all">Todas Categorias</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{getCategoryLabel(c)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-select">
                        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
                            <option value="all">Todas Cidades</option>
                            {cities.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-select">
                        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                            <option value="all">Qualquer Data</option>
                            <option value="today">Hoje</option>
                            <option value="week">Últimos 7 dias</option>
                            <option value="month">Último mês</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="pothole-list">
                {loading ? (
                    <div className="loading-state">A actualizar dados do sistema...</div>
                ) : potholes.length === 0 ? (
                    <div className="empty-state">Sem ocorrências registradas</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Localização</th>
                                <th>Categoria</th>
                                <th>Prioridade</th>
                                <th>Responsável</th>
                                <th>Estado</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {potholes.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="loc-cell">
                                            <span className="addressText">{p.address || 'Coord. Geográficas'}</span>
                                            <span className="descText">
                                                {[p.city, p.province].filter(Boolean).join(', ') || p.description}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{getCategoryLabel(p.category)}</td>
                                    <td>
                                        <span className={`severity-badge ${p.severity}`}>
                                            {p.severity === 'high' ? 'Crítica' : p.severity === 'medium' ? 'Moderada' : 'Leve'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="tech-assigned">
                                            {p.assignedTechnician || 'Não atribuído'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${p.status}`}>
                                            {p.status === 'repaired' ? 'Resolvido' : p.status === 'in_repair' ? 'Em Reparo' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {p.status === 'reported' && (
                                                <button
                                                    className="btn-action primary small"
                                                    onClick={() => onUpdateStatus(p.id, 'in_repair')}
                                                    title="Iniciar Trabalho"
                                                >
                                                    <Play size={14} /> Iniciar
                                                </button>
                                            )}
                                            {p.status === 'in_repair' && (
                                                <button
                                                    className="btn-action success small"
                                                    onClick={() => onShowDetails(p)}
                                                    title="Finalizar e Relatar"
                                                >
                                                    <CheckCircle size={14} /> Finalizar
                                                </button>
                                            )}
                                            <button
                                                className="btn-view"
                                                onClick={() => onShowDetails(p)}
                                                title="Visualizar Reporte"
                                            >
                                                <ExternalLink size={18} />
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
    );
};

export default PotholeTable;
