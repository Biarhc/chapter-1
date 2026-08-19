import React from 'react';
import { BookOpen } from 'lucide-react';
import './EmptyState.css';

export const EmptyState = ({ title, description, actionText, onAction, icon: Icon = BookOpen }) => {
  return (
    <div className="empty-state card">
      <div className="empty-state-icon">
        <Icon size={32} color="var(--color-primary)" />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm empty-state-btn">
          {actionText}
        </button>
      )}
    </div>
  );
};
