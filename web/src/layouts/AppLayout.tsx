import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardPlus,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import './AppLayout.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, companyName, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const displayName = profile?.nome || user?.name || user?.email?.split('@')[0] || 'Inspetor';
  const displayCompany = companyName || profile?.empresaNome || 'Empresa Padrão';
  const userRole = profile?.cargo || (profile?.perfil === 'ADMIN' ? 'Administrador' : 'Inspetor Técnico');

  const getPageHeading = () => {
    switch (location.pathname) {
      case '/':
        return 'Visão Geral & Dashboard';
      case '/checklist':
        return 'Inspeção de PEMT';
      case '/history':
        return 'Histórico de Inspeções';
      case '/settings':
        return 'Configurações do Sistema';
      default:
        return 'Sistema PEMT';
    }
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Industrial Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-badge">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="logo-text">PEMT</span>
              <span className="logo-subtext">NR-18 / NR-35</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Operação</div>

          <NavLink
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} className="icon" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/checklist"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ClipboardPlus size={18} className="icon" />
            <span>Nova Inspeção</span>
          </NavLink>

          <NavLink
            to="/history"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <History size={18} className="icon" />
            <span>Histórico</span>
          </NavLink>

          <div className="nav-section-title" style={{ marginTop: '12px' }}>Gestão</div>

          {(profile?.perfil === 'ADMIN' || profile?.perfil === 'ADMINISTRADOR') && (
            <NavLink
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={{ color: '#38bdf8' }}
            >
              <ShieldCheck size={18} className="icon" />
              <span>Painel Admin</span>
            </NavLink>
          )}

          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} className="icon" />
            <span>Configurações</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="company-pill">
            <div className="company-pill-label">
              <Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Empresa
            </div>
            <div className="company-pill-name" title={displayCompany}>
              {displayCompany}
            </div>
          </div>

          <div className="user-profile-row">
            <div className="user-info">
              <div className="user-name" title={displayName}>
                {displayName}
              </div>
              <div className="user-role">{userRole}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="logout-icon-btn"
              title="Encerrar Sessão"
              aria-label="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="app-main-content">
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir Menu"
            >
              <Menu size={20} />
            </button>
            <div className="topbar-title">
              <span>{getPageHeading()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="topbar-badge">Sistema Homologado</span>
          </div>
        </header>

        <main className="app-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
