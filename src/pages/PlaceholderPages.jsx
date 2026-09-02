import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookCard } from '../components/BookCard/BookCard';
import { Search, Loader2 } from 'lucide-react';

export const Descobrir = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('books').select('*');
      if (error) throw error;
      setBooks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = books.filter(
    (b) =>
      b.titulo.toLowerCase().includes(search.toLowerCase()) ||
      b.autor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-text)' }}>
          Descobrir Livros
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Explore novos títulos para sua biblioteca</p>
      </div>

      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar no catálogo por título ou autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        </div>
      ) : (
        <div className="books-grid">
          {filtered.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
};
