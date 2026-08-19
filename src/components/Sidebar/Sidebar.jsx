import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Compass,
  BookOpen,
  BookMarked,
  Users,
  BarChart2,
  Award,
  User,
  LogOut,
  Book
} from 'lucide-react';
import './Sidebar.css';

export const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Início', icon: Home },
    { to: '/descobrir', label: 'Descobrir', icon: Compass },
    { to: '/biblioteca', label: 'Biblioteca', icon: BookOpen },
    { to: '/diario', label: 'Diário', icon: BookMarked },
    { to: '/comunidade', label: 'Comunidade', icon: Users },
    { to: '/estatisticas', label: 'Estatísticas', icon: BarChart2 },
    { to: '/conquistas', label: 'Conquistas', icon: Award },
    { to: '/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <aside className="sidebar" aria-label="Navegação Principal">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Book size={24} color="var(--color-primary)" />
        </div>
        <span className="brand-name">Chapter 1</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn" aria-label="Sair da conta">
          <LogOut size={19} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
