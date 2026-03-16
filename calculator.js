/**
 * calculator.js - Dividend Discount Model Calculator
 */
import { state, setState, subscribe } from './modules/state.js';
import { calculateAllModels } from './modules/calculations.js';
import { renderResults } from './modules/results.js';
import { renderChart, destroyChart } from './modules/chart.js';
import { renderTable } from './modules/table.js';
import { renderEquations } from './modules/equations.js';
import { $, listen, debounce } from './modules/utils.js';
import {
  validateAll,
  validateField,
  updateFieldError,
  updateValidationSummary,
  hasErrors,
  getRelevantFields,
} from './modules/validation.js';

/* ---------- INITIALIZATION ---------- */
function init() {
  // Check narrow screen FIRST before setting up anything else
  const initialNarrowCheck = window.innerWidth <= 600;
  if (initialNarrowCheck) {
    document.body.classList.add('force-table');
    setState({ view: 'table' });
  }
  
  setupInputs();
  setupModelSelector();
  setupViewToggle();
  subscribe(updateAll);

  // Set initial model to 'constant' - applies button state, hides irrelevant inputs,
  // validates and runs calculations
  selectModel('constant');
  
  // Run narrow detection after initial setup
  detectNarrowScreen();
  window.addEventListener('resize', debounce(detectNarrowScreen, 200));

  // Setup skip links
  setupSkipLinks();
}

function switchView(view) {
  const isForced = document.body.classList.contains('force-table');
  
  if (isForced && view === 'chart') {
    return;
  }

  setState({ view });
}

/* ---------- SKIP LINKS ---------- */
function setupSkipLinks() {
  const skipLinks = document.querySelectorAll('.skip-link');
  
  skipLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      
      if (!target) return;
      
      if (targetId === 'data-table') {
        switchView('table');
        
        setTimeout(() => {
          const tableContainer = document.getElementById('table-container');
          if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          
          setTimeout(() => {
            const tableBtn = document.getElementById('view-table-btn');
            if (tableBtn) {
              tableBtn.focus();
            }
          }, 500);
        }, 100);
      } else {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ---------- INPUTS ---------- */
function setupInputs() {
  const fields = ['D0', 'required', 'gConst', 'gShort', 'gLong', 'shortYears'];

  fields.forEach(id => {
    const el = $(`#${id}`);
    if (!el) return;

    const handler = debounce(() => {
      const raw = el.value.trim();
      const val = raw === '' ? NaN : Number(raw);

      const candidate = { ...state.inputs, [id]: val };

      const errors = validateAll(candidate);

      fields.forEach(f => {
        updateFieldError(f, errors[f]);
      });

      updateValidationSummary(errors);

      setState({ inputs: candidate, errors });

      if (!hasErrors(errors)) {
        updateCalculations();
      }
    }, 300);

    listen(el, 'input', handler);
    listen(el, 'change', handler);
    listen(el, 'blur', handler);
  });
}

/* ---------- CALCULATIONS ---------- */

// Announce results to SR users after a 1s pause — prevents
// repeated announcements when the user is cycling a spinner.
const announceResults = debounce(() => {
  const region = $('#calculation-announcement');
  if (!region) return;
  region.textContent = '';
  // Brief timeout so the clear registers before the new text
  setTimeout(() => {
    region.textContent = 'Results updated.';
  }, 50);
}, 1000);

function updateCalculations() {
  const { inputs, errors } = state;
  if (hasErrors(errors)) {
    setState({ calculations: null });
    return;
  }

  try {
    const calculations = calculateAllModels({
      D0: inputs.D0,
      required: inputs.required / 100,
      gConst: inputs.gConst / 100,
      gShort: inputs.gShort / 100,
      gLong: inputs.gLong / 100,
      shortYears: inputs.shortYears,
    });
    setState({ calculations });
    announceResults();
  } catch (e) {
    console.error(e);
    setState({ calculations: null });
  }
}

/* ---------- MODEL SELECTOR ---------- */
function setupModelSelector() {
  const modelButtons = [
    { id: 'model-all-btn', model: 'all' },
    { id: 'model-constant-btn', model: 'constant' },
    { id: 'model-growth-btn', model: 'growth' },
    { id: 'model-changing-btn', model: 'changing' }
  ];

  modelButtons.forEach(({ id, model }) => {
    const btn = $(`#${id}`);
    if (!btn) return;
    listen(btn, 'click', () => selectModel(model));
  });
}

function selectModel(model) {
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.model === model);
    btn.setAttribute('aria-pressed', btn.dataset.model === model);
  });
  
  // Show/hide inputs based on selected model
  document.querySelectorAll('.input-row').forEach(row => {
    const models = row.getAttribute('data-models');
    if (!models) {
      row.style.display = '';
      return;
    }
    
    const modelList = models.split(' ');
    const shouldShow = model === 'all' ? modelList.length > 0 : modelList.includes(model);
    row.style.display = shouldShow ? '' : 'none';
  });

  // Show only the relevant formula box (all three visible when 'all' is selected)
  document.querySelectorAll('.formula-box').forEach(box => {
    if (model === 'all') {
      box.style.display = '';
    } else {
      box.style.display = box.classList.contains(model) ? '' : 'none';
    }
  });
  
  setState({ selectedModel: model });
  
  // Re-validate only fields relevant to the selected model
  const relevantFields = getRelevantFields(model);
  const newErrors = {};
  
  relevantFields.forEach(field => {
    const error = validateField(field, state.inputs[field], state.inputs);
    if (error) newErrors[field] = error;
  });
  
  setState({ errors: newErrors });
  
  const allFields = ['D0', 'required', 'gConst', 'gShort', 'gLong', 'shortYears'];
  allFields.forEach(field => {
    updateFieldError(field, newErrors[field] || null);
  });
  
  updateValidationSummary(newErrors);
  
  if (!hasErrors(newErrors)) {
    updateCalculations();
  }
}

/* ---------- VIEW TOGGLE ---------- */
function setupViewToggle() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');

  updateButtonStates();

  if (chartBtn) {
    chartBtn.addEventListener('click', (e) => {
      const isForced = document.body.classList.contains('force-table');
      
      if (isForced || chartBtn.disabled) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Animate only if motion is acceptable
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (tableBtn && !prefersReducedMotion) {
          tableBtn.style.transition = 'transform 0.2s ease';
          tableBtn.style.transform = 'scale(1.05)';
          setTimeout(() => {
            tableBtn.style.transform = 'scale(1)';
          }, 200);
        }
        
        setState({ view: 'table' });
        updateButtonStates();
        
        return false;
      }
      
      setState({ view: 'chart' });
      updateButtonStates();
    }, true);
  }

  listen(tableBtn, 'click', () => {
    setState({ view: 'table' });
    updateButtonStates();
  });

  [chartBtn, tableBtn].forEach(btn => {
    if (!btn) return;
    btn.tabIndex = 0;
    
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = btn === chartBtn ? tableBtn : chartBtn;
        next.focus();
        setState({ view: next.id === 'view-chart-btn' ? 'chart' : 'table' });
        updateButtonStates();
      }
    });
  });
}

function updateButtonStates() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');
  const isForced = document.body.classList.contains('force-table');
  const currentView = isForced ? 'table' : state.view;

  if (!chartBtn || !tableBtn) return;

  chartBtn.classList.toggle('active', currentView === 'chart');
  tableBtn.classList.toggle('active', currentView === 'table');
  
  chartBtn.setAttribute('aria-pressed', currentView === 'chart');
  tableBtn.setAttribute('aria-pressed', currentView === 'table');
  
  chartBtn.disabled = isForced;
}

/* ---------- NARROW SCREEN ---------- */
function detectNarrowScreen() {
  const narrow = window.innerWidth <= 600;
  
  if (narrow) {
    document.body.classList.add('force-table');
    if (state.view !== 'table') {
      setState({ view: 'table' });
    }
  } else {
    document.body.classList.remove('force-table');
  }
  
  updateButtonStates();
}

/* ---------- UPDATE ALL ---------- */
function updateAll(s) {
  if (!s.calculations) return;

  renderEquations(s.inputs, s.calculations);
  renderResults(s.calculations, s.selectedModel);
  
  const isForced = document.body.classList.contains('force-table');
  const actualView = isForced ? 'table' : s.view;

  const chartContainer = $('#chart-container');
  const tableContainer = $('#table-container');
  
  if (!chartContainer || !tableContainer) return;

  renderTable(s.calculations, s.selectedModel);
  
  if (actualView === 'chart' && !isForced) {
    chartContainer.style.display = 'block';
    tableContainer.style.display = 'none';
    renderChart(s.calculations, s.selectedModel);
  } else {
    chartContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    destroyChart();
  }
  
  updateButtonStates();
}

/* ---------- START ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}