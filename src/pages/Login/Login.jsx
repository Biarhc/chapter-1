import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Book, Eye, EyeOff, Loader2 } from 'lucide-react';
import './Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      await signIn({ email, password });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Erro ao realizar login. Tente novamente.');
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
          <p>Sua jornada literária começa aqui</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Sua senha de acesso"
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

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="auth-link">
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
