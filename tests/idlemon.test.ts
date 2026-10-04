import { expect, mock, test } from 'claude-code/testing'

const legacy = JSON.stringify({ v: 1, name: 'Glitch', born: 1, level: 7, xp: 0, stage: 1, species: 'void', nature: 'Bold', shiny: false, seed: 'ab'.repeat(32), hp: 50, faint: 0, buffs: [], potions: 1, bonus: {}, nextBoss: 25, gold: 10, recent: [], boxes: [], gear: {}, inventory: [], mix: { bash: 0, edit: 0, read: 0, fail: 0, agent: 0 }, totalMix: { bash: 0, edit: 0, read: 0, fail: 0, agent: 0 }, stats: { ticks: 0, kills: 0, faints: 0, bosses: 0, items: 0, fights: 0, goldEarned: 0 }, log: [] })

const BAND = {
  plugin: 'idlemon', component: 'AbovePrompt', requestId: 'band', viewport: { columns: 120, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 110, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

const PANE = {
  plugin: 'idlemon', component: 'Pane', requestId: 'idlemon', viewport: { columns: 200, rows: 60 },
  props: { title: 'idlemon', isFocused: true, bodyColumns: 112, placement: 'dock', scroll: { offset: 0, bodyRows: 58 }, view: {} },
} as const

function harness(on, files: Record<string, string> = {}) {
  const saved = new Map<string, unknown>()
  mock.clock(on)
  mock.env(on, { HOME: '/home/t' })
  on('store.get', ($, e) => ({ value: saved.get(e.key) }))
  on('store.set', ($, e) => { saved.set(e.key, e.value); return { value: undefined } })
  on('fs.read', ($, e) => (files[e.path] != null ? { value: files[e.path] } : { deny: 'missing' }))
  on('session.cwd', () => ({ value: '/work/repo' }))
  on('settings.read', () => ({ value: {} }))
  on('command.register', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('tool.call', () => ({ result: 'ok' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  return saved
}

const settle = () => new Promise((r) => setTimeout(r, 30))

test('tool calls tick the pet in the shared store', async ($, on) => {
  const saved = harness(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  for (let i = 0; i < 5; i++) await $.tool.call({ tool: 'Bash', command: 'ls' })
  await settle()
  const p = saved.get('pet') as any
  expect(p.stats.ticks).toBe(5)
  expect(p.mix.bash).toBe(5)
})

test('a failing test run counts as a failure tick and sets an ambush', async ($, on) => {
  const saved = new Map<string, unknown>()
  mock.clock(on)
  mock.env(on, { HOME: '/home/t' })
  on('store.get', ($, e) => ({ value: saved.get(e.key) }))
  on('store.set', ($, e) => { saved.set(e.key, e.value); return { value: undefined } })
  on('fs.read', () => ({ deny: 'missing' }))
  on('session.cwd', () => ({ value: '/work/repo' }))
  on('tool.call', () => ({ result: 'tests failed', isError: true }))
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await settle()
  const p = saved.get('pet') as any
  expect(p.mix.fail).toBe(1)
  expect(p.log.some((l) => /test failed/.test(l.text))).toBe(true)
})

test('an old claude-pet save moves over on the first session', async ($, on) => {
  const saved = harness(on, { '/home/t/.claude/claude-pet/state.json': legacy, '/home/t/.claude/claude-pet/config.json': '{"mode":"compact","gear":false}' })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect((saved.get('pet') as any).name).toBe('Glitch')
  expect(saved.get('config')).toEqual({ mode: 'compact', gear: false })
})

test('the band shows the card and the pane shows the arena', async ($, on) => {
  harness(on, { '/home/t/.claude/claude-pet/state.json': legacy })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ type: 'Raster' })).toBeDefined()
  await $.command.run({ command: 'idlemon', args: 'watch' })
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await pane.find({ type: 'Raster' })).toBeDefined()
  await pane.press({ key: 'view-gear' })
  expect((await pane.find({ key: 'view-gear' })).props.dimColor).toBe(false)
  expect((await pane.find({ key: 'view-watch' })).props.dimColor).toBe(true)
  const desk = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await desk.find({ type: 'Svg' })).toBeDefined()
})

test('/idlemon mode and gear change the saved config', async ($, on) => {
  const saved = harness(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect((await $.command.run({ command: 'idlemon', args: 'mode minimal' })).text).toBe('band mode: minimal')
  await $.command.run({ command: 'idlemon', args: 'gear off' })
  expect(saved.get('config')).toEqual({ mode: 'minimal', gear: false })
})
