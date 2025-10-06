// src/main.ts

import type { AppState, Plan, WeekRegister, Session } from './state';
import { toISODate, getWeekNumber } from './state';

// API
import { loadRemotePlan, saveRemotePlan, debouncedSave } from './api/remote';

// Logic
import {
  ensureStartDate,
  enforceSafety,
  generateSessionsForWeek,
  getSessionDetailsHTML,
  autoAdjustPlan,
  getRealizedKm
} from './logic/plan';
import { calculateAchievements } from './logic/gamification';

// UI Components
import { renderHeader } from './ui/Header';
import { renderKpis } from './ui/Kpis';
import { renderWeekGrid } from './ui/WeekGrid';
import { renderRegisterForm } from './ui/RegisterForm';
import { renderPlanTable } from './ui/PlanTable';
import { renderGlossary } from './ui/Glossary';
import { renderAchievements } from './ui/Achievements';
import { showModal } from './ui/Modal';
import { showToast } from './ui/Toast';
import { triggerConfetti } from './ui/effects';
import { renderEvoChart } from './chart/evo';

// --- STATE ---
let state: AppState = {
  plan: null,
  currentWeek: 1,
  isLoading: true,
  error: null,
};

// --- DOM Element Selectors ---
const headerContainer = document.getElementById('header-container')!;
const kpisWrapper = document.getElementById('kpis-wrapper')!;
const achievementsWrapper = document.getElementById('achievements-wrapper')!;
const chartCanvas = document.getElementById('evoChart') as HTMLCanvasElement;
const weekGridContainer = document.getElementById('week-grid-container')!;
const registerFormContainer = document.getElementById('register-form-container')!;
const planTableContainer = document.getElementById('plan-table-container')!;
const glossaryContainer = document.getElementById('glossary-container')!;

// --- Event Handlers ---
const handleSelectWeek = (weekNumber: number) => {
  if (state.currentWeek === weekNumber) return;
  state.currentWeek = weekNumber;
  renderApp();
};

const handlePrevWeek = () => {
  if (state.currentWeek > 1) {
    state.currentWeek--;
    renderApp();
  }
};

const handleNextWeek = () => {
  if (state.plan && state.currentWeek < state.plan.weeks.length) {
    state.currentWeek++;
    renderApp();
  }
};

const handleUpdateSession = (sessionIndex: number, done: boolean, km?: number) => {
  if (!state.plan) return;
  const week = state.plan.weeks[state.currentWeek - 1];
  if (!week.sessions) return;

  const session = week.sessions[sessionIndex];
  const wasDone = session.done;

  session.done = done;
  if (km !== undefined) {
    session.km = km;
  }
  // If user unchecks, and km was same as planned, reset km to 0
  if (!done && session.km === session.planned_km) {
      session.km = 0;
  }

  // Trigger confetti only when a session is marked as done for the first time
  if (done && !wasDone) {
      triggerConfetti();
  }

  getRealizedKm(week); // Recalculate total for the week
  renderApp();
  debouncedSave(state.plan, (msg, type) => showToast(msg, type));
};

const handleShowDetails = (sessionIndex: number) => {
  if (!state.plan) return;
  const week = state.plan.weeks[state.currentWeek - 1];
  const session = week.sessions![sessionIndex];
  const detailsHtml = getSessionDetailsHTML(state.plan, week, session);
  showModal(`${session.day} - ${session.name}`, detailsHtml);
};

const handleFillAllPlanned = () => {
    if (!state.plan) return;
    const week = state.plan.weeks[state.currentWeek - 1];
    if (!week.sessions) return;

    week.sessions.forEach(session => {
        if(session.planned_km > 0) {
            session.km = session.planned_km;
            session.done = true;
        }
    });
    getRealizedKm(week);
    renderApp();
    debouncedSave(state.plan, (msg, type) => showToast(msg, type));
    showToast('Todos os treinos preenchidos!', 'success');
};

const handleResetAll = () => {
    if (!state.plan) return;
    const week = state.plan.weeks[state.currentWeek - 1];
    if (!week.sessions) return;

    week.sessions.forEach(session => {
        session.km = 0;
        session.done = false;
    });
    getRealizedKm(week);
    renderApp();
    debouncedSave(state.plan, (msg, type) => showToast(msg, type));
    showToast('Treinos da semana zerados.', 'info');
};

const handleSaveRegister = async (registerData: WeekRegister) => {
  if (!state.plan) return;
  const weekIndex = state.currentWeek - 1;
  state.plan.weeks[weekIndex].register = registerData;

  const adjusted = autoAdjustPlan(state.plan, weekIndex, registerData);

  try {
    await saveRemotePlan(state.plan);
    showToast(adjusted ? 'Feedback salvo e plano ajustado!' : 'Feedback salvo com sucesso!', 'success');
  } catch (e) {
    showToast('Erro ao salvar o feedback.', 'error');
  }

  renderApp();
};

// --- Main Render Function ---
function renderApp() {
  if (state.isLoading) {
    // Optional: render a loading spinner
    return;
  }
  if (!state.plan) {
    // Optional: render an error message
    showToast(state.error || 'Não foi possível carregar o plano.', 'error');
    return;
  }

  // Render all components with the current state
  const achievements = calculateAchievements(state.plan);

  renderHeader(headerContainer, state.plan);
  renderKpis(kpisWrapper, state, handlePrevWeek, handleNextWeek, handleSelectWeek);
  renderAchievements(achievementsWrapper, achievements);
  renderEvoChart(chartCanvas, state.plan);
  renderWeekGrid(weekGridContainer, state, handleUpdateSession, handleShowDetails, handleFillAllPlanned, handleResetAll);
  renderRegisterForm(registerFormContainer, state, handleSaveRegister);
  renderPlanTable(planTableContainer, state.plan);
  renderGlossary(glossaryContainer);
}


// --- BOOTSTRAP ---
async function boot() {
  try {
    let plan = await loadRemotePlan();

    // Ensure data integrity and apply rules
    plan = ensureStartDate(plan);
    plan = enforceSafety(plan);

    // Generate session structures for all weeks if they don't exist
    // This ensures consistency and makes the data model robust
    let structureModified = false;
    plan.weeks.forEach((week, index) => {
        const originalSessions = JSON.stringify(week.sessions);
        const newSessions = generateSessionsForWeek(plan, index);
        if(JSON.stringify(newSessions) !== originalSessions) {
            week.sessions = newSessions;
            structureModified = true;
        }
        getRealizedKm(week); // Ensure realized_km is calculated on boot
    });

    // If we had to generate sessions, it's a good idea to save the normalized structure back.
    if(structureModified) {
        await saveRemotePlan(plan);
    }

    state.plan = plan;
    state.currentWeek = getWeekNumber(plan.start_date, toISODate(), plan.weeks.length);
    state.isLoading = false;

    renderApp();

  } catch (error) {
    console.error("Boot failed:", error);
    state.isLoading = false;
    state.error = "Falha ao carregar dados do servidor. O app operará em modo de memória, mas as alterações não serão salvas.";
    // Fallback: This is where you could load a default local plan to allow offline usage
    // For now, we'll just show the error.
    renderApp();
  }
}

// Start the application
boot();