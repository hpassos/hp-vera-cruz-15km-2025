// src/chart/evo.ts

import type { Plan } from '../state';
import { getWeekMidTarget } from '../logic/plan';

// @ts-ignore - Chart is loaded from CDN and available globally
let evoChartInstance: Chart | null = null;

/**
 * Renderiza ou atualiza o gráfico de evolução semanal.
 * @param {HTMLCanvasElement} canvasElement O elemento canvas onde o gráfico será renderizado.
 * @param {Plan} plan O plano de treino contendo os dados.
 */
export function renderEvoChart(canvasElement: HTMLCanvasElement, plan: Plan): void {
  if (!canvasElement || typeof Chart === 'undefined') return;

  const labels = plan.weeks.map(w => `S${w.number}`);
  const targetData = plan.weeks.map(w => getWeekMidTarget(w));
  const realizedData = plan.weeks.map(w => w.realized_km || 0);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Alvo (km)',
        data: targetData,
        borderColor: '#ff7a00',
        backgroundColor: 'rgba(255, 122, 0, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Realizado (km)',
        data: realizedData,
        borderColor: '#31d0aa',
        backgroundColor: 'rgba(49, 208, 170, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e7eef6',
          font: {
            family: 'Inter, sans-serif',
          }
        }
      },
      tooltip: {
        backgroundColor: '#0b0f14',
        titleFont: { family: 'Inter, sans-serif' },
        bodyFont: { family: 'Inter, sans-serif' },
      }
    },
    scales: {
      x: {
        ticks: { color: '#8aa0b4', font: { family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(138, 160, 180, 0.1)' }
      },
      y: {
        ticks: { color: '#8aa0b4', font: { family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(138, 160, 180, 0.1)' },
        beginAtZero: true
      }
    }
  };

  // Se já existe um gráfico, destrói antes de criar um novo
  if (evoChartInstance) {
    evoChartInstance.destroy();
  }

  // @ts-ignore - Chart is loaded from CDN
  evoChartInstance = new Chart(canvasElement, {
    type: 'line',
    data: chartData,
    options: chartOptions,
  });
}