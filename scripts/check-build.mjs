import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LAZY_VENDORS = [
  'vendor-charts',
  'vendor-query',
  'vendor-table',
  'vendor-dnd',
  'vendor-motion',
  'vendor-lodash',
];

// Decimal kB, matching Vite's build output. These are regression budgets.
const MAX_CHUNK_BYTES = 800_000;
const MAX_ENTRY_BYTES = 320_000;
const MAX_HOME_BYTES = 400_000;
const MAX_TOTAL_BYTES = 2_600_000;

export function checkBuild(manifest, getSize) {
  const chunks = Object.entries(manifest).filter(([, chunk]) => chunk.file.endsWith('.js'));
  const errors = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(key, chain = []) {
    if (!manifest[key]) throw new Error(`Missing manifest dependency: ${key}`);
    if (visiting.has(key)) {
      throw new Error(`Static import cycle: ${[...chain, key].join(' -> ')}`);
    }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const dependency of manifest[key].imports || []) visit(dependency, [...chain, key]);
    visiting.delete(key);
    visited.add(key);
  }
  for (const [key] of chunks) visit(key);
  for (const [key, chunk] of chunks) {
    for (const dependency of chunk.dynamicImports || []) {
      if (!manifest[dependency]) throw new Error(`Missing dynamic dependency: ${key} -> ${dependency}`);
    }
  }

  function closure(key, result = new Set()) {
    if (!manifest[key]) throw new Error(`Missing required entry: ${key}`);
    if (result.has(key)) return result;
    result.add(key);
    for (const dependency of manifest[key].imports || []) closure(dependency, result);
    return result;
  }

  // Count each output file once, even if multiple manifest keys refer to it.
  const files = new Map(chunks.map(([, chunk]) => [chunk.file, getSize(chunk.file)]));
  const sizeOf = (keys) => [...new Set([...keys].map((key) => manifest[key].file))]
    .reduce((sum, file) => sum + (files.get(file) || 0), 0);
  for (const [file, bytes] of files) {
    if (bytes > MAX_CHUNK_BYTES) errors.push(`${file}: ${bytes} > ${MAX_CHUNK_BYTES} bytes`);
  }

  const entry = closure('index.html');
  const home = closure('src/pages/DashboardPage.tsx', new Set(entry));
  const fundKey = chunks.find(([, chunk]) => chunk.name === 'FundTab' && chunk.isDynamicEntry)?.[0];
  if (!fundKey) throw new Error('Missing lazy FundTab entry');
  const fund = closure(fundKey);
  const lazyEntries = new Set();
  function collectLazyEntries(key) {
    if (lazyEntries.has(key)) return;
    lazyEntries.add(key);
    const chunk = manifest[key];
    for (const dependency of [...(chunk.imports || []), ...(chunk.dynamicImports || [])]) {
      collectLazyEntries(dependency);
    }
  }
  collectLazyEntries('index.html');
  if (!lazyEntries.has(fundKey)) errors.push('FundTab is not reachable from the application entry');
  if (home.has(fundKey)) errors.push('FundTab is eagerly loaded by the home page');
  for (const name of LAZY_VENDORS) {
    const key = chunks.find(([, chunk]) => chunk.name === name)?.[0];
    if (!key || !fund.has(key)) errors.push(`Missing fund vendor: ${name}`);
    if (key && home.has(key)) errors.push(`Home page eagerly loads ${name}`);
    if (key && closure(key).has('index.html')) {
      errors.push(`${name} depends on the application entry`);
    }
  }

  const sizes = {
    entryBytes: sizeOf(entry),
    homeBytes: sizeOf(home),
    fundBytes: sizeOf(fund),
    totalBytes: [...files.values()].reduce((sum, bytes) => sum + bytes, 0),
    largestChunkBytes: Math.max(...files.values()),
  };
  for (const [key, limit] of [
    ['entryBytes', MAX_ENTRY_BYTES],
    ['homeBytes', MAX_HOME_BYTES],
    ['totalBytes', MAX_TOTAL_BYTES],
  ]) {
    if (sizes[key] > limit) errors.push(`${key}: ${sizes[key]} > ${limit} bytes`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return sizes;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const output = resolve(process.argv[2] || 'dist');
    const manifest = JSON.parse(readFileSync(resolve(output, '.vite/manifest.json'), 'utf8'));
    const sizes = checkBuild(manifest, (file) => statSync(resolve(output, file)).size);
    console.log('Build budgets and lazy-loading boundaries passed.');
    for (const [name, bytes] of Object.entries(sizes)) {
      console.log(`${name}: ${(bytes / 1000).toFixed(2)} kB`);
    }
  } catch (error) {
    console.error(`Build check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
