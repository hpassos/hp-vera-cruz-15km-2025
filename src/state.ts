// src/state.ts

/**
 * Interfaces para o estado da aplicação.
 * Extraídas e tipadas a partir da lógica original.
 */

export interface Session {
  day: string;
  type: string;
  planned_km: number;
  name: string;
  tag: 'Easy' | 'Quality' | 'Long' | 'Strength' | 'Recovery';
  done: boolean;
  km: number;
}

export interface QualityWorkout {
  name: string;
  structure: string;
  target_intensity: 'easy' | 'tempo' | 'reps' | '10K' | '10K/15K';
}

export interface WeekRegister {
  adherence: number;
  pain: number;
  fatigue: number;
  stiff: number;
  rhr: number;
  sleep: number;
  heat: boolean;
  ill: boolean;
  notes: string;
}

export interface Week {
  number: number;
  phase: string;
  target_km_min: number;
  target_km_max: number;
  long_run_km: number;
  quality1?: QualityWorkout;
  quality2?: QualityWorkout;
  sessions?: Session[];
  realized_km?: number;
  register?: WeekRegister;
  notes?: string;
  __ramp_guard?: boolean;
  __auto_adjusted?: boolean;
}

export interface PaceRanges {
  easy_min_s_per_km: number;
  easy_max_s_per_km: number;
  tempo_min: number;
  tempo_max: number;
  reps_min: number;
  reps_max: number;
}

export interface Plan {
  name: string;
  start_date: string; // YYYY-MM-DD
  race_date: string; // YYYY-MM-DD
  weeks: Week[];
  pace_ranges: PaceRanges;
  defaults: {
    warmup_min: number;
    cooldown_min: number;
    week_structure: { day: string; type: string }[];
  };
}

export interface AppState {
  plan: Plan | null;
  currentWeek: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Helpers de data e semana.
 */

/** Retorna o dia da semana abreviado (e.g., "Mon"). */
export const getDayOfWeek = (date: Date): string => {
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[date.getDay()];
};

/** Formata uma data para o formato ISO (YYYY-MM-DD). */
export const toISODate = (date: Date = new Date()): string => {
  return date.toISOString().slice(0, 10);
};

/** Calcula a semana atual com base na data de início do plano. */
export const getWeekNumber = (startDate: string, currentDate: string, maxWeeks: number = 12): number => {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  // Adiciona algumas horas para evitar problemas de fuso horário no cálculo do dia
  start.setHours(12, 0, 0, 0);
  current.setHours(12, 0, 0, 0);

  const msDiff = current.getTime() - start.getTime();
  const weekDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.max(1, Math.min(weekDiff, maxWeeks));
};