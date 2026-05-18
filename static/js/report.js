/* ── PlanningPal – Report Page ─────────────────────── */

let score = INITIAL_SCORE;
const appliedFixes = new Set();
const dismissed    = new Set();

const allActionable = ISSUES_DATA.filter(i => i.severity !== 'compliant');

// ── SVG Gauge ─────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 45; // ≈ 282.7

function scoreColor(s) {
  if (s >= 85) return 'var(--color-success)';
  if (s >= 70) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function updateGauge(s) {
  const circle = document.getElementById('gauge-circle');
  const label  = document.getElementById('gauge-score');
  if (!circle) return;
  circle.style.strokeDashoffset = CIRCUMFERENCE - (s / 100) * CIRCUMFERENCE;
  circle.style.stroke = scoreColor(s);
  if (label) label.textContent = s;
}

// ── Verdict badge ─────────────────────────────────────
function updateVerdict(s) {
  const badge = document.getElementById('verdict-badge');
  if (!badge) return;

  const nBlock = ISSUES_DATA.filter(i => i.severity === 'blocking' && !dismissed.has(i.id)).length;
  const nWarn  = ISSUES_DATA.filter(i => i.severity === 'warning'  && !dismissed.has(i.id)).length;

  let text, cls;
  if (s >= 90) {
    text = 'Ready to submit.';
    cls  = 'bg-success-soft text-success';
  } else if (s >= 75) {
    const n = nBlock + nWarn;
    text = `Ready to submit with ${n} fix${n === 1 ? '' : 'es'} recommended.`;
    cls  = 'bg-success-soft text-success';
  } else {
    text = `Not ready — ${nBlock} blocking issue${nBlock === 1 ? '' : 's'} to resolve first.`;
    cls  = 'bg-danger-soft text-danger';
  }

  const iconOk  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  const iconWarn = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

  badge.className = `inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${cls}`;
  badge.innerHTML = (s >= 75 ? iconOk : iconWarn) + text;
}

// ── Render a single issue card ────────────────────────
function renderIssueCard(issue) {
  const isBlocking  = issue.severity === 'blocking';
  const borderColor = isBlocking ? 'border-l-danger' : 'border-l-warning';

  const div = document.createElement('div');
  div.id = 'card-' + issue.id;
  div.className = `border border-border border-l-4 ${borderColor} rounded-md p-5 transition-all animate-fade-in-up`;

  div.innerHTML = `
    <div class="flex-1">
      <div class="flex items-center gap-2 flex-wrap mb-1">
        <h3 id="title-${issue.id}" class="font-semibold">${escHtml(issue.title)}</h3>
        <span id="fix-badge-${issue.id}"
              class="hidden inline-flex items-center rounded-full bg-success text-success-foreground text-xs font-medium px-2.5 py-0.5">
          Fix applied
        </span>
      </div>
      <span class="tooltip-wrapper">
        <button class="font-mono text-xs text-primary hover:underline decoration-dotted underline-offset-2">
          ${escHtml(issue.policyRef)} · ${escHtml(issue.policyTitle)}
        </button>
        <div class="tooltip-popup">
          <div class="font-semibold mb-1">${escHtml(issue.policyTitle)}</div>
          <p>${escHtml(issue.policyExcerpt)}</p>
        </div>
      </span>
      <p class="mt-3 text-sm text-foreground/90">${escHtml(issue.explanation)}</p>

      <div class="mt-4 bg-secondary/40 border border-border rounded-md p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested fix</div>
          <button onclick="copyFix('${issue.id}')"
                  class="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span id="copy-label-${issue.id}">Copy</span>
          </button>
        </div>
        <p id="fix-text-${issue.id}" class="text-sm leading-relaxed">${escHtml(issue.suggestedFix)}</p>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <button id="apply-btn-${issue.id}" onclick="applyFix('${issue.id}')"
                class="inline-flex items-center gap-1.5 justify-center rounded-md bg-primary text-primary-foreground
                       text-sm font-medium px-3 py-1.5 hover:opacity-90 transition-opacity">
          Apply suggested fix
        </button>
        <button onclick="dismissIssue('${issue.id}')"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-1.5
                       text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          Dismiss
        </button>
      </div>
    </div>`;
  return div;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Apply fix ─────────────────────────────────────────
function applyFix(id) {
  if (appliedFixes.has(id)) return;
  appliedFixes.add(id);

  const card  = document.getElementById('card-' + id);
  const title = document.getElementById('title-' + id);
  const badge = document.getElementById('fix-badge-' + id);
  const btn   = document.getElementById('apply-btn-' + id);

  if (card) {
    card.classList.remove('border-l-danger', 'border-l-warning');
    card.classList.add('border-l-success');
    card.style.background = 'rgba(223,240,235,0.25)';
  }
  if (title) { title.classList.add('line-through', 'text-muted-foreground'); }
  if (badge) { badge.classList.remove('hidden'); }
  if (btn) {
    btn.disabled = true;
    btn.className = 'inline-flex items-center gap-1.5 justify-center rounded-md bg-secondary text-muted-foreground text-sm font-medium px-3 py-1.5 cursor-not-allowed opacity-60';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Fix applied`;
  }

  updateFooterCount();
}

// ── Dismiss ───────────────────────────────────────────
function dismissIssue(id) {
  dismissed.add(id);
  const card = document.getElementById('card-' + id);
  if (card) {
    card.style.transition = 'opacity 0.3s';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300);
  }

  const nBlock = ISSUES_DATA.filter(i => i.severity === 'blocking' && !dismissed.has(i.id)).length;
  const nWarn  = ISSUES_DATA.filter(i => i.severity === 'warning'  && !dismissed.has(i.id)).length;
  const bEl = document.getElementById('blocking-count');
  const wEl = document.getElementById('warnings-count');
  if (bEl) bEl.textContent = nBlock;
  if (wEl) wEl.textContent = nWarn;

  updateVerdict(score);
}

// ── Copy fix ──────────────────────────────────────────
function copyFix(id) {
  const el = document.getElementById('fix-text-' + id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const label = document.getElementById('copy-label-' + id);
    if (label) { label.textContent = 'Copied'; setTimeout(() => { label.textContent = 'Copy'; }, 1500); }
  }).catch(() => {});
}

// ── Re-run ────────────────────────────────────────────
function rerunCheck() {
  score = Math.min(100, score + 8 + Math.floor(Math.random() * 5));
  updateGauge(score);
  updateVerdict(score);
  if (typeof confetti !== 'undefined') {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
  }
}

// ── Section toggle ────────────────────────────────────
function toggleSection(name) {
  const body    = document.getElementById('body-' + name);
  const chevron = document.getElementById('chevron-' + name);
  if (!body) return;
  const isHidden = body.classList.toggle('hidden');
  if (chevron) chevron.style.transform = isHidden ? '' : 'rotate(180deg)';
}

// ── Footer count ──────────────────────────────────────
function updateFooterCount() {
  const n = allActionable.filter(i => appliedFixes.has(i.id)).length;
  const el = document.getElementById('addressed-count');
  if (el) el.textContent = n;
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  // Render blocking issue cards
  const blockingContainer = document.getElementById('body-blocking');
  ISSUES_DATA.filter(i => i.severity === 'blocking').forEach(issue => {
    blockingContainer.appendChild(renderIssueCard(issue));
  });

  // Render warning cards
  const warningsContainer = document.getElementById('body-warnings');
  ISSUES_DATA.filter(i => i.severity === 'warning').forEach(issue => {
    warningsContainer.appendChild(renderIssueCard(issue));
  });

  // Animate gauge
  setTimeout(() => updateGauge(score), 50);
  updateVerdict(score);
  updateFooterCount();

  // Open blocking + warnings by default
  ['blocking', 'warnings'].forEach(name => {
    const body    = document.getElementById('body-' + name);
    const chevron = document.getElementById('chevron-' + name);
    if (body)    body.classList.remove('hidden');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  });

  // Re-run lucide for dynamically inserted icons
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
