import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BookCard } from '../../components/BookCard/BookCard';
import { Search, Loader2, Sparkles, User, Tag, BookOpen } from 'lucide-react';
import './Descobrir.css';

export const Descobrir = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedAuthor = searchParams.get('autor') || 'Todas';
  const selectedGenre = searchParams.get('genero') || 'Todos';

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
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
  ];

  useEffect(() => {
    fetchBooks();
  }, [selectedAuthor, selectedGenre]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let query = supabase.from('books').select('*');

      if (selectedAuthor !== 'Todas') {
        query = query.eq('autor', selectedAuthor);
      }

      if (selectedGenre !== 'Todos') {
        query = query.contains('generos', [selectedGenre]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

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
      </div>

      {/* Romances recomendados */}
      {selectedAuthor === 'Todas' && selectedGenre === 'Todos' && popularRomances.length > 0 && (
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
        <h2>
          Catálogo{' '}
          {selectedAuthor !== 'Todas' ? `• ${selectedAuthor}` : ''}
          {selectedGenre !== 'Todos' ? ` (${selectedGenre})` : ''}
        </h2>

        {loading ? (
          <div className="descobrir-loading">
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <p>Carregando livros...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="books-grid">
            {filteredBooks.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div className="no-books-found card">
            <p>Nenhum livro encontrado com os filtros selecionados.</p>
            <button
              onClick={() => {
                setSearchParams({});
                setSearchTerm('');
              }}
              className="btn btn-secondary btn-sm mt-2"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
