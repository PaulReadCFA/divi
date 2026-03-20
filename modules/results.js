/**
 * Results Rendering - Dividend Discount Calculator
 * aria-live removed from individual result boxes - announcements were excessive.
 * Users can navigate to result boxes to hear values via normal tab/screen reader flow.
 */
import { $ } from './utils.js';

const MODEL_META = {
  constant: {
    name: 'Constant Dividend',
    color: '#3c6ae5',
    description: 'No growth assumed',
    formula: 'P = D\u2081 \u00F7 r'
  },
  growth: {
    name: 'Constant Dividend Growth',
    color: '#15803d',
    description: 'Constant growth rate',
    formula: 'P = D\u2081 \u00F7 (r \u2212 g)'
  },
  changing: {
    name: 'Changing Dividend Growth',
    color: '#7a46ff',
    description: 'High then sustainable growth',
    formula: 'P = PV(high) + PV(term)'
  }
};

export function renderResults(calculations, selectedModel) {
  const container = $('#results-content');
  if (!container) return;
  
  container.innerHTML = '';
  
  const modelsToShow = selectedModel === 'all' 
    ? ['constant', 'growth', 'changing']
    : [selectedModel];
  
  modelsToShow.forEach(modelKey => {
    const modelData = calculations[modelKey];
    const metadata = MODEL_META[modelKey];
    
    const box = document.createElement('div');
    box.className = `result-box model-${modelKey}`;
    // Removed aria-live="polite" - auto-announcing every recalculation is excessive.
    // Screen reader users can navigate here deliberately to hear results.
    
    const title = document.createElement('h5');
    title.className = `result-title model-${modelKey}`;
    title.textContent = metadata.name;
    box.appendChild(title);
    
    const valueDiv = document.createElement('div');
    valueDiv.className = `result-value model-${modelKey}`;
    
    if (isFinite(modelData.price)) {
      valueDiv.textContent = formatCurrency(modelData.price);
    } else {
      valueDiv.textContent = 'Not Applicable';
      valueDiv.style.fontSize = '1.25rem';
      
      const explanation = document.createElement('div');
      explanation.className = 'result-explanation';
      explanation.style.fontSize = '0.75rem';
      explanation.style.marginTop = '0.25rem';
      explanation.style.fontWeight = 'normal';
      explanation.textContent = 'Growth rate must be less than required return';
      box.appendChild(explanation);
    }
    
    box.appendChild(valueDiv);
    
    if (isFinite(modelData.price)) {
      const description = document.createElement('div');
      description.className = 'result-description';
      description.textContent = metadata.description;
      box.appendChild(description);
    }
    
    container.appendChild(box);
  });
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