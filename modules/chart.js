/**
 * chart.js - Dividend Cash Flow Chart with Keyboard Accessibility
 */
import { $ } from './utils.js';
import { getChartTypography } from '../chart-typography.js';

/** Curriculum chart label convention: 13px / 600 / Lato at the 18px design root. */
const CHART_FONT = { family: '', size: 13, weight: '600' };
let CHART_FONT_CSS = '';

function syncChartTypography() {
  const t = getChartTypography('curriculum');
  CHART_FONT.family = t.font.family;
  CHART_FONT.size = t.font.size;
  CHART_FONT.weight = t.font.weight;
  CHART_FONT_CSS = t.fontCss;
}


const MODEL_COLORS = {
  constant: '#3c6ae5',
  growth: '#07514F',
  changing: '#7a46ff',
  darkText: '#06005a'
};

let chartInstance = null;
let currentFocusIndex = 0;
let isKeyboardMode = false;

export function renderChart(calculations, selectedModel) {
  syncChartTypography();
  const canvas = $('#chart');
  if (!canvas) return;

  // Detect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-roledescription', 'interactive chart');
  // Fixed: removed "Press Tab to focus" - element is already focused when this applies
  canvas.setAttribute(
    'aria-label',
    'Interactive bar chart showing equity cash flows. Use Left and Right arrow keys to navigate between time periods. Press Home for the first period, End for the last.'
  );

  const ctx = canvas.getContext('2d');

  const modelsToShow = selectedModel === 'all' 
    ? ['constant', 'growth', 'changing']
    : [selectedModel];
  
  // Update legend region
  const legendContainer = $('#chart-legend');
  if (legendContainer) {
    if (selectedModel === 'all') {
      const modelNames = {
        constant: 'Constant Dividend',
        growth: 'Constant Dividend Growth',
        changing: 'Changing Dividend Growth'
      };
      
      let legendHTML = '';
      modelsToShow.forEach(modelKey => {
        legendHTML += `
          <div class="legend-item">
            <span class="legend-color legend-swatch-${modelKey}"></span>
            <span>${modelNames[modelKey]}</span>
          </div>
        `;
      });
      legendContainer.innerHTML = legendHTML;
    } else {
      legendContainer.innerHTML = '';
    }
  }
  
  const firstModel = calculations[modelsToShow[0]];
  if (!firstModel || !firstModel.cashFlows || firstModel.cashFlows.length === 0) {
    return;
  }
  
  const cashFlows = firstModel.cashFlows;
  const labels = cashFlows.map(cf => cf.yearLabel === '0' ? 'Initial' : `Yr ${cf.yearLabel}`);
  
  const datasets = modelsToShow.map(modelKey => {
    const modelData = calculations[modelKey];
    const modelName = {
      constant: 'Constant Dividend',
      growth: 'Constant Dividend Growth',
      changing: 'Changing Dividend Growth'
    }[modelKey];
    
    return {
      label: modelName,
      data: modelData.cashFlows.map(cf => cf.dividend),
      backgroundColor: MODEL_COLORS[modelKey]
    };
  });

  if (chartInstance) {
    chartInstance.destroy();
  }
  
  currentFocusIndex = 0;

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      // Respect prefers-reduced-motion: disable animation entirely
      animation: prefersReducedMotion ? { duration: 0 } : { duration: 400 },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: (context) => {
              const index = context[0].dataIndex;
              return cashFlows[index].year === 0 ? 'Initial Investment' : `Year ${cashFlows[index].year}`;
            },
            label: (context) => {
              const value = context.parsed.y;
              const formatted = formatCurrency(Math.abs(value));
              return `${context.dataset.label}: ${formatted}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time Period',
            font: { size: CHART_FONT.size, weight: '600', family: CHART_FONT.family },
            color: '#1f2937'
          },
          ticks: {
            color: '#1f2937',
            font: { size: CHART_FONT.size, weight: '600', family: CHART_FONT.family }
          },
          grid: { display: false }
        },
        y: {
          title: {
            display: true,
            text: 'Cash Flows (USD)',
            font: { size: CHART_FONT.size, weight: '600', family: CHART_FONT.family },
            color: '#1f2937'
          },
          ticks: {
            color: '#1f2937',
            font: { size: CHART_FONT.size, weight: '600', family: CHART_FONT.family },
            callback: function(value) {
              const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(Math.abs(value));
              return value < 0 ? `\u2212${formatted}` : formatted;
            }
          }
        }
      },
      layout: {
        padding: { left: 20, right: 30, top: 20, bottom: 60 }
      }
    },
    plugins: [
      {
        id: 'dataLabels',
        afterDatasetsDraw: (chart) => {
          if (modelsToShow.length > 1) return;
          
          const canvasWidth = chart.canvas.clientWidth;
          if (canvasWidth < 750) return;
          
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          
          let topY = chartArea.bottom;
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach(bar => {
              if (bar.y < topY) topY = bar.y;
            });
          });
          
          const labelY = topY - 5;
          
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            
            meta.data.forEach((bar, index) => {
              const value = dataset.data[index];
              
              const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(Math.abs(value));
              
              const displayLabel = value < 0 ? `\u2212${formatted}` : formatted;
              
              ctx.save();
              ctx.fillStyle = '#1f2937';
              ctx.font = CHART_FONT_CSS;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(displayLabel, bar.x, labelY);
              ctx.restore();
            });
          });
        }
      },
      {
        id: 'keyboardFocus',
        afterDatasetsDraw: (chart) => {
          if (document.activeElement !== canvas) return;
          
          const ctx = chart.ctx;
          
          const allBars = chart.data.datasets
            .map((_, i) => chart.getDatasetMeta(i).data[currentFocusIndex])
            .filter(Boolean);
          
          if (allBars.length === 0) return;
          
          const allYValues = allBars.flatMap(bar => [bar.y, bar.base]);
          const topY = Math.min(...allYValues);
          const bottomY = Math.max(...allYValues);
          
          const firstBar = allBars[0];
          
          ctx.save();
          ctx.strokeStyle = MODEL_COLORS.darkText;
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          
          const x = firstBar.x - firstBar.width / 2 - 4;
          const y = topY - 4;
          const width = firstBar.width + 8;
          const height = bottomY - topY + 8;
          
          ctx.strokeRect(x, y, width, height);
          
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = MODEL_COLORS.darkText;
          ctx.fillRect(x, y, width, height);
          
          ctx.restore();
        }
      }
    ]
  });
  
  setupKeyboardNavigation(canvas, cashFlows, calculations, selectedModel, modelsToShow);
}

function setupKeyboardNavigation(canvas, cashFlows, calculations, selectedModel, modelsToShow) {
  const oldListener = canvas._keydownListener;
  if (oldListener) {
    canvas.removeEventListener('keydown', oldListener);
  }
  
  const keydownListener = (e) => {
    const maxIndex = cashFlows.length - 1;
    let newIndex = currentFocusIndex;
    
    isKeyboardMode = true;
    
    switch(e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentFocusIndex + 1, maxIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentFocusIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = maxIndex;
        break;
      default:
        return;
    }
    
    if (newIndex !== currentFocusIndex) {
      currentFocusIndex = newIndex;
      chartInstance.update('none');
      announceDataPoint(cashFlows[currentFocusIndex], calculations, selectedModel, modelsToShow);
      showTooltipAtIndex(currentFocusIndex);
    }
  };
  
  canvas._keydownListener = keydownListener;
  canvas.addEventListener('keydown', keydownListener);
  
  const focusListener = () => {
    isKeyboardMode = true;
    showTooltipAtIndex(currentFocusIndex);
    announceDataPoint(cashFlows[currentFocusIndex], calculations, selectedModel, modelsToShow);
  };
  
  const blurListener = () => {
    chartInstance.tooltip.setActiveElements([], {x: 0, y: 0});
    chartInstance.update('none');
  };
  
  canvas._focusListener = focusListener;
  canvas._blurListener = blurListener;
  canvas.addEventListener('focus', focusListener);
  canvas.addEventListener('blur', blurListener);
  
  const mouseMoveListener = () => {
    isKeyboardMode = false;
  };
  
  canvas._mouseMoveListener = mouseMoveListener;
  canvas.addEventListener('mousemove', mouseMoveListener);
}

function showTooltipAtIndex(index) {
  if (!chartInstance) return;
  
  const activeElements = chartInstance.data.datasets.map((dataset, datasetIndex) => ({
    datasetIndex,
    index
  }));
  
  const meta = chartInstance.getDatasetMeta(0);
  if (!meta.data[index]) return;
  
  chartInstance.tooltip.setActiveElements(activeElements, {
    x: meta.data[index].x,
    y: meta.data[index].y
  });
  
  chartInstance.update('none');
}

function announceDataPoint(cashFlow, calculations, selectedModel, modelsToShow) {
  const liveRegion = document.getElementById('chart-point-announcement');
  if (!liveRegion || liveRegion.getAttribute('aria-hidden') === 'true') return;
  
  const yearLabel = cashFlow.year === 0 ? 'Initial investment' : `Year ${cashFlow.year}`;
  
  let announcement = `${yearLabel}. `;
  
  if (selectedModel === 'all') {
    modelsToShow.forEach(modelKey => {
      const modelData = calculations[modelKey];
      const dividend = modelData.cashFlows.find(cf => cf.year === cashFlow.year).dividend;
      const modelName = {
        constant: 'Constant Dividend',
        growth: 'Constant Dividend Growth',
        changing: 'Changing Dividend Growth'
      }[modelKey];
      announcement += `${modelName}: ${formatCurrency(Math.abs(dividend))}. `;
    });
  } else {
    announcement += formatCurrency(Math.abs(cashFlow.dividend));
  }
  
  liveRegion.textContent = announcement;
}

function formatCurrency(amount) {
  if (isNaN(amount)) return 'USD 0.00';
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
  
  if (amount < 0) {
    return `\u2212USD ${formatted}`;
  }
  
  return `USD ${formatted}`;
}

export function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}