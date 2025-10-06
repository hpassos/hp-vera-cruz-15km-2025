// src/ui/Modal.ts

let currentModal: HTMLElement | null = null;

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

/**
 * Exibe um modal na tela com o título e conteúdo fornecidos.
 * @param {string} title O título do modal.
 * @param {string} contentHtml O conteúdo HTML a ser exibido no corpo do modal.
 */
export function showModal(title: string, contentHtml: string): void {
  // Fecha qualquer modal anterior
  closeModal();

  const modalElement = document.createElement('div');
  modalElement.id = 'modal-instance';
  modalElement.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in';
  modalElement.innerHTML = `
    <div id="modal-overlay" class="absolute inset-0"></div>
    <div class="bg-secondary border border-gray-700/80 rounded-2xl w-full max-w-lg mx-auto shadow-2xl transform animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h3 id="modal-title" class="text-xl font-bold text-text-dark">${title}</h3>
        <button id="modal-close-btn" aria-label="Fechar modal" class="text-muted hover:text-text transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-6 text-text leading-relaxed">
        ${contentHtml}
      </div>
    </div>
    <style>
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scale-in {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
    </style>
  `;

  document.getElementById('modal-container')?.appendChild(modalElement);
  currentModal = modalElement;

  // Adiciona listeners
  modalElement.querySelector('#modal-overlay')?.addEventListener('click', closeModal);
  modalElement.querySelector('#modal-close-btn')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', handleEscape);

  (modalElement.querySelector('#modal-close-btn') as HTMLElement)?.focus();
}

/**
 * Fecha o modal atualmente visível.
 */
export function closeModal(): void {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
    document.removeEventListener('keydown', handleEscape);
  }
}