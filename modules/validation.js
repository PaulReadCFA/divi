/**
 * validation.js – Clean, cross-field aware validation
 */
import {
  updateFieldError,
  updateValidationSummary,
  hasErrors,
  requiredMessage,
  minMessage,
  maxMessage,
} from '../validation-ui.js';

export { updateFieldError, updateValidationSummary, hasErrors };

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

export function getRelevantFields(selectedModel) {
  const common = ['D0', 'required'];

  switch (selectedModel) {
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

export function validateField(field, value, allInputs = {}) {
  const r = RULES[field];
  if (!r) return null;

  if (r.required && (value === '' || value == null || isNaN(value))) {
    return requiredMessage(r.label);
  }
  if (r.min !== undefined && value < r.min) return minMessage(r.label, r.min);
  if (r.max !== undefined && value > r.max) return maxMessage(r.label, r.max);

  if (r.custom) {
    const msg = r.custom(value, allInputs);
    if (msg) return msg;
  }
  return null;
}

export function validateAll(inputs, fields = Object.keys(RULES)) {
  const errors = {};
  fields.forEach((f) => {
    const err = validateField(f, inputs[f], inputs);
    if (err) errors[f] = err;
  });
  return errors;
}

export function focusFirstError(errors) {
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    const el = document.getElementById(firstErrorField);
    if (el) {
      setTimeout(() => {
        el.focus();
        if (typeof el.select === 'function') el.select();
      }, 100);
    }
  }
}
