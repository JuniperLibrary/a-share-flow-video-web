import { useState } from 'react';
import { Input } from '@arco-design/web-react';
import { TTSPlayer } from '../components/tts';

const DEMO_TEXTS = [
  {
    title: '股市播报',
    text: '今日A股三大指数集体上涨，上证指数涨1.2%，深证成指涨1.5%，创业板指涨2.1%。北向资金净流入超50亿元，市场情绪回暖。板块方面，新能源、半导体、医药生物表现强势。',
    icon: '📈',
  },
  {
    title: '财经新闻',
    text: '央行今日开展1000亿元逆回购操作，中标利率1.8%，与此前持平。今日有500亿元逆回购到期，实现净投放500亿元。市场资金面保持合理充裕。',
    icon: '📰',
  },
  {
    title: '投资提示',
    text: '投资有风险，入市需谨慎。过往业绩不预示未来表现，基金管理人管理的其他基金的业绩并不构成基金业绩表现的保证。投资者在做出投资决策前应仔细阅读基金合同、招募说明书等法律文件。',
    icon: '⚠️',
  },
  {
    title: '英文示例',
    text: 'Welcome to our financial news channel. Today we bring you the latest updates on the stock market performance and economic indicators.',
    icon: '🌍',
  },
];

export function TTSPage() {
  const [customText, setCustomText] = useState('');
  const [activeText, setActiveText] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
            TTS 配音
          </h1>
          <p className="text-sm text-gray-500">输入文案，选择音色进行配音</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
              <h3 className="text-sm font-semibold text-white/90 mb-3">示例文案</h3>
              <div className="space-y-2">
                {DEMO_TEXTS.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      activeText === item.text
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-black/20 border-white/5 hover:border-white/20'
                    }`}
                    onClick={() => {
                      setActiveText(item.text);
                      setCustomText('');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white/90">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{item.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
              <h3 className="text-sm font-semibold text-white/90 mb-3">自定义文案</h3>
              <Input.TextArea
                value={customText}
                onChange={setCustomText}
                placeholder="输入您要配音的文案..."
                rows={4}
                className="bg-black/30 border-white/10"
              />
              <button
                className="w-full mt-2 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => {
                  if (customText.trim()) {
                    setActiveText(customText);
                  }
                }}
              >
                使用此文案
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <TTSPlayer text={activeText} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TTSPage;
