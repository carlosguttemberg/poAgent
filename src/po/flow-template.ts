export interface FlowStepDetail {
  title: string;
  description: string;
  details: string[];
}

export interface FlowPhase {
  title: string;
  steps: FlowStepDetail[];
}

export interface FlowData {
  title: string;
  overview: string;
  phases: FlowPhase[];
}

function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const ICONS = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
];

interface PhaseColor {
  accent: string;
  glow: string;
  surface: string;
  label: string;
  pillBg: string;
  pillBorder: string;
}

const PALETTE: PhaseColor[] = [
  { accent: "#3b82f6", glow: "rgba(59,130,246,0.3)",  surface: "rgba(59,130,246,0.07)",  label: "#93c5fd", pillBg: "rgba(59,130,246,0.12)",  pillBorder: "rgba(59,130,246,0.35)" },
  { accent: "#22c55e", glow: "rgba(34,197,94,0.3)",   surface: "rgba(34,197,94,0.07)",   label: "#86efac", pillBg: "rgba(34,197,94,0.12)",   pillBorder: "rgba(34,197,94,0.35)"  },
  { accent: "#f97316", glow: "rgba(249,115,22,0.3)",  surface: "rgba(249,115,22,0.07)",  label: "#fdba74", pillBg: "rgba(249,115,22,0.12)",  pillBorder: "rgba(249,115,22,0.35)" },
  { accent: "#a855f7", glow: "rgba(168,85,247,0.3)",  surface: "rgba(168,85,247,0.07)",  label: "#d8b4fe", pillBg: "rgba(168,85,247,0.12)",  pillBorder: "rgba(168,85,247,0.35)" },
  { accent: "#ef4444", glow: "rgba(239,68,68,0.3)",   surface: "rgba(239,68,68,0.07)",   label: "#fca5a5", pillBg: "rgba(239,68,68,0.12)",   pillBorder: "rgba(239,68,68,0.35)"  },
  { accent: "#06b6d4", glow: "rgba(6,182,212,0.3)",   surface: "rgba(6,182,212,0.07)",   label: "#67e8f9", pillBg: "rgba(6,182,212,0.12)",   pillBorder: "rgba(6,182,212,0.35)"  },
];

function renderStep(
  step: FlowStepDetail,
  label: string,
  icon: string,
  color: PhaseColor,
  isLast: boolean,
): string {
  const detailItems = step.details
    .map((d) => `<li>${esc(d)}</li>`)
    .join("");
  const detailsBlock =
    step.details.length > 0
      ? `<details>
          <summary>${step.details.length} regra${step.details.length !== 1 ? "s" : ""} / detalhe${step.details.length !== 1 ? "s" : ""}</summary>
          <ul class="rule-list">${detailItems}</ul>
        </details>`
      : "";

  const arrow = isLast
    ? ""
    : `<div class="h-connector" style="--ac:${color.accent}">
        <div class="h-line"></div>
        <svg class="h-tip" viewBox="0 0 10 16" fill="${color.accent}"><path d="M0 0 L10 8 L0 16 Z"/></svg>
      </div>`;

  return `<div class="step-wrap">
      <article class="step-card" style="--ac:${color.accent};--glow:${color.glow};--surf:${color.surface}">
        <div class="step-top">
          <div class="icon-ring">${icon}</div>
          <span class="step-label" style="color:${color.label}">${esc(label)}</span>
        </div>
        <h3 class="step-title">${esc(step.title)}</h3>
        <p class="step-desc">${esc(step.description)}</p>
        ${detailsBlock}
      </article>
      ${arrow}
    </div>`;
}

function renderPhase(phase: FlowPhase, phaseIdx: number, iconOffset: number): string {
  const color = PALETTE[phaseIdx % PALETTE.length];
  const stepsHtml = phase.steps
    .map((step, si) => {
      const label = `${phaseIdx + 1}.${si + 1}`;
      const icon = ICONS[(iconOffset + si) % ICONS.length];
      return renderStep(step, label, icon, color, si === phase.steps.length - 1);
    })
    .join("\n");

  return `<section class="phase" id="phase-${phaseIdx + 1}">
    <div class="phase-header" style="border-left:3px solid ${color.accent};background:${color.surface}">
      <div class="phase-num-badge" style="background:${color.accent}1a;color:${color.accent};border:1px solid ${color.accent}4d">${phaseIdx + 1}</div>
      <div>
        <p class="phase-label" style="color:${color.accent}">Fase ${phaseIdx + 1}</p>
        <h2 class="phase-title" style="color:${color.label}">${esc(phase.title)}</h2>
      </div>
      <span class="phase-count">${phase.steps.length} passo${phase.steps.length !== 1 ? "s" : ""}</span>
    </div>
    <div class="steps-row">
      ${stepsHtml}
    </div>
  </section>`;
}

export function buildFlowHtml(project: string, data: FlowData): string {
  const totalSteps = data.phases.reduce((n, p) => n + p.steps.length, 0);

  const navPills = data.phases
    .map((p, i) => {
      const c = PALETTE[i % PALETTE.length];
      return `<a href="#phase-${i + 1}" class="pill" style="background:${c.pillBg};border:1px solid ${c.pillBorder};color:${c.label}">${esc(p.title)}</a>`;
    })
    .join("");

  let iconOffset = 0;
  const phaseSections = data.phases
    .map((phase, i) => {
      const html = renderPhase(phase, i, iconOffset);
      iconOffset += phase.steps.length;
      const connector =
        i < data.phases.length - 1
          ? `<div class="v-connector">
              <div class="v-line"></div>
              <svg viewBox="0 0 16 10" class="v-tip"><path d="M0 0 L16 0 L8 10 Z" fill="#475569"/></svg>
            </div>`
          : "";
      return `${html}\n${connector}`;
    })
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(data.title)}</title>
<style>
/* ─── Reset & base ─── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
  background-color:#0a0f1e;
  background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);
  background-size:28px 28px;
  color:#e2e8f0;
  line-height:1.6;
  min-height:100vh;
}

/* ─── Page header ─── */
.page-header{
  background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);
  border-bottom:1px solid rgba(255,255,255,0.06);
  padding:48px 48px 36px;
  position:relative;
  overflow:hidden;
}
.page-header::before{
  content:"";
  position:absolute;inset:0;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,0.15),transparent);
  pointer-events:none;
}
.project-chip{
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(99,102,241,0.15);
  border:1px solid rgba(99,102,241,0.3);
  color:#a5b4fc;
  font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  padding:4px 12px;border-radius:999px;
  margin-bottom:16px;
}
.page-title{
  font-size:clamp(22px,4vw,36px);font-weight:800;letter-spacing:-.02em;
  background:linear-gradient(135deg,#f1f5f9 0%,#a5b4fc 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  margin-bottom:12px;
}
.page-overview{
  font-size:15px;color:#94a3b8;max-width:760px;line-height:1.7;
  margin-bottom:24px;
}
.stats-row{
  display:flex;gap:24px;margin-bottom:28px;
}
.stat{
  display:flex;align-items:center;gap:8px;
  font-size:13px;color:#64748b;
}
.stat-value{
  font-size:22px;font-weight:700;color:#e2e8f0;line-height:1;
}
.nav-pills{display:flex;flex-wrap:wrap;gap:8px}
.pill{
  text-decoration:none;font-size:12px;font-weight:500;
  padding:5px 14px;border-radius:999px;
  transition:opacity .15s,transform .15s;white-space:nowrap;
}
.pill:hover{opacity:.8;transform:translateY(-1px)}

/* ─── Main content ─── */
main{padding:40px 48px 80px;max-width:1600px}

/* ─── Phase ─── */
.phase{margin-bottom:8px}
.phase-header{
  display:flex;align-items:center;gap:16px;
  padding:18px 24px;border-radius:12px 12px 0 0;
  border-bottom:1px solid rgba(255,255,255,0.05);
}
.phase-num-badge{
  width:36px;height:36px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  font-size:15px;font-weight:700;flex-shrink:0;
}
.phase-label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}
.phase-title{font-size:17px;font-weight:600;color:#f1f5f9}
.phase-count{
  margin-left:auto;font-size:12px;color:#475569;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);
  padding:3px 10px;border-radius:999px;white-space:nowrap;
}

/* ─── Steps row ─── */
.steps-row{
  display:flex;align-items:flex-start;
  overflow-x:auto;padding:24px;gap:0;
  background:rgba(255,255,255,0.02);
  border-radius:0 0 12px 12px;
  border:1px solid rgba(255,255,255,0.05);
  border-top:none;
  scrollbar-width:thin;scrollbar-color:#334155 transparent;
}
.steps-row::-webkit-scrollbar{height:4px}
.steps-row::-webkit-scrollbar-track{background:transparent}
.steps-row::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
.step-wrap{display:flex;align-items:flex-start;flex-shrink:0}

/* ─── Step card ─── */
.step-card{
  width:272px;flex-shrink:0;
  background:rgba(15,23,42,0.8);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:14px;padding:20px;
  transition:box-shadow .2s,border-color .2s,transform .2s;
  position:relative;overflow:hidden;
}
.step-card::before{
  content:"";position:absolute;inset:0;border-radius:14px;
  background:var(--surf);opacity:0;transition:opacity .2s;pointer-events:none;
}
.step-card:hover{
  border-color:var(--ac)66;
  box-shadow:0 0 0 1px var(--ac)22,0 8px 32px var(--glow);
  transform:translateY(-2px);
}
.step-card:hover::before{opacity:1}
.step-top{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.icon-ring{
  width:40px;height:40px;border-radius:10px;flex-shrink:0;
  background:var(--surf);border:1px solid var(--ac)33;
  display:flex;align-items:center;justify-content:center;
  color:var(--ac);
}
.icon-ring svg{width:18px;height:18px}
.step-label{
  font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
}
.step-title{font-size:14px;font-weight:600;color:#f1f5f9;margin-bottom:8px;line-height:1.4}
.step-desc{font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:12px}

/* ─── Details / Rules ─── */
details{border-top:1px solid rgba(255,255,255,0.05);padding-top:10px}
details summary{
  list-style:none;cursor:pointer;
  font-size:12px;font-weight:600;color:#64748b;
  display:flex;align-items:center;gap:6px;
  user-select:none;transition:color .15s;padding:2px 0;
}
details summary:hover{color:#94a3b8}
details summary::before{
  content:"▶";font-size:9px;
  display:inline-block;transition:transform .2s;
  color:var(--ac);
}
details[open] summary::before{transform:rotate(90deg)}
.rule-list{
  list-style:none;padding:0;margin:10px 0 4px;
  display:flex;flex-direction:column;gap:6px;
}
.rule-list li{
  font-size:12px;color:#94a3b8;line-height:1.5;
  padding-left:14px;position:relative;
}
.rule-list li::before{
  content:"→";position:absolute;left:0;
  color:var(--ac);font-size:10px;top:1px;
}

/* ─── Horizontal connector ─── */
.h-connector{
  display:flex;align-items:center;flex-shrink:0;
  width:40px;margin-top:20px;
}
.h-line{flex:1;height:1px;background:linear-gradient(90deg,var(--ac)99,var(--ac)44)}
.h-tip{width:8px;height:12px;flex-shrink:0}

/* ─── Vertical connector ─── */
.v-connector{
  display:flex;flex-direction:column;align-items:center;
  padding:8px 0;gap:0;
}
.v-line{width:1px;height:36px;background:linear-gradient(180deg,rgba(71,85,105,.8),rgba(71,85,105,.2))}
.v-tip{width:14px;height:8px}
</style>
</head>
<body>
<header class="page-header">
  <div class="project-chip">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    ${esc(project)}
  </div>
  <h1 class="page-title">${esc(data.title)}</h1>
  <p class="page-overview">${esc(data.overview)}</p>
  <div class="stats-row">
    <div class="stat">
      <span class="stat-value">${data.phases.length}</span>
      <span>fase${data.phases.length !== 1 ? "s" : ""}</span>
    </div>
    <div class="stat">
      <span class="stat-value">${totalSteps}</span>
      <span>passo${totalSteps !== 1 ? "s" : ""}</span>
    </div>
    <div class="stat">
      <span class="stat-value">${data.phases.reduce((n, p) => n + p.steps.reduce((m, s) => m + s.details.length, 0), 0)}</span>
      <span>regras mapeadas</span>
    </div>
  </div>
  <nav class="nav-pills">${navPills}</nav>
</header>
<main>
  ${phaseSections}
</main>
</body>
</html>
`;
}
