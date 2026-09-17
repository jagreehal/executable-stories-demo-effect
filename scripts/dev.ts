import { watch } from 'node:fs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = resolve(root, 'reports/executable-stories.html');
const srcDir = resolve(root, 'src');
const reportsDir = resolve(root, 'reports');
const port = Number(process.env.PORT ?? 4311);

// SSE clients
const clients = new Set<ReadableStreamDefaultController>();

function sendReload(reason: string) {
  const payload = `event: reload\ndata: ${JSON.stringify({ reason })}\n\n`;
  const encoded = new TextEncoder().encode(payload);
  for (const ctrl of clients) {
    try { ctrl.enqueue(encoded); } catch { clients.delete(ctrl); }
  }
}

// Debounced vitest runner
let runTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;

function scheduleRun() {
  if (runTimer) clearTimeout(runTimer);
  runTimer = setTimeout(runVitest, 150);
}

async function runVitest() {
  if (running) { scheduleRun(); return; }
  running = true;
  console.log('\n[dev] Test file changed — running vitest...');
  const proc = Bun.spawn(['bun', 'run', 'test'], {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  await proc.exited;
  running = false;
  console.log('[dev] Vitest done.');
}

// Watch src/ for test file changes
watch(srcDir, { persistent: true, recursive: true }, (_type, filename) => {
  if (filename?.endsWith('.test.ts')) scheduleRun();
});

// Watch reports/ for HTML output — browser reload
watch(reportsDir, { persistent: true }, (_type, filename) => {
  if (filename === 'executable-stories.html' && existsSync(reportPath)) {
    sendReload('Report updated');
  }
});

function shellPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Executable Stories — Live</title>
  <style>
    :root { color-scheme: light; --bg: #f4efe8; --panel: rgba(255,252,247,0.92); --ink: #201812; --muted: #6b5b4f; --line: rgba(32,24,18,0.12); --accent: #bc4b2c; --accent-soft: rgba(188,75,44,0.12); }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Iowan Old Style", "Palatino Linotype", serif; color: var(--ink); background: radial-gradient(circle at top left, rgba(188,75,44,0.16), transparent 28%), radial-gradient(circle at top right, rgba(66,120,105,0.14), transparent 24%), linear-gradient(180deg,#f8f4ed 0%,var(--bg) 100%); }
    .shell { min-height: 100vh; display: grid; grid-template-rows: auto 1fr; }
    .toolbar { padding: 18px 22px; border-bottom: 1px solid var(--line); background: var(--panel); backdrop-filter: blur(14px); }
    .toolbar-row { display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: center; justify-content: space-between; }
    h1 { margin: 0; font-size: 22px; line-height: 1.1; }
    .meta { color: var(--muted); font-size: 14px; }
    .pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: var(--accent-soft); color: var(--ink); font-size: 13px; }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: #2a8f5b; box-shadow: 0 0 0 5px rgba(42,143,91,0.12); }
    iframe { width: 100%; height: 100%; border: 0; background: white; }
  </style>
</head>
<body>
  <div class="shell">
    <header class="toolbar">
      <div class="toolbar-row">
        <div>
          <h1>Executable Stories — Live</h1>
          <div class="meta">Save a <code>.story.test.ts</code> to trigger a run</div>
        </div>
        <div class="pill"><span class="dot"></span><span id="status">Connecting…</span></div>
        <div class="meta" id="stamp"></div>
      </div>
    </header>
    <iframe id="frame" src="/report?ts=${Date.now()}" title="Report"></iframe>
  </div>
  <script>
    const frame = document.getElementById('frame');
    const status = document.getElementById('status');
    const stamp = document.getElementById('stamp');
    const es = new EventSource('/events');
    es.addEventListener('connected', () => { status.textContent = 'Watching for changes'; });
    es.addEventListener('reload', e => {
      const { reason } = JSON.parse(e.data);
      const now = new Date();
      frame.src = '/report?ts=' + now.getTime();
      status.textContent = reason;
      stamp.textContent = 'Reloaded at ' + now.toLocaleTimeString();
    });
    es.onerror = () => { status.textContent = 'Reconnecting…'; };
  </script>
</body>
</html>`;
}

Bun.serve({
  port,
  hostname: '127.0.0.1',
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/events') {
      let ctrl: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(c) {
          ctrl = c;
          clients.add(ctrl);
          ctrl.enqueue(new TextEncoder().encode('event: connected\ndata: {}\n\n'));
          req.signal.addEventListener('abort', () => clients.delete(ctrl));
        },
      });
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    }

    if (url.pathname === '/report') {
      if (!existsSync(reportPath)) {
        return new Response(
          '<h1>No report yet</h1><p>Save a <code>.story.test.ts</code> file to generate one.</p>',
          { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        );
      }
      return new Response(readFileSync(reportPath), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    return new Response(shellPage(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  },
});

console.log(`[dev] Live server: http://127.0.0.1:${port}`);
console.log(`[dev] Watching: ${srcDir}`);

// Run once on start so there's something to view immediately
runVitest();
