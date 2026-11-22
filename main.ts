// The Velvet Vault — entrypoint (Node 22, standard library only).
// Hands the game in: copies game/ and screenshots/ from beside this file
// into /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the kit's vendored library.
//
// The output directory is a mounted volume on the grader: this program
// NEVER deletes it. It only removes the entries inside it, one by one,
// then copies the game in. Two runs write byte-for-byte the same output.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Remove every entry inside a directory, leaving the directory itself
// standing. Deleting the directory would break the grader's mount.
function clearDirContents(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function copyTree(from, to) {
  if (!existsSync(from)) return;
  cpSync(from, to, { recursive: true });
}

function main() {
  mkdirSync(outDir, { recursive: true });
  clearDirContents(outDir);
  copyTree(join(here, 'game'), join(outDir, 'game'));
  copyTree(join(here, 'screenshots'), join(outDir, 'screenshots'));
  // The scorer's own caps (RULES.txt, gate.json): only text_max_bytes shapes
  // the dossier's bytes; the other caps refuse an entry the scorer would
  // refuse, so passing them here fails the same way instead of later.
  writeFileSync(
    join(outDir, 'dossier.json'),
    buildDossier(outDir, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      game_max_files: 993,
      game_max_bytes: 50331648,
      game_path_max_bytes: 1000,
    }),
  );
}

main();
