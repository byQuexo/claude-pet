import * as E from '../engine.js';
import { toCells, toMixed, toText, toSvg, packRows } from './screen.js';

const PANE = 'idlemon';
// Above the prompt the pane only grows as tall as it asks; the arena needs about this many rows.
const PANE_ROWS = 46;
const VIEWS = ['watch', 'gear', 'seed'];
const USAGE = 'usage: /idlemon [watch|gear|seed|status|gear on|off|mode full|minimal|compact]';

let pet = null;
let theater = null;
let frame = 0;
let shown = {};
let view = 'watch';
let stopAnim = null;
let writes = Promise.resolve();
let seen = '';
let bandId = null;
let beats = 0;

const cancel = (t) => (typeof t === 'function' ? t() : t && t.cancel());
const strip = (lines) => lines.map((l) => l.replace(E.ANSI_RE, '')).join('\n');

async function configDir($) {
  return (await $.env.get('CLAUDE_CONFIG_DIR')) || `${await $.env.get('HOME')}/.claude`;
}

// A save from the settings-hook version moves over once, with its display settings.
async function importLegacy($) {
  const dir = `${await configDir($)}/claude-pet`;
  try {
    const p = E.upgrade(JSON.parse(await $.fs.read(`${dir}/state.json`)));
    try {
      const { mode, gear } = JSON.parse(await $.fs.read(`${dir}/config.json`));
      await $.store.set('config', { ...(mode ? { mode } : {}), ...(gear === false ? { gear } : {}) });
    } catch {}
    p.log.push({ t: Date.now(), type: 'wake', text: `${p.name} moved into idlemon` });
    return p;
  } catch {
    return null;
  }
}

async function loadPet($) {
  const raw = await $.store.get('pet');
  return raw ? E.upgrade(raw) : null;
}

async function loadConfig($) {
  E.env.config = { sprite: true, ...((await $.store.get('config')) || {}) };
}

const signature = (p) => [p.stats.ticks, p.log.length, p.hp, p.xp, p.level, p.faint, p.gold, JSON.stringify(E.env.config)].join('|');
const petCells = () => packRows(toCells(E.petSprite(pet), E.STATUS_PET));

async function adopt($, p) {
  pet = p;
  if (!theater) theater = new E.Theater(p);
  else theater.feed(p);
  const sig = signature(p);
  if (sig !== seen) { seen = sig; $.ui.invalidate('ui.render'); return true; }
  return false;
}

// Only the pet's glint changes each second, so the band repaints its sprite cells instead of redrawing the card.
async function heartbeat($) {
  const p = await loadPet($);
  const changed = p ? await adopt($, p) : false;
  if (changed || !pet) return;
  if (++beats % 30 === 0) { $.ui.invalidate('ui.render'); return; }
  if (bandId) await $.ui.blit({ requestId: bandId, key: 'band-pet', cells: petCells() }).catch(() => {});
}

// Every session runs its own copy of this module and they share one store, so each tick re-reads the save first.
async function applyEvent($, ev) {
  const p = (await loadPet($)) || (await importLegacy($)) || E.newPet();
  E.applyHook(p, { ...ev, cwd: await $.session.cwd() });
  await $.store.set('pet', p);
  await adopt($, p);
}

function queue($, ev) {
  writes = writes.then(() => applyEvent($, ev)).catch(() => {});
  return writes;
}

async function setConfig($, key, value) {
  const cfg = { ...((await $.store.get('config')) || {}), [key]: value };
  await $.store.set('config', cfg);
  await loadConfig($);
  $.ui.invalidate('ui.render');
}

async function openPane($, next) {
  view = next;
  await $.ui.open({ id: PANE, title: 'idlemon', focus: true, closeOnEscape: true, rows: PANE_ROWS, columns: 116 });
  cancel(stopAnim);
  // Fights animate at full speed; between them only sparkles move, so a redraw a second is enough.
  stopAnim = $.clock.every(160, () => {
    frame++;
    if (!(theater && theater.busy) && frame % 6) return;
    shown = theater ? theater.next() : {};
    $.ui.invalidate('ui.render');
  });
}

function render(els, surface, lines, width, alt, key) {
  const cells = toCells(lines, width);
  if (surface === 'desktop') {
    const source = toSvg(cells);
    if (source.length <= 131072) return els.Svg({ source, alt });
    return toText(cells, els.Text, els.Box);
  }
  return toMixed(cells, els, key);
}

function bandTree($, e) {
  const els = $.ui.resolve(e);
  const width = e.props.bodyColumns;
  E.env.columns = width;
  const mode = E.statusMode(E.env.config);
  if (e.surface !== 'terminal' || mode === 'compact') {
    bandId = null;
    const lines = mode === 'compact' ? E.statusLines(pet) : mode === 'minimal' ? E.petSprite(pet) : E.spriteCard(pet);
    return render(els, e.surface, lines, width, `${pet.name}, level ${pet.level}`, 'band');
  }
  bandId = e.requestId;
  const sprite = els.Raster({ key: 'band-pet', columns: E.STATUS_PET, rows: E.petSprite(pet).length, cells: petCells() });
  if (mode === 'minimal') return els.Box({ flexDirection: 'row', justifyContent: 'flex-end', children: [sprite] });
  return els.Box({ flexDirection: 'row', columnGap: 2, children: [sprite, toMixed(toCells(E.cardLines(pet), width - E.STATUS_PET - 2), els, 'band')] });
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'idlemon', description: 'Watch your pet fight, check its gear and seed, or change how it shows', argumentHint: '[watch|gear|seed|status|mode <m>|gear on|off]', immediate: true });
    let p = await loadPet($);
    if (!p) {
      p = await importLegacy($);
      if (p) await $.store.set('pet', p);
    }
    await loadConfig($);
    if (p) await adopt($, p);
    $.clock.every(1000, () => { heartbeat($); });
    const settings = await $.settings.read();
    if (JSON.stringify(settings.hooks || {}).includes('pet.js')) await $.ui.toast('idlemon: the old claude-pet settings hooks are still installed, so every tool call ticks twice. Run `pet uninstall` to remove them.', { timeoutMs: 12000 });
    return next(e);
  });

  on('classic.SessionStart', async ($, e, next) => {
    queue($, { event: 'SessionStart' });
    return next(e);
  });

  on('tool.call', async ($, e, next) => {
    const r = await next(e);
    const { tool, tool_use_id, consent, ...input } = e;
    queue($, { event: r && r.isError ? 'PostToolUseFailure' : 'PostToolUse', tool, input });
    return r;
  });

  on('agent.spawn', async ($, e, next) => {
    queue($, { event: 'SubagentStart' });
    return next(e);
  });

  on('classic.Stop', async ($, e, next) => {
    queue($, { event: 'Stop' });
    return next(e);
  });

  on('command.run', { command: 'idlemon' }, async ($, e) => {
    const [cmd = 'watch', arg] = e.args.trim().split(/\s+/).filter(Boolean);
    if (cmd === 'gear' && (arg === 'on' || arg === 'off')) {
      await setConfig($, 'gear', arg === 'on');
      return { text: `gear on the pet: ${arg === 'on' ? 'shown' : 'hidden (still equipped and listed in the card)'}` };
    }
    if (cmd === 'mode') {
      if (!E.MODES.includes(arg)) return { text: `band mode: ${E.statusMode(E.env.config)} (${E.MODE_HELP})` };
      await setConfig($, 'mode', arg);
      return { text: `band mode: ${arg}` };
    }
    if (cmd === 'status') return { text: pet ? strip(E.statusLines(pet)) : E.NO_PET };
    if (VIEWS.includes(cmd)) {
      await openPane($, cmd);
      return {};
    }
    return { text: USAGE };
  });

  on('ui.close', async ($, e, next) => {
    if (e.id === PANE) { cancel(stopAnim); stopAnim = null; }
    return next(e);
  });

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!pet || e.props.hasSurvey) return next(e);
    const ours = bandTree($, e);
    // The band is shared, so what mods after this one draw stays below the pet.
    const theirs = await next(e);
    return theirs ? $.ui.resolve(e).Box({ flexDirection: 'column', children: [ours, theirs] }) : ours;
  });

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE) return next(e);
    const els = $.ui.resolve(e);
    const { Box, Button, Text } = els;
    if (!pet) return Text({ children: [E.NO_PET] });
    const width = e.props.bodyColumns;
    const rows = Math.max(20, (e.props.placement === 'dock' && e.props.scroll ? e.props.scroll.bodyRows : PANE_ROWS) - 1);
    E.env.columns = width;
    E.env.rows = rows;
    E.env.keys = 'esc close';
    const lines = view === 'gear' ? E.gearLines(pet, '/idlemon gear on|off') : view === 'seed' ? E.seedLines(pet) : E.draw(pet, shown, frame);
    const tab = (id, label, hotkey) => Button({ key: `view-${id}`, label, hotkey, plain: true, dimColor: view !== id, onPress: () => { view = id; $.ui.invalidate('ui.render'); } });
    return Box({
      flexDirection: 'column',
      children: [
        Box({
          flexDirection: 'row',
          columnGap: 3,
          children: [
            tab('watch', 'Watch', '1'), tab('gear', 'Gear', '2'), tab('seed', 'Seed', '3'),
            Button({ key: 'replay', label: 'Replay fight', hotkey: 'r', plain: true, onPress: () => { if (theater && pet) theater.replay(pet); view = 'watch'; } }),
            Button({ key: 'gear-toggle', label: E.env.config.gear === false ? 'Show gear' : 'Hide gear', hotkey: 'g', plain: true, onPress: () => setConfig($, 'gear', E.env.config.gear === false) }),
          ],
        }),
        render(els, e.surface, lines, width, `${pet.name}'s arena`, 'arena'),
      ],
    });
  });
}
