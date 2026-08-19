import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { BottomNav } from '../BottomNav/BottomNav';
import { Bell, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './MainLayout.css';

export const MainLayout = () => {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-container">
      <Sidebar />

      <div className="layout-content-wrapper">
        <header className="top-header">
          <div className="header-title">
            <span className="chapter-logo-text">Chapter 1</span>
          </div>

          <div className="header-actions">
            <button
              className="icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun size={19} color="var(--color-accent)" />
              ) : (
                <Moon size={19} color="var(--color-primary)" />
              )}
            </button>

            <button className="icon-btn" title="Notificações" aria-label="Notificações">
              <Bell size={19} color="var(--color-text-muted)" />
            </button>

            <div className="user-profile-badge">
              <div className="avatar">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.nome || 'Avatar'} />
                ) : (
                  <User size={18} color="var(--color-primary)" />
                )}
              </div>
              <span className="profile-name">{profile?.nome || 'Leitor'}</span>
            </div>
          </div>
        </header>

        <main className="main-content fade-in">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
};
