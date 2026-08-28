/**
 * Utility Functions Module
 * Reusable helpers for formatting and DOM manipulation
 */

/**
 * Format number as USD currency
 * @param {number} amount - Amount to format
 * @param {boolean} showNegativeAsParens - Show negative as (amount) instead of -amount
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showNegativeAsParens = false) {
  if (isNaN(amount)) {
    return 'USD 0.00';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const formattedAmount = formatter.format(Math.abs(amount));
  
  if (amount < 0 && showNegativeAsParens) {
    return `−USD ${formattedAmount}`;
  }
  
  if (amount < 0) {
    return `−USD ${formattedAmount}`;
  }
  
  return `USD ${formattedAmount}`;
}

/** Spoken money for live regions and aria-labels (not letter-by-letter USD). */
export function formatCurrencySpeech(value) {
  if (!Number.isFinite(Number(value))) return '0.00 US dollars';
  const n = Number(value);
  const formatted = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const amount = n < 0 ? `\u2212${formatted}` : formatted;
  return `${amount} US dollars`;
}

/**
 * Simplified query selector
 * @param {string} selector - CSS selector
 * @returns {Element|null} First matching element
 */
export function $(selector) {
  return document.querySelector(selector);
}

/**
 * Query selector all (returns array)
 * @param {string} selector - CSS selector
 * @returns {Array<Element>} Array of matching elements
 */
export function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param  {...(string|Element)} children - Child elements or text
 * @returns {Element} Created element
 */
export function createElement(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('aria') || key.startsWith('data')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  
  // Append children
  children.forEach(child => {
    if (child == null) return;
    
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Element) {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Safely set text content (prevents XSS)
 * @param {Element} element - Target element
 * @param {string} text - Text content
 */
export function setText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

/**
 * Safely set HTML content (use with caution)
 * @param {Element} element - Target element
 * @param {string} html - HTML content
 */
export function setHTML(element, html) {
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Add event listener with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Cleanup function
 */
export function listen(element, event, handler) {
  if (!element) return () => {};
  
  element.addEventListener(event, handler);
  
  // Return cleanup function
  return () => {
    element.removeEventListener(event, handler);
  };
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const NUMERIC_INPUT_MAX_CHARS = 6;

/**
 * @param {HTMLInputElement} input
 * @param {number} maxLen
 */
export function clampNumericInputLength(input, maxLen) {
  if (!input || input.value == null || maxLen <= 0) return;
  const raw = String(input.value);
  if (raw.length <= maxLen) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = raw.slice(0, maxLen);
  if (typeof input.setSelectionRange === 'function') {
    const pos = Math.min(
      typeof start === 'number' && typeof end === 'number' ? Math.min(start, end) : maxLen,
      maxLen
    );
    input.setSelectionRange(pos, pos);
  }
}

/**
 * Move focus to an element
 * @param {Element|string} element - Element or selector
 * @param {number} delay - Delay before focusing (ms)
 */
export function focusElement(element, delay = 0) {
  const target = typeof element === 'string' ? $(element) : element;
  
  if (!target) return;
  
  if (delay > 0) {
    setTimeout(() => {
      target.focus();
    }, delay);
  } else {
    target.focus();
  }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {Element} liveRegion - Live region element (optional)
 */
export function announceToScreenReader(message, liveRegion = null) {
  const region = liveRegion || $('#view-announcement');
  
  if (!region) return;
  
  setText(region, message);
  
  // Clear after a brief moment so it can be triggered again
  setTimeout(() => {
    setText(region, '');
  }, 100);
}

/**
 * Check if element is visible
 * @param {Element} element - Element to check
 * @returns {boolean} True if visible
 */
export function isVisible(element) {
  if (!element) return false;
  
  return element.offsetWidth > 0 && 
         element.offsetHeight > 0 && 
         window.getComputedStyle(element).display !== 'none';
}

/**
 * Mirror the implicit table semantics as explicit ARIA roles.
 *
 * Below 768px the shared base reflows rows into cards with display:block,
 * which makes browsers drop the implicit table/row/cell roles. Without these
 * attributes a screen reader reads the card as a flat run of text instead of
 * announcing row and column positions. Harmless at wider widths, where the
 * roles simply restate the native semantics.
 *
 * @param {Element|null} table - Table element to annotate
 */
export function applyTableRoles(table) {
  if (!table) return;

  table.setAttribute('role', 'table');
  table.querySelectorAll('thead, tbody, tfoot').forEach((group) => {
    group.setAttribute('role', 'rowgroup');
  });
  table.querySelectorAll('tr').forEach((row) => {
    row.setAttribute('role', 'row');
  });
  table.querySelectorAll('th').forEach((header) => {
    header.setAttribute(
      'role',
      header.getAttribute('scope') === 'row' ? 'rowheader' : 'columnheader'
    );
  });
  table.querySelectorAll('td').forEach((cell) => {
    cell.setAttribute('role', 'cell');
  });
  // colspan is ignored once the cells are display:block
  table.querySelectorAll('[colspan]').forEach((cell) => {
    cell.setAttribute('aria-colspan', cell.getAttribute('colspan'));
  });
}
