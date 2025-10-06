// src/ui/Header.ts

import type { Plan } from '../state';

const navLinks = [
  { href: '#resumo', label: 'Resumo' },
  { href: '#treinos', label: 'Treinos' },
  { href: '#registrar', label: 'Registrar' },
  { href: '#plano', label: 'Plano' },
  { href: '#glossario', label: 'Glossário' },
];

/**
 * Renderiza o cabeçalho fixo com o título e a navegação principal.
 * @param {HTMLElement} element O container do cabeçalho.
 * @param {Plan} plan O plano de treino para exibir o nome.
 */
export function renderHeader(element: HTMLElement, plan: Plan | null): void {
  if (!plan) {
    element.innerHTML = ''; // Limpa se não houver plano
    return;
  }

  element.innerHTML = `
    <div class="flex items-center justify-between max-w-6xl mx-auto py-3">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-brand rounded-sm"></div>
        <h1 class="text-lg md:text-xl font-bold text-text-dark">
          Vera
        </h1>
        <span class="hidden sm:inline-block bg-secondary text-accent border border-accent/20 text-xs font-semibold px-2 py-0.5 rounded-full">
          ${plan.name}
        </span>
      </div>
      <nav class="hidden md:flex items-center gap-2">
        ${navLinks.map(link => `
          <a href="${link.href}" class="text-muted hover:text-text-dark font-semibold px-3 py-2 rounded-lg transition-colors duration-200">
            ${link.label}
          </a>
        `).join('')}
      </nav>
      <div class="md:hidden">
        <!-- Mobile menu button can be added here if needed -->
        <svg class="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
      </div>
    </div>
  `;
}