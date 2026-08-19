import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, BookOpen, Users, User } from 'lucide-react';
import './BottomNav.css';

export const BottomNav = () => {
  const items = [
    { to: '/dashboard', label: 'Início', icon: Home },
    { to: '/descobrir', label: 'Descobrir', icon: Compass },
    { to: '/biblioteca', label: 'Biblioteca', icon: BookOpen },
    { to: '/comunidade', label: 'Comunidade', icon: Users },
    { to: '/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegação mobile">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
