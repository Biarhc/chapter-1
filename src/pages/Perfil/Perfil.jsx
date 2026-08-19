import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { BookCard } from '../../components/BookCard/BookCard';
import { StatCard } from '../../components/StatCard/StatCard';
import {
  User,
  Edit,
  LogOut,
  BookOpen,
  Flame,
  Award,
  Star,
  Heart,
  UserPlus,
  UserCheck,
  X,
  Loader2
} from 'lucide-react';
import './Perfil.css';

export const Perfil = () => {
  const { username } = useParams();
  const { user, profile: authProfile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !username || (authProfile && authProfile.username === username);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Stats
  const [userStats, setUserStats] = useState({
    booksRead: 0,
    readingNow: 0,
    achievementsCount: 0,
    avgRating: '—',
  });
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Sections Data
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    username: '',
    bio: '',
    avatar_url: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    loadProfileDetails();
  }, [username, user]);

  const loadProfileDetails = async () => {
    setLoading(true);
    try {
      let targetProfile = null;

      if (isOwnProfile) {
        targetProfile = authProfile;
      } else {
        const { data: pData, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (pErr) throw pErr;
        targetProfile = pData;
      }

      setProfileData(targetProfile);
      if (!targetProfile) return;

      setEditForm({
        nome: targetProfile.nome || '',
        username: targetProfile.username || '',
        bio: targetProfile.bio || '',
        avatar_url: targetProfile.avatar_url || '',
      });

      const targetUserId = targetProfile.id;

      if (user && !isOwnProfile) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single();

        setIsFollowing(!!followData);
      }

      const { count: fersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);
      setFollowersCount(fersCount || 0);

      const { count: fingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);
      setFollowingCount(fingCount || 0);

      const { count: bRead } = await supabase
        .from('user_books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('status', 'lido');

      const { count: rNow } = await supabase
        .from('user_books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('status', 'lendo');

      const { count: achCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      const { data: revs } = await supabase
        .from('reviews')
        .select('nota')
        .eq('user_id', targetUserId);

      let avg = '—';
      if (revs && revs.length > 0) {
        const sum = revs.reduce((acc, r) => acc + Number(r.nota), 0);
        avg = (sum / revs.length).toFixed(1);
      }

      setUserStats({
        booksRead: bRead || 0,
        readingNow: rNow || 0,
        achievementsCount: achCount || 0,
        avgRating: avg,
      });

      const { data: favs } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', targetUserId)
        .eq('favorito', true);
      setFavoriteBooks(favs || []);

      const { data: reading } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', targetUserId)
        .eq('status', 'lendo');
      setCurrentlyReadingBooks(reading || []);

      const { data: userRevs } = await supabase
        .from('reviews')
        .select('*, books(*)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentReviews(userRevs || []);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !profileData) return;
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id);

        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: profileData.id }]);

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user || !profileData) return;

    try {
      setUpdatingProfile(true);
      const updates = {
        nome: editForm.nome,
        username: editForm.username.toLowerCase().trim(),
        bio: editForm.bio,
        avatar_url: editForm.avatar_url,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfileData(data);
      await refreshProfile();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      alert('Erro ao salvar perfil. O username pode já estar em uso.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Carregando perfil do leitor...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="perfil-not-found card">
        <h2>Perfil não encontrado</h2>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-2">
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      {/* Header do Perfil */}
      <section className="perfil-header-card card">
        <div className="perfil-header-top">
          <div className="perfil-avatar-container">
            {profileData.avatar_url ? (
              <img src={profileData.avatar_url} alt={profileData.nome} />
            ) : (
              <div className="avatar-placeholder font-serif">
                {profileData.nome ? profileData.nome.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div className="perfil-main-info">
            <h1>{profileData.nome}</h1>
            <span className="perfil-username">@{profileData.username}</span>
            {profileData.bio && <p className="perfil-bio">"{profileData.bio}"</p>}

            <div className="perfil-social-counters">
              <span><strong>{userStats.booksRead}</strong> livros lidos</span>
              <span><strong>{followersCount}</strong> seguidores</span>
              <span><strong>{followingCount}</strong> seguindo</span>
            </div>
          </div>
        </div>

        <div className="perfil-header-actions">
          {isOwnProfile ? (
            <div className="own-profile-btns">
              <button onClick={() => setIsEditModalOpen(true)} className="btn btn-outline btn-sm">
                <Edit size={16} /> Editar perfil
              </button>
              <button onClick={handleLogout} className="btn btn-logout-sm">
                <LogOut size={16} /> Sair
              </button>
            </div>
          ) : (
            <button
              className={`btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleToggleFollow}
            >
              {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
              <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Estatísticas Rápidas */}
      <section className="perfil-stats-grid">
        <StatCard icon={BookOpen} value={userStats.booksRead} label="Livros lidos" />
        <StatCard icon={Flame} value={userStats.readingNow} label="Lendo agora" />
        <StatCard icon={Award} value={userStats.achievementsCount} label="Conquistas" />
        <StatCard icon={Star} value={userStats.avgRating} label="Média de avaliação" />
      </section>

      {/* Livros Lendo Atualmente */}
      {currentlyReadingBooks.length > 0 && (
        <section className="perfil-section card">
          <h2>Lendo atualmente</h2>
          <div className="books-grid">
            {currentlyReadingBooks.map((ub) => (
              <BookCard key={ub.id} userBook={ub} />
            ))}
          </div>
        </section>
      )}

      {/* Livros Favoritos */}
      <section className="perfil-section card">
        <h2>
          <Heart size={20} color="var(--color-danger)" fill="var(--color-danger)" /> Meus favoritos
        </h2>
        {favoriteBooks.length > 0 ? (
          <div className="books-grid">
            {favoriteBooks.map((ub) => (
              <BookCard key={ub.id} userBook={ub} />
            ))}
          </div>
        ) : (
          <p className="no-data-text">Nenhum livro marcado como favorito ainda.</p>
        )}
      </section>

      {/* Resenhas Recentes */}
      <section className="perfil-section card">
        <h2>Resenhas publicadas</h2>
        {recentReviews.length > 0 ? (
          <div className="user-reviews-list">
            {recentReviews.map((rev) => (
              <div key={rev.id} className="user-review-item card">
                <div className="review-book-cover">
                  {rev.books?.capa_url ? (
                    <img src={rev.books.capa_url} alt={rev.books.titulo} />
                  ) : (
                    <BookOpen size={22} color="var(--color-primary)" />
                  )}
                </div>
                <div className="review-content-col">
                  <Link to={`/livro/${rev.books?.id}`} className="review-book-title">
                    {rev.books?.titulo}
                  </Link>
                  <div className="review-stars-row">{'★'.repeat(Math.round(rev.nota))}</div>
                  {rev.resenha && <p className="review-text">"{rev.resenha}"</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-text">Nenhuma resenha publicada ainda.</p>
        )}
      </section>

      {/* Informações da Conta */}
      {isOwnProfile && (
        <section className="perfil-section card">
          <h2>Informações da conta</h2>
          <div className="account-info-grid">
            <div className="account-info-box">
              <span className="account-label">E-mail</span>
              <span className="account-val">{user?.email}</span>
            </div>
            <div className="account-info-box">
              <span className="account-label">Username</span>
              <span className="account-val">@{profileData.username}</span>
            </div>
            <div className="account-info-box">
              <span className="account-label">Data de cadastro</span>
              <span className="account-val">
                {new Date(profileData.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content card fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Perfil</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="close-btn" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              <div className="form-group">
                <label htmlFor="editNome">Nome completo</label>
                <input
                  id="editNome"
                  type="text"
                  required
                  value={editForm.nome}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editUsername">Username</label>
                <input
                  id="editUsername"
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editBio">Bio / Apresentação</label>
                <textarea
                  id="editBio"
                  rows="3"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editAvatar">URL do Avatar</label>
                <input
                  id="editAvatar"
                  type="text"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, avatar_url: e.target.value }))}
                />
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? 'Salvando...' : 'Salvar perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
