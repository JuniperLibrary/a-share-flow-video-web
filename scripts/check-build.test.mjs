import assert from 'node:assert/strict';
import test from 'node:test';
import { checkBuild } from './check-build.mjs';

function fixture() {
  const vendors = ['charts', 'query', 'table', 'dnd', 'motion', 'lodash'];
  return {
    'index.html': {
      file: 'assets/index.js',
      isEntry: true,
      imports: ['runtime'],
      dynamicImports: ['src/pages/DashboardPage.tsx', 'fund'],
    },
    runtime: { file: 'assets/runtime.js' },
    'src/pages/DashboardPage.tsx': {
      file: 'assets/home.js',
      imports: ['index.html'],
    },
    fund: {
      file: 'assets/fund.js',
      name: 'FundTab',
      isDynamicEntry: true,
      imports: ['index.html', ...vendors],
    },
    ...Object.fromEntries(vendors.map((name) => [name, {
      file: `assets/vendor-${name}.js`,
      name: `vendor-${name}`,
      imports: ['runtime'],
    }])),
  };
}

test('accepts lazy vendors sharing an isolated runtime and counts files once', () => {
  const manifest = fixture();
  manifest.alias = { ...manifest.charts };
  const result = checkBuild(manifest, () => 1000);
  assert.equal(result.entryBytes, 2000);
  assert.equal(result.homeBytes, 3000);
  assert.equal(result.fundBytes, 9000);
  assert.equal(result.totalBytes, 10000);
});

test('rejects an oversized individual chunk', () => {
  assert.throws(() => checkBuild(fixture(), (file) => (
    file === 'assets/fund.js' ? 800_001 : 1000
  )), /800001 > 800000/);
});

test('rejects an oversized entry dependency closure', () => {
  const manifest = fixture();
  manifest['index.html'].imports = ['shared'];
  manifest.shared = { file: 'assets/shared.js' };
  assert.throws(() => checkBuild(manifest, (file) => (
    ['assets/index.js', 'assets/shared.js'].includes(file) ? 161_000 : 1000
  )), /entryBytes: 322000/);
});

test('rejects an oversized home page closure', () => {
  assert.throws(() => checkBuild(fixture(), (file) => (
    file === 'assets/home.js' ? 400_000 : 1000
  )), /homeBytes: 402000/);
});

test('rejects total size growth even when each chunk is within budget', () => {
  assert.throws(() => checkBuild(fixture(), () => 300_000), /totalBytes: 3000000/);
});

test('rejects vendors accidentally imported by the home page', () => {
  const manifest = fixture();
  manifest['src/pages/DashboardPage.tsx'].imports.push('charts');
  assert.throws(() => checkBuild(manifest, () => 1000), /Home page eagerly loads vendor-charts/);
});

test('rejects a static import cycle', () => {
  const manifest = fixture();
  manifest['index.html'].imports = ['charts'];
  manifest.charts.imports = ['index.html'];
  assert.throws(() => checkBuild(manifest, () => 1000), /Static import cycle/);
});

test('rejects vendors coupled to the application entry through shared helpers', () => {
  const manifest = fixture();
  manifest.charts.imports = ['helper'];
  manifest.helper = { file: 'assets/helper.js', imports: ['index.html'] };
  assert.throws(() => checkBuild(manifest, () => 1000), /vendor-charts depends on the application entry/);
});

test('rejects missing static and dynamic dependencies', () => {
  for (const field of ['imports', 'dynamicImports']) {
    const manifest = fixture();
    manifest.fund[field] = ['missing'];
    assert.throws(() => checkBuild(manifest, () => 1000), /Missing .*dependency/);
  }
});

test('rejects an absent, disconnected or eagerly loaded fund page', () => {
  const absent = fixture();
  absent.fund.name = 'OtherPage';
  assert.throws(() => checkBuild(absent, () => 1000), /Missing lazy FundTab/);

  const disconnected = fixture();
  disconnected['index.html'].dynamicImports = ['src/pages/DashboardPage.tsx'];
  assert.throws(() => checkBuild(disconnected, () => 1000), /FundTab is not reachable/);

  const eager = fixture();
  eager.fund.imports = [];
  eager['index.html'].imports = ['fund'];
  assert.throws(() => checkBuild(eager, () => 1000), /FundTab is eagerly loaded/);
});

test('rejects a vendor no longer split from the fund page', () => {
  const manifest = fixture();
  manifest.fund.imports = manifest.fund.imports.filter((key) => key !== 'charts');
  delete manifest.charts;
  assert.throws(() => checkBuild(manifest, () => 1000), /Missing fund vendor: vendor-charts/);
});
