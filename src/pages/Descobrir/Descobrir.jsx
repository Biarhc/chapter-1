import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BookCard } from '../../components/BookCard/BookCard';
import { Search, Loader2, Sparkles, User, AlertCircle, BookOpen, X } from 'lucide-react';
import './Descobrir.css';

export const Descobrir = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedAuthor = searchParams.get('autor') || 'Todas';
  const selectedGenre = searchParams.get('genero') || 'Todos';

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const authorsList = ['Todas', 'Ali Hazelwood', 'Lynn Painter', 'Colleen Hoover'];
  const genresList = [
    'Todos',
    'Romance',
    'Comédia romântica',
    'Young Adult',
    'New Adult',
    'Drama',
    'Ficção',
    'Fantasia',
    'Thriller',
  ];

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('books').select('*');

      if (selectedAuthor !== 'Todas') {
        query = query.eq('autor', selectedAuthor);
      }

      if (selectedGenre !== 'Todos') {
        query = query.contains('generos', [selectedGenre]);
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setBooks(data || []);
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
      setError('Não foi possível carregar os livros. Tente novamente.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAuthor, selectedGenre]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAuthorClick = (author) => {
    const newParams = new URLSearchParams(searchParams);
    if (author === 'Todas') {
      newParams.delete('autor');
    } else {
      newParams.set('autor', author);
    }
    setSearchParams(newParams);
  };

  const handleGenreClick = (genre) => {
    const newParams = new URLSearchParams(searchParams);
    if (genre === 'Todos') {
      newParams.delete('genero');
    } else {
      newParams.set('genero', genre);
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
  };

  const hasActiveFilters = selectedAuthor !== 'Todas' || selectedGenre !== 'Todos' || searchTerm.trim() !== '';

  const filteredBooks = books.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.titulo?.toLowerCase().includes(term) ||
      b.autor?.toLowerCase().includes(term)
    );
  });

  const popularRomances = books.slice(0, 4);

  return (
    <div className="descobrir-page">
      <div className="descobrir-header">
        <h1>Descobrir Livros</h1>
        <p className="descobrir-sub">Explore novos títulos, autores em destaque e recomendações para sua estante.</p>
      </div>

      {/* Autores Populares */}
      <section className="popular-authors-section">
        <h2>
          <User size={20} color="var(--color-primary)" /> Autores em destaque
        </h2>
        <div className="authors-cards-grid">
          {[
            { name: 'Ali Hazelwood', title: 'Romance contemporâneo & STEM', tag: 'Rom-com' },
            { name: 'Lynn Painter', title: 'Comédias românticas envolventes', tag: 'Young Adult' },
            { name: 'Colleen Hoover', title: 'Dramas e ficção de grande sucesso', tag: 'Bestseller' },
          ].map((aut) => (
            <button
              key={aut.name}
              className={`author-card card ${selectedAuthor === aut.name ? 'active' : ''}`}
              onClick={() => handleAuthorClick(aut.name)}
            >
              <div className="author-card-avatar">
                <User size={22} color="var(--color-primary)" />
              </div>
              <div className="author-card-info">
                <h3>{aut.name}</h3>
                <p>{aut.title}</p>
                <span className="author-tag">{aut.tag}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Controls: Search, Author Filters, Genre Chips */}
      <div className="descobrir-controls card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por título ou autor no catálogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar livros no catálogo"
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter By Author */}
        <div className="filter-group">
          <span className="filter-label">Autores:</span>
          <div className="chips-row">
            {authorsList.map((a) => (
              <button
                key={a}
                className={`chip ${selectedAuthor === a ? 'active' : ''}`}
                onClick={() => handleAuthorClick(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Filter By Genre */}
        <div className="filter-group">
          <span className="filter-label">Gêneros:</span>
          <div className="chips-row">
            {genresList.map((g) => (
              <button
                key={g}
                className={`chip ${selectedGenre === g ? 'active' : ''}`}
                onClick={() => handleGenreClick(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <button onClick={handleClearFilters} className="btn btn-outline btn-sm clear-filters-btn">
            <X size={14} />
            Limpar todos os filtros
          </button>
        )}
      </div>

      {/* Romances recomendados */}
      {selectedAuthor === 'Todas' && selectedGenre === 'Todos' && !searchTerm.trim() && popularRomances.length > 0 && (
        <section className="recommendations-section">
          <h2>
            <Sparkles size={20} color="var(--color-primary)" /> Romances que você pode gostar
          </h2>
          <div className="books-grid">
            {popularRomances.map((b) => (
              <BookCard key={`rec-${b.id}`} book={b} />
            ))}
          </div>
        </section>
      )}

      {/* Main Books Catalog Grid */}
      <section className="catalog-section">
        <div className="catalog-header">
          <h2>
            Catálogo{' '}
            {selectedAuthor !== 'Todas' ? `• ${selectedAuthor}` : ''}
            {selectedGenre !== 'Todos' ? ` (${selectedGenre})` : ''}
          </h2>
          {!loading && !error && (
            <span className="catalog-count">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'livro' : 'livros'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="descobrir-loading">
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <p>Carregando livros...</p>
          </div>
        ) : error ? (
          <div className="no-books-found card error-state">
            <AlertCircle size={32} color="var(--color-danger)" />
            <p>{error}</p>
            <button onClick={fetchBooks} className="btn btn-primary btn-sm">
              Tentar novamente
            </button>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="books-grid">
            {filteredBooks.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div className="no-books-found card">
            <BookOpen size={32} color="var(--color-text-muted)" />
            {hasActiveFilters ? (
              <>
                <p>Nenhum livro encontrado com os filtros selecionados.</p>
                <button
                  onClick={handleClearFilters}
                  className="btn btn-secondary btn-sm"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <p>Nenhum livro cadastrado no catálogo ainda.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
