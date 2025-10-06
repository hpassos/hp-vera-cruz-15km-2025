// src/ui/Kpis.ts

import type { AppState, Week } from '../state';
import { getWeekMidTarget, getRealizedKm, xpFromKm, levelFromXp, xpForNextLevel } from '../logic/plan';

/**
 * Renderiza os Indicadores Chave de Performance (KPIs) e o seletor de semana.
 * @param {HTMLElement} element O container dos KPIs.
 * @param {AppState} state O estado atual da aplicação.
 * @param {() => void} onPrevWeek Callback para ir para a semana anterior.
 * @param {() => void} onNextWeek Callback para ir para a semana seguinte.
 * @param {(week: number) => void} onSelectWeek Callback para selecionar uma semana.
 */
export function renderKpis(
  element: HTMLElement,
  state: AppState,
  onPrevWeek: () => void,
  onNextWeek: () => void,
  onSelectWeek: (week: number) => void
): void {
  if (!state.plan) return;

  const week = state.plan.weeks[state.currentWeek - 1];
  if (!week) return;

  const midTarget = getWeekMidTarget(week);
  const realized = getRealizedKm(week);
  const progressPercent = midTarget > 0 ? Math.min(100, Math.round((realized / midTarget) * 100)) : 0;
  const totalXp = xpFromKm(realized);
  const currentLevel = levelFromXp(totalXp);
  const xpInLevel = totalXp % 100;

  const rampGuardHtml = week.__ramp_guard || week.__auto_adjusted
    ? `<div class="mt-4 text-sm text-warning/80 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
         <p><strong>Ajuste Automático Aplicado:</strong> O volume desta semana foi ajustado para garantir uma progressão segura e sustentável.</p>
       </div>`
    : '';

  element.innerHTML = `
    <div class="bg-secondary border border-gray-700/50 rounded-2xl p-4 md:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-bold">Semana ${week.number}</h2>
            <span class="text-sm font-semibold text-muted">${week.phase}</span>
          </div>
          <p class="text-muted">Seu resumo de progresso semanal.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="prev-week-btn" aria-label="Semana anterior" class="bg-gray-700/60 hover:bg-gray-600/80 transition-colors p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <select id="week-selector" class="bg-gray-700/60 border-none rounded-lg text-text font-semibold focus:ring-2 focus:ring-brand">
            ${state.plan.weeks.map(w => `
              <option value="${w.number}" ${w.number === state.currentWeek ? 'selected' : ''}>
                Semana ${w.number}
              </option>
            `).join('')}
          </select>
          <button id="next-week-btn" aria-label="Próxima semana" class="bg-gray-700/60 hover:bg-gray-600/80 transition-colors p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="bg-primary/50 p-4 rounded-xl">
          <p class="text-sm text-muted">Volume Alvo</p>
          <p class="text-xl font-bold mt-1">${midTarget} <span class="text-base font-normal">km</span></p>
        </div>
        <div class="bg-primary/50 p-4 rounded-xl">
          <p class="text-sm text-muted">Realizado</p>
          <p class="text-xl font-bold mt-1">${realized} <span class="text-base font-normal">km</span></p>
        </div>
        <div class="bg-primary/50 p-4 rounded-xl">
          <p class="text-sm text-muted">Longão</p>
          <p class="text-xl font-bold mt-1">${week.long_run_km.toFixed(1)} <span class="text-base font-normal">km</span></p>
        </div>
        <div class="bg-primary/50 p-4 rounded-xl">
          <p class="text-sm text-muted">Progresso</p>
          <p class="text-xl font-bold mt-1">${progressPercent}%</p>
        </div>
      </div>

      <div class="mt-6">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-bold text-accent">Nível ${currentLevel}</span>
          <span class="text-sm text-muted">${totalXp} XP</span>
        </div>
        <div class="w-full bg-primary/50 rounded-full h-2.5 border border-gray-700/50">
          <div class="bg-accent h-full rounded-full" style="width: ${xpInLevel}%"></div>
        </div>
      </div>

      ${rampGuardHtml}
    </div>
  `;

  // Add event listeners
  element.querySelector('#prev-week-btn')?.addEventListener('click', onPrevWeek);
  element.querySelector('#next-week-btn')?.addEventListener('click', onNextWeek);
  element.querySelector('#week-selector')?.addEventListener('change', (e) => {
    onSelectWeek(Number((e.target as HTMLSelectElement).value));
  });

  // Disable buttons at boundaries
  if (state.currentWeek === 1) {
    (element.querySelector('#prev-week-btn') as HTMLButtonElement).disabled = true;
  }
  if (state.currentWeek === state.plan.weeks.length) {
    (element.querySelector('#next-week-btn') as HTMLButtonElement).disabled = true;
  }
}