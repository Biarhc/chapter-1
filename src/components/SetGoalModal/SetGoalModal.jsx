import React, { useState, useEffect } from 'react';
import { Target, Plus, Minus, X, Check } from 'lucide-react';
import './SetGoalModal.css';

export const SetGoalModal = ({ isOpen, onClose, initialGoal = 12, onSave, year }) => {
  const [goal, setGoal] = useState(initialGoal || 12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGoal(initialGoal && initialGoal > 0 ? initialGoal : 12);
      setError('');
    }
  }, [isOpen, initialGoal]);

  if (!isOpen) return null;

  const currentTargetYear = year || new Date().getFullYear();

  const handleDecrement = () => {
    setGoal((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setGoal((prev) => Math.min(365, prev + 1));
  };

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setGoal('');
    } else {
      setGoal(Math.max(1, Math.min(365, val)));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const finalValue = parseInt(goal, 10);
    if (isNaN(finalValue) || finalValue <= 0) {
      setError('Por favor, insira um número válido maior que zero.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(finalValue);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar meta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="goal-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-goal-title">
      <div className="goal-modal-card card fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="goal-modal-header">
          <div className="goal-modal-title-row">
            <div className="goal-modal-icon">
              <Target size={22} color="var(--color-primary)" />
            </div>
            <h2 id="modal-goal-title">Definir meta de leitura</h2>
          </div>
          <button className="goal-close-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>

        <p className="goal-modal-desc">
          Quantos livros você pretende ler em <strong>{currentTargetYear}</strong>?
        </p>

        {error && <div className="goal-modal-error">{error}</div>}

        <form onSubmit={handleFormSubmit} className="goal-modal-form">
          <div className="goal-stepper-container">
            <button
              type="button"
              className="stepper-btn"
              onClick={handleDecrement}
              aria-label="Diminuir meta"
              disabled={goal <= 1}
            >
              <Minus size={20} />
            </button>

            <div className="stepper-input-wrapper">
              <input
                type="number"
                min="1"
                max="365"
                value={goal}
                onChange={handleInputChange}
                className="stepper-number-input"
                aria-label="Número de livros da meta"
                autoFocus
              />
              <span className="stepper-unit">livros / ano</span>
            </div>

            <button
              type="button"
              className="stepper-btn"
              onClick={handleIncrement}
              aria-label="Aumentar meta"
              disabled={goal >= 365}
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="goal-modal-actions">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : (
                <>
                  <Check size={16} /> Salvar meta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
