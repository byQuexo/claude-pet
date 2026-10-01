# claude-pet wiki

Every number on this page is generated from the game code by `node tools/wiki.js`, so it matches the version you are running.

**Contents:** [Ticks and fights](#ticks-and-fights) · [Your pet](#your-pet) · [Shiny pets](#shiny-pets) · [Natures](#natures) · [Classes](#classes) · [Stats and combat](#stats-and-combat) · [Monsters](#monsters) · [Loot and drop rates](#loot-and-drop-rates) · [Items](#items) · [Uniques](#uniques) · [Sets](#sets) · [Consumables](#consumables) · [Crates](#crates) · [Town, shop and blacksmith](#town-shop-and-blacksmith) · [Crafting](#crafting) · [Coding events](#coding-events) · [The Demon King](#the-demon-king) · [The secret boss](#the-secret-boss) · [Levels and XP](#levels-and-xp)

## Ticks and fights

| What | Value |
|---|---|
| A tick | every tool call Claude makes (PostToolUse, PostToolUseFailure, SubagentStart, Stop) |
| Monster spawn chance per tick | 15% (35% after a failed tool call) |
| HP regeneration per tick | 5% of max HP + your regen stat |
| XP per tick | 1, plus kill XP |
| Boss | every 25 kills, once the pet has at least 75% HP (a lost boss comes back 10 kills later) |
| Town visit | every 10 fights: full heal, crates, crafting, selling, shopping |
| Fainting | out for 8 ticks, then back at 50% HP |
| Retreat | below 15% HP while the monster is above 25%, a 60% chance per round to flee instead of fainting |
| Potions | carried up to 5; one is drunk before a fight below 50% HP and during a fight below 30% HP (+60% HP) |
| Losing streak | 2 losses in the last 5 fights makes the pet pick monsters 1–3 levels below it |

## Your pet

The egg hatches at Lv 5, evolves at Lv 15 and reaches its final form at Lv 30.

While it is an egg it records your tool mix, the hours you code, the file extensions you edit, how many repos you work in (hashed) and your commits and test runs. At hatching all of that is hashed into a SHA-256 seed that decides the species, the nature and the shiny roll. `pet seed` shows the seed.

| Species | Forms (Lv 5 → 15 → 30) | Signature skill |
|---|---|---|
| 🐉 Fire | Pyrobit → Blazewyrm → Infernus | Ember Breath: innate fire element (burns), even without a fire weapon |
| 🐺 Lightning | Voltcub → Stormfang → Fenrir Thunderlord | Static Pounce: always strikes first, +20% multi-hit |
| 👁 Void | Glitchling → Nullwraith → Void Sovereign | Null Gaze: 20% chance to erase any enemy attack |

The final form gets +20% HP, ATK and armor on top of its level.

## Shiny pets

Every seed has a **1 in 128** chance to be shiny. A shiny pet shifts the hue of its body, highlight, belly and wing colours by 150°, keeping its outline and eyes. It looks rare but plays exactly the same. The header and `pet seed` show ✦ shiny.

![Normal and shiny versions of every form](shiny.png)

*Top: normal. Bottom: shiny.*

## Natures

The seed also picks one of 8 natures: a small, permanent stat lean.

| Nature | Effect |
|---|---|
| Bold | +5% ATK |
| Restless | +8% SPD |
| Calm | +6% armor |
| Reckless | +8% ATK, −5% armor |
| Patient | +1% HP regen per tick |
| Curious | +2% crit |
| Stubborn | +6% max HP |
| Sly | +15% evasion rating, +3 flat |

## Classes

At Lv 15 the pet takes the class of whatever you did **more than you usually do** while it grew. Your own lifetime tool mix is the baseline. The class tints its markings and gives a bonus.

| Class | Comes from | Bonus |
|---|---|---|
| Shell | Bash | +25% ATK |
| Scribe | edits | +40% armor, +15% HP |
| Seeker | reads and searches | +15% crit |
| Chaos | failed tool calls | +35% ATK, +8% crit, −20% armor |
| Hive | subagents | +25% multi-hit, +30% SPD |

## Stats and combat

Base stats before gear, by level:

| Level | HP | ATK | Armor | SPD | Evasion rating |
|---|---|---|---|---|---|
| 1 | 40 | 6 | 2 | 5 | 3 |
| 10 | 130 | 25.8 | 11.9 | 9.5 | 7.5 |
| 20 | 230 | 47.8 | 22.9 | 14.5 | 12.5 |
| 30 | 330 | 69.8 | 33.9 | 19.5 | 17.5 |
| 40 | 430 | 91.8 | 44.9 | 24.5 | 22.5 |

- **Damage:** attack × 0.85–1.15, minus half the target's armor (at least 1). Crits deal 2× (2.5× with The Linter's Edge, +0.3× with the Hacker set). Monsters crit 5% of the time.
- **Evasion:** rating ÷ (rating + 40 + 8 × monster level), capped at 60%. The same rating dodges less against stronger monsters.
- **Caps:** crit 75%, lifesteal 30%, thorns 50%, resist 75%.
- **Elements:** a weakness takes 1.5× damage (2× with the Rubber Duck of Insight), a resistance 0.6×. The Legacy Monolith resists every element except shadow.
  - 🔥 fire: 35% chance to burn for 3 rounds at 30% of the hit
  - ☠ poison: 50% chance to add a stack (up to 5), each worth 8% of ATK per round
  - ❄ frost: 25% chance to freeze the monster for a turn
  - ⚡ lightning: 30% chance to chain a second hit at 60%
  - 🌑 shadow: every hit burns, ignoring resistance (Abyssal Scythe only)
- **Scaling:** monster HP follows your offence and monster ATK follows your toughness (HP, armor, evasion), so neither glass cannons nor tanks trivialise fights.

## Monsters

Base multipliers on top of the level formula: HP (18 + 10 × level), ATK (4 + 2.2 × level), armor (1 + 0.8 × level), SPD (4 + 0.5 × level).

| Monster | Names | HP | ATK | Armor | SPD | Weak | Resists | Inflicts | Dodge | Spawns from |
|---|---|---|---|---|---|---|---|---|---|---|
| slime | Merge Conflict Slime / Spaghetti Ooze / Memory Leak Blob | ×1.1 | ×0.9 | ×0.8 | ×0.8 | 🔥 fire | ☠ poison | — | 2% | bash, edit, read, agent |
| ghost | Null Pointer Wraith / Heisenbug Phantom / Zombie Process | ×0.85 | ×1.15 | ×0.6 | ×1.2 | ⚡ lightning | ❄ frost | ❄ frost (15%) | 10% | bash, edit, read, fail, agent |
| bug | Off-By-One Beetle / Race Condition Roach / Flaky Test Mite | ×0.9 | ×1 | ×1.3 | ×1 | ☠ poison | 🔥 fire | ☠ poison (25%) | 3% | bash, edit, read, fail, agent |
| boss | Legacy Monolith / Tech Debt Colossus / 3AM Prod Incident | ×1 | ×1 | ×1.2 | ×0.7 | — | all | 🔥 fire (30%) | 2% | boss fights |
| ouroboros | Infinite Loop Ouroboros / Recursion Serpent / While(true) Wyrm | ×1.3 | ×0.85 | ×0.9 | ×0.9 | ❄ frost | 🔥 fire | ☠ poison (20%) | 4% | bash, agent |
| cronbat | Cron Bat / Midnight Job Bat / Scheduled Screecher | ×0.8 | ×1.05 | ×0.6 | ×1.4 | ⚡ lightning | ☠ poison | — | 12% | read, agent |
| skeleton | Segfault Skeleton / Core Dump Revenant / Dangling Pointer Bones | ×0.9 | ×1.15 | ×1 | ×1 | 🔥 fire | ❄ frost | ❄ frost (10%) | 3% | edit, fail, agent |
| turtle | Timeout Turtle / 504 Tortoise / Blocking I/O Turtle | ×1.4 | ×0.8 | ×1.8 | ×0.5 | ⚡ lightning | ☠ poison | — | 0% | bash, fail |
| mimic | Phishing Mimic / Fake Login Chest / Too-Good-To-Be-True Crate | ×1.1 | ×1.25 | ×1 | ×1.1 | 🔥 fire | ❄ frost | ☠ poison (20%) | 5% | elite rolls |
| hydra | Dependency Hydra / node_modules Hydra / Transitive Dependency Beast | ×1.5 | ×1.1 | ×1.1 | ×0.9 | ☠ poison | 🔥 fire | ☠ poison (20%) | 2% | elite rolls |
| kraken | Kubernetes Kraken / Helm Chart Horror / CrashLoopBackOff Leviathan | ×1.1 | ×1 | ×1.1 | ×0.8 | ⚡ lightning | ❄ frost | ❄ frost (30%) | 2% | boss fights |

- **Elites:** 10% of spawns (1.4× HP, 1.15× ATK). Half of elite rolls become a Phishing Mimic or a Dependency Hydra. Killing a mimic drops a real crate (25% golden, otherwise iron).
- **Bosses:** Legacy Monolith / Tech Debt Colossus / 3AM Prod Incident, and Kubernetes Kraken / Helm Chart Horror / CrashLoopBackOff Leviathan. One level above you, 1.8× HP, 1.05× ATK.
- **Failing Test Hydra:** a failed test run spawns an elite ambush on the next tick (1.4× HP, 1.15× ATK).

## Loot and drop rates

| After a win | Normal | Elite | Boss |
|---|---|---|---|
| Gear drops | 55% for 1 item | 80% for 1 item | 2 items, guaranteed |
| Rarity weights (common / rare / epic / legendary) | 58 / 29 / 10 / 3 | 25 / 45 / 23 / 7 | 0 / 35 / 45 / 20 |
| Consumable | 25% | 25% | guaranteed |
| Crate | 7.7% wooden · 2% iron · 0.3% golden | 35% iron · 5% golden | 80% golden · 20% mythic |
| Unique | 4% of legendary drops | 4% of legendary drops | +3% extra roll |
| XP | 6 + 3 × level | ×2 | ×5 |
| Gold | (3 + 1.2 × level) × 0.7–1.3 | ×2 | ×5 |

- **Set pieces:** 35% of epic-or-better items roll as part of a set when their slot fits one.
- **Elements:** chance by rarity: common 10%, rare 35%, epic 60%, legendary 100%.
- **Affixes:** chance by rarity: common 0%, rare 35%, epic 60%, legendary 100%. Legendary and up roll a second affix.
- **Auto-equip:** the pet equips a drop when it scores higher than what's in the slot. The score is power, plus a pull towards uniques and towards finishing a set.

## Items

| Rarity | Stat multiplier | Name prefixes | How to get it |
|---|---|---|---|
| common | ×1 | Rusty, Dusty, Legacy, Deprecated | drops |
| rare | ×1.6 | Polished, Typed, Linted, Tested | drops, shop |
| epic | ×2.4 | Arcane, Async, Immutable, Memoized | drops, shop, fusion |
| legendary | ×3.5 | Mythic, Zero-Day, Quantum, Senior | drops, shop, Legendary Merchant, fusion, ascension |
| mythic | ×5 | Ascended, Eternal, Primordial, Root-Access | only by fusing 3 legendaries or ascending a legendary |
| demon | ×6 | Abyssal | only the Demon King's Abyssal Scythe |

**Base stats per slot** (before rarity multiplier and affixes; L = item level):

| Slot | Formula | Rare at Lv 10 | Legendary at Lv 30 | Bases |
|---|---|---|---|---|
| weapon | ATK (1.5 + 0.7 L) × weapon type | +13.6 ATK | +78.8 ATK | see weapon types |
| armor | armor (1 + 0.45 L), HP (4 + 2 L) | +8.8 armor, +38 HP | +50.8 armor, +224 HP | Cache Cloak, Firewall Plate, Mutex Mail, Kubernetes Chainmail, Type-Safe Vest |
| helmet | armor (0.5 + 0.25 L), HP (3 + 1.5 L) | +4.8 armor, +29 HP | +28 armor, +168 HP | Code Review Helm, Hard Hat of Prod, Thinking Cap, Noise-Cancelling Helm |
| boots | SPD (0.4 + 0.12 L), armor (0.3 + 0.15 L), evasion (2 + 0.8 L) | +2.6 SPD, +2.9 armor, +16 evasion rating | +14 SPD, +16.8 armor, +91 evasion rating | Sprint Boots, Async Sneakers, Rollback Greaves, CI Runners |
| charm | crit 1.5%, SPD (0.3 + 0.08 L), evasion (1 + 0.4 L) | +2% crit, +1.8 SPD, +8 evasion rating | +5% crit, +9.5 SPD, +45.5 evasion rating | Rubber Duck, Coffee Flask, Lucky Commit, Green CI Badge, Sudo Ring |

**Weapon types:**

| Type | ATK | Extra | Names |
|---|---|---|---|
| sword | ×1 | — | Regex Blade, Merge Sword, Hotfix Saber, Branch Cutter |
| axe | ×1.35 | −1 SPD | Refactor Axe, Tech Debt Cleaver, Monolith Splitter |
| dagger | ×0.75 | +6% crit | Semicolon Dagger, Null Shiv, Off-By-One Knife |
| staff | ×0.85 | +6% lifesteal | Debugger Staff, Stack Trace Wand, Linter Rod |

**Affixes** (shown at Lv 20, ×1 rarity; they scale with both):

| Affix | Adds |
|---|---|
| of Haste | +2.5 SPD |
| of the Vampire | +3% lifesteal |
| of Vigor | +33 HP |
| of Precision | +2% crit |
| of Thorns | +8% thorns |
| of Regeneration | +1% regen |
| of Warding | +6% resist |
| of Shadows | +23 evasion rating |

**Power score (PWR):** ATK ×1 + armor ×1.2 + HP ×0.15 + crit ×100 + SPD ×0.8 + lifesteal ×150 + thorns ×60 + regen ×400 + resist ×80 + evasion ×0.6, plus a bonus for having an element.

## Uniques

Six one-of-a-kind legendaries. You can own each only once, they are never sold, and they level up with your pet at every town visit (keeping their reforges).

| Unique | Slot | Effect | Stats at Lv 30 |
|---|---|---|---|
| ★ Rubber Duck of Insight | charm | weakness hits deal 2× instead of 1.5× | +9% crit, +13.5 SPD, +65 evasion rating |
| ★ Ctrl+Z Circlet | helmet | once per fight, undoes a killing blow | +38.4 armor, +230 HP |
| ★ Production Key | dagger | double gold, but monsters hit 10% harder | +85.5 ATK, +8% crit |
| ★ Infinite Loop Boots | boots | +15% chance to strike twice | +20 SPD, +125 evasion rating, +23 armor, +15% multi-hit |
| ★ Stack Overflow Plate | armor | reflects 30% of damage taken | +69.6 armor, +307 HP, +30% thorns |
| ★ The Linter's Edge | sword | crits deal 2.5× instead of 2× | +113 ATK, +5% crit |

Drop chances: 4% of legendary drops, +3% on bosses, 25% of Mythic Chests, and 10% of Legendary Merchant visits.

## Sets

| Set | Pieces | 3-piece bonus |
|---|---|---|
| ◆ On-Call | helmet, armor, boots | 3% HP back every round |
| ◆ Hacker | dagger (weapon), charm, boots | +30% crit damage |
| ◆ Architect | staff (weapon), armor, helmet | a 25% HP shield at the start of every fight |

## Consumables

A won fight has a 25% chance of a consumable (bosses always drop one):

| Roll | Chance | Effect |
|---|---|---|
| Energy Drink | 43% | carried (max 5); if full, drunk on the spot for a full heal |
| Buff | 30% | a random buff for 5–8 fights |
| Tome | 15% | a permanent stat increase |
| Stack Overflow Scroll | 12% | +5% of the current level's XP |

**Buffs:**

| Buff | Effect |
|---|---|
| 🔥 Hotfix Rage | +50% ATK |
| 🛡 Firewall | +60% armor |
| ⚡ Overclock | +50% SPD, +20% multi-hit |
| 🎯 Deep Focus | +20% crit |
| ✨ Commit Blessing | +15% ATK and armor (from `git commit`, 6 fights) |
| 💨 Smoke Bomb | evasion rating ×1.5 + 20 |

**Tomes** (amount at Lv 20):

| Tome | Permanent |
|---|---|
| Clean Code Tome | +2.1 ATK |
| Design Patterns Tome | +1.3 armor |
| Pragmatic Programmer Tome | +13 HP |
| Caffeine Tome | +0.5 SPD |
| Hacker's Tome | +1% crit |
| Parkour Tome | +8 evasion rating |

## Crates

Crates are opened at the next town visit.

| Crate | Items | Rarity weights (c / r / e / l) | Gold | Extras |
|---|---|---|---|---|
| Wooden Crate | 1 | 50 / 40 / 9 / 1 | 10–30 × (1 + 0.1 × level) | 0 consumables |
| Iron Crate | 2 | 20 / 50 / 25 / 5 | 20–60 × (1 + 0.1 × level) | 1 consumable |
| Golden Crate | 3 | 0 / 40 / 45 / 15 | 50–150 × (1 + 0.1 × level) | 1 consumable |
| Mythic Chest | 3 | 0 / 0 / 60 / 40 | 100–300 × (1 + 0.1 × level) | 2 consumables, a tome, +1 level, 25% unique |

Sources: fights (see drop rates), the shop (Iron Crate always, Golden Crate half the time), `gh pr create` (Iron Crate), and killing a Phishing Mimic.

## Town, shop and blacksmith

Every visit the pet heals fully, opens its crates, crafts, then sells spare gear and shops. It keeps uniques and pairs of epic or better items waiting for a fusion. For every offer it works out a value from its situation (potions low, a boss due within 5 kills, recent losses, empty slots, the element its recent enemies are weak to) and buys the best value for money first. Each purchase is logged with the reason.

| Offer | Price (L = pet level + 1) | When the pet buys it |
|---|---|---|
| 3 gear pieces (one is always an elemental weapon) | power × 3 × (1 + 0.2 × rarity) | it beats the equipped item |
| Energy Drink | 15 + 2 L | fewer than 3 carried |
| A random buff | 30 + 4 L | a boss is due, a losing streak, or spare gold |
| A random tome | 120 + 15 L | gold is at least twice the price |
| Iron / Golden Crate | 60 + 8 L / 200 + 20 L | an empty slot, or gold over 4× the price |
| Reforge (blacksmith, up to +5) | half the item price × (1 + 0.25 per level) | +10% to every stat of an equipped item |
| Ascend (blacksmith) | item price × (1 + rarity) | raises an equipped item one rarity, up to mythic |
| Legendary Merchant (15% of visits) | item price × 2.5 (uniques cost more) | a legendary, or a unique 10% of the time |

Selling a spare item pays 2 × its power.

## Crafting

| Recipe | What it does | When |
|---|---|---|
| Fusion | 3 spare items of the same slot and rarity become 1 of the next rarity, keeping an element and the best reforge level | the result would beat what is equipped |
| Infusion | moves a spare weapon's element onto the equipped weapon | the element hits recent enemies' weakness, or the weapon has none |
| Enchanting | moves an affix from spare gear onto equipped gear of the same slot | the target has room (2 affixes, 3 at legendary and up) |

Each craft costs (10 + 2 × level) × (1 + rarity tier) gold.

## Coding events

| You run | In the game |
|---|---|
| `git commit` | ✨ Commit Blessing: +15% ATK and armor for 6 fights |
| `git push` | 15 + 3 × level gold |
| `gh pr create` | an Iron Crate |
| tests that pass (npm test, pytest, cargo test, go test, …) | 3% of a level in XP |
| tests that fail | a Failing Test Hydra ambushes the pet on the next tick |

These only trigger when the command actually runs (at the start of the line or after `&&`, `;` or `|`), not when it merely appears in an `echo` or `grep`.

## The Demon King

At the Lv 30 evolution, and again at Lv 40 for pets that missed it, there is a 1% chance the pet rises as the Demon King, Monarch of Shadows, instead of its normal final form.

- **Abyssal Scythe:** demon tier, locked to the Demon King. ATK (1.5 + 0.7 × level) × 6, 15% lifesteal, ×1.6 total ATK, and shadow flame on every hit (a burn that ignores resistance).
- **Arise:** each kill has a 10% chance to raise a shadow soldier, up to 3. Every soldier strikes for 40% ATK at the start of each fight.

## The secret boss

Any fight has a 1 in 1000 chance of being The Secret Boss instead. He is scaled like a boss but with 4× HP and 1.4× ATK. He dodges 10% of attacks, has no weakness, and can't be fled from. Beat him once for a permanent 🏅 The Secret Boss Slayer badge, +5% XP forever, and a Mythic Chest. If you lose, he vanishes until the next roll.

## Levels and XP

XP to the next level is 25 × level^1.95. Roughly 10,000 tool calls get a pet to Lv 30.

| Level | XP to next | Level | XP to next |
|---|---|---|---|
| 1 | 25 | 30 | 18981 |
| 5 | 577 | 35 | 25637 |
| 10 | 2228 | 40 | 33263 |
| 15 | 4913 | 50 | 51396 |
| 20 | 8609 | 60 | 73339 |
| 25 | 13302 | 75 | 113321 |
