#!/usr/bin/env node
// Render all marketing assets from their HTML sources.
//
// Problem this solves: headless Chrome's `--screenshot --window-size=W,H`
// captures a W×H PNG, but the *viewport* is ~87px shorter than H because of
// Chrome's internal window chrome. Net effect: every screenshot had a
// ~87px band of white (unrendered area) at the bottom. This script renders
// at W×(H+PAD), then crops the PAD pixels off the bottom so the full body
// fits and the output is exactly the intended W×H.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_WINDOW_CHROME_PAD = 87; // empirical — Chrome's hidden toolbar
const HERE = dirname(fileURLToPath(import.meta.url));

/** Render one HTML file to PNG at an exact pixel size. */
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

/** Render one HTML file to PDF (for print). */
function renderPdf({ src, out }) {
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--virtual-time-budget=2500',
    '--no-pdf-header-footer',
    `--print-to-pdf=${out}`,
    `file://${resolve(src)}`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  console.log(`  → ${out.replace(HERE + '/', '')}  (PDF)`);
}

const jobs = {
  instagram: [
    { src: 'src/ig-01-launch.html',     out: 'instagram/ig-01-launch.png',    width: 1080, height: 1080 },
    { src: 'src/ig-02-leaderboard.html', out: 'instagram/ig-02-leaderboard.png', width: 1080, height: 1080 },
    { src: 'src/ig-03-winner.html',     out: 'instagram/ig-03-winner.png',    width: 1080, height: 1080 },
    { src: 'src/profile-picture.html',  out: 'instagram/profile-picture.png', width: 1080, height: 1080 },
  ],
  // letter @ 96dpi: 8.5in x 11in = 816 x 1056
  posterPreviews: [
    { src: 'src/poster-stall.html', out: 'posters/poster-stall-preview.png', width: 816,  height: 1056 },
    { src: 'src/poster-door.html',  out: 'posters/poster-door-preview.png',  width: 1056, height: 816 },
  ],
  posterPdfs: [
    { src: 'src/poster-stall.html', out: 'posters/poster-stall.pdf' },
    { src: 'src/poster-door.html',  out: 'posters/poster-door.pdf' },
  ],
};

const which = process.argv[2] || 'all';
process.chdir(HERE);

if (which === 'all' || which === 'ig') {
  console.log('Instagram posts:');
  for (const job of jobs.instagram) renderPng(job);
}
if (which === 'all' || which === 'posters') {
  console.log('Poster previews:');
  for (const job of jobs.posterPreviews) renderPng(job);
  console.log('Poster PDFs:');
  for (const job of jobs.posterPdfs) renderPdf(job);
}

console.log('done.');
