#!/usr/bin/env node
// The CLI host for Claude Code without mods: settings hooks feed ticks, the statusline wraps the user's own.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as E from './engine.js';

const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const HOME = process.env.CLAUDE_PET_HOME || path.join(CLAUDE_DIR, 'claude-pet');
const STATE = path.join(HOME, 'state.json');
const LOCK = STATE + '.lock';
const CONFIG = path.join(HOME, 'config.json');
const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');

function loadConfig() {
  try { return { sprite: true, ...JSON.parse(fs.readFileSync(CONFIG, 'utf8')) }; } catch { return { sprite: true }; }
}

function setConfig(key, value) {
  fs.mkdirSync(HOME, { recursive: true });
  fs.writeFileSync(CONFIG, JSON.stringify({ ...loadConfig(), [key]: value }));
  E.env.config = loadConfig();
}

E.env.config = loadConfig();
E.env.columns = process.stdout.columns || parseInt(process.env.COLUMNS, 10) || 80;
E.env.rows = process.stdout.rows || 24;
try { E.overrideSecret(JSON.parse(fs.readFileSync(path.join(HOME, 'secret-boss.json'), 'utf8'))); } catch {}

function load() {
  try { return E.upgrade(JSON.parse(fs.readFileSync(STATE, 'utf8'))); } catch { return null; }
}

function save(p) {
  fs.mkdirSync(HOME, { recursive: true });
  const tmp = `${STATE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(p));
  fs.renameSync(tmp, STATE);
}

function withLock(fn) {
  fs.mkdirSync(HOME, { recursive: true });
  const deadline = Date.now() + 3000;
  for (;;) {
    try { fs.mkdirSync(LOCK); break; } catch {
      try { if (Date.now() - fs.statSync(LOCK).mtimeMs > 5000) fs.rmdirSync(LOCK); } catch {}
      if (Date.now() > deadline) return;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
  try {
    const p = load() || E.newPet();
    fn(p);
    save(p);
  } finally {
    try { fs.rmdirSync(LOCK); } catch {}
  }
}

function hook() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch {}
  withLock((p) => E.applyHook(p, { event: input.hook_event_name, tool: input.tool_name || '', input: input.tool_input, cwd: input.cwd }));
}

function statusline() {
  let input = '';
  try { input = fs.readFileSync(0, 'utf8'); } catch {}
  const cfg = loadConfig();
  const inner = cfg.inner ? runInner(cfg.inner, input) : '';
  const innerLines = inner ? inner.replace(/\n$/, '').split('\n') : [];
  const p = load();
  const mode = E.statusMode(cfg);
  if (!p) {
    process.stdout.write([...innerLines, `🥚 ${E.color('#888888', 'a pet egg will appear after your next tool call')}`].join('\n') + '\n');
    return;
  }
  const lines = mode === 'minimal' ? E.besideRight(innerLines, E.petSprite(p), cfg) : [...innerLines, ...(mode === 'compact' ? E.statusLines(p) : E.spriteCard(p))];
  process.stdout.write(lines.join('\n') + '\n');
}

// The 1s refresh would otherwise re-run the wrapped statusline every second even when nothing it shows changed.
function runInner(command, input) {
  let key = '', session = 'default';
  try {
    const j = JSON.parse(input);
    session = String(j.session_id || 'default').replace(/[^\w-]/g, '').slice(0, 64);
    if (j.cost) { delete j.cost.total_duration_ms; delete j.cost.total_api_duration_ms; }
    key = createHash('sha1').update(command + JSON.stringify(j)).digest('hex');
  } catch {}
  const file = path.join(HOME, `inner-${session}.json`);
  try {
    const c = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (key && c.key === key && Date.now() - c.t < 10000) return c.out;
  } catch {}
  let out = '';
  try { out = execFileSync('/bin/sh', ['-c', command], { input, encoding: 'utf8', timeout: 4000, stdio: ['pipe', 'pipe', 'ignore'] }); } catch (e) { out = e.stdout || ''; }
  try {
    fs.mkdirSync(HOME, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ key, t: Date.now(), out }));
    if (Math.random() < 0.02) for (const f of fs.readdirSync(HOME)) if (/^inner-.*\.json$/.test(f) && Date.now() - fs.statSync(path.join(HOME, f)).mtimeMs > 86400000) fs.rmSync(path.join(HOME, f), { force: true });
  } catch {}
  return out;
}

function watch() {
  const out = process.stdout;
  out.write('\x1b[?1049h\x1b[?25l\x1b[2J');
  process.on('exit', () => out.write(`${E.RESET}\x1b[?25h\x1b[?1049l`));
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(0));
  out.on('resize', () => { E.env.columns = out.columns; E.env.rows = out.rows; out.write('\x1b[2J'); });

  let p = load() || E.newPet(), mtime = 0, frame = 0;
  const theater = new E.Theater(p);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.on('exit', () => { try { process.stdin.setRawMode(false); } catch {} });
    process.stdin.on('data', (d) => {
      const k = d.toString();
      if (k === 'q' || k === '\u0003') process.exit(0);
      if (k === 'g') setConfig('gear', loadConfig().gear === false);
      if (k === 'r') theater.replay(p);
    });
  }
  setInterval(() => {
    if (frame % 3 === 0) {
      try {
        const m = fs.statSync(STATE).mtimeMs;
        if (m !== mtime) { mtime = m; p = load() || p; theater.feed(p); }
      } catch {}
    }
    frame++;
    const lines = E.draw(p, theater.next(), frame);
    out.write('\x1b[H' + lines.map((l) => l + E.RESET + '\x1b[K').join('\n') + '\x1b[J');
  }, 160);
}

const HOOK_EVENTS = ['PostToolUse', 'PostToolUseFailure', 'SubagentStart', 'Stop', 'SessionStart'];
const isOurs = (c, sub) => typeof c === 'string' && /pet\.js"?\s+/.test(c) && c.trim().endsWith(sub);

function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
}

function writeSettings(settings) {
  const tmp = `${SETTINGS}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2) + '\n');
  fs.renameSync(tmp, SETTINGS);
}

function stripHooks(settings) {
  for (const ev of HOOK_EVENTS) {
    const groups = (settings.hooks && settings.hooks[ev]) || [];
    const kept = groups.map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !isOurs(h.command, 'hook')) })).filter((g) => g.hooks.length);
    if (settings.hooks) { if (kept.length) settings.hooks[ev] = kept; else delete settings.hooks[ev]; }
  }
}

function install() {
  const settings = readSettings();
  if (fs.existsSync(SETTINGS)) fs.copyFileSync(SETTINGS, `${SETTINGS}.claude-pet-backup`);
  const script = fs.realpathSync(fileURLToPath(import.meta.url));
  const run = (sub) => `"${process.execPath}" "${script}" ${sub}`;
  stripHooks(settings);
  settings.hooks = settings.hooks || {};
  for (const ev of HOOK_EVENTS) (settings.hooks[ev] ||= []).push({ matcher: '', hooks: [{ type: 'command', command: run('hook'), timeout: 5, async: true }] });
  const cur = settings.statusLine;
  if (cur && cur.command && !isOurs(cur.command, 'statusline')) setConfig('inner', cur.command);
  settings.statusLine = { ...(cur || {}), type: 'command', command: run('statusline'), refreshInterval: 1 };
  writeSettings(settings);
  console.log(`idlemon installed into ${SETTINGS}${cur && cur.command && !isOurs(cur.command, 'statusline') ? ' (your existing statusline is kept above the pet)' : ''}.`);
  console.log('Start a new Claude Code session; your egg appears after the first tool call. Run `pet watch` in a split for the animated view.');
}

function uninstall() {
  const settings = readSettings();
  stripHooks(settings);
  const cfg = loadConfig();
  if (settings.statusLine && isOurs(settings.statusLine.command, 'statusline')) {
    if (cfg.inner) { settings.statusLine.command = cfg.inner; delete settings.statusLine.refreshInterval; } else delete settings.statusLine;
  }
  writeSettings(settings);
  console.log(`idlemon's hooks and statusline removed from ${SETTINGS}. Your pet's save stays in ${HOME} (delete it to start over).`);
}

const print = (lines) => console.log(lines.join('\n'));
const withPet = (fn) => { const p = load(); if (!p) return console.log(E.NO_PET); fn(p); };

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'hook') hook();
  else if (cmd === 'statusline') statusline();
  else if (cmd === 'watch' || !cmd) watch();
  else if (cmd === 'status') withPet((p) => print(E.statusOnce(p)));
  else if (cmd === 'seed') withPet((p) => print(E.seedLines(p)));
  else if (cmd === 'sim') { let line = ''; withLock((p) => { line = E.simulate(p, parseInt(args[0] || '100', 10), args[1]); }); console.log(line); }
  else if (cmd === 'mode') {
    if (E.MODES.includes(args[0])) setConfig('mode', args[0]);
    else if (args[0]) { console.log(`unknown mode "${args[0]}" — use ${E.MODES.join(', ')}`); process.exitCode = 1; }
    console.log(`statusline mode: ${E.statusMode(loadConfig())}  (${E.MODE_HELP})`);
  }
  else if (cmd === 'gear') {
    if (args[0] === 'on' || args[0] === 'off') {
      setConfig('gear', args[0] === 'on');
      console.log(`gear on the pet: ${loadConfig().gear === false ? 'hidden (still equipped and listed in the card)' : 'shown'}`);
    } else withPet((p) => print(E.gearLines(p)));
  }
  else if (cmd === 'sprite') { setConfig('mode', args[0] === 'off' ? 'compact' : 'full'); console.log(`statusline mode: ${E.statusMode(loadConfig())}`); }
  else if (cmd === 'width') {
    setConfig('width', args[0] && args[0] !== 'auto' ? parseInt(args[0], 10) : undefined);
    console.log(`statusline width: ${loadConfig().width || `auto (COLUMNS=${process.env.COLUMNS || 'unset'}, else 80)`}`);
  }
  else if (cmd === 'install') install();
  else if (cmd === 'uninstall') uninstall();
  else if (cmd === 'reset') { fs.rmSync(STATE, { force: true }); console.log('Pet released into the wild.'); }
  else console.log('usage: pet [watch|status|seed|gear [on|off]|mode full|minimal|compact|width <n|auto>|install|uninstall|sim <n> [bucket]|reset]');
} catch (e) {
  if (cmd !== 'hook' && cmd !== 'statusline') throw e;
}
