// The engine draws ANSI lines for a terminal; a mod draws element trees, so this replays those lines onto a cell grid.
import { cellWidth } from '../engine.js';

const rgb = (a) => `#${a.map((v) => (+v).toString(16).padStart(2, '0')).join('')}`;

export function toCells(lines, width) {
  return lines.map((line) => {
    const row = Array.from({ length: width }, () => ({ ch: ' ', fg: null, bg: null, bold: false }));
    let x = 0, fg = null, bg = null, bold = false;
    const re = /\x1b\[([0-9;?]*)([a-zA-Z])|[\s\S]/gu;
    for (const m of line.matchAll(re)) {
      if (m[2] === 'm') {
        const n = (m[1] || '0').split(';');
        for (let i = 0; i < n.length; i++) {
          const c = +n[i];
          if (c === 0) { fg = bg = null; bold = false; }
          else if (c === 1) bold = true;
          else if (c === 22) bold = false;
          else if (c === 39) fg = null;
          else if (c === 49) bg = null;
          else if ((c === 38 || c === 48) && n[i + 1] === '2') { const v = rgb(n.slice(i + 2, i + 5)); if (c === 38) fg = v; else bg = v; i += 4; }
        }
        continue;
      }
      if (m[2] === 'G') { x = Math.max(0, (+m[1] || 1) - 1); continue; }
      if (m[2]) continue;
      const ch = m[0];
      if (ch === '️' || ch === '‍') { if (x > 0) row[x - 1].ch += ch; continue; }
      const w = cellWidth(ch);
      if (x + w > width) break;
      row[x] = { ch, fg, bg, bold, wide: w === 2 };
      if (w === 2) row[x + 1] = { ch: '', fg, bg, bold };
      x += w;
    }
    return row;
  });
}

// One Text per row, with a nested span for every run of the same style.
export function toText(cells, Text, Box) {
  return Box({
    flexDirection: 'column',
    children: cells.map((row) => {
      const spans = [];
      let cur = null;
      for (const c of row) {
        if (!c.ch) continue;
        if (cur && cur.fg === c.fg && cur.bg === c.bg && cur.bold === c.bold) cur.text += c.ch;
        else spans.push((cur = { fg: c.fg, bg: c.bg, bold: c.bold, text: c.ch }));
      }
      const children = spans.map((s) => (!s.fg && !s.bg && !s.bold ? s.text : Text({
        ...(s.fg ? { color: s.fg } : {}), ...(s.bg ? { backgroundColor: s.bg } : {}), ...(s.bold ? { bold: true } : {}), children: [s.text],
      })));
      return Text({ wrap: 'truncate', children: children.length ? children : [' '] });
    }),
  });
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The Desktop app has no cell grid, so half blocks become two pixel rects and text becomes SVG text.
export function toSvg(cells, { cw = 8, ch = 16, bg = '#16141f', fg = '#d8d4ec' } = {}) {
  const width = (cells[0] || []).length * cw, height = cells.length * ch;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${bg}"/>`];
  const text = [];
  cells.forEach((row, y) => row.forEach((c, x) => {
    const X = x * cw, Y = y * ch;
    if (c.ch === '▀' || c.ch === '▄') {
      const top = c.ch === '▀' ? c.fg : c.bg, bottom = c.ch === '▀' ? c.bg : c.fg;
      if (top) out.push(`<rect x="${X}" y="${Y}" width="${cw}" height="${ch / 2}" fill="${top}"/>`);
      if (bottom) out.push(`<rect x="${X}" y="${Y + ch / 2}" width="${cw}" height="${ch / 2}" fill="${bottom}"/>`);
      return;
    }
    if (c.bg) out.push(`<rect x="${X}" y="${Y}" width="${cw * (c.wide ? 2 : 1)}" height="${ch}" fill="${c.bg}"/>`);
    if (c.ch === '█' && c.fg) { out.push(`<rect x="${X}" y="${Y}" width="${cw}" height="${ch}" fill="${c.fg}"/>`); return; }
    if (c.ch && c.ch !== ' ') text.push(`<text x="${X}" y="${Y + ch * 0.78}" fill="${c.fg || fg}"${c.bold ? ' font-weight="bold"' : ''}>${esc(c.ch)}</text>`);
  }));
  out.push(`<g font-family="ui-monospace, Menlo, monospace" font-size="${ch * 0.8}">${text.join('')}</g></svg>`);
  return out.join('');
}

const DEFAULT = 0x01000000;
const colors = new Map();
const num = (h) => {
  if (!h) return DEFAULT;
  let v = colors.get(h);
  if (v === undefined) colors.set(h, (v = parseInt(h.slice(1), 16)));
  return v;
};
// A Raster cell holds one width-1 BMP character, so emoji rows fall back to Text.
const rasterable = (row) => row.every((c) => c.ch.length === 1 && !c.wide && c.ch.charCodeAt(0) < 0xd800);

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64(bytes) {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  if (i < bytes.length) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8);
    out += B64[n >> 18] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + '=';
  }
  return out;
}

export function packRows(rows) {
  const words = new Uint32Array(rows.length * rows[0].length * 3);
  let i = 0;
  for (const row of rows) for (const c of row) { words[i++] = c.ch.charCodeAt(0); words[i++] = num(c.fg); words[i++] = num(c.bg); }
  return base64(new Uint8Array(words.buffer));
}

// Runs of plain rows become one Raster each, which the terminal paints far cheaper than thousands of styled spans.
export function toMixed(cells, els, prefix) {
  const children = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    children.push(els.Raster({ key: `${prefix}-${children.length}`, columns: run[0].length, rows: run.length, cells: packRows(run) }));
    run = [];
  };
  for (const row of cells) {
    if (rasterable(row)) { run.push(row); continue; }
    flush();
    children.push(toText([row], els.Text, els.Box));
  }
  flush();
  return els.Box({ flexDirection: 'column', children });
}
