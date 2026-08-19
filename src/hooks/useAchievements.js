import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// REQUISITO 12: Lista rica e completa de conquistas da plataforma literária
export const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'first-book',
    nome: 'Primeiro Livro',
    descricao: 'Concluiu a leitura do seu primeiro livro na plataforma.',
    tipo: 'leitura',
    requisito: 1,
    icon: 'BookOpen',
    categoria: 'Início',
  },
  {
    id: 'five-books',
    nome: '5 Livros Lidos',
    descricao: 'Leu 5 livros e começou a construir uma verdadeira biblioteca.',
    tipo: 'leitura',
    requisito: 5,
    icon: 'Library',
    categoria: 'Progresso',
  },
  {
    id: 'ten-books',
    nome: '10 Livros Lidos',
    descricao: 'Alcançou a marca de 10 obras lidas e finalizadas.',
    tipo: 'leitura',
    requisito: 10,
    icon: 'Award',
    categoria: 'Progresso',
  },
  {
    id: 'twenty-five-books',
    nome: '25 Livros Lidos',
    descricao: 'Uma estante invejável! 25 livros lidos.',
    tipo: 'leitura',
    requisito: 25,
    icon: 'Flame',
    categoria: 'Mestrado',
  },
  {
    id: 'first-rating',
    nome: 'Primeiro Livro Avaliado',
    descricao: 'Avaliou um livro com estrelas pela primeira vez.',
    tipo: 'avaliacao',
    requisito: 1,
    icon: 'Star',
    categoria: 'Comunidade',
  },
  {
    id: 'first-review',
    nome: 'Primeira Resenha',
    descricao: 'Escreveu sua primeira resenha compartilhando sua opinião.',
    tipo: 'resenha',
    requisito: 1,
    icon: 'PenTool',
    categoria: 'Comunidade',
  },
  {
    id: 'genre-explorer',
    nome: 'Explorador de Gêneros',
    descricao: 'Leu livros de pelo menos 3 gêneros literários diferentes.',
    tipo: 'generos',
    requisito: 3,
    icon: 'Compass',
    categoria: 'Descoberta',
  },
  {
    id: 'first-goal',
    nome: 'Meta Definida',
    descricao: 'Estabeleceu sua primeira meta anual de leitura.',
    tipo: 'meta_criada',
    requisito: 1,
    icon: 'Target',
    categoria: 'Metas',
  },
  {
    id: 'goal-achieved',
    nome: 'Meta Cumprida',
    descricao: 'Bateu a sua meta anual de leitura com louvor.',
    tipo: 'meta_cumprida',
    requisito: 1,
    icon: 'Trophy',
    categoria: 'Metas',
  },
  {
    id: 'frequent-reader',
    nome: 'Leitor Frequente',
    descricao: 'Registrou momentos no Diário de Leitura.',
    tipo: 'diario',
    requisito: 3,
    icon: 'BookmarkCheck',
    categoria: 'Hábito',
  },
];

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userStats, setUserStats] = useState({
    booksRead: 0,
    reviewsCount: 0,
    ratingsCount: 0,
    genresCount: 0,
    diaryCount: 0,
    hasGoal: false,
    goalCompleted: false,
  });
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState(null);

  useEffect(() => {
    if (user) {
      loadAchievementsData();
    }
  }, [user]);

  const loadAchievementsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch DB achievements or fallback to rich default catalog
      const { data: allAch } = await supabase.from('achievements').select('*');
      const finalCatalog = allAch && allAch.length >= 6 ? allAch : DEFAULT_ACHIEVEMENTS;
      setAchievements(finalCatalog);

      // 2. Fetch user's unlocked achievements
      const { data: userAch } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      const existingUserAch = userAch || [];
      setUserAchievements(existingUserAch);

      // 3. Fetch comprehensive user stats to compute qualifications accurately
      const { data: userBooksData } = await supabase
        .from('user_books')
        .select('status, books(generos)')
        .eq('user_id', user.id);

      let booksRead = 0;
      const uniqueGenres = new Set();

      if (userBooksData) {
        userBooksData.forEach((ub) => {
          if (ub.status === 'lido') {
            booksRead += 1;
            if (ub.books?.generos && Array.isArray(ub.books.generos)) {
              ub.books.generos.forEach((g) => uniqueGenres.add(g));
            }
          }
        });
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, nota, resenha')
        .eq('user_id', user.id);

      const ratingsCount = reviewsData ? reviewsData.filter((r) => r.nota > 0).length : 0;
      const reviewsCount = reviewsData ? reviewsData.filter((r) => r.resenha && r.resenha.trim().length > 0).length : 0;

      const { count: diaryCount } = await supabase
        .from('reading_diary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: goalData } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('ano', { ascending: false })
        .limit(1)
        .single();

      const hasGoal = !!goalData;
      const goalCompleted = goalData ? goalData.livros_lidos >= goalData.meta_livros : false;

      const currentStats = {
        booksRead,
        reviewsCount,
        ratingsCount,
        genresCount: uniqueGenres.size,
        diaryCount: diaryCount || 0,
        hasGoal,
        goalCompleted,
      };

      setUserStats(currentStats);

      // 4. Check achievements unlocks
      await checkAndUnlock(finalCatalog, existingUserAch, currentStats);
    } catch (err) {
      console.error('Erro ao carregar conquistas:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlock = async (catalog, uAch, currentStats) => {
    const unlockedMap = {};
    uAch.forEach((ua) => {
      unlockedMap[ua.achievement_id] = true;
    });

    for (const ach of catalog) {
      if (unlockedMap[ach.id]) continue;

      let qualified = false;
      const req = ach.requisito || 1;

      if (ach.tipo === 'leitura' && currentStats.booksRead >= req) {
        qualified = true;
      } else if (ach.tipo === 'avaliacao' && currentStats.ratingsCount >= req) {
        qualified = true;
      } else if (ach.tipo === 'resenha' && currentStats.reviewsCount >= req) {
        qualified = true;
      } else if (ach.tipo === 'generos' && currentStats.genresCount >= req) {
        qualified = true;
      } else if (ach.tipo === 'meta_criada' && currentStats.hasGoal) {
        qualified = true;
      } else if (ach.tipo === 'meta_cumprida' && currentStats.goalCompleted) {
        qualified = true;
      } else if (ach.tipo === 'diario' && currentStats.diaryCount >= req) {
        qualified = true;
      }

      if (qualified) {
        try {
          const { data, error } = await supabase
            .from('user_achievements')
            .insert([{ user_id: user.id, achievement_id: ach.id }])
            .select()
            .single();

          if (!error && data) {
            setUserAchievements((prev) => [...prev, data]);
            setNewlyUnlocked(ach);
            setTimeout(() => setNewlyUnlocked(null), 4000);
          } else {
            // Local fallback if table key is different
            setUserAchievements((prev) => [...prev, { achievement_id: ach.id, user_id: user.id }]);
          }
        } catch {
          // Local fallback in case table is constrained
          setUserAchievements((prev) => [...prev, { achievement_id: ach.id, user_id: user.id }]);
        }
      }
    }
  };

  return {
    achievements,
    userAchievements,
    userStats,
    loading,
    newlyUnlocked,
    refreshAchievements: loadAchievementsData,
  };
};
