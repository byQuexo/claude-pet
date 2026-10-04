#!/usr/bin/env node
// Builds docs/WIKI.md from the game's own tables, so the numbers can't drift from the code: node tools/wiki.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as G from '../engine.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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

out.push('# idlemon wiki');
p('\nEverything about your pet, its gear and the monsters it meets.\n');
p('**Contents:** [How it plays](#how-it-plays) · [Your pet](#your-pet) · [Shiny pets](#shiny-pets) · [Natures](#natures) · [Classes](#classes) · [Stats](#stats) · [Elements](#elements) · [Monsters](#monsters) · [Loot](#loot) · [Items](#items) · [Uniques](#uniques) · [Sets](#sets) · [Consumables](#consumables) · [Crates](#crates) · [Town](#town) · [Crafting](#crafting) · [Coding events](#coding-events) · [The Demon King](#the-demon-king) · [The secret boss](#the-secret-boss) · [Levels](#levels)');

h(2, 'How it plays');
p(`Your pet plays on its own while you work. Monsters show up as you code, and more often right after something fails. Your pet fights them, collects loot and levels up.

- **Bosses** appear every ${G.BOSS_EVERY} kills, once your pet is healthy enough to take one on.
- **Town:** every ${G.TOWN_EVERY} fights your pet heads to town to heal, open crates, craft and go shopping.
- **Fainting:** a lost fight knocks your pet out for a short rest. It comes back at half health. Pets never die.
- **Playing it safe:** your pet drinks Energy Drinks when it's hurt, runs from fights it's about to lose, and picks easier fights after a losing streak.`);

h(2, 'Your pet');
p(`Every pet starts as an egg. The egg quietly watches how you work, then hatches at Lv ${G.STAGE_LEVELS[1]} into one of three species. That same moment decides its nature and whether it's shiny. Run \`/idlemon seed\` to see what yours got. It evolves again at Lv ${G.STAGE_LEVELS[2]} and reaches its final form at Lv ${G.STAGE_LEVELS[3]}, which is noticeably stronger.\n`);
p(table(['Species', 'Forms (Lv 5 → 15 → 30)', 'Signature skill'], Object.entries(G.SPECIES).map(([, sp]) => [
  `${sp.emoji} ${sp.label}`,
  sp.forms.map((f) => G.FORMS[f].name).join(' → '),
  { 'Ember Breath': '**Ember Breath:** every attack can set enemies on fire', 'Static Pounce': '**Static Pounce:** always strikes first and often hits twice', 'Null Gaze': `**Null Gaze:** ${pct(G.NULL_GAZE)} chance to erase an enemy attack` }[sp.signature],
])));

h(2, 'Shiny pets');
p('One pet in **128** hatches shiny, with its colours shifted to a rare alternate palette. Shinies are purely cosmetic and show ✦ shiny next to their name.\n');
p('![Normal and shiny versions of every form](shiny.png)\n');
p('*Top: normal. Bottom: shiny.*');

h(2, 'Natures');
p('Every pet hatches with one of 8 natures, a small permanent edge.\n');
p(table(['Nature', 'Effect'], Object.keys(G.NATURES).map((n) => [n, {
  Bold: '+5% ATK', Restless: '+8% SPD', Calm: '+6% armor', Reckless: '+8% ATK, −5% armor', Patient: 'heals a little faster', Curious: '+2% crit', Stubborn: '+6% max HP', Sly: '+15% evasion',
}[n]])));

h(2, 'Classes');
p('At Lv 15 your pet picks up a class based on what you\'ve been doing more of than usual. The class tints its markings and gives a bonus.\n');
p(table(['Class', 'Earned by', 'Bonus'], Object.values(G.BRANCHES).map((b) => [b.cls, { bash: 'running commands', edit: 'editing files', read: 'reading and searching', fail: 'things going wrong', agent: 'using subagents' }[b.bucket], {
  Shell: '+25% ATK', Scribe: '+40% armor, +15% HP', Seeker: '+15% crit', Chaos: '+35% ATK, +8% crit, −20% armor', Hive: '+25% multi-hit, +30% SPD',
}[b.cls]])));

h(2, 'Stats');
const L = (lv) => { const q = G.newPet(); q.level = lv; return G.petStats(q); };
p(table(['Stat', 'What it does'], [
  ['HP', 'how much damage your pet can take'],
  ['ATK', 'how hard it hits'],
  ['Armor', 'reduces every hit it takes'],
  ['EVA', 'chance to dodge an attack completely; harder against stronger monsters, max 60%'],
  ['SPD', 'the faster side strikes first'],
  ['CRIT', 'chance to deal double damage, max 75%'],
  ['LIFE', 'heals your pet for part of the damage it deals, max 30%'],
  ['THRN', 'reflects part of the damage it takes back at the attacker, max 50%'],
  ['RES', 'protects against burn, poison and chill, max 75%'],
  ['MULTI', 'chance to attack twice'],
  ['REGEN', 'extra healing between fights'],
]));
p('\nBase stats before gear:\n');
p(table(['Level', 'HP', 'ATK', 'Armor', 'SPD'], [1, 10, 20, 30, 40].map((lv) => { const s = L(lv); return [lv, s.maxHp, Math.round(s.atk), Math.round(s.def), Math.round(s.spd)]; })));

h(2, 'Elements');
p('Weapons can carry an element. Hitting a monster\'s weakness deals 1.5× damage, and hitting its resistance only 0.6×.\n');
p(table(['Element', 'Effect'], [
  ['🔥 Fire', 'often sets the enemy burning for a few rounds'],
  ['☠ Poison', 'stacks up to 5 times, hurting every round'],
  ['❄ Frost', 'can freeze the enemy so it loses a turn'],
  ['⚡ Lightning', 'can chain into a second hit'],
  ['🌑 Shadow', 'every hit burns, and nothing resists it (Demon King only)'],
]));

h(2, 'Monsters');
p('The numbers compare each monster to an average one at the same level.\n');
const fromWhat = { bash: 'running commands', edit: 'editing files', read: 'reading and searching', fail: 'things going wrong', agent: 'using subagents' };
const where = (k) => Object.entries(G.KINDS_BY_BUCKET).filter(([, ks]) => ks.includes(k)).map(([b]) => fromWhat[b]).join(', ');
p(table(['Monster', 'Also called', 'HP', 'ATK', 'Armor', 'SPD', 'Weak to', 'Resists', 'Can inflict', 'Shows up while'], Object.entries(G.MONSTERS).filter(([k]) => k !== 'secret').map(([k, m]) => [
  `**${m.names[0]}**`, m.names.slice(1).join(', '), `×${m.hp}`, `×${m.atk}`, `×${m.def}`, `×${m.spd}`,
  m.weak ? `${G.ELEMENTS[m.weak].icon} ${m.weak}` : '—', m.resist === 'all' ? 'everything' : m.resist ? `${G.ELEMENTS[m.resist].icon} ${m.resist}` : '—',
  m.attack ? `${G.ELEMENTS[m.attack].icon} ${m.attack}` : '—',
  m.bossOnly || k === 'boss' ? 'boss fights' : m.eliteOnly ? 'elite fights' : where(k),
])));
p(`\n- **Elites** are tougher versions that show up about one fight in ten. They drop better loot. Some are Phishing Mimics, which drop a real crate when beaten.
- **Bosses** are a level above your pet and much tougher, but always drop 2 pieces of gear, a crate and a consumable.
- **Failing Test Hydra:** when a test run fails, one of these ambushes your pet straight away.`);

h(2, 'Loot');
p(table(['After a win', 'Normal', 'Elite', 'Boss'], [
  ['Gear', '55% chance', '80% chance', '2 pieces'],
  ['Rarity odds (common / rare / epic / legendary)', '58 / 29 / 10 / 3', '25 / 45 / 23 / 7', '0 / 35 / 45 / 20'],
  ['Consumable', '25%', '25%', 'always'],
  ['Crate', '10%', '40%', 'always'],
  ['XP and gold', 'normal', '×2', '×5'],
]));
p(`\n- **Uniques:** about ${pct(G.UNIQUE_CHANCE)} of legendary drops are a unique instead, and bosses have an extra small chance.
- **Sets:** a third of epic-or-better drops can turn out to be set pieces.
- **Elements:** rarer weapons are more likely to carry one, and every legendary does.
- **Affixes:** rare and better items can roll a magic affix; legendaries get two.
- **Auto-equip:** your pet puts on anything that beats what it's wearing. It favours uniques and pieces that complete a set.`);

h(2, 'Items');
p(table(['Rarity', 'Strength', 'Looks like', 'Where it comes from'], G.RARITY.map((r) => [r.name, `×${r.mult}`, r.prefix.join(', '), {
  common: 'drops', rare: 'drops, shop', epic: 'drops, shop, fusion', legendary: 'drops, shop, Legendary Merchant, fusion, ascension', mythic: 'only fusing 3 legendaries or ascending one', demon: 'the Demon King\'s Abyssal Scythe only',
}[r.name]])));
p('\n**Gear slots** (example stats):\n');
p(table(['Slot', 'Gives', 'Rare, Lv 10', 'Legendary, Lv 30', 'Kinds'], G.SLOTS.map((slot) => [
  slot, { weapon: 'ATK', armor: 'armor, HP', helmet: 'armor, HP', boots: 'SPD, armor, evasion', charm: 'crit, SPD, evasion' }[slot],
  Object.entries(G.SLOT_STATS[slot](10, G.RARITY[1].mult, G.WEAPON_TYPES.sword)).map(stat).join(', '),
  Object.entries(G.SLOT_STATS[slot](30, G.RARITY[3].mult, G.WEAPON_TYPES.sword)).map(stat).join(', '),
  slot === 'weapon' ? 'sword, axe, dagger, staff' : G.GEAR_BASES[slot].join(', '),
])));
p('\n**Weapon types:**\n');
p(table(['Type', 'Style', 'Names'], Object.entries(G.WEAPON_TYPES).map(([t, w]) => [t, { sword: 'balanced', axe: '+35% ATK, a little slower', dagger: 'less ATK, more crit', staff: 'less ATK, heals on hit' }[t], w.names.join(', ')])));
p('\n**Affixes:**\n');
p(table(['Affix', 'Adds'], G.AFFIXES.map((a) => [a.name, { 'of Haste': 'SPD', 'of the Vampire': 'lifesteal', 'of Vigor': 'max HP', 'of Precision': 'crit', 'of Thorns': 'thorns', 'of Regeneration': 'regen', 'of Warding': 'resist', 'of Shadows': 'evasion' }[a.name] || Object.keys(a.stats(20, 1)).map((k) => LABEL[k]).join(', ')])));
p('\n**PWR** is one number for how strong an item is overall. Drops show ▲/▼ against what your pet is wearing.');

h(2, 'Uniques');
p('Six one-of-a-kind legendaries, each with a special power. You can only own each one once, your pet never sells them, and they grow stronger as your pet levels up.\n');
p(table(['Unique', 'Slot', 'Power'], Object.values(G.UNIQUES).map((u) => [`★ ${u.name}`, u.type || u.slot, u.desc])));
p('\nThey come from rare legendary drops, bosses, Mythic Chests and the Legendary Merchant.');

h(2, 'Sets');
p('Wear all 3 pieces of a set for its bonus.\n');
p(table(['Set', 'Pieces', 'Bonus'], Object.values(G.SETS).map((st) => [`◆ ${st.label}`, st.slots.map((s) => (s === 'weapon' && st.type ? st.type : s)).join(', '), st.bonus])));

h(2, 'Consumables');
p('A won fight sometimes drops a consumable. Bosses always do.\n');
p(table(['Consumable', 'Odds', 'Effect'], [
  ['Energy Drink', '43%', `heals 60% when your pet is hurt; it carries up to ${G.MAX_POTIONS}`],
  ['Buff', '30%', 'a boost for the next 5–8 fights'],
  ['Tome', '15%', 'a small permanent stat boost'],
  ['Stack Overflow Scroll', '12%', 'a bit of XP'],
]));
p('\n**Buffs:**\n');
p(table(['Buff', 'Effect'], Object.entries(G.BUFFS).map(([id, b]) => [`${b.icon} ${b.name}`, { rage: '+50% ATK', firewall: '+60% armor', overclock: '+50% SPD and extra hits', focus: '+20% crit', blessed: '+15% ATK and armor, from making a git commit', smoke: 'much harder to hit' }[id]])));
p('\n**Tomes:** ' + G.TOMES.map((t) => `${t.name} (${LABEL[t.stat]})`).join(', ') + '.');

h(2, 'Crates');
p('Crates are opened on the next town visit.\n');
p(table(['Crate', 'Contains', 'Best odds'], Object.entries(G.BOXES).map(([id, b]) => [
  b.name, `${b.items} item${b.items > 1 ? 's' : ''}, gold${b.extras ? `, ${b.extras} consumable${b.extras > 1 ? 's' : ''}` : ''}${id === 'mythic' ? ', a tome and a free level' : ''}`,
  { wood: 'mostly common', iron: 'mostly rare', gold: 'epic and legendary', mythic: 'epic and legendary only, sometimes a unique' }[id],
])));
p('\nYou get crates from fights, the shop, Phishing Mimics, and by opening a pull request.');

h(2, 'Town');
p('Every 10 fights your pet goes to town on its own. It heals fully, opens its crates, crafts, sells gear it doesn\'t need and goes shopping. The log tells you why it bought each thing.\n');
p(table(['Shop', 'What your pet uses it for'], [
  ['Gear', 'upgrades for any slot (always at least one elemental weapon)'],
  ['Energy Drinks', 'restocking when it\'s running low'],
  ['Buffs', 'before a boss or after a rough patch'],
  ['Tomes', 'when it has plenty of gold'],
  ['Crates', 'to fill empty slots, or for fun when rich'],
  [`Blacksmith: reforge (up to +${G.MAX_PLUS})`, '+10% to every stat on a piece it\'s wearing'],
  ['Blacksmith: ascend', 'raises a piece it\'s wearing to the next rarity, up to mythic'],
  ['Legendary Merchant', 'shows up now and then with legendary gear, sometimes a unique'],
]));

h(2, 'Crafting');
p('Your pet crafts by itself in town, for a small fee.\n');
p(table(['Recipe', 'What it does'], [
  ['Fusion', '3 spare items of the same slot and rarity become one item of the next rarity'],
  ['Infusion', 'moves an element from a spare weapon onto the one it\'s wearing'],
  ['Enchanting', 'moves an affix from a spare item onto one it\'s wearing'],
]));

h(2, 'Coding events');
p(table(['When you…', 'Your pet…'], [
  ['commit', 'gets a ✨ Commit Blessing: +15% ATK and armor for a few fights'],
  ['push', 'earns a gold bounty'],
  ['open a pull request', 'receives an Iron Crate'],
  ['run tests that pass', 'gains some XP'],
  ['run tests that fail', 'gets ambushed by a Failing Test Hydra'],
]));

h(2, 'The Demon King');
p(`When a pet reaches its final form there's a ${pct(G.MONARCH_CHANCE)} chance it rises as the Demon King, Monarch of Shadows, instead. Pets that miss get one more chance at Lv 40.\n`);
p('- **Abyssal Scythe:** a demon-tier scythe only the Demon King can hold. Enormous attack, 15% lifesteal, and every hit burns with shadow flame. It grows with the pet.\n- **Arise:** each monster it defeats has a 10% chance to rise as a shadow soldier, up to 3. Every soldier strikes at the start of each fight.');

h(2, 'The secret boss');
p(`Somewhere out there is a boss that turns up in about 1 fight in 1000. He's much tougher than any regular boss and you can't run from him. Beat him once and your pet wears the 🏅 ${G.SECRET.name} Slayer badge forever, earns 5% more XP, and gets a Mythic Chest.`);

h(2, 'Levels');
p('Levels take longer as your pet grows.\n');
p(table(['Level', 'XP needed', 'Level', 'XP needed'], [1, 5, 10, 15, 20, 25].map((lv, i) => [lv, G.xpToNext(lv), [30, 35, 40, 50, 60, 75][i], G.xpToNext([30, 35, 40, 50, 60, 75][i])])));
p('\n---\n*Numbers on this page come from the game code. Run `node tools/wiki.js` to rebuild it after a balance change.*');

fs.writeFileSync(path.join(root, 'docs', 'WIKI.md'), out.join('\n') + '\n');
console.log('wrote docs/WIKI.md');
