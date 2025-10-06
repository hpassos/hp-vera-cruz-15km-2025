import type { Plan, Week } from '../state';
import { getWeekMidTarget, getRealizedKm } from './plan';

export interface Achievements {
  currentStreak: number;
  badges: string[];
}

const BADGES = {
  PERFECT_WEEK: 'Semana Perfeita (100%)',
  CONSISTENCY_3X: 'Consistência (3x 90%)',
  FIRST_50K: 'Marco: 50km Corridos',
};

/**
 * Calcula as conquistas do usuário com base no histórico do plano.
 * @param {Plan} plan O plano de treino completo.
 * @returns {Achievements} Um objeto com a sequência atual e as medalhas ganhas.
 */
export function calculateAchievements(plan: Plan): Achievements {
  let consecutiveWeeks = 0;
  const badges: Set<string> = new Set();
  let totalKm = 0;
  let totalConsistentWeeks = 0;

  const weeksWithProgress = plan.weeks.filter(w => (w.realized_km !== undefined && w.realized_km > 0) || w.sessions?.some(s => s.done));

  // Itera de trás para frente para encontrar a sequência atual
  for (let i = weeksWithProgress.length - 1; i >= 0; i--) {
      const week = weeksWithProgress[i];
      const target = getWeekMidTarget(week);
      const realized = getRealizedKm(week);
      const adherence = target > 0 ? (realized / target) * 100 : 0;
      if (adherence >= 90) {
          consecutiveWeeks++;
      } else {
          break; // A sequência foi quebrada
      }
  }

  // Itera por todas as semanas para calcular total de km e medalhas
  plan.weeks.forEach(week => {
    const target = getWeekMidTarget(week);
    const realized = getRealizedKm(week);
    totalKm += realized;
    const adherence = target > 0 ? (realized / target) * 100 : 0;

    if (adherence >= 100) {
      badges.add(BADGES.PERFECT_WEEK);
    }
    if (adherence >= 90) {
      totalConsistentWeeks++;
    }
  });

  if (totalConsistentWeeks >= 3) {
    badges.add(BADGES.CONSISTENCY_3X);
  }
  if (totalKm >= 50) {
    badges.add(BADGES.FIRST_50K);
  }

  return {
    currentStreak: consecutiveWeeks,
    badges: Array.from(badges),
  };
}