// src/api/remote.ts

import type { AppState, Plan } from '../state';

// ❗ Em um app de produção, esta chave NUNCA deve estar no frontend.
// Ela deve ser movida para um backend (proxy, serverless function) que
// faz a chamada segura para a API do JSONBin.
const API_CONFIG = {
  BIN_ID: "68dd7453ae596e708f02c066",
  MASTER_KEY: "$2a$10$pCaKVQGHO8mzMVJ4EszoSOY29nEuOgnOLr3yt9KP.Qby1mqu2ZWga",
  BASE_URL: "https://api.jsonbin.io/v3/b",
};

const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_CONFIG.MASTER_KEY,
  "X-Bin-Meta": "false", // Não precisamos dos metadados do bin
};

/**
 * Carrega os dados do plano a partir da API remota (JSONBin).
 * @returns {Promise<Plan>} O plano de treino.
 */
export async function loadRemotePlan(): Promise<Plan> {
  try {
    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.BIN_ID}/latest`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();
    // O JSONBin pode retornar o conteúdo diretamente, ou um objeto com 'record'
    return data.record || data;
  } catch (error) {
    console.error("Failed to load remote plan:", error);
    throw new Error("Falha ao carregar dados do servidor.");
  }
}

/**
 * Salva o estado completo do plano na API remota (JSONBin).
 * @param {Plan} plan O objeto do plano a ser salvo.
 * @returns {Promise<void>}
 */
export async function saveRemotePlan(plan: Plan): Promise<void> {
  try {
    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.BIN_ID}`;
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(plan),
    });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Failed to save remote plan:", error);
    throw new Error("Falha ao salvar dados no servidor.");
  }
}

// --- Debounce para salvamento ---
let saveTimer: number | undefined;

/**
 * Agenda um salvamento do plano, cancelando qualquer salvamento anterior pendente.
 * Isso evita chamadas excessivas à API durante edições rápidas.
 * @param {Plan} plan O plano a ser salvo.
 * @param {(message: string, type: 'success' | 'error') => void} showToast Callback para exibir notificação.
 */
export function debouncedSave(plan: Plan, showToast: (message: string, type: 'success' | 'error') => void) {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      await saveRemotePlan(plan);
      showToast("Progresso salvo na nuvem ✅", 'success');
    } catch (e) {
      console.error(e);
      showToast("Falha ao salvar. Verifique a conexão.", 'error');
    }
  }, 800); // Aumenta o tempo de debounce para 800ms para ser mais seguro
}