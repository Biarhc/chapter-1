import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Book, Eye, EyeOff, Loader2 } from 'lucide-react';
import '../Login/Auth.css';

export const Cadastro = () => {
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nome || !username || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await signUp({
        email,
        password,
        nome,
        username: username.toLowerCase().trim(),
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('unique constraint') || err.message?.includes('profiles_username_key')) {
        setError('Este username já está em uso. Escolha outro.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card fade-in">
        <div className="auth-brand">
          <div className="brand-icon">
            <Book size={32} color="var(--color-primary)" />
          </div>
          <h1>Chapter 1</h1>
          <p>Crie sua conta e comece sua história</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="@seuusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tem conta?{' '}
            <Link to="/login" className="auth-link">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
