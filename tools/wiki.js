#!/usr/bin/env node
'use strict';
// Builds docs/WIKI.md from the game's own tables, so the numbers can't drift from the code: node tools/wiki.js
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.join(__dirname, '..');
const file = path.join(root, 'pet.js');
const exportsList = ['SPECIES', 'NATURES', 'BRANCHES', 'FORMS', 'MONSTERS', 'KINDS_BY_BUCKET', 'BOSS_KINDS', 'ELITE_KINDS', 'RARITY', 'ELEMENTS', 'ROLL_ELEMENTS',
  'ELEMENT_CHANCE', 'AFFIX_CHANCE', 'SLOTS', 'WEAPON_TYPES', 'GEAR_BASES', 'SLOT_STATS', 'AFFIXES', 'BUFFS', 'TOMES', 'BOXES', 'UNIQUES', 'SETS', 'SET_CHANCE',
  'UNIQUE_CHANCE', 'MAX_POTIONS', 'TOWN_EVERY', 'SPAWN_CHANCE', 'FAINT_TICKS', 'BOSS_EVERY', 'MAX_PLUS', 'NULL_GAZE', 'MONARCH_CHANCE', 'SECRET_CHANCE',
  'STAGE_LEVELS', 'xpToNext', 'petStats', 'newPet', 'evadeChance', 'itemPower', 'gearPrice', 'sellValue', 'craftFee', 'SECRET'];
const src = fs.readFileSync(file, 'utf8').replace(/\nconst HOOK_EVENTS[\s\S]*$/, '') + `\nmodule.exports = { ${exportsList.join(', ')} };`;
const mod = new Module(file);
mod.filename = file;
mod.paths = Module._nodeModulePaths(root);
mod._compile(src, file);
const G = mod.exports;

const pct = (v) => `${Math.round(v * 1000) / 10}%`;
const num = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
const LABEL = { atk: 'ATK', def: 'armor', maxHp: 'HP', spd: 'SPD', evasion: 'evasion rating', crit: 'crit', lifesteal: 'lifesteal', regen: 'regen', resist: 'resist', thorns: 'thorns', multi: 'multi-hit' };
const PCT = new Set(['crit', 'lifesteal', 'regen', 'resist', 'thorns', 'multi']);
const stat = ([k, v]) => `${v < 0 ? '−' : '+'}${PCT.has(k) ? pct(Math.abs(v)) : num(Math.abs(v))} ${LABEL[k] || k}`;
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const statDelta = (fn) => {
  const base = { maxHp: 100, atk: 100, def: 100, spd: 100, crit: 0.1, multi: 0, evasion: 100, regen: 0 };
  const s = { ...base };
  fn(s);
  return Object.keys(base).filter((k) => s[k] !== base[k]).map((k) => (['crit', 'multi', 'regen'].includes(k) ? `${s[k] > base[k] ? '+' : '−'}${pct(Math.abs(s[k] - base[k]))} ${LABEL[k]}` : `${s[k] > base[k] ? '+' : '−'}${Math.round(Math.abs(s[k] - base[k]))}% ${LABEL[k]}${k === 'evasion' && s[k] - base[k] !== 15 ? '' : ''}`)).join(', ');
};

const out = [];
const h = (n, t) => out.push(`\n${'#'.repeat(n)} ${t}\n`);
const p = (t) => out.push(t);

out.push('# claude-pet wiki');
p('\nEvery number on this page is generated from the game code by `node tools/wiki.js`, so it matches the version you are running.\n');
p('**Contents:** [Ticks and fights](#ticks-and-fights) · [Your pet](#your-pet) · [Shiny pets](#shiny-pets) · [Natures](#natures) · [Classes](#classes) · [Stats and combat](#stats-and-combat) · [Monsters](#monsters) · [Loot and drop rates](#loot-and-drop-rates) · [Items](#items) · [Uniques](#uniques) · [Sets](#sets) · [Consumables](#consumables) · [Crates](#crates) · [Town, shop and blacksmith](#town-shop-and-blacksmith) · [Crafting](#crafting) · [Coding events](#coding-events) · [The Demon King](#the-demon-king) · [The secret boss](#the-secret-boss) · [Levels and XP](#levels-and-xp)');

h(2, 'Ticks and fights');
p(table(['What', 'Value'], [
  ['A tick', 'every tool call Claude makes (PostToolUse, PostToolUseFailure, SubagentStart, Stop)'],
  ['Monster spawn chance per tick', `${pct(G.SPAWN_CHANCE)} (${pct(0.35)} after a failed tool call)`],
  ['HP regeneration per tick', '5% of max HP + your regen stat'],
  ['XP per tick', '1, plus kill XP'],
  ['Boss', `every ${G.BOSS_EVERY} kills, once the pet has at least 75% HP (a lost boss comes back 10 kills later)`],
  ['Town visit', `every ${G.TOWN_EVERY} fights: full heal, crates, crafting, selling, shopping`],
  ['Fainting', `out for ${G.FAINT_TICKS} ticks, then back at 50% HP`],
  ['Retreat', 'below 15% HP while the monster is above 25%, a 60% chance per round to flee instead of fainting'],
  ['Potions', `carried up to ${G.MAX_POTIONS}; one is drunk before a fight below 50% HP and during a fight below 30% HP (+60% HP)`],
  ['Losing streak', '2 losses in the last 5 fights makes the pet pick monsters 1–3 levels below it'],
]));

h(2, 'Your pet');
p(`The egg hatches at Lv ${G.STAGE_LEVELS[1]}, evolves at Lv ${G.STAGE_LEVELS[2]} and reaches its final form at Lv ${G.STAGE_LEVELS[3]}.`);
p('\nWhile it is an egg it records your tool mix, the hours you code, the file extensions you edit, how many repos you work in (hashed) and your commits and test runs. At hatching all of that is hashed into a SHA-256 seed that decides the species, the nature and the shiny roll. `pet seed` shows the seed.\n');
p(table(['Species', 'Forms (Lv 5 → 15 → 30)', 'Signature skill'], Object.entries(G.SPECIES).map(([, sp]) => [
  `${sp.emoji} ${sp.label}`,
  sp.forms.map((f) => G.FORMS[f].name).join(' → '),
  { 'Ember Breath': 'Ember Breath: innate fire element (burns), even without a fire weapon', 'Static Pounce': 'Static Pounce: always strikes first, +20% multi-hit', 'Null Gaze': `Null Gaze: ${pct(G.NULL_GAZE)} chance to erase any enemy attack` }[sp.signature],
])));
p('\nThe final form gets +20% HP, ATK and armor on top of its level.');

h(2, 'Shiny pets');
p('Every seed has a **1 in 128** chance to be shiny. A shiny pet shifts the hue of its body, highlight, belly and wing colours by 150°, keeping its outline and eyes. It looks rare but plays exactly the same. The header and `pet seed` show ✦ shiny.\n');
p('![Normal and shiny versions of every form](shiny.png)\n');
p('*Top: normal. Bottom: shiny.*');

h(2, 'Natures');
p('The seed also picks one of 8 natures: a small, permanent stat lean.\n');
p(table(['Nature', 'Effect'], Object.entries(G.NATURES).map(([n, fn]) => [n, {
  Bold: '+5% ATK', Restless: '+8% SPD', Calm: '+6% armor', Reckless: '+8% ATK, −5% armor', Patient: '+1% HP regen per tick', Curious: '+2% crit', Stubborn: '+6% max HP', Sly: '+15% evasion rating, +3 flat',
}[n] || statDelta(fn)])));

h(2, 'Classes');
p('At Lv 15 the pet takes the class of whatever you did **more than you usually do** while it grew. Your own lifetime tool mix is the baseline. The class tints its markings and gives a bonus.\n');
p(table(['Class', 'Comes from', 'Bonus'], Object.entries(G.BRANCHES).map(([, b]) => [b.cls, { bash: 'Bash', edit: 'edits', read: 'reads and searches', fail: 'failed tool calls', agent: 'subagents' }[b.bucket], {
  Shell: '+25% ATK', Scribe: '+40% armor, +15% HP', Seeker: '+15% crit', Chaos: '+35% ATK, +8% crit, −20% armor', Hive: '+25% multi-hit, +30% SPD',
}[b.cls]])));

h(2, 'Stats and combat');
const L = (lv) => { const q = G.newPet(); q.level = lv; return G.petStats(q); };
p('Base stats before gear, by level:\n');
p(table(['Level', 'HP', 'ATK', 'Armor', 'SPD', 'Evasion rating'], [1, 10, 20, 30, 40].map((lv) => { const s = L(lv); return [lv, s.maxHp, num(s.atk), num(s.def), num(s.spd), num(s.evasion)]; })));
p(`\n- **Damage:** attack × 0.85–1.15, minus half the target's armor (at least 1). Crits deal 2× (2.5× with The Linter's Edge, +0.3× with the Hacker set). Monsters crit 5% of the time.
- **Evasion:** rating ÷ (rating + 40 + 8 × monster level), capped at 60%. The same rating dodges less against stronger monsters.
- **Caps:** crit 75%, lifesteal 30%, thorns 50%, resist 75%.
- **Elements:** a weakness takes 1.5× damage (2× with the Rubber Duck of Insight), a resistance 0.6×. The Legacy Monolith resists every element except shadow.
  - 🔥 fire: 35% chance to burn for 3 rounds at 30% of the hit
  - ☠ poison: 50% chance to add a stack (up to 5), each worth 8% of ATK per round
  - ❄ frost: 25% chance to freeze the monster for a turn
  - ⚡ lightning: 30% chance to chain a second hit at 60%
  - 🌑 shadow: every hit burns, ignoring resistance (Abyssal Scythe only)
- **Scaling:** monster HP follows your offence and monster ATK follows your toughness (HP, armor, evasion), so neither glass cannons nor tanks trivialise fights.`);

h(2, 'Monsters');
p('Base multipliers on top of the level formula: HP (18 + 10 × level), ATK (4 + 2.2 × level), armor (1 + 0.8 × level), SPD (4 + 0.5 × level).\n');
const where = (k) => Object.entries(G.KINDS_BY_BUCKET).filter(([, ks]) => ks.includes(k)).map(([b]) => b).join(', ');
p(table(['Monster', 'Names', 'HP', 'ATK', 'Armor', 'SPD', 'Weak', 'Resists', 'Inflicts', 'Dodge', 'Spawns from'], Object.entries(G.MONSTERS).filter(([k]) => k !== 'secret').map(([k, m]) => [
  k, m.names.join(' / '), `×${m.hp}`, `×${m.atk}`, `×${m.def}`, `×${m.spd}`,
  m.weak ? `${G.ELEMENTS[m.weak].icon} ${m.weak}` : '—', m.resist === 'all' ? 'all' : m.resist ? `${G.ELEMENTS[m.resist].icon} ${m.resist}` : '—',
  m.attack ? `${G.ELEMENTS[m.attack].icon} ${m.attack} (${pct(m.proc)})` : '—', pct(m.evade),
  m.bossOnly || k === 'boss' ? 'boss fights' : m.eliteOnly ? 'elite rolls' : where(k),
])));
p(`\n- **Elites:** 10% of spawns (1.4× HP, 1.15× ATK). Half of elite rolls become a Phishing Mimic or a Dependency Hydra. Killing a mimic drops a real crate (25% golden, otherwise iron).
- **Bosses:** ${G.BOSS_KINDS.map((k) => G.MONSTERS[k].names.join(' / ')).join(', and ')}. One level above you, 1.8× HP, 1.05× ATK.
- **Failing Test Hydra:** a failed test run spawns an elite ambush on the next tick (1.4× HP, 1.15× ATK).`);

h(2, 'Loot and drop rates');
p(table(['After a win', 'Normal', 'Elite', 'Boss'], [
  ['Gear drops', '55% for 1 item', '80% for 1 item', '2 items, guaranteed'],
  ['Rarity weights (common / rare / epic / legendary)', '58 / 29 / 10 / 3', '25 / 45 / 23 / 7', '0 / 35 / 45 / 20'],
  ['Consumable', '25%', '25%', 'guaranteed'],
  ['Crate', '7.7% wooden · 2% iron · 0.3% golden', '35% iron · 5% golden', '80% golden · 20% mythic'],
  ['Unique', `${pct(G.UNIQUE_CHANCE)} of legendary drops`, `${pct(G.UNIQUE_CHANCE)} of legendary drops`, `+3% extra roll`],
  ['XP', '6 + 3 × level', '×2', '×5'],
  ['Gold', '(3 + 1.2 × level) × 0.7–1.3', '×2', '×5'],
]));
p(`\n- **Set pieces:** ${pct(G.SET_CHANCE)} of epic-or-better items roll as part of a set when their slot fits one.
- **Elements:** chance by rarity: ${G.ELEMENT_CHANCE.slice(0, 4).map((c, i) => `${G.RARITY[i].name} ${pct(c)}`).join(', ')}.
- **Affixes:** chance by rarity: ${G.AFFIX_CHANCE.slice(0, 4).map((c, i) => `${G.RARITY[i].name} ${pct(c)}`).join(', ')}. Legendary and up roll a second affix.
- **Auto-equip:** the pet equips a drop when it scores higher than what's in the slot. The score is power, plus a pull towards uniques and towards finishing a set.`);

h(2, 'Items');
p(table(['Rarity', 'Stat multiplier', 'Name prefixes', 'How to get it'], G.RARITY.map((r) => [r.name, `×${r.mult}`, r.prefix.join(', '), {
  common: 'drops', rare: 'drops, shop', epic: 'drops, shop, fusion', legendary: 'drops, shop, Legendary Merchant, fusion, ascension', mythic: 'only by fusing 3 legendaries or ascending a legendary', demon: 'only the Demon King\'s Abyssal Scythe',
}[r.name]])));
p('\n**Base stats per slot** (before rarity multiplier and affixes; L = item level):\n');
const formula = { weapon: 'ATK (1.5 + 0.7 L) × weapon type', armor: 'armor (1 + 0.45 L), HP (4 + 2 L)', helmet: 'armor (0.5 + 0.25 L), HP (3 + 1.5 L)', boots: 'SPD (0.4 + 0.12 L), armor (0.3 + 0.15 L), evasion (2 + 0.8 L)', charm: 'crit 1.5%, SPD (0.3 + 0.08 L), evasion (1 + 0.4 L)' };
p(table(['Slot', 'Formula', 'Rare at Lv 10', 'Legendary at Lv 30', 'Bases'], G.SLOTS.map((slot) => [
  slot, formula[slot],
  Object.entries(G.SLOT_STATS[slot](10, G.RARITY[1].mult, G.WEAPON_TYPES.sword)).map(stat).join(', '),
  Object.entries(G.SLOT_STATS[slot](30, G.RARITY[3].mult, G.WEAPON_TYPES.sword)).map(stat).join(', '),
  slot === 'weapon' ? 'see weapon types' : G.GEAR_BASES[slot].join(', '),
])));
p('\n**Weapon types:**\n');
p(table(['Type', 'ATK', 'Extra', 'Names'], Object.entries(G.WEAPON_TYPES).map(([t, w]) => [t, `×${w.atk}`, Object.entries(w.extra).map(stat).join(', ') || '—', w.names.join(', ')])));
p('\n**Affixes** (shown at Lv 20, ×1 rarity; they scale with both):\n');
p(table(['Affix', 'Adds'], G.AFFIXES.map((a) => [a.name, Object.entries(a.stats(20, 1)).map(stat).join(', ')])));
p('\n**Power score (PWR):** ATK ×1 + armor ×1.2 + HP ×0.15 + crit ×100 + SPD ×0.8 + lifesteal ×150 + thorns ×60 + regen ×400 + resist ×80 + evasion ×0.6, plus a bonus for having an element.');

h(2, 'Uniques');
p('Six one-of-a-kind legendaries. You can own each only once, they are never sold, and they level up with your pet at every town visit (keeping their reforges).\n');
p(table(['Unique', 'Slot', 'Effect', 'Stats at Lv 30'], Object.entries(G.UNIQUES).map(([, u]) => [`★ ${u.name}`, u.type || u.slot, u.desc, Object.entries(u.stats(30)).map(stat).join(', ')])));
p(`\nDrop chances: ${pct(G.UNIQUE_CHANCE)} of legendary drops, +3% on bosses, 25% of Mythic Chests, and 10% of Legendary Merchant visits.`);

h(2, 'Sets');
p(table(['Set', 'Pieces', '3-piece bonus'], Object.entries(G.SETS).map(([, st]) => [`◆ ${st.label}`, st.slots.map((s) => (s === 'weapon' && st.type ? `${st.type} (weapon)` : s)).join(', '), st.bonus])));

h(2, 'Consumables');
p('A won fight has a 25% chance of a consumable (bosses always drop one):\n');
p(table(['Roll', 'Chance', 'Effect'], [
  ['Energy Drink', '43%', `carried (max ${G.MAX_POTIONS}); if full, drunk on the spot for a full heal`],
  ['Buff', '30%', 'a random buff for 5–8 fights'],
  ['Tome', '15%', 'a permanent stat increase'],
  ['Stack Overflow Scroll', '12%', '+5% of the current level\'s XP'],
]));
p('\n**Buffs:**\n');
p(table(['Buff', 'Effect'], Object.entries(G.BUFFS).map(([id, b]) => [`${b.icon} ${b.name}`, { rage: '+50% ATK', firewall: '+60% armor', overclock: '+50% SPD, +20% multi-hit', focus: '+20% crit', blessed: '+15% ATK and armor (from `git commit`, 6 fights)', smoke: 'evasion rating ×1.5 + 20' }[id]])));
p('\n**Tomes** (amount at Lv 20):\n');
p(table(['Tome', 'Permanent'], G.TOMES.map((t) => [t.name, stat([t.stat, t.amt(20)])])));

h(2, 'Crates');
p('Crates are opened at the next town visit.\n');
p(table(['Crate', 'Items', 'Rarity weights (c / r / e / l)', 'Gold', 'Extras'], Object.entries(G.BOXES).map(([id, b]) => [
  b.name, b.items, b.weights.join(' / '), `${b.gold[0]}–${b.gold[1]} × (1 + 0.1 × level)`, `${b.extras} consumable${b.extras === 1 ? '' : 's'}${id === 'mythic' ? ', a tome, +1 level, 25% unique' : ''}`,
])));
p('\nSources: fights (see drop rates), the shop (Iron Crate always, Golden Crate half the time), `gh pr create` (Iron Crate), and killing a Phishing Mimic.');

h(2, 'Town, shop and blacksmith');
p('Every visit the pet heals fully, opens its crates, crafts, then sells spare gear and shops. It keeps uniques and pairs of epic or better items waiting for a fusion. For every offer it works out a value from its situation (potions low, a boss due within 5 kills, recent losses, empty slots, the element its recent enemies are weak to) and buys the best value for money first. Each purchase is logged with the reason.\n');
p(table(['Offer', 'Price (L = pet level + 1)', 'When the pet buys it'], [
  ['3 gear pieces (one is always an elemental weapon)', 'power × 3 × (1 + 0.2 × rarity)', 'it beats the equipped item'],
  ['Energy Drink', '15 + 2 L', 'fewer than 3 carried'],
  ['A random buff', '30 + 4 L', 'a boss is due, a losing streak, or spare gold'],
  ['A random tome', '120 + 15 L', 'gold is at least twice the price'],
  ['Iron / Golden Crate', '60 + 8 L / 200 + 20 L', 'an empty slot, or gold over 4× the price'],
  [`Reforge (blacksmith, up to +${G.MAX_PLUS})`, 'half the item price × (1 + 0.25 per level)', '+10% to every stat of an equipped item'],
  ['Ascend (blacksmith)', 'item price × (1 + rarity)', 'raises an equipped item one rarity, up to mythic'],
  ['Legendary Merchant (15% of visits)', 'item price × 2.5 (uniques cost more)', 'a legendary, or a unique 10% of the time'],
]));
p('\nSelling a spare item pays 2 × its power.');

h(2, 'Crafting');
p(table(['Recipe', 'What it does', 'When'], [
  ['Fusion', '3 spare items of the same slot and rarity become 1 of the next rarity, keeping an element and the best reforge level', 'the result would beat what is equipped'],
  ['Infusion', 'moves a spare weapon\'s element onto the equipped weapon', 'the element hits recent enemies\' weakness, or the weapon has none'],
  ['Enchanting', 'moves an affix from spare gear onto equipped gear of the same slot', 'the target has room (2 affixes, 3 at legendary and up)'],
]));
p('\nEach craft costs (10 + 2 × level) × (1 + rarity tier) gold.');

h(2, 'Coding events');
p(table(['You run', 'In the game'], [
  ['`git commit`', '✨ Commit Blessing: +15% ATK and armor for 6 fights'],
  ['`git push`', '15 + 3 × level gold'],
  ['`gh pr create`', 'an Iron Crate'],
  ['tests that pass (npm test, pytest, cargo test, go test, …)', '3% of a level in XP'],
  ['tests that fail', 'a Failing Test Hydra ambushes the pet on the next tick'],
]));
p('\nThese only trigger when the command actually runs (at the start of the line or after `&&`, `;` or `|`), not when it merely appears in an `echo` or `grep`.');

h(2, 'The Demon King');
p(`At the Lv 30 evolution, and again at Lv 40 for pets that missed it, there is a ${pct(G.MONARCH_CHANCE)} chance the pet rises as the Demon King, Monarch of Shadows, instead of its normal final form.\n`);
p('- **Abyssal Scythe:** demon tier, locked to the Demon King. ATK (1.5 + 0.7 × level) × 6, 15% lifesteal, ×1.6 total ATK, and shadow flame on every hit (a burn that ignores resistance).\n- **Arise:** each kill has a 10% chance to raise a shadow soldier, up to 3. Every soldier strikes for 40% ATK at the start of each fight.');

h(2, 'The secret boss');
p(`Any fight has a ${G.SECRET_CHANCE === 0.001 ? '1 in 1000' : pct(G.SECRET_CHANCE)} chance of being ${G.SECRET.name} instead. He is scaled like a boss but with 4× HP and 1.4× ATK. He dodges 10% of attacks, has no weakness, and can't be fled from. Beat him once for a permanent 🏅 ${G.SECRET.name} Slayer badge, +5% XP forever, and a Mythic Chest. If you lose, he vanishes until the next roll.`);

h(2, 'Levels and XP');
p('XP to the next level is 25 × level^1.95. Roughly 10,000 tool calls get a pet to Lv 30.\n');
p(table(['Level', 'XP to next', 'Level', 'XP to next'], [1, 5, 10, 15, 20, 25].map((lv, i) => [lv, G.xpToNext(lv), [30, 35, 40, 50, 60, 75][i], G.xpToNext([30, 35, 40, 50, 60, 75][i])])));

fs.writeFileSync(path.join(root, 'docs', 'WIKI.md'), out.join('\n') + '\n');
console.log('wrote docs/WIKI.md');
