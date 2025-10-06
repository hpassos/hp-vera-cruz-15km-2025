// src/ui/RegisterForm.ts

import type { AppState, WeekRegister } from '../state';

/**
 * Renderiza o formulário de registro de feedback da semana.
 * @param {HTMLElement} element O container do formulário.
 * @param {AppState} state O estado atual da aplicação.
 * @param {(registerData: WeekRegister) => void} onSave Callback para salvar os dados do registro.
 */
export function renderRegisterForm(
  element: HTMLElement,
  state: AppState,
  onSave: (registerData: WeekRegister) => void
): void {
  if (!state.plan) return;

  const week = state.plan.weeks[state.currentWeek - 1];
  const register = week?.register;

  element.innerHTML = `
    <div class="bg-secondary border border-gray-700/50 rounded-2xl p-4 md:p-6">
      <h2 class="text-2xl font-bold">Registrar Feedback da Semana ${state.currentWeek}</h2>
      <p class="text-muted mt-1">Seu feedback é usado para ajustar o plano e evitar lesões.</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div>
          <label for="f-adherence" class="text-sm font-semibold text-muted">Aderência (%)</label>
          <input type="number" id="f-adherence" min="0" max="150" placeholder="Ex: 95" value="${register?.adherence || ''}" class="mt-1 w-full bg-primary/50 p-2 rounded-md border-2 border-gray-600 focus:border-brand">
        </div>
        <div>
          <label for="f-pain" class="text-sm font-semibold text-muted">Dor Máxima (0-10)</label>
          <input type="number" id="f-pain" min="0" max="10" placeholder="0 = Nenhuma" value="${register?.pain || ''}" class="mt-1 w-full bg-primary/50 p-2 rounded-md border-2 border-gray-600 focus:border-brand">
        </div>
        <div>
          <label for="f-fatigue" class="text-sm font-semibold text-muted">Fadiga (0-10)</label>
          <input type="number" id="f-fatigue" min="0" max="10" placeholder="0 = Nenhuma" value="${register?.fatigue || ''}" class="mt-1 w-full bg-primary/50 p-2 rounded-md border-2 border-gray-600 focus:border-brand">
        </div>
        <div>
          <label for="f-sleep" class="text-sm font-semibold text-muted">Sono (média/noite)</label>
          <input type="number" id="f-sleep" step="0.1" min="0" placeholder="Ex: 7.5" value="${register?.sleep || '7.5'}" class="mt-1 w-full bg-primary/50 p-2 rounded-md border-2 border-gray-600 focus:border-brand">
        </div>
        <div>
          <label for="f-rhr" class="text-sm font-semibold text-muted">Variação FC Repouso</label>
          <input type="number" id="f-rhr" placeholder="Ex: +3 bpm" value="${register?.rhr || ''}" class="mt-1 w-full bg-primary/50 p-2 rounded-md border-2 border-gray-600 focus:border-brand">
        </div>
      </div>

      <div class="mt-6">
        <label for="f-notes" class="text-sm font-semibold text-muted">Notas Adicionais</label>
        <textarea id="f-notes" rows="4" class="mt-1 w-full bg-primary/50 p-2 rounded-md border-2 border-gray-600 focus:border-brand" placeholder="Como se sentiu? Alguma dificuldade ou conquista?">${register?.notes || ''}</textarea>
      </div>

      <div class="mt-4 flex flex-col sm:flex-row gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="f-heat" class="w-5 h-5 accent-brand" ${register?.heat ? 'checked' : ''}>
          <span>Treinos em calor/umidade altos</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="f-ill" class="w-5 h-5 accent-brand" ${register?.ill ? 'checked' : ''}>
          <span>Doença ou lesão na semana</span>
        </label>
      </div>

      <div class="mt-6 text-right">
        <button id="save-log-btn" class="bg-brand hover:bg-brand-light text-primary font-bold px-6 py-3 rounded-lg transition-colors">
          Salvar e Ajustar Plano
        </button>
      </div>
      <p class="text-xs text-muted mt-4 text-center">O ajuste automático pode reduzir o volume da próxima semana se detectar sinais de risco (aderência &lt; 60%, dor/fadiga &ge; 7). O aumento nunca excede 20%.</p>
    </div>
  `;

  element.querySelector('#save-log-btn')?.addEventListener('click', () => {
    const data: WeekRegister = {
      adherence: Number((document.getElementById('f-adherence') as HTMLInputElement).value) || 0,
      pain: Number((document.getElementById('f-pain') as HTMLInputElement).value) || 0,
      fatigue: Number((document.getElementById('f-fatigue') as HTMLInputElement).value) || 0,
      rhr: Number((document.getElementById('f-rhr') as HTMLInputElement).value) || 0,
      sleep: Number((document.getElementById('f-sleep') as HTMLInputElement).value) || 0,
      stiff: 0, // 'stiff' was in old code but not in UI, setting to 0
      heat: (document.getElementById('f-heat') as HTMLInputElement).checked,
      ill: (document.getElementById('f-ill') as HTMLInputElement).checked,
      notes: (document.getElementById('f-notes') as HTMLTextAreaElement).value || '',
    };
    onSave(data);
  });
}