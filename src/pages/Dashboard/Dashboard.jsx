import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/StatCard/StatCard';
import { BookCard } from '../../components/BookCard/BookCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { SetGoalModal } from '../../components/SetGoalModal/SetGoalModal';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Flame,
  Star,
  Target,
  Sparkles,
  Loader2,
  Plus,
  ArrowRight,
  Edit2
} from 'lucide-react';
import { initialBooks } from '../../lib/catalogData';
import './Dashboard.css';

const CURRENT_YEAR = new Date().getFullYear();

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currentReading, setCurrentReading] = useState(null);
  const [readingGoal, setReadingGoal] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [stats, setStats] = useState({
    booksRead: 0,
    pagesRead: 0,
    readingNow: 0,
    avgRating: 0,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const currentYear = CURRENT_YEAR;

      // 1. Fetch currently reading book
      const { data: readingData } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', user.id)
        .eq('status', 'lendo')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      setCurrentReading(readingData || null);

      // 2. Fetch current year reading goal
      const { data: goalData } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', currentYear)
        .single();

      setReadingGoal(goalData || null);

      // 3. Fetch stats
      const { data: userBooksData } = await supabase
        .from('user_books')
        .select('status, pagina_atual, books(numero_paginas)')
        .eq('user_id', user.id);

      let booksRead = 0;
      let pagesRead = 0;
      let readingNow = 0;

      if (userBooksData) {
        userBooksData.forEach((ub) => {
          if (ub.status === 'lido') {
            booksRead += 1;
            pagesRead += ub.books?.numero_paginas || 0;
          } else if (ub.status === 'lendo') {
            readingNow += 1;
            pagesRead += ub.pagina_atual || 0;
          }
        });
      }

      // Fetch avg rating
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('nota')
        .eq('user_id', user.id);

      let avgRating = 0;
      if (reviewsData && reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, r) => acc + Number(r.nota), 0);
        avgRating = (sum / reviewsData.length).toFixed(1);
      }

      setStats({
        booksRead,
        pagesRead,
        readingNow,
        avgRating,
      });

      // 4. Fetch books for recommendations
      try {
        const { data: booksList } = await supabase
          .from('books')
          .select('*')
          .limit(4);

        setRecommendations(booksList && booksList.length > 0 ? booksList : initialBooks.slice(0, 4));
      } catch (errRec) {
        setRecommendations(initialBooks.slice(0, 4));
      }

      // 5. Fetch community activities
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (follows && follows.length > 0) {
        const followingIds = follows.map((f) => f.following_id);
        const { data: recentReviews } = await supabase
          .from('reviews')
          .select('*, profiles(nome, username), books(titulo)')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(5);

        setActivities(recentReviews || []);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (newGoalValue) => {
    const currentYear = CURRENT_YEAR;
    try {
      if (readingGoal) {
        const { data, error } = await supabase
          .from('reading_goals')
          .update({
            meta_livros: newGoalValue,
            livros_lidos: stats.booksRead,
            updated_at: new Date().toISOString(),
          })
          .eq('id', readingGoal.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setReadingGoal(data);
      } else {
        const { data, error } = await supabase
          .from('reading_goals')
          .insert([
            {
              user_id: user.id,
              ano: currentYear,
              meta_livros: newGoalValue,
              livros_lidos: stats.booksRead,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        setReadingGoal(data);
      }
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Carregando sua estante...</p>
      </div>
    );
  }

  const currentBookObj = currentReading?.books;
  const currentProgress = currentReading
    ? currentReading.progresso ||
      (currentBookObj?.numero_paginas
        ? Math.min(100, Math.round((currentReading.pagina_atual / currentBookObj.numero_paginas) * 100))
        : 0)
    : 0;

  const currentYear = new Date().getFullYear();
  const goalProgress = readingGoal
    ? Math.min(100, Math.round((readingGoal.livros_lidos / readingGoal.meta_livros) * 100))
    : 0;
  const booksRemaining = readingGoal
    ? Math.max(0, readingGoal.meta_livros - readingGoal.livros_lidos)
    : 0;

  return (
    <div className="dashboard-page">
      {/* Welcome Banner sem emojis ou decorações inadequadas */}
      <section className="welcome-section">
        <h1>Olá, {profile?.nome || 'Leitor'}</h1>
        <p className="welcome-sub">Continue de onde parou e acompanhe sua jornada de leitura.</p>
      </section>

      {/* Main Grid: Continue Reading + Reading Goal */}
      <div className="dashboard-grid">
        {/* Continue Reading Card */}
        <div className="continue-reading-card card">
          <h2>Continue sua história</h2>
          {currentReading && currentBookObj ? (
            <div className="continue-reading-content">
              <div className="continue-cover">
                {currentBookObj.capa_url ? (
                  <img src={currentBookObj.capa_url} alt={currentBookObj.titulo} />
                ) : (
                  <div className="continue-cover-placeholder">
                    <BookOpen size={28} color="var(--color-primary)" />
                  </div>
                )}
              </div>

              <div className="continue-info">
                <h3>{currentBookObj.titulo}</h3>
                <p className="continue-author">{currentBookObj.autor}</p>

                <p className="continue-percentage">
                  Você concluiu <strong>{currentProgress}%</strong> desta leitura.
                </p>

                <div className="dashboard-progress-bar">
                  <div
                    className="dashboard-progress-fill"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>

                <Link
                  to={`/livro/${currentBookObj.id}`}
                  className="btn btn-primary btn-sm continue-btn"
                >
                  Continuar leitura <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-continue">
              <p>Você não está lendo nenhum livro no momento.</p>
              <Link to="/biblioteca" className="btn btn-secondary btn-sm">
                Escolher um livro da biblioteca
              </Link>
            </div>
          )}
        </div>

        {/* Reading Goal Card com Modal Refatorado */}
        <div className="reading-goal-card card">
          <div className="goal-header">
            <h2>Minha meta de {currentYear}</h2>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="icon-btn-ghost"
              title="Ajustar meta"
              aria-label="Ajustar meta de leitura"
            >
              {readingGoal ? <Edit2 size={16} /> : <Target size={18} color="var(--color-primary)" />}
            </button>
          </div>

          {readingGoal ? (
            <div className="goal-content">
              <div className="goal-numbers">
                <span className="goal-current">{readingGoal.livros_lidos}</span>
                <span className="goal-divider">/</span>
                <span className="goal-target">{readingGoal.meta_livros} livros</span>
              </div>

              <div className="dashboard-progress-bar">
                <div
                  className="dashboard-progress-fill"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>

              <div className="goal-footer-row">
                <p className="goal-remaining">
                  {booksRemaining > 0
                    ? `${booksRemaining} livros restantes (${goalProgress}% concluído)`
                    : 'Meta concluída! Parabéns pela dedicação!'}
                </p>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="edit-goal-link"
                >
                  Alterar meta
                </button>
              </div>
            </div>
          ) : (
            <div className="no-goal-content">
              <p>Você ainda não definiu sua meta de leitura para este ano.</p>
              <button onClick={() => setIsGoalModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={16} /> Definir meta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <section className="stats-section">
        <h2>Suas estatísticas</h2>
        <div className="stats-grid">
          <StatCard
            icon={BookOpen}
            value={stats.booksRead}
            label="Livros lidos"
          />
          <StatCard
            icon={FileText}
            value={stats.pagesRead.toLocaleString('pt-BR')}
            label="Páginas lidas"
          />
          <StatCard
            icon={Flame}
            value={stats.readingNow}
            label="Lendo agora"
          />
          <StatCard
            icon={Star}
            value={stats.avgRating > 0 ? stats.avgRating : '—'}
            label="Média de avaliação"
          />
        </div>
      </section>

      {/* Recommended Section */}
      <section className="recommendations-section">
        <div className="section-header">
          <h2>
            <Sparkles size={20} color="var(--color-primary)" /> Recomendados para você
          </h2>
          <Link to="/descobrir" className="see-all-link">
            Ver catálogo completo
          </Link>
        </div>

        {recommendations.length > 0 ? (
          <div className="books-grid">
            {recommendations.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma recomendação no momento"
            description="Explore novos livros na aba Descobrir para abastecer sua estante."
            actionText="Explorar livros"
            onAction={() => navigate('/descobrir')}
          />
        )}
      </section>

      {/* Community Activity Section com navegação funcional garantida */}
      <section className="community-activity-section">
        <div className="section-header">
          <h2>Atividade da Comunidade</h2>
          <Link to="/comunidade" className="see-all-link">
            Ir para Comunidade
          </Link>
        </div>

        {activities.length > 0 ? (
          <div className="activity-list">
            {activities.map((act) => (
              <div key={act.id} className="activity-item card">
                <div className="activity-user font-bold">
                  {act.profiles?.nome || act.profiles?.username}
                </div>
                <div className="activity-details">
                  avaliou <strong>{act.books?.titulo}</strong> com{' '}
                  <span className="activity-stars">
                    {'★'.repeat(Math.round(act.nota))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma atividade recente de amigos"
            description="Conecte-se com outros leitores na aba Comunidade para ver o que eles estão lendo e avaliando."
            actionText="Explorar Comunidade"
            onAction={() => navigate('/comunidade')}
            icon={BookOpen}
          />
        )}
      </section>

      {/* Set Goal Modal */}
      <SetGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoal={readingGoal?.meta_livros || 12}
        onSave={handleSaveGoal}
        year={CURRENT_YEAR}
      />
    </div>
  );
};
