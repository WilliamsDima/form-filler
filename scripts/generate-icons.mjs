// Рисует иконки расширения в public/icon/*.png без внешних зависимостей.
// Та же картинка, что и логотип в попапе (components/Icons.tsx): градиент, два поля ввода и молния.
// Запуск: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const SIZES = [16, 32, 48, 128];
const SAMPLES = 4; // суперсэмплинг для сглаживания краёв
const VIEWBOX = 32;

const GRADIENT_FROM = [139, 124, 255];
const GRADIENT_TO = [79, 70, 229];

const BARS = [
  { x: 5, y: 9, w: 13, h: 4, r: 2 },
  { x: 5, y: 16, w: 8, h: 4, r: 2 },
];
const BOLT = [
  [21.5, 11.5],
  [14, 20.5],
  [20.75, 20.5],
  [20, 26.5],
  [27.5, 17.5],
  [20.75, 17.5],
];

function insideRoundedRect(px, py, { x, y, w, h, r }) {
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return px >= x && px <= x + w && py >= y && py <= y + h && (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function insidePolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Цвет и непрозрачность одной точки в координатах 32×32. */
function shade(x, y) {
  if (!insideRoundedRect(x, y, { x: 0, y: 0, w: 32, h: 32, r: 8 })) return [0, 0, 0, 0];
  const t = (x + y) / (2 * VIEWBOX);
  let color = GRADIENT_FROM.map((from, i) => from + (GRADIENT_TO[i] - from) * t);
  const overlay = (alpha) => (color = color.map((c) => c + (255 - c) * alpha));
  if (BARS.some((bar) => insideRoundedRect(x, y, bar))) overlay(0.55);
  if (insidePolygon(x, y, BOLT)) overlay(1);
  return [...color, 255];
}

function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = VIEWBOX / size;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0, 0];
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const [r, g, b, a] = shade((px + (sx + 0.5) / SAMPLES) * scale, (py + (sy + 0.5) / SAMPLES) * scale);
          sum[0] += r * a;
          sum[1] += g * a;
          sum[2] += b * a;
          sum[3] += a;
        }
      }
      const offset = (py * size + px) * 4;
      const alpha = sum[3] / SAMPLES ** 2;
      for (let c = 0; c < 3; c++) pixels[offset + c] = sum[3] ? Math.round(sum[c] / sum[3]) : 0;
      pixels[offset + 3] = Math.round(alpha);
    }
  }
  return encodePng(size, pixels);
}

function encodePng(size, pixels) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8 бит, RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

mkdirSync('public/icon', { recursive: true });
for (const size of SIZES) {
  writeFileSync(`public/icon/${size}.png`, render(size));
  console.log(`public/icon/${size}.png`);
}
