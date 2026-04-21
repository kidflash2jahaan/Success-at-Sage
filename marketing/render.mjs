#!/usr/bin/env node
// Render the profile picture from its HTML source.
//
// All other marketing assets (IG posts, posters) are now generated
// dynamically from live contest data via admin-only OG image routes
// under `/og/*` — the /admin/contest "Marketing Assets" section is
// where they're downloaded from. The profile picture is the one piece
// that stays static, because the IG profile photo shouldn't change
// month to month.
//
// Why the +87px padding: headless Chrome's `--screenshot --window-size=W,H`
// gives you a W×H PNG but only W×(H-87) of actual viewport — leaving a
// band of unrendered white at the bottom. This script renders 87px taller
// than needed and crops it off so output is exactly the intended size.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_WINDOW_CHROME_PAD = 87;
const HERE = dirname(fileURLToPath(import.meta.url));

function renderPng({ src, out, width, height }) {
  const tmpDir = mkdtempSync(join(tmpdir(), 'render-'));
  const raw = join(tmpDir, 'raw.png');
  try {
    execFileSync(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--virtual-time-budget=2500',
      `--screenshot=${raw}`,
      `--window-size=${width},${height + CHROME_WINDOW_CHROME_PAD}`,
      `file://${resolve(src)}`,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    const png = PNG.sync.read(readFileSync(raw));
    if (png.width !== width || png.height < height) {
      throw new Error(`unexpected raw size ${png.width}x${png.height} (wanted ${width}x${height}+)`);
    }
    const cropped = new PNG({ width, height });
    png.data.copy(cropped.data, 0, 0, width * height * 4);
    writeFileSync(out, PNG.sync.write(cropped));
    console.log(`  → ${out.replace(HERE + '/', '')}  (${width}x${height})`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

process.chdir(HERE);

console.log('Profile picture:');
renderPng({
  src: 'src/profile-picture.html',
  // Written into `public/` so the admin panel can serve it directly and
  // the user can grab it from /admin/contest → "Marketing Assets".
  out: '../public/brand/profile-picture.png',
  width: 1080,
  height: 1080,
});

console.log('done.');
