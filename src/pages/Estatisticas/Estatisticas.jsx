import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/StatCard/StatCard';
import { SetGoalModal } from '../../components/SetGoalModal/SetGoalModal';
import { BookOpen, FileText, Flame, Star, Target, Loader2, Award, Heart, Edit2 } from 'lucide-react';
import './Estatisticas.css';

export const Estatisticas = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const [stats, setStats] = useState({
    booksRead: 0,
    pagesRead: 0,
    readingNow: 0,
    avgRating: '—',
    avgPagesPerBook: 0,
  });

  const [readingGoal, setReadingGoal] = useState(null);
  const [monthlyDistribution, setMonthlyDistribution] = useState({});
  const [genreRanking, setGenreRanking] = useState([]);
  const [authorRanking, setAuthorRanking] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [favoriteBook, setFavoriteBook] = useState(null);

  useEffect(() => {
    if (user) {
      calculateUserStatistics();
    }
  }, [user]);

  const calculateUserStatistics = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();

      // 1. Goal
      const { data: goalData } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', currentYear)
        .single();

      setReadingGoal(goalData || null);

      // 2. Fetch User Books
      const { data: userBooksData } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', user.id);

      let booksRead = 0;
      let pagesRead = 0;
      let readingNow = 0;
      const monthCounts = {
        Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0
      };
      const genresMap = {};
      const authorsMap = {};

      if (userBooksData) {
        userBooksData.forEach((ub) => {
          if (ub.status === 'lido') {
            booksRead += 1;
            const bookPages = ub.books?.numero_paginas || 0;
            pagesRead += bookPages;

            if (ub.data_conclusao) {
              const d = new Date(ub.data_conclusao);
              if (d.getFullYear() === currentYear) {
                const monthIndex = d.getMonth();
                const monthKeys = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const monthName = monthKeys[monthIndex];
                if (monthName) monthCounts[monthName] += 1;
              }
            }

            if (ub.books?.generos && Array.isArray(ub.books.generos)) {
              ub.books.generos.forEach((g) => {
                genresMap[g] = (genresMap[g] || 0) + 1;
              });
            }

            if (ub.books?.autor) {
              authorsMap[ub.books.autor] = (authorsMap[ub.books.autor] || 0) + 1;
            }
          } else if (ub.status === 'lendo') {
            readingNow += 1;
            pagesRead += ub.pagina_atual || 0;
          }
        });
      }

      setMonthlyDistribution(monthCounts);

      const sortedGenres = Object.entries(genresMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setGenreRanking(sortedGenres);

      const sortedAuthors = Object.entries(authorsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      setAuthorRanking(sortedAuthors);

      // 3. Reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, books(*)')
        .eq('user_id', user.id)
        .order('nota', { ascending: false });

      let avgRating = '—';
      const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      if (reviewsData && reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, r) => {
          const score = Math.round(Number(r.nota));
          if (ratingCounts[score] !== undefined) ratingCounts[score] += 1;
          return acc + Number(r.nota);
        }, 0);

        avgRating = (sum / reviewsData.length).toFixed(1);
        setFavoriteBook(reviewsData[0]?.books || null);
      }

      setRatingDistribution(ratingCounts);

      const avgPagesPerBook = booksRead > 0 ? Math.round(pagesRead / booksRead) : 0;

      setStats({
        booksRead,
        pagesRead,
        readingNow,
        avgRating,
        avgPagesPerBook,
      });
    } catch (err) {
      console.error('Erro ao calcular estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (newGoalValue) => {
    const currentYear = new Date().getFullYear();
    try {
      if (readingGoal) {
        const { data, error } = await supabase
          .from('reading_goals')
          .update({ meta_livros: newGoalValue, livros_lidos: stats.booksRead })
          .eq('id', readingGoal.id)
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
      <div className="estatisticas-loading">
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Calculando suas métricas literárias...</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const goalProgress = readingGoal
    ? Math.min(100, Math.round((readingGoal.livros_lidos / readingGoal.meta_livros) * 100))
    : 0;

  return (
    <div className="estatisticas-page">
      <div className="estatisticas-header">
        <h1>Estatísticas de Leitura</h1>
        <p className="estatisticas-sub">Uma análise completa dos seus hábitos, ritmos e preferências literárias.</p>
      </div>

      {/* Resumo Geral */}
      <div className="stats-grid">
        <StatCard icon={BookOpen} value={stats.booksRead} label="Livros lidos" />
        <StatCard icon={FileText} value={stats.pagesRead.toLocaleString('pt-BR')} label="Páginas lidas" />
        <StatCard icon={Flame} value={stats.readingNow} label="Livros em andamento" />
        <StatCard icon={Star} value={stats.avgRating} label="Média de avaliação" />
      </div>

      <div className="estatisticas-main-grid">
        {/* Left Column (3 cards) */}
        <div className="stats-col-left">
          {/* 1. Meta Anual */}
          <div className="goal-card card">
            <div className="goal-card-header">
              <h2>Sua meta de {currentYear}</h2>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="icon-btn-ghost"
                title="Definir meta"
                aria-label="Definir meta"
              >
                <Edit2 size={16} />
              </button>
            </div>

            {readingGoal ? (
              <div className="goal-content-wrapper">
                <div className="goal-num-row">
                  <span>{readingGoal.livros_lidos} de {readingGoal.meta_livros} livros</span>
                  <span className="goal-pct">{goalProgress}% concluído</span>
                </div>
                <div className="dashboard-progress-bar">
                  <div className="dashboard-progress-fill" style={{ width: `${goalProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="no-goal-wrapper">
                <p className="no-data-text">Você ainda não definiu sua meta para este ano.</p>
                <button onClick={() => setIsGoalModalOpen(true)} className="btn btn-primary btn-sm mt-2">
                  Definir meta agora
                </button>
              </div>
            )}
          </div>

          {/* 2. Livros por Mês Chart */}
          <div className="monthly-chart-card card">
            <h2>Livros lidos em {currentYear}</h2>
            <div className="chart-bars-container">
              {Object.entries(monthlyDistribution).map(([month, count]) => {
                const maxCount = Math.max(...Object.values(monthlyDistribution), 1);
                const heightPct = Math.round((count / maxCount) * 100);
                return (
                  <div key={month} className="chart-bar-col">
                    <div className="bar-wrapper">
                      <div className="bar-fill" style={{ height: `${count > 0 ? Math.max(heightPct, 18) : 0}%` }}>
                        {count > 0 && <span className="bar-count-label">{count}</span>}
                      </div>
                    </div>
                    <span className="bar-month-label">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Gêneros mais lidos */}
          <div className="genres-card card">
            <h2>Seus gêneros favoritos</h2>
            {genreRanking.length > 0 ? (
              <div className="ranking-list">
                {genreRanking.map((g) => {
                  const maxG = genreRanking[0].count;
                  const pct = Math.round((g.count / maxG) * 100);
                  return (
                    <div key={g.name} className="ranking-item">
                      <div className="ranking-label-row">
                        <span className="ranking-name">{g.name}</span>
                        <span className="ranking-count">{g.count} livros</span>
                      </div>
                      <div className="dashboard-progress-bar">
                        <div className="dashboard-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-data-text">Nenhum gênero concluído registrado ainda.</p>
            )}
          </div>
        </div>

        {/* Right Column (3 cards) */}
        <div className="stats-col-right">
          {/* 1. Média de Páginas e Livro Favorito agrupados */}
          <div className="favorite-book-card card">
            <h2>Melhor avaliado</h2>
            {favoriteBook ? (
              <div className="fav-book-content">
                <div className="fav-book-cover">
                  {favoriteBook.capa_url ? (
                    <img src={favoriteBook.capa_url} alt={favoriteBook.titulo} />
                  ) : (
                    <BookOpen size={28} color="var(--color-primary)" />
                  )}
                </div>
                <div className="fav-book-info">
                  <h3>{favoriteBook.titulo}</h3>
                  <p>{favoriteBook.autor}</p>
                  <div className="fav-stars">★★★★★</div>
                </div>
              </div>
            ) : (
              <p className="no-data-text">Você ainda não avaliou nenhum livro lido.</p>
            )}
          </div>

          {/* 2. Autores mais lidos */}
          <div className="authors-card card">
            <h2>Autores mais lidos</h2>
            {authorRanking.length > 0 ? (
              <div className="authors-list">
                {authorRanking.map((a, idx) => (
                  <div key={a.name} className="author-item">
                    <span className="author-rank">#{idx + 1}</span>
                    <div className="author-details">
                      <strong>{a.name}</strong>
                      <span>{a.count} {a.count === 1 ? 'livro lido' : 'livros lidos'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-text">Nenhum autor registrado ainda.</p>
            )}
          </div>

          {/* 3. Distribuição de avaliações */}
          <div className="ratings-dist-card card">
            <h2>Distribuição de notas</h2>
            <div className="ratings-list">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} className="rating-dist-row">
                  <span className="stars-title">{'★'.repeat(s)}</span>
                  <span className="stars-count">{ratingDistribution[s]} {ratingDistribution[s] === 1 ? 'livro' : 'livros'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Set Goal Modal */}
      <SetGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoal={readingGoal?.meta_livros || 12}
        onSave={handleSaveGoal}
        year={currentYear}
      />
    </div>
  );
};
