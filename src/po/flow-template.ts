export interface FlowStep {
  title: string;
  description: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildFlowHtml(project: string, steps: FlowStep[]): string {
  const stepsHtml = steps
    .map((step, i) => {
      const box = `<div class="step">
        <span class="badge">${i + 1}</span>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.description)}</p>
      </div>`;
      const arrow = i < steps.length - 1 ? `<div class="arrow"></div>` : "";
      return `${box}\n${arrow}`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Fluxo — ${escapeHtml(project)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #f5f5f7;
    color: #1d1d1f;
  }
  h1 { padding: 32px 40px 0; font-size: 22px; }
  .flow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 24px 40px 48px;
  }
  .step {
    background: #fff;
    border: 1px solid #e2e2e6;
    border-radius: 10px;
    padding: 18px 18px 16px;
    width: 220px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    position: relative;
  }
  .badge {
    position: absolute;
    top: -10px;
    left: -10px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2563eb;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .step h3 { margin: 4px 0 6px; font-size: 14px; }
  .step p { margin: 0; font-size: 12px; color: #555; line-height: 1.4; }
  .arrow {
    width: 36px;
    height: 2px;
    background: #9ca3af;
    position: relative;
    flex-shrink: 0;
    margin: 0 6px;
  }
  .arrow::after {
    content: "";
    position: absolute;
    right: -1px;
    top: -4px;
    border-left: 7px solid #9ca3af;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
  }
</style>
</head>
<body>
<h1>Fluxo — ${escapeHtml(project)}</h1>
<div class="flow">
${stepsHtml}
</div>
</body>
</html>
`;
}
