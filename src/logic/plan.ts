// src/logic/plan.ts

import type { Plan, Week, Session, QualityWorkout, WeekRegister } from '../state';
import { toISODate } from '../state';

/**
 * Garante que a data de início seja definida se estiver ausente.
 * No original, usava "{{auto_hoje}}", aqui usamos a data atual.
 */
export function ensureStartDate(plan: Plan): Plan {
  // The check for '{{auto_hoje}}' is removed to avoid issues with internal tooling.
  if (!plan.start_date) {
    plan.start_date = toISODate(new Date());
  }
  return plan;
}

/**
 * Aplica as regras de segurança do plano:
 * - Limita o longão a 12,3 km.
 * - Garante que o ramp-up (aumento de volume) não exceda 20% semana a semana.
 */
export function enforceSafety(plan: Plan): Plan {
  plan.weeks.forEach((week, i) => {
    // Regra 1: Longão máximo
    week.long_run_km = Math.min(week.long_run_km, 12.3);

    // Regra 2: Ramp-up máximo de 20%
    if (i > 0) {
      const prevWeek = plan.weeks[i - 1];
      const maxAllowed = Math.floor(prevWeek.target_km_max * 1.20);
      if (week.target_km_max > maxAllowed) {
        week.target_km_max = maxAllowed;
        week.__ramp_guard = true; // Flag para UI
      }
      // Garante que o mínimo não seja maior que o máximo
      week.target_km_min = Math.min(week.target_km_min, week.target_km_max);
    }
  });
  return plan;
}

/** Retorna o ponto médio do volume alvo da semana. */
export function getWeekMidTarget(week: Week): number {
  return Math.round((week.target_km_min + week.target_km_max) / 2);
}

/** Calcula o total de km realizados em uma semana. */
export function getRealizedKm(week: Week): number {
  const total = (week.sessions || []).reduce((acc, s) => acc + (Number(s.km) || 0), 0);
  week.realized_km = Math.round(total * 10) / 10; // Arredonda para 1 casa decimal
  return week.realized_km;
}

/**
 * Lógica de Gamificação:
 * - 1 km = 10 XP
 * - 100 XP = 1 Nível
 */
export const xpFromKm = (km: number): number => Math.floor(km * 10);
export const levelFromXp = (xp: number): number => Math.floor(xp / 100) + 1;
export const xpForNextLevel = (xp: number): number => 100 - (xp % 100);

/**
 * Gera ou atualiza as sessões de treino para uma semana específica com base
 * em uma distribuição de volume previsível e gamificada.
 */
export function generateSessionsForWeek(plan: Plan, weekIndex: number): Session[] {
  const week = plan.weeks[weekIndex];
  const target = getWeekMidTarget(week);
  const long = week.long_run_km;
  const q1Km = Math.round(target * 0.18);
  const q2Km = Math.round(target * 0.12);
  const easy1Km = Math.round(target * 0.17);
  const easy2Km = Math.round(target * 0.15);
  const remainingKm = Math.max(0, target - (long + q1Km + q2Km + easy1Km + easy2Km));

  const structure = plan.defaults.week_structure;
  const sessionMap: Record<string, { name: string; km: number; tag: Session['tag'] }> = {
    "strength_A": { name: "Força A (Pernas/Core)", km: 0, tag: "Strength" },
    "easy_strides": { name: "Corrida Leve + Strides", km: easy1Km + Math.round(remainingKm * 0.6), tag: "Easy" },
    "quality_1": { name: week.quality1?.name || "Treino de Qualidade 1", km: q1Km, tag: "Quality" },
    "off_or_cross": { name: "Descanso ou Cross-Training", km: 0, tag: "Recovery" },
    "strength_B_or_quality_2": { name: week.quality2?.name || "Força B ou Qualidade 2", km: q2Km, tag: "Quality" },
    "easy_technique": { name: "Corrida Leve + Técnica", km: easy2Km + Math.round(remainingKm * 0.4), tag: "Easy" },
    "long_progressive": { name: "Longo Progressivo", km: long, tag: "Long" }
  };

  // Ajuste para semanas com Q2 opcional
  if ((week.notes || "").toLowerCase().includes("remover q2")) {
    sessionMap["strength_B_or_quality_2"].km = 0;
    sessionMap["strength_B_or_quality_2"].tag = "Recovery";
    sessionMap["strength_B_or_quality_2"].name = "Força B / Off (Q2 Opcional)";
  }

  const newSessions = structure.map(s => ({
    day: s.day,
    type: s.type,
    planned_km: sessionMap[s.type].km,
    name: sessionMap[s.type].name,
    tag: sessionMap[s.type].tag,
    done: false, // Estado inicial
    km: 0,       // Estado inicial
  }));

  // Mantém o progresso existente se as sessões já existirem
  if (week.sessions && week.sessions.length === newSessions.length) {
    return week.sessions.map((oldSession, i) => ({
      ...oldSession,
      planned_km: newSessions[i].planned_km,
      name: newSessions[i].name,
      tag: newSessions[i].tag,
      type: newSessions[i].type,
    }));
  }

  return newSessions;
}

/**
 * Ajusta o plano para a semana seguinte com base no feedback (registro) da semana atual.
 * Reduz o volume se houver sinais de risco; aumenta ligeiramente se o progresso for bom.
 */
export function autoAdjustPlan(plan: Plan, weekIndex: number, register: WeekRegister): boolean {
  const currentWeek = plan.weeks[weekIndex];
  const nextWeek = plan.weeks[weekIndex + 1];
  if (!nextWeek) return false;

  const realizedKm = getRealizedKm(currentWeek);
  const adherence = (realizedKm / getWeekMidTarget(currentWeek)) * 100;

  const hasHighRisk =
    (adherence < 60) ||
    (Number(register.pain || 0) >= 7) ||
    (Number(register.fatigue || 0) >= 7) ||
    (Number(register.rhr || 0) >= 8) ||
    register.ill;

  let adjustmentMade = false;

  if (hasHighRisk) {
    const reductionFactor = 0.9; // Redução de 10%
    nextWeek.target_km_max = Math.floor(currentWeek.target_km_max * reductionFactor);
    nextWeek.target_km_min = Math.floor(nextWeek.target_km_max * 0.9);
    nextWeek.long_run_km = Math.min(12.3, Math.floor(currentWeek.long_run_km * reductionFactor));
    nextWeek.notes = (nextWeek.notes ? nextWeek.notes + " " : "") + "Ajuste automático: volume reduzido devido a sinais de risco.";
    if (nextWeek.quality2) {
      nextWeek.quality2.name = `${nextWeek.quality2.name} (Opcional)`;
    }
    nextWeek.__auto_adjusted = true;
    adjustmentMade = true;
  } else if (adherence >= 90) {
    // Aumento conservador se a aderência for ótima e sem riscos
    const increaseFactor = 1.05; // Aumento de 5%
    const maxAllowed = Math.floor(currentWeek.target_km_max * 1.20);
    let proposedMax = Math.floor(currentWeek.target_km_max * increaseFactor);
    if (proposedMax > maxAllowed) {
        proposedMax = maxAllowed;
    }

    nextWeek.target_km_max = proposedMax;
    nextWeek.target_km_min = Math.floor(proposedMax * 0.9);
    nextWeek.long_run_km = Math.min(12.3, Math.floor(currentWeek.long_run_km * 1.05));
    nextWeek.__auto_adjusted = true;
    adjustmentMade = true;
  }

  if (adjustmentMade) {
    // Re-aplica regras de segurança e gera novas sessões para a semana ajustada
    enforceSafety(plan);
    nextWeek.sessions = generateSessionsForWeek(plan, weekIndex + 1);
  }

  return adjustmentMade;
}


// --- Helpers para UI (Detalhes de Treino) ---

const formatPace = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = String(Math.round(seconds % 60)).padStart(2, "0");
  return `${m}:${s}/km`;
};

const getPaceHint = (plan: Plan, intensity: QualityWorkout['target_intensity']): string => {
  const ranges = plan.pace_ranges;
  switch (intensity) {
    case 'tempo':
      return `${formatPace(ranges.tempo_min)} – ${formatPace(ranges.tempo_max)}`;
    case 'reps':
    case '10K':
    case '10K/15K':
      return `${formatPace(ranges.reps_min)} – ${formatPace(ranges.reps_max)}`;
    default:
      return `${formatPace(ranges.easy_min_s_per_km)} – ${formatPace(ranges.easy_max_s_per_km)}`;
  }
};

export function getSessionDetailsHTML(plan: Plan, week: Week, session: Session): string {
  const { warmup_min, cooldown_min } = plan.defaults;
  const paceHint = getPaceHint(plan, 'easy');

  switch (session.tag) {
    case 'Quality':
      const qWorkout = session.name === week.quality1?.name ? week.quality1 : week.quality2;
      const qPace = getPaceHint(plan, qWorkout?.target_intensity || 'tempo');
      return `
        <p class="font-bold text-lg">${qWorkout?.name || session.name}</p>
        <p class="mt-2">${qWorkout?.structure || 'Estrutura não definida.'}</p>
        <p class="mt-4"><span class="font-semibold text-muted">Ritmo Alvo:</span> ${qPace}</p>
        <p class="text-sm text-muted mt-2">Aquecimento: ${warmup_min} min | Desaquecimento: ${cooldown_min} min</p>`;
    case 'Long':
      return `
        <p class="font-bold text-lg">Longo Progressivo</p>
        <p class="mt-2">Comece confortável e aumente o ritmo gradualmente na segunda metade.</p>
        <p class="mt-4"><span class="font-semibold text-muted">Ritmo Alvo:</span> ${paceHint}</p>`;
    case 'Easy':
      const extras = session.name.includes("Strides") ? " + 6–8 acelerações de 15s" :
                     session.name.includes("Técnica") ? " + 8–10 min de exercícios de técnica" : "";
      return `
        <p class="font-bold text-lg">${session.name}</p>
        <p class="mt-2">Corrida leve e constante para recuperação e volume.</p>
        <p class="mt-4"><span class="font-semibold text-muted">Ritmo Alvo:</span> ${paceHint}${extras}</p>`;
    case 'Strength':
      return `
        <p class="font-bold text-lg">${session.name}</p>
        <p class="mt-2">Treino de força geral com foco em pernas e core. Evite fadiga excessiva para os treinos de corrida.</p>`;
    default:
      return `<p class="font-bold text-lg">${session.name}</p><p class="mt-2">Descanso é fundamental para a evolução.</p>`;
  }
}