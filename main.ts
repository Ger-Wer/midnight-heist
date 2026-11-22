// Midnight Heist — harness entry point.
// Renders the four staged screenshots into /output/<id>/ and writes the
// dossier to /output/<id>/dossier.json, exactly as the kit asks.
//
// IMPORTANT: /output is a mounted volume on the grader. Never delete the
// directory itself — only clear its contents, one entry at a time.

import { readdirSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';
import { pathToFileURL } from 'node:url';

function clearDirContents(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function main(): void {
  const entryId = process.argv[2];
  if (!entryId) throw new Error('usage: node main.ts <entry-id>');
  const inputDir = process.env.MAKEFUN_INPUT_DIR ?? '/input';
  const outRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  const outDir = join(outRoot, entryId);
  mkdirSync(outDir, { recursive: true });
  clearDirContents(outDir);

  const rootDir = resolve(import.meta.dirname);
  const dossier = buildDossier(rootDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });

  writeFileSync(join(outDir, 'dossier.json'), JSON.stringify(dossier, null, 2));
  console.log(`dossier written: ${dossier.game.files} files, ${dossier.screenshots.length} screenshots`);
}

main();
