/**
 * 日报图片生成脚本
 * 用法: node scripts/report-screenshot.mjs <props.json> <output.png> [sceneIndex]
 *
 * props.json 包含:
 * {
 *   "report": { ... },          // DailyReport
 *   "thematicCards": [ ... ],    // ThematicCard[]
 *   "date": "2026-06-15"
 * }
 *
 * sceneIndex: -1=封面(默认), 0=专题0, 1=专题1, ...
 *
 * 依赖: playwright (npm install playwright)
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function main() {
  const [, , propsPath, outputPath, sceneIndexStr = '-1'] = process.argv;

  if (!propsPath || !outputPath) {
    console.error('用法: node scripts/report-screenshot.mjs <props.json> <output.png> [sceneIndex]');
    process.exit(1);
  }

  // 1. 读取 props
  const propsJson = readFileSync(propsPath, 'utf-8');
  const props = JSON.parse(propsJson);

  // 2. 生成内联 HTML，直接渲染 React 组件
  const sceneIndex = parseInt(sceneIndexStr, 10);
  const html = buildInlineHtml(props, sceneIndex);

  // 3. 启动 Playwright 截图
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 2, // Retina 清晰度
  });

  // 使用 base64 内联 HTML 避免文件依赖
  const dataUrl = `data:text/html;base64,${Buffer.from(html).toString('base64')}`;
  await page.goto(dataUrl, { waitUntil: 'networkidle' });

  // 等待 React 渲染完成
  await page.waitForTimeout(500);

  // 4. 截图
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'png',
  });

  console.log(`✅ 截图已保存: ${outputPath}`);
  await browser.close();
}

/**
 * 构建内联 HTML（极简版组件，使用 Preact + htm 避免构建依赖）
 * 生产环境可用 React 构建产物替代
 */
function buildInlineHtml(props, sceneIndex) {
  const { report, thematicCards, date } = props;

  // 计算每个场景对应的卡片数据
  let sceneData;
  if (sceneIndex < 0 || sceneIndex >= thematicCards.length) {
    // 封面模式
    const primary = thematicCards[0] || {};
    sceneData = {
      type: 'cover',
      theme: primary.theme || '市场复盘',
      conviction: primary.conviction || 0,
      timeHorizon: primary.timeHorizon || '日内',
      summary: primary.summary || `${report.summary || ''}`,
      netTotal: report.netTotal || 0,
      inflowCount: report.inflowCount || 0,
      outflowCount: report.outflowCount || 0,
    };
  } else {
    // 详情模式
    const tc = thematicCards[sceneIndex];
    sceneData = {
      type: 'detail',
      themeTone: getThemeTone(tc.theme),
      reasoning: tc.reasoning || '',
      cards: tc.cards || [],
      theme: tc.theme,
    };
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    min-height: 1920px;
    background: #0a0f18;
    font-family: "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* Cover styles */
  .cover { width: 1080px; min-height: 1920px; background: linear-gradient(180deg, #0a0f18, #141b2b, #0d1520); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 60px; }
  .cover::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 30%, rgba(74,128,208,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(245,113,113,0.06) 0%, transparent 50%); }
  .date-bar { position: absolute; top: 60; left: 60; right: 60; display: flex; justify-content: space-between; }
  .date-bar .label { color: #4a80d0; font-size: 24px; font-weight: 600; letter-spacing: 4px; }
  .date-bar .date { color: #8899aa; font-size: 22px; font-weight: 500; }
  .divider { position: absolute; top: 110px; left: 60px; right: 60px; height: 1px; background: linear-gradient(90deg, transparent, #2a3550, transparent); }
  .theme-badge { display: inline-block; padding: 6px 24px; border-radius: 20px; font-size: 18px; font-weight: 500; letter-spacing: 3px; margin-bottom: 30px; }
  .theme-badge.up { border: 1px solid rgba(74,222,128,0.27); background: rgba(74,222,128,0.07); color: #4ade80; }
  .theme-badge.down { border: 1px solid rgba(248,113,113,0.27); background: rgba(248,113,113,0.07); color: #f87171; }
  .theme-badge.neutral { border: 1px solid rgba(251,191,36,0.27); background: rgba(251,191,36,0.07); color: #fbbf24; }
  .cover-title { font-size: 52px; font-weight: 700; color: #fff; text-align: center; line-height: 1.3; letter-spacing: 3px; text-shadow: 0 4px 24px rgba(0,0,0,0.5); }
  .cover-meta { margin-top: 24px; font-size: 18px; color: #8899aa; letter-spacing: 2px; }
  .metrics-row { display: flex; gap: 30px; margin-top: 80px; }
  .metric-box { flex: 1; background: linear-gradient(180deg, rgba(20,30,50,0.6), rgba(15,22,36,0.6)); border-radius: 12px; border: 1px solid rgba(60,80,120,0.2); padding: 20px 16px; text-align: center; }
  .metric-box .mlabel { color: #8899aa; font-size: 14px; letter-spacing: 2px; }
  .metric-box .mvalue { font-size: 36px; font-weight: 700; font-family: "Helvetica Neue", Arial, sans-serif; margin: 8px 0; }
  .metric-box .mnote { color: #5a6a7a; font-size: 13px; }
  .mvalue.up { color: #4ade80; }
  .mvalue.down { color: #f87171; }
  .mvalue.neutral { color: #fbbf24; }

  /* Detail styles */
  .detail { width: 1080px; min-height: 1920px; background: linear-gradient(180deg, #0a0f18, #111927, #0d1520); padding: 60px 50px; display: flex; flex-direction: column; position: relative; }
  .tag-badge { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .tag-badge .tag { padding: 4px 16px; border-radius: 4px; font-size: 16px; font-weight: 600; letter-spacing: 2px; }
  .tag-badge .tag.up { background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2); color: #4ade80; }
  .tag-badge .tag.down { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; }
  .tag-badge .tag.neutral { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); color: #fbbf24; }
  .tag-badge .idx { color: #556677; font-size: 14px; letter-spacing: 1px; }
  .detail-title { font-size: 38px; font-weight: 700; color: #fff; line-height: 1.3; letter-spacing: 3px; margin-bottom: 10px; }
  .detail-subtitle { font-size: 18px; color: #8899aa; letter-spacing: 2px; line-height: 1.5; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(42,53,80,0.5); }
  .dmetrics { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 30px; }
  .dmetric { flex: 1 0 calc(50% - 6px); background: linear-gradient(135deg, rgba(20,30,50,0.5), rgba(15,22,36,0.5)); border-radius: 10px; border: 1px solid rgba(60,80,120,0.2); padding: 16px 18px; }
  .dmetric .dl { color: #6a7a8a; font-size: 14px; letter-spacing: 1px; }
  .dmetric .dv { font-size: 30px; font-weight: 700; display: flex; align-items: baseline; gap: 8px; }
  .dmetric .dv .v { }
  .dmetric .dv .n { font-size: 16px; }

  .section-label { color: #6a7a8a; font-size: 15px; letter-spacing: 2px; margin-bottom: 10px; }
  .hl-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .hl-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-radius: 8px; background: rgba(20,30,50,0.3); }
  .hl-item .hll { display: flex; align-items: center; gap: 10px; }
  .hl-item .hll .dot { width: 6px; height: 6px; border-radius: 50%; }
  .hl-item .hll .name { color: #e0e0e0; font-size: 18px; font-weight: 500; }
  .hl-item .hlv { font-size: 16px; font-weight: 500; }

  .bullets { flex: 1; }
  .bullet { margin-bottom: 12px; }
  .bullet .bt { color: #4ade80; font-size: 16px; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px; }
  .bullet .bt.down { color: #f87171; }
  .bullet .bt.neutral { color: #fbbf24; }
  .bullet .bd { color: #b0b8c8; font-size: 16px; line-height: 1.6; padding-left: 16px; }

  .footer { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(42,53,80,0.4); color: #4a5a6a; font-size: 14px; text-align: center; letter-spacing: 2px; }
  .reasoning-banner { padding: 12px 20px; border-radius: 8px; background: rgba(20,30,50,0.7); border: 1px solid rgba(60,80,120,0.2); font-size: 16px; color: #8899aa; line-height: 1.6; letter-spacing: 1px; margin-bottom: 20px; }
</style>
</head>
<body>
${sceneData.type === 'cover' ? renderCover(sceneData) : renderDetail(sceneData)}
</body>
</html>`;
}

function renderCover(data) {
  const tone = getThemeTone(data.theme);
  const dir = data.netTotal >= 0 ? '净流入' : '净流出';
  const netAbs = Math.abs(data.netTotal);

  return `
<div class="cover">
  <div class="date-bar">
    <span class="label">A 股收盘快报</span>
    <span class="date">${data.date || ''}</span>
  </div>
  <div class="divider"></div>
  <div style="text-align:center;margin-top:-80px;padding:0 60px;">
    <div class="theme-badge ${tone}">${data.theme}</div>
    <div class="cover-title">${data.summary}</div>
    <div class="cover-meta">${data.timeHorizon} · 确信度 ${Math.round(data.conviction * 100)}%</div>
  </div>
  <div class="metrics-row">
    <div class="metric-box">
      <div class="mlabel">全市场</div>
      <div class="mvalue ${tone}">${netAbs}亿</div>
      <div class="mnote">${dir}</div>
    </div>
    <div class="metric-box">
      <div class="mlabel">流入板块</div>
      <div class="mvalue neutral">${data.inflowCount}</div>
      <div class="mnote">流出 ${data.outflowCount}</div>
    </div>
    <div class="metric-box">
      <div class="mlabel">风格</div>
      <div class="mvalue ${tone}">${dir}</div>
      <div class="mnote">${netAbs > 100 ? '资金充沛' : netAbs < 50 ? '资金承压' : '窄幅波动'}</div>
    </div>
  </div>
  <div style="position:absolute;bottom:100px;left:60px;right:60px;">
    <div style="display:flex;justify-content:space-between;color:#556677;font-size:14px;letter-spacing:2px;margin-bottom:8px;">
      <span>AI 确信度</span>
      <span>${Math.round(data.conviction * 100)}%</span>
    </div>
    <div style="height:4px;background:#1a2538;border-radius:2px;">
      <div style="width:${data.conviction * 100}%;height:100%;background:linear-gradient(90deg, rgba(74,222,128,0.4), #4ade80);border-radius:2px;"></div>
    </div>
  </div>
  <div style="position:absolute;bottom:40px;left:60px;right:60px;text-align:center;color:#3a4a5a;font-size:14px;letter-spacing:2px;">
    市场有风险，投资需谨慎
  </div>
</div>`;
}

function renderDetail(data) {
  const card = data.cards[0] || {};
  const tone = data.themeTone;

  const metrics = (card.metrics || []).slice(0, 4);
  const highlights = (card.highlights || []).slice(0, 6);
  const bullets = (card.bullets || []).slice(0, 5);

  return `
<div class="detail">
  ${data.reasoning ? `<div class="reasoning-banner">💡 ${data.reasoning.substring(0, 120)}…</div>` : ''}

  <div class="tag-badge">
    <span class="tag ${tone}">${card.tag || data.theme}</span>
    <span class="idx">${card.index || 1}/${card.total || 1}</span>
  </div>

  <div class="detail-title">${card.title || ''}</div>
  <div class="detail-subtitle">${card.subtitle || ''}</div>

  ${metrics.length > 0 ? `
  <div class="dmetrics">
    ${metrics.map(m => `
    <div class="dmetric">
      <div class="dl">${m.label}</div>
      <div class="dv">
        <span class="v" style="color:${toneColor(m.tone)}">${m.value}</span>
        <span class="n" style="color:${m.tone ? toneColor(m.tone) : '#8899aa'}">${m.note || ''}</span>
      </div>
    </div>`).join('')}
  </div>` : ''}

  ${highlights.length > 0 ? `
  <div class="section-label">领涨 / 活跃</div>
  <div class="hl-list">
    ${highlights.map(h => `
    <div class="hl-item">
      <div class="hll">
        <div class="dot" style="background:${h.tone ? toneColor(h.tone) : '#556677'}"></div>
        <span class="name">${h.title}</span>
      </div>
      <span class="hlv" style="color:${h.tone ? toneColor(h.tone) : '#8899aa'}">${h.detail}</span>
    </div>`).join('')}
  </div>` : ''}

  ${bullets.length > 0 ? `
  <div class="section-label" style="margin-top:${highlights.length > 0 ? '10px' : '0'}">深度解读</div>
  <div class="bullets">
    ${bullets.map(b => `
    <div class="bullet">
      <div class="bt ${tone}">▸ ${b.title}</div>
      <div class="bd">${b.detail || ''}</div>
    </div>`).join('')}
  </div>` : ''}

  <div class="footer">${card.footer || '市场有风险，投资需谨慎'}</div>
</div>`;
}

function getThemeTone(theme) {
  if (!theme) return 'neutral';
  const t = theme.toLowerCase();
  if (t.includes('确立') || t.includes('修复') || t.includes('异动')) return 'up';
  if (t.includes('预警') || t.includes('风险')) return 'down';
  return 'neutral';
}

function toneColor(tone) {
  switch (tone) {
    case 'up': return '#4ade80';
    case 'down': return '#f87171';
    default: return '#fbbf24';
  }
}

main().catch(err => {
  console.error('❌ 截图失败:', err);
  process.exit(1);
});
