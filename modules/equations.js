/**
 * equations.js - Dynamic Equation Rendering
 * Displays equations with numeric values substituted
 */
import { $ } from './utils.js';

const COLORS = {
  P_constant: '#3c6ae5',
  P_growth: '#07514F',
  P_changing: '#7a46ff',
  D0: '#b95b1d',
  r: '#7A46FF',
  g: '#07514F',
  n: '#0079a6'
};

/**
 * Render all three equations with current input values
 */
export function renderEquations(inputs, calculations) {
  // Lock formula-box heights to prevent layout jumping during MathJax re-render
  const formulaBoxes = document.querySelectorAll('.formula-box.constant, .formula-box.growth, .formula-box.changing');
  const heights = new Map();
  
  formulaBoxes.forEach(box => {
    const currentHeight = box.getBoundingClientRect().height;
    heights.set(box, currentHeight);
    box.style.height = `${currentHeight}px`;
    box.style.minHeight = `${currentHeight}px`;
    box.style.maxHeight = `${currentHeight}px`;
    box.style.overflow = 'hidden';
  });
  
  renderConstantEquation(inputs, calculations.constant);
  renderGrowthEquation(inputs, calculations.growth);
  renderChangingEquation(inputs, calculations.changing);
  
  if (typeof MathJax !== 'undefined' && MathJax.Hub) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub], function() {
      // Remove tabindex and empty nobr elements from MathJax output
      function cleanMathJax() {
        var mathJaxElements = document.querySelectorAll('.MathJax[tabindex]');
        mathJaxElements.forEach(function(el) {
          el.removeAttribute('tabindex');
        });
        var nobrElements = document.querySelectorAll('.formula-box nobr[aria-hidden="true"]');
        nobrElements.forEach(function(el) {
          if (!el.textContent.trim()) {
            el.remove();
          }
        });
      }

      setTimeout(cleanMathJax, 10);
      setTimeout(cleanMathJax, 100);
      setTimeout(cleanMathJax, 500);
      
      // Release height lock after MathJax finishes
      setTimeout(function() {
        formulaBoxes.forEach(box => {
          box.style.height = '';
          box.style.minHeight = '';
          box.style.maxHeight = '';
          box.style.overflow = '';
        });
      }, 200);
    });
  }
}

/**
 * Constant Dividend Model
 */
function renderConstantEquation(inputs, result) {
  const container = document.querySelector('.formula-box.constant .equation-container');
  if (!container) return;

  const D0 = inputs.D0;
  const r = inputs.required;
  const P = result.price;

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.95em;">
        <mrow>
          <msub>
            <mi mathcolor="${COLORS.P_constant}" mathvariant="bold">PV</mi>
            <mi>t</mi>
          </msub>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mtext mathvariant="bold" mathcolor="${COLORS.D0}">USD ${Number.isFinite(D0) ? D0.toFixed(2) : '\u2014'}</mtext>
            <mtext mathcolor="${COLORS.r}">${Number.isFinite(r) ? r.toFixed(1) + '%' : '\u2014'}</mtext>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main constant">
        = ${Number.isFinite(P) ? 'USD ' + P.toFixed(2) : 'Invalid'}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
}

/**
 * Constant Growth Model
 */
function renderGrowthEquation(inputs, result) {
  const container = document.querySelector('.formula-box.growth .equation-container');
  if (!container) return;

  const D0 = inputs.D0;
  const r = inputs.required;
  const g = inputs.gConst;
  const D1 = D0 * (1 + g / 100);
  const P = result.price;

  if (!isFinite(P)) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
        <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mrow>
            <msub>
              <mi mathcolor="${COLORS.P_growth}" mathvariant="bold">PV</mi>
              <mi>t</mi>
            </msub>
            <mo>=</mo>
            <mtext mathcolor="#ef4444" mathvariant="bold">Invalid</mtext>
          </mrow>
        </math>
        <div style="font-size:0.875rem;color:#ef4444;font-weight:600;">
          Invalid (g must be &lt; r)
        </div>
      </div>
    `;
    return;
  }

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.95em;">
        <mrow>
          <msub>
            <mi mathcolor="${COLORS.P_growth}" mathvariant="bold">PV</mi>
            <mi>t</mi>
          </msub>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mtext mathvariant="bold" mathcolor="${COLORS.D0}">USD ${Number.isFinite(D1) ? D1.toFixed(2) : '\u2014'}</mtext>
            <mrow>
              <mtext mathcolor="${COLORS.r}">${Number.isFinite(r) ? r.toFixed(1) + '%' : '\u2014'}</mtext>
              <mspace width="0.3em"/>
              <mo>&#x2212;</mo>
              <mspace width="0.3em"/>
              <mtext mathcolor="${COLORS.g}">${Number.isFinite(g) ? g.toFixed(1) + '%' : '\u2014'}</mtext>
            </mrow>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main growth">
        = USD ${P.toFixed(2)}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
}

/**
 * Changing Growth Model
 */
function renderChangingEquation(inputs, result) {
  const container = document.querySelector('.formula-box.changing .equation-container');
  if (!container) return;

  const D0 = inputs.D0;
  const r = inputs.required;
  const gShort = inputs.gShort;
  const gLong = inputs.gLong;
  const n = inputs.shortYears;
  const P = result.price;

  if (!isFinite(P)) {
    container.setAttribute(
      'aria-label',
      'Changing Dividend Growth Model equation: Invalid result. Please check that long-term growth rate is less than required return.'
    );
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
        <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mrow>
            <mi mathcolor="${COLORS.P_changing}" mathvariant="bold">P</mi>
            <mo>=</mo>
            <mtext mathcolor="#ef4444" mathvariant="bold">Invalid</mtext>
          </mrow>
        </math>
        <div style="font-size:0.875rem;color:#ef4444;font-weight:600;">
          Invalid calculation - check inputs
        </div>
      </div>
    `;
    return;
  }

  // Calculate components
  let pvHighGrowth = 0;
  for (let t = 1; t <= n; t++) {
    const div = D0 * Math.pow(1 + gShort / 100, t);
    pvHighGrowth += div / Math.pow(1 + r / 100, t);
  }

  const divAtN = D0 * Math.pow(1 + gShort / 100, n);
  const terminalDiv = divAtN * (1 + gLong / 100);
  const terminal = terminalDiv / (r / 100 - gLong / 100);
  const pvTerminal = terminal / Math.pow(1 + r / 100, n);

  container.setAttribute(
    'aria-label',
    `Changing Growth Model equation: Present value at time zero equals sum from i equals 1 to ${n} plus sum from j equals ${n} plus 1 to infinity, which equals ${pvHighGrowth.toFixed(2)} dollars from high growth period plus ${pvTerminal.toFixed(2)} dollars from terminal value, total ${P.toFixed(2)} dollars`
  );

  const mathML = `
    <div class="changing-equation-wrapper">
      <div class="changing-equation-scroll" tabindex="0" role="region" aria-label="Scrollable changing growth equation">
        <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:1.05em;">
          <mrow>
            <msub>
              <mi mathcolor="${COLORS.P_changing}" mathvariant="bold">PV</mi>
              <mn>0</mn>
            </msub>
            <mo>=</mo>

            <munderover>
              <mo>&#x2211;</mo>
              <mrow>
                <mi>i</mi>
                <mo>=</mo>
                <mn>1</mn>
              </mrow>
              <mn mathcolor="${COLORS.n}">${n}</mn>
            </munderover>
            <mfrac linethickness="1px">
              <mrow>
                <mtext mathvariant="bold" mathcolor="${COLORS.D0}">USD ${divAtN.toFixed(2)}</mtext>
                <msup>
                  <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.g}" mathsize="0.7em">${gShort.toFixed(1)}%</mtext><mo>)</mo></mrow>
                  <mi>i</mi>
                </msup>
              </mrow>
              <msup>
                <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.r}" mathsize="0.7em">${r.toFixed(1)}%</mtext><mo>)</mo></mrow>
                <mi>i</mi>
              </msup>
            </mfrac>

            <mspace width="0.3em"/>
            <mo>+</mo>
            <mspace width="0.3em"/>

            <munderover>
              <mo>&#x2211;</mo>
              <mrow><mi>j</mi><mo>=</mo><mrow><mn mathcolor="${COLORS.n}">${n}</mn><mo>+</mo><mn>1</mn></mrow></mrow>
              <mo>&#x221E;</mo>
            </munderover>
            <mfrac linethickness="1px">
              <mrow>
                <mtext mathvariant="bold" mathcolor="${COLORS.D0}">USD ${terminalDiv.toFixed(2)}</mtext>
                <msup>
                  <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.g}" mathsize="0.7em">${gLong.toFixed(1)}%</mtext><mo>)</mo></mrow>
                  <mi>j</mi>
                </msup>
              </mrow>
              <msup>
                <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.r}" mathsize="0.7em">${r.toFixed(1)}%</mtext><mo>)</mo></mrow>
                <mi>j</mi>
              </msup>
            </mfrac>
          </mrow>
        </math>
      </div>
      <div class="equation-breakdown">
        <span style="color:${COLORS.P_changing};font-weight:600;">USD ${pvHighGrowth.toFixed(2)}</span>
        <span style="color:#4b5563;"> (high growth) + </span>
        <span style="color:${COLORS.P_changing};font-weight:600;">USD ${pvTerminal.toFixed(2)}</span>
        <span style="color:#4b5563;"> (terminal)</span>
      </div>
      <div class="equation-result-main changing">
        = USD ${P.toFixed(2)}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
}