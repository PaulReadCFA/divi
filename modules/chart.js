/**
 * chart.js - Dividend Cash Flow Chart with Keyboard Accessibility
 * Adapted from bond calculator pattern
 */
import { $ } from './utils.js';

const MODEL_COLORS = {
  constant: '#3c6ae5',
  growth: '#15803d',
  changing: '#7a46ff',
  darkText: '#06005a'
};

let chartInstance = null;
let currentFocusIndex = 0;
let isKeyboardMode = false;

export function renderChart(calculations, selectedModel) {
  const canvas = $('#chart');
  if (!canvas) return;

  // Make canvas focusable and add keyboard navigation
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-roledescription', 'interactive chart');
  canvas.setAttribute(
    'aria-label',
    'Interactive bar chart showing equity cash flows over time. Press Tab to focus, then use Left and Right arrow keys to navigate between time periods. Press Home to go to first period, End to go to last period.'
  );

  const ctx = canvas.getContext('2d');

  // Determine which models to display
  const modelsToShow = selectedModel === 'all' 
    ? ['constant', 'growth', 'changing']
    : [selectedModel];
  
  // Render legend only when showing all models
  const legendContainer = $('#chart-legend');
  if (legendContainer) {
    if (selectedModel === 'all') {
      const modelNames = {
        constant: 'Constant Dividend',
        growth: 'Constant Growth',
        changing: 'Changing Growth'
      };
      
      let legendHTML = '';
      modelsToShow.forEach(modelKey => {
        legendHTML += `
          <div class="legend-item" role="listitem">
            <span class="legend-color" style="background-color: ${MODEL_COLORS[modelKey]};"></span>
            <span>${modelNames[modelKey]}</span>
          </div>
        `;
      });
      legendContainer.innerHTML = legendHTML;
    } else {
      // Clear legend for single model view
      legendContainer.innerHTML = '';
    }
  }
  
  // Get data from first model (they all have same years)
  const firstModel = calculations[modelsToShow[0]];
  if (!firstModel || !firstModel.cashFlows || firstModel.cashFlows.length === 0) {
    return;
  }
  
  const cashFlows = firstModel.cashFlows;
  const labels = cashFlows.map(cf => cf.yearLabel === '0' ? 'Initial' : `Yr ${cf.yearLabel}`);
  
  // Build datasets for selected models
  const datasets = modelsToShow.map(modelKey => {
    const modelData = calculations[modelKey];
    const modelName = {
      constant: 'Constant Dividend',
      growth: 'Constant Growth',
      changing: 'Changing Growth'
    }[modelKey];
    
    return {
      label: modelName,
      data: modelData.cashFlows.map(cf => cf.dividend),
      backgroundColor: MODEL_COLORS[modelKey]
    };
  });

  // Destroy existing chart instance
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  // Reset focus index
  currentFocusIndex = 0;

  // Create chart
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      onHover: (event, activeElements) => {
        // Skip if keyboard focus already active
        if (isKeyboardMode && document.activeElement === canvas) return;

        // Announce hovered data point
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          announceDataPoint(cashFlows[index], calculations, selectedModel, modelsToShow);
        }
      },
      plugins: {
        legend: {
          display: false  // Disabled - using custom HTML legend outside chart
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
            font: {
              weight: 'bold',
              size: 12
            },
            color: '#000'
          },
          ticks: {
            color: '#000',
            font: {
              weight: 'bold',
              size: 11
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          title: {
            display: true,
            text: 'Cash Flows (USD)',
            font: {
              weight: 'bold',
              size: 12
            },
            color: '#000'
          },
          ticks: {
            color: '#000',
            font: {
              weight: 'bold',
              size: 11
            },
            callback: function(value) {
              const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(Math.abs(value));
              // Bare numbers only - no USD prefix
              return value < 0 ? `−${formatted}` : formatted;
            }
          }
        }
      },
      layout: {
        padding: {
          left: 20,
          right: 30,
          top: 20,
          bottom: 60
        }
      }
    },
    plugins: [

      {
        // Data labels plugin - only show for single model view
        id: 'dataLabels',
        afterDatasetsDraw: (chart) => {
          // Only show labels if single model (not "all")
          if (modelsToShow.length > 1) return;
          
          // Hide labels at ultra-narrow widths to prevent overlap
          // Use canvas clientWidth for accurate measurement
          const canvasWidth = chart.canvas.clientWidth;
          if (canvasWidth < 600) return;  // Conservative threshold - prevents label overlap
          
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          
          // Find the highest point (lowest Y value) across all bars to align labels
          let topY = chartArea.bottom; // Start with bottom
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach(bar => {
              if (bar.y < topY) topY = bar.y;
            });
          });
          
          // Position all labels at consistent height above the highest bar
          const labelY = topY - 5;
          
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            
            meta.data.forEach((bar, index) => {
              const value = dataset.data[index];
              
              // Format value with 2 decimal places using USD prefix
              const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(Math.abs(value));
              
              // Add USD prefix and parentheses for negative values
              const displayLabel = value < 0 ? `(USD ${formatted})` : `USD ${formatted}`;
              
              ctx.save();
              ctx.fillStyle = '#1f2937';  // Darker gray for better readability
              ctx.font = 'bold 11px sans-serif';  // Bold for better visibility
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              
              // All labels at same height
              ctx.fillText(displayLabel, bar.x, labelY);
              
              ctx.restore();
            });
          });
        }
      },
      {
        // Keyboard focus highlight plugin
        id: 'keyboardFocus',
        afterDatasetsDraw: (chart) => {
          if (document.activeElement !== canvas) return;
          
          const ctx = chart.ctx;
          
          // Get all bars at the focused index
  const allBars = chart.data.datasets
  .map((_, i) => chart.getDatasetMeta(i).data[currentFocusIndex])
  .filter(Boolean);
          
          if (allBars.length === 0) return;
          
          // Find bounding box of all bars at this index
          const allYValues = allBars.flatMap(bar => [bar.y, bar.base]);
          const topY = Math.min(...allYValues);
          const bottomY = Math.max(...allYValues);
          
          const firstBar = allBars[0];
          
          // Draw focus indicator
          ctx.save();
          ctx.strokeStyle = MODEL_COLORS.darkText;
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          
          const x = firstBar.x - firstBar.width / 2 - 4;
          const y = topY - 4;
          const width = firstBar.width + 8;
          const height = bottomY - topY + 8;
          
          ctx.strokeRect(x, y, width, height);
          
          // Add filled background for better visibility
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = MODEL_COLORS.darkText;
          ctx.fillRect(x, y, width, height);
          
          ctx.restore();
        }
      }
    ]
  });
  
  // Add keyboard navigation
  setupKeyboardNavigation(canvas, cashFlows, calculations, selectedModel, modelsToShow);
}

/**
 * Setup keyboard navigation for the chart
 */
function setupKeyboardNavigation(canvas, cashFlows, calculations, selectedModel, modelsToShow) {
  // Remove existing listeners to avoid duplicates
  const oldListener = canvas._keydownListener;
  if (oldListener) {
    canvas.removeEventListener('keydown', oldListener);
  }
  
  // Create new listener
  const keydownListener = (e) => {
    const maxIndex = cashFlows.length - 1;
    let newIndex = currentFocusIndex;
    
    // Enable keyboard mode on any arrow key press
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
  
  // Store listener reference for cleanup
  canvas._keydownListener = keydownListener;
  canvas.addEventListener('keydown', keydownListener);
  
  // Focus handler
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
  
  // Disable keyboard mode when mouse moves over chart
  const mouseMoveListener = () => {
    isKeyboardMode = false;
  };
  
  canvas._mouseMoveListener = mouseMoveListener;
  canvas.addEventListener('mousemove', mouseMoveListener);
}

/**
 * Show tooltip at a specific data index
 */
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

/**
 * Announce data point for screen readers
 */
function announceDataPoint(cashFlow, calculations, selectedModel, modelsToShow) {
  let liveRegion = document.getElementById('chart-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'chart-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  const yearLabel = cashFlow.year === 0 ? 'Initial investment' : `Year ${cashFlow.year}`;
  
  let announcement = `${yearLabel}. `;
  
  if (selectedModel === 'all') {
    modelsToShow.forEach(modelKey => {
      const modelData = calculations[modelKey];
      const dividend = modelData.cashFlows.find(cf => cf.year === cashFlow.year).dividend;
      const modelName = {
        constant: 'Constant',
        growth: 'Growth',
        changing: 'Two-stage'
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
    return `−USD ${formatted}`;
  }
  
  return `USD ${formatted}`;
}

export function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}