import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star } from 'lucide-react';
import { bookCoversMap } from '../../lib/bookCovers';
import './BookCard.css';

export const BookCard = ({ userBook, book }) => {
  const targetBook = book || userBook?.books;
  const [imageError, setImageError] = useState(false);

  if (!targetBook) return null;

  const progress = userBook?.progresso ?? (userBook?.pagina_atual && targetBook.numero_paginas
    ? Math.min(100, Math.round((userBook.pagina_atual / targetBook.numero_paginas) * 100))
    : 0);

  const statusLabels = {
    quero_ler: 'Quero ler',
    lendo: 'Lendo',
    lido: 'Lido',
    abandonado: 'Abandonado',
  };

  // Determina a URL da capa real (banco ou mapa de fallback garantido)
  const coverUrl = targetBook.capa_url || bookCoversMap[targetBook.titulo];
  const hasValidCover = Boolean(coverUrl) && !imageError;

  // Display the first genre if available (for catalog view)
  const primaryGenre = targetBook.generos?.[0];

  return (
    <Link to={`/livro/${targetBook.id}`} className="book-card card">
      <div className="book-cover-wrapper">
        {hasValidCover ? (
          <img
            src={coverUrl}
            alt={targetBook.titulo || 'Capa do livro'}
            className="book-cover-img"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="book-cover-placeholder">
            <BookOpen size={28} className="placeholder-icon" />
            <span className="placeholder-title">{targetBook.titulo}</span>
          </div>
        )}
        {userBook?.status && (
          <span className={`status-badge status-${userBook.status}`}>
            {statusLabels[userBook.status] || userBook.status}
          </span>
        )}
      </div>

      <div className="book-card-info">
        <h3 className="book-title" title={targetBook.titulo}>
          {targetBook.titulo}
        </h3>
        <p className="book-author">{targetBook.autor}</p>

        {/* Genre tag — shown in catalog context (when no userBook) */}
        {!userBook && primaryGenre && (
          <span className="book-genre-tag">{primaryGenre}</span>
        )}

        {/* Rating — shown when available */}
        {targetBook.avaliacao_media != null && targetBook.avaliacao_media > 0 && (
          <div className="book-rating">
            <Star size={13} className="star-icon" />
            <span>{Number(targetBook.avaliacao_media).toFixed(1)}</span>
          </div>
        )}

        {userBook && (
          <div className="book-progress-wrapper">
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
      </div>
    </Link>
  );
};
