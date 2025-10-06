// src/ui/WeekGrid.ts

import type { AppState, Session, Week } from '../state';

/**
 * Renderiza a grade de treinos da semana.
 * @param {HTMLElement} element O container da grade.
 * @param {AppState} state O estado atual da aplicação.
 * @param {(sessionIndex: number, done: boolean, km?: number) => void} onUpdateSession Callback para atualizar uma sessão.
 * @param {(sessionIndex: number) => void} onShowDetails Callback para mostrar detalhes de uma sessão.
 * @param {() => void} onFillAllPlanned Callback para preencher todos os treinos com o planejado.
 * @param {() => void} onResetAll Callback para zerar todos os treinos.
 */
export function renderWeekGrid(
  element: HTMLElement,
  state: AppState,
  onUpdateSession: (sessionIndex: number, done: boolean, km?: number) => void,
  onShowDetails: (sessionIndex: number) => void,
  onFillAllPlanned: () => void,
  onResetAll: () => void
): void {
  if (!state.plan) return;

  const week = state.plan.weeks[state.currentWeek - 1];
  if (!week || !week.sessions) return;

  const tagClasses: Record<Session['tag'], string> = {
    'Easy': 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    'Quality': 'bg-red-500/10 text-red-300 border-red-500/20',
    'Long': 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    'Strength': 'bg-green-500/10 text-green-300 border-green-500/20',
    'Recovery': 'bg-gray-500/10 text-gray-300 border-gray-500/20',
  };

  element.innerHTML = `
    <div class="bg-secondary border border-gray-700/50 rounded-2xl p-4 md:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-2xl font-bold">Treinos da Semana</h2>
        <div class="flex items-center gap-2">
            <button id="fill-all-btn" class="text-sm font-semibold bg-gray-700/60 hover:bg-gray-600/80 px-4 py-2 rounded-lg transition-colors">Preencher Planejado</button>
            <button id="reset-all-btn" class="text-sm font-semibold bg-red-900/40 hover:bg-red-900/60 px-4 py-2 rounded-lg transition-colors">Zerar</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        ${week.sessions.map((session, index) => `
          <div class="bg-primary/50 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-4 transition-all duration-300 ${session.done ? 'opacity-100' : 'opacity-80 hover:opacity-100'}">
            <div class="flex items-center justify-between">
              <span class="font-bold text-lg text-text-dark">${session.day}</span>
              <span class="text-xs font-bold px-2 py-1 rounded-full ${tagClasses[session.tag]}">${session.tag}</span>
            </div>
            <p class="text-base font-semibold text-text-dark flex-grow">${session.name}</p>
            <div class="flex items-end justify-between gap-4">
              <div>
                <label class="text-xs text-muted" for="km-input-${index}">Realizado (km)</label>
                <input
                  type="number"
                  id="km-input-${index}"
                  data-index="${index}"
                  min="0"
                  step="0.1"
                  value="${session.km || ''}"
                  placeholder="${session.planned_km}"
                  class="km-input bg-secondary text-lg w-full font-bold p-2 rounded-md border-2 border-gray-600 focus:border-brand transition-colors"
                />
              </div>
              <div class="flex flex-col items-center gap-2">
                 <label class="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" data-index="${index}" class="done-checkbox w-5 h-5 accent-brand" ${session.done ? 'checked' : ''}>
                    Feito
                </label>
                <button data-index="${index}" class="details-btn text-sm font-semibold text-muted hover:text-brand transition-colors">Detalhes</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Add event listeners
  element.querySelectorAll('.done-checkbox').forEach(el => {
    el.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const index = parseInt(target.dataset.index!, 10);
      const session = week.sessions![index];
      const kmInput = element.querySelector<HTMLInputElement>(`#km-input-${index}`);

      let newKm = session.km;
      // If checked and km is 0, fill with planned
      if (target.checked && (session.km === 0 || !session.km)) {
        newKm = session.planned_km;
        if(kmInput) kmInput.value = newKm.toString();
      }
      onUpdateSession(index, target.checked, newKm);
    });
  });

  element.querySelectorAll('.km-input').forEach(el => {
    el.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const index = parseInt(target.dataset.index!, 10);
      const km = parseFloat(target.value) || 0;
      // Also mark as done if user types any km > 0
      onUpdateSession(index, km > 0, km);
    });
  });

  element.querySelectorAll('.details-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      onShowDetails(parseInt(target.dataset.index!, 10));
    });
  });

  element.querySelector('#fill-all-btn')?.addEventListener('click', onFillAllPlanned);
  element.querySelector('#reset-all-btn')?.addEventListener('click', onResetAll);
}