/**
 * 回归护栏：基金页样式表必须全部落在 `.fund-app` 作用域内。
 *
 * 背景见 scripts/postcss-scope-fund.mjs。这里的断言是「访问过基金宝之后
 * 其它页面被压成 12 列窄条」这个 bug 的机器判据：只要 fund.css 里再出现
 * 一条未被作用域的规则（例如有人新增了 `.list { … }`），测试就红。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import postcss from 'postcss';

import scopeFundCss, { scopeSelector, splitSelectorList } from './postcss-scope-fund.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FUND_CSS = resolve(here, '../src/fund/fund.css');

/** 作用域之外的例外：sonner toast 由库自己 portal 到 body，类名基金页专属。 */
const ALLOWED_UNSCOPED = /\.sonner-/;

function flattenSelectors(root) {
  const out = [];
  root.walkRules((rule) => {
    const parent = rule.parent;
    if (parent && parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
    for (const part of splitSelectorList(rule.selector)) out.push(part);
  });
  return out;
}

test('单个选择器加作用域', () => {
  assert.deepEqual(scopeSelector('.grid'), ['.fund-app .grid']);
  assert.deepEqual(scopeSelector('.card .title'), ['.fund-app .card .title']);
  assert.deepEqual(scopeSelector('*'), ['.fund-app *']);
  assert.deepEqual(scopeSelector(':root'), ['.fund-app', 'body:has(.fund-app)']);
  assert.deepEqual(scopeSelector('html'), ['html:has(.fund-app)']);
  assert.deepEqual(scopeSelector('body'), ['body:has(.fund-app)']);
  assert.deepEqual(scopeSelector('body::before'), ['body:has(.fund-app)::before']);
  assert.deepEqual(scopeSelector('html::-webkit-scrollbar'), ['html:has(.fund-app)::-webkit-scrollbar']);
});

test('主题守卫保留在作用域外层', () => {
  assert.deepEqual(
    scopeSelector('[data-theme="light"] .glass'),
    ['[data-theme="light"] .fund-app .glass'],
  );
  assert.deepEqual(
    scopeSelector('[data-theme="light"] body::before'),
    ['[data-theme="light"] body:has(.fund-app)::before'],
  );
  assert.deepEqual(
    scopeSelector('[data-theme="light"]'),
    ['[data-theme="light"] .fund-app', '[data-theme="light"] body:has(.fund-app)'],
  );
});

test('选择器列表按顶层逗号切分，不切坏 :is()/:not()', () => {
  assert.deepEqual(splitSelectorList('a, b'), ['a', 'b']);
  assert.deepEqual(splitSelectorList('a:not(.x, .y), b'), ['a:not(.x, .y)', 'b']);
  assert.deepEqual(
    scopeSelector('html, body'),
    ['html:has(.fund-app)', 'body:has(.fund-app)'],
  );
});

test('sonner toast 保持全局', () => {
  assert.deepEqual(
    scopeSelector('[data-theme="dark"] .sonner-toast-custom'),
    ['[data-theme="dark"] .sonner-toast-custom'],
  );
});

test('真实 fund.css 里没有漏网的全局选择器', async () => {
  const css = readFileSync(FUND_CSS, 'utf8');
  const result = await postcss([scopeFundCss()]).process(css, { from: FUND_CSS });
  const selectors = flattenSelectors(postcss.parse(result.css));

  assert.ok(selectors.length > 500, `选择器数量异常：${selectors.length}`);
  const leaked = selectors.filter((sel) => !sel.includes('fund-app') && !ALLOWED_UNSCOPED.test(sel));
  assert.deepEqual(leaked, [], `以下选择器没有作用域，会泄漏到其它页面：\n${leaked.join('\n')}`);
});

test('关键规则确实被改写', async () => {
  const css = readFileSync(FUND_CSS, 'utf8');
  const result = await postcss([scopeFundCss()]).process(css, { from: FUND_CSS });
  const selectors = flattenSelectors(postcss.parse(result.css));

  for (const expected of ['.fund-app .grid', '.fund-app .container', '.fund-app .card', 'body:has(.fund-app)']) {
    assert.ok(selectors.includes(expected), `缺少作用域规则：${expected}`);
  }
  for (const forbidden of ['.grid', '.container', ':root', 'body', 'html']) {
    assert.ok(!selectors.includes(forbidden), `仍有未作用域的规则：${forbidden}`);
  }
});

test('其它样式表原样放行', async () => {
  const css = '.grid{display:grid}\n:root{--primary:0 0% 0%}\nbody{margin:0}\n';
  const result = await postcss([scopeFundCss()]).process(css, { from: resolve(here, '../src/index.css') });
  const selectors = flattenSelectors(postcss.parse(result.css));
  assert.deepEqual(selectors, ['.grid', ':root', 'body']);
});
