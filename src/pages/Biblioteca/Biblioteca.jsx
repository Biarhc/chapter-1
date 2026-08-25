import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { BookCard } from '../../components/BookCard/BookCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Search, Plus, Loader2, BookOpen, X, SlidersHorizontal } from 'lucide-react';
import { bookCoversMap } from '../../lib/bookCovers';
import './Biblioteca.css';

export const Biblioteca = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [userBooks, setUserBooks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [sortOption, setSortOption] = useState('recentes');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for adding book
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchAvailableBooks, setSearchAvailableBooks] = useState('');
  const [availableBooks, setAvailableBooks] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [addingBookId, setAddingBookId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserBooks();
    }
  }, [user]);

  const fetchUserBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserBooks(data || []);
    } catch (err) {
      console.error('Erro ao buscar biblioteca:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    setSearchAvailableBooks('');
    setSearchingBooks(true);

    try {
      const { data, error } = await supabase.from('books').select('*').limit(20);
      if (error) throw error;
      setAvailableBooks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingBooks(false);
    }
  };

  const handleSearchAvailable = async (query) => {
    setSearchAvailableBooks(query);
    if (!query.trim()) {
      handleOpenAddModal();
      return;
    }

    setSearchingBooks(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`titulo.ilike.%${query}%,autor.ilike.%${query}%`);

      if (error) throw error;
      setAvailableBooks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingBooks(false);
    }
  };

  const handleAddBookToLibrary = async (bookId) => {
    const existing = userBooks.find((ub) => ub.book_id === bookId);
    if (existing) {
      alert('Este livro já está na sua biblioteca!');
      return;
    }

    setAddingBookId(bookId);
    try {
      const { data, error } = await supabase
        .from('user_books')
        .insert([
          {
            user_id: user.id,
            book_id: bookId,
            status: 'quero_ler',
            progresso: 0,
            pagina_atual: 0,
            favorito: false,
          },
        ])
        .select('*, books(*)')
        .single();

      if (error) throw error;

      setUserBooks((prev) => [data, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Erro ao adicionar livro:', err);
      alert('Erro ao adicionar livro à biblioteca.');
    } finally {
      setAddingBookId(null);
    }
  };

  // Filter & Search & Sort Logic
  const filteredBooks = userBooks.filter((ub) => {
    const book = ub.books;
    if (!book) return false;

    if (activeFilter === 'Quero ler' && ub.status !== 'quero_ler') return false;
    if (activeFilter === 'Lendo' && ub.status !== 'lendo') return false;
    if (activeFilter === 'Lidos' && ub.status !== 'lido') return false;
    if (activeFilter === 'Abandonados' && ub.status !== 'abandonado') return false;
    if (activeFilter === 'Favoritos' && !ub.favorito) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = book.titulo?.toLowerCase().includes(term);
      const matchAuthor = book.autor?.toLowerCase().includes(term);
      if (!matchTitle && !matchAuthor) return false;
    }

    return true;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortOption === 'recentes') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortOption === 'titulo_az') {
      return (a.books?.titulo || '').localeCompare(b.books?.titulo || '');
    }
    if (sortOption === 'autor_az') {
      return (a.books?.autor || '').localeCompare(b.books?.autor || '');
    }
    if (sortOption === 'progresso') {
      return (b.progresso || 0) - (a.progresso || 0);
    }
    return 0;
  });

  // Calculate statistics metrics for the boxes
  const booksReadCount = userBooks.filter((ub) => ub.status === 'lido').length;
  const readingNowCount = userBooks.filter((ub) => ub.status === 'lendo').length;
  const wantToReadCount = userBooks.filter((ub) => ub.status === 'quero_ler').length;
  const abandonedCount = userBooks.filter((ub) => ub.status === 'abandonado').length;

  const filters = ['Todos', 'Quero ler', 'Lendo', 'Lidos', 'Abandonados', 'Favoritos'];

  const formatNumberBox = (num) => String(num).padStart(2, '0');

  if (loading) {
    return (
      <div className="biblioteca-loading">
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Carregando sua biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="biblioteca-page">
      {/* Header */}
      <div className="biblioteca-header">
        <div>
          <h1>Minha Biblioteca</h1>
          <p className="biblioteca-sub">Organize, acompanhe e explore sua coleção de leituras</p>
        </div>

        <button onClick={handleOpenAddModal} className="btn btn-primary">
          <Plus size={18} /> Adicionar livro
        </button>
      </div>

      {/* REQUISITO 7: Estatísticas da Biblioteca em caixas [ XX ] Nome */}
      <div className="library-stats-indicators">
        <div className="stat-indicator-item card" onClick={() => setActiveFilter('Lidos')}>
          <div className="stat-number-box">{formatNumberBox(booksReadCount)}</div>
          <span className="stat-indicator-label">Livros Lidos</span>
        </div>

        <div className="stat-indicator-item card" onClick={() => setActiveFilter('Lendo')}>
          <div className="stat-number-box highlight-reading">{formatNumberBox(readingNowCount)}</div>
          <span className="stat-indicator-label">Lendo</span>
        </div>

        <div className="stat-indicator-item card" onClick={() => setActiveFilter('Quero ler')}>
          <div className="stat-number-box highlight-want">{formatNumberBox(wantToReadCount)}</div>
          <span className="stat-indicator-label">Quero Ler</span>
        </div>

        {abandonedCount > 0 && (
          <div className="stat-indicator-item card" onClick={() => setActiveFilter('Abandonados')}>
            <div className="stat-number-box highlight-abandoned">{formatNumberBox(abandonedCount)}</div>
            <span className="stat-indicator-label">Abandonados</span>
          </div>
        )}
      </div>

      {/* REQUISITOS 8 & 9: Controles Padronizados & Seletor de Ordenação Refatorado */}
      <div className="biblioteca-controls-card card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por título ou autor na sua estante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar livros na biblioteca"
          />
        </div>

        <div className="sort-wrapper">
          <SlidersHorizontal size={16} className="sort-icon" />
          <label htmlFor="sort-select">Ordenar por:</label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="sort-dropdown"
          >
            <option value="recentes">Mais recentemente adicionados</option>
            <option value="titulo_az">Título (A-Z)</option>
            <option value="autor_az">Autor (A-Z)</option>
            <option value="progresso">Maior progresso</option>
          </select>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="filter-chips" role="tablist" aria-label="Filtros de status">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
            role="tab"
            aria-selected={activeFilter === filter}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Books Grid / Empty State */}
      {sortedBooks.length > 0 ? (
        <div className="biblioteca-grid">
          {sortedBooks.map((ub) => (
            <BookCard key={ub.id} userBook={ub} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sua estante está esperando por histórias."
          description={
            searchTerm
              ? 'Nenhum livro da sua biblioteca corresponde à pesquisa.'
              : 'Você ainda não adicionou livros a esta categoria.'
          }
          actionText="Adicionar livro à biblioteca"
          onAction={handleOpenAddModal}
        />
      )}

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content card fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar livro à Biblioteca</h2>
              <button
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Pesquisar por título ou autor..."
                value={searchAvailableBooks}
                onChange={(e) => handleSearchAvailable(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-books-list">
              {searchingBooks ? (
                <div className="modal-loading">
                  <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
                  <p>Buscando títulos disponíveis...</p>
                </div>
              ) : availableBooks.length > 0 ? (
                availableBooks.map((b) => {
                  const isAdded = userBooks.some((ub) => ub.book_id === b.id);
                  return (
                    <div key={b.id} className="modal-book-item">
                      <div className="modal-book-cover">
                        {(b.capa_url || bookCoversMap[b.titulo]) ? (
                          <img src={b.capa_url || bookCoversMap[b.titulo]} alt={b.titulo} />
                        ) : (
                          <BookOpen size={20} color="var(--color-primary)" />
                        )}
                      </div>
                      <div className="modal-book-info">
                        <h4>{b.titulo}</h4>
                        <p>{b.autor}</p>
                      </div>
                      <button
                        className={`btn btn-sm ${isAdded ? 'btn-outline' : 'btn-primary'}`}
                        disabled={isAdded || addingBookId === b.id}
                        onClick={() => handleAddBookToLibrary(b.id)}
                      >
                        {isAdded
                          ? 'Na biblioteca'
                          : addingBookId === b.id
                          ? 'Adicionando...'
                          : '+ Adicionar'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="no-books-found">Nenhum livro encontrado no catálogo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
