// src/ui/PlanTable.ts

import type { Plan } from '../state';

/**
 * Renderiza a tabela completa do plano de 12 semanas.
 * @param {HTMLElement} element O container da tabela.
 * @param {Plan | null} plan O plano de treino.
 */
export function renderPlanTable(element: HTMLElement, plan: Plan | null): void {
  if (!plan) {
    element.innerHTML = '<p class="text-muted">Carregando plano...</p>';
    return;
  }

  element.innerHTML = `
    <h2 class="text-2xl font-bold">Plano de 12 Semanas</h2>
    <p class="text-muted mt-1">Visão geral da sua jornada. Início: ${plan.start_date}.</p>
    <div class="overflow-x-auto mt-6">
      <table class="w-full text-left border-collapse">
        <thead class="border-b-2 border-gray-700">
          <tr>
            <th class="p-3 text-sm font-semibold text-muted">Sem</th>
            <th class="p-3 text-sm font-semibold text-muted">Fase</th>
            <th class="p-3 text-sm font-semibold text-muted">Volume (km)</th>
            <th class="p-3 text-sm font-semibold text-muted">Longão</th>
            <th class="p-3 text-sm font-semibold text-muted">Qualidade 1</th>
            <th class="p-3 text-sm font-semibold text-muted">Qualidade 2</th>
          </tr>
        </thead>
        <tbody>
          ${plan.weeks.map(week => `
            <tr class="border-b border-gray-800/50 hover:bg-primary/50 transition-colors">
              <td class="p-3 font-bold">S${week.number}</td>
              <td class="p-3">${week.phase}</td>
              <td class="p-3">${week.target_km_min}–${week.target_km_max}</td>
              <td class="p-3">${week.long_run_km.toFixed(1)} km</td>
              <td class="p-3">${week.quality1?.name || '-'}</td>
              <td class="p-3">${week.quality2?.name || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-muted mt-4 text-center">Regras de segurança aplicadas: longão ≤ 12,3 km e aumento de volume semanal ≤ 20%.</p>
  `;
}