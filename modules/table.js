/**
 * table.js â€“ Add data-label for mobile stacking
 */
import { $ } from './utils.js';

export function renderTable(calculations, selectedModel) {
  // Clear legend in table view
  const legendContainer = $('#chart-legend');
  if (legendContainer) {
    legendContainer.innerHTML = '';
  }
  
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
    // Add model notation with color
    const notations = {
      constant: '<span style="color: #3c6ae5;">P</span>',
      growth: '<span style="color: #15803d;">PV<sub style="color: #15803d;">t</sub></span>',
      changing: '<span style="color: #7a46ff;">PV<sub style="color: #7a46ff;">0</sub></span>'
    };
    html += `<th scope="col" class="text-right">${modelNames[m]} (${notations[m]})</th>`;
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

  // Footer â€“ totals + price
  html += `</tbody><tfoot>
    <tr>
      <th scope="row" class="text-left">Total Received</th>`;
  modelsToShow.forEach(m => {
    const total = calculations[m].cashFlows
      .reduce((s, c) => s + (c.dividend > 0 ? c.dividend : 0), 0);
    const color = modelColors[m] || '#000';
    html += `<td class="text-right" data-label="${modelNames[m]}"><strong style="color: ${color};">${formatCurrency(total)}</strong></td>`;
  });
  html += `</tr>
    <tr>`;
  
  // Label changes based on which models are shown - curriculum accurate with color coding
  let priceLabel = 'Stock Price';
  if (modelsToShow.length === 1) {
    const m = modelsToShow[0];
    const color = modelColors[m];
    if (m === 'constant') {
      priceLabel = `Stock Price (<span style="color: ${color};">P</span>)`;
    } else if (m === 'growth') {
      priceLabel = `Stock Price (<span style="color: ${color};">PV</span><sub style="color: ${color};">t</sub>)`;
    } else if (m === 'changing') {
      priceLabel = `Stock Price (<span style="color: ${color};">PV</span><sub style="color: ${color};">0</sub>)`;
    }
  } else {
    // Multiple models - show all notations with colors
    const notations = [];
    if (modelsToShow.includes('constant')) {
      const color = modelColors.constant;
      notations.push(`<span style="color: ${color};">P</span>`);
    }
    if (modelsToShow.includes('growth')) {
      const color = modelColors.growth;
      notations.push(`<span style="color: ${color};">PV</span><sub style="color: ${color};">t</sub>`);
    }
    if (modelsToShow.includes('changing')) {
      const color = modelColors.changing;
      notations.push(`<span style="color: ${color};">PV</span><sub style="color: ${color};">0</sub>`);
    }
    priceLabel = `Stock Price (${notations.join(' / ')})`;
  }
  
  html += `
      <th scope="row" class="text-left">${priceLabel}</th>`;
  modelsToShow.forEach(m => {
    const price = calculations[m].price;
    const txt = isFinite(price) ? formatCurrency(price) : 'Invalid';
    const color = modelColors[m];
    html += `<td class="text-right" data-label="${modelNames[m]}"><strong style="color: ${color};">${txt}</strong></td>`;
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