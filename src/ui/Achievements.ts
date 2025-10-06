// src/ui/Achievements.ts

import type { Achievements } from '../logic/gamification';

const badgeIcons: Record<string, string> = {
  'Semana Perfeita (100%)': '🏆',
  'Consistência (3x 90%)': '🔥',
  'Marco: 50km Corridos': '🚀',
};

/**
 * Renderiza a seção de conquistas e medalhas.
 * @param {HTMLElement} element O container das conquistas.
 * @param {Achievements} achievements O objeto com os dados de conquistas.
 */
export function renderAchievements(element: HTMLElement, achievements: Achievements): void {
  element.innerHTML = `
    <div class="bg-secondary border border-gray-700/50 rounded-2xl p-4 md:p-6 mt-6">
      <h3 class="text-xl font-bold mb-4">Conquistas</h3>
      <div class="flex flex-col md:flex-row gap-6">
        <div class="flex items-center gap-4 bg-primary/50 p-4 rounded-xl flex-1">
          <span class="text-5xl">🔥</span>
          <div>
            <p class="text-2xl font-bold">${achievements.currentStreak}</p>
            <p class="text-muted">Semanas seguidas com +90%</p>
          </div>
        </div>
        <div class="flex-1">
          <h4 class="font-bold mb-2">Medalhas Ganhas</h4>
          <div class="flex flex-wrap gap-2">
            ${achievements.badges.length > 0 ? achievements.badges.map(badge => `
              <span class="flex items-center gap-2 bg-primary/50 text-sm font-semibold px-3 py-2 rounded-full border border-gray-700/60">
                ${badgeIcons[badge] || '🏅'}
                <span>${badge}</span>
              </span>
            `).join('') : '<p class="text-sm text-muted">Continue treinando para ganhar medalhas!</p>'}
          </div>
        </div>
      </div>
    </div>
  `;
}