import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  BookOpen,
  Heart,
  Star,
  Calendar,
  Building,
  Globe,
  Tag,
  Loader2,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Smile,
  X,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { bookCoversMap } from '../../lib/bookCovers';
import { initialBooks } from '../../lib/catalogData';
import './Livro.css';

export const Livro = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary Page Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [book, setBook] = useState(null);
  const [userBook, setUserBook] = useState(null);

  // Diary States
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [editingDiaryEntry, setEditingDiaryEntry] = useState(null);
  const [diaryForm, setDiaryForm] = useState({
    pagina: '',
    capitulo: '',
    data_leitura: new Date().toISOString().split('T')[0],
    humor: 'Empolgado',
    nota_momento: 5,
    conteudo: '',
  });

  // Reviews & Ratings States
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ nota: 5, resenha: '' });
  const [userLikes, setUserLikes] = useState({});

  // Progress Interactive State
  const [paginaInput, setPaginaInput] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadAllPageData();
    }
  }, [id, user]);

  const loadAllPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Book Details
      let currentBook = null;
      try {
        const { data: bookData, error: bookErr } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();

        if (bookErr) throw bookErr;
        currentBook = bookData;
      } catch (bookFetchErr) {
        console.warn('Usando dados locais para o livro:', bookFetchErr);
        currentBook = initialBooks.find((b) => b.id === id) || null;
      }

      if (!currentBook) {
        currentBook = initialBooks.find((b) => b.id === id) || null;
      }

      if (!currentBook) {
        throw new Error('Livro não encontrado');
      }

      setBook(currentBook);

      // 2. Fetch User Book state
      const { data: ubData } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', id)
        .single();

      setUserBook(ubData || null);
      if (ubData) {
        setPaginaInput(ubData.pagina_atual || 0);
      }

      // 3. Fetch Reading Diary Entries
      const { data: diaryData } = await supabase
        .from('reading_diary')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', id)
        .order('created_at', { ascending: false });

      setDiaryEntries(diaryData || []);

      // 4. Fetch Reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profiles(nome, username, avatar_url)')
        .eq('book_id', id)
        .order('created_at', { ascending: false });

      const allReviews = reviewsData || [];
      setReviews(allReviews);

      const foundMyReview = allReviews.find((r) => r.user_id === user.id);
      if (foundMyReview) {
        setMyReview(foundMyReview);
        setReviewForm({ nota: foundMyReview.nota, resenha: foundMyReview.resenha || '' });
      }

      // 5. Fetch Likes
      if (allReviews.length > 0) {
        const reviewIds = allReviews.map((r) => r.id);
        const { data: likesData } = await supabase
          .from('likes')
          .select('review_id')
          .eq('user_id', user.id)
          .in('review_id', reviewIds);

        const likesMap = {};
        if (likesData) {
          likesData.forEach((l) => {
            likesMap[l.review_id] = true;
          });
        }
        setUserLikes(likesMap);
      }
    } catch (err) {
      console.error('Erro ao carregar livro:', err);
      setError('Não conseguimos carregar este livro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (status = 'quero_ler') => {
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('user_books')
        .insert([
          {
            user_id: user.id,
            book_id: book.id,
            status,
            progresso: 0,
            pagina_atual: 0,
            favorito: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setUserBook(data);
      setPaginaInput(0);
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar livro à biblioteca.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!userBook) return;
    try {
      setUpdating(true);
      const updates = { status: newStatus };
      if (newStatus === 'lido') {
        updates.progresso = 100;
        updates.pagina_atual = book.numero_paginas || userBook.pagina_atual;
        updates.data_conclusao = new Date().toISOString().split('T')[0];
      } else if (newStatus === 'lendo' && !userBook.data_inicio) {
        updates.data_inicio = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('user_books')
        .update(updates)
        .eq('id', userBook.id)
        .select()
        .single();

      if (error) throw error;
      setUserBook(data);
      setPaginaInput(data.pagina_atual);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!userBook) return;
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('user_books')
        .update({ favorito: !userBook.favorito })
        .eq('id', userBook.id)
        .select()
        .single();

      if (error) throw error;
      setUserBook(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!userBook || !book) return;

    const page = parseInt(paginaInput, 10);
    if (isNaN(page) || page < 0) return;

    const totalPages = book.numero_paginas || page;
    const computedProgress = Math.min(100, Math.round((page / totalPages) * 100));
    const isCompleted = computedProgress >= 100;

    try {
      setUpdating(true);
      const updates = {
        pagina_atual: page,
        progresso: computedProgress,
      };

      if (isCompleted) {
        updates.status = 'lido';
        updates.data_conclusao = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('user_books')
        .update(updates)
        .eq('id', userBook.id)
        .select()
        .single();

      if (error) throw error;
      setUserBook(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDiaryModal = (entry = null) => {
    if (entry) {
      setEditingDiaryEntry(entry);
      setDiaryForm({
        pagina: entry.pagina || '',
        capitulo: entry.capitulo || '',
        data_leitura: entry.data_leitura || new Date().toISOString().split('T')[0],
        humor: entry.humor || 'Empolgado',
        nota_momento: entry.nota_momento || 5,
        conteudo: entry.conteudo || '',
      });
    } else {
      setEditingDiaryEntry(null);
      setDiaryForm({
        pagina: userBook?.pagina_atual || '',
        capitulo: '',
        data_leitura: new Date().toISOString().split('T')[0],
        humor: 'Empolgado',
        nota_momento: 5,
        conteudo: '',
      });
    }
    setIsDiaryModalOpen(true);
  };

  const handleSaveDiaryEntry = async (e) => {
    e.preventDefault();
    if (!diaryForm.conteudo.trim()) return;

    try {
      setUpdating(true);
      const payload = {
        user_id: user.id,
        book_id: book.id,
        pagina: diaryForm.pagina ? parseInt(diaryForm.pagina, 10) : null,
        capitulo: diaryForm.capitulo,
        data_leitura: diaryForm.data_leitura,
        humor: diaryForm.humor,
        nota_momento: diaryForm.nota_momento,
        conteudo: diaryForm.conteudo,
      };

      if (editingDiaryEntry) {
        const { data, error } = await supabase
          .from('reading_diary')
          .update(payload)
          .eq('id', editingDiaryEntry.id)
          .select()
          .single();

        if (error) throw error;
        setDiaryEntries((prev) =>
          prev.map((item) => (item.id === editingDiaryEntry.id ? data : item))
        );
      } else {
        const { data, error } = await supabase
          .from('reading_diary')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setDiaryEntries((prev) => [data, ...prev]);
      }

      setIsDiaryModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar registro no diário:', err);
      alert('Erro ao salvar no diário.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDiaryEntry = async (entryId) => {
    if (!confirm('Deseja realmente excluir este registro do diário?')) return;
    try {
      setUpdating(true);
      const { error } = await supabase.from('reading_diary').delete().eq('id', entryId);
      if (error) throw error;
      setDiaryEntries((prev) => prev.filter((item) => item.id !== entryId));
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir registro.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const payload = {
        user_id: user.id,
        book_id: book.id,
        nota: reviewForm.nota,
        resenha: reviewForm.resenha,
      };

      if (myReview) {
        const { data, error } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', myReview.id)
          .select('*, profiles(nome, username, avatar_url)')
          .single();

        if (error) throw error;
        setMyReview(data);
        setReviews((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        setIsEditingReview(false);
      } else {
        const { data, error } = await supabase
          .from('reviews')
          .insert([payload])
          .select('*, profiles(nome, username, avatar_url)')
          .single();

        if (error) throw error;
        setMyReview(data);
        setReviews((prev) => [data, ...prev]);
        setIsEditingReview(false);
      }
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
      alert('Erro ao salvar avaliação.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleLikeReview = async (reviewId) => {
    const isLiked = !!userLikes[reviewId];
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('review_id', reviewId);

        if (error) throw error;
        setUserLikes((prev) => ({ ...prev, [reviewId]: false }));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ user_id: user.id, review_id: reviewId }]);

        if (error) throw error;
        setUserLikes((prev) => ({ ...prev, [reviewId]: true }));
      }
    } catch (err) {
      console.error('Erro ao alternar curtida:', err);
    }
  };

  const totalReviewsCount = reviews.length;
  const avgRatingCalc =
    totalReviewsCount > 0
      ? (reviews.reduce((acc, r) => acc + Number(r.nota), 0) / totalReviewsCount).toFixed(1)
      : '—';

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rounded = Math.round(Number(r.nota));
    if (ratingCounts[rounded] !== undefined) {
      ratingCounts[rounded] += 1;
    }
  });

  if (loading) {
    return (
      <div className="livro-loading">
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Carregando sua leitura...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="livro-not-found card">
        <h2>Livro não encontrado.</h2>
        <p>Não foi possível localizar os dados desta obra no catálogo.</p>
        <button onClick={() => navigate('/descobrir')} className="btn btn-primary">
          <ArrowLeft size={18} /> Voltar para descobrir
        </button>
      </div>
    );
  }

  const humorOptions = [
    'Empolgado',
    'Feliz',
    'Surpreso',
    'Ansioso',
    'Triste',
    'Confuso',
    'Apaixonado',
    'Neutro',
  ];

  return (
    <div className="livro-page">
      <button onClick={() => navigate(-1)} className="back-btn" aria-label="Voltar">
        <ArrowLeft size={18} /> Voltar
      </button>

      {/* SEÇÃO 1: INFORMAÇÕES DO LIVRO */}
      <section className="livro-info-section card">
        <div className="livro-header-grid">
          {/* Capa */}
          <div className="livro-cover-container">
            {(book.capa_url || bookCoversMap[book.titulo]) ? (
              <img src={book.capa_url || bookCoversMap[book.titulo]} alt={book.titulo} className="livro-cover-image" />
            ) : (
              <div className="livro-cover-placeholder">
                <BookOpen size={48} color="var(--color-primary)" />
                <span>{book.titulo}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="livro-details-container">
            <h1 className="livro-title">{book.titulo}</h1>
            {book.subtitulo && <p className="livro-subtitle">{book.subtitulo}</p>}
            <p className="livro-author">por <strong>{book.autor}</strong></p>

            <div className="livro-community-badge">
              <Star size={18} color="var(--color-accent)" fill="var(--color-accent)" />
              <span className="rating-score">{avgRatingCalc}</span>
              <span className="rating-count">({totalReviewsCount} avaliações)</span>
            </div>

            {book.generos && book.generos.length > 0 && (
              <div className="generos-chips">
                {book.generos.map((g) => (
                  <span key={g} className="genero-chip">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* REQUISITO 5: Sem emojis como elementos da interface */}
            <div className="livro-quick-specs">
              <span className="spec-item">
                <BookOpen size={16} className="spec-icon" />
                {book.numero_paginas ? `${book.numero_paginas} páginas` : '—'}
              </span>
              <span className="spec-item">
                <Building size={16} className="spec-icon" />
                {book.editora || '—'}
              </span>
              <span className="spec-item">
                <Calendar size={16} className="spec-icon" />
                {book.data_publicacao || '—'}
              </span>
              <span className="spec-item">
                <Globe size={16} className="spec-icon" />
                {book.idioma || '—'}
              </span>
              {book.isbn && (
                <span className="spec-item">
                  <Tag size={16} className="spec-icon" />
                  ISBN: {book.isbn}
                </span>
              )}
            </div>

            <p className="livro-description">
              {book.descricao || 'Sem descrição disponível para esta obra.'}
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: MINHA LEITURA */}
      <section className="minha-leitura-section card">
        <div className="section-title-wrapper">
          <h2>Minha Leitura</h2>
          {userBook && (
            <button
              className={`btn-fav-toggle ${userBook.favorito ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              disabled={updating}
              aria-label={userBook.favorito ? 'Desfavoritar livro' : 'Favoritar livro'}
            >
              <Heart
                size={18}
                fill={userBook.favorito ? 'var(--color-danger)' : 'none'}
                color={userBook.favorito ? 'var(--color-danger)' : 'var(--color-text-muted)'}
              />
              <span>{userBook.favorito ? 'Favorito' : 'Favoritar'}</span>
            </button>
          )}
        </div>

        {!userBook ? (
          <div className="no-user-book">
            <p>Você ainda não adicionou este livro à sua biblioteca.</p>
            <button
              onClick={() => handleAddToLibrary('quero_ler')}
              className="btn btn-primary"
              disabled={updating}
            >
              <Plus size={18} /> Adicionar à biblioteca
            </button>
          </div>
        ) : (
          <div className="user-book-active-area">
            {/* Status selector */}
            <div className="status-selector-container">
              <span className="status-label-title">Status da leitura:</span>
              <div className="status-radio-group">
                {[
                  { value: 'quero_ler', label: 'Quero ler' },
                  { value: 'lendo', label: 'Lendo' },
                  { value: 'lido', label: 'Lido' },
                  { value: 'abandonado', label: 'Abandonado' },
                ].map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    className={`status-chip-btn ${userBook.status === st.value ? 'selected' : ''}`}
                    onClick={() => handleUpdateStatus(st.value)}
                    disabled={updating}
                  >
                    <span className="radio-dot" />
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick start action if status is 'quero_ler' */}
            {userBook.status === 'quero_ler' && (
              <div className="start-reading-callout">
                <button
                  onClick={() => handleUpdateStatus('lendo')}
                  className="btn btn-secondary btn-sm"
                  disabled={updating}
                >
                  Começar leitura agora
                </button>
              </div>
            )}

            {/* Progress area */}
            <div className="progress-card-inner card">
              <div className="progress-header">
                <span className="progress-percentage-title">Progresso atual</span>
                <span className="progress-big-number">{userBook.progresso || 0}%</span>
              </div>

              <div className="large-progress-bg">
                <div
                  className="large-progress-fill"
                  style={{ width: `${userBook.progresso || 0}%` }}
                />
              </div>

              <p className="page-counter-text">
                Página {userBook.pagina_atual || 0} de {book.numero_paginas || '—'}
              </p>

              <form onSubmit={handleSaveProgress} className="update-page-form">
                <div className="page-input-group">
                  <label htmlFor="paginaAtual">Página atual</label>
                  <input
                    id="paginaAtual"
                    type="number"
                    min="0"
                    max={book.numero_paginas || 9999}
                    value={paginaInput}
                    onChange={(e) => setPaginaInput(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
                  {updating ? 'Salvando...' : 'Atualizar página'}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* SEÇÃO 3: DIÁRIO DE LEITURA */}
      <section className="diario-section card">
        <div className="section-title-wrapper">
          <h2>Meu diário de leitura</h2>
          <button onClick={() => handleOpenDiaryModal()} className="btn btn-primary btn-sm">
            <Plus size={16} /> Novo registro
          </button>
        </div>

        {diaryEntries.length > 0 ? (
          <div className="diary-entries-list">
            {diaryEntries.map((entry) => (
              <div key={entry.id} className="diary-entry-card card">
                <div className="diary-entry-header">
                  <div className="diary-date-page">
                    <span className="diary-date">
                      {new Date(entry.data_leitura).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    {entry.pagina && <span className="diary-page"> · Página {entry.pagina}</span>}
                  </div>
                  <div className="diary-actions">
                    <button
                      onClick={() => handleOpenDiaryModal(entry)}
                      className="icon-action-btn"
                      title="Editar"
                      aria-label="Editar registro"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteDiaryEntry(entry.id)}
                      className="icon-action-btn delete"
                      title="Excluir"
                      aria-label="Excluir registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="diary-stars">
                  {'★'.repeat(Math.round(entry.nota_momento || 5))}
                </div>

                <p className="diary-content-text">{entry.conteudo}</p>

                <div className="diary-footer-tags">
                  {entry.capitulo && <span>Capítulo: {entry.capitulo}</span>}
                  {entry.humor && (
                    <span className="humor-tag">
                      <Smile size={14} /> Humor: {entry.humor}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-diary-state">
            <p>Você ainda não escreveu nada sobre esta leitura.</p>
            <button onClick={() => handleOpenDiaryModal()} className="btn btn-secondary btn-sm">
              Registrar primeiro momento
            </button>
          </div>
        )}
      </section>

      {/* SEÇÃO 4: AVALIAÇÕES E RESENHAS */}
      <section className="reviews-section card">
        <h2>Avaliações da comunidade</h2>

        {/* Rating Overview */}
        <div className="rating-overview-grid">
          <div className="rating-average-box">
            <span className="average-num">{avgRatingCalc}</span>
            <div className="stars-row">
              <Star size={20} color="var(--color-accent)" fill="var(--color-accent)" />
            </div>
            <span className="total-reviews-sub">{totalReviewsCount} avaliações</span>
          </div>

          <div className="rating-bars-box">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars] || 0;
              const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
              return (
                <div key={stars} className="rating-bar-row">
                  <span className="stars-label">{stars} ★</span>
                  <div className="rating-bar-bg">
                    <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="rating-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* User's Own Review */}
        <div className="my-review-box card">
          <h3>Sua avaliação</h3>
          {myReview && !isEditingReview ? (
            <div className="my-review-display">
              <div className="stars-row">
                {'★'.repeat(Math.round(myReview.nota))}
              </div>
              <p className="my-review-text">
                {myReview.resenha || <em>Sem resenha escrita.</em>}
              </p>
              <button
                onClick={() => setIsEditingReview(true)}
                className="btn btn-outline btn-sm"
              >
                Editar avaliação
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveReview} className="review-form">
              <div className="form-group">
                <label>Sua nota (1 a 5):</label>
                <div className="star-rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-pick-btn ${reviewForm.nota >= star ? 'filled' : ''}`}
                      onClick={() => setReviewForm((prev) => ({ ...prev, nota: star }))}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="resenhaText">Sua resenha (opcional):</label>
                <textarea
                  id="resenhaText"
                  rows="4"
                  placeholder="Escreva suas impressões sobre o livro..."
                  value={reviewForm.resenha}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, resenha: e.target.value }))}
                />
              </div>

              <div className="review-form-actions">
                {isEditingReview && (
                  <button
                    type="button"
                    onClick={() => setIsEditingReview(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
                  {myReview ? 'Salvar alterações' : 'Publicar avaliação'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Community Reviews List */}
        <div className="community-reviews-list">
          <h3>Resenhas dos leitores</h3>
          {reviews.length > 0 ? (
            reviews.map((rev) => {
              const isLikedByMe = !!userLikes[rev.id];
              return (
                <div key={rev.id} className="community-review-card card">
                  <div className="review-user-header">
                    <div className="review-avatar">
                      {rev.profiles?.avatar_url ? (
                        <img src={rev.profiles.avatar_url} alt={rev.profiles.nome} />
                      ) : (
                        <BookOpen size={16} color="var(--color-primary)" />
                      )}
                    </div>
                    <div className="review-user-info">
                      <span className="review-user-name">
                        {rev.profiles?.nome || 'Leitor'}
                      </span>
                      <span className="review-user-handle">
                        @{rev.profiles?.username || 'usuario'}
                      </span>
                    </div>
                  </div>

                  <div className="review-stars-row">
                    {'★'.repeat(Math.round(rev.nota))}
                  </div>

                  {rev.resenha && <p className="review-body">"{rev.resenha}"</p>}

                  <div className="review-footer-row">
                    <span className="review-date">
                      {new Date(rev.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <button
                      className={`btn-like-review ${isLikedByMe ? 'liked' : ''}`}
                      onClick={() => handleToggleLikeReview(rev.id)}
                    >
                      <ThumbsUp size={15} />
                      <span>{isLikedByMe ? 'Curtido' : 'Curtir'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-reviews-state">
              <p>Ainda não existem resenhas publicadas para este livro.</p>
              <p>Seja o primeiro a compartilhar sua opinião com a comunidade!</p>
            </div>
          )}
        </div>
      </section>

      {/* DIARY MODAL */}
      {isDiaryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDiaryModalOpen(false)}>
          <div className="modal-content card fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingDiaryEntry ? 'Editar registro do diário' : 'Novo registro do diário'}
              </h2>
              <button onClick={() => setIsDiaryModalOpen(false)} className="close-btn" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDiaryEntry} className="diary-modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="diaryPage">Página</label>
                  <input
                    id="diaryPage"
                    type="number"
                    placeholder="Ex: 120"
                    value={diaryForm.pagina}
                    onChange={(e) =>
                      setDiaryForm((prev) => ({ ...prev, pagina: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="diaryChapter">Capítulo (opcional)</label>
                  <input
                    id="diaryChapter"
                    type="text"
                    placeholder="Ex: Cap. 5"
                    value={diaryForm.capitulo}
                    onChange={(e) =>
                      setDiaryForm((prev) => ({ ...prev, capitulo: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="diaryDate">Data da leitura</label>
                  <input
                    id="diaryDate"
                    type="date"
                    value={diaryForm.data_leitura}
                    onChange={(e) =>
                      setDiaryForm((prev) => ({ ...prev, data_leitura: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="diaryMood">Humor durante a leitura</label>
                  <select
                    id="diaryMood"
                    value={diaryForm.humor}
                    onChange={(e) =>
                      setDiaryForm((prev) => ({ ...prev, humor: e.target.value }))
                    }
                  >
                    {humorOptions.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Nota do trecho lido (1 a 5):</label>
                <div className="star-rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-pick-btn ${diaryForm.nota_momento >= star ? 'filled' : ''}`}
                      onClick={() => setDiaryForm((prev) => ({ ...prev, nota_momento: star }))}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="diaryContent">Suas impressões *</label>
                <textarea
                  id="diaryContent"
                  rows="4"
                  required
                  placeholder="Escreva seus pensamentos sobre este trecho da leitura..."
                  value={diaryForm.conteudo}
                  onChange={(e) =>
                    setDiaryForm((prev) => ({ ...prev, conteudo: e.target.value }))
                  }
                />
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  onClick={() => setIsDiaryModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  Salvar registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
