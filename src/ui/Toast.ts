// src/ui/Toast.ts

type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Exibe uma notificação (toast) na tela.
 * @param {string} message A mensagem a ser exibida.
 * @param {ToastType} type O tipo de toast, que define sua cor e ícone.
 * @param {number} duration Duração em milissegundos que o toast fica visível.
 */
export function showToast(message: string, type: ToastType = 'info', duration: number = 3000): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastId = `toast-${Date.now()}`;
  const toastElement = document.createElement('div');
  toastElement.id = toastId;

  const typeClasses: Record<ToastType, string> = {
    success: 'bg-green-500/90 border-green-400',
    error: 'bg-red-500/90 border-red-400',
    warning: 'bg-yellow-500/90 border-yellow-400',
    info: 'bg-gray-700/90 border-gray-500',
  };

  const icons: Record<ToastType, string> = {
      success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
      error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
      warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
      info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  };

  toastElement.className = `flex items-center gap-3 text-white font-semibold p-3 rounded-lg shadow-2xl border ${typeClasses[type]} animate-slide-in-up`;
  toastElement.innerHTML = `
    <span>${icons[type]}</span>
    <p>${message}</p>
    <style>
      @keyframes slide-in-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-slide-in-up { animation: slide-in-up 0.3s ease-out forwards; }
    </style>
  `;

  container.appendChild(toastElement);

  setTimeout(() => {
    toastElement.style.transition = 'opacity 0.5s ease-out';
    toastElement.style.opacity = '0';
    setTimeout(() => toastElement.remove(), 500);
  }, duration);
}