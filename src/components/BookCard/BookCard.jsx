import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
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

  const hasValidCover = targetBook.capa_url && !imageError;

  return (
    <Link to={`/livro/${targetBook.id}`} className="book-card card">
      <div className="book-cover-wrapper">
        {hasValidCover ? (
          <img
            src={targetBook.capa_url}
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
