import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const target = './esm';
const monacoEsm = './node_modules/monaco-editor/esm';
const outDir = `${target}/vs/editor`;
let cleanedFileCount = 0;

// --- Patch: remove CSS imports (esbuild can't handle them) ---
function walkDir(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, callback);
    } else if (entry.isFile() && full.endsWith('.js')) {
      callback(full);
    }
  }
}

function removeCssImports(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const content = original.replace(/^\s*import\s+[^;]*['"]([^'"]+\.css)['"]\s*;?\s*$/gm, '');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    cleanedFileCount++;
  }
}

function copyFolderRecursive(source, target) {
  // Create target folder if it does not exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true });
}
if (fs.existsSync('./min')) {
  fs.rmSync('./min', { recursive: true, force: true });
}
copyFolderRecursive(monacoEsm, target);
fs.mkdirSync('./min/vs/editor', { recursive: true });
fs.copyFileSync('./node_modules/monaco-editor/min/vs/editor/editor.main.css', `./min/vs/editor/editor.main.css`);

walkDir(path.resolve(target), removeCssImports);
console.log(`Removed CSS imports from ${cleanedFileCount} JavaScript file(s)`);
fs.rmSync('./node_modules/monaco-editor/dev', { recursive: true, force: true });

// --- Patch: fix shadow DOM mouse event handling ---
const mouseHandlerPath = `${target}/vs/editor/browser/controller/mouseHandler.js`;
const mouseHandlerCode = fs.readFileSync(mouseHandlerPath, 'utf8');
const patchedMouseHandler = mouseHandlerCode.replace(
  /this\.viewHelper\.viewDomNode\.contains\(e\.target\)/,
  'this.viewHelper.viewDomNode.contains(e.composedPath()[0])'
);
if (patchedMouseHandler !== mouseHandlerCode) {
  fs.writeFileSync(mouseHandlerPath, patchedMouseHandler);
  console.log('Patched monaco editor mouseHandler');
} else {
  throw new Error(`Could not apply the mouse handler patch to ${mouseHandlerPath}`);
}

// Resolve worker entry points before writing bundles into the same tree.
function findWorkers(dir) {
  const workers = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      workers.push(...findWorkers(full));
    } else if (entry.isFile() && entry.name.endsWith('.worker.js')) {
      workers.push(full);
    }
  }
  return workers;
}

const workerFiles = findWorkers(target);

// --- Bundle: main editor ---
await esbuild.build({
  entryPoints: [`${target}/vs/editor/editor.main.js`],
  outdir: outDir,
  entryNames: 'editor.main.min',
  bundle: true,
  minify: true,
  splitting: true,
  format: 'esm',
  platform: 'neutral',
  external: ['dompurify'],
}).catch(() => process.exit(1));

// --- Bundle: language workers ---
console.log(`Bundling ${workerFiles.length} worker(s) into ${outDir}`);

for (const workerFile of workerFiles) {
  const name = path.basename(workerFile, '.js');
  await esbuild.build({
    entryPoints: [workerFile],
    outdir: outDir,
    entryNames: name,
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'neutral',
    external: ['dompurify'],
    allowOverwrite: true,
  }).catch(() => process.exit(1));
}
