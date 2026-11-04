#!/usr/bin/env node
// 校验主题常量在两处实现里保持一致。
//
// index.html 头部必须内联一段脚本，在首次绘制前定好 html 的 class，
// 否则暗色用户会先看到 body 的浅色背景再跳成深蓝。这段脚本无法复用
// theme-context.tsx 的代码，只能各自声明一遍存储键和默认主题，
// 于是就有了漂移的风险。这里把两处读出来对一遍，并实际执行内联脚本
// 验证它在各种存储状态下与 getInitialTheme 得出相同结论。
//
// 用法: npm run check:theme

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const tsx = readFileSync(join(root, 'src/lib/theme-context.tsx'), 'utf8');

const scriptBody = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
const htmlKey = html.match(/localStorage\.getItem\('([^']+)'\)/)?.[1];
const htmlDefault = html.match(/var theme = '([^']+)'/)?.[1];
const tsKey = tsx.match(/const STORAGE_KEY = '([^']+)'/)?.[1];
const tsDefault = tsx.match(/const DEFAULT_THEME: Theme = '([^']+)'/)?.[1];

let ok = true;
function check(pass, message) {
  if (!pass) ok = false;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${message}`);
}

check(Boolean(scriptBody), 'index.html 头部存在内联主题脚本');
check(htmlKey === tsKey, `存储键一致: index.html=${htmlKey} theme-context=${tsKey}`);
check(htmlDefault === tsDefault, `默认主题一致: index.html=${htmlDefault} theme-context=${tsDefault}`);

// 直接执行产物里的内联脚本，捕获它给 html 设置的 class，避免抄一份逻辑来自证
function runInlineScript(stored) {
  let isLight = null;
  const localStorage = { getItem: () => stored };
  const document = {
    documentElement: { classList: { toggle: (_cls, value) => { isLight = value; } } },
  };
  new Function('localStorage', 'document', scriptBody)(localStorage, document);
  return isLight;
}

function expectedIsLight(stored) {
  return (stored === 'light' || stored === 'dark' ? stored : tsDefault) === 'light';
}

for (const stored of [null, 'light', 'dark', 'garbage', '']) {
  const fromHtml = runInlineScript(stored);
  const fromTs = expectedIsLight(stored);
  check(
    fromHtml === fromTs && typeof fromHtml === 'boolean',
    `stored=${JSON.stringify(stored)} 浅色判定一致: html=${fromHtml} theme-context=${fromTs}`,
  );
}

let survived = true;
try {
  const localStorage = { getItem: () => { throw new Error('blocked'); } };
  const document = { documentElement: { classList: { toggle: () => {} } } };
  new Function('localStorage', 'document', scriptBody)(localStorage, document);
} catch {
  survived = false;
}
check(survived, 'localStorage 被禁用时内联脚本不抛错');

console.log(ok ? '\n结果: 主题常量一致' : '\n结果: 主题常量存在漂移');
process.exit(ok ? 0 : 1);
