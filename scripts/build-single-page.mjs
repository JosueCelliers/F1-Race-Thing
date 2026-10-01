// Packs the Expo web export into one self-contained HTML page: the JS bundle is
// inlined and every asset (fonts, images) becomes a data: URI. Used to share the
// web build as a single file, e.g. on hosts that only accept one page.
//
//   npm run web:single   ->  dist-web/chequered-lives.html
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { extname, join } from 'node:path';

const [src = 'dist-web', out = join(src, 'chequered-lives.html')] = process.argv.slice(2);
const jsDir = join(src, '_expo/static/js/web');
const entry = readdirSync(jsDir).find((f) => f.startsWith('entry-') && f.endsWith('.js'));
if (!entry) throw new Error(`No web bundle found in ${jsDir}. Run "expo export --platform web" first.`);

const MIME = { '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
let inlined = 0;
let js = readFileSync(join(jsDir, entry), 'utf8').replace(/"(\/assets\/[^"]+)"/g, (whole, path) => {
  const file = join(src, path.slice(1));
  if (!existsSync(file)) return whole;
  inlined++;
  return `"data:${MIME[extname(file).toLowerCase()] ?? 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}"`;
});
// Keep the inline script from being closed or mis-parsed by the HTML tokenizer.
js = js.replaceAll('</script', '<\\/script').replaceAll('<!--', '<\\!--');

const page = `<title>Chequered Lives</title>
<style>
  :root { color-scheme: dark; box-sizing: border-box; height: 100%; background: #06080E; }
  body { height: 100%; margin: 0; overflow: hidden; background: #06080E; color: #F4F6FA; }
  #root { display: flex; height: 100%; flex: 1; }
  noscript { display: block; padding: 24px 16px; font: 16px/1.5 system-ui, sans-serif; }
</style>
<noscript>Chequered Lives needs JavaScript to run.</noscript>
<div id="root"></div>
<script>
${js}
</script>
`;
writeFileSync(out, page);
console.log(`Wrote ${out} (${(Buffer.byteLength(page) / 1e6).toFixed(2)} MB, ${inlined} assets inlined)`);
