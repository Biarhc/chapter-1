import React from 'react';
import { useAchievements } from '../../hooks/useAchievements';
import {
  Award,
  Lock,
  CheckCircle2,
  Sparkles,
  Loader2,
  BookOpen,
  Library,
  Flame,
  Star,
  PenTool,
  Compass,
  Target,
  Trophy,
  BookmarkCheck
} from 'lucide-react';
import './Conquistas.css';

const ICON_MAP = {
  BookOpen,
  Library,
  Award,
  Flame,
  Star,
  PenTool,
  Compass,
  Target,
  Trophy,
  BookmarkCheck,
};

export const Conquistas = () => {
  const { achievements, userAchievements, userStats, loading, newlyUnlocked } = useAchievements();

  if (loading) {
    return (
      <div className="conquistas-loading">
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Carregando conquistas do leitor...</p>
      </div>
    );
  }

  const totalAchievements = achievements.length;
  const unlockedCount = userAchievements.length;
  const overallProgress = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  const unlockedMap = {};
  userAchievements.forEach((ua) => {
    unlockedMap[ua.achievement_id] = true;
  });

  const getProgressForAch = (ach) => {
    const req = ach.requisito || 1;
    let currentVal = 0;

    if (ach.tipo === 'leitura') currentVal = userStats.booksRead || 0;
    else if (ach.tipo === 'avaliacao') currentVal = userStats.ratingsCount || 0;
    else if (ach.tipo === 'resenha') currentVal = userStats.reviewsCount || 0;
    else if (ach.tipo === 'generos') currentVal = userStats.genresCount || 0;
    else if (ach.tipo === 'diario') currentVal = userStats.diaryCount || 0;
    else if (ach.tipo === 'meta_criada') currentVal = userStats.hasGoal ? 1 : 0;
    else if (ach.tipo === 'meta_cumprida') currentVal = userStats.goalCompleted ? 1 : 0;

    const numProgress = Math.min(req, currentVal);
    const itemProgressPct = Math.min(100, Math.round((numProgress / req) * 100));

    return { numProgress, req, itemProgressPct };
  };

  return (
    <div className="conquistas-page">
      {/* Toast popup */}
      {newlyUnlocked && (
        <div className="achievement-toast card fade-in">
          <Sparkles size={24} color="var(--color-accent)" />
          <div>
            <h4>Nova Conquista Desbloqueada!</h4>
            <p>{newlyUnlocked.nome}</p>
          </div>
        </div>
      )}

      <div className="conquistas-header">
        <h1>Conquistas do Leitor</h1>
        <p className="conquistas-sub">Cada página lida e resenha compartilhada desbloqueia novos marcos literários.</p>
      </div>

      {/* Resumo Header Card */}
      <div className="achievements-summary-card card">
        <div className="summary-info">
          <div className="summary-icon-box">
            <Trophy size={28} color="var(--color-primary)" />
          </div>
          <div>
            <span className="summary-title">
              {unlockedCount} de {totalAchievements} conquistas desbloqueadas
            </span>
            <span className="summary-sub">{overallProgress}% da jornada concluída</span>
          </div>
        </div>
        <div className="dashboard-progress-bar">
          <div className="dashboard-progress-fill" style={{ width: `${overallProgress}%` }} />
        </div>
      </div>

      {/* Grid de Conquistas */}
      <div className="achievements-grid">
        {achievements.map((ach) => {
          const isUnlocked = !!unlockedMap[ach.id];
          const { numProgress, req, itemProgressPct } = getProgressForAch(ach);
          const IconComponent = ICON_MAP[ach.icon] || Award;

          return (
            <div
              key={ach.id}
              className={`achievement-card card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon-wrapper">
                {isUnlocked ? (
                  <IconComponent size={28} className="ach-unlocked-icon" />
                ) : (
                  <Lock size={24} className="ach-locked-icon" />
                )}
              </div>

              <h3 className="achievement-name">{ach.nome}</h3>
              <p className="achievement-desc">{ach.descricao}</p>

              {isUnlocked ? (
                <div className="unlocked-badge">
                  <CheckCircle2 size={15} />
                  <span>Desbloqueada</span>
                </div>
              ) : (
                <div className="achievement-progress-wrapper">
                  <div className="ach-progress-text">
                    Progresso: {numProgress} / {req}
                  </div>
                  <div className="dashboard-progress-bar">
                    <div
                      className="dashboard-progress-fill"
                      style={{ width: `${itemProgressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
