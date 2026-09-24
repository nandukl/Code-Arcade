/**
 * Code Arcade - Live Code Playground
 * Streams a simulated deployment pipeline into the terminal, line by line.
 * (Output is a scripted demo, not arbitrary code execution.)
 */
document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('btn-run-code');
  const out = document.getElementById('console-output');
  const status = document.getElementById('console-status');
  if (!runBtn || !out) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const idleLabel = runBtn.innerHTML;
  const runningLabel =
    '<svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg><span>Executing\u2026</span>';

  // [html, delay-before-line in ms]
  const script = [
    ['<span style="color:#38bdf8">[Code Arcade Runner v2.4.0]</span>', 0],
    ['> Initializing deployment pipeline\u2026', 320],
    ['> Installing dependencies\u2026', 380],
    ['> Compiling modules [target: production]\u2026', 420],
    ['> Running 128 tests\u2026', 380],
    ['<span style="color:#4ade80">\u2714 Build passed with 0 errors</span>', 360],
    ['', 120],
    ['<span style="color:#f8fafc;font-weight:600">Deployment successful!</span>', 200],
    ['<span style="color:#f8fafc">Project: Enterprise Digital Core</span>', 110],
    ['<span style="color:#f8fafc">Status:  Optimized &amp; Live \uD83D\uDE80</span>', 110],
    ['<span style="color:#f8fafc">Stack:   Next.js + TypeScript + Node.js</span>', 110],
    ['<span style="color:#f8fafc">Uptime:  99.98%  \u00B7  Latency: 24ms</span>', 110],
    ['', 120],
    ['<span style="color:#a7f3d0">\u2714 Process exited with status code 0</span>', 200]
  ];

  let running = false;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  runBtn.addEventListener('click', async () => {
    if (running) return;
    running = true;
    runBtn.disabled = true;
    runBtn.innerHTML = runningLabel;
    out.innerHTML = '';
    if (status) status.textContent = 'Running\u2026';
    const t0 = performance.now();

    for (const [html, delay] of script) {
      if (!reduce) await sleep(delay);
      const line = document.createElement('div');
      line.className = 'console-line';
      line.innerHTML = html || '&nbsp;';
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    }

    if (status) status.textContent = `Finished in ${((performance.now() - t0) / 1000).toFixed(1)}s (return code: 0)`;
    runBtn.innerHTML = idleLabel;
    runBtn.disabled = false;
    running = false;
  });
});
