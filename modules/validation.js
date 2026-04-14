/**
 * validation.js – Clean, cross-field aware validation
 * Matches the pattern used in other calculators
 */
import { $ } from './utils.js';

/* ---------- 1. RULES ---------- */
const RULES = {
  D0: {
    min: 0.1,
    max: 1000,
    required: true,
    label: 'Current dividend',
  },
  required: {
    min: 0.1,
    max: 50,
    required: true,
    label: 'Required return',
  },
  gConst: {
    min: -10,
    max: 30,
    required: true,
    label: 'Constant dividend growth',
    custom: (v, all) => (v >= all.required ? 'Growth rate must be less than required return' : null),
  },
  gShort: {
    min: -10,
    max: 50,
    required: true,
    label: 'Short-term growth',
  },
  gLong: {
    min: -10,
    max: 30,
    required: true,
    label: 'Long-term growth',
    custom: (v, all) => (v >= all.required ? 'Long-term growth rate must be less than required return' : null),
  },
  shortYears: {
    min: 1,
    max: 10,
    required: true,
    label: 'Short-term period',
  },
};

/* ---------- HELPER: MODEL-AWARE FIELD FILTERING ---------- */
/**
 * Returns which fields are relevant for a given model
 * @param {string} selectedModel - 'constant' | 'growth' | 'changing' | 'all'
 * @returns {Array<string>} - Array of relevant field names
 */
export function getRelevantFields(selectedModel) {
  const common = ['D0', 'required'];
  
  switch(selectedModel) {
    case 'constant':
      return common;
    case 'growth':
      return [...common, 'gConst'];
    case 'changing':
      return [...common, 'gShort', 'gLong', 'shortYears'];
    case 'all':
      return ['D0', 'required', 'gConst', 'gShort', 'gLong', 'shortYears'];
    default:
      return common;
  }
}

/* ---------- 2. SINGLE FIELD ---------- */
export function validateField(field, value, allInputs = {}) {
  const r = RULES[field];
  if (!r) return null;

  if (r.required && (value === '' || value == null || isNaN(value))) {
    return `${r.label} is required`;
  }
  if (r.min !== undefined && value < r.min) return `${r.label} must be >= ${r.min}`;
  if (r.max !== undefined && value > r.max) return `${r.label} must be <= ${r.max}`;

  if (r.custom) {
    const msg = r.custom(value, allInputs);
    if (msg) return msg;
  }
  return null;
}

/* ---------- 3. ALL FIELDS ---------- */
export function validateAll(inputs) {
  const errors = {};
  for (const f in RULES) {
    const err = validateField(f, inputs[f], inputs);
    if (err) errors[f] = err;
  }
  return errors;
}

/* ---------- 4. UI HELPERS ---------- */
export function updateFieldError(fieldId, msg) {
  const el = $(`#${fieldId}`);
  if (!el) return;
  
  const hasError = !!msg;
  el.classList.toggle('error', hasError);
  el.setAttribute('aria-invalid', hasError ? 'true' : 'false');
  
  // Add/remove aria-describedby for error message
  if (hasError) {
    const errorId = `${fieldId}-error`;
    el.setAttribute('aria-describedby', errorId);
    
    // Create or update error message element
    let errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.id = errorId;
      errorEl.className = 'sr-only';
      errorEl.setAttribute('role', 'alert');
      el.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = msg;
  } else {
    el.removeAttribute('aria-describedby');
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) errorEl.remove();
  }
}

/* ---------- 5. SUMMARY ---------- */
let liveRegion = null;
function announceSummary(cnt) {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'validation-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = `${cnt} validation ${cnt === 1 ? 'error' : 'errors'}.`;
  setTimeout(() => (liveRegion.textContent = ''), 1500);
}

export function updateValidationSummary(errors) {
  const sum = $('#validation-summary');
  const list = $('#validation-list');
  if (!sum || !list) return;

  const cnt = Object.keys(errors).length;
  const wasHidden = sum.style.display === 'none';
  
  if (cnt) {
    list.innerHTML = Object.entries(errors)
      .map(
        ([f, m]) =>
          `<li><a href="#${f}" data-field="${f}" class="validation-error-link">${m}</a></li>`
      )
      .join('');
    sum.style.display = 'block';
    announceSummary(cnt);
    
    // Add click handlers to error links
    const links = list.querySelectorAll('.validation-error-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const fieldId = link.getAttribute('data-field');
        const field = document.getElementById(fieldId);
        if (field) {
          field.focus();
          field.select();
          // Scroll field into view
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
    
    // Only scroll validation summary into view when FIRST displayed, not on every update
    // This prevents annoying page jumping when user adjusts values with spinner arrows
    if (wasHidden) {
      sum.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } else {
    sum.style.display = 'none';
  }
}

/* ---------- 6. FOCUS FIRST ERROR ---------- */
export function focusFirstError(errors) {
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    const el = $(`#${firstErrorField}`);
    if (el) {
      setTimeout(() => {
        el.focus();
        el.select(); // Select the invalid value for easy correction
      }, 100);
    }
  }
}

/* ---------- 7. HAS ERRORS ---------- */
export function hasErrors(e) {
  return Object.keys(e).length > 0;
}