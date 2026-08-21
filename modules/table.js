/**
 * table.js – Add data-label for mobile stacking
 */
import { $, applyTableRoles } from './utils.js';

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
    growth: 'Constant Dividend Growth',
    changing: 'Changing Dividend Growth',
  };
  const modelTableClasses = {
    constant: 'table-var-2',
    growth: 'table-var-5',
    changing: 'table-var-3',
  };

  let html = `
    <caption id="table-caption" class="sr-only">Dividend cash flow schedule</caption>
    <thead>
      <tr>
        <th scope="col" class="text-left">Year</th>
  `;

  // Add (USD) to column headers
  modelsToShow.forEach(m => {
    html += `<th scope="col" class="text-right ${modelTableClasses[m]}">${modelNames[m]} (USD)</th>`;
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
      html += `<td class="text-right" data-label="${modelNames[m]} (USD)"><span class="cell-value ${modelTableClasses[m]}">${formatted}</span></td>`;
    });

    html += `</tr>`;
  });

  // Footer – Stock Price only
  html += `<tfoot><tr>`;
  
  // Label changes based on which models are shown.
  const priceLabel = 'Stock Price (USD)';
  
  html += `
      <th scope="row" class="text-left">${priceLabel}</th>`;
  modelsToShow.forEach(m => {
    const price = calculations[m].price;
    const txt = isFinite(price) ? formatCurrency(price) : 'Invalid';
    html += `<td class="text-right" data-label="${modelNames[m]} (USD)"><span class="cell-value ${modelTableClasses[m]}"><strong>${txt}</strong></span></td>`;
  });
  html += `</tr></tfoot>`;

  table.innerHTML = html;
  applyTableRoles(table);
}

function formatCurrency(amount, showNegativeAsParens = false) {
  if (isNaN(amount)) return '0.00';
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(Math.abs(amount));
  if (amount < 0 && showNegativeAsParens) return `−${formatted}`;
  return amount < 0 ? `−${formatted}` : formatted;
}