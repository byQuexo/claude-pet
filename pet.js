#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HOME = process.env.CLAUDE_PET_HOME || path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'claude-pet');
const STATE = path.join(HOME, 'state.json');
const LOCK = STATE + '.lock';
const CONFIG = path.join(HOME, 'config.json');
const SETTINGS = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'settings.json');

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;


const ART = {
  egg: [
    '................',
    '................',
    '......oooo......',
    '.....obbbbo.....',
    '....obhbbbbo....',
    '...obhbbsbbbo...',
    '...obbbbbbbbo...',
    '..obbsbbbbbbbo..',
    '..obbbbbbsbbbo..',
    '..obbbbbbbbbbo..',
    '..obsbbbbbbbbo..',
    '...obbbbbsbbo...',
    '...obbbbbbbbo...',
    '....obbbbbbo....',
    '.....oooooo.....',
    '................',
  ],
  hatchling: [
    '................',
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obhbbbbbbbbo..',
    '..obbwebbbwebo..',
    '.obbbeebbbeebbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbmmbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '..obboooooobbo..',
    '...oo......oo...',
    '................',
  ],
  beast: [
    '................',
    '................',
    '................',
    '....oooooooo....',
    '...obbbbbbbbo...',
    '..obhbbbbbbbbo..',
    '..obwebbbbwebo..',
    '..obeebbbbeebo..',
    '..obbbbmmbbbbo..',
    '...obbbbbbbbo...',
    '..oobbbbbbbboo..',
    '..obbccccccbbo..',
    '.oobbccccccbboo.',
    '..obbbccccbbbo..',
    '..obbo....obbo..',
    '..oooo....oooo..',
  ],
  slime: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......oooo......',
    '....oobbbboo....',
    '...obhbbbbbbo...',
    '..obhbbbbbbbbo..',
    '..obbebbbbebbo..',
    '.obbbebbbbebbbo.',
    '.obbbbbmmbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..oobbbbbbbboo..',
    '....oooooooo....',
    '................',
  ],
  ghost: [
    '................',
    '................',
    '.....oooooo.....',
    '....obbbbbbo....',
    '...obhbbbbbbo...',
    '..obhbbbbbbbbo..',
    '..obeebbbbeebo..',
    '..obeebbbbeebo..',
    '..obbbbmmbbbbo..',
    '..obbbbmmbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obobbobbobbo..',
    '..oo.oo.oo.ooo..',
    '................',
  ],
  bug: [
    '................',
    '................',
    '................',
    '.....k....k.....',
    '......k..k......',
    '.....oooooo.....',
    '....oeboobeo....',
    '...oooooooooo...',
    'kk.obhboobhbo.kk',
    '.k.obbboobbbo.k.',
    'kk.obbboobbbo.kk',
    '.k.obbboobbbo.k.',
    '...obbboobbbo...',
    '....obboobbo....',
    '.....oooooo.....',
    '................',
  ],
  anvil: [
    '................',
    '................',
    '................',
    '................',
    '.ooooooooooooo..',
    'obhhhhhhhhhhhbo.',
    '.obbbbbbbbbbbo..',
    '...oobbbbbboo...',
    '.....obbbbo.....',
    '.....obbbbo.....',
    '....obbbbbbo....',
    '...obbbbbbbbo...',
    '...oooooooooo...',
    '................',
    '................',
    '................',
  ],
  chest: [
    '................',
    '................',
    '................',
    '................',
    '..oooooooooooo..',
    '.obbbbbbbbbbbbo.',
    '.obhhhhhhhhhhbo.',
    '.oooooolloooooo.',
    '.obbbbbllbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obhbbbbbbbbhbo.',
    '.obbbbbbbbbbbbo.',
    '.oooooooooooooo.',
    '................',
    '................',
    '................',
  ],
  chestOpen: [
    '................',
    '..oooooooooooo..',
    '.obhhhhhhhhhhbo.',
    '.oooooooooooooo.',
    '....y..yy..y....',
    '..y..yyyyyy..y..',
    '.oyyyyyyyyyyyyo.',
    '.oooooolloooooo.',
    '.obbbbbllbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obhbbbbbbbbhbo.',
    '.obbbbbbbbbbbbo.',
    '.oooooooooooooo.',
    '................',
    '................',
    '................',
  ],
  boss: [
    '..oooooooooooo..',
    '..obbbbbbbbbbo..',
    '..obhhbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obeeebbeeebo..',
    '..obeeebbeeebo..',
    '..obbbbbbbbbbo..',
    '..obmmmmmmmmbo..',
    '..obmbmbmbmbbo..',
    '..obbbbbbbbbbo..',
    'oooobbbbbbbboooo',
    'obbobbbbbbbbobbo',
    'obbobbbbbbbbobbo',
    'oooobbbbbbbboooo',
    '...obbo..obbo...',
    '...oooo..oooo...',
  ],
};

const mirror = (pts) => pts.concat(pts.map(([r, c]) => [r, 15 - c]));
const layer = (ch, pts, under = false) => ({ ch, pts, under });

const ACCESSORY = {
  shell: [
    layer('k', mirror([[0, 3], [1, 4], [2, 4], [2, 5]])),
    layer('t', [[11, 6], [12, 7], [13, 6], [13, 8], [13, 9]]),
  ],
  edit: [
    layer('q', [[1, 15], [2, 14], [2, 15], [3, 14], [3, 15], [4, 14]]),
    layer('k', [[5, 14], [6, 14], [7, 14], [8, 14], [9, 14], [10, 14], [11, 14]]),
  ],
  read: [
    layer('k', mirror([[5, 3], [5, 4], [5, 5], [5, 6], [8, 3], [8, 4], [8, 5], [8, 6], [6, 3], [7, 3], [6, 6], [7, 6], [6, 7]])),
    layer('o', mirror([[1, 4], [2, 4], [2, 5]])),
  ],
  fail: [
    layer('r', mirror([[0, 3], [1, 3], [1, 4], [2, 4], [2, 5]])),
    layer('r', [[13, 14], [12, 15], [11, 15], [10, 14], [10, 15], [9, 15]]),
    layer('o', mirror([[5, 4], [5, 5]])),
  ],
  agent: [
    layer('k', mirror([[1, 5], [2, 6]])),
    layer('y', mirror([[0, 4]])),
    layer('y', [[6, 0], [10, 15]], true),
  ],
};

const CROWN = layer('g', [
  [0, 4], [0, 7], [0, 8], [0, 11],
  [1, 4], [1, 5], [1, 7], [1, 8], [1, 10], [1, 11],
  [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11],
]);
const WINGS = layer('x', mirror([[4, 0], [5, 0], [5, 1], [6, 0], [6, 1], [6, 2], [7, 0], [7, 1], [7, 2], [8, 1], [8, 2], [9, 1]]), true);
const col = (c, from, to) => Array.from({ length: to - from + 1 }, (_, i) => [from + i, c]);
const WEAPON_ART = {
  sword: [layer('W', col(0, 3, 9)), layer('H', [[10, 0], [10, 1]]), layer('G', [[11, 0], [12, 0]])],
  axe: [layer('G', col(0, 3, 12)), layer('W', [[3, 1], [4, 1], [5, 1], [4, 2]])],
  dagger: [layer('W', [[8, 0], [9, 0], [10, 0]]), layer('H', [[11, 0], [11, 1]]), layer('G', [[12, 0]])],
  staff: [layer('G', col(0, 4, 13)), layer('W', [[2, 0], [2, 1], [3, 0], [3, 1]])],
};
const HELMET = [
  null,
  layer('M', [[3, 6], [3, 7], [3, 8], [3, 9], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10]]),
  layer('M', [[2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 11]]),
];
const BOOTS = [
  null,
  layer('B', mirror([[13, 3], [13, 4], [14, 3], [14, 4]])),
  layer('B', mirror([[14, 2], [14, 3], [14, 4], [14, 5], [15, 2], [15, 3], [15, 4], [15, 5]])),
];
const SCARF = layer('A', [[12, 3], [12, 4], [12, 5], [12, 6], [12, 7], [12, 8], [12, 9], [12, 10], [12, 11], [12, 12]]);
const SPARKLE = layer('S', [[0, 1], [1, 0], [1, 2], [2, 1]], true);

const BASE_PAL = {
  o: '#2b1d2e', b: '#f2a65a', h: '#ffd8a8', c: '#ffe8c2', w: '#ffffff', e: '#1a1a2e',
  m: '#b5523b', s: '#c97b3a', k: '#5c4033', q: '#f5f5f5', t: '#39ff14', r: '#4a0e0e',
  y: '#ffe66d', g: '#ffd700', x: '#9ad1ff', H: '#d4af37', G: '#8b5a2b',
};

const BRANCHES = {
  shell: {
    bucket: 'bash', forms: ['Shell Drake', 'Elder Shell Wyrm'], emoji: '🐉',
    pal: { b: '#3a7d44', h: '#6fbf73', c: '#c7f2a4', k: '#e0e0e0', x: '#2e5939' },
    bonus: (s) => { s.atk *= 1.25; },
  },
  edit: {
    bucket: 'edit', forms: ['Quill Golem', 'Titan Scribe'], emoji: '🗿',
    pal: { b: '#8d99ae', h: '#c0c7d4', c: '#edf2f4', k: '#6b4226', x: '#b8c4d6' },
    bonus: (s) => { s.def *= 1.4; s.maxHp *= 1.15; },
  },
  read: {
    bucket: 'read', forms: ['Grep Owl', 'Archive Seraph'], emoji: '🦉',
    pal: { b: '#7b5ea7', h: '#b39ddb', c: '#e8dcff', k: '#222233', x: '#5e4a8a' },
    bonus: (s) => { s.crit += 0.15; },
  },
  fail: {
    bucket: 'fail', forms: ['Chaos Imp', 'Chaos Archfiend'], emoji: '😈',
    pal: { b: '#c0392b', h: '#ff7961', c: '#ffb199', e: '#ffeb3b', x: '#6b0f1a' },
    bonus: (s) => { s.atk *= 1.35; s.crit += 0.08; s.def *= 0.8; },
  },
  agent: {
    bucket: 'agent', forms: ['Hive Wisp', 'Swarm Sovereign'], emoji: '🐝',
    pal: { b: '#2ec4b6', h: '#9ff3e9', c: '#e0fbfc', k: '#1b4965', x: '#cbf3f0' },
    bonus: (s) => { s.multi += 0.25; s.spd *= 1.3; },
  },
};
const BRANCH_OF_BUCKET = Object.fromEntries(Object.entries(BRANCHES).map(([k, v]) => [v.bucket, k]));

const MONSTERS = {
  slime: {
    names: ['Merge Conflict Slime', 'Spaghetti Ooze', 'Memory Leak Blob'], hp: 1.1, atk: 0.9, def: 0.8, spd: 0.8,
    weak: 'fire', resist: 'poison', attack: null, proc: 0, evade: 0.02,
    pals: [
      { o: '#1f3b2c', b: '#7bd389', h: '#c4f1be', e: '#111111', m: '#2d6a4f' },
      { o: '#2d1b3d', b: '#a06cd5', h: '#d7b8f3', e: '#111111', m: '#5a2a82' },
      { o: '#3d2614', b: '#f4a259', h: '#ffd6a5', e: '#111111', m: '#9c4a1a' },
    ],
  },
  ghost: {
    names: ['Null Pointer Wraith', 'Heisenbug Phantom', 'Zombie Process'], hp: 0.85, atk: 1.15, def: 0.6, spd: 1.2,
    weak: 'lightning', resist: 'frost', attack: 'frost', proc: 0.15, evade: 0.1,
    pals: [
      { o: '#4a4a6a', b: '#e8e8f0', h: '#ffffff', e: '#20203a', m: '#20203a' },
      { o: '#1d3557', b: '#a8dadc', h: '#f1faee', e: '#1d3557', m: '#1d3557' },
      { o: '#283618', b: '#b5e48c', h: '#e9f5db', e: '#283618', m: '#283618' },
    ],
  },
  bug: {
    names: ['Off-By-One Beetle', 'Race Condition Roach', 'Flaky Test Mite'], hp: 0.9, atk: 1.0, def: 1.3, spd: 1.0,
    weak: 'poison', resist: 'fire', attack: 'poison', proc: 0.25, evade: 0.03,
    pals: [
      { o: '#2c0e0e', b: '#c0392b', h: '#ff6f61', e: '#ffeb3b', k: '#2c0e0e' },
      { o: '#0b2545', b: '#1f6feb', h: '#79c0ff', e: '#ffeb3b', k: '#0b2545' },
      { o: '#1b1b1b', b: '#3d3d3d', h: '#7a7a7a', e: '#ff3b3b', k: '#1b1b1b' },
    ],
  },
  boss: {
    names: ['Legacy Monolith', 'Tech Debt Colossus', '3AM Prod Incident'], hp: 1, atk: 1, def: 1.2, spd: 0.7,
    weak: null, resist: 'all', attack: 'fire', proc: 0.3, evade: 0.02,
    pals: [
      { o: '#212529', b: '#6c757d', h: '#adb5bd', e: '#ff2a2a', m: '#343a40' },
      { o: '#2b0a0a', b: '#7a1f1f', h: '#c0392b', e: '#ffd60a', m: '#1a0505' },
    ],
  },
};
const KINDS_BY_BUCKET = {
  bash: ['slime', 'slime', 'ghost', 'bug'],
  edit: ['bug', 'bug', 'slime', 'ghost'],
  read: ['ghost', 'ghost', 'slime', 'bug'],
  fail: ['bug', 'ghost', 'bug', 'ghost'],
  agent: ['slime', 'ghost', 'bug'],
};

const RARITY = [
  { name: 'common', color: '#b0b0b0', mult: 1, prefix: ['Rusty', 'Dusty', 'Legacy', 'Deprecated'] },
  { name: 'rare', color: '#4fa3ff', mult: 1.6, prefix: ['Polished', 'Typed', 'Linted', 'Tested'] },
  { name: 'epic', color: '#b06bff', mult: 2.4, prefix: ['Arcane', 'Async', 'Immutable', 'Memoized'] },
  { name: 'legendary', color: '#ffb300', mult: 3.5, prefix: ['Mythic', 'Zero-Day', 'Quantum', 'Senior'] },
  { name: 'mythic', color: '#ff1744', mult: 5, prefix: ['Ascended', 'Eternal', 'Primordial', 'Root-Access'] },
];
const MAX_PLUS = 5;
const ELEMENTS = {
  fire: { icon: '🔥', color: '#ff6d00', adj: ['Flaming', 'Blazing', 'Molten'] },
  poison: { icon: '☠', color: '#76ff03', adj: ['Venomous', 'Toxic', 'Septic'] },
  frost: { icon: '❄', color: '#80d8ff', adj: ['Frozen', 'Glacial', 'Rimed'] },
  lightning: { icon: '⚡', color: '#ffea00', adj: ['Thunder', 'Static', 'Voltaic'] },
};
const ELEMENT_CHANCE = [0.1, 0.35, 0.6, 1, 1];
const SLOTS = ['weapon', 'armor', 'helmet', 'boots', 'charm'];
const WEAPON_TYPES = {
  sword: { names: ['Regex Blade', 'Merge Sword', 'Hotfix Saber', 'Branch Cutter'], atk: 1, extra: {} },
  axe: { names: ['Refactor Axe', 'Tech Debt Cleaver', 'Monolith Splitter'], atk: 1.35, extra: { spd: -1 } },
  dagger: { names: ['Semicolon Dagger', 'Null Shiv', 'Off-By-One Knife'], atk: 0.75, extra: { crit: 0.06 } },
  staff: { names: ['Debugger Staff', 'Stack Trace Wand', 'Linter Rod'], atk: 0.85, extra: { lifesteal: 0.06 } },
};
const GEAR_BASES = {
  armor: ['Cache Cloak', 'Firewall Plate', 'Mutex Mail', 'Kubernetes Chainmail', 'Type-Safe Vest'],
  helmet: ['Code Review Helm', 'Hard Hat of Prod', 'Thinking Cap', 'Noise-Cancelling Helm'],
  boots: ['Sprint Boots', 'Async Sneakers', 'Rollback Greaves', 'CI Runners'],
  charm: ['Rubber Duck', 'Coffee Flask', 'Lucky Commit', 'Green CI Badge', 'Sudo Ring'],
};
const SLOT_STATS = {
  weapon: (L, m, t) => ({ atk: r1((1.5 + 0.7 * L) * m * t.atk), ...t.extra }),
  armor: (L, m) => ({ def: r1((1 + 0.45 * L) * m), maxHp: Math.round((4 + 2 * L) * m) }),
  helmet: (L, m) => ({ def: r1((0.5 + 0.25 * L) * m), maxHp: Math.round((3 + 1.5 * L) * m) }),
  boots: (L, m) => ({ spd: r1((0.4 + 0.12 * L) * m), def: r1((0.3 + 0.15 * L) * m), evasion: r1((2 + 0.8 * L) * m) }),
  charm: (L, m) => ({ crit: r2(0.015 * m), spd: r1((0.3 + 0.08 * L) * m), evasion: r1((1 + 0.4 * L) * m) }),
};
const AFFIXES = [
  { name: 'of Haste', stats: (L, m) => ({ spd: r1((0.5 + 0.1 * L) * m) }) },
  { name: 'of the Vampire', stats: (L, m) => ({ lifesteal: r2(0.03 * m) }) },
  { name: 'of Vigor', stats: (L, m) => ({ maxHp: Math.round((3 + 1.5 * L) * m) }) },
  { name: 'of Precision', stats: (L, m) => ({ crit: r2(0.02 * m) }) },
  { name: 'of Thorns', stats: (L, m) => ({ thorns: r2(0.08 * m) }) },
  { name: 'of Regeneration', stats: (L, m) => ({ regen: r2(0.01 * m) }) },
  { name: 'of Warding', stats: (L, m) => ({ resist: r2(0.06 * m) }) },
  { name: 'of Shadows', stats: (L, m) => ({ evasion: r1((3 + L) * m) }) },
];
const AFFIX_CHANCE = [0, 0.35, 0.6, 1, 1];
const BUFFS = {
  rage: { name: 'Hotfix Rage', icon: '🔥', apply: (s) => { s.atk *= 1.5; } },
  firewall: { name: 'Firewall', icon: '🛡', apply: (s) => { s.def *= 1.6; } },
  overclock: { name: 'Overclock', icon: '⚡', apply: (s) => { s.spd *= 1.5; s.multi += 0.2; } },
  focus: { name: 'Deep Focus', icon: '🎯', apply: (s) => { s.crit += 0.2; } },
  blessed: { name: 'Commit Blessing', icon: '✨', apply: (s) => { s.atk *= 1.15; s.def *= 1.15; } },
  smoke: { name: 'Smoke Bomb', icon: '💨', apply: (s) => { s.evasion = s.evasion * 1.5 + 20; } },
};
const TOMES = [
  { name: 'Clean Code Tome', stat: 'atk', amt: (L) => r1(0.5 + 0.08 * L) },
  { name: 'Design Patterns Tome', stat: 'def', amt: (L) => r1(0.3 + 0.05 * L) },
  { name: 'Pragmatic Programmer Tome', stat: 'maxHp', amt: (L) => Math.round(3 + 0.5 * L) },
  { name: 'Caffeine Tome', stat: 'spd', amt: () => 0.5 },
  { name: "Hacker's Tome", stat: 'crit', amt: () => 0.01 },
  { name: 'Parkour Tome', stat: 'evasion', amt: (L) => r1(2 + 0.3 * L) },
];
const MAX_POTIONS = 5;
// Diminishing returns: the same rating dodges less against higher-level monsters.
const evadeChance = (rating, level) => Math.min(0.6, rating / (rating + 40 + 8 * level));
const TOWN_EVERY = 10;
const BOXES = {
  wood: { name: 'Wooden Crate', color: '#a1887f', items: 1, weights: [50, 40, 9, 1], gold: [10, 30], extras: 0 },
  iron: { name: 'Iron Crate', color: '#90a4ae', items: 2, weights: [20, 50, 25, 5], gold: [20, 60], extras: 1 },
  gold: { name: 'Golden Crate', color: '#ffca28', items: 3, weights: [0, 40, 45, 15], gold: [50, 150], extras: 1 },
  mythic: { name: 'Mythic Chest', color: '#e040fb', items: 3, weights: [0, 0, 60, 40], gold: [100, 300], extras: 2 },
};
const KIND_LABEL = { slime: 'slimes', ghost: 'ghosts', bug: 'bugs', boss: 'bosses' };
const NAMES = ['Nibble', 'Bytey', 'Pixel', 'Segfault', 'Tofu', 'Kernel', 'Mochi', 'Glitch', 'Sprocket', 'Biscuit'];

const STAGE_LEVELS = [1, 5, 15, 30];
// A heavy auto-mode user's mix (7.8k calls); blended into each player's own history as it accumulates.
const BASELINE = { bash: 0.74, read: 0.1, edit: 0.08, fail: 0.047, agent: 0.012 };
const PRIOR = 10;
const SPAWN_CHANCE = 0.15;
const FAINT_TICKS = 8;
const BOSS_EVERY = 25;


const zeroMix = () => ({ bash: 0, edit: 0, read: 0, fail: 0, agent: 0 });

function newPet() {
  return {
    v: 1, name: pick(NAMES), born: Date.now(),
    level: 1, xp: 0, stage: 0, branch: null, secondary: null,
    hp: 40, faint: 0, buffs: [], potions: 1, bonus: {}, nextBoss: BOSS_EVERY, gold: 0, recent: [], lastShop: null, boxes: [], lastBoxes: null,
    gear: Object.fromEntries(SLOTS.map((k) => [k, null])),
    inventory: [], mix: zeroMix(), totalMix: zeroMix(),
    stats: { ticks: 0, kills: 0, faints: 0, bosses: 0, items: 0, fights: 0, goldEarned: 0 },
    log: [], lastFight: null, evolution: null,
  };
}

function load() {
  try { return upgrade(JSON.parse(fs.readFileSync(STATE, 'utf8'))); } catch { return null; }
}

function upgrade(p) {
  for (const k of SLOTS) if (!(k in p.gear)) p.gear[k] = null;
  if (p.gear.weapon && !p.gear.weapon.type) p.gear.weapon.type = 'sword';
  p.buffs = p.buffs || (p.buff ? [{ id: 'rage', fights: p.buff.fights }] : []);
  delete p.buff;
  if (p.potions == null) p.potions = 1;
  if (p.gold == null) p.gold = 0;
  if (p.stats.fights == null) p.stats.fights = 0;
  if (p.stats.goldEarned == null) p.stats.goldEarned = 0;
  p.recent = p.recent || [];
  p.boxes = p.boxes || [];
  p.bonus = p.bonus || {};
  return p;
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
    const p = load() || newPet();
    fn(p);
    save(p);
  } finally {
    try { fs.rmdirSync(LOCK); } catch {}
  }
}


const xpToNext = (level) => Math.round(25 * Math.pow(level, 1.95));

function formName(p) {
  if (p.stage === 0) return 'Egg';
  if (p.stage === 1) return 'Hatchling';
  return BRANCHES[p.branch].forms[p.stage - 2];
}

function emoji(p) {
  if (p.stage === 0) return '🥚';
  if (p.stage === 1) return '🐣';
  return (p.stage === 3 ? '👑' : '') + BRANCHES[p.branch].emoji;
}

function petStats(p) {
  const L = p.level - 1;
  const s = { maxHp: 40 + 10 * L, atk: 6 + 2.2 * L, def: 2 + 1.1 * L, spd: 5 + 0.5 * L, crit: 0.05, multi: 0, lifesteal: 0, thorns: 0, regen: 0, resist: 0, evasion: 3 + 0.5 * L };
  if (p.stage >= 2) BRANCHES[p.branch].bonus(s);
  if (p.stage >= 3) { s.maxHp *= 1.2; s.atk *= 1.2; s.def *= 1.2; }
  for (const [k, v] of Object.entries(p.bonus || {})) s[k] += v;
  for (const it of Object.values(p.gear)) if (it) for (const [k, v] of Object.entries(it.stats)) s[k] += v;
  for (const b of p.buffs || []) BUFFS[b.id].apply(s);
  s.maxHp = Math.round(s.maxHp);
  return s;
}

function log(p, type, text) {
  p.log.push({ t: Date.now(), type, text });
  if (p.log.length > 40) p.log.splice(0, p.log.length - 40);
}

// Branches reward doing something more than *you* usually do, so the baseline drifts toward the player's lifetime mix.
function baseline(p) {
  const life = Object.values(p.totalMix).reduce((a, b) => a + b, 0);
  const w = life / (life + 2000);
  return Object.fromEntries(Object.keys(BASELINE).map((k) => [k, Math.max(0.005, (1 - w) * BASELINE[k] + w * (life ? p.totalMix[k] / life : 0))]));
}

function affinity(p, mix) {
  const base = baseline(p);
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  return Object.entries(mix).map(([k, n]) => [k, (n + PRIOR) / (total * base[k] + PRIOR), total ? n / total : 0]);
}

function dominant(p, exclude) {
  const scored = affinity(p, p.mix).filter(([k]) => k !== exclude);
  scored.sort((a, b) => b[1] - a[1] || Math.random() - 0.5);
  return BRANCH_OF_BUCKET[scored[0][0]];
}

function leaning(p) {
  if (!Object.values(p.mix).some(Boolean)) return null;
  const exclude = p.stage === 2 ? BRANCHES[p.branch].bucket : undefined;
  const scored = affinity(p, p.mix).filter(([k]) => k !== exclude);
  scored.sort((a, b) => b[1] - a[1]);
  return { branch: BRANCH_OF_BUCKET[scored[0][0]], bucket: scored[0][0], share: scored[0][2] };
}

function checkEvolve(p) {
  const target = STAGE_LEVELS.filter((l) => p.level >= l).length - 1;
  while (p.stage < target) {
    const from = { stage: p.stage, branch: p.branch, secondary: p.secondary };
    const before = formName(p);
    p.stage++;
    if (p.stage === 2) p.branch = dominant(p);
    if (p.stage === 3) p.secondary = dominant(p, BRANCHES[p.branch].bucket);
    p.mix = zeroMix();
    p.evolution = { at: Date.now(), from, to: { stage: p.stage, branch: p.branch, secondary: p.secondary } };
    log(p, 'evolve', `${p.name} evolved: ${before} → ${formName(p)}!`);
  }
}

function gainXp(p, n) {
  p.xp += n;
  while (p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    p.hp = petStats(p).maxHp;
    log(p, 'level', `${p.name} reached Lv ${p.level}!`);
    checkEvolve(p);
  }
}

function spawn(p, bucket, boss) {
  const kind = boss ? 'boss' : pick(KINDS_BY_BUCKET[bucket] || ['slime', 'ghost', 'bug']);
  const k = MONSTERS[kind];
  const elite = !boss && Math.random() < 0.1;
  const streak = (p.recent || []).slice(-5).filter((r) => r.result === 'loss').length >= 2;
  const level = Math.max(1, p.level + (boss ? 1 : streak ? randInt(-3, -1) : randInt(-2, 1)));
  const s = petStats(p), L = p.level - 1;
  // Monster HP tracks the pet's offence and monster attack its toughness, so gear in one never punishes a gap in the other.
  const offence = Math.pow(s.atk / (6 + 2.2 * L), 0.85);
  const toughness = Math.pow(((s.maxHp / (40 + 10 * L)) * ((s.def + 5) / (7 + 1.1 * L))) / (1 - evadeChance(s.evasion, level)), 0.55);
  return {
    name: (elite ? 'Elite ' : '') + pick(k.names), kind, level, pal: randInt(0, k.pals.length - 1), boss, elite,
    maxHp: Math.round((18 + 10 * level) * offence * k.hp * (boss ? 1.8 : 1) * (elite ? 1.4 : 1)),
    atk: (4 + 2.2 * level) * toughness * k.atk * (boss ? 1.05 : 1) * (elite ? 1.15 : 1),
    def: (1 + 0.8 * level) * k.def,
    spd: (4 + 0.5 * level) * k.spd,
  };
}

function fight(p, m) {
  const s = petStats(p), k = MONSTERS[m.kind];
  let php = p.hp, mhp = m.maxHp;
  const rounds = [];
  const push = (o) => rounds.push({ d: 0, ...o, php, mhp });
  const hit = (atk, def, crit) => {
    const c = Math.random() < crit;
    return [Math.max(1, Math.round((atk * rand(0.85, 1.15) - def * 0.5) * (c ? 2 : 1))), c];
  };
  const el = p.gear.weapon && p.gear.weapon.element;
  const elMult = !el ? 1 : k.weak === el ? 1.5 : k.resist === el || k.resist === 'all' ? 0.6 : 1;
  const resist = Math.min(0.75, s.resist);
  const dodge = evadeChance(s.evasion, m.level);
  const fx = { burn: 0, burnDmg: 0, poison: 0, frozen: false, pBurn: 0, pBurnDmg: 0, pPoison: 0, chilled: false };
  const order = s.spd >= m.spd ? ['p', 'm'] : ['m', 'p'];
  let retreated = false;
  for (let i = 0; i < 30 && php > 0 && mhp > 0 && !retreated; i++) {
    for (const who of order) {
      if (php <= 0 || mhp <= 0) break;
      if (who === 'p') {
        if (fx.pBurn > 0) { fx.pBurn--; const d = Math.max(1, Math.round(fx.pBurnDmg * (1 - resist))); php = Math.max(0, php - d); push({ a: 'mdot', el: 'fire', d }); }
        if (fx.pPoison > 0 && php > 0) { const d = Math.max(1, Math.round(m.atk * 0.06 * fx.pPoison * (1 - resist))); php = Math.max(0, php - d); push({ a: 'mdot', el: 'poison', d }); }
        if (php <= 0) break;
        if (fx.chilled) { fx.chilled = false; push({ a: 'chilled', el: 'frost' }); continue; }
        if (php < s.maxHp * 0.3 && p.potions > 0) {
          p.potions--;
          php = Math.min(s.maxHp, php + Math.round(s.maxHp * 0.6));
          push({ a: 'potion' });
          continue;
        }
        if (php < s.maxHp * 0.15 && mhp > m.maxHp * 0.25 && Math.random() < 0.6) {
          retreated = true;
          push({ a: 'retreat' });
          break;
        }
        const swings = Math.random() < s.multi ? 2 : 1;
        for (let n = 0; n < swings && mhp > 0; n++) {
          if (Math.random() < k.evade) { push({ a: 'miss' }); continue; }
          let [d, c] = hit(s.atk, m.def, s.crit);
          d = Math.max(1, Math.round(d * elMult));
          mhp = Math.max(0, mhp - d);
          php = Math.min(s.maxHp, php + Math.round(d * s.lifesteal));
          push({ a: 'p', d, c, el });
          if (!el || mhp <= 0) continue;
          if (el === 'fire' && Math.random() < 0.35) { fx.burn = 3; fx.burnDmg = Math.max(1, Math.round(d * 0.3)); }
          if (el === 'poison' && Math.random() < 0.5) fx.poison = Math.min(5, fx.poison + 1);
          if (el === 'frost' && Math.random() < 0.25) fx.frozen = true;
          if (el === 'lightning' && Math.random() < 0.3) {
            const cd = Math.max(1, Math.round(d * 0.6));
            mhp = Math.max(0, mhp - cd);
            push({ a: 'chain', el, d: cd });
          }
        }
      } else {
        if (fx.burn > 0) { fx.burn--; mhp = Math.max(0, mhp - fx.burnDmg); push({ a: 'dot', el: 'fire', d: fx.burnDmg }); }
        if (fx.poison > 0 && mhp > 0) { const d = Math.max(1, Math.round(s.atk * 0.08 * fx.poison)); mhp = Math.max(0, mhp - d); push({ a: 'dot', el: 'poison', d }); }
        if (mhp <= 0) break;
        if (fx.frozen) { fx.frozen = false; push({ a: 'frozen', el: 'frost' }); continue; }
        if (Math.random() < dodge) { push({ a: 'evade' }); continue; }
        const [d, c] = hit(m.atk, s.def, 0.05);
        php = Math.max(0, php - d);
        mhp = Math.max(0, mhp - Math.round(d * s.thorns));
        push({ a: 'm', d, c });
        if (k.attack && php > 0 && Math.random() < k.proc * (1 - resist)) {
          if (k.attack === 'poison') fx.pPoison = Math.min(3, fx.pPoison + 1);
          if (k.attack === 'frost') fx.chilled = true;
          if (k.attack === 'fire') { fx.pBurn = 3; fx.pBurnDmg = Math.max(1, Math.round(d * 0.25)); }
          push({ a: 'afflict', el: k.attack });
        }
      }
    }
  }
  return { rounds, php, result: mhp <= 0 ? 'win' : php <= 0 ? 'loss' : retreated ? 'retreat' : 'flee' };
}

const POWER_WEIGHT = { atk: 1, def: 1.2, maxHp: 0.15, crit: 100, spd: 0.8, lifesteal: 150, thorns: 60, regen: 400, resist: 80, evasion: 0.6 };
const itemPower = (it) => (it ? Object.entries(it.stats).reduce((a, [k, v]) => a + v * (POWER_WEIGHT[k] || 0), 0) + (it.element ? 3 + it.level * 0.3 : 0) : 0);

function makeItem(level, weights, forced = {}) {
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0), ri = 0;
  while (roll >= weights[ri]) roll -= weights[ri++];
  const rar = RARITY[ri], mult = rar.mult;
  const slot = forced.slot || pick(SLOTS);
  const type = slot === 'weapon' ? forced.type || pick(Object.keys(WEAPON_TYPES)) : undefined;
  const stats = SLOT_STATS[slot](level, mult, WEAPON_TYPES[type]);
  const element = type && Math.random() < ELEMENT_CHANCE[ri] ? pick(Object.keys(ELEMENTS)) : undefined;
  let name = `${pick(element ? ELEMENTS[element].adj : rar.prefix)} ${pick(type ? WEAPON_TYPES[type].names : GEAR_BASES[slot])}`;
  const affixes = Math.random() < AFFIX_CHANCE[ri] ? [pick(AFFIXES)] : [];
  if (ri >= 3) affixes.push(pick(AFFIXES.filter((a) => a !== affixes[0])));
  for (const a of affixes) for (const [k, v] of Object.entries(a.stats(level, mult))) stats[k] = r2((stats[k] || 0) + v);
  if (affixes.length) name += ` ${affixes[0].name}`;
  return { name, slot, type, element, rarity: ri, level, stats, affixes: affixes.map((a) => a.name) };
}

function equip(p, it) {
  p.stats.items++;
  const cur = p.gear[it.slot];
  if (itemPower(it) > itemPower(cur)) {
    p.gear[it.slot] = it;
    if (cur) p.inventory.unshift(cur);
    it.equipped = true;
  } else p.inventory.unshift(it);
  p.inventory = p.inventory.slice(0, 12);
  return it;
}

function rollConsumable(p) {
  const r = Math.random(), L = p.level;
  if (r < 0.43) {
    if (p.potions < MAX_POTIONS) { p.potions++; return { name: `Energy Drink (${p.potions}/${MAX_POTIONS} carried)` }; }
    p.hp = petStats(p).maxHp;
    return { name: 'Energy Drink (chugged: full heal)' };
  }
  if (r < 0.73) {
    const id = pick(Object.keys(BUFFS)), fights = randInt(5, 8);
    const cur = p.buffs.find((b) => b.id === id);
    if (cur) cur.fights = Math.max(cur.fights, fights); else p.buffs.push({ id, fights });
    return { name: `${BUFFS[id].icon} ${BUFFS[id].name} (${fights} fights)` };
  }
  if (r < 0.88) {
    const t = pick(TOMES), amt = t.amt(L);
    p.bonus[t.stat] = r2((p.bonus[t.stat] || 0) + amt);
    return { name: `${t.name} (+${t.stat === 'crit' ? `${amt * 100}%` : amt} ${t.stat} forever)` };
  }
  gainXp(p, Math.round(xpToNext(p.level) * 0.05));
  return { name: 'Stack Overflow Scroll (+XP)' };
}

function rollLoot(p, m) {
  const drops = [];
  const weights = m.boss ? [0, 35, 45, 20] : m.elite ? [25, 45, 23, 7] : [58, 29, 10, 3];
  const gearRolls = m.boss ? 2 : Math.random() < (m.elite ? 0.8 : 0.55) ? 1 : 0;
  for (let i = 0; i < gearRolls; i++) drops.push(equip(p, makeItem(m.level, weights)));
  if (m.boss || Math.random() < 0.25) drops.push(rollConsumable(p));
  const r = Math.random();
  const box = m.boss ? (r < 0.2 ? 'mythic' : 'gold') : m.elite ? (r < 0.05 ? 'gold' : r < 0.4 ? 'iron' : null) : r < 0.003 ? 'gold' : r < 0.023 ? 'iron' : r < 0.1 ? 'wood' : null;
  if (box) { p.boxes.push(box); drops.push({ name: `🎁 ${BOXES[box].name}`, box }); }
  return drops;
}

const sellValue = (it) => Math.max(1, Math.round(itemPower(it) * 2));
const gearPrice = (it) => Math.round(itemPower(it) * 3 * (1 + it.rarity * 0.2));

function shopStock(p) {
  const L = p.level + 1, weights = [0, 30, 50, 20];
  const gear = [makeItem(L, weights), makeItem(L, weights)];
  let weapon;
  do weapon = makeItem(L, weights); while (weapon.slot !== 'weapon' || !weapon.element);
  gear.push(weapon);
  const stock = gear.map((it) => ({ kind: 'gear', item: it, name: it.name, price: gearPrice(it) }));
  stock.push({ kind: 'potion', name: 'Energy Drink', price: 15 + 2 * L });
  const buff = pick(Object.keys(BUFFS));
  stock.push({ kind: 'buff', id: buff, name: BUFFS[buff].name, price: 30 + 4 * L });
  const t = pick(TOMES);
  stock.push({ kind: 'tome', tome: t, name: t.name, price: 120 + 15 * L });
  stock.push({ kind: 'box', id: 'iron', name: BOXES.iron.name, price: 60 + 8 * L });
  if (Math.random() < 0.5) stock.push({ kind: 'box', id: 'gold', name: BOXES.gold.name, price: 200 + 20 * L });
  for (const it of Object.values(p.gear)) if (it && (it.plus || 0) < MAX_PLUS) stock.push({ kind: 'forge', target: it, name: `Reforge ${it.name}`, price: Math.round(gearPrice(it) * 0.5 * (1 + 0.25 * (it.plus || 0))) });
  return stock;
}

// The pet's shopping brain: every offer gets a situational value, then it buys the best value-per-gold first.
function appraise(p, offer) {
  const L = p.level;
  const losses = p.recent.filter((r) => r.result !== 'win').length;
  const bloodied = p.recent.length && p.recent.reduce((a, r) => a + r.hpEnd, 0) / p.recent.length < 0.45;
  const bossSoon = p.nextBoss - p.stats.kills <= 5;
  const kinds = {};
  for (const r of p.recent) kinds[r.kind] = (kinds[r.kind] || 0) + 1;
  const common = Object.entries(kinds).filter(([k]) => k !== 'boss').sort((a, b) => b[1] - a[1])[0];
  if (offer.kind === 'potion') {
    if (p.potions >= 3) return null;
    return { value: (3 + L * 0.6) * (losses >= 2 || bloodied ? 1.6 : 1), why: `only ${p.potions} Energy Drink${p.potions === 1 ? '' : 's'} left` };
  }
  if (offer.kind === 'buff') {
    if (p.buffs.some((b) => b.id === offer.id)) return null;
    if (bossSoon && (offer.id === 'rage' || offer.id === 'firewall')) return { value: 2 * (5 + L * 0.8), why: 'a boss is coming' };
    if (offer.id === 'firewall' && (losses >= 2 || bloodied)) return { value: 1.5 * (5 + L * 0.8), why: `took a beating lately (${losses} of the last ${p.recent.length} fights lost)` };
    return { value: 0.2 * (5 + L * 0.8), why: 'had spare gold and wanted an edge' };
  }
  if (offer.kind === 'tome') {
    if (p.gold < offer.price * 2) return null;
    return { value: 4 + L * 0.5, why: 'rich enough to invest in itself' };
  }
  if (offer.kind === 'box') {
    const empty = SLOTS.filter((k) => !p.gear[k]).length;
    const ev = (offer.id === 'gold' ? 3.2 : 1) * (5 + L * 0.6);
    if (empty) return { value: ev * 1.5, why: `${empty} empty gear slot${empty > 1 ? 's' : ''}, a crate might fill ${empty > 1 ? 'them' : 'it'}` };
    if (p.gold > offer.price * 4) return { value: ev, why: 'feeling lucky with a full wallet' };
    return null;
  }
  if (offer.kind === 'forge') {
    const it = offer.target;
    if (p.gear[it.slot] !== it) return null;
    return { value: itemPower(it) * 0.1, why: `reforged at the blacksmith to +${(it.plus || 0) + 1}` };
  }
  const it = offer.item, cur = p.gear[it.slot];
  let gain = itemPower(it) - itemPower(cur), why = cur ? `+${Math.round(gain)} power over ${cur.name}` : `nothing in the ${it.slot} slot yet`;
  if (it.element && common) {
    const k = MONSTERS[common[0]];
    if (k.weak === it.element) { gain += 4 + L * 0.4; why += ` — ${KIND_LABEL[common[0]]} keep showing up and they're weak to ${it.element}`; }
    else if (k.resist === it.element) gain -= 3 + L * 0.3;
  }
  if (!cur) gain += 3 + L * 0.3;
  if (it.slot === 'armor' || it.slot === 'helmet') if (losses >= 2 || bloodied) { gain *= 1.3; why += ', and it needs more defence'; }
  return gain > 0 ? { value: gain, why } : null;
}

function openBox(p, id) {
  const b = BOXES[id];
  const items = [];
  for (let i = 0; i < b.items; i++) items.push(equip(p, makeItem(p.level, b.weights)));
  const gold = Math.round(rand(...b.gold) * (1 + p.level * 0.1));
  p.gold += gold;
  p.stats.goldEarned += gold;
  const extras = [];
  for (let i = 0; i < b.extras; i++) extras.push(rollConsumable(p));
  if (id === 'mythic') { gainXp(p, xpToNext(p.level) - p.xp); extras.push({ name: 'Senior Dev Mentorship (+1 Lv)' }); const t = pick(TOMES); p.bonus[t.stat] = r2((p.bonus[t.stat] || 0) + t.amt(p.level)); extras.push({ name: `${t.name} (forever)` }); }
  const contents = [...items.map((it) => ({ name: it.name, rarity: it.rarity, equipped: !!it.equipped })), ...extras.map((e) => ({ name: e.name })), { name: `${gold} gold` }];
  log(p, 'box', `opened a ${b.name}: ${contents.map((c) => c.name).join(', ')}`);
  return { id, contents };
}

function reforge(it, times) {
  const f = Math.pow(1.1, times);
  for (const k of Object.keys(it.stats)) it.stats[k] = k === 'maxHp' ? Math.round(it.stats[k] * f) : r2(it.stats[k] * f);
  it.plus = (it.plus || 0) + times;
  it.name = `${it.name.replace(/ \+\d+$/, '')} +${it.plus}`;
}

const oneHot = (r) => RARITY.map((_, i) => (i === r ? 1 : 0));
const craftFee = (p, tier) => Math.round((10 + 2 * p.level) * (1 + tier));

function recentFoe(p) {
  const kinds = {};
  for (const r of p.recent) if (r.kind !== 'boss') kinds[r.kind] = (kinds[r.kind] || 0) + 1;
  const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
  return top && top[0];
}

function addElement(it, element) {
  it.element = element;
  it.name = `${pick(ELEMENTS[element].adj)} ${it.name.split(' ').slice(1).join(' ')}`;
}

// Runs before the shop sells leftovers, so spare loot gets a chance to become something useful first.
function craft(p) {
  const done = [];
  const pay = (fee) => { if (p.gold < fee) return false; p.gold -= fee; return true; };
  const take = (items) => { p.inventory = p.inventory.filter((it) => !items.includes(it)); };

  for (let fused = true; fused;) {
    fused = false;
    const groups = {};
    for (const it of p.inventory) if (it.rarity < 4) (groups[`${it.slot}:${it.rarity}`] ||= []).push(it);
    for (const parts of Object.values(groups)) {
      if (parts.length < 3) continue;
      const trio = parts.sort((a, b) => itemPower(b) - itemPower(a)).slice(0, 3);
      const { slot, rarity } = trio[0];
      const level = Math.max(...trio.map((it) => it.level));
      const result = makeItem(level, oneHot(rarity + 1), { slot, type: trio[0].type });
      const donor = trio.find((it) => it.element);
      if (slot === 'weapon' && donor && !result.element) addElement(result, donor.element);
      const plus = Math.min(MAX_PLUS, Math.max(...trio.map((it) => it.plus || 0)));
      if (plus) reforge(result, plus);
      if (itemPower(result) <= itemPower(p.gear[slot])) continue;
      if (!pay(craftFee(p, rarity))) continue;
      take(trio);
      result.crafted = true;
      equip(p, result);
      p.stats.items--;
      done.push({ kind: 'fuse', inputs: trio.map((it) => it.name), result: result.name, rarity: result.rarity,
        why: `fused 3 ${RARITY[rarity].name} ${slot === 'boots' ? 'boots' : `${slot}s`} into a ${RARITY[rarity + 1].name} upgrade` });
      fused = true;
      break;
    }
  }

  const w = p.gear.weapon, foe = recentFoe(p);
  if (w && foe) {
    const k = MONSTERS[foe];
    const bad = !w.element || k.resist === w.element;
    const donor = p.inventory.find((it) => it.slot === 'weapon' && it.element && (it.element === k.weak || (!w.element && k.resist !== it.element)));
    if (bad && donor && w.element !== donor.element && pay(craftFee(p, 1))) {
      take([donor]);
      const before = w.name;
      addElement(w, donor.element);
      done.push({ kind: 'infuse', inputs: [donor.name, before], result: w.name, rarity: w.rarity,
        why: `infused ${donor.element} into its weapon${k.weak === donor.element ? ` — ${KIND_LABEL[foe]} keep showing up and they're weak to ${donor.element}` : ''}` });
    }
  }

  for (const slot of SLOTS) {
    const target = p.gear[slot];
    if (!target || (target.affixes || []).length >= (target.rarity >= 3 ? 3 : 2)) continue;
    const donor = p.inventory.filter((it) => it.slot === slot && (it.affixes || []).some((a) => !(target.affixes || []).includes(a)))
      .sort((a, b) => b.rarity - a.rarity)[0];
    if (!donor || !pay(craftFee(p, donor.rarity))) continue;
    const name = donor.affixes.find((a) => !(target.affixes || []).includes(a));
    const affix = AFFIXES.find((a) => a.name === name);
    for (const [k, v] of Object.entries(affix.stats(target.level, RARITY[target.rarity].mult))) target.stats[k] = r2((target.stats[k] || 0) + v);
    target.affixes = [...(target.affixes || []), name];
    take([donor]);
    done.push({ kind: 'enchant', inputs: [donor.name, target.name], result: target.name, rarity: target.rarity,
      why: `moved "${name}" from ${donor.name} onto ${target.name}` });
  }

  for (const c of done) log(p, 'craft', c.why);
  p.stats.crafted = (p.stats.crafted || 0) + done.length;
  if (done.length) p.lastCraft = { t: Date.now(), done };
}

function visitTown(p) {
  const s = petStats(p);
  const revived = p.faint > 0;
  p.faint = 0;
  p.hp = s.maxHp;
  const opened = p.boxes.map((id) => openBox(p, id));
  p.boxes = [];
  if (opened.length) p.lastBoxes = { t: Date.now(), opened };
  craft(p);
  const groups = {};
  for (const it of p.inventory) (groups[`${it.slot}:${it.rarity}`] ||= []).push(it);
  const kept = Object.values(groups).filter((g) => g[0].rarity >= 2 && g[0].rarity < 4 && g.length === 2).flat();
  let sold = 0;
  for (const it of p.inventory) if (!kept.includes(it)) sold += sellValue(it);
  const soldCount = p.inventory.length - kept.length;
  p.inventory = kept;
  p.gold += sold;
  const stock = shopStock(p);
  const bought = [];
  for (;;) {
    const minRatio = p.gold > 40 * p.level ? 0.012 : 0.03;
    const options = stock
      .filter((o) => !o.sold && o.price <= p.gold)
      .map((o) => ({ o, a: appraise(p, o) }))
      .filter((x) => x.a && x.a.value / x.o.price >= minRatio)
      .sort((a, b) => b.a.value / b.o.price - a.a.value / a.o.price);
    if (!options.length) break;
    const { o, a } = options[0];
    p.gold -= o.price;
    if (o.kind === 'gear') { o.sold = true; equip(p, o.item); p.stats.items--; }
    else if (o.kind === 'potion') p.potions++;
    else if (o.kind === 'box') { o.sold = true; const res = openBox(p, o.id); p.lastBoxes = { t: Date.now(), opened: [...((p.lastBoxes && p.lastBoxes.t > Date.now() - 1000 && p.lastBoxes.opened) || []), res] }; }
    else if (o.kind === 'buff') { o.sold = true; p.buffs.push({ id: o.id, fights: 8 }); }
    else if (o.kind === 'forge') { o.sold = true; reforge(o.target, 1); }
    else { o.sold = true; p.bonus[o.tome.stat] = r2((p.bonus[o.tome.stat] || 0) + o.tome.amt(p.level)); }
    bought.push({ name: o.kind === 'forge' ? o.target.name : o.name, price: o.price, why: a.why, rarity: o.item ? o.item.rarity : o.target ? o.target.rarity : null });
  }
  p.hp = petStats(p).maxHp;
  p.lastShop = { t: Date.now(), bought, sold, soldCount, gold: p.gold, stock: stock.map((o) => ({ name: o.name, price: o.price, rarity: o.item ? o.item.rarity : null, bought: !!o.sold })) };
  let text = `${revived ? 'limped' : 'returned'} to town: fully healed`;
  if (soldCount) text += `, sold ${soldCount} item${soldCount > 1 ? 's' : ''} for ${sold}g`;
  if (kept.length) text += `, kept ${kept.length} for future fusions`;
  log(p, 'town', text);
  for (const b of bought) log(p, 'shop', `bought ${b.name} for ${b.price}g — ${b.why}`);
  if (!bought.length) log(p, 'shop', `browsed the shop, saving gold (${p.gold}g)`);
}

function tick(p, bucket, event) {
  p.stats.ticks++;
  if (bucket) { p.mix[bucket]++; p.totalMix[bucket]++; }
  const s = petStats(p);
  if (event === 'wake') {
    p.hp = s.maxHp;
    p.faint = 0;
    log(p, 'wake', `${p.name} wakes up as you start a session.`);
    return;
  }
  if (p.faint > 0) {
    if (--p.faint === 0) {
      p.hp = Math.round(s.maxHp * 0.5);
      log(p, 'wake', `${p.name} gets back up.`);
    }
    return;
  }
  p.hp = Math.min(s.maxHp, p.hp + Math.max(1, Math.round(s.maxHp * (0.05 + s.regen))));
  gainXp(p, 1);
  const ambush = p.ambush;
  p.ambush = false;
  if (!ambush && Math.random() >= (bucket === 'fail' ? 0.35 : SPAWN_CHANCE)) return;

  // A due boss waits until the pet has rested up, so it is never fought half-dead.
  const boss = p.stats.kills >= p.nextBoss && p.hp >= s.maxHp * 0.75;
  if (p.hp < s.maxHp * 0.5 && p.potions > 0) { p.potions--; p.hp = Math.min(s.maxHp, p.hp + Math.round(s.maxHp * 0.6)); }
  const m = spawn(p, ambush ? 'edit' : bucket, boss && !ambush);
  if (ambush) Object.assign(m, { kind: 'bug', elite: true, name: 'Failing Test Hydra', maxHp: Math.round(m.maxHp * 1.4), atk: m.atk * 1.15 });
  const startHp = p.hp;
  const f = fight(p, m);
  p.hp = f.php;
  const lf = {
    id: `${Date.now()}-${p.stats.ticks}`, t: Date.now(), monster: m, petStartHp: startHp, petMaxHp: s.maxHp,
    form: { stage: p.stage, branch: p.branch, secondary: p.secondary }, rounds: f.rounds, result: f.result, xp: 0, loot: null,
  };
  for (const b of p.buffs) b.fights--;
  p.buffs = p.buffs.filter((b) => b.fights > 0);
  if (f.result === 'win') {
    p.stats.kills++;
    if (m.boss) { p.stats.bosses++; p.nextBoss = p.stats.kills + BOSS_EVERY; }
    lf.xp = Math.round((6 + 3 * m.level) * (m.boss ? 5 : m.elite ? 2 : 1));
    lf.gold = Math.round((3 + 1.2 * m.level) * rand(0.7, 1.3) * (m.boss ? 5 : m.elite ? 2 : 1));
    p.gold += lf.gold;
    p.stats.goldEarned += lf.gold;
    gainXp(p, lf.xp);
    lf.loot = rollLoot(p, m);
    let text = `slew ${m.name} (Lv ${m.level}) +${lf.xp}xp +${lf.gold}g`;
    for (const l of lf.loot) text += ` · ${l.equipped ? 'equipped' : 'found'} ${l.name}`;
    log(p, m.boss ? 'boss' : 'fight', text);
  } else if (f.result === 'loss') {
    if (m.boss) p.nextBoss = p.stats.kills + 10;
    p.faint = FAINT_TICKS;
    p.stats.faints++;
    log(p, 'faint', `fainted against ${m.name} (Lv ${m.level})`);
  } else if (f.result === 'retreat') {
    if (m.boss) p.nextBoss = p.stats.kills + 5;
    log(p, 'flee', `retreated from ${m.name} (Lv ${m.level}) to fight another day`);
  } else {
    log(p, 'flee', `${m.name} fled`);
  }
  p.lastFight = lf;
  p.stats.fights++;
  p.recent.push({ kind: m.kind, result: f.result, hpEnd: p.hp / s.maxHp });
  if (p.recent.length > 10) p.recent.shift();
  if (p.stats.fights % TOWN_EVERY === 0) visitTown(p);
}

const TOOL_BUCKET = [
  [/^Bash$|^BashOutput$/, 'bash'],
  [/^(Edit|Write|MultiEdit|NotebookEdit)$/, 'edit'],
  [/^(Read|Grep|Glob|LS|WebFetch|WebSearch|LSP)$|^mcp__/, 'read'],
  [/^(Agent|Task)$/, 'agent'],
];

function hook() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch {}
  const ev = input.hook_event_name;
  const tool = input.tool_name || '';
  let bucket = null, event = 'tick';
  if (ev === 'SessionStart') event = 'wake';
  else if (ev === 'PostToolUseFailure') bucket = 'fail';
  else if (ev === 'SubagentStart') bucket = 'agent';
  else if (ev === 'PostToolUse') bucket = (TOOL_BUCKET.find(([re]) => re.test(tool)) || [])[1] || null;
  const cmd = tool === 'Bash' && input.tool_input && typeof input.tool_input.command === 'string' ? input.tool_input.command : '';
  withLock((p) => { tick(p, bucket, event); if (cmd) codingEvent(p, cmd, ev === 'PostToolUseFailure'); });
}

const RUNS = (re) => new RegExp(`(^|[;&|(]\\s*)(\\S+=\\S+\\s+)*(${re.source})`);
const TEST_CMD = RUNS(/(npm (run )?test|pnpm test|yarn test|bun test|pytest|jest|vitest|cargo test|go test|mvn test|gradle test|rspec|phpunit|mix test|make test)\b/);
const COMMIT_CMD = RUNS(/git commit\b/), PR_CMD = RUNS(/gh pr create\b/), PUSH_CMD = RUNS(/git push\b/);

// What you actually ship echoes into the pet's world, beyond the raw tool-call tick.
function codingEvent(p, cmd, failed) {
  const L = p.level;
  if (TEST_CMD.test(cmd)) {
    if (failed) { p.ambush = true; log(p, 'code', 'a test failed — something is crawling out of the suite…'); }
    else { const xp = Math.round(xpToNext(L) * 0.03); gainXp(p, xp); log(p, 'code', `tests passed: ${p.name} trains on green CI (+${xp}xp)`); }
    return;
  }
  if (failed) return;
  if (COMMIT_CMD.test(cmd)) {
    const cur = p.buffs.find((b) => b.id === 'blessed');
    if (cur) cur.fights = 6; else p.buffs.push({ id: 'blessed', fights: 6 });
    p.stats.commits = (p.stats.commits || 0) + 1;
    log(p, 'code', `you committed: ${p.name} receives a Commit Blessing (+15% ATK/ARM, 6 fights)`);
  } else if (PR_CMD.test(cmd)) {
    p.boxes.push('iron');
    log(p, 'code', `you opened a PR: ${p.name} is awarded an Iron Crate`);
  } else if (PUSH_CMD.test(cmd)) {
    const g = Math.round(15 + 3 * L);
    p.gold += g;
    p.stats.goldEarned += g;
    log(p, 'code', `you pushed: deploy bounty +${g}g`);
  }
}


const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixRgb = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const fg = ([r, g, b]) => `\x1b[38;2;${r};${g};${b}m`;
const bg = ([r, g, b]) => `\x1b[48;2;${r};${g};${b}m`;
const RESET = '\x1b[0m';
const color = (h, s) => `${fg(hex(h))}${s}${RESET}`;

function paint(grid, l) {
  for (const [r, c] of l.pts) if (!l.under || grid[r][c] === '.') grid[r][c] = l.ch;
}

function composePet(form, p, opts = {}) {
  const art = ['egg', 'hatchling', 'beast', 'beast'][form.stage];
  const grid = ART[art].map((row) => row.split(''));
  const pal = { ...BASE_PAL, ...(form.branch && form.stage >= 2 ? BRANCHES[form.branch].pal : {}) };
  if (form.stage === 3) { paint(grid, WINGS); for (const l of ACCESSORY[form.secondary] || []) paint(grid, l); }
  if (form.stage >= 2) for (const l of ACCESSORY[form.branch]) paint(grid, l);
  if (form.stage === 3) paint(grid, CROWN);
  if (form.stage >= 1 && p) {
    const { weapon, armor, helmet, boots, charm } = p.gear;
    const big = form.stage >= 2 ? 2 : 1;
    if (helmet) { paint(grid, HELMET[big]); pal.M = RARITY[helmet.rarity].color; }
    if (boots) { paint(grid, BOOTS[big]); pal.B = RARITY[boots.rarity].color; }
    if (weapon) { WEAPON_ART[weapon.type || 'sword'].forEach((l) => paint(grid, l)); pal.W = weapon.element ? ELEMENTS[weapon.element].color : RARITY[weapon.rarity].color; }
    if (armor) {
      const ac = RARITY[armor.rarity].color;
      if (form.stage === 1) { paint(grid, SCARF); pal.A = ac; } else pal.c = `#${mixRgb(hex(pal.c), hex(ac), 0.55).map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    }
    if (charm && opts.sparkle) { paint(grid, SPARKLE); pal.S = RARITY[charm.rarity].color; }
  }
  if (opts.blink) for (const row of grid) for (let c = 0; c < 16; c++) if (row[c] === 'e' || row[c] === 'w') row[c] = 'b';
  return { grid, pal };
}

function composeMonster(m) {
  return { grid: ART[m.kind].map((row) => row.split('')), pal: MONSTERS[m.kind].pals[m.pal] || MONSTERS[m.kind].pals[0] };
}

// Returns terminal lines for a sprite on an 18-row canvas, so a ±1 bob never clips the art.
function renderSprite({ grid, pal }, { dy = 0, tint = null, amount = 0, gray = false, scale = 1, flipX = false } = {}) {
  const H = 18;
  const px = (r, c) => {
    const sr = r - 1 - dy;
    if (sr < 0 || sr > 15) return null;
    const ch = grid[sr][flipX ? 15 - c : c];
    if (ch === '.' || !pal[ch]) return null;
    let rgb = hex(pal[ch]);
    if (gray) { const l = Math.round(rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11); rgb = [l, l, l]; }
    if (tint) rgb = mixRgb(rgb, hex(tint), amount);
    return rgb;
  };
  const lines = [];
  if (scale === 2) {
    for (let r = 0; r < H; r++) {
      let s = '';
      for (let c = 0; c < 16; c++) { const p = px(r, c); s += p ? `${fg(p)}██` : `${RESET}  `; }
      lines.push(s + RESET);
    }
  } else {
    for (let r = 0; r < H; r += 2) {
      let s = '';
      for (let c = 0; c < 16; c++) {
        const t = px(r, c), b = px(r + 1, c);
        if (t && b) s += `${fg(t)}${bg(b)}▀`;
        else if (t) s += `${RESET}${fg(t)}▀`;
        else if (b) s += `${RESET}${fg(b)}▄`;
        else s += `${RESET} `;
      }
      lines.push(s + RESET);
    }
  }
  return lines;
}

function bar(frac, width, on, off = '#3a3a3a', chars = ['█', '░']) {
  const n = Math.max(0, Math.min(width, Math.round(frac * width)));
  return color(on, chars[0].repeat(n)) + color(off, chars[1].repeat(width - n));
}

const hpColor = (f) => (f > 0.5 ? '#4caf50' : f > 0.25 ? '#ffb300' : '#e53935');

function ago(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}


function statusline() {
  let input = '';
  try { input = fs.readFileSync(0, 'utf8'); } catch {}
  const cfg = loadConfig();
  let inner = '';
  if (cfg.inner) {
    try { inner = execFileSync('/bin/sh', ['-c', cfg.inner], { input, encoding: 'utf8', timeout: 4000, stdio: ['pipe', 'pipe', 'ignore'] }); } catch (e) { inner = e.stdout || ''; }
  }
  if (inner) process.stdout.write(inner.endsWith('\n') ? inner : inner + '\n');
  const p = load();
  if (!p) { process.stdout.write(`🥚 ${color('#888888', 'a pet egg will appear after your next tool call')}\n`); return; }
  process.stdout.write((cfg.sprite ? spriteCard(p) : statusLines(p)).join('\n') + '\n');
}

const lootOf = (lf) => (Array.isArray(lf.loot) ? lf.loot : lf.loot ? [lf.loot] : []);
const lootColor = (l) => (l.rarity != null ? RARITY[l.rarity].color : '#ffd54f');
const short = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
const GEAR_ICON = { weapon: '⚔', armor: '⛨', helmet: '⛑', boots: '»', charm: '✧' };
const pct = (v) => `${Math.round(v * 100)}%`;

function statLine(s, dim, level) {
  let t = `${dim('ATK')} ${r1(s.atk)} ${dim('ARM')} ${r1(s.def)} ${dim('EVA')} ${pct(evadeChance(s.evasion, level))} ${dim('SPD')} ${r1(s.spd)} ${dim('CRIT')} ${pct(s.crit)}`;
  if (s.lifesteal) t += ` ${dim('LIFE')} ${pct(s.lifesteal)}`;
  if (s.thorns) t += ` ${dim('THRN')} ${pct(s.thorns)}`;
  if (s.resist) t += ` ${dim('RES')} ${pct(Math.min(0.75, s.resist))}`;
  return t;
}

function buffLine(p) {
  const parts = p.buffs.map((b) => color('#ff7043', `${BUFFS[b.id].icon}${b.fights}`));
  if (p.potions) parts.unshift(color('#69f0ae', `🧪${p.potions}`));
  if (p.boxes.length) parts.unshift(color('#e040fb', `🎁${p.boxes.length}`));
  parts.unshift(color('#ffd54f', `💰${p.gold}`));
  return parts.join(' ');
}

function roundInfo(name, m, r) {
  const E = r.el && ELEMENTS[r.el];
  switch (r.a) {
    case 'p': return { text: `${r.c ? 'CRIT ' : ''}-${r.d}${E ? ` ${E.icon}` : ''}`, color: r.c ? '#ffd700' : '#ffffff', target: 'mon', tint: E ? E.color : '#ff1744', lunge: 'pet' };
    case 'm': return { text: `${m.name}: ${r.c ? 'CRIT ' : ''}-${r.d}`, color: '#ff8a80', target: 'pet', tint: '#ff1744', lunge: 'mon' };
    case 'chain': return { text: `⚡ chain lightning -${r.d}`, color: E.color, target: 'mon', tint: E.color };
    case 'dot': return { text: `${E.icon} ${m.name} ${r.el === 'fire' ? 'burns' : 'suffers poison'} -${r.d}`, color: E.color, target: 'mon', tint: E.color };
    case 'mdot': return { text: `${E.icon} ${name} ${r.el === 'fire' ? 'burns' : 'is poisoned'} -${r.d}`, color: E.color, target: 'pet', tint: E.color };
    case 'frozen': return { text: `❄ ${m.name} is frozen solid!`, color: E.color, target: 'mon', tint: E.color };
    case 'chilled': return { text: `❄ ${name} is chilled and loses a turn`, color: E.color, target: 'pet', tint: E.color };
    case 'afflict': return { text: `${E.icon} ${m.name} ${{ poison: 'poisons', frost: 'chills', fire: 'ignites' }[r.el]} ${name}!`, color: E.color, target: 'pet', tint: E.color };
    case 'evade': return { text: `${name} evades!`, color: '#b388ff', target: 'pet', tint: '#b388ff' };
    case 'miss': return { text: `${m.name} dodges ${name}'s attack`, color: '#9e9e9e', lunge: 'pet' };
    case 'potion': return { text: `${name} drinks an Energy Drink!`, color: '#69f0ae', target: 'pet', tint: '#69f0ae' };
    default: return { text: `${name} retreats!`, color: '#9e9e9e' };
  }
}

function loadConfig() {
  try { return { sprite: true, ...JSON.parse(fs.readFileSync(CONFIG, 'utf8')) }; } catch { return { sprite: true }; }
}

function setConfig(key, value) {
  fs.mkdirSync(HOME, { recursive: true });
  fs.writeFileSync(CONFIG, JSON.stringify({ ...loadConfig(), [key]: value }));
}

function spriteCard(p) {
  const s = petStats(p), need = xpToNext(p.level), hpF = p.hp / s.maxHp;
  const dim = (t) => color('#8a8a8a', t);
  // Redraws are event-driven, so the clock picks a bob/blink frame instead of a timer.
  const beat = Math.floor(Date.now() / 1000);
  const sprite = renderSprite(composePet(p, p, { blink: beat % 7 === 0, sparkle: beat % 2 === 0 }), { dy: beat % 2 ? 0 : -1, gray: p.faint > 0 })
    .filter((l) => /[▀▄]/.test(l));
  const gear = (slot, n) => {
    const it = p.gear[slot];
    const icon = it && it.element ? ELEMENTS[it.element].icon : GEAR_ICON[slot];
    const t = `${it && it.element ? icon : dim(icon)} ${it ? color(RARITY[it.rarity].color, short(it.name, n)) : dim('—')}`;
    return t + ' '.repeat(Math.max(0, n - (it ? Math.min(n, it.name.length) : 1)));
  };
  const e = p.log[p.log.length - 1];
  const lean = leaning(p), next = STAGE_LEVELS[p.stage + 1];
  const card = [
    `${color('#ffffff', `\x1b[1m${p.name}`)} ${dim(formName(p))} ${color('#ffd700', `Lv${p.level}`)} ${buffLine(p)}`,
    `${color('#e53935', '♥')} ${bar(hpF, 16, hpColor(hpF), '#3a3a3a', ['▰', '▱'])} ${dim(`${p.hp}/${s.maxHp}`)}`,
    `${color('#4fa3ff', '✦')} ${bar(p.xp / need, 16, '#4fa3ff', '#3a3a3a', ['▰', '▱'])} ${dim(`${p.xp}/${need}`)}`,
    statLine(s, dim, p.level),
    `${gear('weapon', 24)}  ${gear('armor', 24)}`,
    `${gear('helmet', 24)}  ${gear('boots', 24)}`,
    gear('charm', 24),
    p.faint > 0 ? dim(`💤 fainted — back in ${p.faint} ticks`) : e ? dim(short(`${e.text} · ${ago(e.t)}`, 52)) : dim('patrolling the codebase…'),
    next ? dim(`✨ Lv${next}${lean && p.stage >= 1 ? ` · leaning ${BRANCHES[lean.branch].forms[0]}${p.stage === 2 ? ' traits' : ''}` : ''}`) : dim('👑 final form'),
  ];
  const rows = Math.max(sprite.length, card.length);
  const out = [];
  for (let i = 0; i < rows; i++) out.push(`${sprite[i] || ' '.repeat(16)}  ${card[i] || ''}`);
  return out;
}

function statusLines(p) {
  const s = petStats(p), need = xpToNext(p.level);
  const hpF = p.hp / s.maxHp;
  const dim = (t) => color('#8a8a8a', t);
  let l1 = `${emoji(p)} ${color('#ffffff', `\x1b[1m${p.name}`)} ${dim(formName(p))} ${color('#ffd700', `Lv${p.level}`)} `;
  l1 += `${color('#e53935', '♥')}${bar(hpF, 8, hpColor(hpF), '#3a3a3a', ['▰', '▱'])} `;
  l1 += `${color('#4fa3ff', '✦')}${bar(p.xp / need, 8, '#4fa3ff', '#3a3a3a', ['▰', '▱'])}`;
  const w = p.gear.weapon;
  if (w) l1 += ` ${dim('⚔')} ${color(RARITY[w.rarity].color, w.name.length > 18 ? `${w.name.slice(0, 17)}…` : w.name)}`;
  l1 += ` ${buffLine(p)}`;
  let l2;
  if (p.faint > 0) l2 = `  ${dim('💤 fainted — recovering, back in')} ${p.faint} ${dim('ticks')}`;
  else {
    const e = p.log[p.log.length - 1];
    const icon = { fight: '⚔', boss: '💀', faint: '💤', level: '⬆', evolve: '✨', wake: '☀', flee: '💨', town: '🏘', shop: '🛒', box: '🎁', craft: '⚒', code: '⌨' }[e && e.type] || '·';
    l2 = e ? `  ${icon} ${dim(e.text)} ${color('#5a5a5a', ago(e.t))}` : `  ${dim('· patrolling the codebase…')}`;
  }
  return [l1, l2];
}


function fightFrames(lf, name) {
  const m = lf.monster, frames = [];
  const fast = lf.rounds.length > 14;
  let php = lf.petStartHp, mhp = m.maxHp;
  const base = (o) => ({ fight: lf, php, mhp, petDx: 0, monDx: 0, ...o });
  for (let i = 4; i >= 0; i--) frames.push(base({ monDx: i * 3, caption: [`A wild ${m.name} (Lv ${m.level}) appears!`, m.boss ? '#ff5252' : '#ffffff'] }));
  let label = [`${m.name} (Lv ${m.level})`, '#ffffff'];
  for (const r of lf.rounds) {
    const info = roundInfo(name, m, r);
    if (r.a === 'retreat') {
      label = [info.text, info.color];
      for (let k = 0; k < 3; k++) frames.push(base({ petDx: -k * 2, caption: label }));
      continue;
    }
    if (info.lunge) frames.push(base(info.lunge === 'pet' ? { petDx: 2, caption: label } : { monDx: -2, caption: label }));
    label = [info.text, info.color];
    php = r.php; mhp = r.mhp;
    const hit = info.target === 'mon' ? { monTint: 0.7, monTintColor: info.tint } : info.target === 'pet' ? { petTint: 0.7, petTintColor: info.tint } : {};
    frames.push(base({ ...hit, caption: label }));
    if (!fast) frames.push(base({ caption: label }));
  }
  const loot = lootOf(lf);
  const end = lf.result === 'win'
    ? { monGone: true, caption: [`Victory! +${lf.xp} XP${loot.length ? `  ·  ${loot.map((l) => l.name).join(' · ')}` : ''}`, loot.length ? lootColor(loot[0]) : '#69f0ae'] }
    : lf.result === 'loss'
      ? { petGray: true, caption: ['fainted… resting it off', '#9e9e9e'] }
      : lf.result === 'retreat'
        ? { caption: ['retreated to fight another day', '#9e9e9e'] }
        : { monGone: true, caption: [`${m.name} fled`, '#9e9e9e'] };
  if (lf.result === 'win') frames.push(base({ monGray: true }), base({ monGray: true, monTint: 0.5 }));
  for (let i = 0; i < 14; i++) frames.push(base(end));
  return frames;
}

function composeChest(id, open) {
  const c = hex(BOXES[id].color);
  const toHex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return {
    grid: ART[open ? 'chestOpen' : 'chest'].map((row) => row.split('')),
    pal: { o: '#2b1a12', b: toHex(c), h: toHex(mixRgb(c, [255, 255, 255], 0.45)), l: '#ffd700', y: '#fff59d' },
  };
}

const SPARKS = [layer('y', [[1, 3], [2, 6], [0, 9], [2, 11], [3, 2]]), layer('y', [[0, 5], [2, 8], [1, 12], [3, 4], [1, 1]])];

function composeAnvil(sparkFrame) {
  const grid = ART.anvil.map((row) => row.split(''));
  if (sparkFrame != null) paint(grid, SPARKS[sparkFrame % 2]);
  return { grid, pal: { o: '#1b1b1f', b: '#5f6b7a', h: '#9aa7b5', y: '#ffd54f' } };
}

function craftFrames(lc) {
  const frames = [];
  for (const c of lc.done) {
    const verb = { fuse: '⚒ fusing', infuse: '⚒ infusing', enchant: '⚒ enchanting' }[c.kind];
    for (const input of c.inputs) for (let i = 0; i < 4; i++) frames.push({ anvil: { spark: i }, monDx: i % 2 ? -1 : 0, caption: [`${verb}: ${input}`, '#bdbdbd'] });
    for (let i = 0; i < 3; i++) frames.push({ anvil: { spark: i }, anvilFlash: 0.8 - i * 0.25, caption: ['⚒ ✦ ✦ ✦', '#ffd54f'] });
    for (let i = 0; i < 10; i++) frames.push({ anvil: {}, caption: [`crafted ${c.result}`, RARITY[c.rarity].color] });
  }
  return frames;
}

function boxFrames(lb) {
  const frames = [];
  for (const { id, contents } of lb.opened) {
    const title = [`${BOXES[id].name}!`, BOXES[id].color];
    for (let i = 0; i < 8; i++) frames.push({ chest: { id, open: false, dx: i % 2 ? 1 : -1 }, caption: title });
    for (let i = 0; i < 3; i++) frames.push({ chest: { id, open: true }, chestFlash: 0.7 - i * 0.2, caption: title });
    for (const c of contents) for (let i = 0; i < 6; i++) frames.push({ chest: { id, open: true }, caption: [`${c.equipped ? '★ equipped ' : ''}${c.name}`, c.rarity != null ? RARITY[c.rarity].color : '#ffd54f'] });
  }
  return frames;
}

function evolveFrames(evo) {
  const frames = [];
  for (let i = 0; i < 16; i++) frames.push({ form: i % 2 && i > 5 ? evo.to : evo.from, flash: i % 3 === 0 ? 0.85 : 0.2, caption: ['What? Your pet is evolving!', '#ffd700'] });
  for (let i = 0; i < 16; i++) frames.push({ form: evo.to, flash: i < 3 ? 0.6 : 0, caption: ['✨ Evolution complete! ✨', '#ffd700'] });
  return frames;
}

const vis = (s) => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').length;
const padTo = (s, w) => s + ' '.repeat(Math.max(0, w - vis(s)));
const center = (s, w) => ' '.repeat(Math.max(0, Math.floor((w - vis(s)) / 2))) + s;

function draw(p, f, frame) {
  const cols = process.stdout.columns || 80, rows = process.stdout.rows || 24;
  const scale = cols >= 84 && rows >= 44 ? 2 : 1;
  const cw = 16 * scale, gutter = 3 * scale;
  const s = petStats(p);
  const fightMon = f.fight && !f.monGone ? f.fight.monster : null;
  const form = f.form || (f.fight ? f.fight.form : { stage: p.stage, branch: p.branch, secondary: p.secondary });
  const resting = !f.fight && p.faint > 0;
  const petArt = composePet(form, p, { blink: !f.fight && frame % 23 === 0, sparkle: frame % 8 < 4 });
  const petLines = renderSprite(petArt, {
    scale, dy: f.fight || resting ? 0 : frame % 6 < 3 ? 0 : -1,
    gray: f.petGray || resting,
    tint: f.flash ? '#ffffff' : f.petTint ? f.petTintColor || '#ff1744' : null, amount: f.flash || f.petTint || 0,
  });
  const monLines = f.anvil
    ? renderSprite(composeAnvil(f.anvil.spark), { scale, tint: f.anvilFlash ? '#ffffff' : null, amount: f.anvilFlash || 0 })
    : f.chest
    ? renderSprite(composeChest(f.chest.id, f.chest.open), { scale, dy: f.chest.open ? 0 : frame % 2 ? -1 : 0, tint: f.chestFlash ? '#ffffff' : null, amount: f.chestFlash || 0 })
    : fightMon
    ? renderSprite(composeMonster(fightMon), { scale, dy: frame % 4 < 2 ? 0 : -1, gray: f.monGray, tint: f.monTint ? f.monTintColor || '#ff1744' : null, amount: f.monTint || 0 })
    : petLines.map(() => '');

  const out = [];
  out.push('');
  out.push(center(`${color('#ffd700', '✦ CLAUDE PET ✦')}  ${color('#ffffff', `\x1b[1m${p.name}`)} ${color('#9e9e9e', 'the')} ${color('#ffffff', formName({ ...p, ...form }))}  ${color('#ffd700', `Lv ${p.level}`)}`, cols));
  out.push('');
  const petDx = f.petDx || 0, monDx = f.monDx || (f.chest && f.chest.dx) || 0;
  const leftPad = Math.max(1, Math.floor((cols - (cw * 2 + gutter * 2 + 4 * scale)) / 2));
  for (let i = 0; i < petLines.length; i++) {
    const L = ' '.repeat(gutter + petDx * scale) + petLines[i];
    const R = monLines[i] ? ' '.repeat(Math.max(0, gutter + monDx * scale)) + monLines[i] : '';
    out.push(' '.repeat(leftPad) + padTo(L, cw + gutter * 2) + ' '.repeat(4 * scale) + R);
  }
  const php = f.fight ? f.php : p.hp, pmax = f.fight ? f.fight.petMaxHp : s.maxHp;
  const hpLine = (cur, max) => `${bar(cur / max, cw - 2, hpColor(cur / max))}`;
  const petHp = padTo(' '.repeat(gutter) + hpLine(php, pmax), cw + gutter * 2);
  const monHp = fightMon ? ' '.repeat(gutter) + hpLine(f.mhp, fightMon.maxHp) : '';
  out.push(' '.repeat(leftPad) + petHp + ' '.repeat(4 * scale) + monHp);
  const petHpTxt = padTo(' '.repeat(gutter) + color('#9e9e9e', `HP ${Math.round(php)}/${pmax}`), cw + gutter * 2);
  const weak = fightMon && MONSTERS[fightMon.kind].weak;
  const monTxt = fightMon ? ' '.repeat(gutter) + color(fightMon.boss ? '#ff5252' : '#9e9e9e', `${fightMon.name} Lv${fightMon.level}`) + (weak ? ` ${color('#8a8a8a', `weak ${ELEMENTS[weak].icon}`)}` : '') : '';
  out.push(' '.repeat(leftPad) + petHpTxt + ' '.repeat(4 * scale) + monTxt);
  out.push('');
  let caption = f.caption;
  if (!caption) {
    if (resting) caption = [`z Z z  fainted — back in ${p.faint} ticks`, '#9e9e9e'];
    else caption = [['patrolling the codebase', 'sniffing for bugs', 'guarding your diff', 'waiting for monsters'][Math.floor(frame / 40) % 4] + '.'.repeat(1 + (frame >> 2) % 3), '#7a7a7a'];
  }
  out.push(center(color(caption[1], `\x1b[1m${caption[0]}`), cols));
  out.push('');

  const dim = (t) => color('#8a8a8a', t);
  const need = xpToNext(p.level);
  out.push(`  ${dim('XP')} ${bar(p.xp / need, Math.min(30, cols - 20), '#4fa3ff')} ${dim(`${p.xp}/${need}`)}`);
  out.push(`  ${statLine(s, dim, p.level)}${s.multi ? ` ${dim('MULTI')} ${pct(s.multi)}` : ''}${s.regen ? ` ${dim('REGEN')} +${pct(s.regen)}` : ''}`);
  const town = TOWN_EVERY - (p.stats.fights % TOWN_EVERY);
  out.push(`  ${color('#ffd54f', `💰 ${p.gold}g`)}  ${dim(`· town & full heal in ${town} fight${town > 1 ? 's' : ''}`)}`);
  if (p.lastShop && p.lastShop.bought.length) {
    for (const b of p.lastShop.bought.slice(0, 3)) out.push(`  ${dim('🛒')} ${color(b.rarity != null ? RARITY[b.rarity].color : '#ffd54f', b.name)} ${dim(`${b.price}g — ${short(b.why, Math.max(10, cols - b.name.length - 16))}`)}`);
  }
  const fx = [p.potions ? color('#69f0ae', `🧪 ${p.potions}/${MAX_POTIONS} Energy Drinks`) : '', ...p.buffs.map((b) => color('#ff7043', `${BUFFS[b.id].icon} ${BUFFS[b.id].name} (${b.fights})`))].filter(Boolean);
  if (fx.length) out.push(`  ${fx.join('  ')}`);
  const tomes = Object.entries(p.bonus).map(([k, v]) => `+${k === 'crit' ? pct(v) : r1(v)} ${k}`);
  if (tomes.length) out.push(`  ${dim(`📖 tomes: ${tomes.join(' · ')}`)}`);
  for (const slot of SLOTS) {
    const it = p.gear[slot];
    const st = it ? Object.entries(it.stats).map(([k, v]) => `${v < 0 ? '' : '+'}${['crit', 'lifesteal', 'thorns', 'regen', 'resist'].includes(k) ? pct(v) : v} ${k === 'def' ? 'armor' : k === 'evasion' ? 'evasion rating' : k}`).join(' ') : '';
    const E = it && it.element && ELEMENTS[it.element];
    out.push(`  ${E ? E.icon : dim(GEAR_ICON[slot])} ${it ? `${color(RARITY[it.rarity].color, it.name)} ${E ? color(E.color, it.element) + ' ' : ''}${dim(st)}` : dim('— empty —')}`);
  }
  const nextStage = STAGE_LEVELS[p.stage + 1];
  const lean = leaning(p);
  if (nextStage) {
    let t = `next evolution at Lv ${nextStage}`;
    if (p.stage >= 1 && lean) t += ` · leaning ${p.stage === 1 ? BRANCHES[lean.branch].forms[0] : `${BRANCHES[lean.branch].forms[0]} traits`} (${lean.bucket} ${Math.round(lean.share * 100)}%)`;
    out.push(`  ${color('#ffd700', '✨')} ${dim(t)}`);
  } else out.push(`  ${color('#ffd700', '👑')} ${dim('final form reached')}`);
  out.push(`  ${dim(`kills ${p.stats.kills} · bosses ${p.stats.bosses} · faints ${p.stats.faints} · items ${p.stats.items} · crafted ${p.stats.crafted || 0} · ticks ${p.stats.ticks}`)}`);
  out.push('');
  const room = rows - out.length - 1;
  const icons = { fight: '⚔', boss: '☠', faint: 'z', level: '⬆', evolve: '✨', wake: '☀', flee: '~', town: '⌂', shop: '$', box: '🎁', craft: '⚒', code: '⌨' };
  for (const e of p.log.slice(-Math.max(0, room)).reverse()) {
    const c = { boss: '#ff5252', evolve: '#ffd700', level: '#69f0ae', faint: '#9e9e9e', town: '#80cbc4', shop: '#ffd54f', box: '#e040fb', craft: '#ffb74d', code: '#4dd0e1' }[e.type] || '#bdbdbd';
    out.push(`  ${color('#5a5a5a', ago(e.t).padStart(7))} ${icons[e.type] || '·'} ${color(c, e.text.slice(0, cols - 14))}`);
  }
  process.stdout.write('\x1b[H' + out.slice(0, rows).map((l) => l + '\x1b[K').join('\n') + '\x1b[J');
}

function watch() {
  const out = process.stdout;
  out.write('\x1b[?1049h\x1b[?25l\x1b[2J');
  process.on('exit', () => out.write(`${RESET}\x1b[?25h\x1b[?1049l`));
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(0));
  out.on('resize', () => out.write('\x1b[2J'));

  let p = load() || newPet(), mtime = 0, frame = 0;
  const queue = p.lastFight ? fightFrames(p.lastFight, p.name) : [];
  let seenFight = p.lastFight && p.lastFight.id;
  let seenEvo = p.evolution && p.evolution.at;
  let seenBoxes = p.lastBoxes && p.lastBoxes.t;
  let seenCraft = p.lastCraft && p.lastCraft.t;
  setInterval(() => {
    if (frame % 3 === 0) {
      try {
        const m = fs.statSync(STATE).mtimeMs;
        if (m !== mtime) {
          mtime = m;
          p = load() || p;
          if (p.lastFight && p.lastFight.id !== seenFight) { seenFight = p.lastFight.id; queue.length = 0; queue.push(...fightFrames(p.lastFight, p.name)); }
          if (p.evolution && p.evolution.at !== seenEvo) { seenEvo = p.evolution.at; queue.push(...evolveFrames(p.evolution)); }
          if (p.lastBoxes && p.lastBoxes.t !== seenBoxes) { seenBoxes = p.lastBoxes.t; queue.push(...boxFrames(p.lastBoxes)); }
          if (p.lastCraft && p.lastCraft.t !== seenCraft) { seenCraft = p.lastCraft.t; queue.push(...craftFrames(p.lastCraft)); }
        }
      } catch {}
    }
    frame++;
    draw(p, queue.length ? queue.shift() : {}, frame);
  }, 160);
}


function sim(n, bucket) {
  const buckets = [...Array(74).fill('bash'), ...Array(10).fill('read'), ...Array(8).fill('edit'), ...Array(4).fill('fail'), 'agent', ...Array(3).fill(null)];
  for (let i = 0; i < n; i++) withLock((p) => tick(p, bucket || pick(buckets), 'tick'));
  const p = load();
  console.log(`${emoji(p)} ${p.name} ${formName(p)} Lv${p.level} kills=${p.stats.kills} faints=${p.stats.faints} bosses=${p.stats.bosses} items=${p.stats.items}`);
}

function status() {
  const p = load();
  if (!p) return console.log('No pet yet — it hatches from your next Claude Code tool call.');
  console.log(statusLines(p).join('\n'));
  console.log(renderSprite(composePet(p, p, { sparkle: true })).join('\n'));
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
  const script = fs.realpathSync(__filename);
  const run = (sub) => `"${process.execPath}" "${script}" ${sub}`;
  stripHooks(settings);
  settings.hooks = settings.hooks || {};
  for (const ev of HOOK_EVENTS) (settings.hooks[ev] ||= []).push({ matcher: '', hooks: [{ type: 'command', command: run('hook'), timeout: 5, async: true }] });
  const cur = settings.statusLine;
  if (cur && cur.command && !isOurs(cur.command, 'statusline')) setConfig('inner', cur.command);
  settings.statusLine = { ...(cur || {}), type: 'command', command: run('statusline'), refreshInterval: 1 };
  writeSettings(settings);
  console.log(`claude-pet installed into ${SETTINGS}${cur && cur.command && !isOurs(cur.command, 'statusline') ? ' (your existing statusline is kept above the pet)' : ''}.`);
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
  console.log(`claude-pet removed from ${SETTINGS}. Your pet's save stays in ${HOME} (delete it to start over).`);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'hook') hook();
  else if (cmd === 'statusline') statusline();
  else if (cmd === 'watch' || !cmd) watch();
  else if (cmd === 'status') status();
  else if (cmd === 'sim') sim(parseInt(args[0] || '100', 10), args[1]);
  else if (cmd === 'sprite') { setConfig('sprite', args[0] !== 'off'); console.log(`statusline sprite ${args[0] === 'off' ? 'off' : 'on'}`); }
  else if (cmd === 'install') install();
  else if (cmd === 'uninstall') uninstall();
  else if (cmd === 'reset') { fs.rmSync(STATE, { force: true }); console.log('Pet released into the wild.'); }
  else console.log('usage: pet [watch|status|install|uninstall|sprite on|off|sim <n> [bucket]|reset]');
} catch (e) {
  if (cmd !== 'hook' && cmd !== 'statusline') throw e;
}
