/* ── PlanningPal – New Check Page ──────────────────── */

let currentStep = 1;
const TOTAL_STEPS = 4;

const STEP_LABELS = ['Project', 'Council', 'Documents', 'Run'];

const STATUSES = [
  'Reading documents…',
  'Matching against council Local Plan 2024…',
  'Checking historical rejection patterns…',
  'Generating report…',
];

// ── Stepper render ────────────────────────────────────
function renderStepper() {
  const el = document.getElementById('stepper');
  el.innerHTML = '';
  STEP_LABELS.forEach((label, i) => {
    const n = i + 1;
    const done   = currentStep > n;
    const active = currentStep === n;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2 flex-1';

    // Circle
    const circle = document.createElement('div');
    circle.className = [
      'h-7 w-7 rounded-full grid place-items-center text-xs font-medium border shrink-0',
      done   ? 'bg-success text-success-foreground border-success'       :
      active ? 'bg-primary text-primary-foreground border-primary'       :
               'border-border text-muted-foreground',
    ].join(' ');
    circle.innerHTML = done ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : n;

    // Label
    const lbl = document.createElement('span');
    lbl.className = 'text-sm ' + (active ? 'font-semibold' : 'text-muted-foreground');
    lbl.textContent = label;

    wrapper.appendChild(circle);
    wrapper.appendChild(lbl);

    // Connector
    if (i < STEP_LABELS.length - 1) {
      const line = document.createElement('div');
      line.className = 'flex-1 h-px bg-border mx-2';
      wrapper.appendChild(line);
    }

    el.appendChild(wrapper);
  });
}

// ── Step visibility ───────────────────────────────────
function showStep(n) {
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('step-' + n);
  if (target) target.classList.remove('hidden');

  // Back button
  const btnBack = document.getElementById('btn-back');
  if (n === 1) { btnBack.setAttribute('disabled', ''); }
  else         { btnBack.removeAttribute('disabled'); }

  // Next/Run button
  const btnNext = document.getElementById('btn-next');
  if (n < TOTAL_STEPS) {
    btnNext.textContent = 'Continue';
    btnNext.classList.remove('hidden');
  } else {
    btnNext.classList.add('hidden');
  }

  // Populate run summary
  if (n === TOTAL_STEPS) {
    document.getElementById('run-project-name').textContent =
      document.getElementById('project-name').value;
    document.getElementById('run-council-name').textContent =
      document.getElementById('council-select').value;
  }

  renderStepper();
  // Re-run Lucide for any icons added
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function nextStep() {
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

// ── Council info panel ────────────────────────────────
function updateCouncilInfo() {
  const sel = document.getElementById('council-select');
  const name  = sel.value;
  const quirk = sel.options[sel.selectedIndex].dataset.quirk || '';
  document.getElementById('council-info-title').textContent = name + ' known quirks';
  document.getElementById('council-info-quirk').textContent = quirk;
}

// ── Upload simulation ─────────────────────────────────
function simulateUpload() {
  document.querySelectorAll('.doc-item').forEach(item => {
    const badge = item.querySelector('.doc-badge');
    const label = item.querySelector('.doc-label');
    badge.className = 'h-5 w-5 rounded-full grid place-items-center text-[10px] shrink-0 bg-success-soft text-success doc-badge';
    badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    label.className = 'doc-label';
  });
}

// ── Run compliance check ──────────────────────────────
function runCheck() {
  const stepPanel    = document.getElementById('step-panel');
  const loadingPanel = document.getElementById('loading-panel');
  stepPanel.classList.add('hidden');
  loadingPanel.classList.remove('hidden');

  let idx = 0;
  renderStatusList(idx);

  const interval = setInterval(() => {
    idx++;
    if (idx < STATUSES.length) {
      renderStatusList(idx);
    } else {
      clearInterval(interval);
      window.location.href = '/report/demo';
    }
  }, 700);
}

function renderStatusList(activeIdx) {
  document.getElementById('status-text').textContent = STATUSES[activeIdx];
  const list = document.getElementById('status-list');
  list.innerHTML = '';
  STATUSES.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 text-xs ' +
      (i <= activeIdx ? 'text-foreground' : 'text-muted-foreground/60');

    let icon = '';
    if (i < activeIdx) {
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (i === activeIdx) {
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>';
    } else {
      icon = '<span class="h-3 w-3 rounded-full border border-current inline-block"></span>';
    }

    row.innerHTML = icon + '<span class="font-mono">' + s + '</span>';
    list.appendChild(row);
  });
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  renderStepper();
  showStep(1);
});
