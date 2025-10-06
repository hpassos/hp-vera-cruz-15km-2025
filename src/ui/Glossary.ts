// src/ui/Glossary.ts

const glossaryTerms = [
  {
    term: 'RPE (Rate of Perceived Exertion)',
    definition: 'Escala de 0 a 10 que mede o quão difícil você sentiu um treino. 1 é um esforço mínimo, 10 é o seu máximo absoluto.',
  },
  {
    term: 'RP15K (Race Pace 15K)',
    definition: 'O ritmo (pace) que você planeja manter durante a prova de 15 km. Os treinos de qualidade são frequentemente baseados nesse ritmo.',
  },
  {
    term: 'Strides',
    definition: 'Acelerações curtas (15-20 segundos) e controladas, focadas em melhorar a forma de corrida e a comunicação neuromuscular. Não são sprints máximos.',
  },
  {
    term: 'Deload (Semana de Desaceleração)',
    definition: 'Uma semana com volume e intensidade reduzidos, planejada para permitir que seu corpo se recupere, se adapte e se fortaleça, prevenindo o overtraining.',
  },
  {
    term: 'Ramp-up (Aumento de Volume)',
    definition: 'O aumento percentual no volume de treino de uma semana para a outra. Para segurança, este plano limita o ramp-up a um máximo de 20%.',
  },
  {
    term: 'Cross-Training',
    definition: 'Atividades aeróbicas de baixo impacto, como natação, ciclismo ou elíptico, que ajudam a manter a forma cardiovascular enquanto reduzem o estresse nos ossos e articulações.',
  }
];

/**
 * Renderiza a seção de glossário com termos e definições em um formato de acordeão.
 * @param {HTMLElement} element O container do glossário.
 */
export function renderGlossary(element: HTMLElement): void {
  element.innerHTML = `
    <h2 class="text-2xl font-bold mb-6">Glossário de Termos</h2>
    <div class="space-y-4">
      ${glossaryTerms.map((item, index) => `
        <details class="bg-secondary border border-gray-700/50 rounded-lg p-4 group" ${index === 0 ? 'open' : ''}>
          <summary class="font-semibold text-lg cursor-pointer flex justify-between items-center text-text-dark group-hover:text-brand transition-colors">
            ${item.term}
            <svg class="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <p class="text-muted mt-2 leading-relaxed">
            ${item.definition}
          </p>
        </details>
      `).join('')}
    </div>
  `;
}