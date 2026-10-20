// Tool panel: live controls for the palette and behaviour of the whole sequence.
// Edits window.S (a live copy of window.DEFAULTS). main.js reads S every frame, so changes show immediately.
(function () {
  const clone = o => JSON.parse(JSON.stringify(o));
  window.S = clone(window.DEFAULTS);

  // slider ranges: [min, max, step]
  const RANGE = {
    plant: { pushSpeed: [0.05, 1, 0.01], creepBack: [0, 0.6, 0.01], moundHeight: [20, 90, 1] },
    water: { pourRate: [0.001, 0.012, 0.0005], tiltAngle: [0.3, 1.2, 0.05], sproutHeight: [80, 220, 5] },
    wake:  { openRate: [0.1, 1, 0.02], shyLimit: [3, 20, 0.5], petalCount: [5, 14, 1], bloomSize: [1, 2, 0.05] },
    mood:  { lampGlow: [0, 1, 0.01], vignette: [0, 1, 0.01], filmGrain: [0, 0.25, 0.005], inkWobble: [0.05, 0.6, 0.01], lineWeight: [0.5, 2.5, 0.05] },
  };
  const TITLES = { palette: 'Palette', plant: '1 · Plant', water: '2 · Water', wake: '3 · Wake', mood: 'Mood & texture' };
  const label = k => k.replace(/([A-Z])/g, ' $1').toLowerCase();

  const panel = document.createElement('aside');
  panel.id = 'panel';
  panel.innerHTML = `
    <header><span>GARDEN · TOOL PANEL</span><button id="pClose" aria-label="Hide panel">×</button></header>
    <div class="jump"><span>scene</span>
      <button data-go="plant">1</button><button data-go="water">2</button><button data-go="wake">3</button><button data-go="awake">end</button>
    </div>
    <div id="pBody"></div>
    <footer>
      <button id="pCopy">Copy settings</button>
      <button id="pRestore">Restore defaults</button>
    </footer>`;
  document.body.appendChild(panel);
  const body = panel.querySelector('#pBody');
  const inputs = [];

  for (const group of Object.keys(TITLES)) {
    const sec = document.createElement('details');
    sec.open = group === 'palette' || group === 'mood';
    sec.innerHTML = `<summary>${TITLES[group]}</summary>`;
    for (const key of Object.keys(window.S[group])) {
      const row = document.createElement('label');
      row.className = 'row';
      if (group === 'palette') {
        row.innerHTML = `<span class="sw"></span><span class="nm">${label(key)}</span><input type="color"><code></code>`;
        const inp = row.querySelector('input'), code = row.querySelector('code'), sw = row.querySelector('.sw');
        const sync = () => { inp.value = S[group][key]; code.textContent = S[group][key]; sw.style.background = S[group][key] };
        inp.oninput = () => { S[group][key] = inp.value; sync() };
        inputs.push(sync);
      } else {
        const [mn, mx, st] = RANGE[group][key];
        row.innerHTML = `<span class="nm">${label(key)}</span><input type="range" min="${mn}" max="${mx}" step="${st}"><code></code>`;
        const inp = row.querySelector('input'), code = row.querySelector('code');
        const sync = () => { inp.value = S[group][key]; code.textContent = (+S[group][key]).toString() };
        inp.oninput = () => { S[group][key] = +inp.value; sync() };
        inputs.push(sync);
      }
      sec.appendChild(row);
    }
    body.appendChild(sec);
  }
  const syncAll = () => inputs.forEach(f => f());
  syncAll();
  // apply a partial settings object (e.g. one pasted from Copy settings) and refresh the controls
  window.applySettings = o => { for (const g in o) Object.assign(S[g], o[g]); syncAll() };

  // Copy: the values plus the instruction to make them the saved defaults
  panel.querySelector('#pCopy').onclick = async e => {
    const text = 'Apply these values as the prototype\'s saved defaults in docs/settings.js (window.DEFAULTS). ' +
      'Keep the tool panel code as it is. Commit and push the change.\n\n' + JSON.stringify(S, null, 2);
    try { await navigator.clipboard.writeText(text) }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove() }
    e.target.textContent = 'Copied ✓'; setTimeout(() => e.target.textContent = 'Copy settings', 1400);
  };
  panel.querySelector('#pRestore').onclick = () => { window.S = clone(window.DEFAULTS); syncAll() };

  panel.querySelectorAll('[data-go]').forEach(b => b.onclick = () => window.garden && garden.jump(b.dataset.go));

  // visibility: PANEL_VISIBLE in settings.js, ?panel in the URL, or the P key
  const show = v => { panel.classList.toggle('on', v); document.body.classList.toggle('panel-on', v) };
  show(window.PANEL_VISIBLE || new URLSearchParams(location.search).has('panel'));
  panel.querySelector('#pClose').onclick = () => show(false);
  addEventListener('keydown', e => {
    if ((e.key === 'p' || e.key === 'P') && !/input|textarea/i.test(e.target.tagName)) show(!panel.classList.contains('on'));
  });
})();
