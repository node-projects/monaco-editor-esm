import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');

process.chdir(root);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function run(command, args) {
  console.log(`> ${path.basename(command)} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`);
  }
}

function runNpm(args) {
  if (process.env.npm_execpath) {
    run(process.execPath, [process.env.npm_execpath, ...args]);
    return;
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npmCommand, args);
}

function updateDependencies() {
  const packageJson = readJson(packagePath);
  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const devDependencies = Object.keys(packageJson.devDependencies ?? {});

  if (dependencies.length > 0) {
    runNpm(['install', '--save', ...dependencies.map((name) => `${name}@latest`)]);
  }
  if (devDependencies.length > 0) {
    runNpm(['install', '--save-dev', ...devDependencies.map((name) => `${name}@latest`)]);
  }
}

function alignPackageVersion() {
  const monacoVersion = readJson(path.join(root, 'node_modules', 'monaco-editor', 'package.json')).version;
  const packageJson = readJson(packagePath);
  const packageLock = readJson(lockPath);

  packageJson.version = monacoVersion;
  packageLock.version = monacoVersion;
  if (packageLock.packages?.['']) {
    packageLock.packages[''].version = monacoVersion;
  }

  writeJson(packagePath, packageJson);
  writeJson(lockPath, packageLock);
  console.log(`Package version aligned with monaco-editor ${monacoVersion}`);
}

function reinstallMonaco() {
  const nodeModulesPath = path.resolve(root, 'node_modules');
  const monacoPath = path.resolve(nodeModulesPath, 'monaco-editor');
  if (!monacoPath.startsWith(`${nodeModulesPath}${path.sep}`)) {
    throw new Error(`Refusing to clean unexpected path: ${monacoPath}`);
  }

  fs.rmSync(monacoPath, { recursive: true, force: true });
  runNpm(['install']);
}

console.log('Preparing npm package...');
updateDependencies();
reinstallMonaco();
alignPackageVersion();
runNpm(['run', 'build']);
runNpm(['run', 'verify:package']);
