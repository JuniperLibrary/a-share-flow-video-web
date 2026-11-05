/**
 * 把 `src/fund/fund.css` 的所有选择器收进 `.fund-app` 作用域。
 *
 * 背景：基金页（FundTab）是懒加载的，它的 CSS 一旦注入就不会卸载。而 fund.css
 * 是从一个独立站点整体搬过来的，里面有大量与 Tailwind 撞名的全局规则
 * （`.grid` → `repeat(12, 1fr)`、`.card`、`.input`、`.container` …）以及
 * `:root` / `body` / `html` 上的设计变量。这些规则会在「访问过基金宝之后」
 * 一直生效，把其它页面的栅格压成 12 列窄条，并把 `--primary` 顶成 `#22d3ee`。
 *
 * 641 条规则、216 个全局选择器手改不现实，也容易在后续维护中漏掉，
 * 因此在构建期自动加作用域：
 *
 *   .grid            → .fund-app .grid
 *   :root            → .fund-app, body:has(.fund-app)   （变量要能被 body 用到）
 *   body / body::before → body:has(.fund-app) / body:has(.fund-app)::before
 *   html / html::-webkit-scrollbar → html:has(.fund-app)…
 *   [data-theme=x] .glass → [data-theme=x] .fund-app .glass（主题守卫保留在外层）
 *   *                → .fund-app *
 *
 * `:has()` 让 body/html 级规则只在基金页挂载期间生效，路由切走即失效。
 * `.sonner-*` 例外：toast 由 sonner 自己 portal 到 body，类名是基金页专用的，
 * 加了作用域反而会失效（主站不使用 sonner）。
 */

const SCOPE_CLASS = 'fund-app';
const SCOPE = `.${SCOPE_CLASS}`;
const BODY_SCOPE = `body:has(${SCOPE})`;
const HTML_SCOPE = `html:has(${SCOPE})`;

/** 只处理基金页样式表；其它文件的 from 不匹配，原样放行。 */
const TARGET_FILE = /(?:^|[\\/])src[\\/]fund[\\/]fund\.css$/i;

/** sonner toast 的类名是基金页专属，且渲染在 body 下，保持全局。 */
const KEEP_GLOBAL = /\.sonner-/;

const THEME_GUARD = /^(\[data-theme\s*=\s*["'][^"']*["']\])\s*(.*)$/;

/** 按顶层逗号切分选择器列表，避免切坏 `:is(a, b)` / `:not(a, b)`。 */
export function splitSelectorList(selector) {
  const parts = [];
  let buf = '';
  let depth = 0;
  let quote = null;

  for (const ch of selector) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  parts.push(buf);

  return parts.map((p) => p.trim()).filter(Boolean);
}

function scopeWithoutGuard(sel) {
  if (KEEP_GLOBAL.test(sel)) return [sel];
  if (sel === '*') return [`${SCOPE} *`];
  if (sel === ':root') return [SCOPE, BODY_SCOPE];
  if (/^:root(?![\w-])/.test(sel)) return [`${SCOPE}${sel.slice(':root'.length)}`];
  if (/^html(?![\w-])/.test(sel)) return [`${HTML_SCOPE}${sel.slice('html'.length)}`];
  if (/^body(?![\w-])/.test(sel)) return [`${BODY_SCOPE}${sel.slice('body'.length)}`];
  return [`${SCOPE} ${sel}`];
}

/** 给单个选择器加作用域，可能展开成多个（`:root`）。 */
export function scopeSelector(selector) {
  const out = [];

  for (const sel of splitSelectorList(selector)) {
    const guard = sel.match(THEME_GUARD);
    if (guard) {
      const [, theme, rest] = guard;
      // 形如 `[data-theme="light"] { --bg: … }` 的变量块要同时落到 body 上。
      const scoped = rest ? scopeWithoutGuard(rest) : [SCOPE, BODY_SCOPE];
      for (const s of scoped) out.push(`${theme} ${s}`);
      continue;
    }
    out.push(...scopeWithoutGuard(sel));
  }

  return out;
}

function isKeyframeStep(rule) {
  const parent = rule.parent;
  return Boolean(parent && parent.type === 'atrule' && /keyframes$/i.test(parent.name));
}

export default function scopeFundCss() {
  return {
    postcssPlugin: 'postcss-scope-fund',
    Once(root, { result }) {
      const from = (result.opts && result.opts.from) || '';
      if (!TARGET_FILE.test(from)) return;

      root.walkRules((rule) => {
        if (isKeyframeStep(rule)) return;
        const scoped = scopeSelector(rule.selector);
        if (scoped.length === 0) {
          rule.remove();
          return;
        }
        rule.selector = scoped.join(', ');
        if (rule.raws) delete rule.raws.selector;
      });
    },
  };
}

scopeFundCss.postcss = true;
