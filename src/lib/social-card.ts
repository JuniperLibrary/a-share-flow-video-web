import html2canvas from 'html2canvas';

export const SOCIAL_CARD_FORMATS = {
  xhs: {
    key: 'xhs' as const,
    width: 1080,
    height: 1440,
    label: '小红书',
    hint: '3:4 · 1080×1440',
    safeTop: 96,
    safeBottom: 120,
    safeX: 72,
  },
  douyin: {
    key: 'douyin' as const,
    width: 1080,
    height: 1920,
    label: '抖音',
    hint: '9:16 · 1080×1920',
    safeTop: 120,
    safeBottom: 160,
    safeX: 72,
  },
};

export type SocialCardFormat = keyof typeof SOCIAL_CARD_FORMATS;

export const PREVIEW_WIDTH = 360;

export function previewScale(format: SocialCardFormat): number {
  return PREVIEW_WIDTH / SOCIAL_CARD_FORMATS[format].width;
}

export function splitTitleLines(title: string): [string, string?] {
  const parts = title.split(/[，,｜|]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(' · ')];
  }
  if (title.length > 14) {
    return [title.slice(0, 14), title.slice(14)];
  }
  return [title];
}

export async function exportCardPng(
  element: HTMLElement,
  filename: string,
  format: SocialCardFormat,
): Promise<void> {
  const { width, height } = SOCIAL_CARD_FORMATS[format];
  const canvas = await html2canvas(element, {
    backgroundColor: '#070d18',
    width,
    height,
    scale: 1,
    useCORS: true,
    logging: false,
    windowWidth: width,
    windowHeight: height,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportAllCards(
  elements: HTMLElement[],
  date: string,
  format: SocialCardFormat,
): Promise<void> {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (!el) continue;
    await exportCardPng(el, `日报_${date}_${i + 1}_${SOCIAL_CARD_FORMATS[format].label}.png`, format);
    await new Promise((r) => setTimeout(r, 300));
  }
}
