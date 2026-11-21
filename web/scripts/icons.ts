import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const TOKENS: Record<string, string> = {
  '--bg': '#fdf6ff',
  '--ink': '#2b2140',
  '--soft': '#6c5f86',
  '--pink': '#ffc4dc',
  '--pink-dark': '#f08bb4',
  '--sun': '#ffd166',
};

const SOURCE = new URL('../src/ui/chispa.svg', import.meta.url);
const OUT = new URL('../public/icons/', import.meta.url);

const ICONS = [
  { file: 'favicon-32.png', size: 32, fill: 1, transparent: true },
  { file: 'icon-192.png', size: 192, fill: 0.86 },
  { file: 'icon-512.png', size: 512, fill: 0.86 },
  { file: 'icon-maskable-512.png', size: 512, fill: 0.62 },
  { file: 'apple-touch-icon.png', size: 180, fill: 0.86 },
];

function inner(svg: string): string {
  const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return body.replace(/var\((--[\w-]+)[^)]*\)/g, (_, name: string) => TOKENS[name] ?? '#000');
}

function compose(body: string, size: number, fill: number, transparent = false): string {
  const scale = (size / 200) * fill;
  const offset = (size - 200 * scale) / 2;
  const background = transparent
    ? ''
    : `<rect width="${size}" height="${size}" fill="${TOKENS['--bg']}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${background}
<g transform="translate(${offset} ${offset}) scale(${scale})">${body}</g></svg>`;
}

const body = inner(await readFile(SOURCE, 'utf8'));
await mkdir(OUT, { recursive: true });
await writeFile(new URL('favicon.svg', OUT), compose(body, 200, 1, true));
console.log('icons/favicon.svg');
for (const { file, size, fill, transparent } of ICONS) {
  await sharp(Buffer.from(compose(body, size, fill, transparent)))
    .png()
    .toFile(new URL(file, OUT).pathname);
  console.log(`icons/${file}`);
}
