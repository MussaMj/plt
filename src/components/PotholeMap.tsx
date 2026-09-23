import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Filter } from 'lucide-react';
import { Pothole } from '../types';
import { getCategoryLabel } from '../categories';
import { getMapView } from '../utils/province';

interface PotholeMapProps {
    potholes: Pothole[];
    totalCount: number;
    /** The manager's province (null = national); decides where the map opens. */
    province: string | null;
    filterStatus: string;
    setFilterStatus: (s: string) => void;
    filterCategory: string;
    setFilterCategory: (s: string) => void;
    filterDate: string;
    setFilterDate: (s: string) => void;
    categories: string[];
}

const PotholeMap: React.FC<PotholeMapProps> = ({
    potholes,
    totalCount,
    province,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterDate,
    setFilterDate,
    categories
}) => {
    const view = getMapView(province);

    return (
        <div className="map-view-container" style={{ position: 'relative' }}>
            {/* Map Filters Overlay */}
            <div className="map-filters-overlay">
                <div className="filter-select">
                    <Filter size={16} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">Status: Todos</option>
                        <option value="reported">Pendente</option>
                        <option value="in_repair">Em Reparo</option>
                        <option value="repaired">Resolvido</option>
                    </select>
                </div>
                <div className="filter-select">
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="all">Categoria: Todas</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{getCategoryLabel(c)}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-select">
                    <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                        <option value="all">Filtro: Qualquer Data</option>
                        <option value="today">Hoje</option>
                        <option value="week">Últimos 7 dias</option>
                        <option value="month">Último mês</option>
                    </select>
                </div>
            </div>

            {potholes.length < totalCount && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                    A mostrar {potholes.length} de {totalCount} ocorrências — use os filtros ou "Carregar mais" na lista para ver as restantes.
                </p>
            )}

            <MapContainer
                key={province ?? 'national'}
                center={view.center}
                zoom={view.zoom}
                style={{ height: '600px', width: '100%', borderRadius: '16px', zIndex: 1 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                />
                {potholes.filter(p => p.location).map(p => (
                    <Marker
                        key={p.id}
                        position={[p.location.latitude, p.location.longitude]}
                    >
                        <Popup>
                            <div className="popup-content">
                                <div className="popup-header">
                                    <span className={`popup-severity-dot ${p.severity}`}></span>
                                    <strong>{p.address || 'Localização sem nome'}</strong>
                                </div>
                                <p className="popup-desc">{getCategoryLabel(p.category)} · {p.description}</p>
                                <div className={`status-tag ${p.status}`}>
                                    {p.status === 'repaired' ? 'RESOLVIDO' :
                                        p.status === 'in_repair' ? 'EM REPARO' : 'PENDENTE'}
                                </div>
                                {p.assignedTechnician && (
                                    <p className="popup-tech">Técnico: {p.assignedTechnician}</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default PotholeMap;
