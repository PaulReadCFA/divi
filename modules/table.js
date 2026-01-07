/**
 * table.js â€“ Add data-label for mobile stacking
 */
import { $ } from './utils.js';

export function renderTable(calculations, selectedModel) {
  const table = $('#data-table');
  if (!table) return;

  const modelsToShow = selectedModel === 'all'
    ? ['constant', 'growth', 'changing']
    : [selectedModel];

  const firstModel = calculations[modelsToShow[0]];
  if (!firstModel || !firstModel.cashFlows) return;

  const cashFlows = firstModel.cashFlows;

  const modelNames = {
    constant: 'Constant Dividend',
    growth: 'Constant Growth',
    changing: 'Changing Growth',   // <-- changed to "Changing Growth" per request
  };

  const modelColors = {
    constant: '#3c6ae5',
    growth: '#15803d',
    changing: '#7a46ff',
  };

  let html = `
    <caption class="sr-only">Dividend cash flow schedule</caption>
    <thead>
      <tr>
        <th scope="col" class="text-left">Year</th>
  `;

  modelsToShow.forEach(m => {
    html += `<th scope="col" class="text-right">${modelNames[m]}</th>`;
  });

  html += `</tr></thead><tbody>`;

  cashFlows.forEach(cf => {
    const yearLabel = cf.year === 0 ? 'Initial' : `Year ${cf.year}`;
    html += `<tr>
      <th scope="row" class="text-left">${yearLabel}</th>`;

    modelsToShow.forEach(m => {
      const flow = calculations[m].cashFlows.find(c => c.year === cf.year);
      const val = flow ? flow.dividend : 0;
      const formatted = formatCurrency(val, true);
      // Colour the numeric cell text using the model's color
      const color = modelColors[m] || '#000';
      html += `<td class="text-right" data-label="${modelNames[m]}"><span style="color: ${color};">${formatted}</span></td>`;
    });

    html += `</tr>`;
  });

  // Footer – Stock Price only
  
  // Label changes based on which models are shown - curriculum accurate with color coding
  const priceLabel = 'Stock Price';
  
  html += `
      <th scope="row" class="text-left" style="border-top: 2px solid var(--color-gray-400); padding-top: 0.75rem;">${priceLabel}</th>`;
  modelsToShow.forEach(m => {
    const price = calculations[m].price;
    const txt = isFinite(price) ? formatCurrency(price) : 'Invalid';
    const color = modelColors[m];
    html += `<td class="text-right" data-label="${modelNames[m]}" style="border-top: 2px solid var(--color-gray-400); padding-top: 0.75rem;"><strong style="color: ${color};">${txt}</strong></td>`;
  });
  html += `</tr></tfoot>`;

  table.innerHTML = html;
}

function formatCurrency(amount, showNegativeAsParens = false) {
  if (isNaN(amount)) return 'USD 0.00';
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(Math.abs(amount));
  if (amount < 0 && showNegativeAsParens) return `(USD ${formatted})`;
  return amount < 0 ? `−USD ${formatted}` : `USD ${formatted}`;
}