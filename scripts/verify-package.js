import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const requiredFiles = new Set([
  packageJson.main,
  packageJson.style,
  './esm/vs/editor/editor.worker.js',
  './min/vs/editor/editor.main.css',
]);

for (const relativePath of requiredFiles) {
  const normalizedPath = relativePath.replace(/^\.\//, '');
  const absolutePath = path.join(root, normalizedPath);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size === 0) {
    throw new Error(`Required publish output is missing or empty: ${relativePath}`);
  }
}

console.log('Publish outputs verified:');
for (const relativePath of requiredFiles) {
  console.log(`- ${relativePath}`);
}
