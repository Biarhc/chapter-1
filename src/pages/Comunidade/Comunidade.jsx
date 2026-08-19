import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, Heart, MessageSquare, BookOpen, UserPlus, UserCheck, Loader2, Sparkles } from 'lucide-react';
import './Comunidade.css';

export const Comunidade = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const [feedItems, setFeedItems] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [userLikesMap, setUserLikesMap] = useState({});

  useEffect(() => {
    if (user) {
      loadCommunityData();
    }
  }, [user]);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user's follows
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const fMap = {};
      if (followsData) {
        followsData.forEach((f) => {
          fMap[f.following_id] = true;
        });
      }
      setFollowingMap(fMap);

      // 2. Fetch Suggested Users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(10);

      const unfollowedProfiles = (profilesData || []).filter((p) => !fMap[p.id]);
      setSuggestedUsers(unfollowedProfiles);

      // 3. Fetch Feed Items from Reviews and UserBooks
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profiles(id, nome, username, avatar_url), books(id, titulo, autor, capa_url)')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: userBooksData } = await supabase
        .from('user_books')
        .select('*, profiles(id, nome, username, avatar_url), books(id, titulo, autor, capa_url)')
        .in('status', ['lendo', 'lido'])
        .order('updated_at', { ascending: false })
        .limit(20);

      // Fetch user's review likes
      const { data: likesData } = await supabase
        .from('likes')
        .select('review_id')
        .eq('user_id', user.id);

      const lMap = {};
      if (likesData) {
        likesData.forEach((l) => {
          lMap[l.review_id] = true;
        });
      }
      setUserLikesMap(lMap);

      // Combine feed items
      const combinedFeed = [];

      if (reviewsData) {
        reviewsData.forEach((r) => {
          combinedFeed.push({
            id: `review-${r.id}`,
            review_id: r.id,
            type: 'review',
            user: r.profiles,
            book: r.books,
            nota: r.nota,
            resenha: r.resenha,
            created_at: r.created_at,
            raw_item: r,
          });
        });
      }

      if (userBooksData) {
        userBooksData.forEach((ub) => {
          combinedFeed.push({
            id: `ub-${ub.id}`,
            type: ub.status === 'lido' ? 'completed' : 'started',
            user: ub.profiles,
            book: ub.books,
            created_at: ub.updated_at || ub.created_at,
            raw_item: ub,
          });
        });
      }

      combinedFeed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setFeedItems(combinedFeed);
    } catch (err) {
      console.error('Erro ao carregar dados da comunidade:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetUserId) => {
    const isFollowing = !!followingMap[targetUserId];
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setFollowingMap((prev) => ({ ...prev, [targetUserId]: false }));
      } else {
        const { error } = await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: targetUserId }]);

        if (error) throw error;
        setFollowingMap((prev) => ({ ...prev, [targetUserId]: true }));
      }
    } catch (err) {
      console.error('Erro ao alternar follow:', err);
    }
  };

  const handleToggleLike = async (reviewId) => {
    const isLiked = !!userLikesMap[reviewId];
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('review_id', reviewId);

        if (error) throw error;
        setUserLikesMap((prev) => ({ ...prev, [reviewId]: false }));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ user_id: user.id, review_id: reviewId }]);

        if (error) throw error;
        setUserLikesMap((prev) => ({ ...prev, [reviewId]: true }));
      }
    } catch (err) {
      console.error('Erro ao alternar curtida:', err);
    }
  };

  const filteredFeed = feedItems.filter((item) => {
    if (!item.user || !item.book) return false;

    if (activeFilter === 'Pessoas que sigo' && !followingMap[item.user.id]) return false;
    if (activeFilter === 'Resenhas' && item.type !== 'review') return false;
    if (activeFilter === 'Leituras' && (item.type !== 'completed' && item.type !== 'started')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = item.user.nome?.toLowerCase().includes(q) || item.user.username?.toLowerCase().includes(q);
      const matchBook = item.book.titulo?.toLowerCase().includes(q) || item.book.autor?.toLowerCase().includes(q);
      if (!matchUser && !matchBook) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="comunidade-loading">
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Carregando comunidade de leitores...</p>
      </div>
    );
  }

  return (
    <div className="comunidade-page">
      {/* Header */}
      <div className="comunidade-header">
        <h1>Comunidade de Leitores</h1>
        <p className="comunidade-sub">Descubra novos pontos de vista, recomendações e resenhas em tempo real.</p>
      </div>

      {/* Controls */}
      <div className="comunidade-controls-card card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar leitores ou títulos comentados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar na comunidade"
          />
        </div>

        <div className="filter-chips">
          {['Todos', 'Pessoas que sigo', 'Resenhas', 'Leituras'].map((f) => (
            <button
              key={f}
              className={`chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Feed + Suggested Users */}
      <div className="comunidade-grid">
        {/* Feed Section */}
        <div className="feed-container">
          {filteredFeed.length > 0 ? (
            filteredFeed.map((item) => {
              const isLiked = item.review_id ? !!userLikesMap[item.review_id] : false;
              return (
                <div key={item.id} className="activity-card card fade-in">
                  <div className="activity-card-header">
                    <Link to={`/perfil/${item.user.username}`} className="user-avatar-badge">
                      <div className="user-avatar">
                        {item.user.avatar_url ? (
                          <img src={item.user.avatar_url} alt={item.user.nome} />
                        ) : (
                          <BookOpen size={16} color="var(--color-primary)" />
                        )}
                      </div>
                      <div className="user-info font-bold">
                        <span className="user-name">{item.user.nome}</span>
                        <span className="user-handle">@{item.user.username}</span>
                      </div>
                    </Link>

                    <span className="activity-time">
                      {new Date(item.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <div className="activity-action-label">
                    {item.type === 'completed' && 'concluiu a leitura de'}
                    {item.type === 'started' && 'iniciou a leitura de'}
                    {item.type === 'review' && 'publicou uma avaliação de'}
                  </div>

                  {/* Book Card inside Feed */}
                  <div className="activity-book-box">
                    <div className="activity-book-cover">
                      {item.book.capa_url ? (
                        <img src={item.book.capa_url} alt={item.book.titulo} />
                      ) : (
                        <BookOpen size={22} color="var(--color-primary)" />
                      )}
                    </div>
                    <div className="activity-book-details">
                      <Link to={`/livro/${item.book.id}`} className="book-title-link">
                        {item.book.titulo}
                      </Link>
                      <p className="book-author-text">{item.book.autor}</p>

                      {item.nota && (
                        <div className="activity-stars">
                          {'★'.repeat(Math.round(item.nota))}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.resenha && <p className="activity-review-text">"{item.resenha}"</p>}

                  {item.type === 'review' && (
                    <div className="activity-footer">
                      <button
                        className={`btn-like-activity ${isLiked ? 'liked' : ''}`}
                        onClick={() => handleToggleLike(item.review_id)}
                      >
                        <Heart
                          size={16}
                          fill={isLiked ? 'var(--color-danger)' : 'none'}
                          color={isLiked ? 'var(--color-danger)' : 'var(--color-text-muted)'}
                        />
                        <span>{isLiked ? 'Curtido' : 'Curtir'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* REQUISITO 10.1: Container centralizado, redimensionado e perfeitamente equilibrado */
            <div className="empty-community-box card">
              <div className="empty-community-icon">
                <Sparkles size={28} color="var(--color-primary)" />
              </div>
              <h3>A comunidade está quietinha</h3>
              <p className="empty-sub">
                Siga outros leitores para acompanhar resenhas, status de leitura e descobertas em tempo real.
              </p>
              <button onClick={() => setActiveFilter('Todos')} className="btn btn-primary btn-sm">
                Explorar todos os leitores
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Suggested Users */}
        <aside className="suggested-users-aside card">
          <h3>Leitores para conhecer</h3>
          {suggestedUsers.length > 0 ? (
            <div className="suggested-users-list">
              {suggestedUsers.map((su) => {
                const isFollowing = !!followingMap[su.id];
                return (
                  <div key={su.id} className="suggested-user-item">
                    <Link to={`/perfil/${su.username}`} className="user-avatar-badge">
                      <div className="user-avatar">
                        {su.avatar_url ? (
                          <img src={su.avatar_url} alt={su.nome} />
                        ) : (
                          <BookOpen size={16} color="var(--color-primary)" />
                        )}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{su.nome}</span>
                        <span className="user-handle">@{su.username}</span>
                      </div>
                    </Link>

                    <button
                      className={`btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleToggleFollow(su.id)}
                    >
                      {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                      <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-suggested-text">Você já está conectado com os leitores da plataforma.</p>
          )}
        </aside>
      </div>
    </div>
  );
};
