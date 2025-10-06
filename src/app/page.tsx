"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Type Definitions
interface Session {
  day: string;
  type: string;
  planned_km: number;
  name: string;
  tag: string;
  done: boolean;
  km: number;
}

interface Quality {
  name: string;
  structure: string;
  target_intensity: string;
}

interface Week {
  number: number;
  phase: string;
  target_km_min: number;
  target_km_max: number;
  long_run_km: number;
  quality1?: Quality;
  quality2?: Quality;
  sessions?: Session[];
  realized_km?: number;
  notes?: string;
  __ramp_guard?: boolean;
  __auto_adjusted?: boolean;
  register?: any;
}

interface PaceRanges {
  easy_min_s_per_km: number;
  easy_max_s_per_km: number;
  tempo_min: number;
  tempo_max: number;
  reps_min: number;
  reps_max: number;
}

interface Plan {
  name: string;
  start_date: string;
  race_date: string;
  pace_ranges: PaceRanges;
  defaults: {
    warmup_min: number;
    cooldown_min: number;
    week_structure: { day: string; type: string }[];
  };
  weeks: Week[];
}

interface AppState {
  plan: Plan;
}

const initialPlan: Plan = {
  name: "Plano Padrão",
  start_date: "",
  race_date: "",
  pace_ranges: { easy_min_s_per_km: 390, easy_max_s_per_km: 450, tempo_min: 330, tempo_max: 345, reps_min: 300, reps_max: 315 },
  defaults: { warmup_min: 10, cooldown_min: 10, week_structure: [] },
  weeks: [],
};

// --- Helper Functions (migrated from original script) ---
const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);
const weekDiff = (start: string, date: string) => {
  const ms = new Date(date).getTime() - new Date(start).getTime();
  const w = Math.floor(ms / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.max(1, Math.min(w, 12));
};
const weekMidTarget = (wk: Week) => Math.round((wk.target_km_min + wk.target_km_max) / 2);
const realizedKm = (wk: Week) => {
    const s = (wk.sessions || []).reduce((acc, cur) => acc + (Number(cur.km) || 0), 0);
    wk.realized_km = Math.round(s * 10) / 10;
    return wk.realized_km;
};
const xpFromKm = (km: number) => Math.floor(km * 10);
const levelFromXP = (xp: number) => Math.floor(xp / 100) + 1;

export default function Home() {
  const [state, setState] = useState<AppState>({ plan: initialPlan });
  const [currentWeek, setCurrentWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('dash');
  const [toast, setToast] = useState<{ msg: string; cls: string } | null>(null);
  const [modal, setModal] = useState<{ title: string; html: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const evoChartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Data Fetching and Saving ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to load data');
      let doc = await res.json();
      if (!doc?.plan?.weeks?.length) {
          doc = { plan: initialPlan };
      }

      // Business logic from original script
      if (!doc.plan.start_date) {
        doc.plan.start_date = isoDate(new Date());
      }

      // Safety enforcement
      const weeks = doc.plan.weeks;
      for (let i = 0; i < weeks.length; i++) {
          weeks[i].long_run_km = Math.min(weeks[i].long_run_km, 12.3);
          if (i > 0) {
              const prev = weeks[i-1].target_km_max;
              const cap = Math.floor(prev * 1.20);
              if (weeks[i].target_km_max > cap) {
                  weeks[i].target_km_max = cap;
                  weeks[i].__ramp_guard = true;
              }
              weeks[i].target_km_min = Math.min(weeks[i].target_km_min, weeks[i].target_km_max);
          }
      }

      // Session generation
      for (let i = 0; i < doc.plan.weeks.length; i++) {
        doc.plan.weeks[i].sessions = sessionsForWeek(doc.plan, i);
      }

      setState(doc);
      setCurrentWeek(weekDiff(doc.plan.start_date, isoDate(new Date())));
      showToast("Dados carregados", "ok");
    } catch (e) {
      console.error(e);
      showToast("Falha ao carregar dados", "danger");
      setState({ plan: initialPlan });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = useCallback(async (newState: AppState) => {
    try {
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast("Progresso salvo ✅", "ok");
    } catch (e) {
      console.error(e);
      showToast("Falha ao salvar", "danger");
    }
  }, []);

  const debouncedSave = useCallback((newState: AppState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveData(newState);
    }, 800);
  }, [saveData]);

  // --- Effects ---
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!canvasRef.current || !state.plan.weeks.length) return;

    if (evoChartRef.current) {
        evoChartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = state.plan.weeks.map(w => `S${w.number}`);
    const target = state.plan.weeks.map(w => weekMidTarget(w));
    const realized = state.plan.weeks.map(w => Number(w.realized_km || 0));

    evoChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Alvo', data: target, tension: .35, borderColor: 'rgba(255, 122, 0, 0.8)', backgroundColor: 'rgba(255, 122, 0, 0.2)' },
          { label: 'Realizado', data: realized, tension: .35, borderColor: 'rgba(49, 208, 170, 0.8)', backgroundColor: 'rgba(49, 208, 170, 0.2)' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#cfe3f6' } } },
        scales: { x: { ticks: { color: '#9fb4c9' } }, y: { ticks: { color: '#9fb4c9' } } }
      }
    });

    return () => {
        if (evoChartRef.current) {
            evoChartRef.current.destroy();
        }
    }
  }, [state, activeTab]);

  // --- Business Logic ---
  const sessionsForWeek = (plan: Plan, wIndex: number) => {
      const wk = plan.weeks[wIndex];
      const target = weekMidTarget(wk);
      const long = wk.long_run_km;
      const q1 = Math.round(target * 0.18);
      const q2 = Math.round(target * 0.12);
      const easy1 = Math.round(target * 0.17);
      const easy2 = Math.round(target * 0.15);
      const easy3 = Math.max(0, target - (long + q1 + q2 + easy1 + easy2));
      const structure = plan.defaults.week_structure;

      const map = {
        "strength_A": { name: "Força A", km: 0, tag: "Strength" },
        "easy_strides": { name: "Corrida leve + Strides", km: easy1, tag: "Easy" },
        "quality_1": { name: wk.quality1?.name || "Qualidade 1", km: q1, tag: "Quality" },
        "off_or_cross": { name: "Descanso / Cross", km: 0, tag: "Recovery" },
        "strength_B_or_quality_2": { name: wk.quality2?.name || "Força B / Q2", km: q2, tag: "Quality" },
        "easy_technique": { name: "Corrida leve + Técnica", km: easy2, tag: "Easy" },
        "long_progressive": { name: "Longo progressivo", km: long, tag: "Long" }
      };

      if ((wk.notes || "").toLowerCase().includes("remover q2")) {
        map["strength_B_or_quality_2"].km = 0;
        map["strength_B_or_quality_2"].tag = "Recovery";
        map["strength_B_or_quality_2"].name = "Força B / Off (Q2 opcional)";
      }

      map["easy_technique"].km += Math.round(easy3 * 0.6);
      map["easy_strides"].km += Math.round(easy3 * 0.4);

      const sessions = structure.map(s => ({
        day: s.day,
        type: s.type,
        planned_km: map[s.type as keyof typeof map].km,
        name: map[s.type as keyof typeof map].name,
        tag: map[s.type as keyof typeof map].tag,
        done: false,
        km: 0
      }));

      // Merge with existing session data if available
      if (!wk.sessions || wk.sessions.length === 0) return sessions;

      return wk.sessions.map((old, i) => {
          const fresh = sessions[i];
          return { ...old, planned_km: fresh.planned_km, name: fresh.name, tag: fresh.tag, type: fresh.type };
        });
  };

  // --- Event Handlers ---
  const showToast = (msg: string, cls: string) => {
    setToast({ msg, cls });
  };

  const handleSessionChange = (wIndex: number, sIndex: number, field: 'km' | 'done', value: number | boolean) => {
    const newState = { ...state };
    const week = newState.plan.weeks[wIndex];
    const session = week.sessions![sIndex];

    if(field === 'km') {
        session.km = value as number;
        session.done = session.km > 0;
    } else if (field === 'done') {
        session.done = value as boolean;
        if (session.done && session.km === 0) {
            session.km = session.planned_km;
        } else if (!session.done && session.km === session.planned_km) {
            session.km = 0;
        }
    }

    realizedKm(week);
    setState(newState);
    debouncedSave(newState);
  };

  const handleOpenModal = (title: string, html: string) => {
    setModal({ title, html });
  };

  // --- Render Functions ---
  const renderDetailsForSession = (plan: Plan, wk: Week, s: Session) => {
      const { warmup_min: wu, cooldown_min: cd } = plan.defaults;
      const q1 = wk.quality1, q2 = wk.quality2;
      const tag = (s.tag || "").toLowerCase();

      const fmtPace = (sec: number) => { const m = Math.floor(sec / 60), pad = String(Math.round(sec % 60)).padStart(2, "0"); return `${m}:${pad}/km`; };
      const paceHint = (intensity: string) => {
        const pr = plan.pace_ranges || {};
        if (intensity === "tempo") return `${fmtPace(pr.tempo_min)} – ${fmtPace(pr.tempo_max)}`;
        if (intensity === "reps" || intensity === "10K" || intensity === "10K/15K") return `${fmtPace(pr.reps_min)} – ${fmtPace(pr.reps_max)}`;
        return `${fmtPace(pr.easy_min_s_per_km)} – ${fmtPace(pr.easy_max_s_per_km)}`;
      }

      if (tag === "quality" && s.name === q1?.name) return `<b>${q1.name}</b><br>${q1.structure}<br><span class="muted">Ritmo alvo:</span> ${paceHint(q1.target_intensity)}<br><span class="muted">Aquec.</span> ${wu} min • <span class="muted">Desaquec.</span> ${cd} min`;
      if (tag === "quality") return `<b>${q2?.name || s.name}</b><br>${q2?.structure || "Qualidade 2"}<br><span class="muted">Ritmo alvo:</span> ${paceHint(q2?.target_intensity || "tempo")}<br><span class="muted">Aquec.</span> ${wu} min • <span class="muted">Desaquec.</span> ${cd} min`;
      if (tag === "long") return `<b>Longo progressivo</b><br>Confortável, progressivo no final.<br><span class="muted">Ritmo alvo:</span> ${paceHint("easy")}<br><span class="muted">Aquec.</span> ${wu} min • <span class="muted">Desaquec.</span> ${cd} min`;
      if (tag === "easy") {
          const extras = s.name.includes("Strides") ? " + 6–8×15 s strides" : s.name.includes("Técnica") ? " + 8–10 min de drills" : "";
          return `<b>${s.name}</b><br><span class="muted">Ritmo alvo:</span> ${paceHint("easy")}${extras}<br><span class="muted">Aquec.</span> ${wu} min • <span class="muted">Desaquec.</span> ${cd} min`;
      }
      if (tag === "strength") return `<b>${s.name}</b><br>Força geral (A/B), 30–40 min (pernas/core). Evitar fadiga antes de qualidade/longão.`;
      return `<b>${s.name}</b>`;
  }

  if (loading) {
      return <div style={{textAlign: 'center', paddingTop: '4rem', fontSize: '1.5rem'}}>Carregando...</div>
  }

  const { plan } = state;
  const week = plan.weeks[currentWeek - 1];
  if (!week) return <div>Semana inválida.</div>;

  const totalRealizedKm = week.realized_km || 0;
  const targetMid = weekMidTarget(week);
  const progressPct = Math.max(0, Math.min(100, Math.round((totalRealizedKm / targetMid) * 100)));
  const currentXp = xpFromKm(totalRealizedKm);
  const currentLevel = levelFromXP(currentXp);

  return (
    <>
      <header>
        <div className="nav">
          <div className="brand">
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: 'var(--brand)' }}></span>
            <span>Vera Cruz 15K</span>
            <span className="badge">V3 • 82% cap • +20% ramp</span>
          </div>
          <div className="tabs">
            <a className={`tab ${activeTab === 'dash' ? 'active' : ''}`} onClick={() => setActiveTab('dash')}>Dashboard</a>
            <a className={`tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>Plano</a>
            <a className={`tab ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>Registrar</a>
            <a className={`tab ${activeTab === 'gloss' ? 'active' : ''}`} onClick={() => setActiveTab('gloss')}>Glossário</a>
          </div>
        </div>
      </header>

      <main className="container">
        {activeTab === 'dash' && (
          <section id="tab-dash">
            <div className="grid g-2">
              <div className="card">
                <h3>Semana Atual <span className="tag">S{week.number}</span></h3>
                <div className="sub">{week.phase}</div>
                <div className="kpi" style={{ margin: '12px 0 6px' }}>
                  <div className="pill"><div className="stat"><span className="mini">Volume alvo</span><strong>{week.target_km_min}–{week.target_km_max} km</strong></div></div>
                  <div className="pill"><div className="stat"><span className="mini">Longão</span><strong>{week.long_run_km.toFixed(1)} km</strong></div></div>
                  <div className="pill"><div className="stat"><span className="mini">Progresso</span><strong>{totalRealizedKm} km</strong></div></div>
                  <div className="pill"><div className="stat"><span className="mini">Nível</span><span className="lvl">{currentLevel}</span><span className="mini">{currentXp % 100} / 100 XP</span></div></div>
                </div>
                <div className="progress" style={{ marginTop: '6px' }}><div style={{ width: `${progressPct}%` }}></div></div>
                {(week.__ramp_guard || week.__auto_adjusted) && <div className="sub warn" style={{ marginTop: '8px' }}>Ajuste automático aplicado.</div>}
              </div>
              <div className="card">
                <h3>Evolutivo Semanal</h3>
                <canvas ref={canvasRef} height="120"></canvas>
                <div className="mini muted" style={{ marginTop: '8px' }}>Comparação de alvo (médio da faixa) vs. realizado.</div>
              </div>
            </div>
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Treinos da Semana</h3>
                <div className="row">
                  <button className="btn small" onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}>◀</button>
                  <select value={currentWeek} onChange={(e) => setCurrentWeek(Number(e.target.value))}>
                    {plan.weeks.map(w => <option key={w.number} value={w.number}>Semana {w.number}</option>)}
                  </select>
                  <button className="btn small" onClick={() => setCurrentWeek(w => Math.min(plan.weeks.length, w + 1))}>▶</button>
                  <button className="btn" onClick={() => saveData(state)}>Salvar Semana</button>
                </div>
              </div>
              <div className="grid g-4" style={{ marginTop: '12px' }}>
                {week.sessions?.map((s, sIndex) => (
                  <div className="card day-card" key={sIndex}>
                    <div className="day-head">
                      <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                        <div className="tag">{s.day}</div><div className="tag">{s.tag}</div>
                      </div>
                      <label className="check">
                        <input type="checkbox" checked={s.done} onChange={e => handleSessionChange(currentWeek - 1, sIndex, 'done', e.target.checked)} /> <span>Concluído</span>
                      </label>
                    </div>
                    <div><div className="mini muted">Treino</div><div style={{ fontWeight: 600 }}>{s.name}</div></div>
                    <div><div className="mini muted">Km planejado</div><div>{s.planned_km} km</div></div>
                    <div>
                      <div className="mini muted">Km realizados</div>
                      <input type="number" min="0" step="0.1" value={s.km} onChange={e => handleSessionChange(currentWeek - 1, sIndex, 'km', Number(e.target.value))} />
                    </div>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn secondary small" onClick={() => handleOpenModal(`${s.day} — ${s.name}`, renderDetailsForSession(plan, week, s))}>Detalhes</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {activeTab === 'plan' && (
          <section id="tab-plan">
            <div className="card">
              <h3>Plano de 12 Semanas</h3>
              <div className="sub">{plan.name} • Início: {plan.start_date} • Prova: {plan.race_date}</div>
              <div className="muted mini" style={{ margin: '6px 0 12px' }}>Regras seguras: longão ≤ 12,3 km; ramp-up ≤ 20% no alvo máx.</div>
              <div style={{ overflow: 'auto' }}>
                <table>
                  <thead><tr><th>Sem</th><th>Fase</th><th>Volume (km)</th><th>Longão</th><th>Qualidade 1</th><th>Qualidade 2</th></tr></thead>
                  <tbody>
                    {plan.weeks.map(w => (
                      <tr key={w.number}>
                        <td>S{w.number}</td><td>{w.phase}</td><td>{w.target_km_min}–{w.target_km_max}</td><td>{w.long_run_km.toFixed(1)} km</td><td>{w.quality1?.name || "-"}</td><td>{w.quality2?.name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'log' && (
          <section id="tab-log"><div className="card"><h3>Registrar (em breve)</h3></div></section>
        )}
        {activeTab === 'gloss' && (
          <section id="tab-gloss">
            <div className="card"><h3>Glossário</h3><ul><li><b>RPE</b>: Escala de esforço percebido (0–10).</li><li><b>RP15K</b>: Ritmo objetivo para 15 km.</li><li><b>Strides</b>: Acelerações curtas (10–20 s).</li><li><b>Deload</b>: Semana de descarga.</li><li><b>Ramp-up</b>: Variação de volume. Limite: ≤ 20%.</li></ul></div>
          </section>
        )}
      </main>

      {toast && <div className={`toast ${toast.cls}`} style={{ display: 'block' }}>{toast.msg}</div>}

      {modal && (
        <div id="modal" style={{ display: 'flex', position: 'fixed', inset: '0', background: 'rgba(0,0,0,.5)', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setModal(null)}>
          <div style={{ background: '#0e151f', border: '1px solid #203047', borderRadius: '12px', width: 'min(560px,92vw)', padding: '16px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ margin: '0' }}>{modal.title}</h3>
              <button className="btn small" onClick={() => setModal(null)}>Fechar</button>
            </div>
            <div className="mini" style={{ marginTop: '10px', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: modal.html }}></div>
          </div>
        </div>
      )}

      <footer className="container">Protótipo migrado para Next.js • JSONBin persistente via API Route.</footer>
    </>
  );
}