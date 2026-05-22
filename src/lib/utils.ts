import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNet(n: number): string {
  if (isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}亿`;
}

export function formatNetCompact(n: number): string {
  if (isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n > 0 ? '+' : '-';
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(1)}万亿`;
  if (abs >= 100) return `${sign}${abs.toFixed(0)}亿`;
  return `${sign}${abs.toFixed(1)}亿`;
}

export function netColor(n: number): string {
  if (n > 0) return '#f53f3f';
  if (n < 0) return '#00b42a';
  return '#86909c';
}

export function netTextColor(n: number): string {
  if (n > 0) return 'text-inflow';
  if (n < 0) return 'text-outflow';
  return 'text-muted-foreground';
}

export function getSectorColor(name: string, index: number): string {
  const COLOR_MAP: Record<string, string> = {
    '半导体': '#00d4ff',
    'AI': '#00ffaa',
    '人工智能': '#00b4ff',
    'CPO': '#00ff88',
    '有色金属': '#ffc107',
    '锂矿': '#66bb6a',
    '商业航天': '#ff8a80',
    '电池': '#4caf50',
    '机器人': '#00ffcc',
    '创新药': '#ba68c8',
    '白酒': '#ff9800',
    '消费电子': '#4488ff',
    '银行': '#ffb300',
    '云计算': '#ce93d8',
    '低空经济': '#ff6b9d',
    '电网设备': '#42a5f5',
    '通信设备': '#26c6da',
    '传媒': '#ab47bc',
    '国产芯片': '#e07a5f',
    '元件': '#5cdb95',
    '通信服务': '#845ec2',
  };

  for (const key in COLOR_MAP) {
    if (name.includes(key)) return COLOR_MAP[key];
  }

  const palette = [
    '#00d4ff', '#ffc107', '#4488ff', '#5cdb95', '#ff8a80',
    '#66bb6a', '#ba68c8', '#ff9800', '#ce93d8', '#42a5f5',
    '#26c6da', '#ab47bc', '#e07a5f', '#845ec2', '#00ffaa',
    '#ff6b9d', '#ffb300', '#00b4ff', '#00ffcc', '#4caf50',
  ];
  return palette[index % palette.length];
}
