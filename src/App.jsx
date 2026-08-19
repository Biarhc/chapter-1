import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/Layout/MainLayout';
import { Login } from './pages/Login/Login';
import { Cadastro } from './pages/Cadastro/Cadastro';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Biblioteca } from './pages/Biblioteca/Biblioteca';
import { Livro } from './pages/Livro/Livro';
import { Descobrir } from './pages/Descobrir/Descobrir';
import { Comunidade } from './pages/Comunidade/Comunidade';
import { Estatisticas } from './pages/Estatisticas/Estatisticas';
import { Conquistas } from './pages/Conquistas/Conquistas';
import { Perfil } from './pages/Perfil/Perfil';
import { BookMarked } from 'lucide-react';

const DiarioPlaceholder = () => (
  <div className="card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: 'var(--color-primary-subtle)',
      border: '1px solid var(--color-primary-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.25rem'
    }}>
      <BookMarked size={28} color="var(--color-primary)" />
    </div>
    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
      Diário de Leitura
    </h1>
    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.5', fontSize: '0.95rem' }}>
      Você pode registrar impressões, capítulos e citações diretamente a partir de qualquer livro em sua Biblioteca ou na página detalhada de uma obra.
    </p>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/cadastro"
            element={
              <PublicOnlyRoute>
                <Cadastro />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Main Layout Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/livro/:id" element={<Livro />} />
              <Route path="/descobrir" element={<Descobrir />} />
              <Route path="/diario" element={<DiarioPlaceholder />} />
              <Route path="/comunidade" element={<Comunidade />} />
              <Route path="/estatisticas" element={<Estatisticas />} />
              <Route path="/conquistas" element={<Conquistas />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/perfil/:username" element={<Perfil />} />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
