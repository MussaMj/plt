import React from 'react';
import { LayoutDashboard, Database, Map as MapIcon, LogOut, User } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface SidebarProps {
    activeTab: 'dashboard' | 'map' | 'potholes' | 'profile';
    setActiveTab: (t: 'dashboard' | 'map' | 'potholes' | 'profile') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <aside className="sidebar">
            <div className="logo">
                <div className="logo-icon">OP</div>
                <h1>Portal <span>de Operações</span></h1>
            </div>
            <nav>
                <button
                    className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={20} /> Dashboard Operacional
                </button>
                <button
                    className={`nav-item ${activeTab === 'potholes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('potholes')}
                >
                    <Database size={20} /> Gestão de Ocorrências
                </button>
                <button
                    className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
                    onClick={() => setActiveTab('map')}
                >
                    <MapIcon size={20} /> Mapa do Terreno
                </button>
                <button
                    className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <User size={20} /> Meu Perfil
                </button>

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
    );
};

export default Sidebar;
