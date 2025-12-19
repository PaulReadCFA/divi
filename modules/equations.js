/**
 * equations.js - Dynamic Equation Rendering
 * Displays equations with numeric values substituted
 */
import { $ } from './utils.js';

const COLORS = {
  P_constant: '#3c6ae5',
  P_growth: '#15803d',
  P_changing: '#7a46ff',
  D0: '#b95b1d',
  r: '#733599',
  g: '#15803d',
  n: '#0079a6'
};

/**
 * Render all three equations with current input values
 *
 * NOTE: this file assumes percent-style inputs for rates (e.g. 8 for 8%).
 * The calculations object you pass in should be computed consistently
 * (i.e. any r/g conversion to decimals happens in the calculation step).
 */
export function renderEquations(inputs, calculations) {
  renderConstantEquation(inputs, calculations.constant);
  renderGrowthEquation(inputs, calculations.growth);
  renderChangingEquation(inputs, calculations.changing);
}

/**
 * Constant Dividend Model: P = Dâ‚€ / r
 *
 * NOTE: inputs.required is expected to be a percent number (e.g. 8 for 8%).
 * For clarity in the aria label we show both the percent and the decimal used.
 */
function renderConstantEquation(inputs, result) {
  const container = document.querySelector('.formula-box.constant .equation-container');
  if (!container) return;

  const D0 = inputs.D0;
  const r = inputs.required; // percent, e.g. 8
  const rDecimal = (Number.isFinite(r) ? r / 100 : NaN);
  const P = result.price;

  // Update aria-label with actual values (show percent and decimal used)
  container.setAttribute(
    'aria-label',
    `Constant Dividend Model equation: Price equals ${D0} dollars divided by ${r.toFixed(
      1
    )} percent (i.e. ${Number.isFinite(rDecimal) ? rDecimal.toFixed(4) : 'invalid'}) which equals ${Number.isFinite(P) ? P.toFixed(
      2
    ) : 'invalid'} dollars`
  );

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.95em;">
        <mrow>
          <mi mathcolor="${COLORS.P_constant}" mathvariant="bold">P</mi>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mtext mathvariant="bold" mathcolor="${COLORS.D0}">$${Number.isFinite(D0) ? D0.toFixed(2) : 'â€“'}</mtext>
            <mtext mathcolor="${COLORS.r}">${Number.isFinite(r) ? r.toFixed(1) + '%' : 'â€“'}</mtext>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main constant">
        = ${Number.isFinite(P) ? '$' + P.toFixed(2) : 'Invalid'}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
}

/**
 * Constant Growth Model: PV_t = Dâ‚ / (r - g) = Dâ‚€(1+g) / (r - g)
 *
 * NOTE: inputs.gConst and inputs.required are percent numbers (e.g. 3, 8).
 * D1 is computed from D0 * (1 + g/100) for display.
 */
function renderGrowthEquation(inputs, result) {
  const container = document.querySelector('.formula-box.growth .equation-container');
  if (!container) return;

  const D0 = inputs.D0;
  const r = inputs.required; // percent
  const g = inputs.gConst; // percent
  const D1 = D0 * (1 + g / 100);
  const P = result.price;

  if (!isFinite(P)) {
    container.setAttribute(
      'aria-label',
      `Constant Growth Model equation: Invalid result. Growth rate ${g} percent must be less than required return ${r} percent`
    );
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
        <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mrow>
            <msub>
              <mi mathcolor="${COLORS.P_growth}" mathvariant="bold">PV</mi>
              <mi mathcolor="${COLORS.P_growth}" mathvariant="italic">t</mi>
            </msub>
            <mo>=</mo>
            <mfrac linethickness="1.2px">
              <mtext mathvariant="bold" mathcolor="${COLORS.D0}">$${Number.isFinite(D1) ? D1.toFixed(2) : 'â€“'}</mtext>
              <mrow>
                <mtext mathcolor="${COLORS.r}">${Number.isFinite(r) ? r.toFixed(1) + '%' : 'â€“'}</mtext>
                <mspace width="0.3em"/>
                <mo>−</mo>
                <mspace width="0.3em"/>
                <mtext mathcolor="${COLORS.g}">${Number.isFinite(g) ? g.toFixed(1) + '%' : 'â€“'}</mtext>
              </mrow>
            </mfrac>
          </mrow>
        </math>
        <div style="font-size:0.875rem;color:#ef4444;font-weight:600;">
          Invalid (g must be &lt; r)
        </div>
      </div>
    `;
    return;
  }

  container.setAttribute(
    'aria-label',
    `Constant Growth Model equation: Present value at time t equals dividend one of ${D1.toFixed(
      2
    )} dollars divided by required return ${r.toFixed(1)} percent minus growth rate ${g.toFixed(
      1
    )} percent, which equals ${P.toFixed(2)} dollars`
  );

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.95em;">
        <mrow>
          <msub>
            <mi mathcolor="${COLORS.P_growth}" mathvariant="bold">PV</mi>
            <mi mathcolor="${COLORS.P_growth}" mathvariant="italic">t</mi>
          </msub>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mtext mathvariant="bold" mathcolor="${COLORS.D0}">$${Number.isFinite(D1) ? D1.toFixed(2) : 'â€“'}</mtext>
            <mrow>
              <mtext mathcolor="${COLORS.r}">${Number.isFinite(r) ? r.toFixed(1) + '%' : 'â€“'}</mtext>
              <mspace width="0.3em"/>
              <mo>−</mo>
              <mspace width="0.3em"/>
              <mtext mathcolor="${COLORS.g}">${Number.isFinite(g) ? g.toFixed(1) + '%' : 'â€“'}</mtext>
            </mrow>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main growth">
        = $${P.toFixed(2)}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
}

/**
 * Changing Growth Model: P = Î£ PV(high growth) + PV(terminal)
 * Full summation notation with actual values
 *
 * Fixes applied:
 * - The under/over operators use ∑ (sum) rather than a minus sign which was present before.
 * - We compute pvHighGrowth and pvTerminal for textual breakdown (these mirror your calculations).
 *
 * NOTE: inputs.gShort, gLong and required are percent numbers (e.g. 20, 4, 10).
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
      `Changing Growth Model equation: Invalid result. Long-term growth rate ${gLong} percent must be less than required return ${r} percent`
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
          Invalid (g<sub>l</sub> must be &lt; r)
        </div>
      </div>
    `;
    return;
  }

  // Calculate the two components (same as calculations.js)
  let pvHighGrowth = 0;
  for (let t = 1; t <= n; t++) {
    const div = D0 * Math.pow(1 + gShort / 100, t);
    pvHighGrowth += div / Math.pow(1 + r / 100, t);
  }

  const terminalDiv = D0 * Math.pow(1 + gShort / 100, n) * (1 + gLong / 100);
  const terminal = terminalDiv / (r / 100 - gLong / 100);
  const pvTerminal = terminal / Math.pow(1 + r / 100, n);

  // Update aria-label with actual values
  container.setAttribute(
    'aria-label',
    `Changing Growth Model equation: Present value equals ${pvHighGrowth.toFixed(
      2
    )} dollars from high growth period plus ${pvTerminal.toFixed(
      2
    )} dollars from terminal value, which equals ${P.toFixed(2)} dollars`
  );

  const mathML = `
    <div class="changing-equation-wrapper">
      <div class="changing-equation-scroll">
        <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:1.05em;">
          <mrow>
            <msub>
              <mi mathcolor="${COLORS.P_changing}" mathvariant="bold">PV</mi>
              <mn mathcolor="${COLORS.P_changing}">0</mn>
            </msub>
            <mo>=</mo>

            <!-- FIXED: use ∑ (summation) instead of a minus sign -->
            <munderover>
              <mo>∑</mo>
              <mrow>
                <mi>t</mi>
                <mo>=</mo>
                <mn>1</mn>
              </mrow>
              <mn mathcolor="${COLORS.n}">${n}</mn>
            </munderover>
            <mfrac linethickness="1px">
              <mrow>
                <msub>
                  <mi mathcolor="${COLORS.D0}">D</mi>
                  <mn mathcolor="${COLORS.D0}">0</mn>
                </msub>
                <msup>
                  <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.g}" mathsize="0.7em">${gShort.toFixed(
                    1
                  )}%</mtext><mo>)</mo></mrow>
                  <mi mathcolor="${COLORS.n}">t</mi>
                </msup>
              </mrow>
              <msup>
                <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.r}" mathsize="0.7em">${r.toFixed(
                  1
                )}%</mtext><mo>)</mo></mrow>
                <mi mathcolor="${COLORS.n}">t</mi>
              </msup>
            </mfrac>

            <mspace width="0.3em"/>
            <mo>+</mo>
            <mspace width="0.3em"/>


            <!-- FIXED: use ∑ (summation) instead of a minus sign -->
            <munderover>
              <mo>∑</mo>
              <mrow><mi mathcolor="${COLORS.n}">t</mi><mo>=</mo><mrow><mi mathcolor="${COLORS.n}">${n}</mi><mo>+</mo><mn>1</mn></mrow></mrow>
              <mo>∞</mo>
            </munderover>
            <mfrac linethickness="1px">
              <mrow>
                <msub>
                  <mi mathcolor="${COLORS.D0}">D</mi>
                  <mrow><mn mathcolor="${COLORS.n}">${n}</mn><mo>+</mo><mn>1</mn></mrow>
                </msub>
                <msup>
                  <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.g}" mathsize="0.7em">${gLong.toFixed(
                    1
                  )}%</mtext><mo>)</mo></mrow>
                  <mi mathcolor="${COLORS.n}">t</mi>
                </msup>
              </mrow>
              <msup>
                <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mtext mathcolor="${COLORS.r}" mathsize="0.7em">${r.toFixed(
                  1
                )}%</mtext><mo>)</mo></mrow>
                <mi mathcolor="${COLORS.n}">t</mi>
              </msup>
            </mfrac>
          </mrow>
        </math>
      </div>
      <div class="equation-breakdown">
        <span style="color:${COLORS.P_changing};font-weight:600;">$${pvHighGrowth.toFixed(2)}</span>
        <span style="color:#4b5563;"> (high growth) + </span>
        <span style="color:${COLORS.P_changing};font-weight:600;">$${pvTerminal.toFixed(2)}</span>
        <span style="color:#4b5563;"> (terminal)</span>
      </div>
      <div class="equation-result-main changing">
        = $${P.toFixed(2)}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
}