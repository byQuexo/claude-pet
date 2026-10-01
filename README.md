# claude-pet

An idle RPG pet that lives in your [Claude Code](https://claude.com/claude-code) statusline. While you code, monsters spawn, and your pet fights them, loots gear, shops, crafts and evolves. You never press a button; it plays itself.

![Every sprite in the game](docs/sprites.png)

*Top: the egg, the Fire, Lightning and Void starter lines, and the 1% Demon King. Bottom: all 11 monsters, the loot crate and the crafting anvil. Rendered from the game's own sprite code.*

## Install

Requires Node 18+ and Claude Code.

```bash
git clone https://github.com/byQuexo/claude-pet.git ~/.claude-pet
node ~/.claude-pet/pet.js install
ln -s ~/.claude-pet/pet.js ~/.local/bin/pet   # optional, for `pet watch`
```

`install` backs up `settings.json`, then:
- adds async hooks for tool calls, tool failures, subagents, turn ends and session start
- replaces your statusline command with the pet wrapper, which runs your old one first, so it still shows above the pet

Open a new session and your egg appears after the first tool call. `node ~/.claude-pet/pet.js uninstall` puts everything back the way it was.

## Watching it

- **Statusline:** a 16×16 pixel-art sprite plus a stats card showing level, HP, XP, ATK/ARM/EVA, all 5 gear slots, gold, potions and buffs. It refreshes once a second, so the pet bobs and blinks.
- **`pet watch`:** the full animated view. Open it in a split next to Claude (e.g. Cmd+D in Ghostty). It replays every fight blow by blow, and shows crate openings, the crafting anvil, evolutions and the event log.

## How it plays

- **Ticks:** every tool call is a tick. Monsters spawn on about 15% of ticks, and more often when a tool call fails.
- **Your starter is seeded by how you code:** while it's an egg (Lv 1–5), the pet records your tool mix, the hours you code, which file types you edit, how many repos you work in (hashed, never named), and your commits and test runs. At hatching all of that is hashed into a SHA-256 seed, which picks the species, the nature (a small stat lean) and a 1-in-128 shiny palette. `pet seed` shows what the egg has seen so far.
- **Three starter lines:** each evolves at Lv 5, 15 and 30.

  | Line | Forms | Signature skill |
  |---|---|---|
  | 🔥 Fire | Pyrobit → Blazewyrm → Infernus | Ember Breath: innate fire, burns |
  | ⚡ Lightning | Voltcub → Stormfang → Fenrir Thunderlord | Static Pounce: always strikes first, extra hits |
  | 🌑 Void | Glitchling → Nullwraith → Void Sovereign | Null Gaze: 20% chance to erase an enemy attack |
- **Class:** at Lv 15, whatever you do **more than you usually do** sets the pet's class, which tints its markings and gives a stat bonus. Bash → Shell, edits → Scribe, reads → Seeker, failures → Chaos, subagents → Hive.
- **The Demon King:** at the Lv 30 evolution (and again at Lv 40), a pet has a 1% chance to rise as the Monarch of Shadows instead. It wields the Abyssal Scythe, a demon-tier black scythe with a crimson edge that burns with shadow flame on every hit. Monsters it slays can rise again as shadow soldiers, up to 3, which strike at the start of every fight.
- **Loot:** 5 gear slots and 5 rarities. The top rarity, Mythic, can only be crafted.
  - Weapon types: sword, axe, dagger, staff.
  - Elements: 🔥 fire, ☠ poison, ❄ frost, ⚡ lightning.
  - Affixes such as lifesteal, thorns, regeneration, warding and shadows.
- **A secret boss:** any fight has a 1-in-1000 chance of being something else entirely. It's tougher than any boss and can't be fled. Beat it once and you keep a 🏅 badge forever, next to your pet's name. To make it your own, drop a `secret-boss.json` (`{ "name", "pal", "rows" }`, 16 rows of 16 chars) into `~/.claude/claude-pet/` and it replaces the default art and name.
- **Combat:** armor reduces damage, and evasion rating gives a chance to dodge, with diminishing returns. Monsters have elemental weaknesses and resistances, and some poison, chill or burn your pet. The pet drinks potions when it's low, retreats from fights it's losing, and picks safer fights after a losing streak.
- **Town:** every 10 fights the pet fully heals, opens loot crates, crafts, sells leftovers and shops. It decides what to buy from its situation (low on potions, a boss due soon, an empty gear slot, which monsters keep showing up) and logs why.
- **Crafting:** the pet does this on its own.
  - Fuse 3 spare items of the same slot and rarity into the next rarity.
  - Infuse a weapon with an element its recent enemies are weak to.
  - Move affixes from spare gear onto equipped gear.
- **Your work shows up in the game:**
  - `git commit` blesses the pet.
  - `git push` pays a bounty in gold.
  - `gh pr create` awards a crate.
  - Passing tests give XP.
  - A failing test spawns a Failing Test Hydra.

## Commands

| | |
|---|---|
| `pet watch` | animated full view |
| `pet status` | print the statusline card once |
| `pet mode full` / `minimal` / `compact` | full: sprite + stats card · minimal: only the pet, far right, beside your statusline · compact: 2 text lines |
| `pet gear on` / `off` | show or hide gear drawn on the pet (it stays equipped and listed in the card) |
| `pet width <n>` / `auto` | terminal width for minimal mode, if `$COLUMNS` is wrong |
| `pet install` / `uninstall` | wire into, or remove from, Claude Code settings |
| `pet sim <n> [bash\|edit\|read\|fail\|agent]` | fast-forward n ticks (this cheats your own save) |
| `pet reset` | release your pet and start over |

## Privacy

Everything stays on your machine. The pet only reads hook payloads (tool name, and the Bash command for the coding events), and its save is a single JSON file in `~/.claude/claude-pet/`. It makes no network calls.

## License

MIT
